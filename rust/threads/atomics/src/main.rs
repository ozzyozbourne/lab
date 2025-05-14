mod lifetime;
use crate::lifetime::{thread, type_of};

fn main() {
    let numbers3 = vec![1, 2, 3];
    thread::scope(|s| {
        s.spawn(|| {
            println!("length: {}", numbers3.len());
            println!("Type inside closure: {}", type_of(&numbers3));
        });

        s.spawn(|| {
            for n in numbers3.iter() {
                println!("{n}");
            }
        });
    });

    println!("testing -> {}", numbers3.len());
}
