#[derive(Debug)]
struct QueueShard<T> {
    /// The inner stack of pooled values.
    queue: SegQueue<T>,
    /// The number of elements currently stored in this shard.
    elem_cnt: AtomicUsize,
    /// The value to use when calling [`Reuse::reuse`]. Typically the capacity
    /// to keep in a reused buffer.
    trim: usize,
    /// The max number of values to keep in the shard.
    max: usize,
}

#[derive(Debug)]
pub struct Pool<const S: usize, T: 'static> {
    /// List of distinct shards to reduce contention.
    queues: [QueueShard<T>; S],
    /// The index of the next shard to use, in round-robin order.
    next_shard: AtomicUsize,
}

#[derive(Debug)]
pub struct Pooled<T: Default + Reuse + 'static> {
    inner: T,
    pool: &'static QueueShard<T>,
}

/// A trait that prepares an item to be returned to the pool. For example
/// clearing it. `true` is returned if the item should be returned to the pool,
/// `false` if it should be dropped.
pub trait Reuse {
    fn reuse(&mut self, trim: usize) -> bool;
}
