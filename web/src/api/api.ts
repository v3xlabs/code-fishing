import { createFetch } from "openapi-hooks";
import { paths } from "./schema.gen";

const baseUrl = new URL('http://localhost:5173/api/');

export const useApi = createFetch<paths>({ baseUrl });
