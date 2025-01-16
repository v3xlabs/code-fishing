import './styles/index.css';

import { createRouter, RouterProvider } from '@tanstack/react-router';
import React from 'react';
import ReactDOM from 'react-dom/client';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// import { PageErrorBoundary } from './components/PageErrorBoundary';
// import { defaultPendingComponent } from './components/Router';
import { QueryProvider } from './util/query';

// Create a new router instance
const router = createRouter({
    routeTree,
    // defaultPendingComponent,
    // defaultErrorComponent: PageErrorBoundary,
    context: {
        title: 'Property',
    },
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  // eslint-disable-next-line prettier/prettier, unused-imports/no-unused-vars
  interface Register {
    router: typeof router;
  }
}

// preflightAuth();

ReactDOM.createRoot(document.querySelector('#root')!).render(
    <React.StrictMode>
        <QueryProvider>
            <RouterProvider router={router} />
        </QueryProvider>
    </React.StrictMode>
);
