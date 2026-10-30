import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, Droplets, Leaf, Warehouse, Globe, 
  BookOpen, Download, LogIn, ArrowLeft, ShieldCheck, 
  Sparkles, ExternalLink, Menu, X 
} from 'lucide-react';
import type { PublicSection } from '../types';

interface PublicNavbarProps {
  activeSection: PublicSection;
  onSelectSection: (section: PublicSection) => void;
  onOpenMethodology: () => void;
  onOpenExport: () => void;
}

export default function PublicNavbar({
  activeSection,
  onSelectSection,
  onOpenMethodology,
  onOpenExport
}: PublicNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const sections: Array<{ id: PublicSection; label: string; icon: React.ReactNode }> = [
    { id: 'productivity', label: '01. Productivity', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'irrigation', label: '02. Irrigation', icon: <Droplets className="w-4 h-4" /> },
    { id: 'soil', label: '03. Soil & Fertility', icon: <Leaf className="w-4 h-4" /> },
    { id: 'post-harvest', label: '04. Post-Harvest', icon: <Warehouse className="w-4 h-4" /> },
    { id: 'export', label: '05. Export Opportunities', icon: <Globe className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100/90 shadow-xs">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-[#072415] via-[#14532d] to-[#0a2f1c] text-white px-4 py-1.5 text-[11px] font-semibold flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-200">Public Agricultural Intelligence Portal</span>
            <span className="hidden sm:inline text-emerald-400/60">|</span>
            <span className="hidden sm:inline text-emerald-100/90 font-normal">
              Official NISR Seasonal Agricultural Survey (SAS) Evidence · Open Read-Only Access
            </span>
          </div>

          <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider font-extrabold text-emerald-200">
            <span className="bg-emerald-800/80 px-2 py-0.5 rounded border border-emerald-600/40">
              NISR Hackathon
            </span>
            <Link 
              to="/login" 
              className="text-white hover:text-emerald-300 transition-colors flex items-center gap-1 font-bold"
            >
              <LogIn className="w-3 h-3" /> Staff Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand & Portal Title */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img src="/logo.png?v=2" alt="AgriLens Rwanda" className="w-8 h-8 object-contain" />
              <div>
                <div className="font-black text-lg tracking-tight text-[#14532d] leading-none flex items-center gap-1">
                  AgriLens <span className="font-light text-emerald-600">RWANDA</span>
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  Public Intelligence Portal
                </div>
              </div>
            </Link>

            <div className="hidden lg:block h-6 w-px bg-slate-200" />

            <Link 
              to="/" 
              className="hidden lg:flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Landing Page
            </Link>
          </div>

          {/* Center: Five Agricultural Sections Tabs (Desktop) */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-bold">
            {sections.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => onSelectSection(sec.id)}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#14532d] shadow-xs font-extrabold border border-emerald-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-700' : 'text-slate-400'}>
                    {sec.icon}
                  </span>
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenMethodology}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
              <span>Methodology</span>
            </button>

            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 bg-emerald-100/90 hover:bg-emerald-200 px-3.5 py-2 rounded-lg border border-emerald-300/80 transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-800" />
              <span>Research Export</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white p-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Five Agricultural Sections
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => {
                  onSelectSection(sec.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full p-2.5 rounded-lg flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                  activeSection === sec.id
                    ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={activeSection === sec.id ? 'text-emerald-700' : 'text-slate-400'}>
                    {sec.icon}
                  </span>
                  <span>{sec.label}</span>
                </div>
                {activeSection === sec.id && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                )}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => {
                onOpenMethodology();
                setMobileMenuOpen(false);
              }}
              className="text-xs font-bold text-emerald-800 flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4" /> Methodology & Sources
            </button>
            <Link
              to="/login"
              className="text-xs font-bold text-slate-600 flex items-center gap-1"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
