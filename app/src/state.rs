use crate::database::Database;
use std::sync::Arc;

pub type AppState = Arc<AppStateInner>;

pub struct AppStateInner {
    pub database: Database,
}

impl AppStateInner {
    pub async fn init() -> Self {
        let database = Database::init().await;
        Self { database }
    }
}

impl std::fmt::Debug for AppStateInner {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "AppStateInner")
    }
}
