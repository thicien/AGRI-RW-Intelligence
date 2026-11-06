import { useWorkspaceNavigation } from '../hooks/useWorkspaceNavigation';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Map as MapIcon, BarChart3, Droplets, 
  Leaf, Package, ShieldAlert, FileText, ClipboardList, 
  MessageSquare, Database, BrainCircuit, PlaySquare, 
  FileBarChart, Users, Settings, Bell, Search, User, ChevronDown,
  Layers, Globe, CheckCircle2, ShieldCheck, MapPin, Key, XCircle,
  AlertTriangle, Lock, RefreshCw, UserCheck, Check, Building2, Menu, X
} from 'lucide-react';
import clsx from 'clsx';
import React, { useState, useEffect } from 'react';
import { useAuth, PRESET_PERSONAS } from '../features/auth/AuthContext';

export default function AppShell() {
  const { currentUser, switchPersona, canAccessRoute } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { sidebarRef, desktop } = useWorkspaceNavigation(mobileMenuOpen, setMobileMenuOpen);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    return localStorage.getItem('agrilens_user_avatar') || null;
  });

  useEffect(() => {
    const handleAvatarSync = () => {
      const avatar = localStorage.getItem('agrilens_user_avatar');
      setAvatarUrl(avatar || null);
    };
    window.addEventListener('agrilens_user_updated', handleAvatarSync);
    window.addEventListener('storage', handleAvatarSync);
    return () => {
      window.removeEventListener('agrilens_user_updated', handleAvatarSync);
      window.removeEventListener('storage', handleAvatarSync);
    };
  }, []);

  // Check if current route is authorized for this persona
  const accessCheck = canAccessRoute(location.pathname);

  // Define full menu sections
  const allMenuSections = [
    {
      title: 'MAIN DASHBOARDS',
      items: [
        { to: '/admin/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, minRoles: [] },
        { to: '/admin/crops', label: 'Crops & Seasons production', icon: Leaf, minRoles: [] },
        { to: '/admin/irrigation', label: 'Irrigation Opportunity', icon: Droplets, minRoles: ['COOPERATIVE_FARMER'] },
        { to: '/admin/soil-conservation', label: 'Soil & Fertility', icon: Layers, minRoles: ['COOPERATIVE_FARMER'] },
        { to: '/admin/post-harvest', label: 'Post-Harvest & Storage', icon: Package, minRoles: [] },
        { to: '/admin/imports-exports', label: 'Export Opportunities', icon: Globe, minRoles: ['COOPERATIVE_FARMER'] },
        { to: '/admin/reports', label: 'Evidence Reports & Exports', icon: FileText, minRoles: [] },
        { to: '/admin/profile', label: 'Planner Profile & Security', icon: User, minRoles: [] },
      ]
    }
  ];

  // Filter sections by user's role
  const visibleSections = allMenuSections;

  return (
    <div className="workspace-shell flex h-dvh w-full bg-background overflow-hidden font-sans text-text-main">
      
      {/* Sidebar - Matching Reference Design Background & Layout */}
      <aside
        ref={sidebarRef} id="workspace-navigation" aria-label="Workspace navigation"
        inert={!desktop && !mobileMenuOpen}
        role={!desktop && mobileMenuOpen ? "dialog" : undefined}
        aria-modal={!desktop && mobileMenuOpen ? true : undefined}
        className={`workspace-sidebar fixed inset-y-0 left-0 z-50 w-72 max-w-[calc(100vw-3rem)] text-white flex flex-col shrink-0 shadow-2xl border-r border-[#1B4D33]/40 overflow-hidden transition-transform duration-200 xl:relative xl:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          backgroundImage: "url('/sidebar_bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#063124'
        }}
      >
        <button type="button" aria-label="Close workspace navigation" onClick={() => setMobileMenuOpen(false)} className="absolute right-2 top-2 z-20 rounded-lg bg-emerald-950 p-2 text-white hover:bg-emerald-800 xl:hidden"><X className="h-5 w-5" /></button>
        {/* Dark gradient overlay to preserve high contrast for navigation links */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#063124]/92 via-[#073627]/75 to-transparent pointer-events-none z-0" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none z-0" />
        
        {/* Brand Header */}
        <div className="min-h-20 py-3 flex items-center px-5 pr-14 xl:pr-5 border-b border-white/10 relative z-10 backdrop-blur-[2px]">
          <img src="/logo.png?v=2" alt="AgriLens Logo" className="w-9 h-9 mr-3 object-contain flex-shrink-0 drop-shadow" />
          <div>
            <div className="font-bold text-lg leading-tight tracking-tight text-white flex flex-wrap items-center gap-1.5">
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
              {section.title && (
                <div className="px-3 text-[10px] font-extrabold text-[#7CB998] uppercase tracking-wider mb-1.5 drop-shadow-xs">
                  {section.title}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  // If role is blocked for specific item
                  if (item.minRoles && item.minRoles.includes(currentUser.roleCode)) return null;

                  return (
                    <NavLink
                      key={item.to}
                      onClick={() => setMobileMenuOpen(false)}
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
            <NavLink to="/admin/profile" className="text-emerald-200/90 hover:text-white transition-colors font-semibold text-[10px] flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>Profile Settings</span>
            </NavLink>
            <NavLink to="/login" className="text-red-300 hover:text-white transition-colors uppercase tracking-wider font-bold text-[10px]">
              Logout
            </NavLink>
          </div>
        </div>
      </aside>
      {mobileMenuOpen && !desktop && <button type="button" aria-label="Dismiss workspace navigation" onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm xl:hidden" />}

      {/* Main Content Area - with min-w-0 to prevent overflow/overlapping */}
      <div inert={mobileMenuOpen && !desktop} className="flex flex-col flex-1 min-w-0 overflow-hidden bg-background">
        
        {/* Header Bar */}
        <header className="workspace-header h-16 bg-surface border-b border-border-main flex items-center justify-between px-4 sm:px-6 gap-3 shadow-sm z-10 flex-shrink-0">
          
          <button type="button" aria-label="Open workspace navigation" aria-expanded={mobileMenuOpen} aria-controls="workspace-navigation" onClick={() => setMobileMenuOpen(true)} className="workspace-menu-button xl:hidden shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100"><Menu className="h-5 w-5" /></button>
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
            
            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center gap-2.5 bg-surface hover:bg-background border border-border-main p-1.5 pr-3 rounded-xl transition-all shadow-sm"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-lg object-cover border border-emerald-500/50 shadow-xs flex-shrink-0"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${currentUser.avatarColor}`}>
                    {currentUser.avatarInitials}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-text-main leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] font-semibold text-primary">{currentUser.roleName}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted ml-1" />
              </button>

              {/* Persona Popover */}
              {showPersonaMenu && (
                <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-6rem)] overflow-y-auto bg-surface border border-border-main rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in space-y-3">
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

                  <div className="pt-2 border-t border-border-main flex items-center justify-between">
                    <NavLink
                      to="/admin/profile"
                      onClick={() => setShowPersonaMenu(false)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-emerald-50 transition"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Manage Planner Profile & Security</span>
                    </NavLink>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Content Viewport or Security Barrier */}
        <main id="workspace-content" tabIndex={-1} className="workspace-main min-h-0 min-w-0 flex-1 overflow-y-auto bg-[#F4F7F9] p-4 md:p-6 lg:p-8">
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
