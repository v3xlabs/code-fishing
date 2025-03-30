import { FC, useMemo } from 'react';
import * as RadixAvatar from '@radix-ui/react-avatar';
import { FaCat } from 'react-icons/fa';

export const Avatar: FC<{ src?: string; seed?: string }> = ({ src, seed }) => {
    // Generate a deterministic color based on the seed string
    const backgroundColor = useMemo(() => {
        if (!seed) return '#e2e8f0'; // Default color if no seed

        // Simple hash function to generate a color from the seed
        let hash = 0;

        for (let i = 0; i < seed.length; i++) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }

        // Convert to hex color
        let color = '#';

        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xff;

            color += ('00' + value.toString(16)).slice(-2);
        }

        return color;
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
