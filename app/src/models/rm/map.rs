use crate::models::rm::MapResponse;
use crate::state::AppState;
use poem::Result;
use reqwest::ClientBuilder;
use reqwest::Client;
use tracing::{info, warn};

pub async fn get_map(map_id: String) -> Result<MapResponse> {
    info!("Getting map: {}", map_id);
    let url = format!("https://api.rustmaps.com/internal/v1/maps/{}", map_id);

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
    let map_response: MapResponse = serde_json::from_str(&body).unwrap();

    Ok(map_response)
}

pub async fn get_map_cached(map_id: String, state: &AppState) -> Result<MapResponse> {
    let cache = state.cache.rm_map.try_get_with(map_id.clone(), get_map(map_id)).await;

    match cache {
        Ok(map_response) => Ok(map_response),
        Err(e) => {
            tracing::error!("Failed to get cached map response: {}", e);
            let err: poem::Error = poem::Error::from_string(e.to_string(), poem::http::StatusCode::INTERNAL_SERVER_ERROR);
            Err(err)
        }
    }
}
