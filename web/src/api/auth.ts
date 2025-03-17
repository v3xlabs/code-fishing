import { MutationOptions, useMutation } from "@tanstack/react-query";
import { components } from "./schema.gen";
import { useApi } from "./api";

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
