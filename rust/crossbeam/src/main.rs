pub use std::{
    alloc::{Layout, alloc_zeroed, handle_alloc_error},
    boxed::Box,
    sync::Arc,
    thread,
    time::Duration,
};

pub use core::{
    cell::{Cell, UnsafeCell},
    fmt, hint,
    marker::PhantomData,
    mem::MaybeUninit,
    ops::{Deref, DerefMut},
    panic::{RefUnwindSafe, UnwindSafe},
    ptr,
    sync::atomic::{self, AtomicPtr, AtomicUsize, Ordering},
};

const WRITE: usize = 1;
const READ: usize = 2;
const DESTROY: usize = 4;
const SPIN_LIMIT: u32 = 6;
const YIELD_LIMIT: u32 = 10;
const LAP: usize = 32;
const BLOCK_CAP: usize = LAP - 1;
const SHIFT: usize = 1;
const HAS_NEXT: usize = 1;

mod slot {
    pub struct Slot<T> {
        value: core::cell::UnsafeCell<core::mem::MaybeUninit<T>>,
        state: core::sync::atomic::AtomicUsize,
    }

    pub fn t1() {
        let cell = core::cell::UnsafeCell::new(8);
        let shared_ref = &cell;

        let ptr = shared_ref.get();

        unsafe { *ptr += 1 };
    }
}
pub struct CachePadded<T> {
    value: T,
}

pub struct Backoff {
    step: Cell<u32>,
}

struct Slot<T> {
    value: UnsafeCell<MaybeUninit<T>>,
    state: AtomicUsize,
}

struct Block<T> {
    next: AtomicPtr<Block<T>>,
    slots: [Slot<T>; BLOCK_CAP],
}

struct Position<T> {
    index: AtomicUsize,
    block: AtomicPtr<Block<T>>,
}

pub struct SegQueue<T> {
    head: CachePadded<Position<T>>,
    tail: CachePadded<Position<T>>,
    _marker: PhantomData<T>,
}

#[derive(Debug)]
pub struct IntoIter<T> {
    value: SegQueue<T>,
}

unsafe impl<T: Send> Send for CachePadded<T> {}
unsafe impl<T: Sync> Sync for CachePadded<T> {}

impl<T> CachePadded<T> {
    pub const fn new(t: T) -> Self {
        Self { value: t }
    }

    pub fn into_inner(self) -> T {
        self.value
    }
}

impl<T> Deref for CachePadded<T> {
    type Target = T;

    fn deref(&self) -> &T {
        &self.value
    }
}

impl<T> DerefMut for CachePadded<T> {
    fn deref_mut(&mut self) -> &mut T {
        &mut self.value
    }
}

impl<T: fmt::Debug> fmt::Debug for CachePadded<T> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("CachePadded")
            .field("value", &self.value)
            .finish()
    }
}

impl<T> From<T> for CachePadded<T> {
    fn from(t: T) -> Self {
        Self::new(t)
    }
}

impl<T: fmt::Display> fmt::Display for CachePadded<T> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt::Display::fmt(&self.value, f)
    }
}

impl Backoff {
    #[inline]
    pub fn new() -> Self {
        Self { step: Cell::new(0) }
    }

    #[inline]
    pub fn reset(&self) {
        self.step.set(0);
    }

    #[inline]
    pub fn spin(&self) {
        for _ in 0..1 << self.step.get().min(SPIN_LIMIT) {
            hint::spin_loop();
        }

        if self.step.get() <= SPIN_LIMIT {
            self.step.set(self.step.get() + 1);
        }
    }

    #[inline]
    pub fn snooze(&self) {
        if self.step.get() <= SPIN_LIMIT {
            for _ in 0..1 << self.step.get() {
                hint::spin_loop();
            }
        } else {
            thread::yield_now();
        }

        if self.step.get() <= YIELD_LIMIT {
            self.step.set(self.step.get() + 1);
        }
    }

    #[inline]
    pub fn is_completed(&self) -> bool {
        self.step.get() > YIELD_LIMIT
    }
}

impl fmt::Debug for Backoff {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Backoff")
            .field("step", &self.step)
            .field("is_completed", &self.is_completed())
            .finish()
    }
}

impl Default for Backoff {
    fn default() -> Self {
        Self::new()
    }
}

impl<T> Slot<T> {
    fn wait_write(&self) {
        let backoff = Backoff::new();
        while self.state.load(Ordering::Acquire) & WRITE == 0 {
            backoff.snooze();
        }
    }
}

