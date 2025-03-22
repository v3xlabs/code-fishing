use poem::Result;
use reqwest::ClientBuilder;
use reqwest::Client;
use tracing::{error, info, warn};

use crate::state::AppState;

use super::SearchResponse;

pub async fn search_maps(query: String) -> Result<SearchResponse> {
    info!("Searching for maps: {}", query);

    let url = format!(
        "https://api.rustmaps.com/internal/v1/servers/search?input={}",
        query
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
    let search_response: SearchResponse = serde_json::from_str(&body).unwrap();

    Ok(search_response)
}

pub async fn search_maps_cached(query: String, state: &AppState) -> Result<SearchResponse> {
    let cache = state.cache.rm_search.try_get_with(query.clone(), search_maps(query)).await;

    match cache {
        Ok(search_response) => Ok(search_response),
        Err(e) => {
            error!("Failed to get cached search response: {}", e);
            let err: poem::Error = poem::Error::from_string(e.to_string(), poem::http::StatusCode::INTERNAL_SERVER_ERROR);
            Err(err)
        }
    }
}
