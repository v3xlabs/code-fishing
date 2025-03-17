use poem::{web::Query, Result, EndpointExt, Route};
use poem_openapi::{payload::PlainText, OpenApi, payload::Html, Tags};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::collections::HashMap;
use reqwest::Client;
use tracing::{info, error, warn};
use crate::state::{AppState, SteamOAuthConfig};
use crate::server::ApiTags;
use async_std::task;
use url::Url;

/// Steam user profile data from the Steam Web API
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SteamUserProfile {
    pub steamid: String,
    pub personaname: Option<String>,
    pub profileurl: Option<String>,
    pub avatar: Option<String>,
}

/// Response structure for Steam Web API player summaries
#[derive(Serialize, Deserialize, Debug)]
struct SteamProfileResponse {
    response: SteamProfileWrapper,
}

/// Wrapper for Steam player profiles in API response
#[derive(Serialize, Deserialize, Debug)]
struct SteamProfileWrapper {
    players: Vec<SteamUserProfile>,
}

/// OAuth API implementation providing Steam authentication
pub struct OAuthApi {
    config: Arc<SteamOAuthConfig>,
    http_client: Client,
    app_state: AppState,
}

/// Steam OpenID provider information.
/// Steam uses OpenID 2.0 specification
const STEAM_OPENID_DISCOVERY_URL: &str = "https://steamcommunity.com/openid";
const STEAM_OPENID_SERVER: &str = "https://steamcommunity.com/openid/login";
const OPENID_NS: &str = "http://specs.openid.net/auth/2.0";

impl OAuthApi {
    /// Create a new OAuth API instance
    pub fn new(app_state: AppState) -> Self {
        let config = app_state.steam_oauth_config.clone();
        
        // Check for common formatting issues with the API key
        if config.web_api_key.contains(" ") || config.web_api_key.contains("\n") || config.web_api_key.contains("\r") {
            error!("Steam API key contains spaces or line breaks. Please check your .env file.");
        }
        
        info!("Using Steam Web API key: {}", config.web_api_key.chars().take(4).collect::<String>() + "****");
        
        // Validate configuration
        if !config.auth_return_url.starts_with("http") {
            warn!("Steam OAuth return URL is invalid: '{}'. Authentication may fail.", config.auth_return_url);
        }
        
        if !config.auth_realm.starts_with("http") {
            warn!("Steam OAuth realm is invalid: '{}'. Authentication may fail.", config.auth_realm);
        }
        
        info!("Initializing Steam OAuth with configuration: return_url={}, realm={}", 
              config.auth_return_url, config.auth_realm);
              
        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()
            .unwrap_or_else(|_| {
                warn!("Failed to build custom HTTP client, using default");
                Client::new()
            });
            
        let instance = Self {
            config: Arc::new(config),
            http_client: client.clone(),
            app_state,
        };
        
        // Spawn a task to test the API key
        Self::test_api_key(instance.config.clone(), client.clone());
        
        instance
    }

    /// Test the Steam API key by making a request to the Steam Web API
    fn test_api_key(config: Arc<SteamOAuthConfig>, client: Client) {
        task::spawn(async move {
            info!("Testing Steam API key validity...");
            let test_url = format!(
                "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={}&steamids=76561197960435530",
                config.web_api_key
            );
            
            match client.get(&test_url).send().await {
                Ok(response) => {
                    let status = response.status();
                    if status.is_success() {
                        info!("Steam API key appears to be valid (status {})", status);
                    } else {
                        let body = response.text().await.unwrap_or_default();
                        error!("Steam API key test failed! Status: {}, Body: {}", status, body);
                        error!("Please check your STEAM_WEB_API_KEY in .env file and ensure:");
                        error!("1. The key is valid and not expired");
                        error!("2. The key has permissions for GetPlayerSummaries");
                        error!("3. If using a domain-restricted key, make sure it allows your testing domain");
                        error!("You can check/update your key at: https://steamcommunity.com/dev/apikey");
                    }
                },
                Err(e) => {
                    error!("Failed to test Steam API key: {}", e);
                }
            }
        });
    }

    /// Extract Steam ID from the claimed_id URL
    fn extract_steam_id(&self, claimed_id: &str) -> Option<String> {
        // Steam claimed IDs are in the format: https://steamcommunity.com/openid/id/{steamid}
        claimed_id.split('/').last().map(|s| s.to_string())
    }

