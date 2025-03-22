use crate::database::Database;
use figment::{providers::Env, Figment};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

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

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct BattleMetricsConfig {
    pub api_key: Option<String>,
}

pub struct AppStateInner {
    pub database: Database,
    pub steam_oauth_config: SteamOAuthConfig,
    pub battlemetrics_config: BattleMetricsConfig,
    pub jwt: JwtConfig,
}

impl AppStateInner {
    pub async fn init() -> Self {
        // Load configuration from environment variables
        let steam_oauth_config = Figment::new()
            .merge(Env::prefixed("STEAM_"))
            .extract::<SteamOAuthConfig>()
            .expect("Failed to load Steam OAuth configuration");

        let battlemetrics_config = Figment::new()
            .merge(Env::prefixed("BATTLEMETRICS_"))
            .extract::<BattleMetricsConfig>()
            .expect("Failed to load BattleMetrics configuration");

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
            steam_oauth_config,
            battlemetrics_config,
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
