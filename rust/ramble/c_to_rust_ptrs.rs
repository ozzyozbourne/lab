fn main() {
    demonstrate_all_cases();
}

fn demonstrate_all_cases() {
    // Case 1: Taking an immutable reference to immutable data
    let x = 5;
    let r1 = &x; // r1: &i32

    // Case 2: Taking an immutable reference to mutable data
    let mut y = 10;
    let r2 = &y; // r2: &i32 - can read but not modify

    // Case 3: Taking a mutable reference to mutable data
    let mut z = 15;
    let r3 = &mut z; // r3: &mut i32 - can modify
    *r3 = 20; // This works!

    // Case 4: Rebindable reference (mutable binding)
    let mut w = 25;
    let mut r4 = &w; // r4 can be rebound to point elsewhere
    let another = 30;
    r4 = &another; // This works because r4 binding is mutable
}
