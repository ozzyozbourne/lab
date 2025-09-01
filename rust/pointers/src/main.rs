fn main() {
    let boxed = Box::new(100);
    let ref_to_data: &i32 = &*boxed;
    let ref_to_box: &Box<i32> = &boxed;

    // Different types!
    println!(
        "ref_to_data type: {}",
        std::any::type_name_of_val(&ref_to_data)
    );
    println!(
        "ref_to_box type: {}",
        std::any::type_name_of_val(&ref_to_box)
    );

    // To actually use ref_to_box as a reference to heap data, you need to deref:
    let data_through_box: &i32 = &**ref_to_box; // Double deref needed!
    println!("{:p}", data_through_box); // Now this would match ref_to_data's address
    println!("{:p}", ref_to_data); //
}

fn test1() {
    let a = Box::new(String::from("dasdasd")); //the string is here on the heap 
    let _s = *a; // here is string is moved to the stack and the box is consumed 
    //println!("{a}"); // borrow of move error, since the box smart pointer is now consumed ie its
    // moved so a any referecne to it now will be UB right ?
}

fn test2() {
    let a = std::pin::Pin::new(Box::new(String::from("dasdasd"))); //the string is on the heap ie boxed and pinned 
    let _s = *a; // here is string is moved to the stack and the box is consumed 
}

fn test3() {
    let a = Box::new("sdfsdfsdf".to_string());
    let c = &*a;
    let _s = *a; //cant move out of the box smart pointer since we have a reference to the string
    //in the heap so here we are trying to move out of the box ie copying the string
    //from the heap to the stack and deleting it on the heap this inturns consume the
    //box pointer causing the "borrow after move error!"
    println!("{c}");
}
