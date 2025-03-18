use poem::{web::Data, Result};
use poem_openapi::param::Path;
use poem_openapi::{Enum, NewType, Union};
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

    // #[oai(path = "/party/:party_id/submit", method = "post", tag = "ApiTags::Party")]
    // async fn submit(&self, state: Data<&AppState>, party_id: Path<String>, body: Json<PartySubmitRequest>) -> Result<Json<PartySubmitResponse>> {
    //     tracing::info!("{:?}", body);

    //     Ok(Json(PartySubmitResponse {
    //         id: "123".to_string(),
    //     }))
    // }

    #[oai(path = "/party/:party_id/get", method = "get", tag = "ApiTags::Party")]
    async fn get(&self, state: Data<&AppState>, party_id: Path<String>, cursor: Query<String>) -> Result<Json<PartyGetResponse>> {
        tracing::info!("{:?}", party_id.0);

        Ok(Json(PartyGetResponse {
            entries: vec![],
        }))
    }
}
