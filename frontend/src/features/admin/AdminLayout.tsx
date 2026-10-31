import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../config/api';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, LayoutDashboard, Users, ShieldAlert, MapPin, 
  Settings, Activity, FileText, Lock, HardDrive, 
  Bell, FileSpreadsheet, UserCheck, LogOut, Menu, X, 
  Search, RefreshCw, AlertTriangle, Shield, Check, ArrowRight,
  ChevronRight, CheckCircle2, Server
} from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [adminUser, setAdminUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    roleName: string;
    scopeLevel: string;
    avatarUrl?: string | null;
  }>(() => {
    const saved = localStorage.getItem('agrilens_user');
    const avatar = localStorage.getItem('agrilens_user_avatar');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.role === 'PLATFORM_ADMIN' || u.role === 'SYSTEM_ADMIN') {
          return { ...u, avatarUrl: u.avatarUrl || avatar || null };
        }
      } catch (e) {}
    }
    return {
      id: 'd526d9ef-9abd-4a57-8dbb-a13b69c0bc32',
      name: 'System Administrator',
      email: 'admin@agrilens.gov.rw',
      role: 'PLATFORM_ADMIN',
      roleName: 'Platform Administrator',
      scopeLevel: 'SYSTEM_WIDE',
      avatarUrl: avatar || null
    };
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemHealth, setSystemHealth] = useState<{
    status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    latencyMs: number;
  }>({ status: 'HEALTHY', latencyMs: 1 });

  // Fetch live health status periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(apiUrl('admin/health'));
        if (res.ok) {
          const data = await res.json();
          setSystemHealth({
            status: data.status || 'HEALTHY',
            latencyMs: data.database?.latencyMs ?? 1,
          });
        }
      } catch (e) {
        // network issue
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for profile image and user updates
  useEffect(() => {
    const syncUser = () => {
      const saved = localStorage.getItem('agrilens_user');
      const avatar = localStorage.getItem('agrilens_user_avatar');
      if (saved) {
        try {
          const u = JSON.parse(saved);
          setAdminUser({ ...u, avatarUrl: u.avatarUrl || avatar || null });
        } catch (e) {}
      } else if (avatar) {
        setAdminUser(prev => ({ ...prev, avatarUrl: avatar }));
      }
    };

    window.addEventListener('agrilens_user_updated', syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener('agrilens_user_updated', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  // The 13 Official Pages for System Administrator
  const navItems = [
    { path: '/system-admin/overview', label: 'Overview', icon: LayoutDashboard },
    { path: '/system-admin/users', label: 'User Management', icon: Users, badge: '12 Accounts' },
    { path: '/system-admin/roles', label: 'Roles & Permissions', icon: ShieldAlert },
    { path: '/system-admin/geography', label: 'Administrative Geography', icon: MapPin },
    { path: '/system-admin/configuration', label: 'System Configuration', icon: Settings },
    { path: '/system-admin/health', label: 'System Health', icon: Activity, badge: '1ms' },
    { path: '/system-admin/audit-logs', label: 'Audit Logs', icon: FileText },
    { path: '/system-admin/security', label: 'Security & Access', icon: Lock },
    { path: '/system-admin/backup', label: 'Backup & Recovery', icon: HardDrive },
    { path: '/system-admin/notifications', label: 'Notifications', icon: Bell, badge: '3' },
    { path: '/system-admin/reports', label: 'Platform Reports', icon: FileSpreadsheet },
    { path: '/system-admin/profile', label: 'Profile & Security', icon: UserCheck },
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
              System Administration Center
            </div>
          </div>
        </div>

        {/* Navigation Items (13 Official Pages) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 relative z-10 custom-scrollbar">
          <div className="text-[10px] font-bold tracking-wider text-emerald-300/70 uppercase px-3 py-1">
            Platform Administration
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/system-admin/overview' && location.pathname === '/system-admin');
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-emerald-600/90 to-emerald-700/80 text-white shadow-md shadow-emerald-950/30 border border-emerald-400/30 font-semibold' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white border border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-emerald-300' : 'text-emerald-400/70'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/20'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>



        <div className="p-3 border-t border-white/10 relative z-10 bg-[#063124]/90 backdrop-blur-md">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              {adminUser.avatarUrl ? (
                <img
                  src={adminUser.avatarUrl}
                  alt={adminUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-emerald-400/50 shadow-sm flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-inner">
                  {adminUser.name ? adminUser.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'SA'}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate leading-tight">
                  {adminUser.name}
                </div>
                <div className="text-[10px] text-emerald-300/80 truncate">
                  {adminUser.email}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider text-rose-300 hover:text-white hover:bg-rose-500/20 border border-rose-500/30 transition-all ml-1 shrink-0"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="hidden sm:inline">AgriLens Rwanda</span>
              <ChevronRight className="w-3.5 h-3.5 hidden sm:inline" />
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                System Administration Center
              </span>
            </div>
          </div>

          {/* Quick Actions & Security Badges */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600">
              <Server className="w-3.5 h-3.5 text-emerald-600" />
              <span>PostgreSQL 5433:</span>
              <span className="font-bold text-emerald-700">Connected ({systemHealth.latencyMs}ms)</span>
            </div>

            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>RBAC Active</span>
            </div>

            <button
              onClick={() => window.location.reload()}
              title="Refresh System Metrics"
              className="p-2 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Routed Subpage Content */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
