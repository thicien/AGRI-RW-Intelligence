import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from './AppShell';
import DashboardPage from '../features/dashboard/DashboardPage';
import IntelligenceMapPage from '../features/map/IntelligenceMapPage';
import LandingPage from '../features/landing/LandingPage';
import LoginPage from '../features/auth/LoginPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
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
