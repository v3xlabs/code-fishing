import {
    MutationOptions,
    queryOptions,
    useMutation,
    useQuery,
} from '@tanstack/react-query';
import * as React from 'react';
import { useMemo, useState } from 'react';

import { LISTS } from '@/util/lists';

import { useApi } from '../api';
import { components } from '../schema.gen';
import { usePartyEvents, usePartyEventSubmit } from './events';

export { usePartyEvents };

export type PartyCreateResponse = components['schemas']['PartyCreateResponse'];
export type PartyCreateRequest = components['schemas']['PartyCreateRequest'];

export const usePartyCreate = (
    extra: Partial<MutationOptions<PartyCreateResponse, undefined, PartyCreateRequest>>
) => {
    return useMutation({
        mutationFn: async (body: PartyCreateRequest) => {
            const response = await useApi('/party', 'post', {
                contentType: 'application/json; charset=utf-8',
                data: body,
            });

            return response.data;
        },
        ...extra,
    });
};

export const getParty = (party_id: string) =>
    queryOptions({
        queryKey: ['party', party_id],
        queryFn: async () => {
            const response = await useApi('/party/{party_id}', 'get', {
                path: {
                    party_id,
                },
            });

            return response.data;
        },
    });

export const useParty = (party_id: string) => {
    return useQuery({
        queryKey: ['party', party_id],
        queryFn: () => getParty(party_id),
    });
};

export type CodeListEntry = {
    name: string; // name of the list
    reverse: boolean; // whether to reverse the list
};

export type CodeListOrder = CodeListEntry[];

// default order
export const defaultListOrder: CodeListOrder = LISTS.map((list) => ({
    name: list.name,
    reverse: false,
}));

export const usePartyListOrder = (
    party_id: string
): {
    data?: CodeListOrder;
    update: (updater: (listOrder: CodeListOrder) => CodeListOrder) => void;
    reset: () => void;
    isDefault: boolean;
} => {
    const { events } = usePartyEvents(party_id, (event) => event.data.type == 'PartyListOrderChanged');
    const { mutate: submitEvent } = usePartyEventSubmit(party_id);
    const [localOrder, setLocalOrder] = useState<CodeListOrder>(defaultListOrder);
    const isDefault = useMemo(() => {
        return localOrder.every(
            (entry, index) =>
                entry.name === defaultListOrder[index].name &&
                entry.reverse === defaultListOrder[index].reverse
        );
    }, [localOrder]);

    // todo update order based on recent party events
    React.useEffect(() => {
        if (events) {
            const fEvents = events;

            // console.log('fEvents', fEvents);
            // @ts-ignore
            const lastEvent = fEvents.at(-1);

            if (lastEvent) {
                setLocalOrder(lastEvent.data.order);
            }
        }
    }, [events]);

    return {
        data: localOrder,
        update: (updater: (listOrder: CodeListOrder) => CodeListOrder) => {
            // todo update order based on recent party events
            const compute = updater(localOrder);

            setLocalOrder(compute);

            console.log('Updating code list order', compute);

            submitEvent({
                type: 'PartyListOrderChanged',
                order: compute,
            });
        },
        reset: () => {
            setLocalOrder(defaultListOrder);

            console.log('Resetting code list order', defaultListOrder);

            submitEvent({
                type: 'PartyListOrderChanged',
                order: defaultListOrder,
            });
        },
        isDefault,
    };
};

export type PartySettings = {
    private: boolean;
    steam_only: boolean;
    location?: {
        lat: number;
        lng: number;
        map_id: string;
    };
    [key: string]: any;
};

export const usePartySettings = (party_id: string) => {
    const { events } = usePartyEvents(party_id, (event) => event.data.type == 'PartySettingChanged');

    console.log('events', events);

    const { mutate: submitEvent } = usePartyEventSubmit(party_id);

    const [localSettings, setLocalSettings] = useState<PartySettings>({
        private: false,
        steam_only: false,
    });

    React.useEffect(() => {
        if (events) {       
            const fEvents = events;

            const settings: PartySettings = {
                private: false,
                steam_only: false,
            };

            for (const event of fEvents) {
                if (event.data.type == 'PartySettingChanged') {
                    if (event.data.setting == 'location') {
                        const data = event.data.value as {
                            lat: number;
                            lng: number;
                            map_id: string;
                        };

                        settings.location = {
                            lat: data.lat,
                            lng: data.lng,
                            map_id: data.map_id,
                        };
                    }

                    settings[event.data.setting] = event.data.value;
                }
            }

            
            // do a deep check for settings if theyre the same otherwise skip
            if (JSON.stringify(settings) !== JSON.stringify(localSettings)) {
                console.log('Updating party settings', settings);
                
                setLocalSettings(settings);
            }
        }
    }, [events, setLocalSettings]);

    return {
        data: localSettings,
        update: (key: keyof PartySettings, value: unknown) => {
            submitEvent({
                type: 'PartySettingChanged',
                setting: key as string,
                value: value,
            });
        },
    };
};
