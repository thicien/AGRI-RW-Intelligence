import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Map as MapIcon, BarChart3, Droplets, 
  Leaf, Package, ShieldAlert, FileText, ClipboardList, 
  MessageSquare, Database, BrainCircuit, PlaySquare, 
  FileBarChart, Users, Settings, Bell, Search, User, ChevronDown
} from 'lucide-react';
import clsx from 'clsx';

export default function AppShell() {
  const menuSections = [
    {
      title: 'OVERVIEW',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { to: '/map', label: 'Intelligence Map', icon: MapIcon },
        { to: '/analytics/productivity', label: 'Productivity', icon: BarChart3 },
        { to: '/analytics/irrigation', label: 'Irrigation', icon: Droplets },
        { to: '/analytics/environment', label: 'Environment', icon: Leaf },
        { to: '/analytics/post-harvest', label: 'Post-Harvest', icon: Package },
      ]
    },
    {
      title: 'DECISIONS',
      items: [
        { to: '/priority-zones', label: 'Priority Zones', icon: ShieldAlert },
        { to: '/recommendations', label: 'Recommendations', icon: FileText },
      ]
    },
    {
      title: 'ACTIONS',
      items: [
        { to: '/interventions', label: 'Interventions', icon: ClipboardList },
        { to: '/feedback', label: 'Feedback', icon: MessageSquare },
      ]
    },
    {
      title: 'DATA & AI',
      items: [
        { to: '/datasets', label: 'Datasets', icon: Database },
        { to: '/models', label: 'AI Models', icon: BrainCircuit },
        { to: '/models/runs', label: 'Model Runs', icon: PlaySquare },
      ]
    },
    {
      title: 'REPORTING',
      items: [
        { to: '/reports', label: 'Reports', icon: FileBarChart },
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/admin/settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden font-sans text-text-main">
      {/* Sidebar - Deep Blue theme (#0D47A1) */}
      <aside className="w-72 bg-primary text-white flex flex-col flex-shrink-0 shadow-2xl z-20 hidden md:flex">
        <div className="h-16 flex items-center px-6 font-semibold text-lg tracking-wide border-b border-white/10 bg-black/10">
          <span className="mr-2 text-xl">🌾</span>
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
        
        <div className="p-4 border-t border-white/10 text-xs text-primary-soft/50 font-medium bg-black/10">
          RAIIP © 2026
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-full overflow-hidden bg-background">
        
        {/* Topbar */}
        <header className="h-16 bg-surface border-b border-border-main flex items-center justify-between px-6 shadow-sm z-10 flex-shrink-0">
          
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96 hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                placeholder="Search districts, crops, zones..." 
                className="w-full pl-10 pr-4 py-2 bg-background border border-border-main rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 border-r border-border-main pr-5 hidden lg:flex">
              <div className="relative">
                <select className="appearance-none bg-background border border-border-main text-sm rounded pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium cursor-pointer">
                  <option>Season A 2026</option>
                  <option>Season B 2026</option>
                  <option>Season A 2025</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>
              
              <div className="relative">
                <select className="appearance-none bg-background border border-border-main text-sm rounded pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium cursor-pointer">
                  <option>National Overview</option>
                  <option>Northern Province</option>
                  <option>Southern Province</option>
                  <option>Eastern Province</option>
                  <option>Western Province</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>
            </div>
            
            <button className="relative p-2 text-muted hover:bg-background hover:text-primary rounded-full transition-colors ml-2">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-surface"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-2 cursor-pointer group">
              <div className="w-9 h-9 rounded bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 group-hover:bg-primary/20 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <div className="text-sm hidden md:block">
                <p className="font-semibold text-text-main leading-tight group-hover:text-primary transition-colors">Admin User</p>
                <p className="text-[11px] font-medium text-muted uppercase tracking-wider mt-0.5">Data Manager</p>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
