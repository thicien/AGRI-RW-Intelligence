import { apiUrl } from '../../config/api';
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserPersona {
  id: string;
  name: string;
  email: string;
  roleCode: string;
  roleName: string;
  scopeLevel: 'NATIONAL' | 'DISTRICT' | 'SECTOR' | 'LOCAL';
  district: string | null;
  sector: string | null;
  title: string;
  avatarColor: string;
  avatarInitials: string;
  description: string;
}

export const PRESET_PERSONAS: UserPersona[] = [
  {
    id: 'p-1',
    name: 'Hon. Jean-Claude Musabyimana',
    email: 'admin@agrilens.rw',
    roleCode: 'NATIONAL_PLANNER',
    roleName: 'National Agricultural Planner',
    scopeLevel: 'NATIONAL',
    district: null,
    sector: null,
    title: 'National Agricultural Planner — MINAGRI',
    avatarColor: 'bg-emerald-700 text-white',
    avatarInitials: 'JM',
    description: 'National agricultural intelligence, seasonal performance, policy analytics, opportunity assessments, and evidence planning across Rwanda.'
  },
  {
    id: 'p-admin',
    name: 'System Administrator',
    email: 'sysadmin@agrilens.gov.rw',
    roleCode: 'PLATFORM_ADMIN',
    roleName: 'Platform Administrator',
    scopeLevel: 'NATIONAL',
    district: null,
    sector: null,
    title: 'System Administrator — Technical Governance Center',
    avatarColor: 'bg-slate-900 text-emerald-400',
    avatarInitials: 'SA',
    description: 'Technical operation, security, user account management, RBAC, system health monitoring, and auditability.'
  },
  {
    id: 'p-2',
    name: 'Claudine Uwera',
    email: 'datamanager@nisr.gov.rw',
    roleCode: 'DATA_MANAGER',
    roleName: 'Data Manager',
    scopeLevel: 'NATIONAL',
    district: null,
    sector: null,
    title: 'NISR Principal Agricultural Statistician',
    avatarColor: 'bg-warning text-black font-bold',
    avatarInitials: 'DM',
    description: 'Manages dataset imports, validation pipelines, data correction, and publication approvals.'
  },
  {
    id: 'p-3',
    name: 'Dr. Telesphore Ndabamenye',
    email: 'planner@minagri.gov.rw',
    roleCode: 'NATIONAL_PLANNER',
    roleName: 'National Agricultural Planner',
    scopeLevel: 'NATIONAL',
    district: null,
    sector: null,
    title: 'MINAGRI Director General of Planning',
    avatarColor: 'bg-success text-white',
    avatarInitials: 'NP',
    description: 'National overview, macro crop productivity, cross-season analytics, and strategic opportunity assessment.'
  },
  {
    id: 'p-4',
    name: 'Patrick Gasana',
    email: 'district.nyagatare@minagri.gov.rw',
    roleCode: 'DISTRICT_OFFICER',
    roleName: 'District Agricultural Officer',
    scopeLevel: 'DISTRICT',
    district: 'Nyagatare',
    sector: null,
    title: 'District Agricultural Officer — Nyagatare',
    avatarColor: 'bg-primary text-white',
    avatarInitials: 'DO',
    description: 'Scoped to Nyagatare District. Accesses local yields, sector rankings, local irrigation, and post-harvest.'
  },
  {
    id: 'p-5',
    name: 'Aline Mukamana',
    email: 'sector.rukomo@minagri.gov.rw',
    roleCode: 'SECTOR_OFFICER',
    roleName: 'Sector Agricultural Officer',
    scopeLevel: 'SECTOR',
    district: 'Nyagatare',
    sector: 'Rukomo',
    title: 'Sector Agronomist — Rukomo Sector',
    avatarColor: 'bg-emerald-600 text-white',
    avatarInitials: 'SO',
    description: 'Scoped to Rukomo Sector. Tracks local crop yields and submits ground-truth field observations.'
  },
  {
    id: 'p-6',
    name: 'Prof. Innocent Ndikumana',
    email: 'researcher@ur.ac.rw',
    roleCode: 'RESEARCHER_ANALYST',
    roleName: 'Researcher or Data Analyst',
    scopeLevel: 'NATIONAL',
    district: null,
    sector: null,
    title: 'Senior AgTech Researcher — University of Rwanda',
    avatarColor: 'bg-purple-600 text-white',
    avatarInitials: 'RA',
    description: 'Deep analytical modeling, cross-seasonal regression (2014–2026A), and research data export.'
  },
  {
    id: 'p-7',
    name: 'Emmanuel Habimana',
    email: 'farmer.coop@agrilens.rw',
    roleCode: 'COOPERATIVE_FARMER',
    roleName: 'Cooperative or Farmer User',
    scopeLevel: 'LOCAL',
    district: 'Nyagatare',
    sector: 'Rukomo',
    title: 'President — Nyagatare Rice Producers Coop',
    avatarColor: 'bg-amber-600 text-white',
    avatarInitials: 'FC',
    description: 'Seasonal crop calendars, nearby warehouse capacity, commodity market prices, and feedback.'
  },
  {
    id: 'p-8',
    name: 'Sarah Jenkins',
    email: 'viewer.partner@worldbank.org',
    roleCode: 'PARTNER_VIEWER',
    roleName: 'Partner, Policymaker or Viewer',
    scopeLevel: 'NATIONAL',
    district: null,
    sector: null,
    title: 'Agriculture Program Lead — Development Partner',
    avatarColor: 'bg-slate-500 text-white',
    avatarInitials: 'PV',
    description: 'Public dashboards, published maps, executive reports, and aggregate indicators. Read-only.'
  }
];

