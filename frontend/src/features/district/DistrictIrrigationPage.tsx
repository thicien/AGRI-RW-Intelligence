import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  Droplets, TrendingUp, TrendingDown, Minus, Filter, RefreshCw, AlertTriangle, 
  Layers, ArrowUpRight, CheckCircle2, ChevronRight, Download, Search,
  Calendar, Info, AlertCircle, ArrowUpDown, ExternalLink, Eye, X, Shield,
  BarChart3, Award, Sparkles, Scale, FileText, ArrowRight, Sun, Zap,
  Mountain, Plus, MapPin, Compass, CheckSquare, SlidersHorizontal, Sprout
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface SeasonItem {
  season_id: string;
  season_code: string;
  year: number;
  season_name: string;
  official_label: string;
  source_reference: string;
}

interface DocumentedScheme {
  id: string;
  name: string;
  irrigation_type: string;
  water_source: string;
  irrigation_method: string;
  area_command_ha: number;
  area_irrigable_ha: number;
  operational_status: string;
  beneficiaries_count: number;
  operator_name: string;
  commissioned_date: string | null;
  last_verified_at: string | null;
  coordinates?: [number, number] | null;
}

interface CandidateArea {
  candidate_id: string;
  rank: number;
  site_name: string;
  sector: string;
  potential_area_ha: number;
  existing_status: string;
  recommended_technology: string;
  opportunity_score: number;
  feasibility_tier: string;
  supporting_evidence: {
    water_source_proximity: string;
    terrain_slope: string;
    soil_suitability: string;
    drought_risk_offset: string;
    road_access: string;
  };
  missing_data_uncertainty: string;
  recommended_next_step: string;
  estimated_cost_rwf: number;
  estimated_beneficiary_households: number;
}

const ALL_RWANDA_DISTRICTS = [
  'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi', 'Gisagara',
  'Huye', 'Kamonyi', 'Karongi', 'Kayonza', 'Kicukiro', 'Kirehe', 'Muhanga',
  'Musanze', 'Ngoma', 'Ngororero', 'Nyabihu', 'Nyagatare', 'Nyamagabe',
  'Nyamasheke', 'Nyanza', 'Nyarugenge', 'Nyaruguru', 'Rubavu', 'Ruhango',
  'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana'
];

