use poem::Result;
use poem_openapi::{payload::Json, Object, OpenApi};
use serde::{Deserialize, Serialize};
use sqids::Sqids;
use rand::Rng;

pub struct AuthApi;

#[derive(Deserialize, Serialize, Object)]
pub struct GuestResponse {
    pub token: String,
    pub user: Option<GuestUser>,
}

#[OpenApi]
impl AuthApi {
    #[oai(path = "/auth/guest", method = "post")]
    pub async fn guest(&self) -> Result<Json<GuestResponse>> {
        let new_id = Sqids::default();
        let random_number = rand::thread_rng().gen_range(0..u64::MAX);
        let new_id = new_id.encode(&[0, random_number]).unwrap();

        Ok(Json(GuestResponse {
            token: new_id.clone(),
            user: Some(GuestUser {
                user_id: new_id,
                name: "John Doe".to_string(),
            }),
        }))
    }
}

/**
 * This is a guest user
 */
#[derive(Deserialize, Serialize, Object)]
pub struct GuestUser {
    pub user_id: String,
    pub name: String,
}