interface AuthContextType {
  currentUser: UserPersona;
  allPersonas: UserPersona[];
  switchPersona: (personaIdOrCode: string) => void;
  updateGeographicScope: (district: string | null, sector: string | null) => void;
  hasPermission: (capCode: string) => boolean;
  canAccessRoute: (routePath: string) => { allowed: boolean; reason?: string };
  verifyBackendExport: (exportType: 'REPORT' | 'RAW_DATA', datasetName: string, requestedDistrict?: string) => Promise<{ allowed: boolean; auditToken?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserPersona>(() => {
    const saved = localStorage.getItem('agrilens_active_persona');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const match = PRESET_PERSONAS.find(p => p.roleCode === parsed.roleCode);
        if (match) return { ...match, ...parsed };
      } catch (e) {
        // Fallback
      }
    }
    return PRESET_PERSONAS[0]; // Default to Platform Admin for initial exploration
  });

  useEffect(() => {
    localStorage.setItem('agrilens_active_persona', JSON.stringify(currentUser));
  }, [currentUser]);

  const switchPersona = (personaIdOrCode: string) => {
    const found = PRESET_PERSONAS.find(p => p.id === personaIdOrCode || p.roleCode === personaIdOrCode);
    if (found) {
      setCurrentUser(found);
    }
  };

  const updateGeographicScope = (district: string | null, sector: string | null) => {
    setCurrentUser(prev => ({
      ...prev,
      district,
      sector
    }));
  };

  // Route Permission Rules based on Section 4.1 & 4.2
  const canAccessRoute = (routePath: string): { allowed: boolean; reason?: string } => {
    const role = currentUser.roleCode;

    // Platform Admin has access to all routes
    if (role === 'PLATFORM_ADMIN') return { allowed: true };

    // Administration routes
    if (routePath.includes('/admin/users') || routePath.includes('/admin/audit-logs') || routePath.includes('/admin/settings')) {
      if (role !== 'PLATFORM_ADMIN') {
        return { 
          allowed: false, 
          reason: `Access Restricted: Route requires Platform Administrator privileges. Current role is ${currentUser.roleName}.` 
        };
      }
    }

    // Roles and Permissions Page:
    // Allow viewing by Admin and Researchers/Planners for policy preview, but block Farmers/Viewers from configuration
    if (routePath.includes('/admin/roles')) {
      return { allowed: true };
    }

    // Data Management routes (Datasets, Data Quality)
    if (routePath.includes('/admin/datasets') || routePath.includes('/admin/data-quality')) {
      if (role !== 'DATA_MANAGER' && role !== 'PLATFORM_ADMIN') {
        return { 
          allowed: false, 
          reason: `Data Governance Restriction: Ingestion and Dataset Management is restricted to Data Managers and Platform Administrators.` 
        };
      }
    }

    // Farmer and Cooperative Users have a tailored simplified portal
    if (role === 'COOPERATIVE_FARMER') {
      const allowedForFarmer = [
        '/admin/dashboard',
        '/admin/crops',
        '/admin/post-harvest',
        '/admin/map',
        '/admin/reports'
      ];
      const match = allowedForFarmer.some(r => routePath.startsWith(r));
      if (!match) {
        return {
          allowed: false,
          reason: 'Access Restricted: Cooperative & Farmer users have access to seasonal advisories, post-harvest facilities, and market indicators.'
        };
      }
    }

    return { allowed: true };
  };

  const hasPermission = (capCode: string): boolean => {
    const role = currentUser.roleCode;
    switch (capCode) {
      case 'VIEW_PUBLISHED_DASHBOARDS':
        return true;
      case 'VIEW_RAW_SOURCE_FILES':
        return role === 'PLATFORM_ADMIN' || role === 'DATA_MANAGER' || role === 'RESEARCHER_ANALYST';
      case 'UPLOAD_DATASETS':
      case 'VALIDATE_IMPORTED_RECORDS':
        return role === 'PLATFORM_ADMIN' || role === 'DATA_MANAGER';
      case 'APPROVE_DATASET_PUBLICATION':
        return role === 'DATA_MANAGER' || role === 'PLATFORM_ADMIN';
      case 'EXPORT_RAW_DATA':
        return role === 'PLATFORM_ADMIN' || role === 'DATA_MANAGER' || role === 'RESEARCHER_ANALYST';
      case 'EXPORT_REPORTS':
        return role !== 'COOPERATIVE_FARMER' || true;
      case 'MANAGE_USERS_ROLES':
      case 'VIEW_SECURITY_AUDIT_LOGS':
        return role === 'PLATFORM_ADMIN';
      case 'SUBMIT_FIELD_OBSERVATIONS':
        return role === 'SECTOR_OFFICER' || role === 'DISTRICT_OFFICER' || role === 'COOPERATIVE_FARMER' || role === 'PLATFORM_ADMIN';
      default:
        return true;
    }
  };

  const verifyBackendExport = async (
    exportType: 'REPORT' | 'RAW_DATA',
    datasetName: string,
    requestedDistrict?: string
  ): Promise<{ allowed: boolean; auditToken?: string; error?: string }> => {
    try {
      const res = await fetch(apiUrl('auth/export-check'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          roleCode: currentUser.roleCode,
          exportType,
          requestedDistrict: requestedDistrict || currentUser.district || undefined,
          datasetName
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return { allowed: false, error: data.message || 'Export forbidden by backend security check.' };
      }
      return { allowed: true, auditToken: data.auditToken };
    } catch (e: any) {
      return { allowed: false, error: e.message || 'Failed to connect to backend security guard.' };
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      allPersonas: PRESET_PERSONAS,
      switchPersona,
      updateGeographicScope,
      hasPermission,
      canAccessRoute,
      verifyBackendExport
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
