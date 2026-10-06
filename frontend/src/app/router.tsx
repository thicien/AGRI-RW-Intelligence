import { createBrowserRouter } from 'react-router-dom';
import AppShell from './AppShell';
import DashboardPage from '../features/dashboard/DashboardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'map',
        element: <div className="p-4">Intelligence Map (To be implemented)</div>,
      },
      {
        path: 'priority-zones',
        element: <div className="p-4">Priority Zones (To be implemented)</div>,
      },
      {
        path: 'recommendations',
        element: <div className="p-4">Recommendations (To be implemented)</div>,
      },
      {
        path: 'interventions',
        element: <div className="p-4">Interventions (To be implemented)</div>,
      },
      {
        path: 'reports',
        element: <div className="p-4">Reports (To be implemented)</div>,
      },
      {
        index: true,
        element: <div className="p-4 flex h-full items-center justify-center flex-col"><h2 className="text-2xl font-semibold mb-2">Welcome to AgriLens Rwanda</h2><p className="text-muted">Select a module from the sidebar to begin.</p></div>,
      }
    ],
  },
]);