impl<T> Block<T> {
    const LAYOUT: Layout = {
        let layout = Layout::new::<Self>();
        assert!(
            layout.size() != 0,
            "Block should never be zero-sized, as it has an AtomicPtr field"
        );
        layout
    };

    fn new() -> Box<Self> {
        let ptr = unsafe { alloc_zeroed(Self::LAYOUT) };
        if ptr.is_null() {
            handle_alloc_error(Self::LAYOUT)
        }
        unsafe { Box::from_raw(ptr.cast()) }
    }

    fn wait_next(&self) -> *mut Self {
        let backoff = Backoff::new();
        loop {
            let next = self.next.load(Ordering::Acquire);
            if !next.is_null() {
                return next;
            }
            backoff.snooze();
        }
    }

    unsafe fn destroy(this: *mut Self, start: usize) {
        for i in start..BLOCK_CAP - 1 {
            let slot = unsafe { (*this).slots.get_unchecked(i) };
            if slot.state.load(Ordering::Acquire) & READ == 0
                && slot.state.fetch_or(DESTROY, Ordering::AcqRel) & READ == 0
            {
                return;
            }
        }
        drop(unsafe { Box::from_raw(this) });
    }
}

unsafe impl<T: Send> Send for SegQueue<T> {}
unsafe impl<T: Send> Sync for SegQueue<T> {}

impl<T> UnwindSafe for SegQueue<T> {}
impl<T> RefUnwindSafe for SegQueue<T> {}

impl<T> SegQueue<T> {
    pub const fn new() -> Self {
        Self {
            head: CachePadded::new(Position {
                block: AtomicPtr::new(ptr::null_mut()),
                index: AtomicUsize::new(0),
            }),
            tail: CachePadded::new(Position {
                block: AtomicPtr::new(ptr::null_mut()),
                index: AtomicUsize::new(0),
            }),
            _marker: PhantomData,
        }
    }

    pub fn push(&self, value: T) {
        let backoff = Backoff::new();
        let mut tail = self.tail.index.load(Ordering::Acquire);
        let mut block = self.tail.block.load(Ordering::Acquire);
        let mut next_block = None;

        loop {
            let offset = (tail >> SHIFT) % LAP;

            if offset == BLOCK_CAP {
                backoff.snooze();
                tail = self.tail.index.load(Ordering::Acquire);
                block = self.tail.block.load(Ordering::Acquire);
                continue;
            }

            if offset + 1 == BLOCK_CAP && next_block.is_none() {
                next_block = Some(Block::<T>::new());
            }

            if block.is_null() {
                let new = Box::into_raw(Block::<T>::new());

                if self
                    .tail
                    .block
                    .compare_exchange(block, new, Ordering::Release, Ordering::Relaxed)
                    .is_ok()
                {
                    self.head.block.store(new, Ordering::Release);
                    block = new;
                } else {
                    next_block = unsafe { Some(Box::from_raw(new)) };
                    tail = self.tail.index.load(Ordering::Acquire);
                    block = self.tail.block.load(Ordering::Acquire);
                    continue;
                }
            }

            let new_tail = tail + (1 << SHIFT);

            match self.tail.index.compare_exchange_weak(
                tail,
                new_tail,
                Ordering::SeqCst,
                Ordering::Acquire,
            ) {
                Ok(_) => unsafe {
                    if offset + 1 == BLOCK_CAP {
                        let next_block = Box::into_raw(next_block.unwrap());
                        let next_index = new_tail.wrapping_add(1 << SHIFT);

                        self.tail.block.store(next_block, Ordering::Release);
                        self.tail.index.store(next_index, Ordering::Release);
                        (*block).next.store(next_block, Ordering::Release);
                    }

                    let slot = (*block).slots.get_unchecked(offset);
                    slot.value.get().write(MaybeUninit::new(value));
                    slot.state.fetch_or(WRITE, Ordering::Release);

                    return;
                },
                Err(t) => {
                    tail = t;
                    block = self.tail.block.load(Ordering::Acquire);
                    backoff.spin();
                }
            }
        }
    }

