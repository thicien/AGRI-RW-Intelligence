import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Map as MapIcon, BarChart3, Droplets, 
  Leaf, Package, ShieldAlert, FileText, ClipboardList, 
  MessageSquare, Database, BrainCircuit, PlaySquare, 
  FileBarChart, Users, Settings, Bell, Search, User, ChevronDown
} from 'lucide-react';
import clsx from 'clsx';
import React from 'react';

export default function AppShell() {
  const menuSections = [
    {
      title: 'MAIN',
      items: [
        { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
        { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
        { to: '/admin/map', label: 'Map', icon: MapIcon },
      ]
    },
    {
      title: 'AGRICULTURE',
      items: [
        { to: '/admin/farmers', label: 'Farmers', icon: Users },
        { to: '/admin/farms', label: 'Farms', icon: LayoutDashboard },
        { to: '/admin/crops', label: 'Crops & Seasons', icon: Leaf },
        { to: '/admin/agricultural-data', label: 'Agricultural Data', icon: Database },
      ]
    },
    {
      title: 'ENVIRONMENT & ENERGY',
      items: [
        { to: '/admin/environment', label: 'Environment', icon: Leaf },
        { to: '/admin/energy', label: 'Energy & Infrastructure', icon: Leaf },
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { to: '/admin/ai', label: 'AI & GeoAI', icon: BrainCircuit },
        { to: '/admin/priority-zones', label: 'Priority Zones', icon: ShieldAlert },
        { to: '/admin/recommendations', label: 'Recommendations', icon: FileText },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { to: '/admin/interventions', label: 'Interventions', icon: ClipboardList },
        { to: '/admin/field-validation', label: 'Field Validation', icon: MessageSquare },
      ]
    },
    {
      title: 'DATA MANAGEMENT',
      items: [
        { to: '/admin/datasets', label: 'Datasets', icon: Database },
        { to: '/admin/data-quality', label: 'Data Quality', icon: FileBarChart },
        { to: '/admin/imports-exports', label: 'Imports / Exports', icon: Package },
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/admin/roles', label: 'Roles & Permissions', icon: ShieldAlert },
        { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
        { to: '/admin/settings', label: 'System Settings', icon: Settings },
      ]
    }
  ];

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden font-sans text-text-main">
      <aside className="w-72 bg-primary text-white flex flex-col flex-shrink-0 shadow-2xl z-20 hidden md:flex">
        <div className="h-16 flex items-center px-6 font-semibold text-lg tracking-wide border-b border-white/10 bg-black/10">
          <img src="/logo.png" alt="AgriLens Logo" className="w-6 h-6 mr-3 object-contain" />
          AGRILENS <span className="font-light ml-1 text-primary-soft">RWANDA</span>
        </div>
        
        <nav className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar">
          {menuSections.map((section, idx) => (
            <div key={idx} className="mb-6 last:mb-0">
              <div className="px-3 text-[11px] font-bold text-primary-soft/60 uppercase tracking-widest mb-2">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-3 px-3 py-2 rounded transition-all text-sm font-medium',
                          isActive
                            ? 'bg-white/15 text-white border-l-4 border-white pl-2'
                            : 'text-primary-soft hover:bg-white/5 hover:text-white border-l-4 border-transparent pl-2'
                        )
                      }
                    >
                      <Icon className="w-4 h-4 opacity-80" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/10 text-xs text-primary-soft/50 font-medium bg-black/10 flex items-center justify-between">
          <span>RAIIP © 2026</span>
          <NavLink to="/" className="text-danger hover:text-white transition-colors uppercase tracking-wider font-bold">Logout</NavLink>
        </div>
      </aside>

      <div className="flex flex-col flex-1 w-full overflow-hidden bg-background">
        
        <header className="h-16 bg-surface border-b border-border-main flex items-center justify-between px-6 shadow-sm z-10 flex-shrink-0">
          
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96 hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                placeholder="Search datasets, users, interventions..." 
                className="w-full pl-10 pr-4 py-2 bg-background border border-border-main rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 border-r border-border-main pr-5 hidden lg:flex">
              <div className="text-xs font-semibold text-muted uppercase tracking-widest mr-2">Scope:</div>
              <div className="relative">
                <select className="appearance-none bg-background border border-border-main text-sm rounded pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium cursor-pointer">
                  <option>Rwanda (National)</option>
                  <option>Kigali Province</option>
                  <option>Southern Province</option>
                  <option>Western Province</option>
                  <option>Northern Province</option>
                  <option>Eastern Province</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>
            </div>
            
            <button className="relative p-2 text-muted hover:bg-black/5 hover:text-text-main rounded-full transition-colors focus:outline-none">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 ml-2 hover:bg-black/5 p-1.5 pr-3 rounded cursor-pointer transition-colors">
              <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm">
                SA
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold text-text-main leading-tight">System Admin</div>
                <div className="text-[11px] text-muted">admin@agrilens.rw</div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted hidden sm:block" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F4F7F9] p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
