import { createBrowserRouter } from 'react-router-dom';
import AppShell from './AppShell';
import AdminDashboardPage from '../features/dashboard/AdminDashboardPage';
import IntelligenceMapPage from '../features/map/IntelligenceMapPage';
import LandingPage from '../features/landing/LandingPage';
import LoginPage from '../features/auth/LoginPage';
import PriorityZonesPage from '../features/intelligence/PriorityZonesPage';
import FarmersPage from '../features/agriculture/FarmersPage';
import FarmsPage from '../features/agriculture/FarmsPage';
import CropsSeasonsPage from '../features/agriculture/CropsSeasonsPage';
import AgriculturalDataPage from '../features/agriculture/AgriculturalDataPage';
import RolesPage from '../features/admin/RolesPage';
import AgriculturalIntelligenceHubPage from '../features/intelligence/AgriculturalIntelligenceHubPage';
import Irrigation from '../features/environment/Irrigation';
import SoilConservation from '../features/environment/SoilConservation';
import PostHarvestProcessing from '../features/environment/PostHarvestProcessing';
import ExportImportIntelligence from '../features/trade/ExportImportIntelligence';
import DataManagementPage from '../features/admin/DataManagementPage';

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
    path: '/admin',
    element: <AppShell />,
    children: [
      {
        path: 'dashboard',
        element: <AdminDashboardPage />,
      },
      {
        path: 'analytics',
        element: <AgriculturalIntelligenceHubPage />,
      },
      {
        path: 'intelligence-hub',
        element: <AgriculturalIntelligenceHubPage />,
      },
      {
        path: 'irrigation',
        element: <Irrigation />,
      },
      {
        path: 'soil-conservation',
        element: <SoilConservation />,
      },
      {
        path: 'post-harvest',
        element: <PostHarvestProcessing />,
      },
      {
        path: 'environment',
        element: <AgriculturalIntelligenceHubPage />,
      },
      {
        path: 'energy',
        element: <AgriculturalIntelligenceHubPage />,
      },
      {
        path: 'imports-exports',
        element: <ExportImportIntelligence />,
      },
      {
        path: 'farmers',
        element: <FarmersPage />,
      },
      {
        path: 'farms',
        element: <FarmsPage />,
      },
      {
        path: 'crops',
        element: <CropsSeasonsPage />,
      },
      {
        path: 'agricultural-data',
        element: <AgriculturalDataPage />,
      },
      {
        path: 'roles',
        element: <RolesPage />,
      },
      {
        path: 'users',
        element: <RolesPage />,
      },
      {
        path: 'audit-logs',
        element: <RolesPage />,
      },
      {
        path: 'datasets',
        element: <DataManagementPage />,
      },
      {
        path: 'data-quality',
        element: <DataManagementPage />,
      },
      {
        path: 'priority-zones',
        element: <PriorityZonesPage />,
      },
      {
        path: 'map',
        element: <IntelligenceMapPage />,
      },
      {
        path: 'field-validation',
        element: <AdminDashboardPage />,
      },
      {
        path: 'recommendations',
        element: <div className="p-8"><h2 className="text-2xl font-bold">Recommendations & Policy Briefs</h2></div>,
      },
      {
        path: 'interventions',
        element: <div className="p-8"><h2 className="text-2xl font-bold">Agricultural Interventions</h2></div>,
      },
      {
        path: 'reports',
        element: <div className="p-8"><h2 className="text-2xl font-bold">Evidence Reports & Exports</h2></div>,
      },
    ],
  },
]);