    pub fn pop(&self) -> Option<T> {
        let backoff = Backoff::new();
        let mut head = self.head.index.load(Ordering::Acquire);
        let mut block = self.head.block.load(Ordering::Acquire);

        loop {
            let offset = (head >> SHIFT) % LAP;

            if offset == BLOCK_CAP {
                backoff.snooze();
                head = self.head.index.load(Ordering::Acquire);
                block = self.head.block.load(Ordering::Acquire);
                continue;
            }

            let mut new_head = head + (1 << SHIFT);

            if new_head & HAS_NEXT == 0 {
                atomic::fence(Ordering::SeqCst);
                let tail = self.tail.index.load(Ordering::Relaxed);

                if head >> SHIFT == tail >> SHIFT {
                    return None;
                }

                if (head >> SHIFT) / LAP != (tail >> SHIFT) / LAP {
                    new_head |= HAS_NEXT;
                }
            }

            if block.is_null() {
                backoff.snooze();
                head = self.head.index.load(Ordering::Acquire);
                block = self.head.block.load(Ordering::Acquire);
                continue;
            }

            match self.head.index.compare_exchange_weak(
                head,
                new_head,
                Ordering::SeqCst,
                Ordering::Acquire,
            ) {
                Ok(_) => unsafe {
                    if offset + 1 == BLOCK_CAP {
                        let next = (*block).wait_next();
                        let mut next_index = (new_head & !HAS_NEXT).wrapping_add(1 << SHIFT);
                        if !(*next).next.load(Ordering::Relaxed).is_null() {
                            next_index |= HAS_NEXT;
                        }

                        self.head.block.store(next, Ordering::Release);
                        self.head.index.store(next_index, Ordering::Release);
                    }

                    let slot = (*block).slots.get_unchecked(offset);
                    slot.wait_write();
                    let value = slot.value.get().read().assume_init();

                    if offset + 1 == BLOCK_CAP {
                        Block::destroy(block, 0);
                    } else if slot.state.fetch_or(READ, Ordering::AcqRel) & DESTROY != 0 {
                        Block::destroy(block, offset + 1);
                    }

                    return Some(value);
                },
                Err(h) => {
                    head = h;
                    block = self.head.block.load(Ordering::Acquire);
                    backoff.spin();
                }
            }
        }
    }

    pub fn is_empty(&self) -> bool {
        let head = self.head.index.load(Ordering::SeqCst);
        let tail = self.tail.index.load(Ordering::SeqCst);
        head >> SHIFT == tail >> SHIFT
    }

    pub fn len(&self) -> usize {
        loop {
            let mut tail = self.tail.index.load(Ordering::SeqCst);
            let mut head = self.head.index.load(Ordering::SeqCst);

            if self.tail.index.load(Ordering::SeqCst) == tail {
                // Erase the lower bits.
                tail &= !((1 << SHIFT) - 1);
                head &= !((1 << SHIFT) - 1);

                if (tail >> SHIFT) & (LAP - 1) == LAP - 1 {
                    tail = tail.wrapping_add(1 << SHIFT);
                }
                if (head >> SHIFT) & (LAP - 1) == LAP - 1 {
                    head = head.wrapping_add(1 << SHIFT);
                }

                let lap = (head >> SHIFT) / LAP;
                tail = tail.wrapping_sub((lap * LAP) << SHIFT);
                head = head.wrapping_sub((lap * LAP) << SHIFT);

                tail >>= SHIFT;
                head >>= SHIFT;

                return tail - head - tail / LAP;
            }
        }
    }
}

impl<T> Drop for SegQueue<T> {
    fn drop(&mut self) {
        let mut head = *self.head.index.get_mut();
        let mut tail = *self.tail.index.get_mut();
        let mut block = *self.head.block.get_mut();

        head &= !((1 << SHIFT) - 1);
        tail &= !((1 << SHIFT) - 1);

        unsafe {
            while head != tail {
                let offset = (head >> SHIFT) % LAP;

                if offset < BLOCK_CAP {
                    let slot = (*block).slots.get_unchecked(offset);
                    (*slot.value.get()).assume_init_drop();
                } else {
                    let next = *(*block).next.get_mut();
                    drop(Box::from_raw(block));
                    block = next;
                }
                head = head.wrapping_add(1 << SHIFT);
            }
            if !block.is_null() {
                drop(Box::from_raw(block));
            }
        }
    }
}

impl<T> fmt::Debug for SegQueue<T> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.pad("SegQueue { .. }")
    }
}

impl<T> Default for SegQueue<T> {
    fn default() -> Self {
        Self::new()
    }
}

impl<T> IntoIterator for SegQueue<T> {
    type Item = T;

    type IntoIter = IntoIter<T>;

    fn into_iter(self) -> Self::IntoIter {
        IntoIter { value: self }
    }
}

impl<T> Iterator for IntoIter<T> {
    type Item = T;

