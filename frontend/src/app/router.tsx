import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from './AppShell';
import DashboardPage from '../features/dashboard/DashboardPage';
import IntelligenceMapPage from '../features/map/IntelligenceMapPage';
import LandingPage from '../features/landing/LandingPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <div className="flex h-screen items-center justify-center bg-background"><div className="p-8 bg-surface border border-border-main shadow-lg rounded w-96"><h2 className="text-2xl font-bold text-center mb-6 text-primary">Sign in to your account</h2><input type="text" placeholder="Email" className="w-full mb-4 px-3 py-2 border rounded" /><input type="password" placeholder="Password" className="w-full mb-6 px-3 py-2 border rounded" /><button className="w-full bg-primary text-white py-2 rounded font-medium hover:bg-primary-light transition">Sign In</button></div></div>,
  },
  {
    path: '/app',
    element: <AppShell />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'map',
        element: <IntelligenceMapPage />,
      },
      {
        path: 'priority-zones',
        element: <div className="p-8"><h2 className="text-2xl font-bold">Priority Zones</h2></div>,
      },
      {
        path: 'recommendations',
        element: <div className="p-8"><h2 className="text-2xl font-bold">Recommendations</h2></div>,
      },
      {
        path: 'interventions',
        element: <div className="p-8"><h2 className="text-2xl font-bold">Interventions</h2></div>,
      },
      {
        path: 'reports',
        element: <div className="p-8"><h2 className="text-2xl font-bold">Reports</h2></div>,
      },
    ],
  },
]);
