use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct BattleMetricsObjectResponse {
    pub data: BattleMetricsType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub links: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub included: Option<Vec<BattleMetricsType>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BattleMetricsResponse {
    pub data: Vec<BattleMetricsType>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub included: Option<Vec<BattleMetricsType>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub links: Option<serde_json::Value>,
}


#[derive(Debug, Serialize, Deserialize)]
pub struct BattleMetricsType {
    #[serde(rename = "type")]
    pub _type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub attributes: Option<BattleMetricsAttributes>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub relationships: Option<BattleMetricsRelationships>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub meta: Option<BattleMetricsMeta>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BattleMetricsAttributes {
    #[serde(rename = "type")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub _type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ip: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port: Option<u16>,
    #[serde(flatten)]
    pub extra: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BattleMetricsRelationshipData {
    pub data: BattleMetricsRelationshipIdentifier,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BattleMetricsRelationshipIdentifier {
    #[serde(rename = "type")]
    pub _type: String,
    pub id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BattleMetricsRelationships {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub server: Option<BattleMetricsRelationshipData>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub player: Option<BattleMetricsRelationshipData>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub organizations: Option<BattleMetricsRelationshipData>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BattleMetricsMeta {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "timePlayed")]
    pub time_played: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "firstSeen")]
    pub first_seen: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "lastSeen")]
    pub last_seen: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub online: Option<bool>,
}
