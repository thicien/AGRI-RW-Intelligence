import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Map as MapIcon, BarChart3, Droplets, 
  Leaf, Package, ShieldAlert, FileText, ClipboardList, 
  MessageSquare, Database, BrainCircuit, PlaySquare, 
  FileBarChart, Users, Settings, Bell, Search, User, ChevronDown,
  Layers, Globe, CheckCircle2, ShieldCheck, MapPin, Key, XCircle,
  AlertTriangle, Lock, RefreshCw, UserCheck, Check, Building2
} from 'lucide-react';
import clsx from 'clsx';
import React, { useState } from 'react';
import { useAuth, PRESET_PERSONAS } from '../features/auth/AuthContext';

export default function AppShell() {
  const { currentUser, switchPersona, updateGeographicScope, canAccessRoute } = useAuth();
  const location = useLocation();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showScopeMenu, setShowScopeMenu] = useState(false);

  // Check if current route is authorized for this persona
  const accessCheck = canAccessRoute(location.pathname);

  // Define full menu sections
  const allMenuSections = [
    {
      title: 'MAIN DASHBOARDS',
      items: [
        { to: '/admin/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, minRoles: [] },
        { to: '/admin/analytics', label: 'Seasonal Analytics', icon: BarChart3, minRoles: [] },
        { to: '/admin/map', label: 'Interactive Agricultural Map', icon: MapIcon, minRoles: [] },
      ]
    },
    {
      title: 'AGRICULTURAL SECTORS',
      items: [
        { to: '/admin/crops', label: 'Crops & Seasons (2014-2026A)', icon: Leaf, minRoles: [] },
        { to: '/admin/facilities', label: 'Agricultural Facilities Map', icon: Building2, minRoles: [] },
        { to: '/admin/agricultural-data', label: 'Productivity Statistics', icon: Database, minRoles: ['COOPERATIVE_FARMER'] },
        { to: '/admin/farmers', label: 'Farmers Registry', icon: Users, minRoles: ['COOPERATIVE_FARMER'] },
        { to: '/admin/farms', label: 'Farms & Holdings', icon: LayoutDashboard, minRoles: ['COOPERATIVE_FARMER'] },
      ]
    },
    {
      title: 'OPPORTUNITY ASSESSMENT',
      items: [
        { to: '/admin/irrigation', label: 'Module 2: Irrigation Opportunity', icon: Droplets, minRoles: ['COOPERATIVE_FARMER'] },
        { to: '/admin/soil-conservation', label: 'Module 3: Soil & Fertility', icon: Layers, minRoles: ['COOPERATIVE_FARMER'] },
        { to: '/admin/post-harvest', label: 'Module 4: Post-Harvest & Storage', icon: Package, minRoles: [] },
        { to: '/admin/imports-exports', label: 'Module 5: Export Opportunities', icon: Globe, minRoles: ['COOPERATIVE_FARMER'] },
      ]
    },
    {
      title: 'FIELD OPERATIONS',
      items: [
        { to: '/admin/interventions', label: 'Priority Interventions', icon: ClipboardList, minRoles: ['COOPERATIVE_FARMER'] },
        { to: '/admin/field-validation', label: 'Field Verification & Observations', icon: MessageSquare, minRoles: ['PARTNER_VIEWER'] },
        { to: '/admin/recommendations', label: 'Policy Briefs & Guidance', icon: FileBarChart, minRoles: [] },
        { to: '/admin/reports', label: 'Evidence Reports & Exports', icon: FileText, minRoles: [] },
      ]
    }
  ];

  // Filter sections by user's role
  const visibleSections = allMenuSections;

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden font-sans text-text-main">
      
      {/* Sidebar - Matching Reference Design Background & Layout */}
      <aside 
        className="w-72 text-white flex flex-col flex-shrink-0 shadow-2xl z-20 hidden md:flex border-r border-[#1B4D33]/40 relative overflow-hidden"
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
        
        {/* Brand Header */}
        <div className="h-20 flex items-center px-5 border-b border-white/10 relative z-10 backdrop-blur-[2px]">
          <img src="/logo.png?v=2" alt="AgriLens Logo" className="w-9 h-9 mr-3 object-contain flex-shrink-0 drop-shadow" />
          <div>
            <div className="font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
              AgriLens <span className="font-light text-emerald-300">Rwanda</span>
            </div>
            <div className="text-[11px] text-[#5CE68B] font-semibold tracking-tight mt-0.5 drop-shadow-xs uppercase">
              Agricultural Planner Dashboard
            </div>
          </div>
        </div>

        
        {/* Navigation Sections */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar space-y-5 relative z-10">
          {visibleSections.map((section, idx) => (
            <div key={idx}>
              <div className="px-3 text-[10px] font-extrabold text-[#7CB998] uppercase tracking-wider mb-1.5 drop-shadow-xs">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  // If role is blocked for specific item
                  if (item.minRoles && item.minRoles.includes(currentUser.roleCode)) return null;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs font-medium',
                          isActive
                            ? 'bg-[#155333]/90 text-white font-semibold shadow-sm border-l-4 border-[#34D399] pl-2.5 backdrop-blur-xs'
                            : 'text-[#A5CDB8] hover:bg-white/10 hover:text-white border-l-4 border-transparent pl-2.5'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-white' : 'text-[#8DBCA3]')} />
                          <span className="truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        
        {/* Footer Typography overlaid directly on Rwandan landscape */}
        <div className="p-4 relative z-10 flex-shrink-0">
          <div className="mb-2">
            <p className="text-xs font-bold text-white leading-tight drop-shadow-lg">
              Data-driven agriculture<br />
              for a prosperous<br />
              Rwanda
            </p>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#86AF96] pt-2 border-t border-white/20">
            <span className="text-[10px] text-emerald-200/90 font-medium">NISR SAS Intelligence</span>
            <NavLink to="/login" className="text-red-300 hover:text-white transition-colors uppercase tracking-wider font-bold text-[10px]">
              Logout
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Main Content Area - with min-w-0 to prevent overflow/overlapping */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-background">
        
        {/* Header Bar */}
        <header className="h-16 bg-surface border-b border-border-main flex items-center justify-between px-6 shadow-sm z-10 flex-shrink-0">
          
          {/* Left search */}
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-80 hidden lg:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                placeholder="Search indicators, crop seasons, districts..." 
                className="w-full pl-9 pr-4 py-1.5 bg-background border border-border-main rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>
          
          {/* Right Controls */}
          <div className="flex items-center gap-3">
            
            {/* Geographic Scope Badge & Selector */}
            <div className="relative">
              <button
                onClick={() => setShowScopeMenu(!showScopeMenu)}
                className="flex items-center gap-2 bg-background border border-border-main px-3 py-1.5 rounded-lg text-xs font-semibold hover:border-primary transition-all"
              >
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="text-muted font-normal hidden sm:inline">Jurisdiction:</span>
                <span className="font-bold text-text-main">
                  {currentUser.scopeLevel === 'DISTRICT' && currentUser.district 
                    ? `${currentUser.district} District` 
                    : (currentUser.scopeLevel === 'SECTOR' && currentUser.sector 
                        ? `${currentUser.sector} Sector` 
                        : 'Rwanda (National)')}
                </span>
                <ChevronDown className="w-3 h-3 text-muted ml-1" />
              </button>

              {showScopeMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-surface border border-border-main rounded-xl shadow-xl p-3 z-50 animate-in fade-in space-y-2">
                  <div className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    Test Scoped Jurisdiction (ABAC)
                  </div>
                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => { updateGeographicScope(null, null); setShowScopeMenu(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded font-medium flex items-center justify-between ${!currentUser.district ? 'bg-primary text-white font-bold' : 'hover:bg-background'}`}
                    >
                      <span>Rwanda (National Scope)</span>
                      {!currentUser.district && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => { updateGeographicScope('Nyagatare', null); setShowScopeMenu(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded font-medium flex items-center justify-between ${currentUser.district === 'Nyagatare' ? 'bg-primary text-white font-bold' : 'hover:bg-background'}`}
                    >
                      <span>Nyagatare District (Eastern)</span>
                      {currentUser.district === 'Nyagatare' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => { updateGeographicScope('Musanze', null); setShowScopeMenu(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded font-medium flex items-center justify-between ${currentUser.district === 'Musanze' ? 'bg-primary text-white font-bold' : 'hover:bg-background'}`}
                    >
                      <span>Musanze District (Northern)</span>
                      {currentUser.district === 'Musanze' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => { updateGeographicScope('Huye', null); setShowScopeMenu(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded font-medium flex items-center justify-between ${currentUser.district === 'Huye' ? 'bg-primary text-white font-bold' : 'hover:bg-background'}`}
                    >
                      <span>Huye District (Southern)</span>
                      {currentUser.district === 'Huye' && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="pt-2 border-t border-border-main text-[10px] text-muted leading-tight">
                    *Changing district simulates administrative boundary checks. Out-of-scope queries trigger 403 Forbidden.
                  </div>
                </div>
              )}
            </div>

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center gap-2.5 bg-surface hover:bg-background border border-border-main p-1.5 pr-3 rounded-xl transition-all shadow-sm"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${currentUser.avatarColor}`}>
                  {currentUser.avatarInitials}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-text-main leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] font-semibold text-primary">{currentUser.roleName}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted ml-1" />
              </button>

              {/* Persona Popover */}
              {showPersonaMenu && (
                <div className="absolute right-0 mt-2 w-96 bg-surface border border-border-main rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border-main">
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-wider text-text-main">
                        Role Switcher (Section 4.1)
                      </div>
                      <div className="text-[11px] text-muted">Preview AgriLens under any of the 8 official personas</div>
                    </div>
                    <button onClick={() => setShowPersonaMenu(false)} className="text-xs text-muted hover:text-text-main">✕</button>
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
                    {PRESET_PERSONAS.map(persona => {
                      const isActive = persona.roleCode === currentUser.roleCode;
                      return (
                        <button
                          key={persona.roleCode}
                          onClick={() => {
                            switchPersona(persona.roleCode);
                            setShowPersonaMenu(false);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left transition-all border flex items-center gap-3 ${
                            isActive 
                              ? 'border-primary bg-primary/10 ring-1 ring-primary' 
                              : 'border-border-main bg-background hover:bg-surface'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${persona.avatarColor}`}>
                            {persona.avatarInitials}
                          </div>
                          <div className="flex-1 truncate">
                            <div className="text-xs font-bold text-text-main flex items-center justify-between">
                              <span>{persona.name}</span>
                              {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                            </div>
                            <div className="text-[11px] font-semibold text-primary">{persona.roleName}</div>
                            <div className="text-[10px] text-muted truncate">{persona.title}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Content Viewport or Security Barrier */}
        <main className="flex-1 overflow-y-auto bg-[#F4F7F9] p-4 md:p-6 lg:p-8">
          {!accessCheck.allowed ? (
            <div className="p-8 max-w-2xl mx-auto my-12 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-surface rounded-2xl border border-danger/30 p-8 shadow-xl text-center space-y-4">
                <div className="w-16 h-16 bg-danger/10 text-danger rounded-2xl flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-danger">Security Authorization Barrier</span>
                  <h2 className="text-2xl font-extrabold text-text-main mt-1">Access Prohibited</h2>
                </div>
                <p className="text-sm text-text-main/80 leading-relaxed">
                  {accessCheck.reason || 'You do not have sufficient permissions to access this screen.'}
                </p>

                <div className="p-4 bg-background border border-border-main rounded-xl text-xs text-left space-y-2">
                  <div className="font-bold text-text-main">Your Current Security Context:</div>
                  <div className="flex justify-between text-muted">
                    <span>Logged-in Persona:</span>
                    <strong className="text-text-main">{currentUser.name}</strong>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Assigned Logical Role:</span>
                    <strong className="text-primary">{currentUser.roleName} ({currentUser.roleCode})</strong>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Jurisdiction Scope:</span>
                    <strong className="text-text-main">{currentUser.scopeLevel}</strong>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={() => switchPersona('PLATFORM_ADMIN')}
                    className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Switch to Platform Admin
                  </button>
                  <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-background hover:bg-surface border border-border-main rounded-lg text-xs font-semibold"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
