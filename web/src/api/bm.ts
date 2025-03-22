import { useQuery } from "@tanstack/react-query";
import { components } from "./schema.gen";
import { useApi } from "./api";
import { useAuth } from "@/hooks/auth";
import { useUser } from "./auth";

export type BattleMetricsRecentServers = components['schemas']['BattleMetricsRecentServers'];

export const useBattleMetricsRecentServers = () => {
    const { token } = useAuth();
    const { data: user } = useUser();

    const steam_id = user?.user_id.startsWith('steam:') ? user.user_id.split('steam:')[1] : null;

    return useQuery({
        queryKey: ['bm', 'recent', steam_id],
        queryFn: async () => {
            if (!token || !steam_id) {
                return null;
            }

            try {
                const response = await useApi('/bm/recent', 'get', { fetchOptions: { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } } })
                return response.data;
            } catch (error) {
                console.error('Error fetching recent servers:', error);
                return null;
            }
        },
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        staleTime: 3000,
    });
};
