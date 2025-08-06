use std::ops::AddAssign;

#[derive(Debug)]
struct Counter {
    values: Vec<i32>, // Vec lives on the heap
}

impl AddAssign<i32> for Counter {
    fn add_assign(&mut self, rhs: i32) {
        // DON'T do this - it would try to move:
        // *self = Counter { values: self.values.clone() };

        // DO this - modify in place:
        self.values.push(rhs);
    }
}

fn main() {
    let mut counter = Counter {
        values: vec![1, 2, 3],
    };
    counter += 4;
    println!("{:?}", counter); // Counter { values: [1, 2, 3, 4] }
}
