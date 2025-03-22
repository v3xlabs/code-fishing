use crate::{
    models::scmm::total::{get_total_inventory_cached, SCMMTotalInventoryResponse},
    state::AppState,
    server::ApiTags,
};
use poem::{web::Data, Result};
use poem_openapi::{param::Query, payload::Json, OpenApi};

pub struct InventoryApi;

#[OpenApi]
impl InventoryApi {
    /// /inventory/total
    /// 
    /// Get the total inventory value & size of the queried user
    #[oai(path = "/inventory/total", method = "get", tag = "ApiTags::Inventory", operation_id = "get_total_inventory")]
    async fn get_total_inventory(
        &self,
        state: Data<&AppState>,
        #[oai(style = "simple")] steam_id: Query<String>,
    ) -> Result<Json<SCMMTotalInventoryResponse>> {
        let x = get_total_inventory_cached(steam_id.0, &state).await?;

        Ok(Json(x))
    }
}
