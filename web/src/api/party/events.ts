import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useApi } from '../api';
import { components } from '../schema.gen';

// Helper function to get localStorage key for a party's events
const getPartyStorageKey = (partyId: string, cursor?: number | string): string => {
  if (cursor === undefined) {
    return `party_events_${partyId}_initial`;
  } else if (typeof cursor === 'string') {
    return `party_events_${partyId}_${cursor}`;
  } else {
    return `party_events_${partyId}_${cursor}`;
  }
};

// Standalone events fetcher with caching and throttling
class PartyEventsFetcher {
  private cache = new Map<string, {
    pages: components['schemas']['PartyEvent'][][];
    lastCursor?: number;
    currentPage: components['schemas']['PartyEvent'][];
    lastFetchTime: number;
    pendingPromises: Map<number | string, Promise<components['schemas']['PartyEvent'][]>>;
    isLoading: boolean;
    seenEventIds: Set<number>; // Track which event IDs we've already seen
    retryCount: number;
    backoffDelay: number;
    initialPageCached: boolean; // Track if we've cached the initial page
  }>();
  
  private THROTTLE_DELAY = 1000;
  private INITIAL_THROTTLE_DELAY = 2000; // Longer delay for initial requests
  private MAX_BACKOFF_DELAY = 30000; // Maximum backoff delay (30 seconds)
  private PAGE_SIZE = 10;
  
  constructor() {
    this.loadCacheFromLocalStorage();
  }
  
  // Load previously cached pages from localStorage
  private loadCacheFromLocalStorage(): void {
    try {
      // Find all localStorage keys matching our pattern
      const storageKeys = Object.keys(localStorage).filter(key => key.startsWith('party_events_'));
      
      // Group keys by party ID
      const partyKeys = new Map<string, string[]>();
      storageKeys.forEach(key => {
        const partyId = key.split('_')[2];
        if (!partyKeys.has(partyId)) {
          partyKeys.set(partyId, []);
        }
        partyKeys.get(partyId)!.push(key);
      });
      
      // Initialize cache for each party
      partyKeys.forEach((keys, partyId) => {
        if (!this.cache.has(partyId)) {
          this.cache.set(partyId, {
            pages: [],
            currentPage: [],
            lastFetchTime: 0,
            pendingPromises: new Map(),
            isLoading: false,
            seenEventIds: new Set(),
            retryCount: 0,
            backoffDelay: this.THROTTLE_DELAY,
            initialPageCached: false
          });
        }
        
        const cacheEntry = this.cache.get(partyId)!;
        let hasInitialPage = false;
        
        // Load pages from localStorage
        keys.forEach(key => {
          const storedData = localStorage.getItem(key);
          if (storedData) {
            try {
              const page = JSON.parse(storedData) as components['schemas']['PartyEvent'][];
              if (page.length > 0) {
                // Check if this is the initial page
                if (key.endsWith('_initial')) {
                  hasInitialPage = true;
                }
                
                // Add to pages if it's a full page
                if (page.length === this.PAGE_SIZE) {
                  cacheEntry.pages.push(page);
                  // Update lastCursor if appropriate
                  const lastEventId = page[page.length - 1].event_id;
                  if (!cacheEntry.lastCursor || lastEventId > cacheEntry.lastCursor) {
                    cacheEntry.lastCursor = lastEventId;
                  }
                } else if (key.endsWith('_current')) {
                  // Add to current page if it's the current page
                  cacheEntry.currentPage = page;
                } else {
                  // Add to current page if not full
                  cacheEntry.currentPage = [...cacheEntry.currentPage, ...page];
                }
                
                // Track seen event IDs
                page.forEach(event => cacheEntry.seenEventIds.add(event.event_id));
              }
            } catch (e) {
              console.error('Error parsing stored events:', e);
              localStorage.removeItem(key);
            }
          }
        });
        
        // Mark if we have the initial page cached
        cacheEntry.initialPageCached = hasInitialPage;
        
        console.log(`Loaded cache for party ${partyId}, initialPageCached: ${cacheEntry.initialPageCached}`);
      });
      
      console.log('Loaded cached events from localStorage for', partyKeys.size, 'parties');
    } catch (e) {
      console.error('Failed to load cache from localStorage:', e);
    }
  }
  
  resetParty(partyId: string): void {
    // Clear localStorage entries for this party
    const storageKeys = Object.keys(localStorage).filter(key => 
      key.startsWith(`party_events_${partyId}_`));
    
    storageKeys.forEach(key => localStorage.removeItem(key));
    
    // Reset cache
    this.cache.delete(partyId);
  }
  
  isLoading(partyId: string): boolean {
    return this.cache.get(partyId)?.isLoading || false;
  }
  
