use std::thread;

fn main() {
    let h1 = thread::spawn(f);
    let h2 = thread::spawn(f);
    let (id, id1, id2) = (thread::current().id(), h1.thread().id(), h2.thread().id());

    println!("Hello from the main thread! My id {id:?}");

    match h1.join() {
        Ok(()) => println!("Thread with id {id1:?} is completed "),
        Err(p) => println!("Thread with id {id1:?} panic with error -> {p:?}"),
    }

    match h2.join() {
        Ok(()) => println!("Thread with id {id2:?} is completed "),
        Err(p) => println!("Thread with id {id2:?} panic with error -> {p:?}"),
    }

    let numbers = vec![1, 2, 3];
    let h3 = thread::spawn(move || {
        let (l, mut sum) = (numbers.len(), 0);
        for n in numbers {
            sum += n;
        }
        sum / l
    });

    match h3.join() {
        Ok(v) => println!("Success the average is -> {v}"),
        Err(p) => println!("Error is -> {p:?}"),
    }
}

fn f() {
    println!(
        "Hello from another thread! My is {:?}",
        thread::current().id()
    );
}