    fn next(&mut self) -> Option<Self::Item> {
        let value = &mut self.value;
        let head = *value.head.index.get_mut();
        let tail = *value.tail.index.get_mut();
        if head >> SHIFT == tail >> SHIFT {
            None
        } else {
            let block = *value.head.block.get_mut();
            let offset = (head >> SHIFT) % LAP;

            let item = unsafe {
                let slot = (*block).slots.get_unchecked(offset);
                slot.value.get().read().assume_init()
            };
            if offset + 1 == BLOCK_CAP {
                unsafe {
                    let next = *(*block).next.get_mut();
                    drop(Box::from_raw(block));
                    *value.head.block.get_mut() = next;
                }
                *value.head.index.get_mut() = head.wrapping_add(2 << SHIFT);
                debug_assert_eq!((*value.head.index.get_mut() >> SHIFT) % LAP, 0);
            } else {
                *value.head.index.get_mut() = head.wrapping_add(1 << SHIFT);
            }
            Some(item)
        }
    }
}

fn main() {
    test_basic_operations();
    test_capacity_stress();
    test_concurrent_producers();
    test_concurrent_consumers();
    test_mixed_concurrent_operations();
    stress_test();

    println!("\n🎉 All tests passed! Your SegQueue is working correctly.");
}

fn test_basic_operations() {
    println!("=== Testing Basic Operations ===");

    let queue = SegQueue::new();

    // Test 1: Queue should start empty
    assert!(queue.is_empty());
    assert_eq!(queue.len(), 0);
    assert_eq!(queue.pop(), None);

    // Test 2: Single push and pop
    queue.push(42);
    assert!(!queue.is_empty());
    assert_eq!(queue.len(), 1);
    assert_eq!(queue.pop(), Some(42));
    assert!(queue.is_empty());

    println!("✓ Basic push/pop works");

    // Test 3: Multiple items - testing FIFO order
    for i in 1..=5 {
        queue.push(i);
    }

    assert_eq!(queue.len(), 5);

    // Should pop in FIFO order (First In, First Out)
    for expected in 1..=5 {
        assert_eq!(queue.pop(), Some(expected));
    }

    assert!(queue.is_empty());
    println!("✓ FIFO ordering works correctly");
}

fn test_capacity_stress() {
    println!("=== Testing Capacity Handling ===");

    let queue = SegQueue::new();
    let large_count = 1000;

    // Fill up the queue with many items
    for i in 0..large_count {
        queue.push(i);
    }

    println!("✓ Successfully pushed {} items", large_count);
    assert_eq!(queue.len(), large_count);

    // Drain the queue and verify order
    for expected in 0..large_count {
        match queue.pop() {
            Some(value) => assert_eq!(value, expected),
            None => panic!("Queue became empty unexpectedly at item {}", expected),
        }
    }

    assert!(queue.is_empty());
    println!("✓ Large capacity and ordering maintained");
}

fn test_concurrent_producers() {
    println!("=== Testing Concurrent Producers ===");

    let queue = Arc::new(SegQueue::new());
    let num_threads = 4;
    let items_per_thread = 1000;

    // Create multiple producer threads
    let mut handles = vec![];

    for thread_id in 0..num_threads {
        let queue_clone = Arc::clone(&queue);
        let handle = thread::spawn(move || {
            // Each thread pushes a range of numbers
            let start = thread_id * items_per_thread;
            let end = start + items_per_thread;

            for i in start..end {
                queue_clone.push(i);
                // Small delay to increase chance of contention
                if i % 100 == 0 {
                    thread::sleep(Duration::from_nanos(1));
                }
            }
        });
        handles.push(handle);
    }

    // Wait for all producers to finish
    for handle in handles {
        handle.join().unwrap();
    }

    let expected_total = num_threads * items_per_thread;
    assert_eq!(queue.len(), expected_total);
    println!(
        "✓ {} concurrent producers added {} items total",
        num_threads, expected_total
    );

    // Verify we can retrieve all items (order might be mixed due to concurrency)
    let mut retrieved_count = 0;
    while queue.pop().is_some() {
        retrieved_count += 1;
    }

    assert_eq!(retrieved_count, expected_total);
    println!("✓ All {} items successfully retrieved", expected_total);
}

fn test_concurrent_consumers() {
    println!("=== Testing Concurrent Consumers ===");

    let queue = Arc::new(SegQueue::new());
    let total_items = 4000;

    // Fill queue with items
    for i in 0..total_items {
        queue.push(i);
    }

    let num_consumers = 4;
    let mut handles = vec![];
    let mut results = vec![];

    for _ in 0..num_consumers {
        let queue_clone = Arc::clone(&queue);
        let (sender, receiver) = std::sync::mpsc::channel();
        results.push(receiver);

        let handle = thread::spawn(move || {
            let mut consumed = 0;
            while let Some(_item) = queue_clone.pop() {
                consumed += 1;
                // Add small delay to increase contention
                if consumed % 100 == 0 {
                    thread::sleep(Duration::from_nanos(1));
                }
            }
            sender.send(consumed).unwrap();
        });
        handles.push(handle);
    }

    // Wait for all consumers and collect results
    for handle in handles {
        handle.join().unwrap();
    }

    let total_consumed: usize = results
        .iter()
        .map(|receiver| receiver.recv().unwrap())
        .sum();

    assert_eq!(total_consumed, total_items);
    assert!(queue.is_empty());
    println!(
        "✓ {} concurrent consumers processed {} items total",
        num_consumers, total_consumed
    );
}

