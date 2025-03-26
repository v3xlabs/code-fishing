use chrono::{DateTime, Utc};
use poem_openapi::{Object, Union};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use serde_json;

use crate::state::AppState;

// Domain model for use in the application code
#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PartyEvent {
    pub party_id: String,
    pub event_id: i32,
    pub user_id: String,
    pub data: PartyEventData,
    pub created_at: DateTime<Utc>,
}

// Database model that directly maps to the database schema
#[derive(Debug, FromRow)]
struct PartyEventDb {
    pub party_id: String,
    pub event_id: i32,
    pub user_id: String,
    pub data: String, // Store JSON as text in the database
    pub created_at: DateTime<Utc>,
}

impl From<PartyEventDb> for PartyEvent {
    fn from(db: PartyEventDb) -> Self {
        Self {
            party_id: db.party_id,
            event_id: db.event_id,
            user_id: db.user_id,
            data: serde_json::from_str(&db.data)
                .expect("Failed to deserialize PartyEventData from JSON"),
            created_at: db.created_at,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Union)]
#[oai(discriminator_name = "type")]
pub enum PartyEventData {
    #[serde(rename = "party_created")]
    PartyCreated(PartyEventCreated),
    #[serde(rename = "party_owner_changed")]
    PartyOwnerChanged(PartyEventOwnerChanged),
    #[serde(rename = "user_join_leave")]
    PartyJoinLeave(PartyEventJoinLeave),
    #[serde(rename = "user_codes_submitted")]
    PartyCodesSubmitted(PartyEventCodesSubmitted),
    #[serde(rename = "user_cursor_update")]
    PartyCursorUpdate(PartyEventCursorUpdate),
    #[serde(rename = "user_chat_message")]
    PartyChatMessage(PartyEventChatMessage),
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PartyEventCreated {
    pub owner_id: String,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PartyEventOwnerChanged {
    pub owner_id: String,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PartyEventJoinLeave {
    pub user_id: String,
    pub is_join: bool,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PartyEventCodesSubmitted {
    pub user_id: String,
    pub codes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PartyEventCursorUpdate {
    pub user_id: String,
    pub cursor: String,
    pub size: u32,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct PartyEventChatMessage {
    pub message: String,
}

impl PartyEvent {
    pub async fn create(party_id: &str, user_id: &str, data: PartyEventData, state: &AppState) -> Result<Self, sqlx::Error> {
        // Serialize the data to a JSON string for storage in the database
        let data_json = serde_json::to_string(&data)
            .expect("Failed to serialize PartyEventData to JSON");

        let db_event = sqlx::query_as!(
            PartyEventDb,
            "INSERT INTO events (party_id, user_id, data) VALUES ($1, $2, $3) RETURNING *",
            party_id,
            user_id,
            data_json,
        )
        .fetch_one(&state.database.pool)
        .await?;

        // Convert from DB model to domain model
        Ok(db_event.into())
    }
    
    pub async fn get_events_by_event_cursor(party_id: &str, event_cursor: i32, state: &AppState) -> Result<Vec<Self>, sqlx::Error> {
        let events = sqlx::query_as!(
            PartyEventDb,
            "SELECT * FROM events WHERE party_id = $1 AND event_id > $2 ORDER BY event_id ASC LIMIT 10",
            party_id,
            event_cursor
        )
        .fetch_all(&state.database.pool)
        .await?;

        Ok(events.into_iter().map(|e| e.into()).collect())
    }
}
