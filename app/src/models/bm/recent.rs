use chrono::DateTime;
use poem::Result;
use poem_openapi::{Object, OpenApi};
use reqwest::{Client, ClientBuilder};
use serde::{Deserialize, Serialize};
use tracing::{info, warn};

use crate::state::AppState;

use super::core::*;

// Payload with the recent servers the user has connected to
#[derive(Debug, Serialize, Deserialize, Object, Clone)]
pub struct BattleMetricsRecentServers {
    // Recent servers the user has connected to
    pub servers: Vec<BattleMetricsRecentServer>,
}

#[derive(Debug, Serialize, Deserialize, Object, Clone)]
pub struct BattleMetricsRecentServer {
    // `id` from BattleMetrics
    pub bm_id: String,
    pub name: Option<String>,
    // `address` from BattleMetrics
    pub styled_ip: Option<String>,
    // online player count;
    pub players: Option<u64>,
    // subjective status
    pub status: Option<String>,
    pub tags: Option<Vec<String>>,
    // `official` from BattleMetrics
    pub is_official: Option<bool>,
    // ex 'official'
    pub rust_type: Option<String>,
    // ex 'standard'; `rust_gamemode` from BattleMetrics
    pub gamemode: Option<String>,
    // Map Name; ex 'Rustafied Custom Map'; `map` from BattleMetrics
    pub map_name: Option<String>,
    // Header Image; `rust_headerimage` from BattleMetrics
    pub header_url: Option<String>,
    // Url; `rust_url` from BattleMetrics
    pub url: Option<String>,
    // description; `rust_description` from BattleMetrics
    pub description: Option<String>,

    // Specific to the user
    pub last_seen: Option<String>,
    pub first_seen: Option<String>,
    pub time_played: Option<u64>,
    pub online: Option<bool>,
}

impl BattleMetricsRecentServer {
    fn from(value: &BattleMetricsType) -> Option<Self> {
        let is_rust = value
            .relationships
            .as_ref()
            .and_then(|r| r.game.as_ref())
            .map_or(false, |d| d.data._type == "game" && d.data.id == "rust");

        if !is_rust {
            return None;
        }

        // leave this code intact

        Some(BattleMetricsRecentServer {
            bm_id: value.id.clone().unwrap(),
            name: value.attributes.as_ref().and_then(|a| a.name.clone()),
            styled_ip: value.attributes.as_ref().and_then(|a| {
                a.extra
                    .get("address")
                    .and_then(|v| v.as_str().map(|s| s.to_string()))
            }),
            players: value
                .attributes
                .as_ref()
                .and_then(|a| a.extra.get("players").and_then(|v| v.as_u64())),
            status: value.attributes.as_ref().and_then(|a| {
                a.extra
                    .get("status")
                    .and_then(|v| v.as_str().map(|s| s.to_string()))
            }),
            tags: value.attributes.as_ref().and_then(|a| {
                a.extra.get("details").and_then(|d| {
                    d.get("tags").and_then(|v| {
                        if let Some(arr) = v.as_array() {
                            Some(
                                arr.iter()
                                    .filter_map(|item| item.as_str().map(|s| s.to_string()))
                                    .collect(),
                            )
                        } else {
                            None
                        }
                    })
                })
            }),
            is_official: value.attributes.as_ref().and_then(|a| {
                a.extra
                    .get("details")
                    .and_then(|d| d.get("official").and_then(|v| v.as_bool()))
            }),
            rust_type: value.attributes.as_ref().and_then(|a| {
                a.extra.get("details").and_then(|d| {
                    d.get("rust_type")
                        .and_then(|v| v.as_str().map(|s| s.to_string()))
                })
            }),
            gamemode: value.attributes.as_ref().and_then(|a| {
                a.extra.get("details").and_then(|d| {
                    d.get("rust_gamemode")
                        .and_then(|v| v.as_str().map(|s| s.to_string()))
                })
            }),
            map_name: value.attributes.as_ref().and_then(|a| {
                a.extra
                    .get("details")
                    .and_then(|d| d.get("map").and_then(|v| v.as_str().map(|s| s.to_string())))
            }),
            header_url: value.attributes.as_ref().and_then(|a| {
                a.extra.get("details").and_then(|d| {
                    d.get("rust_headerimage")
                        .and_then(|v| v.as_str().map(|s| s.to_string()))
                })
            }),
            url: value.attributes.as_ref().and_then(|a| {
                a.extra.get("details").and_then(|d| {
                    d.get("rust_url")
                        .and_then(|v| v.as_str().map(|s| s.to_string()))
                })
            }),
            description: value.attributes.as_ref().and_then(|a| {
                a.extra.get("details").and_then(|d| {
                    d.get("rust_description")
                        .and_then(|v| v.as_str().map(|s| s.to_string()))
                })
            }),
            last_seen: value.meta.as_ref().and_then(|m| m.last_seen.clone()),
            first_seen: value.meta.as_ref().and_then(|m| m.first_seen.clone()),
            time_played: value.meta.as_ref().and_then(|m| m.time_played),
            online: value.meta.as_ref().and_then(|m| m.online),
        })
    }
}

