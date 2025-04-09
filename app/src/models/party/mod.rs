use std::{collections::{HashMap, HashSet}, ops::Deref, sync::Arc};

use chrono::{DateTime, Utc};
use event::{PartyEvent, PartyEventData, PartyEventJoinLeave, PartyEventSettingChanged};
use poem_openapi::Object;
use rand::Rng;
use serde::{Deserialize, Serialize};
use sqids::Sqids;
use tracing::info;

use crate::{state::AppState, util::generate_secret};

pub mod event;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct Party {
    pub party_id: String,
    pub owner_id: String,
    pub party_secret: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl Party {
    pub async fn create(owner_id: &str, state: &AppState) -> Result<Self, sqlx::Error> {
        let new_id = Sqids::default();
        let random_number = rand::rng().random_range(0..u64::MAX);
        let party_id = new_id.encode(&[0, random_number]).unwrap();
        let party_secret = generate_secret();

        let party = sqlx::query_as!(
            Self,
            "INSERT INTO parties (party_id, owner_id, created_at, party_secret) VALUES ($1, $2, $3, $4) RETURNING *",
            party_id,
            owner_id,
            Utc::now(),
            Some(party_secret)
        )
        .fetch_one(&state.database.pool)
        .await?;

        // emit join leave event for owner
        PartyEvent::create(
            &party.party_id,
            &party.owner_id,
            PartyEventData::PartyJoinLeave(PartyEventJoinLeave {
                user_id: party.owner_id.clone(),
                is_join: true,
            }),
            state,
        )
        .await?;

        Ok(party)
    }

    pub async fn get_by_id(party_id: &str, state: &AppState) -> Result<Option<Self>, sqlx::Error> {
        let party = sqlx::query_as!(Self, "SELECT * FROM parties WHERE party_id = $1", party_id)
            .fetch_optional(&state.database.pool)
            .await?;

        Ok(party)
    }

    pub async fn get_user_is_in_party(
        user_id: &str,
        party_id: &str,
        state: &AppState,
    ) -> Result<bool, ()> {
        // get all events for the party that are of type PartyJoinLeave
        let state = match Party::get_party_state(party_id, state).await {
            Ok(state) => state,
            Err(e) => {
                tracing::error!("Failed to get party state: {}", e);
                return Err(());
            }
        };

        info!("state: {:?}", state);

        Ok(state.members.contains(user_id))
    }

    pub async fn index_party_state(
        party_id: &str,
        state: &AppState,
    ) -> Result<PartyState, sqlx::Error> {
        info!("index_party_state: {:?}", party_id);

        let events = PartyEvent::get_join_leave_events(party_id, state).await?;

        let mut state = PartyState {
            members: HashSet::new(),
            settings: PartyStateSettings {
                private: false,
                steam_only: false,
                extra: HashMap::new(),
            },
        };

        for event in events {
            match event.data {
                PartyEventData::PartyJoinLeave(PartyEventJoinLeave { user_id, is_join }) => {
                    if is_join {
                        state.members.insert(user_id);
                    } else {
                        state.members.remove(&user_id);
                    }
                }
                PartyEventData::PartySettingChanged(PartyEventSettingChanged { setting, value }) => {
                    if setting == "private" {
                        state.settings.private = value.as_bool().unwrap_or(false);
                    } else if setting == "steam_only" {
                        state.settings.steam_only = value.as_bool().unwrap_or(false);
                    } else {
                        state.settings.extra.insert(setting, value);
                    }
                }
                _ => {}
            }
        }

        Ok(state)
    }

    pub async fn get_party_state(
        party_id: &str,
        state: &AppState,
    ) -> Result<PartyState, Arc<sqlx::Error>> {
        let state = state
            .cache
            .party_state
            .try_get_with(
                party_id.to_string(),
                Party::index_party_state(party_id, state),
            )
            .await;

        match state {
            Ok(state) => Ok(state),
            Err(e) => {
                tracing::error!("Failed to get party state: {}", e);
                Err(e)
            }
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PartyState {
    members: HashSet<String>,
    settings: PartyStateSettings,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PartyStateSettings {
    pub private: bool,
    pub steam_only: bool,
    #[serde(flatten)]
    pub extra: HashMap<String, serde_json::Value>,
}
