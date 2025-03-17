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

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct DatabaseConfig {
    pub url: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct JwtConfig {
    pub secret: String,
}

pub struct AppStateInner {
    pub database: Database,
    pub steam_oauth_config: SteamOAuthConfig,
    pub jwt: JwtConfig,
}

impl AppStateInner {
    pub async fn init() -> Self {        
        // Load configuration from environment variables
        let config = Figment::new()
            .merge(Env::prefixed("STEAM_"))
            .extract::<SteamOAuthConfig>()
            .expect("Failed to load Steam OAuth configuration");

        let database_config = Figment::new()
            .merge(Env::prefixed("DATABASE_"))
            .extract::<DatabaseConfig>()
            .expect("Failed to load database configuration");

        let database = Database::init(&database_config).await;

        let jwt = Figment::new()
            .merge(Env::prefixed("JWT_"))
            .extract::<JwtConfig>()
            .expect("Failed to load JWT secret");

        Self { 
            database,
            steam_oauth_config: config,
            jwt,
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
