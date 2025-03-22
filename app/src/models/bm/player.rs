use poem::Result;
use poem_openapi::Object;
use reqwest::ClientBuilder;
use serde::{Deserialize, Serialize};
use tracing::{info, warn};

use crate::state::AppState;

use super::core::*;

// Payload with the recent servers the user has connected to
#[derive(Debug, Serialize, Deserialize)]
pub struct BattleMetricsQuickMatchPayload {
    pub data: Vec<BattleMetricsType>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
pub struct BattleMetricsPlayer {
    // `id` from BattleMetrics
    pub bm_id: String,
    pub name: Option<String>,
    pub private: Option<bool>,
    pub last_seen: Option<String>,
}

impl From<&BattleMetricsType> for BattleMetricsPlayer {
    fn from(response: &BattleMetricsType) -> Self {
        BattleMetricsPlayer {
            bm_id: response
                .relationships
                .as_ref()
                .and_then(|r| r.player.as_ref().map(|p| p.data.id.clone()))
                .unwrap_or_default(),
            name: response
                .attributes
                .as_ref()
                .and_then(|a| a.extra.get("identifier").map(|v| v.to_string())),
            private: response
                .attributes
                .as_ref()
                .and_then(|a| a.extra.get("private").map(|v| v.as_bool().unwrap_or(false))),
            last_seen: response
                .attributes
                .as_ref()
                .and_then(|a| a.extra.get("lastSeen").map(|v| v.as_str().unwrap_or_default().to_string())),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BattleMetricsPlayerResponse {
    pub data: BattleMetricsPlayer,
}

impl BattleMetricsPlayerResponse {
    pub fn from(response: BattleMetricsResponse) -> Result<Self> {
        // most last_seen response
        let mut data: Vec<BattleMetricsPlayer> = response
            .data
            .into_iter()
            .map(|x| BattleMetricsPlayer::from(&x))
            .collect();

        data.sort_by(|a, b| b.last_seen.cmp(&a.last_seen));

        // 5 days ago
        let day_cap = chrono::Duration::days(5);
        let now = chrono::Utc::now();

        info!("length pre filtering: {}", data.len());

        // filter out any players that haven't been seen in the last 5 days
        data.retain(|x| {
            // parse ISO 8601 dates like "2025-03-15T07:23:03.173Z"
            let last_seen_str = match x.last_seen.as_deref() {
                Some(last_seen) => last_seen,
                None => return false,
            };
            // Remove any surrounding quotes that might have been added
            let cleaned_str = last_seen_str.trim_matches('"');

            info!("cleaned_str: {:?}", cleaned_str);
            
            let last_seen = match chrono::DateTime::parse_from_rfc3339(cleaned_str) {
                Ok(last_seen) => last_seen,
                Err(e) => {
                    warn!("Failed to parse last seen: {} - {:?}", cleaned_str, e);
                    return false;
                },
            };

            info!("last_seen: {:?}", last_seen);

            last_seen > now - day_cap
        });

        info!("length post filtering: {}", data.len());

        // log all results

        info!("data: {:?}", data);

        let result_threshold = 4;

        // if there are more then threshold results
        if data.len() > result_threshold {
            return Err(poem::Error::from_string(
                format!("Too many results: {}", data.len()),
                poem::http::StatusCode::BAD_REQUEST,
            ));
        }

        if data.is_empty() {
            return Err(poem::Error::from_string(
                "No results found".to_string(),
                poem::http::StatusCode::BAD_REQUEST,
            ));
        }

        // extract the first result and discard the rest
        let data = data.into_iter().next().unwrap();

        Ok(Self { data })
    }
}

pub async fn get_quick_match_players(
    player_name: String,
    auth_token: &String,
) -> Result<BattleMetricsPlayerResponse> {
    info!("bm_get_quick_match_players: {:?}", player_name);

    let payload = BattleMetricsQuickMatchPayload {
        data: vec![BattleMetricsType {
            _type: "identifier".to_string(),
            id: None,
            attributes: Some(BattleMetricsAttributes {
                _type: Some("name".to_string()),
                name: None,
                ip: None,
                extra: serde_json::json!({ "identifier": player_name }),
                port: None,
            }),
            relationships: None,
            meta: None,
        }],
    };

    let payload_json = serde_json::to_string(&payload).unwrap();
    info!("Payload: {}", payload_json);

    let client = ClientBuilder::new()
        .timeout(std::time::Duration::from_secs(10))
        .use_rustls_tls()
        .build()
        .map_err(|e| {
            warn!("Failed to build HTTP client: {}", e);
            poem::Error::from_string(
                format!("Client build error: {}", e),
                poem::http::StatusCode::INTERNAL_SERVER_ERROR,
            )
        })?;

    let url = "https://api.battlemetrics.com/players/quick-match?page[size]=5";

    let response = client
        .post(url)
        .json(&payload)
        .header("Authorization", format!("Bearer {}", auth_token))
        .timeout(std::time::Duration::from_secs(2))
        .send()
        .await
        .map_err(|e| {
            warn!("Failed to send request: {}", e);
            poem::Error::from_string(
                format!("Request error: {}", e),
                poem::http::StatusCode::INTERNAL_SERVER_ERROR,
            )
        })?;

    let body = response.text().await.map_err(|e| {
        warn!("Failed to get response text: {}", e);
        poem::Error::from_string(
            format!("Response text error: {}", e),
            poem::http::StatusCode::INTERNAL_SERVER_ERROR,
        )
    })?;

    tracing::info!("Response body: {}", body);

    let search_response: BattleMetricsResponse = serde_json::from_str(&body).map_err(|e| {
        warn!("Failed to parse JSON: {}", e);
        poem::Error::from_string(
            format!("JSON parse error: {}", e),
            poem::http::StatusCode::INTERNAL_SERVER_ERROR,
        )
    })?;

    tracing::info!("Search response: {:?}", search_response);

    // convert to
    let data = BattleMetricsPlayerResponse::from(search_response)?;

    Ok(data)
}

pub async fn get_quick_match_players_cached(
    player_name: String,
    auth_token: &String,
    state: &AppState,
) -> Result<BattleMetricsPlayerResponse> {
    let response = state.cache.bm_user_from_name.try_get_with(player_name.clone(), get_quick_match_players(player_name, auth_token)).await;

    match response {
        Ok(response) => Ok(response),
        Err(e) => {
            warn!("Failed to get cached response: {}", e);
            // remove from arc
            // crappy error stripping
            let err: poem::Error = poem::Error::from_string(e.to_string(), poem::http::StatusCode::INTERNAL_SERVER_ERROR);
            Err(err)
        }
    }
}
