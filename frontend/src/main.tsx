import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { router } from './app/router';
import { AuthProvider } from './features/auth/AuthContext';
import './index.css';

// Ensure MapLibre Web Worker is bundled and loaded properly in production Vite builds
try {
  setWorkerUrl(maplibreWorkerUrl);
} catch (err) {
  console.warn('Failed to set MapLibre workerUrl:', err);
}

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
