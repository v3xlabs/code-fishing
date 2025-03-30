import { createRootRoute,Outlet } from '@tanstack/react-router';
import { Toaster } from 'sonner';

import { Navbar } from '@/components/Navbar';
import { AppWrapper } from '@/hooks/context';

export const Route = createRootRoute({
    component: RootComponent,
});

function RootComponent() {
    return (
        <AppWrapper>
            <Navbar />
            <Outlet />
            <Toaster
                expand={true}
                theme="dark"
                visibleToasts={9}
                mobileOffset={{ top: 48 }}
                toastOptions={{
                    style: {
                        backgroundColor: '#2d2b29',
                        color: '#F5F5F5',
                        border: '1px solid #3F3D3C',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        boxShadow: 'none',
                    },
                }}
            />
        </AppWrapper>
    );
}
