use std::hint::black_box;

async fn async_function1() -> i32 {
    println!("Running async_function1");
    black_box(10) // Prevent optimization
}

async fn async_function2() -> i32 {
    println!("Running async_function2");
    black_box(20) // Prevent optimization
}

#[inline(never)] // Prevent inlining
pub async fn example() -> i32 {
    let a = async_function1().await;
    let b = async_function2().await;
    a + b
}

fn main() {
    let result = futures::executor::block_on(example());
    println!("Result: {}", black_box(result));
}
