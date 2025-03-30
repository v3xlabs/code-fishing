import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';

export type ServerResult = {
    name: string;
    map_id: string;
    ip: string;
    game_port: number;
    last_wipe_utc: string;
};

export type ServerSearchResponse = {
    meta: {
        status: 'Success';
        statusCode: 200;
    };
    data: ServerResult[];
};

export const getServerSearch = async (_input: string) => {
    const input = _input.trim();

    if (input.length === 0) {
        return {
            data: [],
        };
    }

    const response = await fetch(`/api/maps/search?search=${encodeURIComponent(input)}`, {});

    return response.json() as Promise<ServerSearchResponse>;
};

export const useServerSearch = (input: string) => {
    const [debouncedInput] = useDebounce(input, 300);

    return useQuery({
        queryKey: ['server-search', debouncedInput],
        queryFn: () => getServerSearch(debouncedInput),
    });
};

export type MapResponse = {
    meta: {
        status: 'Success';
        statusCode: 200;
    };
    data: MapResult;
};

export type MapResult = {
    id: string;
    _type: string;
    seed: number;
    size: number;
    save_version: number;
    image_url: string;
    title_base_url: string | null;
    image_icon_url: string;
    thumbnail_url: string;
    underground_overlay_url: string;
    building_block_area_url: string;
    is_staging: boolean;
    is_custom_map: boolean;
    is_for_sale: boolean;
    is_featured: boolean;
    has_custom_monuments: boolean;
    can_download: boolean;
    download_url: string | null;
    slug: string | null;
    monuments: Monument[];
    extra: {
        tileBaseUrl: string;
        displayName: string | null;
        purchaseUrl: string | null;
        landPercentageOfMap: number;
        biomePercentages: {
            s: number; // sand
            d: number; // desert
            f: number; // forest
            t: number; // tundra
        };
        islands: number;
        totalMonuments: number;
        largeMonuments: number;
        smallMonuments: number;
        tinyMonuments: number;
        safezones: number;
        caves: number;
        rivers: number;
        mountains: number;
        icebergs: number;
        iceLakes: number;
        lakes: number;
        canyons: number;
        oases: number;
        buildableRocks: number;
        heatMaps: HeatMap[];
        estimatedDeletionDate: string | null;
    };
};

export type Monument = {
    type: string;
    sizeCategory: string;
    coordinates: {
        x: number;
        y: number;
    };
    iconPath: string;
};

export type HeatMap = {
    name: string;
    url: string;
};

const getMap = async (map_id: string) => {
    const response = await fetch(`/api/maps/get?map_id=${encodeURIComponent(map_id)}`, {});

    return response.json() as Promise<MapResponse>;
};

export const useMap = (map_id: string) => {
    return useQuery({
        queryKey: ['map', map_id],
        queryFn: () => getMap(map_id),
        // staleTime: 1000 * 60 * 60 * 24, // 24 hours
        enabled: !!map_id,
    });
};
