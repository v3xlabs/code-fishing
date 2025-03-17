import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounce } from "use-debounce";

export type ServerResult = {
    name: string;
    map_id: string;
    ip: string;
    game_port: number;
    last_wipe_utc: string;
};

export type ServerSearchResponse = {
    meta: {
        status: "Success",
        statusCode: 200,
    },
    data: ServerResult[]
};

export const getServerSearch = async (_input: string) => {
    const input = _input.trim();

    if (input.length === 0) {
        return {
            data: [],
        };
    }

    const response = await fetch(`/api/maps/search?search=${encodeURIComponent(input)}`, {})

    return response.json() as Promise<ServerSearchResponse>;
}

export const useServerSearch = (input: string) => {
    const [debouncedInput] = useDebounce(input, 300);

    return useQuery({
        queryKey: ['server-search', debouncedInput],
        queryFn: () => getServerSearch(debouncedInput),
    });
};

export type MapResponse = {
    meta: {
        status: "Success",
        statusCode: 200,
    },
    data: MapResult
};

export type MapResult = {
    "id": "41d038d37cd64053a0900b973c185c2a",
    "type": "Procedural",
    "seed": 2031947583,
    "size": 4500,
    "saveVersion": 265,
    "imageUrl": "https://content.rustmaps.com/maps/265/41d038d37cd64053a0900b973c185c2a/map_raw_normalized.png",
    "tileBaseUrl": "https://content.rustmaps.com/maps/265/41d038d37cd64053a0900b973c185c2a/tiles-webp/{z}/{x}/{y}.webp",
    "imageIconUrl": "https://content.rustmaps.com/maps/265/41d038d37cd64053a0900b973c185c2a/map_icons.png",
    "thumbnail_url": "https://content.rustmaps.com/maps/265/41d038d37cd64053a0900b973c185c2a/thumbnail.webp",
    "undergroundOverlayUrl": "https://content.rustmaps.com/maps/265/41d038d37cd64053a0900b973c185c2a/tunnel/tiles/",
    "buildingBlockAreaUrl": "https://content.rustmaps.com/maps/265/41d038d37cd64053a0900b973c185c2a/building_block.json",
};

const getMap = async (map_id: string) => {
    const response = await fetch(`/api/maps/get?map_id=${encodeURIComponent(map_id)}`, {})

    return response.json() as Promise<MapResponse>;
}

export const useMap = (map_id: string) => {
    return useQuery({
        queryKey: ['map', map_id],
        queryFn: () => getMap(map_id),
    });
}
