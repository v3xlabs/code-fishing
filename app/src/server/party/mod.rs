use poem::{web::Data, Result};
use poem_openapi::{param::Query, payload::Json, Object, OpenApi};
use serde::{Deserialize, Serialize};
use sqids::Sqids;
use rand::prelude::*;

use crate::state::AppState;
use crate::server::ApiTags;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PartyApi;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PartyCreateResponse {
    pub id: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PartyCreateRequest {
    // pub name: String,
}

#[OpenApi]
impl PartyApi {
    #[oai(path = "/party/create", method = "post", tag = "ApiTags::Party")]
    async fn create(&self, state: Data<&AppState>, body: Json<PartyCreateRequest>) -> Result<Json<PartyCreateResponse>> {
        tracing::info!("{:?}", body);

        let new_id = Sqids::default();
        let random_number = rand::thread_rng().gen_range(0..u64::MAX);
        let new_id = new_id.encode(&[0, random_number]).unwrap();

        Ok(Json(PartyCreateResponse {
            id: new_id,
            created_at: "2021-01-01".to_string(),
        }))
    }
}