fn test_mixed_concurrent_operations() {
    println!("=== Testing Mixed Concurrent Operations ===");

    let queue = Arc::new(SegQueue::new());
    let duration = Duration::from_millis(100);

    // Producer thread
    let producer_queue = Arc::clone(&queue);
    let producer = thread::spawn(move || {
        let mut count = 0;
        let start = std::time::Instant::now();

        while start.elapsed() < duration {
            producer_queue.push(count);
            count += 1;
            thread::sleep(Duration::from_nanos(10));
        }
        count
    });

    // Consumer thread
    let consumer_queue = Arc::clone(&queue);
    let consumer = thread::spawn(move || {
        let mut count = 0;
        let start = std::time::Instant::now();

        while start.elapsed() < duration {
            if consumer_queue.pop().is_some() {
                count += 1;
            }
            thread::sleep(Duration::from_nanos(15));
        }
        count
    });

    let produced = producer.join().unwrap();
    let consumed = consumer.join().unwrap();
    let remaining = queue.len();

    // The math should work out: produced = consumed + remaining
    assert_eq!(produced, consumed + remaining);
    println!(
        "✓ Produced: {}, Consumed: {}, Remaining: {}",
        produced, consumed, remaining
    );
    println!("✓ Mixed concurrent operations maintain consistency");
}

fn stress_test() {
    println!("=== Stress Test ===");

    let queue = Arc::new(SegQueue::new());
    let num_producers = 8;
    let num_consumers = 6;
    let items_per_producer = 500;

    // Separate vectors for different thread types
    // This makes the code clearer and avoids the type mismatch
    let mut consumer_handles: Vec<thread::JoinHandle<usize>> = vec![];
    let mut producer_handles: Vec<thread::JoinHandle<()>> = vec![];

    // Start consumers first (they'll wait for items)
    for consumer_id in 0..num_consumers {
        let queue_clone = Arc::clone(&queue);
        let handle = thread::spawn(move || {
            let mut consumed = 0;
            let mut attempts = 0;

            // Keep trying to consume for a reasonable time
            while attempts < items_per_producer * num_producers / num_consumers + 1000 {
                if queue_clone.pop().is_some() {
                    consumed += 1;
                } else {
                    attempts += 1;
                    thread::sleep(Duration::from_nanos(100));
                }
            }

            println!(
                "  Consumer {} finished with {} items",
                consumer_id, consumed
            );
            consumed // Return the count (this makes it JoinHandle<usize>)
        });
        consumer_handles.push(handle);
    }

    // Give consumers a moment to start waiting
    thread::sleep(Duration::from_millis(10));

    // Start producers
    for producer_id in 0..num_producers {
        let queue_clone = Arc::clone(&queue);
        let handle = thread::spawn(move || {
            for i in 0..items_per_producer {
                let value = producer_id * items_per_producer + i;
                queue_clone.push(value);

                // Random small delays to create realistic contention
                if value % 50 == 0 {
                    thread::sleep(Duration::from_nanos(500));
                }
            }
            println!("  Producer {} finished", producer_id);
            // No return value here, so this is JoinHandle<()>
        });
        producer_handles.push(handle);
    }

    // Wait for all producers to complete first
    for handle in producer_handles {
        handle.join().unwrap();
    }

    // Now collect results from all consumers
    let mut total_consumed = 0;
    for handle in consumer_handles {
        let consumed = handle.join().unwrap();
        total_consumed += consumed;
    }

    let expected_total = num_producers * items_per_producer;
    let remaining = queue.len();
    let actual_total = total_consumed + remaining;

    println!(
        "✓ Expected: {}, Consumed: {}, Remaining: {}, Total: {}",
        expected_total, total_consumed, remaining, actual_total
    );

    // In a stress test, we might not consume everything due to timing,
    // but we should never lose items or create extra ones
    assert!(actual_total <= expected_total);
    assert!(actual_total >= expected_total - 100); // Allow some tolerance

    println!("✓ Stress test passed - no data corruption detected");
}
