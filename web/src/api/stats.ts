import { useQuery } from "@tanstack/react-query";

export type PlayerRustState = {
    "kills": {
        "deer": string;      // Example: "3"
        "bears": string;     // Example: "29"
        "boars": string;     // Example: "54"
        "horses": string;    // Example: "0"
        "wolves": string;    // Example: "24"
        "players": string;   // Example: "1,178"
        "chickens": string;  // Example: "7"
        "scientists": string; // Example: "179"
    },
    "melee": {
        "throws": string;    // Example: "656"
        "strikes": string;   // Example: "113.2k"
    },
    "other": {
        "bps_learned": string;       // Example: "427"
        "cars_shredded": string;     // Example: "15"
        "items_dropped": string;     // Example: "9,095"
        "rockets_fired": string;     // Example: "0"
        "voicechat_time": string;    // Example: "16 hours"
        "items_inspected": string;   // Example: "152"
        "pipes_connected": string;   // Example: "701"
        "wires_connected": string;   // Example: "866"
        "helipad_landings": string;  // Example: "8"
        "barrels_destroyed": string; // Example: "3,575"
        "missions_completed": string; // Example: "0"
    },
    "deaths": {
        "fall": string;          // Example: "27"
        "total": string;         // Example: "3,505"
        "suicide": string;       // Example: "531"
        "self_inflicted": string; // Example: "23"
    },
    "wounds": {
        "healed": string;    // Example: "154"
        "wounded": string;   // Example: "1,365"
        "assisted": string;  // Example: "119"
    },
    "friends": any[],      // Example: []
    "steamid": string;     // Example: "***"
    "bow_hits": {
        "deer": string;      // Example: "5"
        "rate": string;      // Example: "19.03%"
        "bears": string;     // Example: "69"
        "boars": string;     // Example: "50"
        "horses": string;    // Example: "0"
        "chicken": string;   // Example: "1"
        "players": string;   // Example: "539"
        "buildings": string; // Example: "140"
        "shots_fired": string; // Example: "2,832"
    },
    "consumed": {
        "water": string;     // Example: "101.9k"
        "calories": string;  // Example: "388.5k"
    },
    "exposure": {
        "cold": string;      // Example: "138 hours"
        "heat": string;      // Example: "5 hours"
        "comfort": string;   // Example: "171 hours"
        "radiation": string; // Example: "an hour"
    },
    "gathered": {
        "wood": string;           // Example: "366.1k"
        "cloth": string;          // Example: "12,097"
        "scrap": string;          // Example: "73,018"
        "stone": string;          // Example: "295.5k"
        "leather": string;        // Example: "1,012"
        "metal_ore": string;      // Example: "1.10m"
        "low_grade_fuel": string; // Example: "77,560"
    },
    "overview": {
        "time_played": string;       // Example: "1,615 hours"
        "account_created": string;   // Example: "2018-10-25"
        "achievement_count": string; // Example: "61"
        "played_last_2weeks": string; // Example: "86 hours"
    },
    "is_banned": boolean;      // Example: false
    "pvp_stats": {
        "kdr": string;               // Example: "0.44"
        "kills": string;             // Example: "1,178"
        "deaths": string;            // Example: "2,681"
        "headshots": string;         // Example: "1,664"
        "bullets_hit": string;       // Example: "5,129"
        "bullets_fired": string;     // Example: "26,273"
        "headshot_percent": string;  // Example: "32.44%"
        "bullets_hit_percent": string; // Example: "19.52%"
    },
    "avatar_url": string;      // Example: "https://avatars.steamstatic.com/***.jpg"
    "is_private": boolean;     // Example: false
    "bullets_hit": {
        "deer": string;         // Example: "13"
        "bears": string;        // Example: "239"
        "boars": string;        // Example: "194"
        "other": string;        // Example: "54"
        "signs": string;        // Example: "27"
        "horses": string;       // Example: "10"
        "wolves": string;       // Example: "137"
        "players": string;      // Example: "5,129"
        "buildings": string;    // Example: "2,519"
        "dead_players": string; // Example: "384"
    },
    "instruments": {
        "note_binds": string;    // Example: "0"
        "notes_played": string;  // Example: "23,280"
        "full_keyboard": string; // Example: "6"
    },
    "personaname": string;     // Example: "Beekeeper Arsonica"
    "menus_opened": {
        "map": string;        // Example: "91,483"
        "crafting": string;   // Example: "22,339"
        "cupboard": string;   // Example: "11,685"
        "inventory": string;  // Example: "259.8k"
    },
    "shotgun_hits": {
        "other": string;       // Example: "203"
        "players": string;     // Example: "401"
        "buildings": string;   // Example: "131"
        "shots_fired": string; // Example: "1,404"
    },
    "last_update_at": string;  // Example: "2025-03-22T02:34:54.21529+00:00"
    "avatar_full_url": string; // Example: "https://avatars.steamstatic.com/***_full.jpg"
    "building_blocks": {
        "placed": string;     // Example: "37,973"
        "upgraded": string;   // Example: "33,666"
    },
    "avatar_medium_url": string; // Example: "https://avatars.steamstatic.com/***_medium.jpg"
    "since_last_update": string; // Example: "9 seconds"
    "horse_distance_ridden": {
        "miles": string;      // Example: "38.53"
        "kilometers": string; // Example: "62"
    },
    "last_successful_update_at": string; // Example: "2025-03-22T02:34:54.21529+00:00"
}

export const getStats = async (steamId: string) => {
    if (!steamId) return null;

    const response = await fetch("https://ruststats.io/api/rpc/get_profile", {
        "headers": {
          "accept": "*/*",
          "content-type": "application/json",
        },
        "referrer": `https://ruststats.io/profile/${steamId}`,
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": `{"id":"${steamId}"}`,
        "method": "POST",
        "mode": "cors",
        "credentials": "omit"
      });

      return await response.json() as PlayerRustState;
}

export const useStats = (steamId: string | undefined) => {
    return useQuery({
        queryKey: ["rust-stats", steamId],
        queryFn: () => getStats(steamId!),
        enabled: !!steamId,
    });
};
