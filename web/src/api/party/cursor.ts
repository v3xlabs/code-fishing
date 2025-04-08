import { useEffect, useState } from 'react';

import { usePartyCodes } from '../progress';

export const usePartyCursor = (party_id: string) => {
    const { data: allCodes } = usePartyCodes(party_id);
    const [cursor, setCursor] = useState(0);
    const [codes, setCodes] = useState<string[]>([]);
    const [codeCount, setCodeCount] = useState(5);

    useEffect(() => {
        setCodes(allCodes?.slice(cursor, codeCount) ?? []);
    }, [allCodes, codeCount]);

    return { codes, codeCount, setCodeCount };
};
