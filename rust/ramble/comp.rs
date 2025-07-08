const fn expensive_calculation(n: u64) -> u64 {
    let (mut result, mut i) = (0, 0);
    while i < n {
        result += i;
        i += 1;
    }
    result
}
const BIG_COMPILE_TIME: u64 = expensive_calculation(100000);

fn main() {
    println!("Starting measurements...\n");

    let start = std::time::Instant::now();
    _ = expensive_calculation(100000);
    let runtime_duration = start.elapsed();

    let start = std::time::Instant::now();
    _ = BIG_COMPILE_TIME; // Just copying a value!
    let const_duration = start.elapsed();

    let start = std::time::Instant::now();
    for _ in 0..1000 {
        _ = expensive_calculation(1000); // Smaller number, but 1000 times
    }
    let many_runtime_duration = start.elapsed();

    let start = std::time::Instant::now();
    for _ in 0..1000 {
        let _throw_away = BIG_COMPILE_TIME; // Accessing const 1000 times
    }
    let many_const_duration = start.elapsed();

    println!("Results:");
    println!("  Runtime calculation: {:?}", runtime_duration);
    println!("  Const access: {:?}", const_duration);
    println!("\n1000 iterations:");
    println!("  Runtime calculations: {:?}", many_runtime_duration);
    println!("  Const accesses: {:?}", many_const_duration);
}
