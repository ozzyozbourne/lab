struct QueueShard<T> {
    queue: SegQueue<T>,
    elem_cnt: AtomicUsize,
    trim: usize,
    max: usize,
}
