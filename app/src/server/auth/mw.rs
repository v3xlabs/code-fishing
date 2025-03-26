use poem::{web::Data, FromRequest, Request, RequestBody, Result};
use poem_openapi::{
    registry::{MetaSecurityScheme, Registry},
    ApiExtractor, ApiExtractorType, ExtractParamOptions,
};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};

use crate::{models::user::User, state::AppState};

#[derive(Deserialize, Serialize, Clone)]
pub struct UserToken {
    pub user_id: String
}

#[derive(Clone)]
pub enum AuthUser {
    User(User, AppState),
    None(AppState),
}

// impl AuthUser {
//     pub fn ok(&self) -> Option<&ActiveUser> {
//         match self {
//             AuthUser::Active(user, _) => Some(user),
//             AuthUser::None(_) => None,
//         }
//     }
// }
impl AuthUser {
    pub fn user_id(&self) -> Option<String> {
        match self {
            AuthUser::User(user, _) => Some(user.user_id.clone()),
            AuthUser::None(_) => None,
        }
    }
    pub fn state(&self) -> &AppState {
        match self {
            AuthUser::User(_, state) => state,
            AuthUser::None(state) => state,
        }
    }
    pub fn require_user(&self) -> Result<&User> {
        match self {
            AuthUser::User(user, _) => Ok(user),
            AuthUser::None(_) => Err(poem::Error::from_status(StatusCode::UNAUTHORIZED)),
        }
    }
}

impl<'a> ApiExtractor<'a> for AuthUser {
    const TYPES: &'static [ApiExtractorType] = &[ApiExtractorType::SecurityScheme];

    type ParamType = ();

    type ParamRawType = ();

    async fn from_request(
        req: &'a Request,
        body: &mut RequestBody,
        _param_opts: ExtractParamOptions<Self::ParamType>,
    ) -> Result<Self> {
        let state = <Data<&AppState> as FromRequest>::from_request(req, body).await?;

        let state = state.0;

        // extract cookies from request
        let _cookies = req.headers().get("Cookie").and_then(|x| x.to_str().ok());

        // Extract token from header
        let token = req
            .headers()
            .get("Authorization")
            .and_then(|x| x.to_str().ok())
            .map(|x| x.replace("Bearer ", ""));

        // Token could either be a session token or a pat token
        if token.is_none() {
            return Ok(AuthUser::None(state.clone()));
        }

        let token = token.unwrap();

        // Verify the JWT token and get the user
        let user = User::verify_jwt(&token, state).await?;

        Ok(AuthUser::User(user, state.clone()))
    }

    fn register(registry: &mut Registry) {
        registry.create_security_scheme(
            "AuthToken",
            MetaSecurityScheme {
                ty: "http",
                description: Some("Session token for authentication"),
                name: None,
                key_in: None,
                scheme: Some("bearer"),
                bearer_format: Some("Bearer"),
                flows: None,
                openid_connect_url: None,
            },
        );
    }
    fn security_schemes() -> Vec<&'static str> {
        vec!["AuthToken"]
    }
}
