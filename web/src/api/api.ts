import { createFetch } from "openapi-hooks";

export const useApi = createFetch({ baseUrl: location.origin });
