import { MutationOptions, useMutation } from "@tanstack/react-query";
import { components } from "./schema.gen";
import { useApi } from "./api";

export type PartyCreateResponse = components['schemas']['PartyCreateResponse'];
export type PartyCreateRequest = components['schemas']['PartyCreateRequest'];

export const usePartyCreate = (extra: Partial<MutationOptions<PartyCreateResponse, undefined, PartyCreateRequest>>) => {
    return useMutation({
        mutationFn: async (body: PartyCreateRequest) => {
            const response = await useApi('/party/create', 'post', {
                contentType: 'application/json; charset=utf-8',
                data: body,
            })

            return response.data;
        },
        ...extra,
    })
}