    /// Fetch user profile from Steam API using a Steam ID
    async fn fetch_steam_profile(&self, steam_id: &str) -> Result<SteamUserProfile> {
        let url = format!(
            "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={}&steamids={}",
            self.config.web_api_key, steam_id
        );

        info!("Fetching Steam profile from URL: {}", url.replace(&self.config.web_api_key, "[REDACTED]"));

        let response = self.http_client
            .get(&url)
            .send()
            .await
            .map_err(|e| {
                error!("Failed to fetch Steam profile: {}", e);
                poem::Error::from_string(format!("Failed to fetch Steam profile: {}", e), poem::http::StatusCode::INTERNAL_SERVER_ERROR)
            })?;

        let status = response.status();
        info!("Steam API response status: {}", status);
        
        if !status.is_success() {
            let error_body = response.text().await.unwrap_or_else(|_| "Could not read error response".to_string());
            error!("Steam API error: Status {}, Body: {}", status, error_body);
            
            // Provide specific guidance based on the status code
            if status.as_u16() == 403 {
                error!("STEAM API KEY ISSUE: Your Steam Web API key was rejected (403 Forbidden).");
                error!("Please fix your Steam Web API key by following these steps:");
                error!("1. Visit https://steamcommunity.com/dev/apikey to check your API key");
                error!("2. Verify the domain registered with the key (it should match where you're testing from)");
                error!("3. If testing locally, you might need to create a new API key for localhost");
                error!("4. Check that the key in your .env file matches EXACTLY with no extra spaces or characters");
                error!("5. Current value in .env: STEAM_WEB_API_KEY={}...", self.config.web_api_key.chars().take(4).collect::<String>());
                
                if self.config.auth_return_url.contains("localhost") {
                    error!("NOTE: You're using localhost ({}) but your API key might be registered for a different domain", 
                           self.config.auth_return_url);
                    error!("Options: 1) Register a new API key for localhost, or 2) Test on your production domain");
                }
            } else if status.as_u16() == 429 {
                error!("RATE LIMIT: You've hit Steam's rate limit. Please wait and try again later.");
            }
            
            return Err(poem::Error::from_string(
                format!("Steam API error: Status {}", status), 
                poem::http::StatusCode::INTERNAL_SERVER_ERROR
            ));
        }

        let body = response.text().await.map_err(|e| {
            error!("Failed to read Steam profile response: {}", e);
            poem::Error::from_string(format!("Failed to read Steam profile response: {}", e), poem::http::StatusCode::INTERNAL_SERVER_ERROR)
        })?;

        info!("Received Steam profile response: {}", body);
        
        if body.trim().is_empty() {
            error!("Steam API returned empty response");
            return Err(poem::Error::from_string("Steam API returned empty response", poem::http::StatusCode::INTERNAL_SERVER_ERROR));
        }

        let profile: SteamProfileResponse = match serde_json::from_str(&body) {
            Ok(profile) => profile,
            Err(e) => {
                error!("Failed to parse Steam profile: {}. Response body: {}", e, body);
                return Err(poem::Error::from_string(
                    format!("Failed to parse Steam profile: {}", e),
                    poem::http::StatusCode::INTERNAL_SERVER_ERROR
                ));
            }
        };

        if profile.response.players.is_empty() {
            error!("No player found in Steam response: {}", body);
            return Err(poem::Error::from_string("No player found in Steam response", poem::http::StatusCode::NOT_FOUND));
        }

        let player = profile.response.players.first().unwrap().clone();
        info!("Successfully parsed Steam profile for player ID: {}, name: {:?}", 
              player.steamid, player.personaname);

        Ok(player)
    }
    
    /// Generate the Steam OpenID authentication URL based on discovery URL
    fn generate_auth_url(&self) -> Result<String> {
        info!("Generating auth URL based on discovery URL: {}", STEAM_OPENID_DISCOVERY_URL);
        
        // Generate the authentication URL with OpenID 2.0 parameters based on discovery
        let auth_url = format!(
            "{}?openid.ns={}&openid.realm={}&openid.mode=checkid_setup&openid.return_to={}&openid.identity=http://specs.openid.net/auth/2.0/identifier_select&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select",
            STEAM_OPENID_SERVER,
            urlencoding::encode(OPENID_NS),
            urlencoding::encode(&self.config.auth_realm),
            urlencoding::encode(&self.config.auth_return_url)
        );
        
        info!("Generated Steam authentication URL: {}", auth_url);
        
        Ok(auth_url)
    }
    
