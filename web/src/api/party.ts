import { infiniteQueryOptions, MutationOptions, queryOptions, useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { components } from "./schema.gen";
import { useApi } from "./api";
import * as React from 'react';
import { queryClient } from "@/util/query";

export type PartyCreateResponse = components['schemas']['PartyCreateResponse'];
export type PartyCreateRequest = components['schemas']['PartyCreateRequest'];

export const usePartyCreate = (extra: Partial<MutationOptions<PartyCreateResponse, undefined, PartyCreateRequest>>) => {
    return useMutation({
        mutationFn: async (body: PartyCreateRequest) => {
            const response = await useApi('/party', 'post', {
                contentType: 'application/json; charset=utf-8',
                data: body,
            })

            return response.data;
        },
        ...extra,
    })
}

export const getParty = (party_id: string) => queryOptions({
    queryKey: ['party', party_id],
    queryFn: async () => {
        const response = await useApi(`/party/{party_id}`, 'get', {
            path: {
                party_id
            }
        });

        return response.data;
    },
})

export const useParty = (party_id: string) => {
    return useQuery({
        queryKey: ['party', party_id],
        queryFn: () => getParty(party_id),
    })
}

export type PartyEventData = components['schemas']['PartyEventData'];
export type PartyEvent = components['schemas']['PartyEvent'];

export const usePartyEventSubmit = (party_id: string) => useMutation({
    mutationFn: async (body: PartyEventData) => {
        const response = await useApi(`/party/{party_id}/events`, 'post', {
            path: { party_id },
            contentType: 'application/json; charset=utf-8',
            data: body,
        });

        queryClient.invalidateQueries({ queryKey: ['party', party_id, 'events'] });
        queryClient.refetchQueries({ queryKey: ['party', party_id, 'events'] });

        return response.data;
    }
});

const internalGetPartyEvents = async (party_id: string, cursor: number): Promise<PartyEvent[]> => {
    try {
        // Try to get data from IndexedDB first
        const cachedData = await getEventFromIndexedDB(party_id, cursor);
        if (cachedData) {
            return cachedData;
        }
    } catch (error) {
        console.error("Error retrieving data from IndexedDB:", error);
    }

    // If no cached data or error occurred, fetch from API
    const response = await useApi(`/party/{party_id}/events`, 'get', {
        path: { party_id },
        query: { cursor },
    });

    // Store the response data in IndexedDB
    try {
        if (response.data && response.data.length > 0) {
            await storeEventInIndexedDB(party_id, cursor, response.data);
        }
    } catch (error) {
        console.error("Error caching party events in IndexedDB:", error);
    }

    return response.data;
}

// Helper function to open IndexedDB connection
const openPartyEventsDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('PartyEventsDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = request.result;
            if (!db.objectStoreNames.contains('events')) {
                // Create an object store to hold party events data
                db.createObjectStore('events', { keyPath: 'id' });
            }
        };
    });
};

// Helper function to store events in IndexedDB
const storeEventInIndexedDB = async (party_id: string, cursor: number, data: PartyEvent[]): Promise<void> => {
    const db = await openPartyEventsDB();
    const transaction = db.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');
    
    return new Promise((resolve, reject) => {
        // Use a composite key combining party_id and cursor
        const request = store.put({
            id: `${party_id}_${cursor}`,
            partyId: party_id,
            cursor: cursor,
            data: data,
            timestamp: Date.now() // Add timestamp for potential expiration logic
        });
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
        
        transaction.oncomplete = () => db.close();
    });
};

// Helper function to retrieve events from IndexedDB
const getEventFromIndexedDB = async (party_id: string, cursor: number): Promise<PartyEvent[] | null> => {
    const db = await openPartyEventsDB();
    const transaction = db.transaction(['events'], 'readonly');
    const store = transaction.objectStore('events');
    
    return new Promise((resolve, reject) => {
        const request = store.get(`${party_id}_${cursor}`);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            if (request.result) {
                resolve(request.result.data);
            } else {
                resolve(null);
            }
        };
        
        transaction.oncomplete = () => db.close();
    });
};

export const getPartyEvents = (party_id: string) => infiniteQueryOptions({
    queryKey: ['party', party_id, 'events'],
    queryFn: async ({ pageParam }) => {
        const response = await internalGetPartyEvents(party_id, pageParam);

        return response;
    },
    getNextPageParam: (lastPage, pages) => {
        if (lastPage.length === 0) {
            return undefined;
        }

        const next_page = lastPage[lastPage.length - 1].event_id;
        return next_page;
    },
    initialPageParam: 2,
    refetchInterval: 5000,
    staleTime: 3000,
});

export const usePartyEvents = (party_id: string) => {
    const query = useInfiniteQuery(getPartyEvents(party_id));

    React.useEffect(() => {
        if (!query.hasNextPage || query.isFetchingNextPage) {
            return;
        }

        query.fetchNextPage();
    }, [
        query.hasNextPage,
        query.isFetchingNextPage,
        query.data?.pages.length,
        query.fetchNextPage
    ]);

    return query;
};
