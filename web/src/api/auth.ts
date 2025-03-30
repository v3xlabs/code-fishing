import { MutationOptions, useMutation, useQuery } from '@tanstack/react-query';
import { components } from './schema.gen';
import { useApi } from './api';
import { useAuth } from '@/hooks/auth';

export type GuestResponse = components['schemas']['GuestResponse'];
export type User = components['schemas']['User'];

export const useGuestAuth = (
    extra?: Partial<MutationOptions<GuestResponse, undefined, undefined>>
) => {
    return useMutation({
        mutationFn: async () => {
            const response = await useApi('/auth/guest', 'post', {});

            return response.data;
        },
        ...extra,
    });
};

export const useUser = () => {
    const { token } = useAuth();

    return useQuery({
        queryKey: ['user', token],
        queryFn: async () => {
            if (!token) {
                return null;
            }

            try {
                console.log('fetching user');
                const response = await useApi('/auth/user', 'get', {
                    fetchOptions: {
                        cache: 'no-store',
                        headers: { Authorization: `Bearer ${token}` },
                    },
                });

                console.log('user response', response.data);

                return response.data;
            } catch (error) {
                console.error('Error fetching user data:', error);

                return null;
            }
        },
        // Use the user from auth context as initialData
        // initialData: user,
        // Only run query if we have a token
        // enabled: !!token,
        // Reasonable refetch settings
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        staleTime: 3000, // Consider data stale after 3 seconds
        refetchInterval: 20000,
    });
};

export const useUserById = (user_id: string) => {
    return useQuery({
        queryKey: ['user', user_id],
        queryFn: async () => {
            const response = await useApi('/auth/user/{user_id}', 'get', { path: { user_id } });

            return response.data;
        },
    });
};
