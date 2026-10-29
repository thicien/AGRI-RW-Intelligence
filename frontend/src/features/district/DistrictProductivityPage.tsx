import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  Sprout, TrendingUp, TrendingDown, Minus, Filter, RefreshCw, AlertTriangle, 
  Layers, ArrowUpRight, CheckCircle2, ChevronRight, Download, Search,
  Calendar, Info, AlertCircle, ArrowUpDown, ExternalLink, Eye, X, Shield,
  BarChart3, Award, Sparkles, Scale, FileText, ArrowRight, HelpCircle
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
  recorded_crops_count: number;
  source_file: string;
  quality_status: string;
}

interface CropRecord {
  crop_id: string;
  crop_code: string;
  crop_name: string;
  crop_category: string;
  is_subcrop: boolean;
  parent_crop_name: string | null;
  production_tonnes: number | null;
  area_ha: number | null;
  yield_t_ha: number | null;
  irrigated_area_ha: number | null;
  data_quality_status: string;
  source_file: string;
  validation_notes: string | null;
  previous_production_tonnes: number | null;
  previous_area_ha: number | null;
  previous_yield_t_ha: number | null;
  abs_change_tonnes: number | null;
  pct_change_tonnes: number | null;
  abs_change_area: number | null;
  pct_change_area: number | null;
  abs_change_yield: number | null;
  pct_change_yield: number | null;
  change_status: 'INCREASED' | 'DECREASED' | 'STABLE' | 'NO_BASELINE';
  area_discrepancy: string | null;
  production_rank?: number | null;
  production_share_pct?: number | null;
  yield_rank?: number | null;
}

const ALL_RWANDA_DISTRICTS = [
  'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi', 'Gisagara',
  'Huye', 'Kamonyi', 'Karongi', 'Kayonza', 'Kicukiro', 'Kirehe', 'Muhanga',
  'Musanze', 'Ngoma', 'Ngororero', 'Nyabihu', 'Nyagatare', 'Nyamagabe',
  'Nyamasheke', 'Nyanza', 'Nyarugenge', 'Nyaruguru', 'Rubavu', 'Ruhango',
  'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana'
];

