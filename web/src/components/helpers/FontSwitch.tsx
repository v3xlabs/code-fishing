import { FC } from 'react';
import { LuType } from 'react-icons/lu';

import { useApp } from '@/hooks/context';

export const FontSwitch: FC = () => {
    const { toggleFont } = useApp();

    return (
        <>
            <button className="button flex items-center gap-2 w-full" onClick={toggleFont}>
                <LuType />
                <span>Change Font</span>
            </button>
        </>
    );
};
