import React, { useState } from 'react';
import { 
  Users, MapPin, TrendingUp, Calendar, Search, Download, 
  ChevronRight, Filter, Wheat, Sprout
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

export default function FarmersPage() {
  const [selectedRegion, setSelectedRegion] = useState('All Rwanda');
  const [selectedSeason, setSelectedSeason] = useState('All Seasons');

  // Mock aggregated data reflecting Level 2/3 Intelligence from the dataset
  const kpis = {
    totalFarmers: '1.2M',
    seasonA: '620K',
    seasonB: '580K',
    districtsCovered: 30,
    dataYears: '2014–2026'
  };

  const trendData = [
    { season: '2019 A', farmers: 540000 },
    { season: '2019 B', farmers: 520000 },
    { season: '2020 A', farmers: 560000 },
    { season: '2020 B', farmers: 545000 },
    { season: '2021 A', farmers: 580000 },
    { season: '2021 B', farmers: 575000 },
    { season: '2022 A', farmers: 600000 },
    { season: '2026 A', farmers: 620000 },
  ];

  const cropData = [
    { name: 'Maize', farmers: 420000, color: '#f59e0b' },
    { name: 'Beans', farmers: 380000, color: '#84cc16' },
    { name: 'Cassava', farmers: 210000, color: '#10b981' },
    { name: 'Rice', farmers: 85000, color: '#0ea5e9' },
  ];

  const districtData = [
    { name: 'Nyagatare', farmers: 85400, season: '2026 A' },
    { name: 'Gatsibo', farmers: 72300, season: '2026 A' },
    { name: 'Kayonza', farmers: 64200, season: '2026 A' },
    { name: 'Bugesera', farmers: 58100, season: '2026 A' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> 
            Farmers & Agricultural Households
          </h1>
          <p className="text-sm text-muted mt-1">
            Aggregated intelligence derived from official SAS datasets (2014-2026).
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
          { label: 'TOTAL FARMERS', value: kpis.totalFarmers, icon: Users, color: 'text-blue-500' },
          { label: 'SEASON A (AVG)', value: kpis.seasonA, icon: Sprout, color: 'text-green-500' },
          { label: 'SEASON B (AVG)', value: kpis.seasonB, icon: Wheat, color: 'text-amber-500' },
          { label: 'DISTRICTS COVERED', value: kpis.districtsCovered, icon: MapPin, color: 'text-purple-500' },
          { label: 'DATA YEARS', value: kpis.dataYears, icon: Calendar, color: 'text-pink-500' },
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
        
        {/* Historical Trend */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border-main p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-sm text-text-main uppercase tracking-wider">Farmer Population Trend</h3>
            <select className="text-xs bg-background border border-border-main rounded px-2 py-1 outline-none">
              <option>2014 - 2026</option>
              <option>Last 5 Years</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFarmers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="season" tickLine={false} axisLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis tickLine={false} axisLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [new Intl.NumberFormat('en-US').format(value), 'Farmers']}
                />
                <Area type="monotone" dataKey="farmers" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorFarmers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Farmers by Crop */}
        <div className="bg-surface rounded-xl border border-border-main p-6 shadow-sm">
          <h3 className="font-bold text-sm text-text-main uppercase tracking-wider mb-6">Farmers by Crop (2026 A)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cropData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12, fontWeight: 500}} width={80} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [new Intl.NumberFormat('en-US').format(value), 'Farmers']}
                />
                <Bar dataKey="farmers" radius={[0, 4, 4, 0]} barSize={32}>
                  {cropData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Geography Data Table */}
      <div className="bg-surface rounded-xl border border-border-main overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border-main flex justify-between items-center bg-surface">
          <h3 className="font-bold text-sm text-text-main uppercase tracking-wider">Geographic Breakdown (Eastern Province)</h3>
          <button className="text-xs font-bold text-primary hover:text-primary-light flex items-center gap-1">
            View Full Map <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background/50 text-muted text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">District</th>
                <th className="px-6 py-4">Season</th>
                <th className="px-6 py-4 text-right">Farmer Population</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {districtData.map((dist, idx) => (
                <tr key={idx} className="hover:bg-background transition-colors group cursor-pointer">
                  <td className="px-6 py-4 font-semibold text-text-main flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
                    {dist.name}
                  </td>
                  <td className="px-6 py-4 text-muted">{dist.season}</td>
                  <td className="px-6 py-4 text-right font-bold text-text-main">
                    {new Intl.NumberFormat('en-US').format(dist.farmers)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary hover:text-primary-light text-xs font-semibold flex items-center gap-1 justify-end w-full">
                      View Profile <ChevronRight className="w-3 h-3" />
                    </button>
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
