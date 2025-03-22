use poem_openapi::Object;
use reqwest::{Client, ClientBuilder};
use serde::{Deserialize, Serialize};
use poem::Result;
use tracing::{warn, info};

use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize, Clone, Object)]
pub struct SCMMTotalInventoryResponse {
    pub items: u64,
    #[serde(rename = "marketValue")]
    pub market_value: u64,
    #[serde(rename = "marketMovementValue")]
    pub market_movement_value: i64,
    #[serde(rename = "marketMovementTime")]
    pub market_movement_time: String,
}

pub async fn get_total_inventory(steam_id: String) -> Result<SCMMTotalInventoryResponse> {
    info!("Getting total inventory for {}", steam_id);
    let url = format!(
        "https://rust.scmm.app/api/profile/{}/inventory/total",
        steam_id
    );
    let client = ClientBuilder::new()
        .timeout(std::time::Duration::from_secs(10))
        .use_rustls_tls()
        .build()
        .unwrap_or_else(|e| {
            warn!(
                "Failed to build custom HTTP client with rustls: {}, using default",
                e
            );
            Client::new()
        });
    let response = client.get(url).send().await.unwrap();
    let body = response.text().await.unwrap();
    tracing::info!("{}", body);
    let response: SCMMTotalInventoryResponse = serde_json::from_str(&body).unwrap();

    Ok(response)
}

pub async fn get_total_inventory_cached(steam_id: String, state: &AppState) -> Result<SCMMTotalInventoryResponse> {
    let response = state.cache.scmm_total_inventory.try_get_with(steam_id.clone(), get_total_inventory(steam_id)).await;

    match response {
        Ok(response) => Ok(response),
        Err(e) => {
            warn!("Failed to get cached response: {}", e);
            let err: poem::Error = poem::Error::from_string(e.to_string(), poem::http::StatusCode::INTERNAL_SERVER_ERROR);
            Err(err)
        }
    }
}
