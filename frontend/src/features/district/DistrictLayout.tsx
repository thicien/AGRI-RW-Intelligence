import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Sprout, Droplets, Mountain, Warehouse, Globe, 
  Map, CheckSquare, FileText, Bell, UserCheck, Shield, ShieldCheck,
  ChevronDown, LogOut, ExternalLink, Calendar, AlertCircle,
  Menu, X
} from 'lucide-react';

export default function DistrictLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Active user / auth state
  const [officer, setOfficer] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    roleName: string;
    scopeLevel: string;
    district: string;
  }>(() => {
    const saved = localStorage.getItem('agrilens_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.district) return u;
      } catch (e) {}
    }
    // Default fallback to Musanze District Officer
    return {
      id: 'd35b0af6-0946-475e-a90c-0b02e6c4d571',
      name: 'Damascene Nkundabagenzi',
      email: 'officer.musanze@minagri.gov.rw',
      role: 'DISTRICT_OFFICER',
      roleName: 'District Agricultural Officer',
      scopeLevel: 'DISTRICT',
      district: 'Musanze'
    };
  });

  const [selectedSeason, setSelectedSeason] = useState<string>('2026B');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const seasonsList = [
    { code: '2026B', label: 'Season 2026B (Current)' },
    { code: '2026A', label: 'Season 2026A' },
    { code: '2025B', label: 'Season 2025B' },
    { code: '2025A', label: 'Season 2025A' },
    { code: '2024B', label: 'Season 2024B' },
    { code: '2023B', label: 'Season 2023B' },
    { code: 'all', label: 'Multi-Season Baseline' }
  ];

  // The 11 Official Pages for District Agricultural Officer (Section 3)
  const navItems = [
    { path: '/district/overview', label: 'District Overview', icon: LayoutDashboard },
    { path: '/district/productivity', label: 'Agricultural Productivity', icon: Sprout },
    { path: '/district/irrigation', label: 'Irrigation', icon: Droplets },
    { path: '/district/soil', label: 'Soil & Fertility', icon: Mountain },
    { path: '/district/post-harvest', label: 'Post-Harvest & Storage', icon: Warehouse },
    { path: '/district/exports', label: 'Export Opportunities', icon: Globe },
    { path: '/district/map', label: 'District Map', icon: Map },
    { path: '/district/interventions', label: 'Interventions', icon: CheckSquare },
    { path: '/district/reports', label: 'Reports', icon: FileText },
    { path: '/district/notifications', label: 'Notifications', icon: Bell },
    { path: '/district/profile', label: 'Profile & Security', icon: UserCheck },
  ];

  const handleLogout = () => {
    localStorage.removeItem('agrilens_token');
    localStorage.removeItem('agrilens_user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] font-sans text-slate-800 overflow-hidden">
      
      {/* 1. SIDEBAR - Matching Reference Design Background & Layout */}
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
        {/* Dark gradient overlay to preserve high contrast for navigation links */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#063124]/92 via-[#073627]/75 to-transparent pointer-events-none z-0" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none z-0" />

        {/* District Office Header */}
        <div className="h-20 flex items-center px-5 border-b border-white/10 relative z-10 backdrop-blur-[2px]">
          <img src="/logo.png?v=2" alt="AgriLens Logo" className="w-9 h-9 mr-3 object-contain flex-shrink-0 drop-shadow" />
          <div>
            <div className="font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
              AgriLens <span className="font-light text-emerald-300">Rwanda</span>
            </div>
            <div className="text-[11px] text-[#5CE68B] font-semibold tracking-tight mt-0.5 drop-shadow-xs uppercase">
              District Agricultural Office
            </div>
          </div>
        </div>

        {/* Navigation Items (The 11 Official Pages) */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 relative z-10 custom-scrollbar">
          <div className="px-3 pb-2 text-[10px] font-extrabold text-[#7CB998] uppercase tracking-wider drop-shadow-xs">
            District Responsibilities (11 Pages)
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
                {item.label === 'Interventions' && (
                  <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${isActive ? 'bg-[#34D399] text-[#063124]' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    Active
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Officer Profile & Security Pill */}
        <div className="p-3.5 border-t border-white/10 relative z-10 flex-shrink-0 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Section 4.2 RBAC Scoped</span>
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
              {officer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate leading-snug">
                {officer.name}
              </div>
              <div className="text-[10px] text-emerald-300/80 truncate">
                DAO · {officer.district} District
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header / Filter Bar */}
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
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {officer.district} District Office
                </span>
                <span className="hidden sm:inline-block text-xs text-slate-400">•</span>
                <span className="hidden sm:inline-block text-xs font-medium text-slate-500">
                  Republic of Rwanda · MINAGRI / NISR
                </span>
              </div>
            </div>
          </div>

          {/* Right Filters & Jurisdiction Safeguard */}
          <div className="flex items-center gap-3">
            {/* Season Selector */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <label htmlFor="season-select" className="text-xs font-semibold text-slate-600 hidden md:inline">
                Period:
              </label>
              <select
                id="season-select"
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                {seasonsList.map(s => (
                  <option key={s.code} value={s.code}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Strict Scope Indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              <span>{officer.district} Scope Enforced</span>
            </div>
          </div>
        </header>

        {/* Nested Content Pages */}
        <main className="flex-1 overflow-y-auto bg-slate-50/70 p-6 md:p-8">
          <Outlet context={{ districtName: officer.district, seasonCode: selectedSeason }} />
        </main>

      </div>

    </div>
  );
}
