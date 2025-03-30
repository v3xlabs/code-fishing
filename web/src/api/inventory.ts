import { useQuery } from '@tanstack/react-query';

import { useApi } from './api';
import { components } from './schema.gen';

export type InventoryResponse = components['schemas']['SCMMTotalInventoryResponse'];

export const useSteamInventoryTotal = (steam_id: string) => {
    return useQuery({
        queryKey: ['inventory', 'total', steam_id],
        queryFn: async () => {
            if (!steam_id) {
                return null;
            }

            try {
                const response = await useApi('/inventory/total', 'get', { query: { steam_id } });

                return response.data;
            } catch (error) {
                console.error('Error fetching inventory total:', error);

                return null;
            }
        },
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        staleTime: 3000,
    });
};
