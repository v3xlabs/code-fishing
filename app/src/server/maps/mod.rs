use poem::{web::Data, Result};
use poem_openapi::{param::Query, payload::Json, Object, OpenApi};
use serde::{Deserialize, Serialize};

use crate::models::rm::map::get_map_cached;
use crate::models::rm::search::search_maps_cached;
use crate::models::rm::MapResponse;
use crate::models::rm::SearchResponse;
use crate::server::ApiTags;
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct MapsApi;

#[OpenApi]
impl MapsApi {
    #[oai(path = "/maps/search", method = "get", tag = "ApiTags::Maps")]
    async fn search(
        &self,
        _state: Data<&AppState>,
        #[oai(style = "form")] search: Query<String>,
    ) -> Result<Json<SearchResponse>> {
        let search_response = search_maps_cached(search.0, _state.0).await?;

        Ok(Json(search_response))
    }

    #[oai(path = "/maps/get", method = "get", tag = "ApiTags::Maps")]
    async fn get(
        &self,
        _state: Data<&AppState>,
        #[oai(style = "form")] map_id: Query<String>,
    ) -> Result<Json<MapResponse>> {
        let map_response = get_map_cached(map_id.0, _state.0).await?;

        Ok(Json(map_response))
    }
}
