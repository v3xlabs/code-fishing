import { createFetch } from "openapi-hooks";
import { paths } from "./schema.gen";
import { authStore, useAuth } from "@/hooks/auth";

export const baseUrl = new URL('/api/', window.location.origin);

let tokenProxy = {
    get value() {
        return authStore.getSnapshot().context.token;
    },
}

export const useApi = createFetch<paths>({
    baseUrl,
    get headers() {
        return {
            Authorization: `Bearer ${tokenProxy.value}`,
        };
    },
});
