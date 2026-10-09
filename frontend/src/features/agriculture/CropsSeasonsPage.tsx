import React, { useState } from 'react';
import { 
  Leaf, Calendar, Sprout, TrendingUp, Filter, Download, 
  ChevronRight, ArrowUpRight, ArrowDownRight, Sun
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LineChart, Line, Legend
} from 'recharts';

export default function CropsSeasonsPage() {
  const [selectedCrop, setSelectedCrop] = useState('Maize');
  const [selectedMetric, setSelectedMetric] = useState('Production (MT)');

  // Mock KPIs
  const kpis = {
    totalCrops: 32,
    cropGroups: 6,
    activeSeasons: 26,
    yearsCovered: '2014–2026'
  };

  // Maize historical performance (Production & Yield)
  const historicalTrend = [
    { season: '2023 A', production: 340000, yield: 1.6 },
    { season: '2023 B', production: 320000, yield: 1.5 },
    { season: '2024 A', production: 360000, yield: 1.7 },
    { season: '2024 B', production: 345000, yield: 1.6 },
    { season: '2025 A', production: 380000, yield: 1.8 },
    { season: '2025 B', production: 350000, yield: 1.7 },
    { season: '2026 A', production: 410000, yield: 1.9 },
  ];

  // Season A vs Season B
  const seasonComparison = [
    { indicator: 'Cultivated area (ha)', seasonA: '320,000', seasonB: '280,000', change: '+14.2%' },
    { indicator: 'Harvested area (ha)', seasonA: '310,000', seasonB: '275,000', change: '+12.7%' },
    { indicator: 'Production (MT)', seasonA: '410,000', seasonB: '350,000', change: '+17.1%' },
    { indicator: 'Average Yield (MT/ha)', seasonA: '1.9', seasonB: '1.7', change: '+11.7%' },
  ];

  // Crop x Season Matrix
  const cropMatrix = [
    { crop: 'Maize', s2025A: 380000, s2025B: 350000, s2026A: 410000 },
    { crop: 'Beans', s2025A: 250000, s2025B: 230000, s2026A: 265000 },
    { crop: 'Cassava', s2025A: 850000, s2025B: 820000, s2026A: 880000 },
    { crop: 'Rice', s2025A: 110000, s2025B: 105000, s2026A: 125000 },
    { crop: 'Irish Potatoes', s2025A: 450000, s2025B: 440000, s2026A: 480000 },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <Leaf className="w-6 h-6 text-primary" /> 
            Crop & Seasonal Intelligence
          </h1>
          <p className="text-sm text-muted mt-1">
            Analyze crop production, yields, and seasonal dynamics from 2014–2026.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select 
              className="pl-4 pr-8 py-2 bg-surface border border-border-main rounded-md text-sm outline-none focus:border-primary appearance-none cursor-pointer"
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
            >
              <option value="Maize">Maize (Cereals)</option>
              <option value="Beans">Beans (Legumes)</option>
              <option value="Cassava">Cassava (Roots & Tubers)</option>
              <option value="Rice">Rice (Cereals)</option>
            </select>
          </div>
          <button className="px-4 py-2 bg-surface border border-border-main text-text-main text-sm font-semibold rounded-md shadow-sm hover:bg-background transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL CROPS TRACKED', value: kpis.totalCrops, icon: Sprout, color: 'text-green-500' },
          { label: 'CROP GROUPS', value: kpis.cropGroups, icon: Leaf, color: 'text-emerald-500' },
          { label: 'ACTIVE SEASONS', value: kpis.activeSeasons, icon: Sun, color: 'text-amber-500' },
          { label: 'YEARS COVERED', value: kpis.yearsCovered, icon: Calendar, color: 'text-purple-500' },
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

      {/* Historical Performance Chart */}
      <div className="bg-surface rounded-xl border border-border-main p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="font-bold text-sm text-text-main uppercase tracking-wider">Historical Crop Performance: {selectedCrop}</h3>
            <p className="text-xs text-muted">Production vs Yield trajectory across seasons</p>
          </div>
          <div className="flex gap-2 bg-background p-1 rounded-md border border-border-main">
            <button 
              className={`px-3 py-1 text-xs font-bold rounded ${selectedMetric === 'Production (MT)' ? 'bg-primary text-white shadow' : 'text-muted hover:text-text-main'}`}
              onClick={() => setSelectedMetric('Production (MT)')}
            >
              Production
            </button>
            <button 
              className={`px-3 py-1 text-xs font-bold rounded ${selectedMetric === 'Yield (MT/ha)' ? 'bg-primary text-white shadow' : 'text-muted hover:text-text-main'}`}
              onClick={() => setSelectedMetric('Yield (MT/ha)')}
            >
              Yield
            </button>
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicalTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={selectedMetric === 'Production (MT)' ? "#f59e0b" : "#8b5cf6"} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={selectedMetric === 'Production (MT)' ? "#f59e0b" : "#8b5cf6"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="season" tickLine={false} axisLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tick={{fill: '#6b7280', fontSize: 12}} 
                tickFormatter={(val) => selectedMetric === 'Production (MT)' ? `${val / 1000}k` : val}
              />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [
                  selectedMetric === 'Production (MT)' ? new Intl.NumberFormat('en-US').format(value) : value, 
                  selectedMetric
                ]}
              />
              <Area 
                type="monotone" 
                dataKey={selectedMetric === 'Production (MT)' ? 'production' : 'yield'} 
                stroke={selectedMetric === 'Production (MT)' ? "#f59e0b" : "#8b5cf6"} 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorMetric)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Season A vs Season B */}
        <div className="bg-surface rounded-xl border border-border-main overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-border-main flex justify-between items-center bg-surface">
            <div>
              <h3 className="font-bold text-sm text-text-main uppercase tracking-wider">{selectedCrop}: Season A vs B</h3>
              <p className="text-xs text-muted">Year: 2025</p>
            </div>
            <button className="text-xs font-bold text-primary hover:text-primary-light flex items-center gap-1">
              Change Year <ChevronRight className="w-3 h-3" />
            </button>
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

        {/* Crop x Season Matrix */}
        <div className="bg-surface rounded-xl border border-border-main overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-border-main flex justify-between items-center bg-surface">
            <div>
              <h3 className="font-bold text-sm text-text-main uppercase tracking-wider">Crop × Season Matrix</h3>
              <p className="text-xs text-muted">Metric: Production (MT)</p>
            </div>
            <button className="text-xs font-bold text-primary hover:text-primary-light flex items-center gap-1">
              Export Matrix <Download className="w-3 h-3 ml-1" />
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm h-full">
              <thead className="bg-background/50 text-muted text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Crop</th>
                  <th className="px-6 py-4 text-right">2025 A</th>
                  <th className="px-6 py-4 text-right">2025 B</th>
                  <th className="px-6 py-4 text-right">2026 A</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {cropMatrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-background transition-colors group">
                    <td className="px-6 py-4 font-semibold text-text-main">{row.crop}</td>
                    <td className="px-6 py-4 text-right">{new Intl.NumberFormat('en-US').format(row.s2025A)}</td>
                    <td className="px-6 py-4 text-right text-muted">{new Intl.NumberFormat('en-US').format(row.s2025B)}</td>
                    <td className="px-6 py-4 text-right font-bold text-text-main">{new Intl.NumberFormat('en-US').format(row.s2026A)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
