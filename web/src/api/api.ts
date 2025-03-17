import { createFetch } from "openapi-hooks";
import { paths } from "./schema.gen";

const baseUrl = new URL('/api/', window.location.origin);

export const useApi = createFetch<paths>({ baseUrl });
