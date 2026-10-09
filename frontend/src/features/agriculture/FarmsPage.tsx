import React, { useState } from 'react';
import { 
  Map, LayoutDashboard, Calendar, TrendingUp, TrendingDown,
  ChevronRight, Filter, Download, ArrowUpRight, ArrowDownRight, MapPin
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

export default function FarmsPage() {
  const [selectedRegion, setSelectedRegion] = useState('All Rwanda');
  const [selectedYear, setSelectedYear] = useState('2026');

  // Mock aggregated data reflecting Level 2/3 Intelligence from the dataset
  const kpis = {
    cultivatedArea: '1,450,200',
    harvestedArea: '1,380,500',
    areaChange: '+2.4%',
    isPositiveChange: true,
    activeSeasons: 26,
    districtsCovered: 30
  };

  const trendData = [
    { season: '2023 A', area: 1380000 },
    { season: '2023 B', area: 1395000 },
    { season: '2024 A', area: 1410000 },
    { season: '2024 B', area: 1405000 },
    { season: '2025 A', area: 1425000 },
    { season: '2025 B', area: 1435000 },
    { season: '2026 A', area: 1450200 },
  ];

  const cropArea = [
    { name: 'Maize', value: 450000, color: '#f59e0b' },
    { name: 'Beans', value: 380000, color: '#84cc16' },
    { name: 'Cassava', value: 310000, color: '#10b981' },
    { name: 'Irish Potatoes', value: 120000, color: '#6366f1' },
    { name: 'Rice', value: 85000, color: '#0ea5e9' },
    { name: 'Others', value: 105200, color: '#9ca3af' },
  ];

  const districtComparison = [
    { name: 'Nyagatare', area: 125400, fill: '#3b82f6' },
    { name: 'Gatsibo', area: 98300, fill: '#3b82f6' },
    { name: 'Kayonza', area: 84200, fill: '#3b82f6' },
    { name: 'Bugesera', area: 75100, fill: '#3b82f6' },
    { name: 'Kirehe', area: 71000, fill: '#3b82f6' },
  ];

  const seasonComparison = [
    { indicator: 'Cultivated area (ha)', seasonA: '1,450,200', seasonB: '1,435,000', change: '+1.05%' },
    { indicator: 'Harvested area (ha)', seasonA: '1,380,500', seasonB: '1,350,000', change: '+2.25%' },
    { indicator: 'Maize Area (ha)', seasonA: '450,000', seasonB: '410,000', change: '+9.75%' },
    { indicator: 'Avg Yield (MT/ha)', seasonA: '1.8', seasonB: '1.6', change: '+12.5%' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary" /> 
            Agricultural Land Intelligence
          </h1>
          <p className="text-sm text-muted mt-1">
            Geographic and temporal analysis of cultivated areas derived from SAS datasets.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-surface border border-border-main text-text-main text-sm font-semibold rounded-md shadow-sm hover:bg-background transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filters
          </button>
          <button className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-md shadow-sm hover:bg-primary-light transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'CULTIVATED AREA (HA)', value: kpis.cultivatedArea, icon: Map, color: 'text-blue-500' },
          { label: 'HARVESTED AREA (HA)', value: kpis.harvestedArea, icon: LayoutDashboard, color: 'text-green-500' },
          { 
            label: 'AREA CHANGE', 
            value: kpis.areaChange, 
            icon: kpis.isPositiveChange ? TrendingUp : TrendingDown, 
            color: kpis.isPositiveChange ? 'text-success' : 'text-danger' 
          },
          { label: 'ACTIVE SEASONS', value: kpis.activeSeasons, icon: Calendar, color: 'text-purple-500' },
          { label: 'DISTRICTS COVERED', value: kpis.districtsCovered, icon: MapPin, color: 'text-amber-500' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-surface rounded-xl border border-border-main p-4 shadow-sm flex flex-col justify-between group hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className={`w-4 h-4 ${kpi.color} opacity-80`} />
            </div>
            <div className="text-2xl font-black text-text-main tracking-tight">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Historical Cultivated Area Trend */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border-main p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-sm text-text-main uppercase tracking-wider">Cultivated Area Trend (ha)</h3>
            <select className="text-xs bg-background border border-border-main rounded px-2 py-1 outline-none">
              <option>Last 4 Years</option>
              <option>All Time (2014-2026)</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="season" tickLine={false} axisLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis tickLine={false} axisLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(val) => `${val / 1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [new Intl.NumberFormat('en-US').format(value), 'Hectares']}
                />
                <Area type="monotone" dataKey="area" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Land Allocation by Crop */}
        <div className="bg-surface rounded-xl border border-border-main p-6 shadow-sm">
          <h3 className="font-bold text-sm text-text-main uppercase tracking-wider mb-2">Agricultural Area by Crop</h3>
          <p className="text-xs text-muted mb-4">Total cultivated area allocation (2026 A)</p>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cropArea}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {cropArea.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number) => [new Intl.NumberFormat('en-US').format(value) + ' ha', 'Area']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts & Data Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* District Comparison */}
        <div className="bg-surface rounded-xl border border-border-main p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-sm text-text-main uppercase tracking-wider">District Area Comparison</h3>
            <button className="text-xs font-bold text-primary hover:text-primary-light flex items-center gap-1">
              View Map <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtComparison} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12, fontWeight: 500}} width={80} />
                <RechartsTooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [new Intl.NumberFormat('en-US').format(value) + ' ha', 'Cultivated Area']}
                />
                <Bar dataKey="area" radius={[0, 4, 4, 0]} barSize={24} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Season A vs Season B Comparison Table */}
        <div className="bg-surface rounded-xl border border-border-main overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-border-main flex justify-between items-center">
            <h3 className="font-bold text-sm text-text-main uppercase tracking-wider">Season A vs Season B (2025)</h3>
            <span className="px-2 py-1 bg-background border border-border-main rounded text-xs text-muted">Year: 2025</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm h-full">
              <thead className="bg-background/50 text-muted text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Indicator</th>
                  <th className="px-6 py-4 text-right">Season A</th>
                  <th className="px-6 py-4 text-right">Season B</th>
                  <th className="px-6 py-4 text-right">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {seasonComparison.map((row, idx) => {
                  const isPositive = row.change.startsWith('+');
                  return (
                    <tr key={idx} className="hover:bg-background transition-colors group">
                      <td className="px-6 py-4 font-semibold text-text-main">{row.indicator}</td>
                      <td className="px-6 py-4 text-right">{row.seasonA}</td>
                      <td className="px-6 py-4 text-right">{row.seasonB}</td>
                      <td className={`px-6 py-4 text-right font-bold flex items-center justify-end gap-1 ${isPositive ? 'text-success' : 'text-danger'}`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {row.change}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
