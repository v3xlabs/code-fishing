use chrono::{DateTime, Utc};
use fake::Fake;
use poem::Result;
use poem_openapi::{types::Example, Object};
use rand::Rng;
use serde::{Deserialize, Serialize};

use crate::{server::auth::oauth::SteamUserProfile, state::AppState};

#[derive(Debug, Deserialize, Serialize, Clone, Object)]
#[oai(example)]
pub struct User {
    pub user_id: String,
    pub name: String,
    pub avatar_url: Option<String>,
    pub profile_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Example for User {
    fn example() -> Self {
        User {
            user_id: "guest:ImvHRo4RUHSD2x".to_string(),
            name: "John D.".to_string(),
            avatar_url: Some("https://avatars.akamai.steamstatic.com/0000000000000000.jpg".to_string()),
            profile_url: Some("https://steamcommunity.com/id/john_doe".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }
}

impl User {
    pub async fn authorize_by_steam_id(
        state: &AppState,
        steam_profile: &SteamUserProfile,
    ) -> Result<User> {
        // insert into or update user with steam_profile
        let user = sqlx::query_as!(User,
            "INSERT INTO users (user_id, name, avatar_url, profile_url) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET name = $2, avatar_url = $3, profile_url = $4, updated_at = NOW() RETURNING *",
            format!("steam:{}", steam_profile.steamid),
            steam_profile.personaname.clone().unwrap_or("Guest".to_string()),
            steam_profile.avatar.clone(),
            steam_profile.profileurl.clone()
        )
        .fetch_one(&state.database.pool)
            .await.unwrap();

        Ok(user)
    }

    pub async fn authorize_by_guest_id(state: &AppState) -> Result<User> {
        let user_id = Self::get_next_guest_id(state, 0).await?;
        let guest_name: String = fake::faker::name::en::FirstName().fake();
        let last_name: String = fake::faker::name::en::LastName().fake();
        let first_char_of_last_name: String = last_name.chars().next().unwrap().to_string();
        let guest_name = format!("{} {}.", guest_name, first_char_of_last_name);

        let user = sqlx::query_as!(
            User,
            "INSERT INTO users (user_id, name) VALUES ($1, $2) RETURNING *",
            format!("guest:{}", user_id),
            guest_name
        )
        .fetch_one(&state.database.pool)
        .await
        .unwrap();
        Ok(user)
    }

    pub async fn get_next_guest_id(state: &AppState, attempt: u32) -> Result<String> {
        let random_number = rand::rng().random_range(0..u64::MAX);
        let user_id = sqids::Sqids::default().encode(&[0, random_number]).unwrap();

        // check if user_id is already in the database
        let exists = sqlx::query_scalar!(
            "SELECT 1 FROM users WHERE user_id = $1",
            format!("guest:{}", user_id)
        )
        .fetch_optional(&state.database.pool)
        .await
        .ok()
        .flatten()
        .flatten()
        .is_some_and(|_| true);

        if exists {
            if attempt > 10 {
                return Err(poem::Error::from_string(
                    "Failed to generate guest id",
                    poem::http::StatusCode::INTERNAL_SERVER_ERROR,
                ));
            }
            return Box::pin(Self::get_next_guest_id(state, attempt + 1)).await;
        }

        Ok(user_id)
    }

    pub async fn sign_jwt(&self, state: &AppState) -> Result<String> {
        let token = jsonwebtoken::encode(
            &jsonwebtoken::Header::default(),
            &JwtClaims::from(self),
            &jsonwebtoken::EncodingKey::from_secret(state.jwt.secret.as_bytes()),
        )
        .unwrap();

        Ok(token)
    }

    pub async fn verify_jwt(token: &str, state: &AppState) -> Result<User> {
        let claims = jsonwebtoken::decode::<JwtClaims>(
            token,
            &jsonwebtoken::DecodingKey::from_secret(state.jwt.secret.as_bytes()),
            &jsonwebtoken::Validation::default(),
        )
        .map_err(|e| {
            poem::Error::from_string(
                format!("Invalid JWT token: {}", e),
                poem::http::StatusCode::UNAUTHORIZED,
            )
        })?
        .claims;

        // Look up the user in the database
        let user = sqlx::query_as!(User, "SELECT * FROM users WHERE user_id = $1", claims.sub)
            .fetch_one(&state.database.pool)
            .await
            .map_err(|e| {
                poem::Error::from_string(
                    format!("User not found: {}", e),
                    poem::http::StatusCode::UNAUTHORIZED,
                )
            })?;

        Ok(user)
    }

    pub async fn get_by_id(user_id: &str, state: &AppState) -> Result<User> {
        let user = sqlx::query_as!(User, "SELECT * FROM users WHERE user_id = $1", user_id)
            .fetch_one(&state.database.pool)
            .await
            .unwrap();
        Ok(user)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JwtClaims {
    pub sub: String,
    pub exp: usize,
}

impl From<&User> for JwtClaims {
    fn from(user: &User) -> Self {
        let exp = Utc::now() + chrono::Duration::days(7);
        Self {
            sub: user.user_id.clone(),
            exp: exp.timestamp() as usize,
        }
    }
}
