import { TrendingUp, TrendingDown, Map as MapIcon, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function DashboardPage() {
  const kpiData = [
    { label: 'Total Production', value: '3,180.20 T', trend: '+2.4%', up: true },
    { label: 'Cultivated Area', value: '1,250.40 Ha', trend: '+1.1%', up: true },
    { label: 'Avg Yield', value: '2.54 T/Ha', trend: '-0.5%', up: false },
    { label: 'Priority Zones', value: '14 Active', alert: true },
  ];

  const trendData = [
    { season: 'Season A 2024', yield: 2.3, production: 2800 },
    { season: 'Season B 2024', yield: 2.1, production: 2650 },
    { season: 'Season A 2025', yield: 2.6, production: 3100 },
    { season: 'Season B 2025', yield: 2.4, production: 2950 },
    { season: 'Season A 2026', yield: 2.54, production: 3180 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-text-main">National Dashboard</h1>
          <p className="text-muted text-sm mt-1">Overview of agricultural intelligence and priorities.</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, idx) => (
          <div key={idx} className="bg-surface p-5 rounded-xl border border-border-main shadow-sm flex flex-col relative overflow-hidden group">
            <div className="text-muted text-sm font-medium mb-1">{kpi.label}</div>
            <div className="text-3xl font-bold text-text-main mb-2">{kpi.value}</div>
            
            {kpi.trend && (
              <div className={`flex items-center text-xs font-semibold ${kpi.up ? 'text-agriculture' : 'text-danger'}`}>
                {kpi.up ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {kpi.trend} vs last season
              </div>
            )}
            
            {kpi.alert && (
              <div className="flex items-center text-xs font-semibold text-warning">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Action required
              </div>
            )}
            
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <MapIcon className="w-24 h-24" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-border-main shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Production & Yield Trends</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9E1EA" />
                <XAxis dataKey="season" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#667085' }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#667085' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#667085' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="production" name="Production (T)" stroke="#0D47A1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="yield" name="Yield (T/Ha)" stroke="#2E7D32" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Summary */}
        <div className="bg-surface p-6 rounded-xl border border-border-main shadow-sm flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Priority Summary</h2>
          <div className="flex-1 flex flex-col justify-center gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-danger/10 border border-danger/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-danger shadow-[0_0_8px_rgba(198,40,40,0.6)]"></div>
                <span className="font-semibold text-danger">CRITICAL</span>
              </div>
              <span className="font-bold text-lg">3</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-warning"></div>
                <span className="font-semibold text-warning">HIGH</span>
              </div>
              <span className="font-bold text-lg">7</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary-soft border border-primary-light/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary-light"></div>
                <span className="font-semibold text-primary-light">MEDIUM</span>
              </div>
              <span className="font-bold text-lg">12</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-agriculture-soft border border-agriculture/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-agriculture"></div>
                <span className="font-semibold text-agriculture">LOW</span>
              </div>
              <span className="font-bold text-lg">45</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Map Preview Area (Mock) */}
      <div className="bg-surface p-6 rounded-xl border border-border-main shadow-sm h-80 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="z-10 text-center">
          <MapIcon className="w-12 h-12 text-primary-light mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-medium">Interactive Map Preview</h3>
          <p className="text-sm text-muted mt-1">MapLibre GL JS will render geospatial layers here.</p>
        </div>
      </div>
    </div>
  );
}
