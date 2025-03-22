use poem::{web::Data, Result};
use poem_openapi::param::Path;
use poem_openapi::Union;
use poem_openapi::{param::Query, payload::Json, Object, OpenApi};
use rand::prelude::*;
use serde::{Deserialize, Serialize};
use sqids::Sqids;

use crate::server::ApiTags;
use crate::state::AppState;

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

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PartySubmitRequest {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PartySubmitResponse {
    pub id: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PartyGetResponse {
    pub entries: Vec<PartyEntry>,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PartyEntry {
    pub entry_id: String,
    pub user_id: String,
    pub created_at: String,
    pub data: PartyEntryData,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PartyEntryCursorUpdate {
    pub codes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PartyEntryJoinLeave {
    pub action: String,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PartyEntryCodeSubmit {
    pub codes: Vec<String>,
}

#[derive(Union, Serialize, Deserialize, Debug)]
#[oai(discriminator_name = "type")]
pub enum PartyEntryData {
    #[serde(rename = "cursor_update")]
    CursorUpdate(PartyEntryCursorUpdate),
    #[serde(rename = "join_leave")]
    JoinLeave(PartyEntryJoinLeave),
    #[serde(rename = "code_submit")]
    CodeSubmit(PartyEntryCodeSubmit),
}

#[OpenApi]
impl PartyApi {
    /// /party/create
    /// 
    /// Create a new party
    #[oai(path = "/party/create", method = "post", tag = "ApiTags::Party")]
    async fn create(
        &self,
        _state: Data<&AppState>,
        body: Json<PartyCreateRequest>,
    ) -> Result<Json<PartyCreateResponse>> {
        tracing::info!("{:?}", body);

        let new_id = Sqids::default();
        let random_number = rand::rng().random_range(0..u64::MAX);
        let new_id = new_id.encode(&[0, random_number]).unwrap();

        Ok(Json(PartyCreateResponse {
            id: new_id,
            created_at: "2021-01-01".to_string(),
        }))
    }

    // #[oai(path = "/party/:party_id/submit", method = "post", tag = "ApiTags::Party")]
    // async fn submit(&self, state: Data<&AppState>, party_id: Path<String>, body: Json<PartySubmitRequest>) -> Result<Json<PartySubmitResponse>> {
    //     tracing::info!("{:?}", body);

    //     Ok(Json(PartySubmitResponse {
    //         id: "123".to_string(),
    //     }))
    // }

    /// /party/:party_id/get
    /// 
    /// Get a party by ID
    #[oai(path = "/party/:party_id/get", method = "get", tag = "ApiTags::Party")]
    async fn get(
        &self,
        _state: Data<&AppState>,
        #[oai(style = "simple")] party_id: Path<String>,
        #[oai(style = "form")] _cursor: Query<String>,
    ) -> Result<Json<PartyGetResponse>> {
        tracing::info!("{:?}", party_id.0);

        Ok(Json(PartyGetResponse { entries: vec![] }))
    }
}
