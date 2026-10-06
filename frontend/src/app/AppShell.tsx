import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Map as MapIcon, ShieldAlert, FileText, ClipboardList, Settings, Bell, Search, User } from 'lucide-react';
import clsx from 'clsx';

export default function AppShell() {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/map', label: 'Intelligence Map', icon: MapIcon },
    { to: '/priority-zones', label: 'Priority Zones', icon: ShieldAlert },
    { to: '/recommendations', label: 'Recommendations', icon: FileText },
    { to: '/interventions', label: 'Interventions', icon: ClipboardList },
    { to: '/reports', label: 'Reports', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden text-text-main">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white flex flex-col flex-shrink-0 shadow-xl z-20 hidden md:flex">
        <div className="h-16 flex items-center px-6 font-bold text-xl tracking-tight border-b border-primary-light/30">
          AgriLens <span className="text-primary-soft ml-1 font-normal">Rwanda</span>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 text-xs font-semibold text-primary-soft/70 uppercase tracking-wider mb-2">Main Menu</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium',
                    isActive
                      ? 'bg-primary-light text-white shadow-sm'
                      : 'text-primary-soft hover:bg-white/10 hover:text-white'
                  )
                }
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-primary-light/30 text-xs text-primary-soft/70">
          <p>RAIIP © 2026</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        
        {/* Topbar */}
        <header className="h-16 bg-surface border-b border-border-main flex items-center justify-between px-6 shadow-sm z-10 flex-shrink-0">
          
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96 hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                placeholder="Search districts, crops, zones..." 
                className="w-full pl-9 pr-4 py-2 bg-background border border-border-main rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-border-main pr-4">
              <select className="bg-background border border-border-main text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>Season A 2026</option>
                <option>Season B 2026</option>
              </select>
              <select className="bg-background border border-border-main text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>National</option>
                <option>Northern Province</option>
              </select>
            </div>
            
            <button className="relative p-2 text-muted hover:bg-background rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border border-surface"></span>
            </button>
            
            <div className="flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div className="text-sm hidden md:block">
                <p className="font-medium text-text-main leading-tight">Admin User</p>
                <p className="text-xs text-muted leading-tight">Data Manager</p>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
