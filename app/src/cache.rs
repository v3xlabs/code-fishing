use std::time::Duration;

use moka::future::Cache;

use crate::models::bm::player::BattleMetricsPlayerResponse;
use crate::models::bm::recent::BattleMetricsRecentServers;

pub struct AppCache {
    pub bm_user_from_name: Cache<String, BattleMetricsPlayerResponse>,
    pub bm_recent_servers: Cache<String, BattleMetricsRecentServers>,
}

impl AppCache {
    pub fn new() -> Self {
        Self {
            bm_user_from_name: Cache::builder()
                .time_to_live(Duration::from_secs(5 * 60))
                .max_capacity(1000)
                .build(),
            bm_recent_servers: Cache::builder()
                .time_to_live(Duration::from_secs(5 * 60))
                .max_capacity(1000)
                .build(),
        }
    }
}

impl Default for AppCache {
    fn default() -> Self {
        Self::new()
    }
}
