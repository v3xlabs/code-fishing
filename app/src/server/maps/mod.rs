use poem::{web::Data, Result};
use poem_openapi::{param::Query, payload::Json, Object, OpenApi};
use serde::{Deserialize, Serialize};

use crate::state::AppState;
use crate::server::ApiTags;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct MapsApi;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct SearchResponse {
    pub meta: SearchMeta,
    pub data: Vec<Server>,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct SearchMeta {
    pub status: String,
    #[serde(rename = "statusCode")]
    pub status_code: u32,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct Server {
    pub name: String,
    #[serde(rename = "mapId")]
    pub map_id: String,
    pub ip: String,
    #[serde(rename = "gamePort")]
    pub game_port: u16,
    #[serde(rename = "lastWipeUtc")]
    pub last_wipe_utc: String,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct MapResponse {
    pub meta: MapMeta,
    pub data: MapData,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct MapMeta {
    pub status: String,
    #[serde(rename = "statusCode")]
    pub status_code: u32,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct MapData {
    pub id: String,
    #[serde(rename = "type")]
    pub _type: String,
    pub seed: u64,
    pub size: u32,
    #[serde(rename = "saveVersion")]
    pub save_version: u32,
    #[serde(rename = "imageUrl")]
    pub image_url: String,
    #[serde(rename = "titleBaseUrl")]
    pub title_base_url: Option<String>,
    #[serde(rename = "imageIconUrl")]
    pub image_icon_url: Option<String>,
    #[serde(rename = "thumbnailUrl")]
    pub thumbnail_url: Option<String>,
    #[serde(rename = "undergroundOverlayUrl")]
    pub underground_overlay_url: Option<String>,
    #[serde(rename = "buildingBlockAreaUrl")]
    pub building_block_area_url: Option<String>,
    #[serde(rename = "isStaging")]
    pub is_staging: bool,
    #[serde(rename = "isCustomMap")]
    pub is_custom_map: bool,
    #[serde(rename = "isForSale")]
    pub is_for_sale: bool,
    #[serde(rename = "isFeatured")]
    pub is_featured: bool,
    #[serde(rename = "hasCustomMonuments")]
    pub has_custom_monuments: bool,
    #[serde(rename = "canDownload")]
    pub can_download: bool,
    #[serde(rename = "downloadUrl")]
    pub download_url: Option<String>,
    pub slug: Option<String>,
    pub monuments: Vec<serde_json::Value>,

    #[serde(flatten)]
    pub extra: serde_json::Value,
}

#[OpenApi]
impl MapsApi {
    #[oai(path = "/maps/search", method = "get", tag = "ApiTags::Maps")]
    async fn search(&self, state: Data<&AppState>, search: Query<String>) -> Result<Json<SearchResponse>> {
        let url = format!("https://api.rustmaps.com/internal/v1/servers/search?input={}", search.0);
        let response = reqwest::get(url).await.unwrap();
        let body = response.text().await.unwrap();
        tracing::info!("{}", body);
        let search_response: SearchResponse = serde_json::from_str(&body).unwrap();
        Ok(Json(search_response))
    }

    #[oai(path = "/maps/get", method = "get", tag = "ApiTags::Maps")]
    async fn get(&self, state: Data<&AppState>, map_id: Query<String>) -> Result<Json<MapResponse>> {
        let url = format!("https://api.rustmaps.com/internal/v1/maps/{}", map_id.0);
        let response = reqwest::get(url).await.unwrap();
        let body = response.text().await.unwrap();
        tracing::info!("{}", body);
        let map_response: MapResponse = serde_json::from_str(&body).unwrap();
        Ok(Json(map_response))
    }
}
