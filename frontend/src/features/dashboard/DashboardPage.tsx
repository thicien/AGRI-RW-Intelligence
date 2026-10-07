import { TrendingUp, TrendingDown, Map as MapIcon, ArrowRight, ShieldAlert, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const kpiData = [
    { label: 'Production', value: '3,180.20 t', sub: '+2.4% vs last season', icon: PackageIcon },
    { label: 'Avg Yield', value: '2.54 t/ha', sub: '-0.5% vs last season', icon: BarChart3Icon },
    { label: 'Crop Area', value: '1,250.40 ha', sub: '+1.1% vs last season', icon: MapIcon },
    { label: 'Irrigated Area', value: '180.00 ha', sub: '14.4% of total area', icon: DropletsIcon },
  ];

  const trendData = [
    { season: '2024A', yield: 2.3, production: 2800 },
    { season: '2024B', yield: 2.1, production: 2650 },
    { season: '2025A', yield: 2.6, production: 3100 },
    { season: '2025B', yield: 2.4, production: 2950 },
    { season: '2026A', yield: 2.54, production: 3180 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-border-main">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Agricultural Intelligence Overview</h1>
          <p className="text-muted text-sm mt-1">National summary of agricultural productivity and priority risk areas.</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiData.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-surface p-5 border border-border-main shadow-sm flex flex-col relative overflow-hidden group">
              <div className="flex justify-between items-start mb-2">
                <div className="text-muted text-xs font-bold uppercase tracking-wider">{kpi.label}</div>
                <div className="p-1.5 bg-background rounded text-primary opacity-70">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-text-main tracking-tight mb-2">{kpi.value}</div>
              <div className="text-[13px] font-medium text-muted flex items-center">
                {kpi.sub.includes('+') ? <TrendingUp className="w-3 h-3 mr-1 text-agriculture" /> : kpi.sub.includes('-') ? <TrendingDown className="w-3 h-3 mr-1 text-danger" /> : null}
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-surface p-6 border border-border-main shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-text-main">Productivity Trend (National)</h2>
            <Link to="/analytics/productivity" className="text-sm text-primary font-medium flex items-center hover:underline">
              Full Analytics <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="season" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', color: '#F9FAFB', border: 'none', borderRadius: '4px', fontSize: '13px' }}
                  itemStyle={{ color: '#F9FAFB' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line yAxisId="left" type="monotone" dataKey="production" name="Production (t)" stroke="#0D47A1" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="yield" name="Yield (t/ha)" stroke="#2E7D32" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Zones Summary */}
        <div className="bg-surface p-6 border border-border-main shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-text-main flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Priority Zones
            </h2>
            <Link to="/priority-zones" className="text-sm text-muted hover:text-primary transition-colors">
              View All
            </Link>
          </div>
          
          <div className="flex-1 flex flex-col justify-center gap-3">
            <div className="flex items-center justify-between p-3.5 bg-background border-l-4 border-danger hover:bg-black/5 cursor-pointer transition-colors group">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-danger" />
                <span className="font-semibold text-sm">Critical</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-xl text-text-main">5</span>
                <ChevronRight className="w-4 h-4 text-muted group-hover:text-text-main transition-colors" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3.5 bg-background border-l-4 border-warning hover:bg-black/5 cursor-pointer transition-colors group">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-warning" />
                <span className="font-semibold text-sm">High</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-xl text-text-main">17</span>
                <ChevronRight className="w-4 h-4 text-muted group-hover:text-text-main transition-colors" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3.5 bg-background border-l-4 border-primary-light hover:bg-black/5 cursor-pointer transition-colors group">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-primary-light" />
                <span className="font-semibold text-sm">Medium</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-xl text-text-main">32</span>
                <ChevronRight className="w-4 h-4 text-muted group-hover:text-text-main transition-colors" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3.5 bg-background border-l-4 border-agriculture hover:bg-black/5 cursor-pointer transition-colors group">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-agriculture" />
                <span className="font-semibold text-sm">Low</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-xl text-text-main">46</span>
                <ChevronRight className="w-4 h-4 text-muted group-hover:text-text-main transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Map Preview */}
      <div className="bg-surface border border-border-main shadow-sm">
        <div className="p-4 border-b border-border-main flex justify-between items-center bg-background/50">
          <h2 className="text-base font-bold text-text-main">Agricultural Priority Map</h2>
          <Link to="/map" className="text-sm font-medium text-primary hover:underline flex items-center">
            Open Interactive Map <MapIcon className="w-4 h-4 ml-1.5" />
          </Link>
        </div>
        <div className="h-[400px] w-full bg-background flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer">
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
          
          <div className="z-10 flex flex-col items-center p-6 bg-surface/90 border border-border-main shadow-lg backdrop-blur-sm group-hover:scale-105 transition-transform duration-300">
            <MapIcon className="w-10 h-10 text-primary mb-3" />
            <h3 className="text-lg font-bold text-text-main">Explore Spatial Intelligence</h3>
            <p className="text-sm text-muted mt-2 max-w-sm text-center">
              Navigate the interactive map to investigate priority zones, view derived evidence, and create interventions.
            </p>
            <div className="mt-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded shadow-sm flex items-center">
              Launch Map <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// Icons for KPI
function PackageIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
}

function BarChart3Icon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>;
}

function DropletsIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7 2.9 7 2.9s-2.29 6.17-2.29 6.17C3.57 10 3 11.08 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.53.1 1.04.23 1.52.4.43.16.82.35 1.18.55.33.19.63.4.89.62.24.2.46.42.64.64.16.2.3.4.41.61.1.2.18.4.23.6a2.6 2.6 0 0 1 0 1.2c-.05.2-.13.4-.23.6-.11.21-.25.41-.41.61-.18.22-.4.44-.64.64a7.92 7.92 0 0 1-.89.62 10.96 10.96 0 0 1-1.18.55A12.8 12.8 0 0 1 14 11a12.8 12.8 0 0 1-1.52-.4 10.96 10.96 0 0 1-1.18-.55 7.92 7.92 0 0 1-.89-.62 5.09 5.09 0 0 1-.64-.64 2.63 2.63 0 0 1-.41-.61 1.54 1.54 0 0 1-.23-.6 2.6 2.6 0 0 1 0-1.2c.05-.2.13-.4.23-.6.11-.21.25-.41.41-.61.18-.22.4-.44.64-.64.26-.22.56-.43.89-.62.36-.2.75-.39 1.18-.55Z"/><path d="M14 11a12.8 12.8 0 0 0 1.52.4c.43.16.82.35 1.18.55.33.19.63.4.89.62.24.2.46.42.64.64.16.2.3.4.41.61.1.2.18.4.23.6a2.6 2.6 0 0 1 0 1.2c-.05.2-.13.4-.23.6-.11.21-.25.41-.41.61-.18.22-.4.44-.64.64a7.92 7.92 0 0 1-.89.62A10.96 10.96 0 0 1 14 18.58a12.8 12.8 0 0 1-1.52-.4 10.96 10.96 0 0 1-1.18-.55 7.92 7.92 0 0 1-.89-.62 5.09 5.09 0 0 1-.64-.64 2.63 2.63 0 0 1-.41-.61 1.54 1.54 0 0 1-.23-.6 2.6 2.6 0 0 1 0-1.2c.05-.2.13-.4.23-.6.11-.21.25-.41.41-.61.18-.22.4-.44.64-.64.26-.22.56-.43.89-.62.36-.2.75-.39 1.18-.55Z"/></svg>;
}
