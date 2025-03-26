use chrono::{DateTime, Utc};
use poem_openapi::Object;
use rand::Rng;
use serde::{Deserialize, Serialize};
use sqids::Sqids;

use crate::state::AppState;

pub mod event;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct Party {
    pub party_id: String,
    pub owner_id: String,
    pub created_at: DateTime<Utc>,
}

impl Party {
    pub async fn create(owner_id: &str, state: &AppState) -> Result<Self, sqlx::Error> {
        let new_id = Sqids::default();
        let random_number = rand::rng().random_range(0..u64::MAX);
        let party_id = new_id.encode(&[0, random_number]).unwrap();

        let party = sqlx::query_as!(
            Self,
            "INSERT INTO parties (party_id, owner_id, created_at) VALUES ($1, $2, $3) RETURNING *",
            party_id,
            owner_id,
            Utc::now()
        )
        .fetch_one(&state.database.pool)
        .await?;

        Ok(party)
    }

    pub async fn get_by_id(party_id: &str, state: &AppState) -> Result<Option<Self>, sqlx::Error> {
        let party = sqlx::query_as!(
            Self,
            "SELECT * FROM parties WHERE party_id = $1",
            party_id
        )
        .fetch_optional(&state.database.pool)
        .await?;

        Ok(party)
    }
}
