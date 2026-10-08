import React from 'react';
import { 
  Users, Map, Activity, ShieldAlert, Target, Database, 
  TrendingUp, Leaf, Tractor, Layers, MapPin, BrainCircuit, CheckCircle2, ChevronRight, Sun, FileText, CheckSquare, Clock, AlertTriangle, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboardPage() {
  const kpis = [
    { label: 'Total Farmers', value: '245,820', trend: '+4.2%', icon: Users },
    { label: 'Total Farms', value: '98,430', trend: '+2.8%', icon: Tractor },
    { label: 'Total Crops', value: '18', trend: 'Active', icon: Leaf, noArrow: true },
    { label: 'Active Seasons', value: '2', trend: '2026 A & B', icon: Sun, noArrow: true },
    { label: 'Provinces', value: '5', trend: 'National', icon: Map, noArrow: true },
    { label: 'Districts', value: '30', trend: 'Mapped', icon: Layers, noArrow: true },
    { label: 'Sectors', value: '416', trend: 'Mapped', icon: MapPin, noArrow: true },
    { label: 'Active Users', value: '86', trend: '+8 this week', icon: Users },
    { label: 'Priority Zones', value: '142', trend: 'Identified', icon: ShieldAlert, noArrow: true },
    { label: 'Recommendations', value: '34', trend: 'Pending Review', icon: FileText, noArrow: true },
    { label: 'Active Interventions', value: '67', trend: 'Ongoing', icon: Target, noArrow: true },
    { label: 'Data Quality Score', value: '94.6%', trend: '+2.1%', icon: Database }
  ];

  const regionalPerformance = [
    { province: 'Kigali', farmers: '21,430', farms: '8,210', crop: 'Vegetables', productivity: '3.2 t/ha', risk: 'Medium' },
    { province: 'Southern', farmers: '84,120', farms: '32,450', crop: 'Beans', productivity: '2.1 t/ha', risk: 'High' },
    { province: 'Western', farmers: '62,890', farms: '28,100', crop: 'Potatoes', productivity: '4.8 t/ha', risk: 'Medium' },
    { province: 'Northern', farmers: '45,210', farms: '18,500', crop: 'Wheat', productivity: '3.6 t/ha', risk: 'Low' },
    { province: 'Eastern', farmers: '32,170', farms: '11,170', crop: 'Maize', productivity: '1.9 t/ha', risk: 'High' },
  ];

  const recentActivities = [
    { user: 'Sarah (Analyst)', action: 'ran Crop Productivity Model', time: '10:42 AM', icon: BrainCircuit, color: 'text-primary' },
    { user: 'System', action: 'flagged 18 new Priority Zones', time: '09:15 AM', icon: ShieldAlert, color: 'text-warning' },
    { user: 'John (Dist. Officer)', action: 'approved Irrigation Intervention in Kayonza', time: 'Yesterday', icon: CheckSquare, color: 'text-agriculture' },
    { user: 'Admin', action: 'updated System User Roles', time: 'Yesterday', icon: Users, color: 'text-muted' },
  ];

  const alerts = [
    { type: 'Critical', message: 'Missing coordinate data in recent farm import (124 records).', icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10 border-danger/20' },
    { type: 'Warning', message: 'Soil moisture threshold dropped below 30% in Eastern Province.', icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Header + Geographic/Date filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border-main">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Good afternoon, Administrator</h1>
          <p className="text-muted text-sm mt-1">Here's an overview of the AgriLens platform and agricultural intelligence across Rwanda.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center text-sm bg-white border border-border-main rounded shadow-sm overflow-hidden">
            <span className="px-3 py-1.5 border-r border-border-main bg-background text-muted font-medium">Period</span>
            <button className="px-3 py-1.5 hover:bg-black/5 font-medium transition-colors">Today</button>
            <button className="px-3 py-1.5 bg-primary/10 text-primary font-semibold border-l border-r border-border-main transition-colors">7 Days</button>
            <button className="px-3 py-1.5 hover:bg-black/5 font-medium border-r border-border-main transition-colors">30 Days</button>
            <button className="px-3 py-1.5 hover:bg-black/5 font-medium transition-colors">Custom</button>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert, idx) => {
          const Icon = alert.icon;
          return (
            <div key={idx} className={`flex items-start gap-3 p-3 border rounded ${alert.bg}`}>
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${alert.color}`} />
              <div>
                <span className={`font-bold text-xs uppercase tracking-wider block mb-0.5 ${alert.color}`}>{alert.type} Alert</span>
                <span className="text-sm text-text-main font-medium">{alert.message}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-3">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="xl:col-span-2 md:col-span-2 col-span-1 bg-white p-3 border border-border-main rounded shadow-sm flex flex-col relative overflow-hidden group">
              <div className="text-muted text-[9px] font-bold uppercase tracking-wider mb-1 line-clamp-1" title={kpi.label}>{kpi.label}</div>
              <div className="text-xl font-bold text-text-main tracking-tight mb-1 truncate">{kpi.value}</div>
              <div className="text-[10px] font-medium text-muted flex items-center">
                {!kpi.noArrow && kpi.trend.includes('+') && <TrendingUp className="w-2.5 h-2.5 mr-1 text-agriculture" />}
                <span className="truncate">{kpi.trend}</span>
              </div>
              <Icon className="absolute -bottom-2 -right-2 w-10 h-10 text-black opacity-[0.03] group-hover:scale-110 transition-transform" />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Main Map Area (2/3 width) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* 3. Large Rwanda Agricultural Intelligence Map */}
          <div className="bg-white border border-border-main rounded shadow-sm flex flex-col">
            <div className="p-4 border-b border-border-main flex justify-between items-center bg-background/50">
              <h2 className="text-base font-bold text-text-main flex items-center gap-2">
                <Map className="w-5 h-5 text-primary" /> Agricultural Intelligence Map
              </h2>
              <div className="flex gap-2">
                <label className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2 py-1 bg-surface border border-border-main rounded cursor-pointer hover:bg-background">
                  <input type="checkbox" defaultChecked className="accent-primary" /> Farms
                </label>
                <label className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2 py-1 bg-surface border border-border-main rounded cursor-pointer hover:bg-background">
                  <input type="checkbox" defaultChecked className="accent-primary" /> Priority Zones
                </label>
                <button className="text-xs bg-primary text-white px-3 py-1 rounded font-medium hover:bg-primary-light">Full Map</button>
              </div>
            </div>
            <div className="h-[450px] w-full bg-[#E5E7EB] relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
              
              {/* Mock Map interaction */}
              <div className="absolute left-6 top-6 bg-white/95 backdrop-blur shadow-lg border border-border-main rounded-lg p-4 w-64 z-10 animate-in fade-in slide-in-from-left-4">
                <div className="font-bold text-sm text-primary mb-1">Gasabo District</div>
                <div className="text-xs text-muted mb-3 border-b border-border-main pb-2">Kigali Province</div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted">Farmers:</span> <span className="font-semibold">8,420</span></div>
                  <div className="flex justify-between"><span className="text-muted">Farms:</span> <span className="font-semibold">3,240</span></div>
                  <div className="flex justify-between"><span className="text-muted">Dominant Crop:</span> <span className="font-semibold">Maize</span></div>
                  <div className="flex justify-between"><span className="text-muted">Risk Level:</span> <span className="font-semibold text-warning">Medium</span></div>
                </div>
              </div>
              
              <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80" className="w-full h-full object-cover mix-blend-overlay opacity-50" alt="Rwanda Map Overlay" />
            </div>
          </div>
          
          {/* 4. Agricultural Performance & Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 border border-border-main rounded shadow-sm">
              <h2 className="text-base font-bold text-text-main mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Crop Distribution (National)
              </h2>
              <div className="space-y-4">
                <ProgressBar label="Maize" value={32} color="bg-primary" />
                <ProgressBar label="Beans" value={25} color="bg-agriculture" />
                <ProgressBar label="Potatoes" value={18} color="bg-warning" />
                <ProgressBar label="Rice" value={11} color="bg-[#0288D1]" />
                <ProgressBar label="Cassava" value={9} color="bg-[#F57C00]" />
              </div>
            </div>
            
            <div className="bg-white p-5 border border-border-main rounded shadow-sm">
              <h2 className="text-base font-bold text-text-main mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Yield Trends (Avg t/ha)
              </h2>
              <div className="h-40 flex items-end justify-between gap-2 pt-6">
                <div className="w-full bg-border-main/50 rounded-t h-[40%] relative group"><div className="absolute -top-6 w-full text-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">1.8</div></div>
                <div className="w-full bg-border-main/50 rounded-t h-[45%] relative group"><div className="absolute -top-6 w-full text-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">1.9</div></div>
                <div className="w-full bg-primary/40 rounded-t h-[60%] relative group"><div className="absolute -top-6 w-full text-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">2.1</div></div>
                <div className="w-full bg-primary/60 rounded-t h-[75%] relative group"><div className="absolute -top-6 w-full text-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">2.4</div></div>
                <div className="w-full bg-primary rounded-t h-[85%] relative group"><div className="absolute -top-6 w-full text-center text-xs font-bold text-primary opacity-100">2.5</div></div>
              </div>
              <div className="flex justify-between text-[10px] text-muted mt-2 uppercase font-bold">
                <span>'24 A</span><span>'24 B</span><span>'25 A</span><span>'25 B</span><span>'26 A</span>
              </div>
            </div>
          </div>

        </div>

        {/* Side Panel (1/3 width) */}
        <div className="space-y-8">
          
          {/* AI Model Status */}
          <div className="bg-white p-5 border border-border-main rounded shadow-sm border-l-4 border-l-agriculture">
            <div className="flex justify-between items-start mb-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-agriculture">AI Model Status</div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-agriculture bg-agriculture/10 px-2 py-0.5 rounded"><CheckCircle2 className="w-3 h-3"/> Active</span>
            </div>
            <h3 className="font-bold text-text-main mb-1">Crop Productivity & Risk Model</h3>
            <p className="text-xs text-muted mb-3">Execution cycle completed over national geospatial dataset.</p>
            <div className="flex justify-between text-xs font-medium bg-background p-2 rounded border border-border-main">
              <span className="text-muted flex items-center gap-1"><Clock className="w-3 h-3"/> Last Run:</span>
              <span>Today, 09:42 AM</span>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white p-5 border border-border-main rounded shadow-sm">
            <h2 className="text-base font-bold text-text-main mb-4">Recent Activities</h2>
            <div className="space-y-4">
              {recentActivities.map((act, i) => {
                const Icon = act.icon;
                return (
                  <div key={i} className="flex gap-3">
                    <div className={`mt-0.5 ${act.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-main leading-tight">
                        <span className="font-bold">{act.user}</span> {act.action}
                      </p>
                      <span className="text-[10px] text-muted font-semibold uppercase">{act.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="w-full mt-4 py-2 border border-border-main rounded text-xs font-bold text-muted hover:text-text-main hover:bg-background transition-colors">View Audit Logs</button>
          </div>

          {/* Intervention Tracking */}
          <div className="bg-white p-5 border border-border-main rounded shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-text-main">Interventions</h2>
              <Link to="/admin/interventions" className="text-xs font-bold text-primary">View All</Link>
            </div>
            <div className="space-y-3">
              <div className="p-3 border border-border-main rounded bg-background hover:bg-white transition-colors cursor-pointer">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-sm">Irrigation Project</span>
                  <span className="text-[10px] font-bold text-primary uppercase">Ongoing</span>
                </div>
                <div className="text-xs text-muted mb-2">Kayonza District</div>
                <div className="w-full h-1.5 bg-border-main rounded-full overflow-hidden"><div className="h-full bg-primary w-[72%]"></div></div>
              </div>
              <div className="p-3 border border-border-main rounded bg-background hover:bg-white transition-colors cursor-pointer">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-sm">Soil Restoration</span>
                  <span className="text-[10px] font-bold text-agriculture uppercase">Approved</span>
                </div>
                <div className="text-xs text-muted mb-2">Huye District</div>
                <div className="w-full h-1.5 bg-border-main rounded-full overflow-hidden"><div className="h-full bg-agriculture w-[40%]"></div></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 5. Regional Performance (Full Width Bottom) */}
      <div className="bg-white p-5 border border-border-main rounded shadow-sm">
        <h2 className="text-base font-bold text-text-main mb-6 flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" /> Regional Performance Overview
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted uppercase bg-background border-b border-border-main">
              <tr>
                <th className="px-4 py-3 font-semibold">Province</th>
                <th className="px-4 py-3 font-semibold">Farmers</th>
                <th className="px-4 py-3 font-semibold">Farms</th>
                <th className="px-4 py-3 font-semibold">Main Crop</th>
                <th className="px-4 py-3 font-semibold">Avg Productivity</th>
                <th className="px-4 py-3 font-semibold">Aggregated Risk</th>
              </tr>
            </thead>
            <tbody>
              {regionalPerformance.map((row, idx) => (
                <tr key={idx} className="border-b border-border-main hover:bg-black/5 cursor-pointer transition-colors group">
                  <td className="px-4 py-3 font-medium text-text-main group-hover:text-primary flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-muted" /> {row.province}
                  </td>
                  <td className="px-4 py-3">{row.farmers}</td>
                  <td className="px-4 py-3">{row.farms}</td>
                  <td className="px-4 py-3">{row.crop}</td>
                  <td className="px-4 py-3 font-semibold">{row.productivity}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      row.risk === 'High' ? 'bg-danger/10 text-danger' : 
                      row.risk === 'Medium' ? 'bg-warning/10 text-warning' : 
                      'bg-agriculture/10 text-agriculture'
                    }`}>
                      {row.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}

// Helper
function ProgressBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium">{label}</span>
        <span className="font-bold text-muted">{value}%</span>
      </div>
      <div className="w-full h-2 bg-background border border-border-main rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}
