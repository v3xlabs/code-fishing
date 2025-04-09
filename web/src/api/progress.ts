import { useMemo } from 'react';

import { LISTS, setifyList } from '@/util/lists';

import { PartyEvent, usePartyEvents, usePartyListOrder } from './party';

export const usePartyCodes = (party_id: string) => {
    const { data: listOrder } = usePartyListOrder(party_id);

    // sort LISTS by listOrder and unwrap it to
    const orderedCodes = useMemo(() => {
        // If listOrder doesn't exist yet, just use LISTS as is
        if (!listOrder) {
            return setifyList(LISTS.flatMap((list) => list.codes));
        }

        // Create a map for quick lookup of lists by name
        const listsByName = new Map(LISTS.map((list) => [list.name, list]));

        // Collect all codes in the specified order, applying reversals where needed
        const allCodes = listOrder.flatMap((entry) => {
            const list = listsByName.get(entry.name);

            if (!list) return []; // Skip if list doesn't exist

            // Return the codes array, reversed if needed
            return entry.reverse ? [...list.codes].reverse() : list.codes;
        });

        // Return the deduplicated list of codes
        return setifyList(allCodes);
    }, [listOrder]);

    return { data: orderedCodes };
};

export const usePartyProgress = (party_id: string) => {
    const { data: codes } = usePartyCodes(party_id);
    const { events } = usePartyEvents(party_id, (event) => event.data.type === 'PartyCodesSubmitted');

    const triedCodes = useMemo(() => {
        const codesTried = new Map<string, PartyEvent[]>();

        for (const event of events) {
            if (event.data.type === 'PartyCodesSubmitted') {
                for (const code of event.data.codes) {
                    codesTried.set(code, [...(codesTried.get(code) ?? []), event]);
                }
            }
        }

        return codesTried;
    }, [events]);

    const triedCodesByUserId = useMemo(() => {
        const codesTried = new Map<string, string[]>();

        for (const event of events) {
            if (event.data.type === 'PartyCodesSubmitted') {
                const userCodes = codesTried.get(event.user_id) ?? [];

                for (const code of event.data.codes) {
                    userCodes.push(code);
                }

                codesTried.set(event.user_id, userCodes);
            }
        }

        return codesTried;
    }, [events]);

    const totalCodes = codes.length;

    const percentages = useMemo(() => {
        return (triedCodes.size / totalCodes) * 100;
    }, [triedCodes, totalCodes]);

    return {
        percentages,
        triedCodes,
        triedCodesByUserId,
        totalCodes,
    };
};
