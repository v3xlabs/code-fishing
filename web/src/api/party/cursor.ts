import { useCallback, useEffect, useState } from 'react';

import { usePartyCodes, usePartyProgress } from '../progress';
import { usePartyEventSubmit } from './events';

export const usePartyCursor = (party_id: string) => {
    const { data: allCodes } = usePartyCodes(party_id);
    const { triedCodes } = usePartyProgress(party_id);
    const [cursor, setCursor] = useState(0);
    const [codes, setCodes] = useState<string[]>([]);
    const [codeCount, setCodeCount] = useState(5);
    const { mutate: submitEvent } = usePartyEventSubmit(party_id);

    useEffect(() => {
        console.log('useEffect', allCodes.length, cursor, codeCount);
        const new_codes = allCodes?.slice(cursor, cursor + codeCount) ?? [];

        console.log('new_codes', new_codes);
        // update the codes to show
        // TODO: due to dependency on `allCodes` this distrubs the local code list if the order is changed
        setCodes(new_codes);
    }, [allCodes, codeCount, cursor]);

    const nextCursor = useCallback((complete: boolean | undefined = false) => {
        if (complete) {
            // go through every of the current codes and mark them as complete
            const remainingCodes = [];

            for (const code of codes) {
                if (!triedCodes.get(code)) {
                    remainingCodes.push(code);
                }
            }

            console.log('remainingCodes', remainingCodes);

            submitEvent({
                type: 'PartyCodesSubmitted',
                codes: remainingCodes,
                user_id: 'deprecated',
            });
        }

        let nextCursor = cursor + codeCount;

        while (triedCodes.has(allCodes[nextCursor])) {
            nextCursor++;
        }

        console.log('nextCursor', nextCursor);

        // update the cursor
        setCursor(nextCursor);
        submitEvent({
            type: 'PartyCursorUpdate',
            cursor: nextCursor.toString(),
            size: codeCount,
            user_id: 'deprecated',
        });

        return nextCursor;
    }, [cursor, codeCount, submitEvent, triedCodes, codes]);

    return { cursor, setCursor, codes, codeCount, setCodeCount, nextCursor };
};
