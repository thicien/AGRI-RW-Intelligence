import React, { useState } from 'react';
import { 
  ShieldAlert, TrendingUp, Droplets, Leaf, Package, Globe,
  AlertTriangle, CheckCircle2, ChevronRight, Activity, MapPin, 
  ArrowRight, Search, Download
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from 'recharts';

export default function PriorityZonesPage() {
  const [selectedDistrict, setSelectedDistrict] = useState('Kayonza');

  // Mock data representing Level 4 Intelligence from NestJS
  const intelligenceData = {
    district: 'Kayonza',
    province: 'Eastern Province',
    overallScore: 81,
    priorityLevel: 'HIGH PRIORITY',
    primaryConstraint: 'Soil degradation',
    secondaryConstraint: 'Irrigation gap',
    opportunity: 'Processing & Export',
    
    pillars: [
      { subject: 'Productivity', A: 82, fullMark: 100, icon: TrendingUp, color: '#3b82f6' },
      { subject: 'Irrigation', A: 76, fullMark: 100, icon: Droplets, color: '#0ea5e9' },
      { subject: 'Soil', A: 88, fullMark: 100, icon: Leaf, color: '#84cc16' },
      { subject: 'Post-Harvest', A: 71, fullMark: 100, icon: Package, color: '#f59e0b' },
      { subject: 'Processing', A: 79, fullMark: 100, icon: Activity, color: '#8b5cf6' },
      { subject: 'Export', A: 84, fullMark: 100, icon: Globe, color: '#ec4899' },
    ],

    interventions: [
      { id: 1, type: 'critical', text: 'Promote soil fertility management, terracing, and erosion-control interventions.' },
      { id: 2, type: 'critical', text: 'Investigate small-scale irrigation potential (water availability and suitability).' },
      { id: 3, type: 'warning', text: 'Develop local processing and value-addition capacity to absorb surplus production.' },
      { id: 4, type: 'info', text: 'Strengthen market linkages, quality standards, and cold-chain capacity for export.' }
    ],

    historicalScores: [
      { year: '2022', score: 62 },
      { year: '2023', score: 68 },
      { year: '2024', score: 75 },
      { year: '2025', score: 78 },
      { year: '2026', score: 81 },
    ]
  };

  const getPillarColor = (score: number) => {
    if (score >= 80) return 'text-danger bg-danger/10 border-danger/20'; // High Need
    if (score >= 60) return 'text-warning bg-warning/10 border-warning/20'; // Medium Need
    return 'text-success bg-success/10 border-success/20'; // Low Need
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-danger" /> 
            Priority Zones Intelligence
          </h1>
          <p className="text-sm text-muted mt-1">
            Data-driven intervention recommendations based on the 5-pillar agricultural pipeline.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <select 
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border-main rounded-md text-sm outline-none focus:border-primary appearance-none cursor-pointer"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              <option value="Kayonza">Kayonza District</option>
              <option value="Nyagatare">Nyagatare District</option>
              <option value="Bugesera">Bugesera District</option>
              <option value="Gatsibo">Gatsibo District</option>
            </select>
          </div>
          <button className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-md shadow-sm hover:bg-primary-light transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Overall Score & Radar */}
        <div className="space-y-6">
          
          {/* Main Score Card */}
          <div className="bg-surface rounded-xl border border-border-main p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-danger/5 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 text-primary font-semibold mb-1">
                  <MapPin className="w-4 h-4" /> {intelligenceData.district}
                </div>
                <div className="text-xs text-muted uppercase tracking-wider">{intelligenceData.province}</div>
              </div>
              <div className="px-3 py-1 bg-danger/10 border border-danger/20 text-danger text-xs font-bold rounded-full animate-pulse">
                {intelligenceData.priorityLevel}
              </div>
            </div>

            <div className="flex items-end gap-3 mb-6">
              <div className="text-6xl font-black text-text-main tracking-tighter leading-none">
                {intelligenceData.overallScore}
              </div>
              <div className="text-sm font-medium text-muted mb-1">/ 100<br/>Priority Score</div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-background rounded border border-border-main">
                <div className="text-[10px] uppercase font-bold text-muted tracking-wider mb-1">Primary Constraint</div>
                <div className="font-semibold text-danger flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {intelligenceData.primaryConstraint}
                </div>
              </div>
              <div className="p-3 bg-background rounded border border-border-main">
                <div className="text-[10px] uppercase font-bold text-muted tracking-wider mb-1">Greatest Opportunity</div>
                <div className="font-semibold text-success flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> {intelligenceData.opportunity}
                </div>
              </div>
            </div>
          </div>

          {/* Radar Chart (Pillar Breakdown) */}
          <div className="bg-surface rounded-xl border border-border-main p-6 shadow-sm">
            <h3 className="font-bold text-sm text-text-main uppercase tracking-wider mb-6">Intelligence Profile</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={intelligenceData.pillars}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Priority Need" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#ef4444', fontWeight: 'bold' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column: Pillars & Interventions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* The 5 Pillars Breakdown */}
          <div className="bg-surface rounded-xl border border-border-main p-6 shadow-sm">
            <h3 className="font-bold text-sm text-text-main uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Agricultural Pillar Analysis</span>
              <span className="text-[10px] font-normal text-muted normal-case bg-background px-2 py-1 rounded border border-border-main">Scores represent Gap/Need severity (0-100)</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {intelligenceData.pillars.map((pillar) => {
                const Icon = pillar.icon;
                const statusClass = getPillarColor(pillar.A);
                return (
                  <div key={pillar.subject} className="p-4 rounded-lg border border-border-main bg-background hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-3">
                      <div className={`p-2 rounded-md ${statusClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-2xl font-bold tracking-tight">{pillar.A}</div>
                    </div>
                    <div className="font-semibold text-text-main">{pillar.subject}</div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-border-main rounded-full mt-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          pillar.A >= 80 ? 'bg-danger' : pillar.A >= 60 ? 'bg-warning' : 'bg-success'
                        }`} 
                        style={{ width: `${pillar.A}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Intervention Recommendations */}
          <div className="bg-surface rounded-xl border border-border-main p-6 shadow-sm">
            <h3 className="font-bold text-sm text-text-main uppercase tracking-wider mb-4">Recommended Interventions</h3>
            <div className="space-y-3">
              {intelligenceData.interventions.map((intervention) => (
                <div key={intervention.id} className="flex gap-4 p-4 rounded-lg bg-background border border-border-main hover:border-primary/30 transition-colors">
                  <div className="mt-0.5">
                    {intervention.type === 'critical' && <ShieldAlert className="w-5 h-5 text-danger" />}
                    {intervention.type === 'warning' && <AlertTriangle className="w-5 h-5 text-warning" />}
                    {intervention.type === 'info' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-main leading-relaxed">
                      {intervention.text}
                    </div>
                    <button className="mt-2 text-xs font-bold text-primary hover:text-primary-light flex items-center gap-1">
                      View Evidence Data <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
