use poem::{web::Data, Result};
use poem_openapi::{param::Query, payload::Json, Object, OpenApi};
use serde::{Deserialize, Serialize};

use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct MapsApi;

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct SearchResponse {
    pub meta: SearchMeta,
    pub data: Vec<Server>,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct SearchMeta {
    pub status: String,
    #[serde(rename = "statusCode")]
    pub status_code: u32,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct Server {
    pub name: String,
    #[serde(rename = "mapId")]
    pub map_id: String,
    pub ip: String,
    #[serde(rename = "gamePort")]
    pub game_port: u16,
    #[serde(rename = "lastWipeUtc")]
    pub last_wipe_utc: String,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct MapResponse {
    pub meta: MapMeta,
    pub data: MapData,
}

#[derive(Debug, Serialize, Deserialize, Object)]
pub struct MapMeta {
    pub status: String,
    #[serde(rename = "statusCode")]
    pub status_code: u32,
}

/**
 * {
 "meta": {
    "status": "Success",
    "statusCode": 200
},
"data": {
    "id": "41d038d37cd64053a0900b973c185c2a",
    "type": "Procedural",
    "seed": 2031947583,
    "size": 4500,
    "saveVersion": 265,
    "imageUrl": "https://content.rustmaps.com/maps/265/41d038d37cd64053a0900b973c185c2a/map_raw_normalized.png",
    "tileBaseUrl": "https://content.rustmaps.com/maps/265/41d038d37cd64053a0900b973c185c2a/tiles-webp/{z}/{x}/{y}.webp",
    "imageIconUrl": "https://content.rustmaps.com/maps/265/41d038d37cd64053a0900b973c185c2a/map_icons.png",
    "thumbnailUrl": "https://content.rustmaps.com/maps/265/41d038d37cd64053a0900b973c185c2a/thumbnail.webp",
    "undergroundOverlayUrl": "https://content.rustmaps.com/maps/265/41d038d37cd64053a0900b973c185c2a/tunnel/tiles/",
    "buildingBlockAreaUrl": "https://content.rustmaps.com/maps/265/41d038d37cd64053a0900b973c185c2a/building_block.json",
    "isStaging": false,
    "isCustomMap": false,
    "isForSale": false,
    "isFeatured": false,
    "hasCustomMonuments": false,
    "canDownload": false,
    "downloadUrl": null,
    "slug": null,
    "displayName": null,
    "purchaseUrl": null,
    "monuments": [
        {
            "type": "Canyon A",
            "sizeCategory": "UniqueEnvironment",
            "coordinates": {
                "x": 727,
                "y": 940
            },
            "iconPath": "Canyons"
        },
        {
            "type": "Lake A",
            "sizeCategory": "UniqueEnvironment",
            "coordinates": {
                "x": -764,
                "y": 1138
            },
            "iconPath": "Lakes"
        },
        {
            "type": "Lake B",
            "sizeCategory": "UniqueEnvironment",
            "coordinates": {
                "x": 29,
                "y": 108
            },
            "iconPath": "Lakes"
        },
        {
            "type": "Oasis C",
            "sizeCategory": "UniqueEnvironment",
            "coordinates": {
                "x": 1201,
                "y": 387
            },
            "iconPath": "Oases"
        },
        {
            "type": "Oasis A",
            "sizeCategory": "UniqueEnvironment",
            "coordinates": {
                "x": 1142,
                "y": -270
            },
            "iconPath": "Oases"
        },
        {
            "type": "Ferry Terminal",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": 1577,
                "y": -49
            },
            "iconPath": "Ferry_Terminal_1"
        },
        {
            "type": "Large Harbor",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": -1917,
                "y": -227
            },
            "iconPath": "Harbor"
        },
        {
            "type": "Small Harbor",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": -516,
                "y": 1881
            },
            "iconPath": "Harbor"
        },
        {
            "type": "Fishing Village B",
            "sizeCategory": "SmallMonument",
            "coordinates": {
                "x": -2050,
                "y": 883
            },
            "iconPath": "Fishing_Village"
        },
        {
            "type": "Fishing Village A",
            "sizeCategory": "SmallMonument",
            "coordinates": {
                "x": 1893,
                "y": -1551
            },
            "iconPath": "Fishing_Village"
        },
        {
            "type": "Fishing Village C",
            "sizeCategory": "SmallMonument",
            "coordinates": {
                "x": 1369,
                "y": 1910
            },
            "iconPath": "Fishing_Village"
        },
        {
            "type": "Military Base D",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": 1764,
                "y": -1171
            },
            "iconPath": "Military_Base"
        },
        {
            "type": "Arctic Research Base A",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": -1485,
                "y": 241
            },
            "iconPath": "Arctic_Research_Base"
        },
        {
            "type": "Launch Site",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": -852,
                "y": -1134
            },
            "iconPath": "Launch_Site"
        },
        {
            "type": "Outpost",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": -621,
                "y": 451
            },
            "iconPath": "Outpost"
        },
        {
            "type": "Bandit Town",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": 624,
                "y": -327
            },
            "iconPath": "Bandit_Town"
        },
        {
            "type": "Nuclear Missile Silo",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": 1225,
                "y": -1723
            },
            "iconPath": "Nuclear_Missile_Silo"
        },
        {
            "type": "Junkyard",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": 1337,
                "y": 1435
            },
            "iconPath": "Junkyard"
        },
        {
            "type": "Ranch",
            "sizeCategory": "SmallMonument",
            "coordinates": {
                "x": -1410,
                "y": 1043
            },
            "iconPath": "Horse_Stable"
        },
        {
            "type": "Water Treatment",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": -923,
                "y": -316
            },
            "iconPath": "Water_Treatment"
        },
        {
            "type": "Airfield",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": -103,
                "y": 874
            },
            "iconPath": "Airfield"
        },
        {
            "type": "Trainyard",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": 568,
                "y": 224
            },
            "iconPath": "Trainyard"
        },
        {
            "type": "Powerplant",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": 1272,
                "y": -1200
            },
            "iconPath": "Powerplant"
        },
        {
            "type": "Military Tunnels",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": -54,
                "y": -1362
            },
            "iconPath": "Military_Tunnels"
        },
        {
            "type": "Sewer Branch",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": -454,
                "y": -362
            },
            "iconPath": "Sewer_Branch"
        },
        {
            "type": "Hqm Quarry",
            "sizeCategory": "SmallMonument",
            "coordinates": {
                "x": 1895,
                "y": -507
            },
            "iconPath": "Hqm_Quarry"
        },
        {
            "type": "Sphere Tank",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": 16,
                "y": -431
            },
            "iconPath": "Sphere_Tank"
        },
        {
            "type": "Satellite Dish",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": 1625,
                "y": 705
            },
            "iconPath": "Satellite_Dish"
        },
        {
            "type": "Stone Quarry",
            "sizeCategory": "SmallMonument",
            "coordinates": {
                "x": -882,
                "y": -1933
            },
            "iconPath": "Stone_Quarry"
        },
        {
            "type": "Sulfur Quarry",
            "sizeCategory": "SmallMonument",
            "coordinates": {
                "x": -1565,
                "y": -545
            },
            "iconPath": "Sulfur_Quarry"
        },
        {
            "type": "Tunnel Entrance",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1461,
                "y": 1902
            },
            "iconPath": "Tunnel_Entrance"
        },
        {
            "type": "Tunnel Entrance",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1872,
                "y": -1461
            },
            "iconPath": "Tunnel_Entrance"
        },
        {
            "type": "Tunnel Entrance",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1536,
                "y": -1542
            },
            "iconPath": "Tunnel_Entrance"
        },
        {
            "type": "Tunnel Entrance",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1488,
                "y": 1533
            },
            "iconPath": "Tunnel_Entrance"
        },
        {
            "type": "Tunnel Entrance",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 111,
                "y": -144
            },
            "iconPath": "Tunnel_Entrance"
        },
        {
            "type": "Tunnel Entrance",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1680,
                "y": 291
            },
            "iconPath": "Tunnel_Entrance"
        },
        {
            "type": "Tunnel Entrance",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 15,
                "y": 1452
            },
            "iconPath": "Tunnel_Entrance"
        },
        {
            "type": "Tunnel Entrance",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 600,
                "y": -1470
            },
            "iconPath": "Tunnel_Entrance"
        },
        {
            "type": "Tunnel Entrance Transition",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1188,
                "y": 792
            },
            "iconPath": "Tunnel_Entrance_Transition"
        },
        {
            "type": "Tunnel Entrance Transition",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 540,
                "y": 756
            },
            "iconPath": "Tunnel_Entrance_Transition"
        },
        {
            "type": "Water Well D",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 646,
                "y": -1366
            },
            "iconPath": "Water_Well"
        },
        {
            "type": "Water Well C",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -708,
                "y": 710
            },
            "iconPath": "Water_Well"
        },
        {
            "type": "Swamp C",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1369,
                "y": 1515
            },
            "iconPath": "Swamp"
        },
        {
            "type": "Swamp B",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1072,
                "y": -1760
            },
            "iconPath": "Swamp"
        },
        {
            "type": "Swamp A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 820,
                "y": 1560
            },
            "iconPath": "Swamp"
        },
        {
            "type": "Ice Lake 3",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": -710,
                "y": 110
            },
            "iconPath": "Ice_Lake_3"
        },
        {
            "type": "Ice Lake 4",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": -547,
                "y": -1691
            },
            "iconPath": "Ice_Lake_4"
        },
        {
            "type": "Ice Lake 4",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": -1704,
                "y": -355
            },
            "iconPath": "Ice_Lake_4"
        },
        {
            "type": "Gas Station",
            "sizeCategory": "SmallMonument",
            "coordinates": {
                "x": -229,
                "y": 579
            },
            "iconPath": "Gasstation"
        },
        {
            "type": "Radtown",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": 542,
                "y": -1247
            },
            "iconPath": "Radtown"
        },
        {
            "type": "Supermarket",
            "sizeCategory": "SmallMonument",
            "coordinates": {
                "x": 974,
                "y": -97
            },
            "iconPath": "Supermarket"
        },
        {
            "type": "Warehouse",
            "sizeCategory": "SmallMonument",
            "coordinates": {
                "x": 1530,
                "y": -563
            },
            "iconPath": "Warehouse"
        },
        {
            "type": "Warehouse",
            "sizeCategory": "SmallMonument",
            "coordinates": {
                "x": -1429,
                "y": -659
            },
            "iconPath": "Warehouse"
        },
        {
            "type": "Gas Station",
            "sizeCategory": "SmallMonument",
            "coordinates": {
                "x": 380,
                "y": 339
            },
            "iconPath": "Gasstation"
        },
        {
            "type": "Supermarket",
            "sizeCategory": "SmallMonument",
            "coordinates": {
                "x": 1311,
                "y": 955
            },
            "iconPath": "Supermarket"
        },
        {
            "type": "Power Substation Small 2",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1825,
                "y": -84
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Small 2",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 121,
                "y": -1385
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Small 1",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1161,
                "y": 1423
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Small 2",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 81,
                "y": 936
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Small 1",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 698,
                "y": 162
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Small 2",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1772,
                "y": -344
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Small 2",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -505,
                "y": 450
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Small 1",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1051,
                "y": -1358
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Small 2",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1065,
                "y": -412
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 1",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1091,
                "y": -1271
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 1",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1203,
                "y": -1331
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 1",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -551,
                "y": -1046
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 1",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -843,
                "y": -1286
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 1",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -168,
                "y": -1211
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 2",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -581,
                "y": 783
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 2",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -588,
                "y": 566
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 2",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1308,
                "y": -1353
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 2",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1743,
                "y": -1518
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 2",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -348,
                "y": 851
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 1",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1098,
                "y": -1346
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 1",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1346,
                "y": -1803
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 1",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -536,
                "y": -753
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 1",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -798,
                "y": -176
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 1",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -348,
                "y": 1188
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 1",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -641,
                "y": 1826
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 2",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1181,
                "y": 933
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 2",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1128,
                "y": 1406
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 2",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1316,
                "y": 1571
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 2",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1436,
                "y": 1833
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 1",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1473,
                "y": 318
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Power Substation Big 1",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1946,
                "y": 791
            },
            "iconPath": "Transformer"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -114,
                "y": 661
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -176,
                "y": 600
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1091,
                "y": -1310
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline B",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1169,
                "y": -1308
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -653,
                "y": -1211
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -739,
                "y": -1234
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -209,
                "y": -1116
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -581,
                "y": 740
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -596,
                "y": 667
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1402,
                "y": -1424
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1475,
                "y": -1488
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1636,
                "y": -1524
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -258,
                "y": 973
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -448,
                "y": -680
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline B",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -461,
                "y": -596
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -761,
                "y": -195
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -347,
                "y": 1225
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -464,
                "y": 1491
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1188,
                "y": 1053
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1194,
                "y": 1128
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline B",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1169,
                "y": 1335
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline B",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1128,
                "y": 1441
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1435,
                "y": 1660
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1467,
                "y": 1737
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1655,
                "y": 297
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1736,
                "y": 311
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline B",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1841,
                "y": 499
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Powerline A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1884,
                "y": 571
            },
            "iconPath": "Powerline"
        },
        {
            "type": "Cave Large Medium",
            "sizeCategory": "Cave",
            "coordinates": {
                "x": 1791,
                "y": 1396
            },
            "iconPath": "Cave"
        },
        {
            "type": "Cave Small Hard",
            "sizeCategory": "Cave",
            "coordinates": {
                "x": 752,
                "y": -497
            },
            "iconPath": "Cave"
        },
        {
            "type": "Cave Medium Hard",
            "sizeCategory": "Cave",
            "coordinates": {
                "x": -405,
                "y": -1591
            },
            "iconPath": "Cave"
        },
        {
            "type": "Cave Medium Easy",
            "sizeCategory": "Cave",
            "coordinates": {
                "x": -1866,
                "y": 1445
            },
            "iconPath": "Cave"
        },
        {
            "type": "Cave Small Easy",
            "sizeCategory": "Cave",
            "coordinates": {
                "x": 1101,
                "y": -1630
            },
            "iconPath": "Cave"
        },
        {
            "type": "Cave Large Sewers Hard",
            "sizeCategory": "Cave",
            "coordinates": {
                "x": -299,
                "y": -115
            },
            "iconPath": "Cave"
        },
        {
            "type": "Cave Medium Medium",
            "sizeCategory": "Cave",
            "coordinates": {
                "x": 615,
                "y": 600
            },
            "iconPath": "Cave"
        },
        {
            "type": "Cave Small Medium",
            "sizeCategory": "Cave",
            "coordinates": {
                "x": -1676,
                "y": 520
            },
            "iconPath": "Cave"
        },
        {
            "type": "Cave Small Easy",
            "sizeCategory": "Cave",
            "coordinates": {
                "x": 651,
                "y": 1717
            },
            "iconPath": "Cave"
        },
        {
            "type": "Underwater Lab A",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 2247,
                "y": 528
            },
            "iconPath": "Underwater_Lab"
        },
        {
            "type": "Tiny God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 618,
                "y": -939
            },
            "iconPath": "Tiny_God_Rock"
        },
        {
            "type": "Anvil Rock",
            "sizeCategory": "Rock",
            "coordinates": {
                "x": -1050,
                "y": 1438
            },
            "iconPath": "Rocks"
        },
        {
            "type": "Medium God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": -938,
                "y": 1283
            },
            "iconPath": "Medium_God_Rock"
        },
        {
            "type": "Tiny God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 677,
                "y": -681
            },
            "iconPath": "Tiny_God_Rock"
        },
        {
            "type": "3 Wall Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": -953,
                "y": 1390
            },
            "iconPath": "Three_Wall_Rock"
        },
        {
            "type": "Tiny God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": -664,
                "y": 1105
            },
            "iconPath": "Tiny_God_Rock"
        },
        {
            "type": "3 Wall Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": -225,
                "y": 84
            },
            "iconPath": "Three_Wall_Rock"
        },
        {
            "type": "Anvil Rock",
            "sizeCategory": "Rock",
            "coordinates": {
                "x": 1283,
                "y": -621
            },
            "iconPath": "Rocks"
        },
        {
            "type": "Anvil Rock",
            "sizeCategory": "Rock",
            "coordinates": {
                "x": -581,
                "y": 1736
            },
            "iconPath": "Rocks"
        },
        {
            "type": "Tiny God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 595,
                "y": -1179
            },
            "iconPath": "Tiny_God_Rock"
        },
        {
            "type": "Anvil Rock",
            "sizeCategory": "Rock",
            "coordinates": {
                "x": 1201,
                "y": 263
            },
            "iconPath": "Rocks"
        },
        {
            "type": "3 Wall Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 691,
                "y": -935
            },
            "iconPath": "Three_Wall_Rock"
        },
        {
            "type": "3 Wall Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 198,
                "y": 103
            },
            "iconPath": "Three_Wall_Rock"
        },
        {
            "type": "Anvil Rock",
            "sizeCategory": "Rock",
            "coordinates": {
                "x": 1011,
                "y": 109
            },
            "iconPath": "Rocks"
        },
        {
            "type": "Anvil Rock",
            "sizeCategory": "Rock",
            "coordinates": {
                "x": -782,
                "y": 1398
            },
            "iconPath": "Rocks"
        },
        {
            "type": "Tiny God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 934,
                "y": -536
            },
            "iconPath": "Tiny_God_Rock"
        },
        {
            "type": "3 Wall Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 66,
                "y": -611
            },
            "iconPath": "Three_Wall_Rock"
        },
        {
            "type": "3 Wall Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 101,
                "y": 1225
            },
            "iconPath": "Three_Wall_Rock"
        },
        {
            "type": "Large God Rock",
            "sizeCategory": "Rock",
            "coordinates": {
                "x": -181,
                "y": 456
            },
            "iconPath": "Rocks"
        },
        {
            "type": "Tiny God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 1455,
                "y": 781
            },
            "iconPath": "Tiny_God_Rock"
        },
        {
            "type": "3 Wall Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 971,
                "y": 827
            },
            "iconPath": "Three_Wall_Rock"
        },
        {
            "type": "Anvil Rock",
            "sizeCategory": "Rock",
            "coordinates": {
                "x": 1244,
                "y": -170
            },
            "iconPath": "Rocks"
        },
        {
            "type": "Medium God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 938,
                "y": -838
            },
            "iconPath": "Medium_God_Rock"
        },
        {
            "type": "3 Wall Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 852,
                "y": 368
            },
            "iconPath": "Three_Wall_Rock"
        },
        {
            "type": "Anvil Rock",
            "sizeCategory": "Rock",
            "coordinates": {
                "x": 883,
                "y": -514
            },
            "iconPath": "Rocks"
        },
        {
            "type": "3 Wall Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 1329,
                "y": -586
            },
            "iconPath": "Three_Wall_Rock"
        },
        {
            "type": "3 Wall Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": -848,
                "y": 861
            },
            "iconPath": "Three_Wall_Rock"
        },
        {
            "type": "Anvil Rock",
            "sizeCategory": "Rock",
            "coordinates": {
                "x": -211,
                "y": 307
            },
            "iconPath": "Rocks"
        },
        {
            "type": "Tiny God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 1190,
                "y": 1790
            },
            "iconPath": "Tiny_God_Rock"
        },
        {
            "type": "Tiny God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 1064,
                "y": -1514
            },
            "iconPath": "Tiny_God_Rock"
        },
        {
            "type": "Medium God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 403,
                "y": -1290
            },
            "iconPath": "Medium_God_Rock"
        },
        {
            "type": "Tiny God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 1840,
                "y": 1551
            },
            "iconPath": "Tiny_God_Rock"
        },
        {
            "type": "Tiny God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 587,
                "y": -608
            },
            "iconPath": "Tiny_God_Rock"
        },
        {
            "type": "Medium God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 1574,
                "y": -1257
            },
            "iconPath": "Medium_God_Rock"
        },
        {
            "type": "Tiny God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 1697,
                "y": -348
            },
            "iconPath": "Tiny_God_Rock"
        },
        {
            "type": "Anvil Rock",
            "sizeCategory": "Rock",
            "coordinates": {
                "x": -1389,
                "y": 45
            },
            "iconPath": "Rocks"
        },
        {
            "type": "Anvil Rock",
            "sizeCategory": "Rock",
            "coordinates": {
                "x": -523,
                "y": 31
            },
            "iconPath": "Rocks"
        },
        {
            "type": "3 Wall Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": -575,
                "y": -1308
            },
            "iconPath": "Three_Wall_Rock"
        },
        {
            "type": "Anvil Rock",
            "sizeCategory": "Rock",
            "coordinates": {
                "x": -610,
                "y": 316
            },
            "iconPath": "Rocks"
        },
        {
            "type": "Large God Rock",
            "sizeCategory": "Rock",
            "coordinates": {
                "x": -707,
                "y": -90
            },
            "iconPath": "Rocks"
        },
        {
            "type": "3 Wall Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": 157,
                "y": -1214
            },
            "iconPath": "Three_Wall_Rock"
        },
        {
            "type": "Anvil Rock",
            "sizeCategory": "Rock",
            "coordinates": {
                "x": -222,
                "y": -1348
            },
            "iconPath": "Rocks"
        },
        {
            "type": "Medium God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": -1354,
                "y": -1204
            },
            "iconPath": "Medium_God_Rock"
        },
        {
            "type": "Tiny God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": -944,
                "y": -1350
            },
            "iconPath": "Tiny_God_Rock"
        },
        {
            "type": "3 Wall Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": -139,
                "y": -1626
            },
            "iconPath": "Three_Wall_Rock"
        },
        {
            "type": "Medium God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": -431,
                "y": -1326
            },
            "iconPath": "Medium_God_Rock"
        },
        {
            "type": "Tiny God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": -1225,
                "y": -487
            },
            "iconPath": "Tiny_God_Rock"
        },
        {
            "type": "3 Wall Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": -691,
                "y": -1958
            },
            "iconPath": "Three_Wall_Rock"
        },
        {
            "type": "3 Wall Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": -1039,
                "y": -513
            },
            "iconPath": "Three_Wall_Rock"
        },
        {
            "type": "Anvil Rock",
            "sizeCategory": "Rock",
            "coordinates": {
                "x": -1370,
                "y": -518
            },
            "iconPath": "Rocks"
        },
        {
            "type": "Tiny God Rock",
            "sizeCategory": "NotImplemented",
            "coordinates": {
                "x": -640,
                "y": -86
            },
            "iconPath": "Tiny_God_Rock"
        },
        {
            "type": "Small Oilrig",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": -2568,
                "y": -1316
            },
            "iconPath": "Oilrig_Small"
        },
        {
            "type": "Large Oilrig",
            "sizeCategory": "LargeMonument",
            "coordinates": {
                "x": 2580,
                "y": -1912
            },
            "iconPath": "Oilrig_Large"
        },
        {
            "type": "Lighthouse",
            "sizeCategory": "SmallMonument",
            "coordinates": {
                "x": 1506,
                "y": 1224
            },
            "iconPath": "Lighthouse"
        },
        {
            "type": "Lighthouse",
            "sizeCategory": "SmallMonument",
            "coordinates": {
                "x": -1693,
                "y": 1621
            },
            "iconPath": "Lighthouse"
        },
        {
            "type": "Iceberg 2",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -394,
                "y": -1999
            },
            "iconPath": "Iceberg"
        },
        {
            "type": "Iceberg 5",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -205,
                "y": -1974
            },
            "iconPath": "Iceberg"
        },
        {
            "type": "Iceberg 5",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -2030,
                "y": -1156
            },
            "iconPath": "Iceberg"
        },
        {
            "type": "Iceberg 5",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -2008,
                "y": 396
            },
            "iconPath": "Iceberg"
        },
        {
            "type": "Iceberg 2",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1466,
                "y": -1885
            },
            "iconPath": "Iceberg"
        },
        {
            "type": "Iceberg 5",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1326,
                "y": -2044
            },
            "iconPath": "Iceberg"
        },
        {
            "type": "Iceberg 3",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 114,
                "y": -2039
            },
            "iconPath": "Iceberg"
        },
        {
            "type": "Iceberg 2",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1649,
                "y": -1805
            },
            "iconPath": "Iceberg"
        },
        {
            "type": "Iceberg 4",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -2002,
                "y": -1331
            },
            "iconPath": "Iceberg"
        },
        {
            "type": "Tunnel Entrance",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1581,
                "y": -30
            },
            "iconPath": "Tunnel_Entrance"
        },
        {
            "type": "Tunnel Entrance",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1872,
                "y": -215
            },
            "iconPath": "Tunnel_Entrance"
        },
        {
            "type": "Tunnel Entrance",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -468,
                "y": 1794
            },
            "iconPath": "Tunnel_Entrance"
        },
        {
            "type": "Tunnel Entrance",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -1011,
                "y": -1263
            },
            "iconPath": "Tunnel_Entrance"
        },
        {
            "type": "Tunnel Entrance",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -696,
                "y": 380
            },
            "iconPath": "Tunnel_Entrance"
        },
        {
            "type": "Tunnel Entrance",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": -984,
                "y": -191
            },
            "iconPath": "Tunnel_Entrance"
        },
        {
            "type": "Tunnel Entrance",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 77,
                "y": 870
            },
            "iconPath": "Tunnel_Entrance"
        },
        {
            "type": "Tunnel Entrance",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 618,
                "y": 174
            },
            "iconPath": "Tunnel_Entrance"
        },
        {
            "type": "Tunnel Entrance",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 1302,
                "y": -1119
            },
            "iconPath": "Tunnel_Entrance"
        },
        {
            "type": "Tunnel Entrance",
            "sizeCategory": "TinyMonument",
            "coordinates": {
                "x": 17,
                "y": -1308
            },
            "iconPath": "Tunnel_Entrance"
        }
    ],
    "landPercentageOfMap": 60,
    "biomePercentages": {
        "s": 29.094151443981600497175930890,
        "d": 17.827690986804755732757569710,
        "f": 36.953326783932554867230642130,
        "t": 16.124830785281088902835857260
    },
    "islands": 4,
    "totalMonuments": 198,
    "largeMonuments": 21,
    "smallMonuments": 15,
    "tinyMonuments": 91,
    "safezones": 6,
    "caves": 9,
    "rivers": 3,
    "mountains": 0,
    "icebergs": 9,
    "iceLakes": 3,
    "lakes": 2,
    "canyons": 1,
    "oases": 2,
    "buildableRocks": 16,
    "heatMaps": [
        {
            "name": "Bears",
            "url": "https://content.rustmaps.com/maps/265/41d038d37cd64053a0900b973c185c2a/bears/tiles/"
        },
        {
            "name": "Boars",
            "url": "https://content.rustmaps.com/maps/265/41d038d37cd64053a0900b973c185c2a/boars/tiles/"
        },
        {
            "name": "Horses",
            "url": "https://content.rustmaps.com/maps/265/41d038d37cd64053a0900b973c185c2a/horses/tiles/"
        },
        {
            "name": "Hemp",
            "url": "https://content.rustmaps.com/maps/265/41d038d37cd64053a0900b973c185c2a/hemp/tiles/"
        },
        {
            "name": "Nodes",
            "url": "https://content.rustmaps.com/maps/265/41d038d37cd64053a0900b973c185c2a/nodes/tiles/"
        },
        {
            "name": "PlayerSpawns",
            "url": "https://content.rustmaps.com/maps/265/41d038d37cd64053a0900b973c185c2a/playerspawns/tiles/"
        },
        {
            "name": "Berries",
            "url": "https://content.rustmaps.com/maps/265/41d038d37cd64053a0900b973c185c2a/berries/tiles/"
        }
    ],
    "estimatedDeletionDate": null
}
}
 */
#[derive(Debug, Serialize, Deserialize, Object)]
pub struct MapData {
    pub id: String,
    #[serde(rename = "type")]
    pub _type: String,
    pub seed: u64,
    pub size: u32,
    #[serde(rename = "saveVersion")]
    pub save_version: u32,
    #[serde(rename = "imageUrl")]
    pub image_url: String,
    #[serde(rename = "titleBaseUrl")]
    pub title_base_url: Option<String>,
    #[serde(rename = "imageIconUrl")]
    pub image_icon_url: Option<String>,
    #[serde(rename = "thumbnailUrl")]
    pub thumbnail_url: Option<String>,
    #[serde(rename = "undergroundOverlayUrl")]
    pub underground_overlay_url: Option<String>,
    #[serde(rename = "buildingBlockAreaUrl")]
    pub building_block_area_url: Option<String>,
    #[serde(rename = "isStaging")]
    pub is_staging: bool,
    #[serde(rename = "isCustomMap")]
    pub is_custom_map: bool,
    #[serde(rename = "isForSale")]
    pub is_for_sale: bool,
    #[serde(rename = "isFeatured")]
    pub is_featured: bool,
    #[serde(rename = "hasCustomMonuments")]
    pub has_custom_monuments: bool,
    #[serde(rename = "canDownload")]
    pub can_download: bool,
    #[serde(rename = "downloadUrl")]
    pub download_url: Option<String>,
    pub slug: Option<String>,
    pub monuments: Vec<serde_json::Value>,

    #[serde(flatten)]
    pub extra: serde_json::Value,
}

#[OpenApi]
impl MapsApi {
    #[oai(path = "/maps/search", method = "get")]
    async fn search(&self, state: Data<&AppState>, search: Query<String>) -> Result<Json<SearchResponse>> {
        let url = format!("https://api.rustmaps.com/internal/v1/servers/search?input={}", search.0);
        let response = reqwest::get(url).await.unwrap();
        let body = response.text().await.unwrap();
        tracing::info!("{}", body);
        let search_response: SearchResponse = serde_json::from_str(&body).unwrap();
        Ok(Json(search_response))
    }

    #[oai(path = "/maps/get", method = "get")]
    async fn get(&self, state: Data<&AppState>, map_id: Query<String>) -> Result<Json<MapResponse>> {
        let url = format!("https://api.rustmaps.com/internal/v1/maps/{}", map_id.0);
        let response = reqwest::get(url).await.unwrap();
        let body = response.text().await.unwrap();
        tracing::info!("{}", body);
        let map_response: MapResponse = serde_json::from_str(&body).unwrap();
        Ok(Json(map_response))
    }
}
