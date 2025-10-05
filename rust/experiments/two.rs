fn main() {
    let boxed = Box::new(43);
    let ptr = Box::into_raw(boxed);

    unsafe {
        _ = Box::from_raw(ptr);
    }
}
