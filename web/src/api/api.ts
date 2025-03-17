import { createFetch } from "openapi-hooks";
import { paths } from "./schema.gen";
import { authStore, useAuth } from "@/hooks/auth";

export const baseUrl = new URL('/api/', window.location.origin);

export const useApi = createFetch<paths>({
    baseUrl,
    get headers() {
        return {
            Authorization: `Bearer ${authStore.getSnapshot().context.token}`,
        };
    },
});
