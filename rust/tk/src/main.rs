use std::{thread::sleep, time::Duration};
use tracing::{info, instrument};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_thread_ids(true)
        .with_thread_names(true)
        .init();

    info!(location = "Main Entry");
    let s = tokio::task::spawn_blocking(|| {
        info!(location = "BLOCKING");
        sleep(Duration::from_secs(5));
        info!(location = "UNBLOCKING");
    });
    tokio::task::yield_now().await;
    light_work().await;
    _ = s.await;
    info!(location = "Main Exit");
}

#[instrument]
async fn light_work() {
    info!(location = "LIGHT - Main");
    light_work1().await;
}

#[instrument]
async fn light_work1() {
    info!(location = "LIGHT - 1");
    light_work2().await;
}

#[instrument]
async fn light_work2() {
    info!(location = "LIGHT - 2");
    light_work3().await;
}

#[instrument]
async fn light_work3() {
    info!(location = "LIGHT - 3");
}

// #[instrument]
// async fn heavy_work() {
//     info!(location = "HV Entry");
//     _ = tokio::task::spawn_blocking(|| {
//         info!(location = "BLOCKING");
//         sleep(Duration::from_secs(5));
//     })
//     .await;
//
//     info!(location = "HV Exit");
// }
