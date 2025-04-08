export const backgroundColorBySeed = (
    seed?: string,
    {
        saturation = 75,
        lightness = 60,
    }: {
        saturation?: number;
        lightness?: number;
    } = { saturation: 75, lightness: 60 }
) => {
    const hash = (str: string) => {
        let hash = 0;

        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }

        return Math.abs(hash % 360);
    };

    const hue = seed ? hash(seed) : 0;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
