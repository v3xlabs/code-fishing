use crate::{
    models::bm::{
        player::get_quick_match_players,
        recent::{get_recent_server_by_player_id, BattleMetricsRecentServers},
    },
    state::AppState,
};
use chrono::DateTime;
use poem::{
    http::Error,
    web::{Data, Query},
    EndpointExt, Result,
};
use poem_openapi::{payload::Json, Object, OpenApi};
use reqwest::{Client, ClientBuilder};
use serde::{Deserialize, Serialize};
use tracing::{info, warn};

use super::auth::mw::AuthUser;

pub struct BattleMetricsApi;

#[OpenApi]
impl BattleMetricsApi {
    #[oai(path = "/bm/recent", method = "get")]
    async fn get_recent_servers(
        &self,
        state: Data<&AppState>,
        auth: AuthUser,
    ) -> Result<Json<BattleMetricsRecentServers>> {
        let user_id = auth.user_id().ok_or(poem::Error::from_string(
            "User not found".to_string(),
            poem::http::StatusCode::UNAUTHORIZED,
        ))?;

        let user_steam_id = if user_id.starts_with("steam:") {
            user_id
        } else {
            return Err(poem::Error::from_string(
                "User not a steam user".to_string(),
                poem::http::StatusCode::BAD_REQUEST,
            ));
        };

        let user_name = match auth {
            AuthUser::User(user, _) => user.name,
            AuthUser::None(_) => {
                return Err(poem::Error::from_string(
                    "User not found".to_string(),
                    poem::http::StatusCode::UNAUTHORIZED,
                ))
            }
        };
        
        info!("user_name: {:?}, user_steam_id: {:?}", user_name, user_steam_id);

        let bm_api_key = match &state.battlemetrics_config.api_key {
            Some(key) => key,
            None => {
                return Err(poem::Error::from_string(
                    "No API key found".to_string(),
                    poem::http::StatusCode::INTERNAL_SERVER_ERROR,
                ))
            }
        };

        let x = get_quick_match_players(user_name, bm_api_key).await?;

        info!("x: {:?}", x);

        let x = get_recent_server_by_player_id(x.data.bm_id.to_string()).await?;

        let y = BattleMetricsRecentServers::from(&x);

        Ok(Json(y))
    }
}
