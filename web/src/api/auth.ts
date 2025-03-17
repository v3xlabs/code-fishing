import { MutationOptions, useMutation, useQuery } from "@tanstack/react-query";
import { components } from "./schema.gen";
import { useApi } from "./api";
import { useAuth } from "@/hooks/auth";

export type GuestResponse = components['schemas']['GuestResponse'];

export const useGuestAuth = (extra?: Partial<MutationOptions<GuestResponse, undefined, undefined>>) => {
    return useMutation({
        mutationFn: async () => {
            const response = await useApi('/auth/guest', 'post', {})

            return response.data;
        },
        ...extra,
    })
}

export const useUser = () => {
    const { token } = useAuth();

    return useQuery({
        queryKey: ['user', token],
        queryFn: async () => {
            const response = await useApi('/auth/user', 'get', {})

            return response.data;
        },
    });
};