impl From<&BattleMetricsObjectResponse> for BattleMetricsRecentServers {
    fn from(value: &BattleMetricsObjectResponse) -> Self {
        let mut servers: Vec<BattleMetricsRecentServer> = value
            .included
            .as_ref()
            .unwrap_or(&vec![])
            .iter()
            .filter_map(|item| {
                if item._type == "server" {
                    BattleMetricsRecentServer::from(item)
                } else {
                    None
                }
            })
            .collect();

        // Sort by last_seen date (oldest first, most recent last)
        servers.sort_by(|a, b| {
            let parse_date = |date_str: &Option<String>| -> Option<DateTime<chrono::Utc>> {
                date_str
                    .as_ref()
                    .and_then(|ds| DateTime::parse_from_rfc3339(ds).map(|dt| dt.into()).ok())
            };

            let a_date = parse_date(&a.last_seen);
            let b_date = parse_date(&b.last_seen);

            match (a_date, b_date) {
                (Some(a_dt), Some(b_dt)) => b_dt.cmp(&a_dt),
                (Some(_), None) => std::cmp::Ordering::Greater,
                (None, Some(_)) => std::cmp::Ordering::Less,
                (None, None) => std::cmp::Ordering::Equal,
            }
        });

        BattleMetricsRecentServers { servers }
    }
}

pub async fn get_recent_server_by_player_id(
    bm_id: String,
) -> Result<BattleMetricsRecentServers> {
    info!("bm_get_recent_server_by_player_id: {:?}", bm_id);

    let url = format!(
        "https://api.battlemetrics.com/players/{}?include=server%2Cidentifier&fields[server]=name%2Caddress%2Cplayers%2Cstatus%2Cdetails",
        bm_id
    );

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

    let response = client.get(url).send().await.map_err(|e| {
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

    // tracing::info!("Response body: {}", body);

    let search_response: BattleMetricsObjectResponse =
        serde_json::from_str(&body).map_err(|e| {
            warn!("Failed to parse JSON: {}", e);
            poem::Error::from_string(
                format!("JSON parse error: {}", e),
                poem::http::StatusCode::INTERNAL_SERVER_ERROR,
            )
        })?;

    Ok(BattleMetricsRecentServers::from(&search_response))
}

pub async fn get_recent_servers_cached(
    bm_id: String,
    state: &AppState,
) -> Result<BattleMetricsRecentServers> {
    let response = state.cache.bm_recent_servers.try_get_with(bm_id.clone(), async {
        get_recent_server_by_player_id(bm_id).await
    }).await;

    match response {
        Ok(response) => Ok(response),
        Err(e) => {
            warn!("Failed to get cached response: {}", e);
            // TODO: improve error handling
            let err: poem::Error = poem::Error::from_string(e.to_string(), poem::http::StatusCode::INTERNAL_SERVER_ERROR);
            Err(err)
        }
    }
}
