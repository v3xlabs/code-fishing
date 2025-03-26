use poem::{web::Data, Result, http::HeaderMap};
use poem_openapi::param::Path;
use poem_openapi::{payload::Json, Object, OpenApi};
use serde::{Deserialize, Serialize};

pub mod oauth;
pub use oauth::OAuthApi;
pub mod mw;

use crate::{models::user::User, state::AppState};
use crate::server::ApiTags;

pub struct AuthApi;

#[derive(Deserialize, Serialize, Object)]
pub struct GuestResponse {
    pub token: String,
    pub user: User,
}

#[OpenApi]
impl AuthApi {
    /// /auth/guest
    /// 
    /// Sign in as a guest, this allows for anonymous access to the api
    /// This method of authentication comes with limited functionality notably:
    /// - No access to any server specific data
    /// - No access to steam specific data
    /// This is done to restrict load on the server to only authenticated users
    #[oai(path = "/auth/guest", method = "post", tag = "ApiTags::Auth")]
    pub async fn guest(&self, state: Data<&AppState>) -> Result<Json<GuestResponse>> {
        let user = User::authorize_by_guest_id(&state).await?;

        Ok(Json(GuestResponse {
            token: user.sign_jwt(&state).await?,
            user,
        }))
    }

    /// /auth/user
    /// 
    /// Get the currently authenticated user
    #[oai(path = "/auth/user", method = "get", tag = "ApiTags::Auth")]
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
        let token = if let Some(token_str) = auth_header.strip_prefix("Bearer ") {
            token_str.to_string()
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

    /// /auth/user/:user_id
    /// 
    /// Get a user by their user id
    #[oai(path = "/auth/user/:user_id", method = "get", tag = "ApiTags::Auth")]
    pub async fn user_by_id(
        &self,
        state: Data<&AppState>,
        #[oai(style = "simple")] user_id: Path<String>,
    ) -> Result<Json<User>> {
        let user = User::get_by_id(&user_id, &state).await?;

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
