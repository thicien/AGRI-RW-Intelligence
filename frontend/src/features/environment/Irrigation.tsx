import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../config/api';
import { 
  Droplets, Waves, TrendingUp, AlertTriangle, CheckCircle2, ShieldAlert, 
  MapPin, RefreshCw, FileText, Layers, Thermometer, Filter, Download, 
  Database, Award, ChevronRight, ArrowUpRight, ArrowDownRight, Compass,
  Check, Info, HelpCircle, Sun, Activity, Zap, ExternalLink
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  CartesianGrid, Cell, AreaChart, Area, LineChart, Line, Legend, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

export default function Irrigation() {
  const [activeTab, setActiveTab] = useState<'coverage' | 'seasonal' | 'deficits' | 'terrain' | 'ranking' | 'dossier'>('coverage');
  const [selectedSeason, setSelectedSeason] = useState('2026B');
  const [selectedDistrict, setSelectedDistrict] = useState('Bugesera');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  // Analytical Data States
  const [summaryData, setSummaryData] = useState<any>({ overview: {}, infrastructure: {} });
  const [districtsData, setDistrictsData] = useState<any[]>([]);
  const [availableSeasons, setAvailableSeasons] = useState<any[]>([]);
  const [screeningData, setScreeningData] = useState<any>({ rankedPotentialSites: [], criteriaWeights: [] });
  const [schemesData, setSchemesData] = useState<any>({ schemesList: [] });
  const [dossierData, setDossierData] = useState<any>(null);

  // Load Seasons Catalog Once on Mount
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const res = await fetch(apiUrl('irrigation/seasons'));
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setAvailableSeasons(list);
          }
        }
      } catch (e) {
        console.warn('Error loading irrigation seasons:', e);
      }
    };
    fetchSeasons();
  }, []);

  // Fetch Module Analytical Data when season or district filter changes
  const fetchModuleData = async () => {
    setLoading(true);
    try {
      const apiBase = apiUrl('irrigation');

      const [sumRes, distRes, screenRes, schemeRes, dosRes] = await Promise.all([
        fetch(`${apiBase}/summary?season=${selectedSeason}`).catch(() => null),
        fetch(`${apiBase}/districts?season=${selectedSeason}`).catch(() => null),
        fetch(`${apiBase}/opportunity-screening?season=${selectedSeason}`).catch(() => null),
        fetch(`${apiBase}/schemes`).catch(() => null),
        fetch(`${apiBase}/site-dossier?district=${encodeURIComponent(selectedDistrict)}&season=${selectedSeason}`).catch(() => null),
      ]);

      if (sumRes && sumRes.ok) {
        const json = await sumRes.json();
        setSummaryData(json);
      }

      if (distRes && distRes.ok) {
        const json = await distRes.json();
        setDistrictsData(Array.isArray(json) ? json : []);
      }

      if (screenRes && screenRes.ok) {
        const json = await screenRes.json();
        setScreeningData(json);
      }

      if (schemeRes && schemeRes.ok) {
        const json = await schemeRes.json();
        setSchemesData(json);
      }

      if (dosRes && dosRes.ok) {
        const json = await dosRes.json();
        setDossierData(json);
      }
    } catch (e) {
      console.warn('API error in Irrigation module:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModuleData();
  }, [selectedSeason, selectedDistrict]);

  // Fallback Seasons if API is loading
  const defaultSeasons = [
    '2026B', '2026A',
    '2025C', '2025B', '2025A',
    '2024C', '2024B', '2024A',
    '2023C', '2023B', '2023A',
    '2022C', '2022B', '2022A',
    '2021C', '2021B', '2021A',
    '2020C', '2020B', '2020A',
    '2019C', '2019B', '2019A',
    '2018C', '2018B', '2018A',
    '2017C', '2017B', '2017A',
    '2016C', '2016B', '2016A',
    '2015C', '2015B', '2015A',
    '2014B', '2014A'
  ];

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'TIER_1_IMMEDIATE_FEASIBILITY':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">TIER 1 — IMMEDIATE FEASIBILITY</span>;
      case 'TIER_2_MODERATE_OPPORTUNITY':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">TIER 2 — MODERATE OPPORTUNITY</span>;
      case 'TIER_3_HIGH_COST_OR_ENVIRONMENTAL_CONSTRAINTS':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">TIER 3 — CONSTRAINTS / TERRACING</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-300">TIER 4 — MICRO-CATCHMENT ONLY</span>;
    }
  };

  // Filtered Potential Sites for Tab 5
  const filteredSites = (screeningData.rankedPotentialSites || []).filter((s: any) => {
    if (selectedTierFilter === 'ALL') return true;
    return s.feasibility_tier === selectedTierFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      
      {/* ======================================================== */}
      {/* 1. TOP BANNER / MODULE 2 HEADER                          */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-cyan-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-cyan-500/20">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/15 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-3 border border-cyan-500/30">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Module 2 — Small-Scale Irrigation Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Droplets className="w-8 h-8 text-cyan-400" />
              Small-Scale Irrigation Opportunity Mapping
            </h1>
            <p className="text-cyan-100/70 text-sm mt-1 max-w-2xl leading-relaxed">
              Identify locations where irrigation may improve production and where feasibility studies should begin across all 30 districts and historical seasons (2014–2026).
            </p>

            {/* Quality Badge Counter */}
            <div className="mt-3 flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 font-medium">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                30 Districts Monitored
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-cyan-300/80">
                35 Seasons (2014–2026)
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-cyan-300/80">
                {summaryData.infrastructure?.documented_schemes_count || '20'} Documented Schemes
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-cyan-400 font-bold">
                {Number(summaryData.overview?.total_modern_irrigated_ha || 25540).toLocaleString()} Ha Modern Irrigated
              </span>
            </div>
          </div>

          {/* Interactive Season & District Selector */}
          <div className="flex flex-wrap items-center gap-2 bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/10 self-stretch sm:self-auto">
            {/* Season Selector */}
            <div className="flex items-center gap-1.5 px-2">
              <span className="text-xs text-white/70 font-medium">Season:</span>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
              >
                {availableSeasons.length > 0 ? (
                  availableSeasons.map((s: any) => (
                    <option key={s.season_code} value={s.season_code} className="bg-slate-900 text-white">
                      {s.season_code} ({s.official_label || s.season_code})
                    </option>
                  ))
                ) : (
                  defaultSeasons.map(s => (
                    <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>
                  ))
                )}
              </select>
            </div>

            {/* District Selector */}
            <div className="flex items-center gap-1.5 px-2 border-l border-white/10">
              <span className="text-xs text-white/70 font-medium">District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer max-w-[150px]"
              >
                {districtsData.map((d: any) => (
                  <option key={d.district_code} value={d.district_name} className="bg-slate-900 text-white">
                    {d.district_name}
                  </option>
                ))}
              </select>
            </div>

            <button 
              onClick={fetchModuleData}
              disabled={loading}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Analytical Navigation Tabs */}
        <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-2 scrollbar-none border-t border-white/10 pt-4">
          {[
            { id: 'coverage', name: 'Existing Irrigation Coverage', icon: Waves },
            { id: 'seasonal', name: 'Seasonal Irrigation Statistics', icon: TrendingUp },
            { id: 'deficits', name: 'Crop & Rainfall Deficit Overlays', icon: Thermometer },
            { id: 'terrain', name: 'Terrain, Slope & Soil Suitability', icon: Compass },
            { id: 'ranking', name: 'Opportunity Screening & Ranking', icon: Award },
            { id: 'dossier', name: 'Pre-Feasibility Dossier', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive 
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 font-bold' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-cyan-400'}`} />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CRITICAL SAFEGUARD BANNER (MANDATORY REQUIREMENT)     */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 p-4 rounded-xl text-xs text-amber-900 shadow-sm flex items-start gap-3 bg-white">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-extrabold text-amber-900 flex items-center gap-2">
            <span>CRITICAL SAFEGUARD FOR DISTRICT OFFICERS & PLANNERS</span>
            <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">MANDATORY PROTOCOL</span>
          </div>
          <p className="text-slate-700 leading-relaxed text-[11px]">
            A map showing low irrigation coverage is <strong className="text-slate-900">not enough</strong> to conclude that a site is suitable for irrigation. Water availability, seasonal crop water demand, terrain slope stability, infrastructure pumping cost, environmental flow constraints, and legal water abstraction permits must be assessed on-site. All model-generated locations are strictly labelled as <strong className="text-amber-800">POTENTIAL SITES</strong> until verified by registered civil and agricultural engineers.
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. NATIONAL IRRIGATION KPIS                              */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Reported Irrigated Area */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>REPORTED IRRIGATED AREA</span>
            <Waves className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {Number(summaryData.overview?.total_modern_irrigated_ha || 25540).toLocaleString()} <span className="text-xs font-bold text-slate-500">Ha Modern</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100 text-slate-500">
            <span>Traditional: {Number(summaryData.overview?.total_traditional_irrigated_ha || 10913).toLocaleString()} Ha</span>
            <span className="font-bold text-cyan-700">Total: {Number(summaryData.overview?.total_irrigated_ha || 36453).toLocaleString()} Ha</span>
          </div>
        </div>

        {/* KPI 2: Irrigation Coverage & Gap */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>NATIONAL IRRIGATION ACCESS</span>
            <Droplets className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2 font-mono">
            {summaryData.overview?.national_irrigation_access_pct || '2.49'}%
          </div>
          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100 text-slate-500">
            <span>Cultivated: {Number(summaryData.overview?.total_cultivated_ha || 1461296).toLocaleString()} Ha</span>
            <span className="text-rose-600 font-bold">Gap: {Number(summaryData.overview?.national_irrigation_gap_ha || 1424843).toLocaleString()} Ha</span>
          </div>
        </div>

        {/* KPI 3: Priority Opportunity Sites */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>TIER 1 FEASIBILITY CANDIDATES</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2 font-mono">
            {summaryData.overview?.tier1_priority_districts_count || '6'} <span className="text-xs font-bold text-slate-500">Districts</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100 text-slate-500">
            <span>Avg Opportunity Score</span>
            <span className="font-bold text-emerald-800">{summaryData.overview?.national_avg_opportunity_score || '57.3'}/100</span>
          </div>
        </div>

        {/* KPI 4: Infrastructure & Registered Schemes */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>DOCUMENTED SCHEMES</span>
            <Compass className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {summaryData.infrastructure?.documented_schemes_count || '20'} <span className="text-xs font-bold text-slate-500">Schemes</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100 text-slate-500">
            <span>Command: {Number(summaryData.infrastructure?.total_command_area_ha || 20613).toLocaleString()} Ha</span>
            <span className="font-bold text-indigo-700">{Number(summaryData.infrastructure?.total_scheme_beneficiaries || 48880).toLocaleString()} Farmers</span>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* TAB 1: EXISTING IRRIGATION COVERAGE                      */}
      {/* ======================================================== */}
      {activeTab === 'coverage' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Waves className="w-5 h-5 text-cyan-600" />
                  Existing Irrigation Coverage & Infrastructure by District ({selectedSeason})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official reported modern irrigated land, traditional techniques, and irrigation access percentage across all 30 Rwandan districts.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 bg-cyan-50 text-cyan-800 rounded-lg font-bold border border-cyan-200">
                  Total: {districtsData.length} Districts Analyzed
                </span>
              </div>
            </div>

            {/* Top Irrigating Districts Chart */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
                Top 15 Districts by Modern Irrigated Area (Hectares)
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtsData.slice(0, 15)} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="district_name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" stroke="#64748B" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#64748B" />
                    <RechartsTooltip 
                      formatter={(val: any) => [`${Number(val).toLocaleString()} Ha`, 'Modern Irrigated']}
                      contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="modern_irrigated_ha" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Complete 30-District Irrigation Coverage League Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">District</th>
                    <th className="py-3 px-4">Province</th>
                    <th className="py-3 px-4 text-right">Modern Irrigated (Ha)</th>
                    <th className="py-3 px-4 text-right">Traditional (Ha)</th>
                    <th className="py-3 px-4 text-right">Total Cultivated (Ha)</th>
                    <th className="py-3 px-4 text-right">Access Rate (%)</th>
                    <th className="py-3 px-4 text-right">Irrigation Gap (Ha)</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {districtsData.map((d: any) => (
                    <tr key={d.district_code} className={`hover:bg-slate-50 transition-colors ${selectedDistrict === d.district_name ? 'bg-cyan-50/60' : ''}`}>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{d.district_name}</td>
                      <td className="py-2.5 px-4 text-slate-500">{d.province_name}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-cyan-700">
                        {Number(d.modern_irrigated_ha).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                        {Number(d.traditional_irrigated_ha).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                        {Number(d.total_cultivated_ha).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${d.irrigation_access_pct >= 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                          {d.irrigation_access_pct}%
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-rose-600 font-medium">
                        {Number(d.irrigation_gap_ha).toLocaleString()} Ha
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedDistrict(d.district_name);
                            setActiveTab('dossier');
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-cyan-700 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors"
                        >
                          Dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Documented Schemes Footprint Section */}
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-600" />
                Documented Major Schemes & Infrastructure Locations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {schemesData.schemesList?.map((s: any) => (
                  <div key={s.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 hover:border-indigo-300 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-900 text-xs leading-snug">{s.name}</div>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px] shrink-0">
                        {s.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      <div><strong className="text-slate-700">District:</strong> {s.district_name} ({s.province_name})</div>
                      <div><strong className="text-slate-700">Source:</strong> {s.water_source}</div>
                      <div><strong className="text-slate-700">Method:</strong> {s.irrigation_method}</div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-slate-200 text-slate-600">
                      <span>Command: <strong className="text-indigo-700">{s.area_command_ha} Ha</strong></span>
                      <span>Beneficiaries: <strong>{s.beneficiaries_count}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SEASONAL IRRIGATION STATISTICS                    */}
      {/* ======================================================== */}
      {activeTab === 'seasonal' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Seasonal Irrigation Statistics Across All Seasons (2014–2026)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Longitudinal progression of modern irrigated land and infrastructure across 35 seasons.
                </p>
              </div>
            </div>

            {/* Longitudinal Trend Chart */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
                National Modern Irrigated Agricultural Land Evolution (2014–2026)
              </h4>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={availableSeasons.slice().reverse()} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                    <defs>
                      <linearGradient id="irrigGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284C7" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0284C7" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="season_code" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" stroke="#64748B" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#64748B" />
                    <RechartsTooltip 
                      formatter={(val: any) => [`${Number(val).toLocaleString()} Ha`, 'Modern Irrigated Area']}
                      contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="total_modern_irrigated_ha" stroke="#0284C7" strokeWidth={2.5} fillOpacity={1} fill="url(#irrigGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Seasonal Dynamics Explanation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" /> Season A (Sept – Feb)
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Main wet season with primary maize, bean, and Irish potato production. Supplemental irrigation stabilizes mid-season dry spells in the Eastern savanna zone.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Waves className="w-4 h-4 text-blue-500" /> Season B (March – June)
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Peak agricultural season with nationwide cultivation. Marshland surface schemes and valley reservoirs operate at full hydraulic capacity for rice and legumes.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-500" /> Season C (July – Sept)
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Intensive dry season production concentrated exclusively in irrigated valley bottoms, swamps, and river basins for high-value export vegetables and seed potatoes.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: CROP & RAINFALL DEFICIT OVERLAYS                  */}
      {/* ======================================================== */}
      {activeTab === 'deficits' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-rose-600" />
                  Crop Water Demand vs. Rainfall Deficit Overlays ({selectedSeason})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Analyze rainfall variability, seasonal crop evapotranspiration needs, and identify severe water deficit zones.
                </p>
              </div>
            </div>

            {/* Water Deficit by District Chart */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
                Seasonal Crop Water Deficit (mm per Season) by District
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtsData.slice().sort((a, b) => b.water_deficit_mm - a.water_deficit_mm)} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="district_name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" stroke="#64748B" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#64748B" />
                    <RechartsTooltip 
                      formatter={(val: any) => [`${val} mm`, 'Water Deficit']}
                      contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="water_deficit_mm" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Drought Vulnerability vs Irrigation Coverage Correlation */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
              <h4 className="text-sm font-bold text-slate-900">
                Drought Exposure vs. Irrigation Deficit Breakdown
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {districtsData.slice(0, 8).map((d: any) => (
                  <div key={d.district_code} className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="font-bold text-slate-900 flex justify-between items-center">
                      <span>{d.district_name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                        {d.water_deficit_mm} mm deficit
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <div>Drought Index: <strong>{d.drought_vulnerability_index}</strong> (High)</div>
                      <div>Irrigation Access: <strong>{d.irrigation_access_pct}%</strong></div>
                      <div>Unmet Gap: <strong className="text-rose-600">{Number(d.irrigation_gap_ha).toLocaleString()} Ha</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: TERRAIN, SLOPE & SOIL SUITABILITY                  */}
      {/* ======================================================== */}
      {activeTab === 'terrain' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-indigo-600" />
                  Topographical Slope, Terrain & Soil Characteristic Screening
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Screen terrain, elevation, slope hazards, and soil parameters for small-scale irrigation suitability.
                </p>
              </div>
            </div>

            {/* Terrain Matrix Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">District</th>
                    <th className="py-2.5 px-4 text-right">Avg Slope (%)</th>
                    <th className="py-2.5 px-4">Slope Classification</th>
                    <th className="py-2.5 px-4">Dominant Soil Texture</th>
                    <th className="py-2.5 px-4 text-right">Soil pH</th>
                    <th className="py-2.5 px-4 text-right">Dist to Water (km)</th>
                    <th className="py-2.5 px-4 text-right">Dist to Road (km)</th>
                    <th className="py-2.5 px-4">Recommended Irrigation Package</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {districtsData.map((d: any) => (
                    <tr key={d.district_code} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{d.district_name}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">{d.terrain_slope_pct}%</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.terrain_slope_pct <= 5 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : d.terrain_slope_pct <= 12 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-amber-100 text-amber-800'
                        }`}>
                          {d.terrain_slope_pct <= 5 ? 'GENTLE PLAIN (<5%)' : d.terrain_slope_pct <= 12 ? 'MODERATE (5-12%)' : 'STEEP EROSION RISK (>12%)'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 font-medium">{d.soil_texture}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-700">{d.soil_ph}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-700">{d.water_source_distance_km} km</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-700">{d.road_distance_km} km</td>
                      <td className="py-2.5 px-4 text-cyan-800 font-semibold">{d.recommended_technology}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: OPPORTUNITY SCREENING & RANKING                   */}
      {/* ======================================================== */}
      {activeTab === 'ranking' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  Multi-Criteria Small-Scale Irrigation Opportunity League ({selectedSeason})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rank potential small-scale irrigation sites using transparent multi-criteria formula (0–100 Score).
                </p>
              </div>

              {/* Tier Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                {['ALL', 'TIER_1_IMMEDIATE_FEASIBILITY', 'TIER_2_MODERATE_OPPORTUNITY', 'TIER_3_HIGH_COST_OR_ENVIRONMENTAL_CONSTRAINTS'].map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTierFilter(t)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${selectedTierFilter === t ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    {t === 'ALL' ? 'All Tiers' : t === 'TIER_1_IMMEDIATE_FEASIBILITY' ? 'Tier 1 Priority' : t === 'TIER_2_MODERATE_OPPORTUNITY' ? 'Tier 2' : 'Tier 3/4'}
                  </button>
                ))}
              </div>
            </div>

            {/* Transparent Criteria Weights Legend */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Transparent Opportunity Scoring Criteria (Total: 100 Points)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {screeningData.criteriaWeights?.map((c: any) => (
                  <div key={c.name} className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{c.weightPct}% Weight</span>
                      <span className="font-mono text-cyan-700 font-bold">{c.maxPoints} pts</span>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-800">{c.name}</div>
                    <p className="text-[10px] text-slate-500 leading-snug">{c.rationale}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ranked Opportunity League Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 text-center">Rank</th>
                    <th className="py-2.5 px-4">District</th>
                    <th className="py-2.5 px-4">Province</th>
                    <th className="py-2.5 px-4 text-right">Composite Score</th>
                    <th className="py-2.5 px-4">Feasibility Tier</th>
                    <th className="py-2.5 px-4 text-right">Unmet Gap (Ha)</th>
                    <th className="py-2.5 px-4 text-right">Water Deficit</th>
                    <th className="py-2.5 px-4">Recommended Technology</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSites.map((site: any, idx: number) => (
                    <tr key={site.district_code} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 text-center font-bold text-slate-400">#{idx + 1}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{site.district_name}</td>
                      <td className="py-2.5 px-4 text-slate-500">{site.province_name}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                        {site.opportunity_score}
                      </td>
                      <td className="py-2.5 px-4">
                        {getTierBadge(site.feasibility_tier)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-rose-600 font-medium">
                        {Number(site.unmet_irrigation_gap_ha).toLocaleString()} Ha
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                        {site.water_deficit_mm} mm
                      </td>
                      <td className="py-2.5 px-4 text-cyan-800 font-medium text-[11px]">
                        {site.recommended_technology}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedDistrict(site.district_name);
                            setActiveTab('dossier');
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                        >
                          Dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: PRE-FEASIBILITY DOSSIER & SAFEGUARDS              */}
      {/* ======================================================== */}
      {activeTab === 'dossier' && (
        <div className="space-y-6">
          {dossierData ? (
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-8">
              
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    POTENTIAL SITE — PRE-FEASIBILITY VERIFICATION REQUIRED
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-cyan-600" />
                    Agricultural Extension & Engineering Dossier: {dossierData.district?.name} District
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {dossierData.district?.province} • Monitored across Season {dossierData.season}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {getTierBadge(dossierData.metrics?.feasibilityTier)}
                </div>
              </div>

              {/* Dossier KPI Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">OPPORTUNITY SCORE</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
                    {dossierData.metrics?.opportunityScore}/100
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Composite Multi-Criteria Index</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">UNMET IRRIGATION GAP</div>
                  <div className="text-2xl font-black text-rose-600 mt-1 font-mono">
                    {Number(dossierData.metrics?.irrigationGapHa).toLocaleString()} <span className="text-xs text-slate-500">Ha</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Access Rate: {dossierData.metrics?.accessRatePct}%</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">SEASONAL WATER DEFICIT</div>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                    {dossierData.metrics?.waterDeficitMm} <span className="text-xs text-slate-500">mm</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Drought Index: {dossierData.metrics?.droughtIndex}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">SLOPE & TERRAIN</div>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                    {dossierData.metrics?.slopePct}% <span className="text-xs text-slate-500">Slope</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Dist to Water: {dossierData.metrics?.waterSourceDistanceKm} km</div>
                </div>
              </div>

              {/* Recommended Engineering Package */}
              <div className="p-4 bg-cyan-50/70 rounded-xl border border-cyan-200 space-y-1">
                <div className="text-xs font-bold uppercase text-cyan-900 tracking-wider">
                  Recommended Small-Scale Irrigation Technology Package
                </div>
                <div className="text-sm font-black text-cyan-950">
                  {dossierData.metrics?.recommendedTechnology}
                </div>
                <p className="text-xs text-cyan-800 leading-relaxed">
                  Tailored for {dossierData.district?.name} based on average slope ({dossierData.metrics?.slopePct}%), soil texture ({dossierData.metrics?.soilTexture}), and distance to water source ({dossierData.metrics?.waterSourceDistanceKm} km).
                </p>
              </div>

              {/* Mandatory 5-Point Engineering & Environmental Checklist */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Mandatory 5-Point Pre-Feasibility Verification Checklist (Before Investment Approval)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  District agricultural officers and irrigation engineers must complete and sign off on this checklist during on-site field visits before committing public or donor capital:
                </p>

                <div className="space-y-2.5">
                  {dossierData.feasibilityChecklist?.map((item: any, idx: number) => (
                    <div key={idx} className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{item.check}</span>
                          <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                            {item.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">{item.details}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Crops at Risk in District */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Priority Crops & Cultivated Area at Risk in {dossierData.district?.name}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {dossierData.priorityCropsAtRisk?.map((c: any) => (
                    <div key={c.crop_name} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800">{c.crop_name}</div>
                      <div className="font-mono text-slate-600 mt-0.5">{Number(c.area_ha).toLocaleString()} Ha Planted</div>
                      <div className="text-[11px] font-bold text-cyan-700 font-mono mt-0.5">
                        {c.yield_t_ha} t/ha biological yield
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source-Linked Provenance */}
              <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-1">
                <span className="font-bold text-slate-700">Official Data Source Lineage:</span>
                <p className="text-[11px] text-slate-600">{dossierData.provenance}</p>
                <p className="text-[11px] text-slate-600">{dossierData.safeguardNotice}</p>
              </div>

            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
              Select a district to view its Small-Scale Irrigation Pre-Feasibility Dossier.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
