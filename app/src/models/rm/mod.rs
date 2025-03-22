use poem_openapi::Object;
use serde::{Deserialize, Serialize};

pub mod map;
pub mod search;

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
pub struct SearchResponse {
    pub meta: SearchMeta,
    pub data: Vec<Server>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
pub struct SearchMeta {
    pub status: String,
    #[serde(rename = "statusCode")]
    pub status_code: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
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

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
pub struct MapResponse {
    pub meta: MapMeta,
    pub data: MapData,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
pub struct MapMeta {
    pub status: String,
    #[serde(rename = "statusCode")]
    pub status_code: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Object)]
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
