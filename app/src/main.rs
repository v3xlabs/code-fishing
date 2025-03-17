use state::{AppState, AppStateInner};
use std::sync::Arc;

pub mod database;
pub mod state;
pub mod util;
pub mod models;
pub mod server;

#[async_std::main]
async fn main() {
    dotenvy::dotenv().ok();

    println!("No OTLP config");

    tracing_subscriber::fmt::init();

    let state: AppState = Arc::new(AppStateInner::init().await);

    // let http = async { server::start_http(state.clone()).await };

    // telegram.race(http).await;
    server::start_http(state).await;
}
