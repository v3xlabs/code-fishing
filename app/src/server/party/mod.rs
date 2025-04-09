use poem::{web::Data, Result};
use poem_openapi::param::{Path, Query};
use poem_openapi::{payload::Json, Object, OpenApi};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};

use crate::models::party::event::{PartyEvent, PartyEventData, PartyEventJoinLeave, PartyEventSettingChanged};
use crate::models::party::Party;
use crate::server::ApiTags;
use crate::state::AppState;

use super::auth::mw::AuthUser;

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
    /// /party
    ///
    /// Create a new party
    #[oai(path = "/party", method = "post", tag = "ApiTags::Party")]
    async fn create(
        &self,
        state: Data<&AppState>,
        body: Json<PartyCreateRequest>,
        user: AuthUser,
    ) -> Result<Json<PartyCreateResponse>> {
        tracing::info!("{:?}", body);
        let user = user.require_user()?;

        let party = Party::create(&user.user_id, state.0).await.map_err(|e| {
            tracing::error!("Error creating party: {:?}", e);
            poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
        })?;

        Ok(Json(PartyCreateResponse {
            id: party.party_id,
            created_at: party.created_at.to_rfc3339(),
        }))
    }

    /// /party/:party_id/join
    ///
    /// Join a party
    #[oai(
        path = "/party/:party_id/join",
        method = "post",
        tag = "ApiTags::Party"
    )]
    async fn join(
        &self,
        state: Data<&AppState>,
        user: AuthUser,
        #[oai(style = "simple")] party_id: Path<String>,
    ) -> Result<Json<serde_json::Value>> {
        tracing::info!("{:?}", party_id.0);
        let user = user.require_user()?;

        let party = Party::get_by_id(&party_id.0, state.0).await.map_err(|e| {
            tracing::error!("Error getting party: {:?}", e);
            poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
        })?;

        if let Some(party) = party {
            if Party::get_user_is_in_party(&user.user_id, &party_id.0, state.0)
                .await
                .map_err(|e| {
                    tracing::error!("Error getting user is in party: {:?}", e);
                    poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
                })?
            {
                return Err(poem::Error::from_status(StatusCode::CONFLICT));
            }

            let event = PartyEvent::create(
                &party_id.0,
                &user.user_id,
                PartyEventData::PartyJoinLeave(PartyEventJoinLeave {
                    user_id: user.user_id.clone(),
                    is_join: true,
                }),
                state.0,
            )
            .await
            .map_err(|e| {
                tracing::error!("Error creating event: {:?}", e);
                poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
            })?;

            if event.data.requires_cache_invalidation() {
                tracing::info!("Invalidating cache for party: {:?}", party_id.0);
                state.cache.party_state.invalidate(&party_id.0).await;
            }
        }

        Ok(Json(serde_json::json!({})))
    }

    /// /party/:party_id
    ///
    /// Get a party by ID
    #[oai(path = "/party/:party_id", method = "get", tag = "ApiTags::Party")]
    async fn get(
        &self,
        state: Data<&AppState>,
        user: AuthUser,
        #[oai(style = "simple")] party_id: Path<String>,
    ) -> Result<Json<Party>> {
        tracing::info!("{:?}", party_id.0);
        let user = user.require_user()?;

        let party = Party::get_by_id(&party_id.0, state.0).await.map_err(|e| {
            tracing::error!("Error getting party: {:?}", e);
            poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
        })?;

        if let Some(party) = party {
            if Party::get_user_is_in_party(&user.user_id, &party_id.0, state.0)
                .await
                .map_err(|e| {
                    tracing::error!("Error getting user is in party: {:?}", e);
                    poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
                })?
            {
                Ok(Json(party))
            } else {
                Err(poem::Error::from_status(StatusCode::FORBIDDEN))
            }
        } else {
            Err(poem::Error::from_status(StatusCode::NOT_FOUND))
        }
    }

    /// /party/:party_id/events
    ///
    /// Get events for a party
    #[oai(
        path = "/party/:party_id/events",
        method = "get",
        tag = "ApiTags::Party"
    )]
    async fn get_events(
        &self,
        state: Data<&AppState>,
        user: AuthUser,
        #[oai(style = "simple")] party_id: Path<String>,
        #[oai(style = "simple")] cursor: Query<Option<i32>>,
    ) -> Result<Json<Vec<PartyEvent>>> {
        tracing::info!("{:?}", party_id.0);

        let user = user.require_user()?;

        if !Party::get_user_is_in_party(&user.user_id, &party_id.0, state.0)
            .await
            .map_err(|e| {
                tracing::error!("Error getting user is in party: {:?}", e);
                poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
            })?
        {
            return Err(poem::Error::from_status(StatusCode::FORBIDDEN));
        }

        let cursor = cursor.unwrap_or(0);

        let events = PartyEvent::get_events_by_event_cursor(&party_id.0, cursor, state.0)
            .await
            .map_err(|e| {
                tracing::error!("Error getting events: {:?}", e);
                poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
            })?;

        Ok(Json(events))
    }

    /// /party/:party_id/events
    ///
    /// Submit an event to a party
    #[oai(
        path = "/party/:party_id/events",
        method = "post",
        tag = "ApiTags::Party"
    )]
    async fn submit_event(
        &self,
        state: Data<&AppState>,
        user: AuthUser,
        #[oai(style = "simple")] party_id: Path<String>,
        body: Json<PartyEventData>,
    ) -> Result<Json<PartyEvent>> {
        tracing::info!("{:?}", party_id.0);

        let user = user.require_user()?;

        if !Party::get_user_is_in_party(&user.user_id, &party_id.0, state.0)
            .await
            .map_err(|e| {
                tracing::error!("Error getting user is in party: {:?}", e);
                poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
            })?
        {
            return Err(poem::Error::from_status(StatusCode::FORBIDDEN));
        }

        // check event data
        if body.0.requires_cache_invalidation() {
            tracing::info!("Invalidating cache for party: {:?}", party_id.0);
            state.cache.party_state.invalidate(&party_id.0).await;
        }

        let event = PartyEvent::create(&party_id.0, &user.user_id, body.0, state.0)
            .await
            .map_err(|e| {
                tracing::error!("Error creating event: {:?}", e);
                poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR)
            })?;

        Ok(Json(event))
    }
}
