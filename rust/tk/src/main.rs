use std::thread::current;

#[tokio::main]
async fn main() {
    heavy_work().await;
}

async fn heavy_work() {
    println!("Entry -> {:?}", current().id());
}
