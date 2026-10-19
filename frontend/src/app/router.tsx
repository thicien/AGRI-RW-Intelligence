import { createBrowserRouter, Navigate } from 'react-router-dom';
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
import AgriculturalFacilitiesPage from '../features/facilities/AgriculturalFacilitiesPage';
import DistrictLayout from '../features/district/DistrictLayout';
import DistrictOverviewPage from '../features/district/DistrictOverviewPage';
import DistrictProductivityPage from '../features/district/DistrictProductivityPage';
import DistrictIrrigationPage from '../features/district/DistrictIrrigationPage';
import DistrictSoilPage from '../features/district/DistrictSoilPage';
import DistrictPostHarvestPage from '../features/district/DistrictPostHarvestPage';
import DistrictExportsPage from '../features/district/DistrictExportsPage';
import DistrictMapPage from '../features/district/DistrictMapPage';
import DistrictInterventionsPage from '../features/district/DistrictInterventionsPage';
import DistrictReportsPage from '../features/district/DistrictReportsPage';
import DistrictNotificationsPage from '../features/district/DistrictNotificationsPage';
import DistrictProfilePage from '../features/district/DistrictProfilePage';
import DataManagerLayout from '../features/data-manager/DataManagerLayout';
import DataManagerOverviewPage from '../features/data-manager/DataManagerOverviewPage';
import DatasetsManagementPage from '../features/data-manager/DatasetsManagementPage';
import ImportExtractionPage from '../features/data-manager/ImportExtractionPage';
import ValidationQualityPage from '../features/data-manager/ValidationQualityPage';
import SeasonsCoveragePage from '../features/data-manager/SeasonsCoveragePage';
import ProcessingJobsPage from '../features/data-manager/ProcessingJobsPage';
import AgriculturalDataInspectorPage from '../features/data-manager/AgriculturalDataInspectorPage';
import SpatialDataPage from '../features/data-manager/SpatialDataPage';
import AnalyticsReportsPage from '../features/data-manager/AnalyticsReportsPage';
import DatasetVersionsPage from '../features/data-manager/DatasetVersionsPage';
import DataAuditActivityPage from '../features/data-manager/DataAuditActivityPage';
import DataManagerProfilePage from '../features/data-manager/DataManagerProfilePage';

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
    path: '/district',
    element: <DistrictLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/district/overview" replace />,
      },
      {
        path: 'overview',
        element: <DistrictOverviewPage />,
      },
      {
        path: 'productivity',
        element: <DistrictProductivityPage />,
      },
      {
        path: 'irrigation',
        element: <DistrictIrrigationPage />,
      },
      {
        path: 'soil',
        element: <DistrictSoilPage />,
      },
      {
        path: 'post-harvest',
        element: <DistrictPostHarvestPage />,
      },
      {
        path: 'exports',
        element: <DistrictExportsPage />,
      },
      {
        path: 'map',
        element: <DistrictMapPage />,
      },
      {
        path: 'interventions',
        element: <DistrictInterventionsPage />,
      },
      {
        path: 'reports',
        element: <DistrictReportsPage />,
      },
      {
        path: 'notifications',
        element: <DistrictNotificationsPage />,
      },
      {
        path: 'profile',
        element: <DistrictProfilePage />,
      },
    ],
  },
  {
    path: '/data-manager',
    element: <DataManagerLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/data-manager/overview" replace />,
      },
      {
        path: 'overview',
        element: <DataManagerOverviewPage />,
      },
      {
        path: 'datasets',
        element: <DatasetsManagementPage />,
      },
      {
        path: 'import-extraction',
        element: <ImportExtractionPage />,
      },
      {
        path: 'validation-quality',
        element: <ValidationQualityPage />,
      },
      {
        path: 'seasons-coverage',
        element: <SeasonsCoveragePage />,
      },
      {
        path: 'processing-jobs',
        element: <ProcessingJobsPage />,
      },
      {
        path: 'agricultural-data',
        element: <AgriculturalDataInspectorPage />,
      },
      {
        path: 'spatial-data',
        element: <SpatialDataPage />,
      },
      {
        path: 'analytics-reports',
        element: <AnalyticsReportsPage />,
      },
      {
        path: 'versions',
        element: <DatasetVersionsPage />,
      },
      {
        path: 'audit-logs',
        element: <DataAuditActivityPage />,
      },
      {
        path: 'profile',
        element: <DataManagerProfilePage />,
      },
    ],
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
        path: 'facilities',
        element: <AgriculturalFacilitiesPage />,
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
