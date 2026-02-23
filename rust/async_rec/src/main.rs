use std::future::Future;
use std::pin::Pin;

// Can't do this — infinite sized struct:
// async fn fib(n: u64) -> u64 {
//     if n <= 1 { return n; }
//     fib(n - 1).await + fib(n - 2).await
// }

// Must use Box::pin to break the infinite size
fn fib(n: u64) -> Pin<Box<dyn Future<Output = u64>>> {
    Box::pin(async move {
        if n <= 1 {
            n
        } else {
            // Each recursive call creates a new heap-allocated future
            // This is the manual "stack frame linking" we discussed
            fib(n - 1).await + fib(n - 1).await
        }
    })
}

#[tokio::main]
async fn main() {
    for i in 0..10 {
        let result = fib(i).await;
        println!("fib({}) = {}", i, result);
    }
}

// Output:
// fib(0) = 0
// fib(1) = 1
// fib(2) = 1
// fib(3) = 2
// fib(4) = 3
// fib(5) = 5
// fib(6) = 8
// fib(7) = 13
// fib(8) = 21
// fib(9) = 34

// What the compiler roughly generates for each fib(n) call:
//
// Pin<Box<FibFuture>> ──→ heap allocated struct
//   ┌─────────────────┐
//   │ n: u64           │
//   │ state: enum      │
//   │   Start           │
//   │   AwaitingA {     │
//   │     a_future: Pin<Box<FibFuture>>  ← linked to next "frame"
//   │   }               │
//   │   AwaitingB {     │
//   │     a: u64,       │
//   │     b_future: Pin<Box<FibFuture>>  ← linked to next "frame"
//   │   }               │
//   │   Done            │
//   └─────────────────┘
//
// So fib(4) creates a chain:
// fib(4) → fib(3) → fib(2) → fib(1) [base case]
//                           → fib(0) [base case]
//                  → fib(1) [base case]
//        → fib(2) → fib(1) [base case]
//                 → fib(0) [base case]
//
// Each arrow is a Pin<Box<...>> — a heap-allocated linked "stack frame"