  // Get cursor for refetching the last page (either the latest cursor or undefined for initial fetch)
  getRefreshCursor(partyId: string): number | undefined {
    const cacheEntry = this.cache.get(partyId);
    
    if (!cacheEntry) return undefined;
    
    // If we have a last cursor but the last page wasn't full, use that cursor
    if (cacheEntry.lastCursor && cacheEntry.pages.length > 0) {
      const lastPage = cacheEntry.pages[cacheEntry.pages.length - 1];
      if (lastPage.length < this.PAGE_SIZE) {
        // Find the last page's first event's ID (or the one before it)
        if (cacheEntry.pages.length > 1) {
          // If we have more than one page, use the last event of the second-to-last page
          const previousPage = cacheEntry.pages[cacheEntry.pages.length - 2];
          return previousPage[previousPage.length - 1].event_id;
        } else if (lastPage.length > 0) {
          // Otherwise, use the first event's ID of the last page minus 1
          return Math.max(0, lastPage[0].event_id - 1);
        }
      }
    }
    
    // If we have a cursor but the last page was full, use that cursor
    if (cacheEntry.lastCursor) {
      return cacheEntry.lastCursor;
    }
    
    // If we've already cached the initial page, we can use undefined
    if (cacheEntry.initialPageCached) {
      return undefined;
    }
    
    // Otherwise, start from the beginning
    return undefined;
  }
  
  async fetchEvents(partyId: string, cursor?: number): Promise<components['schemas']['PartyEvent'][]> {
    // Initialize cache entry if it doesn't exist
    if (!this.cache.has(partyId)) {
      this.cache.set(partyId, {
        pages: [],
        currentPage: [],
        lastFetchTime: 0,
        pendingPromises: new Map(),
        isLoading: false,
        seenEventIds: new Set(),
        retryCount: 0,
        backoffDelay: this.THROTTLE_DELAY,
        initialPageCached: false
      });
    }
    
    const cacheEntry = this.cache.get(partyId)!;
    const now = Date.now();
    
    // Generate a unique key for this request
    const requestKey = cursor === undefined ? 'initial' : cursor.toString();
    const storageKey = getPartyStorageKey(partyId, cursor);
    
    // Check if we have this page in localStorage first
    const storedData = localStorage.getItem(storageKey);
    if (storedData) {
      try {
        const cachedEvents = JSON.parse(storedData) as components['schemas']['PartyEvent'][];
        console.log(`Using ${cachedEvents.length} cached events from localStorage for cursor ${cursor === undefined ? 'initial' : cursor}`);
        
        // Mark initial page as cached if this is the initial request
        if (cursor === undefined) {
          cacheEntry.initialPageCached = true;
        }
        
        // Return the cached data without making an API call
        return Promise.resolve(cachedEvents);
      } catch (e) {
        // If parsing fails, remove the corrupt data
        console.error('Error parsing stored events:', e);
        localStorage.removeItem(storageKey);
      }
    }
    
    // Determine appropriate throttle delay
    const throttleDelay = cursor === undefined ? 
      this.INITIAL_THROTTLE_DELAY : // Use longer delay for initial requests
      cacheEntry.backoffDelay; // Use backoff delay for subsequent requests
    
    // Return cached promise if we're throttling
    if (
      now - cacheEntry.lastFetchTime < throttleDelay &&
      cacheEntry.pendingPromises.has(requestKey)
    ) {
      return cacheEntry.pendingPromises.get(requestKey)!;
    }
    
    cacheEntry.lastFetchTime = now;
    cacheEntry.isLoading = true;
    
    console.log(`Fetching events for party ${partyId} with cursor: ${cursor === undefined ? 'initial' : cursor}, backoff: ${cacheEntry.backoffDelay}ms`);
    
    const promise = useApi('/party/{party_id}/events', 'get', {
      path: { party_id: partyId },
      query: { cursor }
    })
      .then((res) => {
        const events = res.data as components['schemas']['PartyEvent'][];
        
        console.log(`Received ${events.length} events for cursor ${cursor === undefined ? 'initial' : cursor}`);
        
        // Reset backoff on success
        cacheEntry.retryCount = 0;
        cacheEntry.backoffDelay = this.THROTTLE_DELAY;
        
        // Filter out already seen events to avoid duplicates
        const newEvents = events.filter(event => !cacheEntry.seenEventIds.has(event.event_id));
        
        // Add these event IDs to our seen set
        newEvents.forEach(event => cacheEntry.seenEventIds.add(event.event_id));
        
        // Add new events to the current page
        cacheEntry.currentPage = [...cacheEntry.currentPage, ...newEvents];
        
        // If we've accumulated a full page (or more), finalize it
        if (cacheEntry.currentPage.length >= this.PAGE_SIZE) {
          // Sort by event_id to ensure proper order
          cacheEntry.currentPage.sort((a, b) => a.event_id - b.event_id);
          
          // Take exactly PAGE_SIZE items for this page
          const finalizedPage = cacheEntry.currentPage.slice(0, this.PAGE_SIZE);
          
          // Store the finalized page
          cacheEntry.pages.push(finalizedPage);
          console.log(`Finalized page with ${finalizedPage.length} events, last event_id: ${finalizedPage[finalizedPage.length - 1].event_id}`);
          
          // Cache this page in localStorage
          try {
            localStorage.setItem(storageKey, JSON.stringify(finalizedPage));
            console.log(`Cached page in localStorage with key: ${storageKey}`);
            
            // Mark initial page as cached if this is the initial request
            if (cursor === undefined) {
              cacheEntry.initialPageCached = true;
            }
          } catch (e) {
            console.error('Failed to cache page in localStorage:', e);
          }
          
          // Keep any remaining events for the next page
          cacheEntry.currentPage = cacheEntry.currentPage.slice(this.PAGE_SIZE);
          
          // Update the cursor to the last event_id of the finalized page
          cacheEntry.lastCursor = finalizedPage[finalizedPage.length - 1].event_id;
          console.log(`New cursor will be: ${cacheEntry.lastCursor}`);
        } else if (cacheEntry.currentPage.length > 0) {
          // Store current page in localStorage even if not full
          try {
            const currentPageKey = getPartyStorageKey(partyId, 'current');
            localStorage.setItem(currentPageKey, JSON.stringify(cacheEntry.currentPage));
            console.log(`Cached current page in localStorage with ${cacheEntry.currentPage.length} events`);
            
            // Also cache the initial result if this is the initial query
            if (cursor === undefined) {
              localStorage.setItem(storageKey, JSON.stringify(events));
              console.log(`Cached initial page response in localStorage`);
              cacheEntry.initialPageCached = true;
            }
          } catch (e) {
            console.error('Failed to cache current page in localStorage:', e);
          }
        }
        
        return events;
      })
      .catch((err) => {
        console.error('Error fetching events:', err);
        
        // Implement exponential backoff for 429 errors
        if (err?.status === 429) {
          cacheEntry.retryCount++;
          // Exponential backoff with jitter
          const jitter = Math.random() * 1000;
          cacheEntry.backoffDelay = Math.min(
            this.MAX_BACKOFF_DELAY,
            Math.pow(2, cacheEntry.retryCount) * this.THROTTLE_DELAY + jitter
          );
          console.log(`Rate limited. Increasing backoff to ${cacheEntry.backoffDelay}ms`);
        }
        
        return [];
      })
      .finally(() => {
        // Clean up pending promise
        cacheEntry.pendingPromises.delete(requestKey);
        cacheEntry.isLoading = false;
      });
    
    // Store promise in cache
    cacheEntry.pendingPromises.set(requestKey, promise);
    
    return promise;
  }
  