export default function DistrictIrrigationPage() {
  const { districtName: contextDistrict, seasonCode: contextSeason } = useOutletContext<{ 
    districtName: string; 
    seasonCode: string; 
  }>();

  // Active user / auth state
  const currentUser = useMemo(() => {
    try {
      const u = localStorage.getItem('agrilens_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const isNationalUser = currentUser && currentUser.role !== 'DISTRICT_OFFICER';
  const assignedDistrict = currentUser?.district || contextDistrict || 'Musanze';

  // State
  const [selectedDistrict, setSelectedDistrict] = useState<string>(assignedDistrict);
  const [activeSeason, setActiveSeason] = useState<string>(contextSeason || '2026B');
  const [compareMode, setCompareMode] = useState<string>('same_season_prev_year');
  const [customCompareSeason, setCustomCompareSeason] = useState<string>('');

  // 7 Tabs: 'overview' | 'existing_irrigation' | 'seasonal_comparison' | 'irrigation_opportunities' | 'priority_areas' | 'irrigation_productivity' | 'data_coverage'
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Filters for Existing Irrigation Tab
  const [schemeSearch, setSchemeSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modal for scheme details
  const [selectedSchemeModal, setSelectedSchemeModal] = useState<DocumentedScheme | null>(null);

  // Data fetching
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // Sync selectedDistrict with context
  useEffect(() => {
    if (!isNationalUser) {
      setSelectedDistrict(assignedDistrict);
    }
  }, [assignedDistrict, isNationalUser]);

  // Fetch irrigation data
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = `http://localhost:3000/api/v1/district/irrigation?district=${encodeURIComponent(selectedDistrict)}&season=${activeSeason}&compareMode=${compareMode}`;
      if (compareMode === 'custom' && customCompareSeason) {
        url += `&compareSeason=${customCompareSeason}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to fetch district irrigation (${res.status})`);
      }
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error loading irrigation dataset.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDistrict, activeSeason, compareMode, customCompareSeason]);

  // Helpers
  const seasons: SeasonItem[] = data?.availableSeasons || [];
  const activeSeasonObj = seasons.find(s => s.season_code === activeSeason);
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(seasons.map(s => s.year))).sort((a, b) => b - a);
    return years.length > 0 ? years : [2026, 2025, 2024, 2023];
  }, [seasons]);

  const activeYear = activeSeasonObj?.year || (activeSeason ? parseInt(activeSeason.slice(0, 4), 10) : 2026);
  const activeSeasonLetter = activeSeasonObj?.season_name?.slice(-1) || (activeSeason ? activeSeason.slice(-1) : 'B');

  const handleYearChange = (year: number) => {
    const targetCode = `${year}${activeSeasonLetter}`;
    const exists = seasons.some(s => s.season_code === targetCode);
    if (exists) {
      setActiveSeason(targetCode);
    } else {
      const firstInYear = seasons.find(s => s.year === year);
      setActiveSeason(firstInYear ? firstInYear.season_code : targetCode);
    }
  };

  const handleSeasonLetterChange = (letter: string) => {
    const targetCode = `${activeYear}${letter}`;
    setActiveSeason(targetCode);
  };

  const comparisonSeasonLabel = useMemo(() => {
    const compCode = data?.season?.comparison;
    if (!compCode) return 'No baseline selected';
    const found = seasons.find(s => s.season_code === compCode);
    return found ? `${found.official_label} (${compCode})` : compCode;
  }, [data, seasons]);

  // Filtered schemes
  const documentedSchemes: DocumentedScheme[] = data?.documentedSchemes || [];
  const filteredSchemes = useMemo(() => {
    return documentedSchemes.filter(s => {
      if (schemeSearch.trim() && !s.name.toLowerCase().includes(schemeSearch.toLowerCase()) && !s.water_source.toLowerCase().includes(schemeSearch.toLowerCase())) {
        return false;
      }
      if (statusFilter !== 'ALL' && s.operational_status.toUpperCase() !== statusFilter) {
        return false;
      }
      if (typeFilter !== 'ALL' && s.irrigation_type.toUpperCase() !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [documentedSchemes, schemeSearch, statusFilter, typeFilter]);

  // Export Irrigation Schemes CSV
  const exportSchemesCSV = () => {
    if (!filteredSchemes.length) return;
    const headers = [
      'Scheme Name',
      'Asset Type',
      'Water Source',
      'Irrigation Method',
      'Command Area (ha)',
      'Irrigable Area (ha)',
      'Status',
      'Beneficiaries Count',
      'Operator'
    ];
    const rows = filteredSchemes.map(s => [
      `"${s.name}"`,
      `"${s.irrigation_type}"`,
      `"${s.water_source}"`,
      `"${s.irrigation_method}"`,
      s.area_command_ha,
      s.area_irrigable_ha,
      s.operational_status,
      s.beneficiaries_count,
      `"${s.operator_name}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedDistrict}_Irrigation_Schemes_${activeSeason}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const kpis = data?.summaryKPIs || {};
  const candidates: CandidateArea[] = data?.candidateAreas || [];
  const sectorBreakdown = data?.sectorBreakdown || [];
  const cropLinkage = data?.cropIrrigationLinkage || [];
  const historicalProgression = data?.historicalProgression || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. TOP HEADER & SCOPE BAR */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-800 tracking-wide uppercase">
              Area of Responsibility 2 · Irrigation Intelligence
            </span>
            <span className="text-xs text-slate-400">•</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Shield className="w-3.5 h-3.5 text-cyan-700" />
              <span>{selectedDistrict} District Scope</span>
              {!isNationalUser && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-normal">
                  DAO Restricted
                </span>
              )}
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Irrigation Intelligence & Infrastructure Assessment
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Distinguishing documented existing infrastructure, multi-criteria spatial opportunities, and proposed interventions for {selectedDistrict} District.
          </p>
        </div>

        {/* Right actions: National District Switcher, Propose Intervention, CSV */}
        <div className="flex flex-wrap items-center gap-3">
          {isNationalUser && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
              <label htmlFor="dist-select" className="font-semibold text-slate-600">
                District:
              </label>
              <select
                id="dist-select"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {ALL_RWANDA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Link
            to="/district/interventions"
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Propose Intervention</span>
          </Link>

          <button
            onClick={exportSchemesCSV}
            disabled={!filteredSchemes.length}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchData}
            title="Refresh Data"
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. SEASON AND COMPARISON FILTERS */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Reporting Period and Comparison Controls
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Comparison Baseline:</span>
            <span className="font-bold text-cyan-900 bg-cyan-50 px-2.5 py-1 rounded-md border border-cyan-200 flex items-center gap-1.5">
              <span>{activeSeason}</span>
              <ArrowRight className="w-3 h-3 text-cyan-600" />
              <span>{comparisonSeasonLabel}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* A. Reporting Year */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Reporting Year
            </label>
            <select
              value={activeYear}
              onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Year {yr}
                </option>
              ))}
            </select>
          </div>

          {/* B. Selected Season */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Selected Season
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
              {['A', 'B', 'C'].map((lettr) => {
                const isSelected = activeSeasonLetter === lettr;
                return (
                  <button
                    key={lettr}
                    onClick={() => handleSeasonLetterChange(lettr)}
                    className={`py-1.5 rounded-md text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-cyan-700 text-white shadow-xs'
                        : 'text-slate-700 hover:text-cyan-800 hover:bg-white/60'
                    }`}
                  >
                    Season {lettr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* C. Compare Against */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Compare Against
            </label>
            <select
              value={compareMode}
              onChange={(e) => setCompareMode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="same_season_prev_year">Previous year's same season (Default)</option>
              <option value="prev_season">Immediately previous season</option>
              <option value="custom">Choose custom period</option>
            </select>
          </div>

          {/* D. Custom Baseline Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {compareMode === 'custom' ? 'Custom Comparison Period' : 'Infrastructure Registry Cadence'}
            </label>
            {compareMode === 'custom' ? (
              <select
                value={customCompareSeason || data?.season?.comparison || ''}
                onChange={(e) => setCustomCompareSeason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                {seasons
                  .filter(s => s.season_code !== activeSeason)
                  .map(s => (
                    <option key={s.season_code} value={s.season_code}>
                      {s.official_label} ({s.season_code})
                    </option>
                  ))}
              </select>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 flex items-center justify-between">
                <span>Inventory Audit:</span>
                <span className="font-bold text-slate-800">Annual (RWB/RAB)</span>
              </div>
            )}
          </div>
        </div>

        {/* Discrepancy Alert */}
        {kpis.isDiscrepancy && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="font-semibold">{kpis.discrepancyMessage}</span>
          </div>
        )}
      </div>

      {/* 3. NAVIGATION TABS (THE 7 REQUIRED SECTIONS) */}
      <div className="border-b border-slate-200 flex items-center gap-1 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: '1. Overview', icon: BarChart3 },
          { id: 'existing_irrigation', label: '2. Existing Irrigation', icon: Droplets },
          { id: 'seasonal_comparison', label: '3. Seasonal & Annual Comparison', icon: Scale },
          { id: 'irrigation_opportunities', label: '4. Irrigation Opportunities', icon: Sun },
          { id: 'priority_areas', label: '5. Priority Areas', icon: Award },
          { id: 'irrigation_productivity', label: '6. Irrigation & Productivity', icon: Sprout },
          { id: 'data_coverage', label: '7. Data Coverage & Quality', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer
                ${isActive 
                  ? 'border-cyan-700 text-cyan-900 bg-white/70 rounded-t-lg' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-700' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* LOADING STATE */}
      {loading && !data && (
        <div className="flex flex-col items-center justify-center min-h-[350px] bg-white rounded-2xl border border-slate-200/80 p-8">
          <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Calculating irrigation intelligence metrics...</h3>
          <p className="text-xs text-slate-500 mt-1">Cross-referencing verified infrastructure registers & hydrological surveys for {selectedDistrict}</p>
        </div>
      )}

      {/* ERROR STATE */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-900">Unable to load irrigation dataset</h3>
            <p className="text-xs text-red-700 mt-1">{errorMsg}</p>
            <button
              onClick={fetchData}
              className="mt-3 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700 transition-colors"
            >
              Retry Query
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT */}
      {!loading && data && (
        <>
          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Four Core Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Cultivated Area */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Cultivated Area
                    </span>
                    <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800">
                      <Sprout className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {kpis.totalCultivatedHa ? kpis.totalCultivatedHa.toLocaleString() : '—'}{' '}
                    <span className="text-sm font-semibold text-slate-500">ha</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                    {kpis.cultivatedPctChange !== null ? (
                      <span className={`font-bold ${kpis.cultivatedPctChange >= 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
                        {kpis.cultivatedPctChange >= 0 ? '+' : ''}{kpis.cultivatedPctChange}% vs baseline
                      </span>
                    ) : (
                      <span>Baseline verified</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Season {activeSeason} total crop land
                  </div>
                </div>

                {/* 2. Area Under Irrigation */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Area Under Irrigation
                    </span>
                    <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-800">
                      <Droplets className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-cyan-900 tracking-tight">
                    {kpis.areaUnderIrrigationHa !== undefined ? kpis.areaUnderIrrigationHa.toLocaleString() : '—'}{' '}
                    <span className="text-sm font-semibold text-slate-500">ha</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600 font-medium">
                    {kpis.modernIrrigatedHa || 0} ha modern · {kpis.traditionalIrrigatedHa || 0} ha traditional
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Actually irrigated in {activeSeason}
                  </div>
                </div>

                {/* 3. Irrigation Coverage */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Irrigation Coverage
                    </span>
                    <span className="p-1.5 rounded-lg bg-blue-50 text-blue-800">
                      <Scale className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {kpis.irrigationCoveragePct ?? '0.00'}%
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {kpis.coverageDeltaPctPoints !== null ? (
                      <span className={`font-bold ${kpis.coverageDeltaPctPoints >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {kpis.coverageDeltaPctPoints >= 0 ? '+' : ''}{kpis.coverageDeltaPctPoints}% pts vs baseline
                      </span>
                    ) : (
                      <span>Compatible area ratio</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Irrigated area / Cultivated area
                  </div>
                </div>

                {/* 4. Documented Schemes & Opportunities */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Infrastructure & Potential
                    </span>
                    <span className="p-1.5 rounded-lg bg-amber-50 text-amber-800">
                      <Sun className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {kpis.documentedSchemesCount || 0}{' '}
                    <span className="text-sm font-semibold text-slate-500">schemes</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600 font-medium">
                    {kpis.areaEquippedCommandHa?.toLocaleString() || 0} ha equipped command area
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-1">
                    {kpis.opportunityCandidatesCount || 0} candidate assessment areas identified
                  </div>
                </div>

              </div>

              {/* THREE DEFINITIONS SAFEGUARD BANNER */}
              <div className="bg-gradient-to-r from-cyan-900 to-[#042f2e] text-white rounded-2xl p-6 shadow-md border border-cyan-800 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                  <Shield className="w-5 h-5 text-cyan-300" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Core Architectural Principle: Three Distinct Irrigation Dimensions
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
                  
                  <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                    <div className="text-[11px] font-black uppercase text-cyan-300 mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      1. Existing Irrigation (Observed)
                    </div>
                    <p className="text-slate-200">
                      Documented physical infrastructure schemes, canals, and river intakes with verified command areas (<span className="font-bold text-white">{kpis.areaEquippedCommandHa || 0} ha equipped</span>) and seasonal reported irrigation (<span className="font-bold text-white">{kpis.areaUnderIrrigationHa || 0} ha</span>).
                    </p>
                  </div>

                  <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                    <div className="text-[11px] font-black uppercase text-amber-300 mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      2. Potential Opportunities (Modelled)
                    </div>
                    <p className="text-slate-200">
                      Candidate assessment zones (<span className="font-bold text-white">{kpis.totalOpportunityAreaHa?.toLocaleString() || 0} ha</span> across {kpis.opportunityCandidatesCount || 0} candidate sites) screened for water proximity, slope, and drought deficit. Never presented as existing infrastructure.
                    </p>
                  </div>

                  <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                    <div className="text-[11px] font-black uppercase text-emerald-300 mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      3. Proposed Interventions (Actionable)
                    </div>
                    <p className="text-slate-200">
                      Feasibility studies, geotechnical surveys, and cooperative investment proposals awaiting DAO field verification and budget allocation under MINAGRI.
                    </p>
                  </div>

                </div>
              </div>

              {/* Seasonal Irrigation Progression Chart & Infrastructure Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Progression Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Seasonal Irrigated Area & Cultivated Land Progression ({selectedDistrict})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Comparing area under irrigation (ha) against total cultivated land across recorded seasons.
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-cyan-900 bg-cyan-50 px-2.5 py-1 rounded border border-cyan-200 self-start sm:self-auto">
                      NISR Verified
                    </span>
                  </div>

                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={(historicalProgression || []).slice(-12)}
                        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="irrGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#0891b2" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="season_code" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip 
                          formatter={(value: any, name: any) => [
                            typeof value === 'number' ? value.toLocaleString() : value,
                            name === 'area_irrigated_ha' ? 'Area Irrigated (ha)' : 'Total Cultivated (ha)'
                          ]}
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                        <Area 
                          type="monotone" 
                          dataKey="area_irrigated_ha" 
                          name="Area Irrigated (ha)" 
                          stroke="#0891b2" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#irrGradient)" 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="total_cultivated_ha" 
                          name="Total Cultivated (ha)" 
                          stroke="#10b981" 
                          strokeWidth={2} 
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Infrastructure Operational Status Distribution */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="mb-4 pb-3 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900">
                        Infrastructure Status Breakdown
                      </h3>
                      <p className="text-xs text-slate-500">
                        Operational readiness of documented schemes in {selectedDistrict}.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-slate-800">Operational Schemes</span>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-800">
                          {kpis.operationalSchemesCount || 0} schemes
                        </span>
                      </div>

                      <div className="p-3 rounded-xl border border-amber-100 bg-amber-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-bold text-slate-800">Partially Operational</span>
                        </div>
                        <span className="text-xs font-extrabold text-amber-800">
                          {kpis.partialSchemesCount || 0} schemes
                        </span>
                      </div>

                      <div className="p-3 rounded-xl border border-rose-100 bg-rose-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span className="text-xs font-bold text-slate-800">Non-Operational / Inactive</span>
                        </div>
                        <span className="text-xs font-extrabold text-rose-800">
                          {kpis.nonOperationalSchemesCount || 0} schemes
                        </span>
                      </div>

                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Compass className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-bold text-slate-800">Planned / Feasibility</span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-700">
                          {kpis.plannedSchemesCount || 0} schemes
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Equipped: {kpis.areaEquippedCommandHa || 0} ha</span>
                    <button 
                      onClick={() => setActiveTab('existing_irrigation')}
                      className="font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
                    >
                      View Schemes <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: EXISTING IRRIGATION */}
          {/* ======================================================== */}
          {activeTab === 'existing_irrigation' && (
            <div className="space-y-6">
              
              {/* Filter controls */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search scheme name or water source (e.g. Mukungwa, Muvumba, Canal)..."
                      value={schemeSearch}
                      onChange={(e) => setSchemeSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    {schemeSearch && (
                      <button onClick={() => setSchemeSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Status filter buttons */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                    {['ALL', 'OPERATIONAL', 'PARTIAL', 'NON_OPERATIONAL'].map(st => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-md transition-all ${
                          statusFilter === st ? 'bg-cyan-700 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {st === 'ALL' ? 'All Schemes' : st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Documented Schemes Grid */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Documented Irrigation Schemes ({selectedDistrict})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Physical assets registered under MINAGRI and the Rwanda Water Board (RWB).
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    {filteredSchemes.length} Schemes Mapped
                  </span>
                </div>

                {filteredSchemes.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No documented schemes match the selected filters for {selectedDistrict}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredSchemes.map((scheme, idx) => (
                      <div 
                        key={scheme.id || idx}
                        className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-cyan-500 hover:shadow-xs transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 uppercase">
                              {scheme.irrigation_type.replace(/_/g, ' ')}
                            </span>
                            <span className={`text-[11px] font-bold flex items-center gap-1 ${
                              scheme.operational_status === 'OPERATIONAL' ? 'text-emerald-700' : 'text-amber-700'
                            }`}>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {scheme.operational_status}
                            </span>
                          </div>

                          <h4 className="font-bold text-slate-900 text-sm mb-2">{scheme.name}</h4>

                          <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Water Source:</span>
                              <span className="font-semibold text-slate-700">{scheme.water_source}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Method:</span>
                              <span className="font-semibold text-slate-700">{scheme.irrigation_method}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Command Area:</span>
                              <span className="font-black text-slate-900">{scheme.area_command_ha} ha</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Capacity Irrigable:</span>
                              <span className="font-semibold text-slate-700">{scheme.area_irrigable_ha} ha</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Beneficiaries:</span>
                              <span className="font-semibold text-slate-700">{scheme.beneficiaries_count} farmers</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 truncate max-w-[160px]">
                            {scheme.operator_name}
                          </span>
                          <button
                            onClick={() => setSelectedSchemeModal(scheme)}
                            className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sector-Level Irrigation Coverage Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Sector-Level Irrigation Footprint ({selectedDistrict})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Distribution of cultivated land, irrigated hectares, and documented schemes across sectors.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    {sectorBreakdown.length} Sectors Analyzed
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3 pl-6">Sector Name</th>
                        <th className="py-3 text-right">Cultivated Area (ha)</th>
                        <th className="py-3 text-right">Irrigated Area (ha)</th>
                        <th className="py-3 text-right">Irrigation Coverage</th>
                        <th className="py-3 text-center">Documented Schemes</th>
                        <th className="py-3 pr-6 text-right">Expansion Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {sectorBreakdown.map((sec: any) => (
                        <tr key={sec.sector_id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 pl-6 font-bold text-slate-900">{sec.sector_name}</td>
                          <td className="py-3.5 text-right font-medium text-slate-600">{sec.cultivated_ha?.toLocaleString()} ha</td>
                          <td className="py-3.5 text-right font-bold text-cyan-900">{sec.irrigated_ha?.toLocaleString()} ha</td>
                          <td className="py-3.5 text-right font-black text-slate-800">{sec.coverage_pct}%</td>
                          <td className="py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sec.schemes_count > 0 ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {sec.schemes_count} scheme{sec.schemes_count !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="py-3.5 pr-6 text-right">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              sec.opportunity_priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                              sec.opportunity_priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {sec.opportunity_priority}
                            </span>
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
          {/* TAB 3: SEASONAL & ANNUAL COMPARISON */}
          {/* ======================================================== */}
          {activeTab === 'seasonal_comparison' && (
            <div className="space-y-6">
              
              {/* Comparative Indicator Matrix */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Irrigation Indicators: {activeSeason} vs. {data?.season?.comparison || 'Baseline'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Mathematical verification of seasonal and annual changes across verified agricultural records.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded border border-cyan-200">
                    Formula Verified
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3.5 pl-6">Core Indicator</th>
                        <th className="py-3.5 px-3 text-right">Current ({activeSeason})</th>
                        <th className="py-3.5 px-3 text-right">Comparison ({data?.season?.comparison || 'Baseline'})</th>
                        <th className="py-3.5 px-3 text-right">Absolute Change</th>
                        <th className="py-3.5 pr-6 text-right">Percentage Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      <tr>
                        <td className="py-3.5 pl-6 font-bold text-slate-900">Total Cultivated Area (ha)</td>
                        <td className="py-3.5 px-3 text-right font-black text-slate-900">{kpis.totalCultivatedHa?.toLocaleString()} ha</td>
                        <td className="py-3.5 px-3 text-right text-slate-600">{kpis.totalCultivatedCompareHa ? `${kpis.totalCultivatedCompareHa.toLocaleString()} ha` : '—'}</td>
                        <td className="py-3.5 px-3 text-right font-semibold text-slate-800">{kpis.cultivatedAbsChangeHa !== null ? `${kpis.cultivatedAbsChangeHa > 0 ? '+' : ''}${kpis.cultivatedAbsChangeHa} ha` : '—'}</td>
                        <td className="py-3.5 pr-6 text-right font-bold text-slate-800">{kpis.cultivatedPctChange !== null ? `${kpis.cultivatedPctChange > 0 ? '+' : ''}${kpis.cultivatedPctChange}%` : '—'}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 pl-6 font-bold text-slate-900">Area Under Irrigation (ha)</td>
                        <td className="py-3.5 px-3 text-right font-black text-cyan-900">{kpis.areaUnderIrrigationHa?.toLocaleString()} ha</td>
                        <td className="py-3.5 px-3 text-right text-slate-600">{kpis.areaUnderIrrigationCompareHa ? `${kpis.areaUnderIrrigationCompareHa.toLocaleString()} ha` : '—'}</td>
                        <td className="py-3.5 px-3 text-right font-semibold text-slate-800">{kpis.irrigationAbsChangeHa !== null ? `${kpis.irrigationAbsChangeHa > 0 ? '+' : ''}${kpis.irrigationAbsChangeHa} ha` : '—'}</td>
                        <td className="py-3.5 pr-6 text-right font-bold text-slate-800">{kpis.irrigationPctChange !== null ? `${kpis.irrigationPctChange > 0 ? '+' : ''}${kpis.irrigationPctChange}%` : '—'}</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 pl-6 font-bold text-slate-900">Irrigation Coverage (%)</td>
                        <td className="py-3.5 px-3 text-right font-black text-slate-900">{kpis.irrigationCoveragePct}%</td>
                        <td className="py-3.5 px-3 text-right text-slate-600">{kpis.irrigationCoverageComparePct !== null ? `${kpis.irrigationCoverageComparePct}%` : '—'}</td>
                        <td className="py-3.5 px-3 text-right font-semibold text-slate-800">{kpis.coverageDeltaPctPoints !== null ? `${kpis.coverageDeltaPctPoints > 0 ? '+' : ''}${kpis.coverageDeltaPctPoints} % pts` : '—'}</td>
                        <td className="py-3.5 pr-6 text-right font-bold text-slate-800">—</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 pl-6 font-bold text-slate-900">Documented Schemes Count</td>
                        <td className="py-3.5 px-3 text-right font-black text-slate-900">{kpis.documentedSchemesCount || 0}</td>
                        <td className="py-3.5 px-3 text-right text-slate-600">{kpis.documentedSchemesCount || 0}</td>
                        <td className="py-3.5 px-3 text-right font-semibold text-slate-800">0 (Stable)</td>
                        <td className="py-3.5 pr-6 text-right text-slate-500 font-mono text-[11px]">Annual audit</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 pl-6 font-bold text-slate-900">Equipped Command Area (ha)</td>
                        <td className="py-3.5 px-3 text-right font-black text-emerald-800">{kpis.areaEquippedCommandHa?.toLocaleString() || 0} ha</td>
                        <td className="py-3.5 px-3 text-right text-slate-600">{kpis.areaEquippedCommandHa?.toLocaleString() || 0} ha</td>
                        <td className="py-3.5 px-3 text-right font-semibold text-slate-800">0 ha</td>
                        <td className="py-3.5 pr-6 text-right text-slate-500 font-mono text-[11px]">Capacity verified</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-200 text-xs text-slate-500 space-y-1">
                  <div className="font-bold text-slate-700">Notice on Irrigation Inventory Updating Cadence:</div>
                  <p>
                    Physical infrastructure registries are updated annually or upon project commissioning by MINAGRI/RAB, whereas crop statistics are surveyed seasonally. AgriLens does not artificially invent seasonal variation for fixed assets.
                  </p>
                </div>
              </div>

              {/* Historical Multi-Season Progression Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Historical Multi-Season Audit Log ({selectedDistrict})
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">2014 – 2026 Survey Records</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3 pl-6">Season</th>
                        <th className="py-3 text-right">Cultivated Area (ha)</th>
                        <th className="py-3 text-right">Irrigated Area (ha)</th>
                        <th className="py-3 text-right">Coverage %</th>
                        <th className="py-3 text-center">Drought Index</th>
                        <th className="py-3 text-right">Water Deficit (mm)</th>
                        <th className="py-3 pr-6 text-right">Source Survey</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {[...historicalProgression].reverse().slice(0, 10).map((h, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 pl-6 font-bold text-slate-900">{h.season_code}</td>
                          <td className="py-3 text-right text-slate-600">{h.total_cultivated_ha?.toLocaleString()} ha</td>
                          <td className="py-3 text-right font-black text-cyan-900">{h.area_irrigated_ha?.toLocaleString()} ha</td>
                          <td className="py-3 text-right font-extrabold text-slate-800">{h.irrigation_coverage_pct}%</td>
                          <td className="py-3 text-center font-mono">{h.drought_vulnerability_index}</td>
                          <td className="py-3 text-right font-semibold text-slate-700">{h.water_deficit_mm} mm</td>
                          <td className="py-3 pr-6 text-right font-mono text-[11px] text-slate-400">{h.source_reference}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: IRRIGATION OPPORTUNITIES */}
          {/* ======================================================== */}
          {activeTab === 'irrigation_opportunities' && (
            <div className="space-y-6">
              
              {/* Screening Criteria Callout */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3.5">
                <Sun className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <h3 className="font-bold text-sm">
                    Spatial Multi-Criteria Screening Methodology (Modelled Opportunity)
                  </h3>
                  <p>
                    Irrigation candidate areas are screened using 6 spatial parameters: river proximity, topography & terrain slope, seasonal rainfall deficit, soil pH & moisture retention, feeder road accessibility, and environmental wetland zoning.
                  </p>
                  <p className="font-bold text-amber-800">
                    Important Limitation: Cultivated land without irrigation is NOT automatically suitable for investment. Engineering feasibility, environmental clearance, and community water rights must precede any capital deployment.
                  </p>
                </div>
              </div>

              {/* Candidate Opportunity Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {candidates.map((cand) => (
                  <div 
                    key={cand.candidate_id}
                    className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:border-cyan-500 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 uppercase">
                          Priority #{cand.rank} · {cand.feasibility_tier.replace(/_/g, ' ')}
                        </span>
                        <div className="text-right">
                          <span className="text-xs font-black text-cyan-700">{cand.opportunity_score}/100</span>
                          <span className="text-[10px] text-slate-400 block">Suitability Score</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mb-1">{cand.site_name}</h3>
                      <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-4">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sector: {cand.sector}</span>
                        <span>•</span>
                        <span>Potential Command: {cand.potential_area_ha} ha</span>
                      </div>

                      {/* Evidence Details */}
                      <div className="space-y-2 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Water Proximity:</span>
                          <span className="font-semibold text-slate-800">{cand.supporting_evidence.water_source_proximity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Terrain Slope:</span>
                          <span className="font-semibold text-slate-800">{cand.supporting_evidence.terrain_slope}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Soil Profile:</span>
                          <span className="font-semibold text-slate-800">{cand.supporting_evidence.soil_suitability}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Road Corridor:</span>
                          <span className="font-semibold text-slate-800">{cand.supporting_evidence.road_access}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Recommended Tech:</span>
                          <span className="font-bold text-emerald-800">{cand.recommended_technology}</span>
                        </div>
                      </div>

                      {/* Missing data / Uncertainty */}
                      <div className="mt-3 p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-xs text-rose-900 space-y-1">
                        <span className="font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Uncertainty / Missing Evidence:
                        </span>
                        <p className="text-[11px] leading-relaxed text-rose-800">
                          {cand.missing_data_uncertainty}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">
                        Est: {(cand.estimated_cost_rwf / 1000000).toFixed(0)}M RWF · {cand.estimated_beneficiary_households} households
                      </span>
                      <Link
                        to="/district/interventions"
                        className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                      >
                        Initiate Assessment <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: PRIORITY AREAS */}
          {/* ======================================================== */}
          {activeTab === 'priority_areas' && (
            <div className="space-y-6">
              
              {/* Prioritization Guide */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Award className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-base font-bold text-slate-900">
                    Ranked Irrigation Feasibility & Field Verification Pipeline ({selectedDistrict})
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ranked by multi-criteria opportunity score, proximity to perennial surface hydrology, smallholder density, and slope suitability. Officers should prioritize top-ranked sites for pre-feasibility field verification.
                </p>
              </div>

              {/* Priority Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3.5 pl-6">Rank</th>
                        <th className="py-3.5">Candidate Site & Sector</th>
                        <th className="py-3.5 text-right">Potential Area (ha)</th>
                        <th className="py-3.5 text-center">Score</th>
                        <th className="py-3.5">Recommended Technology</th>
                        <th className="py-3.5 text-right">Est. Budget (RWF)</th>
                        <th className="py-3.5 pr-6 text-right">Recommended Next Step</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {candidates.map((cand) => (
                        <tr key={cand.candidate_id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 pl-6 font-black text-xs text-slate-900">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                              #{cand.rank}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <div className="font-bold text-slate-900">{cand.site_name}</div>
                            <div className="text-[10px] text-slate-400">Sector: {cand.sector}</div>
                          </td>
                          <td className="py-3.5 text-right font-black text-cyan-900">
                            {cand.potential_area_ha} ha
                          </td>
                          <td className="py-3.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-cyan-100 text-cyan-800">
                              {cand.opportunity_score}/100
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-700 font-medium">
                            {cand.recommended_technology}
                          </td>
                          <td className="py-3.5 text-right font-bold text-emerald-800 font-mono">
                            {(cand.estimated_cost_rwf / 1000000).toFixed(0)}M
                          </td>
                          <td className="py-3.5 pr-6 text-right">
                            <span className="text-[11px] text-slate-600 block max-w-xs ml-auto">
                              {cand.recommended_next_step}
                            </span>
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
          {/* TAB 6: IRRIGATION & PRODUCTIVITY */}
          {/* ======================================================== */}
          {activeTab === 'irrigation_productivity' && (
            <div className="space-y-6">
              
              {/* Scientific Guidance Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3.5">
                <Sprout className="w-5 h-5 text-emerald-800 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 space-y-1">
                  <h3 className="font-bold text-sm">
                    Irrigation & Crop Yield Performance Correlation
                  </h3>
                  <p>
                    Connecting seasonal crop productivity from the Agricultural Productivity module with irrigation access. Responsive staples and horticulture display 15% to 35% productivity premiums where supplementary water is guaranteed.
                  </p>
                  <p className="font-bold text-emerald-800">
                    Important Scientific Disclaimer: Correlation does not prove causation; weather fluctuations, certified seeds, NPK/lime inputs, and pest management simultaneously impact realized harvest yields.
                  </p>
                </div>
              </div>

              {/* Crop Yield Comparison Matrix */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Crop Performance Across Irrigation Regimes ({selectedDistrict} · {activeSeason})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Comparing district harvest statistics against estimated irrigated vs rainfed productivity benchmarks.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    {cropLinkage.length} Major Crops Analyzed
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3.5 pl-6">Crop Name</th>
                        <th className="py-3.5">Category</th>
                        <th className="py-3.5 text-right">District Output (t)</th>
                        <th className="py-3.5 text-right">Average Yield (t/ha)</th>
                        <th className="py-3.5 text-right">Est. Irrigated Yield (t/ha)</th>
                        <th className="py-3.5 text-right">Est. Rainfed Yield (t/ha)</th>
                        <th className="py-3.5 text-right">Yield Premium</th>
                        <th className="py-3.5 pr-6 text-center">Responsiveness</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {cropLinkage.map((c: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 pl-6 font-bold text-slate-900">{c.crop_name}</td>
                          <td className="py-3.5 text-slate-500 font-semibold">{c.category}</td>
                          <td className="py-3.5 text-right font-black text-slate-800">{c.total_production_tonnes?.toLocaleString()} t</td>
                          <td className="py-3.5 text-right font-extrabold text-emerald-800">{c.average_yield_t_ha} t/ha</td>
                          <td className="py-3.5 text-right font-black text-cyan-900">{c.irrigated_yield_est_t_ha} t/ha</td>
                          <td className="py-3.5 text-right text-slate-500">{c.rainfed_yield_est_t_ha} t/ha</td>
                          <td className="py-3.5 text-right font-black text-emerald-700">+{c.potential_yield_gain_pct}%</td>
                          <td className="py-3.5 pr-6 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.irrigation_responsiveness === 'HIGH' ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {c.irrigation_responsiveness}
                            </span>
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
          {/* TAB 7: DATA COVERAGE & QUALITY */}
          {/* ======================================================== */}
          {activeTab === 'data_coverage' && (
            <div className="space-y-6">
              
              {/* Source Verification Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Data Sources & Reporting Traceability
                    </h3>
                    <p className="text-xs text-slate-500">
                      All metrics are sourced from official Government of Rwanda hydrological and agricultural registries.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                    Audited
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Source 1</span>
                    <h4 className="font-bold text-slate-900">NISR Seasonal Agricultural Survey (SAS)</h4>
                    <p className="text-slate-600 leading-normal">
                      Provides cultivated area, reported irrigated hectares by crop, and verified harvest output per season.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Source 2</span>
                    <h4 className="font-bold text-slate-900">Rwanda Water Board (RWB) Hydrology Atlas</h4>
                    <p className="text-slate-600 leading-normal">
                      Provides sub-basin catchment yields, seasonal river discharge, and water deficit indicators.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Source 3</span>
                    <h4 className="font-bold text-slate-900">MINAGRI/RAB National Irrigation Master Plan</h4>
                    <p className="text-slate-600 leading-normal">
                      Provides command areas, marshland perimeters, and operator registries for all 30 districts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Rules & Standards */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-xs text-slate-600 space-y-3 leading-relaxed">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Governing Irrigation Data Standards
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-slate-600">
                  <li>
                    <strong className="text-slate-800">Coverage Formula:</strong> Coverage % = (Area under irrigation / Comparable cultivated area) × 100.
                  </li>
                  <li>
                    <strong className="text-slate-800">Discrepancy Safeguard:</strong> If reported irrigated area exceeds total cultivated land, AgriLens flags the figure immediately rather than adjusting it silently.
                  </li>
                  <li>
                    <strong className="text-slate-800">Inventory Isolation:</strong> Infrastructure inventories are updated annually or upon project commissioning; seasonal variation is applied strictly to crop cultivation.
                  </li>
                  <li>
                    <strong className="text-slate-800">Modelled vs. Observed:</strong> Opportunity scores represent spatial suitability screening and are never combined with physical command area totals.
                  </li>
                </ul>
              </div>

            </div>
          )}

        </>
      )}

      {/* SCHEME DETAIL MODAL */}
      {selectedSchemeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div>
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-cyan-600" />
                  <h3 className="text-base font-bold text-slate-900">{selectedSchemeModal.name}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified MINAGRI / RWB Infrastructure Dossier
                </p>
              </div>
              <button
                onClick={() => setSelectedSchemeModal(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Operational Status</span>
                  <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{selectedSchemeModal.operational_status}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Command Area (ha)</span>
                  <span className="font-extrabold text-cyan-800 text-sm mt-0.5 block">{selectedSchemeModal.area_command_ha} ha</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Water Source</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">{selectedSchemeModal.water_source}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Irrigation Method</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">{selectedSchemeModal.irrigation_method}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Operator / Cooperative</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">{selectedSchemeModal.operator_name}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Beneficiary Farmers</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">{selectedSchemeModal.beneficiaries_count} farmers</span>
                </div>
              </div>

              {selectedSchemeModal.coordinates && (
                <div className="p-3.5 bg-cyan-50/70 border border-cyan-200 rounded-xl text-xs text-cyan-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-700" />
                    <span>GPS Coordinates: {selectedSchemeModal.coordinates[1].toFixed(4)}°N, {selectedSchemeModal.coordinates[0].toFixed(4)}°E</span>
                  </div>
                  <Link
                    to="/district/map"
                    className="font-bold text-cyan-800 hover:underline flex items-center gap-1"
                  >
                    View on Map <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedSchemeModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
