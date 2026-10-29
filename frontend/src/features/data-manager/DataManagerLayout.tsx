import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Database, LayoutDashboard, FileSpreadsheet, CheckCircle2, 
  Calendar, Cog, Layers, MapPin, FileBarChart, GitBranch, 
  Activity, UserCheck, ShieldCheck, LogOut, Menu, X, 
  Search, RefreshCw, AlertTriangle, Shield, Check, ArrowRight,
  UploadCloud, FileText, ChevronRight
} from 'lucide-react';

export default function DataManagerLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [dataManager, setDataManager] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    roleName: string;
    scopeLevel: string;
  }>(() => {
    const saved = localStorage.getItem('agrilens_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.role === 'DATA_MANAGER') return u;
      } catch (e) {}
    }
    return {
      id: 'a77a5846-4732-4308-9ced-c99d06e577fe',
      name: 'Jean-Paul Habimana',
      email: 'datamanager@agrilens.gov.rw',
      role: 'DATA_MANAGER',
      roleName: 'Chief Data Manager & Quality Controller',
      scopeLevel: 'NATIONAL_DOMAINS'
    };
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<'HEALTHY' | 'SYNCING'>('HEALTHY');

  // The 12 Official Pages for Data Manager (Section 3)
  const navItems = [
    { path: '/data-manager/overview', label: 'Overview', icon: LayoutDashboard },
    { path: '/data-manager/datasets', label: 'Datasets', icon: Database },
    { path: '/data-manager/import-extraction', label: 'Import & Extraction', icon: UploadCloud },
    { path: '/data-manager/validation-quality', label: 'Validation & Quality', icon: CheckCircle2, badge: '3 Issues' },
    { path: '/data-manager/seasons-coverage', label: 'Seasons & Coverage', icon: Calendar },
    { path: '/data-manager/processing-jobs', label: 'Processing Jobs', icon: Cog },
    { path: '/data-manager/agricultural-data', label: 'Agricultural Data', icon: Layers },
    { path: '/data-manager/spatial-data', label: 'Maps & Spatial Data', icon: MapPin },
    { path: '/data-manager/analytics-reports', label: 'Analytics & Reports', icon: FileBarChart },
    { path: '/data-manager/versions', label: 'Dataset Versions', icon: GitBranch },
    { path: '/data-manager/audit-logs', label: 'Audit & Activity', icon: Activity },
    { path: '/data-manager/profile', label: 'Profile & Security', icon: UserCheck },
  ];

  const handleLogout = () => {
    localStorage.removeItem('agrilens_token');
    localStorage.removeItem('agrilens_user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] font-sans text-slate-800 overflow-hidden">
      
      {/* 1. SIDEBAR - Matching AgriLens Reference Background & Layout */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-72 text-white flex flex-col flex-shrink-0 shadow-2xl border-r border-[#1B4D33]/40 relative overflow-hidden transition-transform duration-200 ease-in-out
          lg:static lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          backgroundImage: "url('/sidebar_bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#063124'
        }}
      >
        {/* Dark gradient overlay for high contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#063124]/92 via-[#073627]/75 to-transparent pointer-events-none z-0" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none z-0" />

        {/* Brand Header */}
        <div className="h-20 flex items-center px-5 border-b border-white/10 relative z-10 backdrop-blur-[2px]">
          <img src="/logo.png?v=2" alt="AgriLens Logo" className="w-9 h-9 mr-3 object-contain flex-shrink-0 drop-shadow" />
          <div>
            <div className="font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
              AgriLens <span className="font-light text-emerald-300">Rwanda</span>
            </div>
            <div className="text-[11px] text-[#5CE68B] font-semibold tracking-tight mt-0.5 drop-shadow-xs uppercase">
              Data Management Workspace
            </div>
          </div>
        </div>

        {/* Navigation Items (The 12 Official Pages) */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 relative z-10 custom-scrollbar">
          <div className="px-3 pb-2 text-[10px] font-extrabold text-[#7CB998] uppercase tracking-wider drop-shadow-xs">
            Data Operations (12 Pages)
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs font-medium
                  ${isActive 
                    ? 'bg-[#155333]/90 text-white font-semibold shadow-sm border-l-4 border-[#34D399] pl-2.5 backdrop-blur-xs' 
                    : 'text-[#A5CDB8] hover:bg-white/10 hover:text-white border-l-4 border-transparent pl-2.5'}
                `}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#8DBCA3]'}`} />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${isActive ? 'bg-[#34D399] text-[#063124]' : 'bg-amber-500/20 text-amber-300'}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Data Manager Profile & Security Footer */}
        <div className="p-3.5 border-t border-white/10 relative z-10 flex-shrink-0 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pipeline RBAC Active</span>
            </div>
            <button 
              onClick={handleLogout}
              title="Sign Out"
              className="text-red-300 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/10 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow">
              {dataManager.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate leading-snug">
                {dataManager.name}
              </div>
              <div className="text-[10px] text-emerald-300/80 truncate">
                Data Manager · National Repository
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 z-10 shadow-xs">
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 text-slate-600"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-700" />
                  Agricultural Data Governance & Quality Workspace
                </span>
                <span className="hidden sm:inline-block text-xs text-slate-400">•</span>
                <span className="hidden sm:inline-block text-xs font-medium text-slate-500">
                  NISR SAS Multiseasonal Pipeline
                </span>
              </div>
            </div>
          </div>

          {/* Right Status & Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>Pipeline: Automated QA Active</span>
            </div>

            <NavLink 
              to="/data-manager/datasets" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Register Dataset</span>
            </NavLink>
          </div>
        </header>

        {/* Nested Content Pages */}
        <main className="flex-1 overflow-y-auto bg-slate-50/70 p-6 md:p-8">
          <Outlet />
        </main>

      </div>

    </div>
  );
}
