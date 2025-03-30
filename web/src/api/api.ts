import { createFetch } from 'openapi-hooks';
import { paths } from './schema.gen';
import { authStore } from '@/hooks/auth';
import { toast } from 'sonner';

export const baseUrl = new URL('/api/', window.location.origin);

const tokenProxy = {
    get value() {
        return authStore.getSnapshot().context.token;
    },
};

export const useApi = createFetch<paths>({
    baseUrl,
    get headers() {
        return {
            Authorization: `Bearer ${tokenProxy.value}`,
        };
    },
    onError(error: { status: number }) {
        if (error.status === 429) {
            console.error('Rate limit exceeded');
            toast.error('Rate limit exceeded', {
                description: 'Please try again later.',
                duration: 5000,
            });
        }
    },
});