    /// Verify an OpenID response from Steam
    async fn verify_steam_response(&self, params: &HashMap<String, String>) -> Result<String> {
        // Ensure the response has the required parameters
        let claimed_id = params.get("openid.claimed_id").ok_or_else(|| {
            error!("No claimed ID in Steam response");
            poem::Error::from_string("No claimed ID in Steam response", poem::http::StatusCode::BAD_REQUEST)
        })?;
        
        let empty = "".to_string();
        let mode = params.get("openid.mode").unwrap_or(&empty);
        if mode != "id_res" {
            error!("Invalid OpenID mode: {}", mode);
            return Err(poem::Error::from_string("Invalid OpenID mode", poem::http::StatusCode::BAD_REQUEST));
        }
        
        // Create validation parameters by converting mode to 'check_authentication'
        let mut validation_params = params.clone();
        validation_params.insert("openid.mode".to_string(), "check_authentication".to_string());
        
        // Send validation request to Steam
        info!("Sending validation request to Steam");
        let response = self.http_client
            .post(STEAM_OPENID_SERVER)
            .form(&validation_params)
            .send()
            .await
            .map_err(|e| {
                error!("Failed to validate Steam response: {}", e);
                poem::Error::from_string("Failed to validate Steam response", poem::http::StatusCode::INTERNAL_SERVER_ERROR)
            })?;
        
        let status = response.status();
        let body = response.text().await.map_err(|e| {
            error!("Failed to read Steam validation response: {}", e);
            poem::Error::from_string("Failed to read Steam validation response", poem::http::StatusCode::INTERNAL_SERVER_ERROR)
        })?;
        
        info!("Steam validation response (status: {}): {}", status, body);
        
        // Check if the response contains is_valid:true
        if !body.contains("is_valid:true") {
            error!("Steam validation failed. Response: {}", body);
            return Err(poem::Error::from_string("Steam authentication validation failed", poem::http::StatusCode::UNAUTHORIZED));
        }
        
        // Extract Steam ID from the claimed_id
        let steam_id = self.extract_steam_id(claimed_id).ok_or_else(|| {
            error!("Failed to extract Steam ID from claimed ID: {}", claimed_id);
            poem::Error::from_string("Failed to extract Steam ID", poem::http::StatusCode::BAD_REQUEST)
        })?;
        
        info!("Successfully validated Steam OpenID response. Steam ID: {}", steam_id);
        
        Ok(steam_id)
    }
}

#[OpenApi]
impl OAuthApi {
    /// Redirect to Steam login page
    #[oai(path = "/auth/oauth/steam", method = "get", tag = "ApiTags::OAuth")]
    async fn steam_login(&self) -> Result<Html<String>> {
        // Detect if we're running on localhost
        let is_localhost = self.config.auth_return_url.contains("localhost") || self.config.auth_return_url.contains("127.0.0.1");
        if is_localhost {
            info!("Detected localhost environment. Note that Steam API key might have domain restrictions.");
        }
        
        // Generate authentication URL based on the Steam OpenID discovery URL
        let auth_url = self.generate_auth_url()?;
        
        // Create a simple HTML page that redirects to Steam
        let html = format!(
            r#"<!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv="refresh" content="0; url={}">
                <title>Redirecting to Steam...</title>
            </head>
            <body>
                <p>Redirecting to Steam login...</p>
                <p>If you are not redirected, <a href="{}">click here</a>.</p>
                <script>
                // Store the intended domain in local storage to handle domain mismatch
                localStorage.setItem('steam_auth_origin', window.location.origin);
                </script>
            </body>
            </html>"#,
            auth_url, auth_url
        );
        
        Ok(Html(html))
    }

    /// Handle Steam OAuth callback
    #[oai(path = "/auth/oauth/steam/callback", method = "get", tag = "ApiTags::OAuth")]
    async fn steam_callback(&self, query: Query<HashMap<String, String>>) -> Result<PlainText<String>> {
        let params = &query.0;
        
        info!("Received Steam callback with parameters: {:?}", params);
        
        // Verify the Steam OpenID response using the discovery information
        let steam_id = self.verify_steam_response(params).await?;
        
        // Fetch user profile
        info!("Fetching Steam user profile for ID: {}", steam_id);
        let profile = self.fetch_steam_profile(&steam_id).await?;
        info!("Successfully fetched Steam profile: {:?}", profile);
        
        // Here you would typically create or update a user record and generate a session token
        // For now, we'll just return some basic info
        let response = serde_json::to_string(&profile).map_err(|e| {
            error!("Failed to serialize profile: {}", e);
            poem::Error::from_string("Failed to serialize profile", poem::http::StatusCode::INTERNAL_SERVER_ERROR)
        })?;
        
        Ok(PlainText(response))
    }
}
