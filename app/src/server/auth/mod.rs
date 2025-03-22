use poem::{web::Data, Result, http::HeaderMap};
use poem_openapi::{payload::Json, Object, OpenApi};
use serde::{Deserialize, Serialize};

pub mod oauth;
pub use oauth::OAuthApi;
pub mod mw;

use crate::{models::user::User, state::AppState};

pub struct AuthApi;

#[derive(Deserialize, Serialize, Object)]
pub struct GuestResponse {
    pub token: String,
    pub user: User,
}

#[OpenApi]
impl AuthApi {
    #[oai(path = "/auth/guest", method = "post")]
    pub async fn guest(&self, state: Data<&AppState>) -> Result<Json<GuestResponse>> {
        let user = User::authorize_by_guest_id(&state).await?;

        Ok(Json(GuestResponse {
            token: user.sign_jwt(&state).await?,
            user,
        }))
    }

    #[oai(path = "/auth/user", method = "get")]
    pub async fn user(
        &self,
        state: Data<&AppState>,
        headers: &HeaderMap,
    ) -> Result<Json<User>> {
        // Extract token from Authorization header
        let auth_header = headers
            .get("Authorization")
            .ok_or_else(|| {
                poem::Error::from_string(
                    "Missing Authorization header",
                    poem::http::StatusCode::UNAUTHORIZED,
                )
            })?
            .to_str()
            .map_err(|_| {
                poem::Error::from_string(
                    "Invalid Authorization header",
                    poem::http::StatusCode::UNAUTHORIZED,
                )
            })?;

        // Check if it starts with "Bearer " and extract the token
        let token = if auth_header.starts_with("Bearer ") {
            auth_header[7..].to_string()
        } else {
            return Err(poem::Error::from_string(
                "Invalid Authorization header format. Expected 'Bearer TOKEN'",
                poem::http::StatusCode::UNAUTHORIZED,
            ));
        };

        // Verify the JWT token and get the user
        let user = User::verify_jwt(&token, &state).await?;
        
        Ok(Json(user))
    }
}

#[derive(Deserialize, Serialize, Object)]
pub struct SteamUser {
    pub steamid: String,
    pub personaname: String,
    pub profileurl: String,
    pub avatar: String,
}