  getEvents(partyId: string): components['schemas']['PartyEvent'][] {
    const cacheEntry = this.cache.get(partyId);
    
    if (!cacheEntry) return [];
    
    // Combine all finalized pages with the current page
    return [...cacheEntry.pages.flat(), ...cacheEntry.currentPage]
      .sort((a, b) => a.event_id - b.event_id);
  }
  
  hasNextPage(partyId: string): boolean {
    const cacheEntry = this.cache.get(partyId);
    
    if (!cacheEntry) return true;
    
    // Check if the most recent page was a full page
    if (cacheEntry.pages.length === 0) return true;
    
    const lastPage = cacheEntry.pages[cacheEntry.pages.length - 1];
    
    return lastPage.length >= this.PAGE_SIZE;
  }
  
  getNextCursor(partyId: string): number | undefined {
    const cacheEntry = this.cache.get(partyId);
    
    if (!cacheEntry) return undefined;
    
    // We should use the last cursor we calculated
    return cacheEntry.lastCursor;
  }
  
  addChangeListener(partyId: string, listener: () => void): () => void {
    if (!this.changeListeners.has(partyId)) {
      this.changeListeners.set(partyId, new Set());
    }
    
    this.changeListeners.get(partyId)!.add(listener);
    
    return () => {
      this.changeListeners.get(partyId)?.delete(listener);
      
      if (this.changeListeners.get(partyId)?.size === 0) {
        this.changeListeners.delete(partyId);
      }
    };
  }
  
  private changeListeners = new Map<string, Set<() => void>>();
  
  notifyListeners(partyId: string): void {
    this.changeListeners.get(partyId)?.forEach(listener => listener());
  }
}

// Global instance of the fetcher
let globalFetcher: PartyEventsFetcher | null = null;

// Refetch trigger for submitting events
const refetchTriggers = new Map<string, Set<() => void>>();

