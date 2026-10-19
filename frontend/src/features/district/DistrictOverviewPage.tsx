import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  Sprout, Droplets, Mountain, Warehouse, Globe, 
  TrendingUp, MapPin, CheckCircle2, AlertTriangle, ArrowUpRight,
  ShieldAlert, ShieldCheck, Activity, BarChart3, Layers, Filter,
  FileText, Clock, ExternalLink, RefreshCw, CheckSquare, ChevronRight
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function DistrictOverviewPage() {
  const { districtName, seasonCode } = useOutletContext<{ districtName: string; seasonCode: string }>();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Map layer toggle: Productivity | Irrigation | Soil | Facilities
  const [activeMapLayer, setActiveMapLayer] = useState<'PRODUCTIVITY' | 'IRRIGATION' | 'SOIL' | 'FACILITIES'>('PRODUCTIVITY');

  // Interactive selected sector for deep dive
  const [selectedSector, setSelectedSector] = useState<any>(null);

  // Intervention modal
  const [updatingIntervention, setUpdatingIntervention] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<string>('IN_PROGRESS');
  const [updateNotes, setUpdateNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:3000/api/v1/district/overview?district=${encodeURIComponent(districtName)}&season=${seasonCode}`, {
        headers
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to load ${districtName} data.`);
      }

      const json = await res.json();
      setData(json);
      if (json.sectors && json.sectors.length > 0) {
        setSelectedSector(json.sectors[0]);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Error fetching district overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [districtName, seasonCode]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingIntervention) return;
    setUpdating(true);
    try {
      const res = await fetch(`http://localhost:3000/api/v1/district/interventions/${updatingIntervention.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes: updateNotes })
      });
      if (res.ok) {
        setUpdatingIntervention(null);
        fetchOverview();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <div className="text-sm font-semibold text-slate-600">
          Loading verified district intelligence for {districtName}...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 max-w-2xl mx-auto my-8">
        <div className="flex items-center gap-2 font-bold mb-1">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>Access Restricted or Data Unavailable</span>
        </div>
        <p className="text-sm text-rose-700 mb-4">{error}</p>
        <button 
          onClick={fetchOverview}
          className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800"
        >
          Retry Authorization
        </button>
      </div>
    );
  }

  const { district, kpis, seasonalTrends, fiveAreas, sectors, interventions } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* 1. DISTRICT OVERVIEW HEADER BANNER */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                Assigned District · {district.name}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Authorized Data Only
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {district.name} District Agricultural Overview
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Monitor agricultural performance, identify priority areas and plan district interventions across available NISR survey baselines.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/district/reports"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              Generate District Report
            </Link>
          </div>
        </div>
      </div>

      {/* 2. THE 4 MANDATORY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Crop Production */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Crop Production</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Sprout className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {kpis.cropProductionTonnes?.toLocaleString() || '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
            <span>Selected period · tonnes</span>
          </div>
        </div>

        {/* Card 2: Cultivated Area */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cultivated Area</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Mountain className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {kpis.cultivatedAreaHa?.toLocaleString() || '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
            <span>Selected period · ha</span>
          </div>
        </div>

        {/* Card 3: Average Yield */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Yield</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {kpis.averageYieldTonnesPerHa || '—'} <span className="text-base font-semibold text-slate-500">t/ha</span>
          </div>
          <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
            <span>Compatible records only</span>
          </div>
        </div>

        {/* Card 4: Priority Assessments */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Priority Assessments</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {kpis.priorityAssessmentsCount || '0'}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
            <span>Authorized assessments</span>
          </div>
        </div>

      </div>

      {/* 3. DISTRICT AGRICULTURAL MAP & SECTOR EXPLORATION */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-700" />
              <h2 className="text-lg font-bold text-slate-900">
                District Agricultural Map ({district.name})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Explore sector-level crop productivity, irrigation indicators, soil-related information and recorded agricultural facilities.
            </p>
          </div>

          {/* Map Layer Switcher: Productivity | Irrigation | Soil | Facilities */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['PRODUCTIVITY', 'IRRIGATION', 'SOIL', 'FACILITIES'] as const).map((layer) => (
              <button
                key={layer}
                onClick={() => setActiveMapLayer(layer)}
                className={`
                  px-3 py-1.5 rounded-md text-xs font-bold transition-all
                  ${activeMapLayer === layer 
                    ? 'bg-emerald-700 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-emerald-800 hover:bg-slate-200/70'}
                `}
              >
                {layer.charAt(0) + layer.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Map Grid: Visual interactive sector map + Sector Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Visual Interactive Map Widget (Scoped strictly to District) */}
          <div className="lg:col-span-2 relative h-[360px] rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex flex-col justify-end p-5">
            {/* Background Map Imagery */}
            <img 
              src="https://images.unsplash.com/photo-1593352216447-068305e54d8f?auto=format&fit=crop&q=80" 
              alt="Rwanda Agricultural Landscape"
              className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/60 to-transparent"></div>

            {/* Simulated Sector Boundaries strictly for assigned district */}
            <div className="relative z-10 grid grid-cols-3 sm:grid-cols-5 gap-2 my-auto py-4">
              {sectors.map((sec: any) => {
                const isSelected = selectedSector?.name === sec.name;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedSector(sec)}
                    className={`
                      p-2.5 rounded-lg text-left backdrop-blur-md transition-all border
                      ${isSelected 
                        ? 'bg-emerald-600 text-white border-white ring-2 ring-emerald-300 shadow-md' 
                        : 'bg-white/15 text-white hover:bg-white/25 border-white/20'}
                    `}
                  >
                    <div className="text-[10px] font-bold tracking-wider uppercase opacity-75">
                      Sector
                    </div>
                    <div className="text-xs font-extrabold truncate">
                      {sec.name}
                    </div>
                    <div className="text-[11px] font-semibold mt-1">
                      {activeMapLayer === 'PRODUCTIVITY' && `${sec.yield_t_ha} t/ha`}
                      {activeMapLayer === 'IRRIGATION' && `${sec.irrigation_coverage_pct}% irr.`}
                      {activeMapLayer === 'SOIL' && `pH ${sec.soil_ph}`}
                      {activeMapLayer === 'FACILITIES' && `${sec.facilities_count} hub(s)`}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Map Footer Disclaimer */}
            <div className="relative z-10 flex items-center justify-between text-[11px] text-emerald-200/80 pt-2 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified {district.name} boundaries & authorized sector polygons loaded</span>
              </div>
              <Link 
                to="/district/map" 
                className="text-white font-bold hover:underline inline-flex items-center gap-1"
              >
                Expand Full GIS Exploration <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Selected Sector Inspector Panel */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
            {selectedSector ? (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase">
                      Sector Dossier
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      {selectedSector.name} Sector
                    </h3>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    selectedSector.performance_status === 'EXCELLING' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : selectedSector.performance_status === 'ATTENTION_REQUIRED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedSector.performance_status.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-xs py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Primary Crop:</span>
                    <span className="font-bold text-slate-800">{selectedSector.primary_crop}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Average Yield:</span>
                    <span className="font-bold text-slate-800">{selectedSector.yield_t_ha} tonnes/ha</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Cultivated Area:</span>
                    <span className="font-bold text-slate-800">{selectedSector.cultivated_area_ha.toLocaleString()} ha</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Irrigation Coverage:</span>
                    <span className="font-bold text-slate-800">{selectedSector.irrigation_coverage_pct}%</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Soil Acidity (pH):</span>
                    <span className="font-bold text-slate-800">{selectedSector.soil_ph}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Recorded Facilities:</span>
                    <span className="font-bold text-slate-800">{selectedSector.facilities_count} Verified</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12">
                Click any sector to inspect localized agricultural indicators.
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 mt-4">
              <Link 
                to="/district/interventions"
                className="w-full text-center block py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Plan Field Intervention in {selectedSector?.name || 'Sector'}
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* 4. SEASONAL AGRICULTURAL TRENDS (Season A vs Season B Comparisons) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-700" />
              <h2 className="text-lg font-bold text-slate-900">Seasonal Agricultural Trends ({district.name})</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare crop production and yield across available years and seasons (Season A vs Season B NISR baseline).
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-3 h-3 rounded-full bg-emerald-600"></span> Season A (Major Harvest)
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span> Season B (Secondary)
            </span>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={seasonalTrends.map((t: any) => ({
                year: t.year,
                'Season A Yield (t/ha)': t.seasonA?.yield || 0,
                'Season B Yield (t/ha)': t.seasonB?.yield || 0,
                'Season A Production (MT)': t.seasonA?.production || 0,
                'Season B Production (MT)': t.seasonB?.production || 0
              }))}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Bar dataKey="Season A Yield (t/ha)" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Season B Yield (t/ha)" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. FIVE AREAS OF RESPONSIBILITY OVERVIEW CARDS */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Five Areas of Responsibility
          </h2>
          <p className="text-xs text-slate-500">
            Core analytical pillars authorized for the District Agricultural Office.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Pillar 1: Productivity */}
          <Link 
            to="/district/productivity"
            className="group bg-white p-5 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                  <Sprout className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-emerald-800 text-base">
                1. Agricultural Productivity
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Yield, production, and cultivated area for main crops across {district.name} sectors.
              </p>
              
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Average Yield:</span>
                  <span className="font-bold text-slate-800">{fiveAreas.productivity.yield} t/ha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Production:</span>
                  <span className="font-bold text-slate-800">{fiveAreas.productivity.production?.toLocaleString()} tonnes</span>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-emerald-700 flex items-center gap-1">
              Explore Productivity Analytics <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Pillar 2: Irrigation Opportunities */}
          <Link 
            to="/district/irrigation"
            className="group bg-white p-5 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center group-hover:bg-cyan-700 group-hover:text-white transition-colors">
                  <Droplets className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-emerald-800 text-base">
                2. Irrigation Opportunities
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Coverage indicators, small-scale pumping feasibility, and marshland potential.
              </p>
              
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Irrigated Coverage:</span>
                  <span className="font-bold text-slate-800">{fiveAreas.irrigation.irrigatedAreaHa?.toLocaleString()} ha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Feasibility Score:</span>
                  <span className="font-bold text-cyan-800">{fiveAreas.irrigation.feasibilityScore}/100</span>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-emerald-700 flex items-center gap-1">
              Review Irrigation Dossier <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Pillar 3: Soil & Fertility */}
          <Link 
            to="/district/soil"
            className="group bg-white p-5 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-700 group-hover:text-white transition-colors">
                  <Mountain className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-emerald-800 text-base">
                3. Soil & Fertility
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Soil acidity profile, erosion risks, terracing status, and liming requirements.
              </p>
              
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Average Soil pH:</span>
                  <span className="font-bold text-slate-800">{fiveAreas.soil.avgPh}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Erosion Susceptibility:</span>
                  <span className="font-bold text-amber-800">{fiveAreas.soil.erosionRiskPct}%</span>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-emerald-700 flex items-center gap-1">
              Inspect Soil & Conservation <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Pillar 4: Post-Harvest & Storage */}
          <Link 
            to="/district/post-harvest"
            className="group bg-white p-5 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-700 group-hover:text-white transition-colors">
                  <Warehouse className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-emerald-800 text-base">
                4. Post-Harvest & Storage
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Recorded warehouses, drying floors, cold storage capacity, and post-harvest gap.
              </p>
              
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Storage Capacity:</span>
                  <span className="font-bold text-slate-800">{fiveAreas.postHarvest.storageCapacityMt?.toLocaleString()} MT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Post-Harvest Loss:</span>
                  <span className="font-bold text-rose-700">{fiveAreas.postHarvest.lossPct}%</span>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-emerald-700 flex items-center gap-1">
              Examine Storage Deficit <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Pillar 5: Export Opportunities */}
          <Link 
            to="/district/exports"
            className="group bg-white p-5 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-700 group-hover:text-white transition-colors">
                  <Globe className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-emerald-800 text-base">
                5. Export Market Opportunities
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                High-value export crops, standards readiness, and international market access.
              </p>
              
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Export Readiness:</span>
                  <span className="font-bold text-purple-800">{fiveAreas.exports.accessScore}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Export Volume:</span>
                  <span className="font-bold text-slate-800">{fiveAreas.exports.volumeMt?.toLocaleString()} MT</span>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-emerald-700 flex items-center gap-1">
              View Export Assessments <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* District Action Card */}
          <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-5 rounded-xl text-white flex flex-col justify-between shadow-md">
            <div>
              <div className="inline-block px-2.5 py-1 rounded bg-white/20 text-white text-[10px] font-bold tracking-wider uppercase mb-3">
                Officer Actions
              </div>
              <h3 className="text-lg font-bold">
                Follow Up & Field Verifications
              </h3>
              <p className="text-xs text-emerald-100/90 mt-1.5">
                Review priority assessments, record sector verifications and track assigned intervention activities.
              </p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <Link 
                to="/district/interventions"
                className="flex-1 text-center py-2 px-3 bg-white text-emerald-900 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-colors"
              >
                Manage Interventions
              </Link>
              <Link 
                to="/district/reports"
                className="flex-1 text-center py-2 px-3 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors border border-emerald-500/50"
              >
                Export Brief
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* 6. RECOMMENDED ACTIONS AND FIELD FOLLOW-UP TABLE */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-700" />
              <h2 className="text-lg font-bold text-slate-900">
                Authorized Interventions & Field Follow-Up ({district.name})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review priority assessments, assign authorized follow-up activities, record verification results and generate district reports.
            </p>
          </div>

          <Link 
            to="/district/interventions" 
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            View All District Tasks <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {interventions && interventions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-1">Priority / Area</th>
                  <th className="pb-3">Intervention Title & Scope</th>
                  <th className="pb-3">Target Sector</th>
                  <th className="pb-3">Target Objective</th>
                  <th className="pb-3">Budget (RWF)</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-1">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {interventions.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pl-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          item.priority_level === 'CRITICAL' ? 'bg-rose-500' : item.priority_level === 'HIGH' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span className="font-bold text-slate-900">{item.priority_level}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {item.challenge_area}
                      </div>
                    </td>
                    <td className="py-3 max-w-xs">
                      <div className="font-bold text-slate-900 leading-snug">{item.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.description}</div>
                    </td>
                    <td className="py-3 font-semibold text-emerald-800">
                      {item.sector_name || district.name}
                    </td>
                    <td className="py-3 font-medium text-slate-600">
                      {item.target_metric || 'Yield improvement'}
                    </td>
                    <td className="py-3 font-semibold text-slate-800">
                      {item.budget_rwf ? `${(item.budget_rwf / 1000000).toFixed(1)}M RWF` : '—'}
                    </td>
                    <td className="py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'PLANNED' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 text-right pr-1">
                      <button
                        onClick={() => {
                          setUpdatingIntervention(item);
                          setNewStatus(item.status);
                          setUpdateNotes('');
                        }}
                        className="px-3 py-1 bg-slate-100 hover:bg-emerald-700 hover:text-white rounded-lg text-slate-700 text-xs font-semibold transition-colors"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            No authorized interventions registered for {district.name} District.
          </div>
        )}
      </div>

      {/* 7. UPDATE INTERVENTION STATUS MODAL */}
      {updatingIntervention && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">
              Update District Intervention Status
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              {updatingIntervention.title} ({updatingIntervention.sector_name || district.name} Sector)
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Progress Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="PROPOSED">PROPOSED — Awaiting approval</option>
                  <option value="PLANNED">PLANNED — Budget & site scheduled</option>
                  <option value="IN_PROGRESS">IN_PROGRESS — Field work underway</option>
                  <option value="COMPLETED">COMPLETED — Verification verified</option>
                  <option value="CANCELLED">CANCELLED — Deferred</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Field Verification Notes & Findings
                </label>
                <textarea
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Record verification findings, progress milestones, or challenges encountered..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUpdatingIntervention(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  {updating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Status Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
