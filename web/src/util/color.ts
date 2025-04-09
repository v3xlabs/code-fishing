export const getColor = (seed?: string) => {
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
};