export default function DistrictProductivityPage() {
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
  const [stabilityThreshold, setStabilityThreshold] = useState<number>(5.0);

  // Tab State: 'overview' | 'crop_production' | 'seasonal_comparison' | 'crop_rankings' | 'production_changes' | 'data_coverage'
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Filters for Crop Production tab
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedScope, setSelectedScope] = useState<'ALL' | 'PRIMARY' | 'SUBCROPS'>('ALL');
  const [sortBy, setSortBy] = useState<'production' | 'area' | 'yield' | 'abs_change' | 'pct_change'>('production');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Seasonal comparison tab state
  const [selectedComparisonCrop, setSelectedComparisonCrop] = useState<string>('Irish Potato');

  // Modal for crop history drilldown
  const [historyModalCrop, setHistoryModalCrop] = useState<string | null>(null);

  // Data fetching
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // Update selectedDistrict if context changes
  useEffect(() => {
    if (!isNationalUser) {
      setSelectedDistrict(assignedDistrict);
    }
  }, [assignedDistrict, isNationalUser]);

  // Fetch productivity data
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = `http://localhost:3000/api/v1/district/productivity?district=${encodeURIComponent(selectedDistrict)}&season=${activeSeason}&compareMode=${compareMode}&stabilityThreshold=${stabilityThreshold}`;
      if (compareMode === 'custom' && customCompareSeason) {
        url += `&compareSeason=${customCompareSeason}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to fetch district productivity (${res.status})`);
      }
      const json = await res.json();
      setData(json);

      // Set default comparison crop if not already set or invalid
      if (json.crops && json.crops.length > 0) {
        const cropNames = json.crops.map((c: any) => c.crop_name);
        if (!cropNames.includes(selectedComparisonCrop)) {
          setSelectedComparisonCrop(json.crops[0].crop_name);
        }
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error loading productivity dataset.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDistrict, activeSeason, compareMode, customCompareSeason, stabilityThreshold]);

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
      // Find any season in that year
      const firstInYear = seasons.find(s => s.year === year);
      if (firstInYear) {
        setActiveSeason(firstInYear.season_code);
      } else {
        setActiveSeason(targetCode);
      }
    }
  };

  const handleSeasonLetterChange = (letter: string) => {
    const targetCode = `${activeYear}${letter}`;
    setActiveSeason(targetCode);
  };

  // Filtered & Sorted Crops for Crop Production Tab
  const processedCrops: CropRecord[] = data?.crops || [];

  const categories = useMemo(() => {
    const set = new Set<string>();
    processedCrops.forEach(c => {
      if (c.crop_category) set.add(c.crop_category);
    });
    return Array.from(set).sort();
  }, [processedCrops]);

  const filteredCrops = useMemo(() => {
    return processedCrops
      .filter(c => {
        // Search
        if (searchQuery.trim() && !c.crop_name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        // Category
        if (selectedCategory !== 'ALL' && c.crop_category !== selectedCategory) {
          return false;
        }
        // Scope
        if (selectedScope === 'PRIMARY' && c.is_subcrop) {
          return false;
        }
        if (selectedScope === 'SUBCROPS' && !c.is_subcrop) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA: number = 0;
        let valB: number = 0;
        if (sortBy === 'production') {
          valA = a.production_tonnes ?? -1;
          valB = b.production_tonnes ?? -1;
        } else if (sortBy === 'area') {
          valA = a.area_ha ?? -1;
          valB = b.area_ha ?? -1;
        } else if (sortBy === 'yield') {
          valA = a.yield_t_ha ?? -1;
          valB = b.yield_t_ha ?? -1;
        } else if (sortBy === 'abs_change') {
          valA = a.abs_change_tonnes ?? -999999;
          valB = b.abs_change_tonnes ?? -999999;
        } else if (sortBy === 'pct_change') {
          valA = a.pct_change_tonnes ?? -999999;
          valB = b.pct_change_tonnes ?? -999999;
        }
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      });
  }, [processedCrops, searchQuery, selectedCategory, selectedScope, sortBy, sortOrder]);

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredCrops.length) return;
    const headers = [
      'Crop Name',
      'Category',
      'Type',
      'Production (Tonnes)',
      'Cultivated Area (ha)',
      'Yield (t/ha)',
      'Comparison Production (Tonnes)',
      'Absolute Change (Tonnes)',
      'Percentage Change (%)',
      'Status',
      'Data Quality'
    ];

    const rows = filteredCrops.map(c => [
      `"${c.crop_name}"`,
      `"${c.crop_category}"`,
      c.is_subcrop ? `Subcrop (${c.parent_crop_name})` : 'Primary Crop',
      c.production_tonnes ?? '',
      c.area_ha ?? '',
      c.yield_t_ha ?? '',
      c.previous_production_tonnes ?? '',
      c.abs_change_tonnes ?? '',
      c.pct_change_tonnes !== null ? `${c.pct_change_tonnes}%` : '',
      c.change_status,
      c.data_quality_status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedDistrict}_Productivity_${activeSeason}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Comparison period label
  const comparisonSeasonLabel = useMemo(() => {
    const compCode = data?.season?.comparison;
    if (!compCode) return 'No baseline selected';
    const found = seasons.find(s => s.season_code === compCode);
    return found ? `${found.official_label} (${compCode})` : compCode;
  }, [data, seasons]);

  // Selected crop history for Tab 3 & Modal
  const cropHistoryData = useMemo(() => {
    const target = historyModalCrop || selectedComparisonCrop;
    if (!data?.cropHistories || !data.cropHistories[target]) return [];
    return data.cropHistories[target];
  }, [data, selectedComparisonCrop, historyModalCrop]);

  const kpis = data?.summaryKPIs || {};
  const sigChanges = data?.significantChanges || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. TOP HEADER & SCOPE BAR */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 tracking-wide uppercase">
              District Agricultural Intelligence
            </span>
            <span className="text-xs text-slate-400">•</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              <span>{selectedDistrict} District Scope</span>
              {!isNationalUser && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-normal">
                  DAO Restricted
                </span>
              )}
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Agricultural Productivity & Crop Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Validated seasonal crop production, cultivated land allocations, yield progression, and targeted anomaly detection across SAS surveys for {selectedDistrict} District.
          </p>
        </div>

        {/* Right actions: National District Switcher & CSV export */}
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

          <button
            onClick={exportToCSV}
            disabled={!filteredCrops.length}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Filtered (CSV)</span>
          </button>

          <button
            onClick={fetchData}
            title="Refresh Data"
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. SEASON AND COMPARISON FILTERS (REQUIRED SPECIFICATION) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Season and Comparison Controls
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Active Comparison:</span>
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1.5">
              <span>{activeSeason}</span>
              <ArrowRight className="w-3 h-3 text-emerald-600" />
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
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Year {yr}
                </option>
              ))}
            </select>
          </div>

          {/* B. Selected Season (Season A, B, C) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Selected Season
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
              {['A', 'B', 'C'].map((lettr) => {
                const isSelected = activeSeasonLetter === lettr;
                const codeToCheck = `${activeYear}${lettr}`;
                const hasDataInYear = seasons.some(s => s.season_code === codeToCheck);

                return (
                  <button
                    key={lettr}
                    onClick={() => handleSeasonLetterChange(lettr)}
                    className={`py-1.5 rounded-md text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : hasDataInYear
                        ? 'text-slate-700 hover:text-emerald-800 hover:bg-white/60'
                        : 'text-slate-400 hover:text-slate-600'
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
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="same_season_prev_year">Previous year's same season (Default)</option>
              <option value="prev_season">Immediately previous season</option>
              <option value="custom">Choose custom period</option>
            </select>
          </div>

          {/* D. Custom Baseline / Stability Threshold */}
          <div>
            {compareMode === 'custom' ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Custom Comparison Period
                </label>
                <select
                  value={customCompareSeason || data?.season?.comparison || ''}
                  onChange={(e) => setCustomCompareSeason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {seasons
                    .filter(s => s.season_code !== activeSeason)
                    .map(s => (
                      <option key={s.season_code} value={s.season_code}>
                        {s.official_label} ({s.season_code})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Stability Threshold
                  </label>
                  <span className="text-[11px] font-extrabold text-emerald-800">
                    ±{stabilityThreshold}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                  {[3.0, 5.0, 10.0].map((th) => (
                    <button
                      key={th}
                      onClick={() => setStabilityThreshold(th)}
                      className={`py-1.5 rounded-md text-xs font-semibold transition-all ${
                        stabilityThreshold === th
                          ? 'bg-emerald-700 text-white shadow-xs font-bold'
                          : 'text-slate-600 hover:text-emerald-800'
                      }`}
                    >
                      ±{th}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION TABS (THE 6 REQUIRED SECTIONS) */}
      <div className="border-b border-slate-200 flex items-center gap-1 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: '1. Overview', icon: BarChart3 },
          { id: 'crop_production', label: '2. Crop Production', icon: Sprout },
          { id: 'seasonal_comparison', label: '3. Seasonal Comparison', icon: Scale },
          { id: 'crop_rankings', label: '4. Crop Rankings', icon: Award },
          { id: 'production_changes', label: '5. Production Changes', icon: TrendingUp },
          { id: 'data_coverage', label: '6. Data Coverage & Sources', icon: FileText }
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
                  ? 'border-emerald-700 text-emerald-900 bg-white/70 rounded-t-lg' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* LOADING STATE */}
      {loading && !data && (
        <div className="flex flex-col items-center justify-center min-h-[350px] bg-white rounded-2xl border border-slate-200/80 p-8">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Calculating district agricultural productivity...</h3>
          <p className="text-xs text-slate-500 mt-1">Cross-referencing verified seasonal statistics for {selectedDistrict} District</p>
        </div>
      )}

      {/* ERROR STATE */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-900">Unable to load productivity dataset</h3>
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
              {/* 4 Headline Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Total Production */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Total Production
                    </span>
                    <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800">
                      <Sprout className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {kpis.totalProductionTonnes ? kpis.totalProductionTonnes.toLocaleString() : '—'}{' '}
                    <span className="text-sm font-semibold text-slate-500">tonnes</span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs">
                    {kpis.productionPctChange !== null && kpis.productionPctChange !== undefined ? (
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        kpis.productionPctChange >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {kpis.productionPctChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {kpis.productionPctChange >= 0 ? '+' : ''}{kpis.productionPctChange}%
                        <span className="text-slate-400 font-normal">
                          ({kpis.productionAbsChangeTonnes >= 0 ? '+' : ''}{kpis.productionAbsChangeTonnes?.toLocaleString()} t)
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Baseline unavailable</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Selected season: {activeSeason} (Primary crops)
                  </div>
                </div>

                {/* 2. Crops Reported */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Crops Reported
                    </span>
                    <span className="p-1.5 rounded-lg bg-blue-50 text-blue-800">
                      <Layers className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {kpis.cropsReportedCount ?? '—'}{' '}
                    <span className="text-sm font-semibold text-slate-500">crops</span>
                  </div>
                  <div className="mt-2.5 text-xs text-slate-600 font-medium">
                    {kpis.totalCropRecordsCount} total crop varieties & subcrops
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Recorded in {selectedDistrict} · {activeSeason}
                  </div>
                </div>

                {/* 3. Crops with Increased Production */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Crops Increased
                    </span>
                    <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-emerald-800 tracking-tight">
                    {kpis.cropsIncreasedCount ?? 0}
                  </div>
                  <div className="mt-2.5 text-xs text-slate-600 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Growth &gt; +{stabilityThreshold}% vs baseline</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Compared with {data?.season?.comparison || 'prior period'}
                  </div>
                </div>

                {/* 4. Crops with Decreased Production */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Crops Decreased
                    </span>
                    <span className="p-1.5 rounded-lg bg-rose-50 text-rose-800">
                      <TrendingDown className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-rose-800 tracking-tight">
                    {kpis.cropsDecreasedCount ?? 0}
                  </div>
                  <div className="mt-2.5 text-xs text-slate-600 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Decline &lt; −{stabilityThreshold}% vs baseline</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {kpis.cropsStableCount ?? 0} crops remained stable (±{stabilityThreshold}%)
                  </div>
                </div>

              </div>

              {/* DAO EXECUTIVE BRIEFING: THE 4 CORE QUESTIONS ANSWERED */}
              <div className="bg-gradient-to-br from-emerald-900 to-[#063124] text-white rounded-2xl p-6 shadow-md border border-emerald-800">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                  <Sparkles className="w-5 h-5 text-emerald-300" />
                  <h2 className="text-base font-bold text-white tracking-wide">
                    District Officer Executive Intelligence Summary ({selectedDistrict} · {activeSeason})
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs leading-relaxed">
                  
                  {/* Question 1 */}
                  <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 mb-1 flex items-center gap-1.5">
                      <span>1. What did {selectedDistrict} produce?</span>
                    </div>
                    <p className="text-slate-100">
                      Total primary crop output reached <span className="font-bold text-white">{kpis.totalProductionTonnes?.toLocaleString()} tonnes</span> across <span className="font-bold text-white">{kpis.cropsReportedCount} crops</span> cultivated on <span className="font-bold text-white">{kpis.totalAreaHa?.toLocaleString()} hectares</span>. The primary output is led by <span className="font-bold text-emerald-300">{data?.topContributors?.[0]?.crop_name}</span> ({data?.topContributors?.[0]?.share_pct}% of total tonnage), followed by <span className="font-bold text-slate-100">{data?.topContributors?.[1]?.crop_name}</span> and <span className="font-bold text-slate-100">{data?.topContributors?.[2]?.crop_name}</span>.
                    </p>
                  </div>

                  {/* Question 2 */}
                  <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 mb-1 flex items-center gap-1.5">
                      <span>2. How did production change?</span>
                    </div>
                    <p className="text-slate-100">
                      District production {kpis.productionPctChange >= 0 ? 'expanded by' : 'contracted by'} <span className="font-bold text-white">{Math.abs(kpis.productionPctChange || 0)}%</span> ({kpis.productionAbsChangeTonnes >= 0 ? '+' : ''}{kpis.productionAbsChangeTonnes?.toLocaleString()} tonnes) compared to {comparisonSeasonLabel}. Overall cultivated area changed by <span className="font-bold text-white">{kpis.areaPctChange >= 0 ? '+' : ''}{kpis.areaPctChange}%</span>, resulting in an average yield of <span className="font-bold text-white">{kpis.averageYieldTonnesPerHa || '—'} t/ha</span> (vs {kpis.averageYieldCompareTonnesPerHa || '—'} t/ha baseline).
                    </p>
                  </div>

                  {/* Question 3 */}
                  <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 mb-1 flex items-center gap-1.5">
                      <span>3. Which crops performed best or worst?</span>
                    </div>
                    <p className="text-slate-100">
                      Largest volume gainer: <span className="font-bold text-emerald-300">{sigChanges.largestIncreaseAbs?.crop_name || 'None'}</span> ({sigChanges.largestIncreaseAbs?.abs_change_tonnes >= 0 ? '+' : ''}{sigChanges.largestIncreaseAbs?.abs_change_tonnes?.toLocaleString()} t, {sigChanges.largestIncreaseAbs?.pct_change_tonnes}%). Largest reduction: <span className="font-bold text-rose-300">{sigChanges.largestDecreaseAbs?.crop_name || 'None'}</span> ({sigChanges.largestDecreaseAbs?.abs_change_tonnes?.toLocaleString()} t, {sigChanges.largestDecreaseAbs?.pct_change_tonnes}%).
                    </p>
                  </div>

                  {/* Question 4 */}
                  <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 mb-1 flex items-center gap-1.5">
                      <span>4. Where should attention be directed?</span>
                    </div>
                    <p className="text-slate-100">
                      {sigChanges.areaDiscrepancyCrops?.length > 0 ? (
                        <>
                          Targeted field checks required on <span className="font-bold text-amber-300">{sigChanges.areaDiscrepancyCrops.map((c: any) => c.crop_name).slice(0, 3).join(', ')}</span> exhibiting disproportionate yield variations. Inspect pest incidence, seasonal rain anomalies, and input subsidy uptake.
                        </>
                      ) : (
                        <>
                          Production remained consistent across major staples. Prioritize fertilizer distribution and irrigation operational audits for the upcoming planting cycle.
                        </>
                      )}
                    </p>
                  </div>

                </div>
              </div>

              {/* Multi-Season Trend & Top Crop Contributions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* District Production Progression Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Multi-Season Production Progression ({selectedDistrict})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Total primary crop volume (tonnes) and land allocation (ha) across recorded seasons.
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 self-start sm:self-auto">
                      Double-Counting Adjusted
                    </span>
                  </div>

                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={(data?.districtTrend || []).slice(-12)}
                        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="prodGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="season_code" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip 
                          formatter={(value: any, name: any) => [
                            typeof value === 'number' ? value.toLocaleString() : value,
                            name === 'total_production_tonnes' ? 'Total Production (t)' : 'Cultivated Area (ha)'
                          ]}
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                        <Area 
                          type="monotone" 
                          dataKey="total_production_tonnes" 
                          name="Total Production (t)" 
                          stroke="#059669" 
                          strokeWidth={2} 
                          fillOpacity={1} 
                          fill="url(#prodGradient)" 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="total_area_ha" 
                          name="Cultivated Area (ha)" 
                          stroke="#3b82f6" 
                          strokeWidth={2} 
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Contributing Crops */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="mb-4 pb-3 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900">
                        Top Contributing Crops
                      </h3>
                      <p className="text-xs text-slate-500">
                        Share of {selectedDistrict}'s total reported output in {activeSeason}.
                      </p>
                    </div>

                    <div className="space-y-3.5">
                      {(data?.topContributors || []).map((c: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-extrabold text-[10px] flex items-center justify-center">
                                {idx + 1}
                              </span>
                              {c.crop_name}
                            </span>
                            <span className="font-extrabold text-slate-900">
                              {c.share_pct}% <span className="text-slate-400 font-normal">({c.production_tonnes?.toLocaleString()} t)</span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-emerald-600 h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(c.share_pct || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Source: SAS Validated</span>
                    <button 
                      onClick={() => setActiveTab('crop_rankings')}
                      className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      View All Rankings <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Data Validation & Double-Counting Safeguard Callout */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 flex items-start gap-3.5">
                <Info className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 space-y-1 leading-relaxed">
                  <h4 className="font-bold">AgriLens Data Quality & Double-Counting Safeguards Applied</h4>
                  <p>
                    {data?.dataQualityAndMethodology?.doubleCountingPrevention}
                  </p>
                  <p className="text-blue-700 font-medium">
                    Verified source: <span className="font-semibold">{data?.dataQualityAndMethodology?.sourceFile}</span> · Validation Status: <span className="font-bold uppercase">{data?.dataQualityAndMethodology?.qualityStatus}</span>
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: CROP PRODUCTION */}
          {/* ======================================================== */}
          {activeTab === 'crop_production' && (
            <div className="space-y-5">
              
              {/* Controls bar: Search, Category pills, Scope filter, Sort */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Search input */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search crop name (e.g. Beans, Irish Potato, Maize)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Primary vs Subcrop Scope Selector */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                    <button
                      onClick={() => setSelectedScope('ALL')}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        selectedScope === 'ALL' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All Records ({processedCrops.length})
                    </button>
                    <button
                      onClick={() => setSelectedScope('PRIMARY')}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        selectedScope === 'PRIMARY' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Primary Crops ({processedCrops.filter(c => !c.is_subcrop).length})
                    </button>
                    <button
                      onClick={() => setSelectedScope('SUBCROPS')}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        selectedScope === 'SUBCROPS' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Subcrops Only ({processedCrops.filter(c => c.is_subcrop).length})
                    </button>
                  </div>
                </div>

                {/* Category Pills & Sorting Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs font-medium">
                    <button
                      onClick={() => setSelectedCategory('ALL')}
                      className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-all ${
                        selectedCategory === 'ALL'
                          ? 'bg-slate-800 text-white font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-all ${
                          selectedCategory === cat
                            ? 'bg-emerald-800 text-white font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Sort Controls */}
                  <div className="flex items-center gap-2 text-xs flex-shrink-0 self-end sm:self-auto">
                    <span className="text-slate-400 font-medium">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="production">Production (Tonnes)</option>
                      <option value="area">Cultivated Area (ha)</option>
                      <option value="yield">Average Yield (t/ha)</option>
                      <option value="abs_change">Absolute Change (t)</option>
                      <option value="pct_change">Percentage Change (%)</option>
                    </select>

                    <button
                      onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                      className="p-1 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-100 cursor-pointer"
                      title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Crop Production Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-3.5 pl-6 pr-3">Crop Name</th>
                        <th className="py-3.5 px-3">Category</th>
                        <th className="py-3.5 px-3 text-right">Production (t)</th>
                        <th className="py-3.5 px-3 text-right">Cultivated Area (ha)</th>
                        <th className="py-3.5 px-3 text-right">Yield (t/ha)</th>
                        <th className="py-3.5 px-3 text-right">Baseline ({data?.season?.comparison || 'Prev'})</th>
                        <th className="py-3.5 px-3 text-right">Absolute Change</th>
                        <th className="py-3.5 px-3 text-center">Status</th>
                        <th className="py-3.5 pr-6 pl-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {filteredCrops.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400">
                            No crops found matching the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredCrops.map((c, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            {/* Crop Name */}
                            <td className="py-3.5 pl-6 pr-3">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.is_subcrop ? 'bg-slate-400' : 'bg-emerald-600'}`} />
                                <div>
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>{c.crop_name}</span>
                                    {c.is_subcrop && (
                                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                                        Subcrop of {c.parent_crop_name}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {c.crop_code}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3.5 px-3 text-slate-500 font-semibold">
                              {c.crop_category || 'Other'}
                            </td>

                            {/* Production (tonnes) */}
                            <td className="py-3.5 px-3 text-right font-black text-slate-900">
                              {c.production_tonnes !== null ? c.production_tonnes.toLocaleString() : '—'}
                            </td>

                            {/* Cultivated Area (ha) - Rule: Never infer, display only if valid */}
                            <td className="py-3.5 px-3 text-right text-slate-600">
                              {c.area_ha !== null ? `${c.area_ha.toLocaleString()} ha` : '—'}
                            </td>

                            {/* Yield (t/ha) */}
                            <td className="py-3.5 px-3 text-right font-bold text-emerald-800">
                              {c.yield_t_ha !== null ? `${c.yield_t_ha} t/ha` : '—'}
                            </td>

                            {/* Previous Comparable Production */}
                            <td className="py-3.5 px-3 text-right text-slate-500 font-mono">
                              {c.previous_production_tonnes !== null 
                                ? `${c.previous_production_tonnes.toLocaleString()} t` 
                                : <span className="text-slate-400 italic">No record</span>}
                            </td>

                            {/* Absolute Change & % Change */}
                            <td className="py-3.5 px-3 text-right">
                              {c.abs_change_tonnes !== null ? (
                                <div>
                                  <span className={`font-bold ${
                                    c.abs_change_tonnes > 0 ? 'text-emerald-700' : (c.abs_change_tonnes < 0 ? 'text-rose-700' : 'text-slate-600')
                                  }`}>
                                    {c.abs_change_tonnes > 0 ? '+' : ''}{c.abs_change_tonnes.toLocaleString()} t
                                  </span>
                                  {c.pct_change_tonnes !== null && (
                                    <div className={`text-[10px] font-semibold ${
                                      c.pct_change_tonnes > 0 ? 'text-emerald-600' : (c.pct_change_tonnes < 0 ? 'text-rose-600' : 'text-slate-400')
                                    }`}>
                                      ({c.pct_change_tonnes > 0 ? '+' : ''}{c.pct_change_tonnes}%)
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </td>

                            {/* Status Badge */}
                            <td className="py-3.5 px-3 text-center">
                              {c.change_status === 'INCREASED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <TrendingUp className="w-3 h-3" /> Increased
                                </span>
                              )}
                              {c.change_status === 'DECREASED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                  <TrendingDown className="w-3 h-3" /> Decreased
                                </span>
                              )}
                              {c.change_status === 'STABLE' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                  <Minus className="w-3 h-3" /> Stable (±{stabilityThreshold}%)
                                </span>
                              )}
                              {c.change_status === 'NO_BASELINE' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  No Baseline
                                </span>
                              )}
                            </td>

                            {/* Actions: View History */}
                            <td className="py-3.5 pr-6 pl-3 text-right">
                              <button
                                onClick={() => setHistoryModalCrop(c.crop_name)}
                                className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:text-white hover:bg-emerald-700 border border-emerald-300 rounded-md transition-all flex items-center gap-1 ml-auto cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>History</span>
                              </button>
                            </td>

                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Summary */}
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
                  <span>
                    Showing {filteredCrops.length} of {processedCrops.length} recorded crops for {selectedDistrict} in {activeSeason}
                  </span>
                  <span className="font-semibold text-slate-700">
                    Calculations follow NISR Seasonal Agricultural Survey protocols.
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: SEASONAL COMPARISON */}
          {/* ======================================================== */}
          {activeTab === 'seasonal_comparison' && (
            <div className="space-y-6">
              
              {/* Crop Selector Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Crop Seasonal Progression Explorer
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select any crop to analyze historical production and land area across all available seasons in {selectedDistrict}.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="crop-select" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                    Crop to Compare:
                  </label>
                  <select
                    id="crop-select"
                    value={selectedComparisonCrop}
                    onChange={(e) => setSelectedComparisonCrop(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {processedCrops.map((c) => (
                      <option key={c.crop_name} value={c.crop_name}>
                        {c.crop_name} {c.is_subcrop ? `(Subcrop: ${c.parent_crop_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time Series Chart for Selected Crop */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedComparisonCrop} Production & Area Trajectory
                    </h3>
                    <p className="text-xs text-slate-500">
                      Discontinuous lines indicate unrecorded seasons; missing observations are not rendered as zero.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                    {cropHistoryData.length} Seasons Recorded
                  </span>
                </div>

                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={cropHistoryData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="season_code" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#059669' }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#3b82f6' }} />
                      <Tooltip 
                        formatter={(val: any, name: any) => [
                          val !== null ? val.toLocaleString() : 'Not Reported',
                          name === 'production_tonnes' ? 'Production (t)' : 'Cultivated Area (ha)'
                        ]}
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="production_tonnes" 
                        name="Production (tonnes)" 
                        stroke="#059669" 
                        strokeWidth={3} 
                        dot={{ r: 4 }}
                        connectNulls={false} 
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="area_ha" 
                        name="Cultivated Area (ha)" 
                        stroke="#3b82f6" 
                        strokeWidth={2} 
                        strokeDasharray="4 4"
                        dot={{ r: 3 }}
                        connectNulls={false} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Complete Seasonal History Table for Selected Crop */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {selectedComparisonCrop} Historical Audit Records ({selectedDistrict})
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">Traceable to NISR PDF Surveys</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3 pl-6">Season</th>
                        <th className="py-3">Year</th>
                        <th className="py-3 text-right">Production (t)</th>
                        <th className="py-3 text-right">Cultivated Area (ha)</th>
                        <th className="py-3 text-right">Yield (t/ha)</th>
                        <th className="py-3 text-center">Quality Status</th>
                        <th className="py-3 pr-6 text-right">Source File</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {[...cropHistoryData].reverse().map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 pl-6 font-bold text-slate-900">
                            {row.season_code} {row.season_name ? `(${row.season_name})` : ''}
                          </td>
                          <td className="py-3 text-slate-500">{row.year}</td>
                          <td className="py-3 text-right font-black text-slate-800">
                            {row.production_tonnes !== null ? row.production_tonnes.toLocaleString() : '—'}
                          </td>
                          <td className="py-3 text-right text-slate-600">
                            {row.area_ha !== null ? `${row.area_ha.toLocaleString()} ha` : '—'}
                          </td>
                          <td className="py-3 text-right font-bold text-emerald-800">
                            {row.yield_t_ha !== null ? `${row.yield_t_ha} t/ha` : '—'}
                          </td>
                          <td className="py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {row.data_quality_status || 'VERIFIED'}
                            </span>
                          </td>
                          <td className="py-3 pr-6 text-right text-[11px] font-mono text-slate-500">
                            {row.source_file || 'NISR SAS Series'}
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
          {/* TAB 4: CROP RANKINGS */}
          {/* ======================================================== */}
          {activeTab === 'crop_rankings' && (
            <div className="space-y-6">
              
              {/* Methodological Guidance Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3.5">
                <Award className="w-5 h-5 text-emerald-800 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 space-y-1">
                  <h3 className="font-bold text-sm">
                    Two Distinct Rankings: Production Volume vs. Land Yield Efficiency
                  </h3>
                  <p>
                    Rankings must not confuse aggregate output with agricultural efficiency. A crop like <span className="font-semibold">Irish Potato or Maize</span> may top the <span className="font-bold">Production Ranking</span> due to broad land allocation, while horticultural crops or root crops achieve higher per-hectare productivity in the <span className="font-bold">Yield Ranking</span>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Ranking 1: Production Ranking */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                          1
                        </span>
                        Production Volume Ranking
                      </h3>
                      <p className="text-xs text-slate-500">
                        Ranked by total tonnage harvested in {selectedDistrict} ({activeSeason}).
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-400">Total Output</span>
                  </div>

                  <div className="space-y-3">
                    {(data?.rankings?.byProduction || []).slice(0, 10).map((c: any) => (
                      <div 
                        key={c.crop_name} 
                        className="p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center flex-shrink-0 ${
                            c.production_rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            c.production_rank === 2 ? 'bg-slate-200 text-slate-700' :
                            c.production_rank === 3 ? 'bg-amber-700/20 text-amber-900' : 'bg-slate-100 text-slate-500'
                          }`}>
                            #{c.production_rank}
                          </span>
                          <div>
                            <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                              <span>{c.crop_name}</span>
                              {c.is_subcrop && (
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-normal">
                                  Subcrop
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              {c.crop_category} · {c.area_ha ? `${c.area_ha.toLocaleString()} ha` : 'No area reported'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="font-black text-sm text-slate-900">
                            {c.production_tonnes?.toLocaleString()} t
                          </div>
                          {c.production_share_pct && (
                            <div className="text-[10px] font-bold text-emerald-700">
                              {c.production_share_pct}% of district total
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ranking 2: Yield Ranking */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-black">
                          2
                        </span>
                        Yield Efficiency Ranking
                      </h3>
                      <p className="text-xs text-slate-500">
                        Ranked strictly by verified tonnes per hectare (t/ha) where valid area &gt; 0.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-400">Land Productivity</span>
                  </div>

                  <div className="space-y-3">
                    {(data?.rankings?.byYield || []).slice(0, 10).map((c: any) => (
                      <div 
                        key={c.crop_name} 
                        className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center flex-shrink-0 ${
                            c.yield_rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            c.yield_rank === 2 ? 'bg-slate-200 text-slate-700' :
                            c.yield_rank === 3 ? 'bg-amber-700/20 text-amber-900' : 'bg-slate-100 text-slate-500'
                          }`}>
                            #{c.yield_rank}
                          </span>
                          <div>
                            <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                              <span>{c.crop_name}</span>
                              {c.is_subcrop && (
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-normal">
                                  Subcrop
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              Harvested on {c.area_ha?.toLocaleString()} ha · Vol: {c.production_tonnes?.toLocaleString()} t
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="font-black text-sm text-emerald-800">
                            {c.yield_t_ha} t/ha
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Yield Efficiency
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: PRODUCTION CHANGES & ANOMALIES */}
          {/* ======================================================== */}
          {activeTab === 'production_changes' && (
            <div className="space-y-6">
              
              {/* Four Highlighted Significant Changes Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Largest Absolute Increase */}
                <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Largest Absolute Gain
                  </span>
                  <div className="text-lg font-bold text-slate-900 mt-2 truncate">
                    {sigChanges.largestIncreaseAbs?.crop_name || 'None'}
                  </div>
                  <div className="text-xl font-black text-emerald-800 mt-1">
                    +{sigChanges.largestIncreaseAbs?.abs_change_tonnes?.toLocaleString() || 0} t
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    +{sigChanges.largestIncreaseAbs?.pct_change_tonnes}% vs {data?.season?.comparison || 'baseline'}
                  </div>
                </div>

                {/* 2. Largest Absolute Decrease */}
                <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded">
                    Largest Absolute Loss
                  </span>
                  <div className="text-lg font-bold text-slate-900 mt-2 truncate">
                    {sigChanges.largestDecreaseAbs?.crop_name || 'None'}
                  </div>
                  <div className="text-xl font-black text-rose-800 mt-1">
                    {sigChanges.largestDecreaseAbs?.abs_change_tonnes?.toLocaleString() || 0} t
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {sigChanges.largestDecreaseAbs?.pct_change_tonnes}% vs {data?.season?.comparison || 'baseline'}
                  </div>
                </div>

                {/* 3. Largest Percentage Increase */}
                <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Largest % Growth
                  </span>
                  <div className="text-lg font-bold text-slate-900 mt-2 truncate">
                    {sigChanges.largestIncreasePct?.crop_name || 'None'}
                  </div>
                  <div className="text-xl font-black text-emerald-800 mt-1">
                    +{sigChanges.largestIncreasePct?.pct_change_tonnes || 0}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    +{sigChanges.largestIncreasePct?.abs_change_tonnes?.toLocaleString()} tonnes
                  </div>
                </div>

                {/* 4. Largest Percentage Decrease */}
                <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded">
                    Largest % Contraction
                  </span>
                  <div className="text-lg font-bold text-slate-900 mt-2 truncate">
                    {sigChanges.largestDecreasePct?.crop_name || 'None'}
                  </div>
                  <div className="text-xl font-black text-rose-800 mt-1">
                    {sigChanges.largestDecreasePct?.pct_change_tonnes || 0}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {sigChanges.largestDecreasePct?.abs_change_tonnes?.toLocaleString()} tonnes
                  </div>
                </div>

              </div>

              {/* Yield vs Area Discrepancies Table (Crucial Analytical Requirement) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Yield Discrepancy & Productivity Shifts (Attention Directives)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Crops where output volume changed significantly despite small changes in cultivated area (or vice versa).
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 self-start sm:self-auto">
                    Threshold: |ΔProd% − ΔArea%| ≥ 15%
                  </span>
                </div>

                {sigChanges.areaDiscrepancyCrops?.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No major yield-to-area discrepancies detected for {selectedDistrict} between {activeSeason} and {data?.season?.comparison}.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3 pl-2">Crop Name</th>
                          <th className="pb-3 text-right">Production Change</th>
                          <th className="pb-3 text-right">Area Change</th>
                          <th className="pb-3 text-right">Yield (t/ha)</th>
                          <th className="pb-3">Diagnostic Classification</th>
                          <th className="pb-3 pr-2 text-right">Recommended Investigation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {sigChanges.areaDiscrepancyCrops.map((c: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 pl-2 font-bold text-slate-900">
                              {c.crop_name}
                            </td>
                            <td className={`py-3.5 text-right font-black ${
                              c.pct_change_tonnes >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {c.pct_change_tonnes >= 0 ? '+' : ''}{c.pct_change_tonnes}%
                            </td>
                            <td className="py-3.5 text-right text-slate-600 font-mono">
                              {c.pct_change_area >= 0 ? '+' : ''}{c.pct_change_area}%
                            </td>
                            <td className="py-3.5 text-right font-bold text-emerald-800">
                              {c.yield_t_ha} t/ha ({c.previous_yield_t_ha ? `${c.previous_yield_t_ha} prev` : '—'})
                            </td>
                            <td className="py-3.5">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                {c.area_discrepancy}
                              </span>
                            </td>
                            <td className="py-3.5 pr-2 text-right">
                              <span className="text-[11px] text-slate-500">
                                {c.pct_change_tonnes > c.pct_change_area 
                                  ? 'Examine fertilizer usage & irrigation records' 
                                  : 'Examine pest reports & rainfall deficits'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ACTIONABLE INVESTIGATION DIRECTIVES FOR THE DAO */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    District Agricultural Officer Investigation Directives
                  </h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  A change in crop output does not in itself explain the underlying cause. AgriLens connects productivity discrepancies directly with your district's infrastructure, soil, and post-harvest facilities to verify physical evidence:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Link 1: Irrigation */}
                  <Link
                    to="/district/irrigation"
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-400/50 hover:bg-white/10 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-emerald-400 flex items-center justify-between mb-1">
                        <span>Check Irrigation Assets</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-[11px] text-slate-300 leading-normal">
                        Verify whether marshland dams, solar micro-pumps, or perimeter schemes protected yield against dry spells.
                      </p>
                    </div>
                  </Link>

                  {/* Link 2: Soil & Fertility */}
                  <Link
                    to="/district/soil"
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-400/50 hover:bg-white/10 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-emerald-400 flex items-center justify-between mb-1">
                        <span>Check Soil Acidity & Inputs</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-[11px] text-slate-300 leading-normal">
                        Examine lime distribution, soil pH testing, and NPK/DAP input adoption across sectors in {selectedDistrict}.
                      </p>
                    </div>
                  </Link>

                  {/* Link 3: Post-Harvest */}
                  <Link
                    to="/district/post-harvest"
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-400/50 hover:bg-white/10 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-emerald-400 flex items-center justify-between mb-1">
                        <span>Check Post-Harvest Losses</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-[11px] text-slate-300 leading-normal">
                        Review drying ground capacities, storage aggregation centers, and warehouse receipts to minimize post-harvest waste.
                      </p>
                    </div>
                  </Link>

                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: DATA COVERAGE & SOURCES */}
          {/* ======================================================== */}
          {activeTab === 'data_coverage' && (
            <div className="space-y-6">
              
              {/* Coverage Matrix Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Historical Seasonal Coverage Matrix ({selectedDistrict})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Complete catalog of all validated SAS surveys archived in AgriLens for {selectedDistrict}.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    {seasons.length} Available Surveys
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-3 pl-6">Season Code</th>
                        <th className="py-3">Year</th>
                        <th className="py-3">Official Survey Label</th>
                        <th className="py-3 text-center">Crops Recorded</th>
                        <th className="py-3 text-center">Coverage Status</th>
                        <th className="py-3 pr-6 text-right">NISR Source Document</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {seasons.map((s, idx) => (
                        <tr 
                          key={s.season_code} 
                          className={`hover:bg-slate-50 transition-colors ${
                            s.season_code === activeSeason ? 'bg-emerald-50/60 font-semibold' : ''
                          }`}
                        >
                          <td className="py-3.5 pl-6 font-bold text-slate-900 flex items-center gap-2">
                            {s.season_code === activeSeason && (
                              <span className="w-2 h-2 rounded-full bg-emerald-600" />
                            )}
                            {s.season_code}
                          </td>
                          <td className="py-3.5 text-slate-600">{s.year}</td>
                          <td className="py-3.5 font-bold text-slate-800">{s.official_label}</td>
                          <td className="py-3.5 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                              {s.recorded_crops_count} crops
                            </span>
                          </td>
                          <td className="py-3.5 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {s.quality_status || 'VERIFIED'}
                            </span>
                          </td>
                          <td className="py-3.5 pr-6 text-right font-mono text-[11px] text-slate-500">
                            {s.source_file}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Missing Crop Coverage Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">
                    Unreported or Dropped Crops in Selected Period
                  </h3>
                  <p className="text-xs text-slate-500">
                    Crops cultivated in {data?.season?.comparison || 'earlier seasons'} that have no production record in {activeSeason}.
                  </p>
                </div>

                {(data?.missingCrops || []).length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Full crop coverage confirmed. All crops from {data?.season?.comparison} have reported production records in {activeSeason}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {(data.missingCrops || []).map((m: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                        <div className="font-bold text-slate-800">{m.crop_name}</div>
                        <div className="text-[11px] text-slate-500">{m.crop_category}</div>
                        <div className="text-[11px] text-amber-700 font-semibold mt-1">
                          Prior output: {m.previous_production_tonnes?.toLocaleString()} t
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Methodological Standards Card */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-xs text-slate-600 space-y-3 leading-relaxed">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Methodological Standards & Data Rules Applied
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-slate-600">
                  <li>
                    <strong className="text-slate-800">Unit Normalization:</strong> All production volumes are strictly converted to metric tonnes (<span className="font-mono">t</span>); land area in hectares (<span className="font-mono">ha</span>); and productivity in tonnes per hectare (<span className="font-mono">t/ha</span>).
                  </li>
                  <li>
                    <strong className="text-slate-800">Cultivated Area Integrity:</strong> Cultivated area is presented strictly where verified from NISR enumeration blocks; it is never inferred or back-calculated from production figures.
                  </li>
                  <li>
                    <strong className="text-slate-800">Double-Counting Prevention:</strong> Totals sum only primary crops. Aggregate beans and aggregate bananas encapsulate their respective climbing/bush and cooking/beer subvarieties.
                  </li>
                  <li>
                    <strong className="text-slate-800">Undefined Percentage Changes:</strong> Where previous production was zero or unrecorded, percentage change is flagged as undefined or no baseline, rather than generating infinite or misleading values.
                  </li>
                </ul>
              </div>

            </div>
          )}

        </>
      )}

      {/* CROP HISTORY DRILLDOWN MODAL */}
      {historyModalCrop && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    {historyModalCrop} Seasonal History ({selectedDistrict})
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete historical production progression from SAS surveys
                </p>
              </div>
              <button
                onClick={() => setHistoryModalCrop(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Chart */}
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cropHistoryData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="season_code" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line 
                      type="monotone" 
                      dataKey="production_tonnes" 
                      name="Production (t)" 
                      stroke="#059669" 
                      strokeWidth={2} 
                      dot={{ r: 3 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="area_ha" 
                      name="Area (ha)" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      strokeDasharray="4 4"
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="py-2.5 pl-4">Season</th>
                      <th className="py-2.5 text-right">Production (t)</th>
                      <th className="py-2.5 text-right">Area (ha)</th>
                      <th className="py-2.5 text-right">Yield (t/ha)</th>
                      <th className="py-2.5 pr-4 text-right">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {[...cropHistoryData].reverse().map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 pl-4 font-bold text-slate-900">{r.season_code}</td>
                        <td className="py-2 text-right font-black text-slate-800">{r.production_tonnes?.toLocaleString() ?? '—'}</td>
                        <td className="py-2 text-right text-slate-600">{r.area_ha?.toLocaleString() ?? '—'}</td>
                        <td className="py-2 text-right font-bold text-emerald-800">{r.yield_t_ha ?? '—'}</td>
                        <td className="py-2 pr-4 text-right font-mono text-[10px] text-slate-400">{r.source_file}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setHistoryModalCrop(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close History
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
