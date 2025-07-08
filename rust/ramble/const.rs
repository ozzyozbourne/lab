#[inline(never)] // Prevent inlining to see the real behavior
fn get_const_refs() -> ([&'static i32; 2], [&'static i32; 2]) {
    const VALUE: i32 = 42;
    static STATIC_VALUE: i32 = 42; //we can define static values anywhere !

    // Force the creation of temporaries in different stack frames
    let (c1, s1) = (Box::leak(Box::new(VALUE)), &STATIC_VALUE);
    let (c2, s2) = (Box::leak(Box::new(VALUE)), &STATIC_VALUE);

    ([c1, c2], [s1, s2])
}

fn main() {
    let (const_refs, static_refs) = get_const_refs();

    println!("Const ref 1: {:p}", const_refs[0]);
    println!("Const ref 2: {:p}", const_refs[1]);
    println!(
        "Are they equal? {}",
        std::ptr::eq(const_refs[0], const_refs[1])
    );

    println!("\nStatic ref 1: {:p}", static_refs[0]);
    println!("Static ref 2: {:p}", static_refs[1]);
    println!(
        "Are they equal? {}",
        std::ptr::eq(static_refs[0], static_refs[1])
    );
}
