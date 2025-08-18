#![feature(prelude_import)]
#[prelude_import]
use std::prelude::rust_2024::*;
#[macro_use]
extern crate std;
use std::{thread::sleep, time::Duration};
fn main() {
    let body = async {
        let s = tokio::task::spawn_blocking(|| {
            sleep(Duration::from_secs(5));
        });
        tokio::task::yield_now().await;
        light_work().await;
        _ = s.await;
    };
    #[allow(
        clippy::expect_used,
        clippy::diverging_sub_expression,
        clippy::needless_return
    )]
    {
        return tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .build()
            .expect("Failed building the Runtime")
            .block_on(body);
    }
}
async fn light_work() {
    light_work1().await;
}
async fn light_work1() {
    light_work2().await;
}
async fn light_work2() {
    light_work3().await;
}
async fn light_work3() {}