export function usePartyEventsFetcher() {
  // Create the global fetcher if it doesn't exist
  if (!globalFetcher) {
    globalFetcher = new PartyEventsFetcher();
  }
  
  return globalFetcher;
}

export function usePartyEvents<T extends components['schemas']['PartyEvent'] = components['schemas']['PartyEvent']>(
  partyId: string, 
  predicate?: (event: components['schemas']['PartyEvent']) => boolean
) {
  const fetcher = usePartyEventsFetcher();
  const [events, setEvents] = useState<T[]>([]);
  const [error, setError] = useState<Error | null>(null);
  
  // Use refs for internal state to avoid re-renders
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);
  const lastEventCountRef = useRef(0);
  const lastFilteredEventsRef = useRef<T[]>([]);
  
  // Reset fetcher when party changes
  useEffect(() => {
    // Don't reset on mount, so we can use cached data
    const isFirstMount = lastEventCountRef.current === 0;
    
    if (!isFirstMount) {
      fetcher.resetParty(partyId);
    }
    
    fetchingRef.current = false;
    lastEventCountRef.current = 0;
    lastFilteredEventsRef.current = [];
    setEvents([]);
    setError(null);
    
    // Set up refetch trigger subscription
    if (!refetchTriggers.has(partyId)) {
      refetchTriggers.set(partyId, new Set());
    }
    
    const trigger = () => {
      if (!fetchingRef.current) {
        // For refetch triggered by event submission, get the cursor for the last page
        const refreshCursor = fetcher.getRefreshCursor(partyId);
        loadEvents(refreshCursor);
      }
    };
    
    refetchTriggers.get(partyId)!.add(trigger);
    
    return () => {
      mountedRef.current = false;
      refetchTriggers.get(partyId)?.delete(trigger);
      
      if (refetchTriggers.get(partyId)?.size === 0) {
        refetchTriggers.delete(partyId);
      }
    };
  }, [partyId, fetcher]);
  
  // Helper function to load events
  const loadEvents = useCallback(async (cursor?: number) => {
    if (fetchingRef.current) return;
    
    try {
      fetchingRef.current = true;
      await fetcher.fetchEvents(partyId, cursor);
      
      if (mountedRef.current) {
        const allEvents = fetcher.getEvents(partyId);
        const filteredEvents = predicate ? allEvents.filter(predicate) as T[] : allEvents as T[];
        
        // Only update state if the filtered events actually changed
        if (JSON.stringify(filteredEvents) !== JSON.stringify(lastFilteredEventsRef.current)) {
          lastFilteredEventsRef.current = filteredEvents;
          setEvents(filteredEvents);
        }
        
        // Keep track of how many events we've seen
        const currentEventCount = allEvents.length;
        
        // Auto-fetch next page if needed and we got new events
        if (currentEventCount > lastEventCountRef.current && fetcher.hasNextPage(partyId)) {
          lastEventCountRef.current = currentEventCount;
          
          // Get the next cursor
          const nextCursor = fetcher.getNextCursor(partyId);
          
          // Small delay to avoid overwhelming with requests
          setTimeout(() => {
            if (mountedRef.current) {
              loadEvents(nextCursor);
            }
          }, 500); // Increased delay between pagination requests
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [partyId, fetcher, predicate]);
  
  // Initial load and setup change listener
  useEffect(() => {
    mountedRef.current = true;
    
    // Load initial events
    loadEvents();
    
    // Set up event polling if needed, but with a longer interval
    const pollInterval = setInterval(() => {
      if (!fetchingRef.current && mountedRef.current) {
        // For polling, get the cursor for the last page to check for updates
        const refreshCursor = fetcher.getRefreshCursor(partyId);
        loadEvents(refreshCursor);
      }
    }, 10000); // Reduced polling frequency to 10 seconds
    
    return () => {
      mountedRef.current = false;
      clearInterval(pollInterval);
    };
  }, [partyId, fetcher, loadEvents]);
  
  return {
    events,
    isLoading: fetcher.isLoading(partyId),
    error,
    hasNextPage: fetcher.hasNextPage(partyId),
    refetch: () => {
      // For manual refetch, get the cursor for the last page
      const refreshCursor = fetcher.getRefreshCursor(partyId);
      loadEvents(refreshCursor);
    }
  };
}

export type PartyEventData = components['schemas']['PartyEventData'];
export type PartyEvent = components['schemas']['PartyEvent'];

export const usePartyEventSubmit = (party_id: string) =>
  useMutation({
    mutationFn: async (body: PartyEventData) => {
      const response = await useApi('/party/{party_id}/events', 'post', {
        path: { party_id },
        contentType: 'application/json; charset=utf-8',
        data: body,
      });

      // Trigger all registered refetch callbacks
      refetchTriggers.get(party_id)?.forEach(callback => callback());

      return response.data;
    },
  });
  
