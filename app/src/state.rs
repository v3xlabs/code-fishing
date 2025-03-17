use crate::database::Database;
use std::sync::Arc;
use figment::{Figment, providers::{Env, Format, Serialized}};
use serde::{Deserialize, Serialize};

pub type AppState = Arc<AppStateInner>;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct SteamOAuthConfig {
    pub web_api_key: String,
    pub auth_return_url: String,
    pub auth_realm: String,
}

pub struct AppStateInner {
    pub database: Database,
    pub steam_oauth_config: SteamOAuthConfig,
}

impl AppStateInner {
    pub async fn init() -> Self {
        let database = Database::init().await;
        
        // Load configuration from environment variables
        let config = Figment::new()
            .merge(Env::prefixed("STEAM_"))
            .extract::<SteamOAuthConfig>()
            .expect("Failed to load Steam OAuth configuration");

        Self { 
            database,
            steam_oauth_config: config,
        }
    }
}

impl std::fmt::Debug for AppStateInner {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AppStateInner")
            .field("steam_oauth_config", &self.steam_oauth_config)
            .finish()
    }
}
