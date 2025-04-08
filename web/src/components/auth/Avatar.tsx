import * as RadixAvatar from '@radix-ui/react-avatar';
import { FC, useMemo } from 'react';
import { FaCat } from 'react-icons/fa';

import { backgroundColorBySeed } from '@/util/user';

export const Avatar: FC<{ src?: string; seed?: string }> = ({ src, seed }) => {
    // Generate a deterministic color based on the seed string
    const backgroundColor = useMemo(() => {
        return backgroundColorBySeed(seed);
    }, [seed]);

    return (
        <RadixAvatar.Root className="size-8 rounded-md overflow-hidden block">
            <RadixAvatar.Image src={src} alt="avatar" className="w-full h-full object-contain" />
            <RadixAvatar.Fallback
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor }}
            >
                <FaCat className="size-4" />
            </RadixAvatar.Fallback>
        </RadixAvatar.Root>
    );
};
