import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useApi } from '../api';
import { PartyEvent } from '.';

type FetchResult = PartyEvent[];

const lastRequestCache = new Map<string, {
  cursor?: number;
  timestamp: number;
  promise?: Promise<FetchResult>;
}>();

export function usePartyEvents(party_id: string) {
  // Throttle delay (in ms)
  const THROTTLE_DELAY = 1000;

  // Reset throttling state when party changes.
  useEffect(() => {
    lastRequestCache.set(party_id, { timestamp: 0 });
  }, [party_id]);

  // Fetch function with built-in throttling deduplication.
  const fetchPartyEvents = async ({ pageParam = 0 }): Promise<FetchResult> => {
    const now = Date.now();
    let lastRequest = lastRequestCache.get(party_id);

    if (!lastRequest) {
      lastRequest = { timestamp: 0 };
      lastRequestCache.set(party_id, lastRequest);
    }

    if (
      lastRequest.cursor === pageParam &&
      now - lastRequest.timestamp < THROTTLE_DELAY &&
      lastRequest.promise
    ) {
      return lastRequest.promise;
    }

    lastRequest.cursor = pageParam;
    lastRequest.timestamp = now;

    console.log('fetching events', pageParam);

    // Call the API.
    const promise = useApi('/party/{party_id}/events', 'get', {
      path: { party_id },
      query: { cursor: pageParam },
    })
      .then((res) => res.data as PartyEvent[])
      .catch((err) => {
        console.error('Error fetching events:', err);

        return [];
      });

    lastRequest.promise = promise;

    return promise;
  };

  // Define the infinite query.
  const query = useInfiniteQuery<PartyEvent[], Error>({
    queryKey: ['party', party_id, 'events'],
    queryFn: fetchPartyEvents,
    // If the last page is empty, we indicate that no "next" page is available.
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < 10) return undefined;

      return lastPage[lastPage.length - 1].event_id;
    },
    retry: 3,
    staleTime: 60 * 1000,     // Data is fresh for 1 minute.
    cacheTime: 60 * 60 * 1000, // Keep cached data for 1 hour.
    initialPageParam: 0,
    // Turn off built-in refetchInterval; we handle polling separately.
    refetchInterval: false,
  });

  // If the latest page comes back empty (i.e. no new events), poll every 5 seconds.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const pages = query.data?.pages;
    const lastPage = pages ? pages[pages.length - 1] : undefined;

    if (lastPage && lastPage.length === 0) {
      interval = setInterval(() => {
        query.refetch();
      }, 5000);
    }

    if (lastPage && lastPage.length >= 10) {
      query.fetchNextPage();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [query.data?.pages, query.refetch]);

  return query;
}
