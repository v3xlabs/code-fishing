use crate::{
    models::bm::{
        player::get_quick_match_players_cached,
        recent::{get_recent_servers_cached, BattleMetricsRecentServers},
    },
    state::AppState,
};
use poem::{
    web::Data,
    Result,
};
use poem_openapi::{payload::Json, OpenApi};
use tracing::info;
use crate::server::ApiTags;

use super::auth::mw::AuthUser;

pub struct BattleMetricsApi;

#[OpenApi]
impl BattleMetricsApi {
    #[oai(path = "/bm/recent", method = "get", tag = "ApiTags::BattleMetrics")]
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

        let x = get_quick_match_players_cached(user_name, bm_api_key, &state).await?;

        info!("x: {:?}", x);

        let x = get_recent_servers_cached(x.data.bm_id.to_string(), &state).await?;

        Ok(Json(x))
    }
}
