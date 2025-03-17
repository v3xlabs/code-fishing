use std::sync::Arc;

// use channel::ChannelApi;
// use info::InfoApi;
// use media::MediaApi;
use opentelemetry::global;
use party::PartyApi;
use poem::{
    endpoint::StaticFilesEndpoint, get, handler, listener::TcpListener,
    middleware::OpenTelemetryMetrics, EndpointExt, Route, Server,
};
use poem_openapi::{payload::Html, OpenApi, OpenApiService, Tags};

use maps::MapsApi;
use tracing::info;

use crate::state::AppState;
use tracing_mw::TraceId;
use auth::AuthApi;

// pub mod auth;
// pub mod channel;
// pub mod info;
// pub mod media;
// pub mod prom;
// pub mod redirect;
// pub mod request;
// pub mod stats;
pub mod party;
pub mod maps;
pub mod auth;
pub mod tracing_mw;

#[derive(Tags)]
enum ApiTags {
    /// Party Related Operations
    Party,
    /// Maps Related Operations
    Maps,
    /// Auth Related Operations
    Auth,
}

fn get_api() -> impl OpenApi {
    (PartyApi, MapsApi, AuthApi)
}

pub async fn start_http(state: AppState) {
    info!("Starting HTTP server");
    let api_service =
        OpenApiService::new(get_api(), "Code Fishing", "0.0.1").server("http://localhost:3000/api");

    let spec = api_service.spec_endpoint();

    let path = std::path::Path::new("./www");

    let spa_endpoint = StaticFilesEndpoint::new(path)
        .show_files_listing()
        .index_file("index.html")
        .fallback_to_index();

    let app = Route::new()
        .nest("/", spa_endpoint)
        .nest("/openapi.json", spec)
        // .at("/prom", get(prom::route))
        .nest("/docs", get(get_openapi_docs))
        .nest("/api", api_service)
        // .at("/v/:video_id", get(redirect::video_redirect))
        // .at("/v/:video_id/oembed", get(redirect::video_oembed))
        // .nest("/metrics", get(prom::route))
        // .with(OpenTelemetryTracing::new(global::tracer("storedvideo")))
        .with(TraceId::new(Arc::new(global::tracer("storedvideo"))))
        .with(OpenTelemetryMetrics::new())
        .data(state);
    // .with(Cors::new());

    Server::new(TcpListener::bind("0.0.0.0:3000"))
        .run(app)
        .await
        .unwrap();
}

#[handler]
async fn get_openapi_docs() -> Html<&'static str> {
    Html(include_str!("./index.html"))
}
