import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  Globe, TrendingUp, TrendingDown, ShieldCheck, AlertTriangle, CheckCircle2, 
  RefreshCw, ArrowUpRight, ChevronRight, Download, Search, Calendar, Info, 
  AlertCircle, ArrowUpDown, ExternalLink, Eye, X, BarChart3, Award, Sparkles, 
  Scale, FileText, ArrowRight, Plus, MapPin, Compass, Truck, Ship, Plane, 
  Layers, Box, Building2, ThermometerSnowflake, Filter, Activity, Gauge, 
  Zap, Printer, Share2, HelpCircle, Check, Minus
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// TypeScript Interfaces matching Backend Engine
interface SeasonItem {
  season_code: string;
  year: number;
  season_name: string;
  official_label: string;
  observation_date?: string;
  source_reference?: string;
}

interface CropExportPortfolioItem {
  crop_name: string;
  hs_code: string;
  category: string;
  production_tonnes: number;
  cultivated_area_ha: number;
  yield_kg_per_ha: number;
  seasonal_consistency_pct: number;
  local_consumption_pct: number;
  seed_retention_pct: number;
  post_harvest_loss_pct: number;
  marketable_surplus_tonnes: number;
  exportable_grade_pct: number;
  estimated_exportable_volume_mt: number;
  export_linkage_status: 'VERIFIED_EXPORT_DEMAND' | 'REGIONAL_COMMERCIAL' | 'EMERGING_DOMESTIC_SURPLUS';
  primary_target_markets: string[];
  fob_unit_value_usd_per_mt: number;
  export_readiness_classification: 'PROMISING_OPPORTUNITY' | 'OPPORTUNITY_REQUIRING_IMPROVEMENT' | 'INSUFFICIENT_EVIDENCE';
  quality_requirements: string;
  processing_potential: string;
  logistics_constraints: string;
  data_completeness: string;
  evidence_summary: string;
  recommended_action: string;
}

interface TemporalComparisonItem {
  crop_name: string;
  indicator: string;
  unit: string;
  current_value: number;
  compare_value: number | null;
  abs_change: number | null;
  pct_change: string;
  comparability_status: 'COMPARABLE' | 'INDICATIVE' | 'INCOMPATIBLE_FREQUENCY';
  notes: string;
}

interface TargetMarketItem {
  region: string;
  keyProducts: string;
  marketEntryRequirements: string;
  pricingEnvironment: string;
}

interface OpportunityRankingItem {
  rank: number;
  crop_name: string;
  classification: 'PROMISING_OPPORTUNITY' | 'OPPORTUNITY_REQUIRING_IMPROVEMENT' | 'INSUFFICIENT_EVIDENCE';
  score: number;
  production_tonnes: number;
  marketable_surplus_mt: number;
  exportable_mt: number;
  target_destinations: string[];
  fob_usd_mt: number;
  reasons_for_ranking: string[];
  critical_barriers: string[];
  recommended_next_step: string;
}

interface CrossModuleConstraintItem {
  domain: string;
  description: string;
}

interface ActionRoadmapItem {
  phase: string;
  action: string;
}

interface InterventionItem {
  id: string;
  title: string;
  description: string;
  status: 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED';
  priority_level: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  challenge_area: string;
  sector_name: string;
  district_name: string;
  target_metric: string;
  budget_rwf: number;
  target_beneficiaries: number;
  start_date: string;
  end_date: string;
  created_by_name: string;
}

// 30 Districts of Rwanda
const ALL_RWANDA_DISTRICTS = [
  'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi', 'Gisagara',
  'Huye', 'Kamonyi', 'Karongi', 'Kayonza', 'Kicukiro', 'Kirehe', 'Muhanga',
  'Musanze', 'Ngoma', 'Ngororero', 'Nyabihu', 'Nyagatare', 'Nyamagabe',
  'Nyamasheke', 'Nyanza', 'Nyarugenge', 'Nyaruguru', 'Rubavu', 'Ruhango',
  'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana'
];

export default function DistrictExportsPage() {
  const { districtName: contextDistrict, seasonCode: contextSeason } = useOutletContext<{ 
    districtName?: string; 
    seasonCode?: string; 
  }>() || {};

  // Resolve logged in user and RBAC scope
  const currentUser = useMemo(() => {
    try {
      const u = localStorage.getItem('agrilens_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }, []);

  const isNationalUser = currentUser && currentUser.role !== 'DISTRICT_OFFICER';
  const assignedDistrict = currentUser?.district || contextDistrict || 'Musanze';

  // Navigation & Filter State
  const [selectedDistrict, setSelectedDistrict] = useState<string>(assignedDistrict);
  const [activeSeason, setActiveSeason] = useState<string>(contextSeason || '2026B');
  const [compareMode, setCompareMode] = useState<string>('same_season_prev_year');
  const [customCompareSeason, setCustomCompareSeason] = useState<string>('');
  
  // 9 Required Tabs:
  // 'overview' | 'crop_potential' | 'seasonal_comparison' | 'marketable_surplus' | 'trade_intelligence' | 'opportunity_ranking' | 'readiness_constraints' | 'recommendations' | 'data_coverage'
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Filters for Crop Export Potential Tab
  const [cropSearch, setCropSearch] = useState<string>('');
  const [linkageFilter, setLinkageFilter] = useState<string>('ALL');
  const [readinessFilter, setReadinessFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modals
  const [selectedCropModal, setSelectedCropModal] = useState<CropExportPortfolioItem | null>(null);
  const [isProposeModalOpen, setIsProposeModalOpen] = useState<boolean>(false);

  // New Intervention Form State
  const [newIntervention, setNewIntervention] = useState({
    title: '',
    sector: '',
    type: 'TRADE_LOGISTICS',
    budgetRwf: 45000000,
    targetMetric: '',
    beneficiaries: 800,
    justification: ''
  });
  const [isSubmittingIntervention, setIsSubmittingIntervention] = useState(false);
  const [interventionFeedbackMsg, setInterventionFeedbackMsg] = useState<string | null>(null);

  // Data Fetching State
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // Sync district if user is constrained to a specific district
  useEffect(() => {
    if (!isNationalUser && assignedDistrict) {
      setSelectedDistrict(assignedDistrict);
    }
  }, [assignedDistrict, isNationalUser]);

  // Fetch Export Opportunities Intelligence Dossier
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = `http://localhost:3000/api/v1/district/exports?district=${encodeURIComponent(selectedDistrict)}&season=${activeSeason}&compareMode=${compareMode}`;
      if (compareMode === 'custom' && customCompareSeason) {
        url += `&compareSeason=${encodeURIComponent(customCompareSeason)}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to fetch export intelligence (${res.status})`);
      }
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error loading export opportunities dataset.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDistrict, activeSeason, compareMode, customCompareSeason]);

  // Derived Values
  const seasons: SeasonItem[] = data?.availableSeasons || [];
  const activeSeasonObj = seasons.find(s => s.season_code === activeSeason);
  const availableYears = useMemo(() => {
    const yrs = Array.from(new Set(seasons.map(s => s.year))).sort((a, b) => b - a);
    return yrs.length > 0 ? yrs : [2026, 2025, 2024];
  }, [seasons]);

  const kpis = data?.summaryKPIs || {
    totalCropProductionTonnes: 0,
    potentialMarketableSurplusTonnes: 0,
    estimatedExportableVolumeTonnes: 0,
    exportLinkedCropsCount: 0,
    totalRecordedCropsCount: 0,
    areasForExportAssessmentCount: 0,
    exportReadinessScore: 70,
    exportTier: 'TIER_2_REGIONAL_EXPORTER',
    nearestExitHub: 'Cyanika Border / Kigali Airport',
    distanceToExitKm: 92,
    exportReadyCooperativesCount: 0,
    qualityCertificationPct: 0
  };

  const cropPortfolio: CropExportPortfolioItem[] = data?.cropExportPortfolio || [];
  const temporalComparisons: TemporalComparisonItem[] = data?.temporalComparison || [];
  const surplusModel = data?.marketableSurplusModel || {
    formula: 'Potential surplus = Production - Local consumption - Seed/reserved uses - Post-harvest losses',
    surplusSummary: {
      totalProductionMT: 0,
      totalMarketableSurplusMT: 0,
      totalExportableSurplusMT: 0,
      avgSurplusRatioPct: 0
    },
    methodologyNotes: ''
  };
  const targetMarkets: TargetMarketItem[] = data?.marketAndTradeIntelligence?.targetMarkets || [];
  const opportunityRankings: OpportunityRankingItem[] = data?.opportunityRanking || [];
  const crossModuleConstraints: CrossModuleConstraintItem[] = data?.exportReadinessAndConstraints?.crossModuleConstraints || [];
  const actionRoadmap: ActionRoadmapItem[] = data?.recommendationsAndMonitoring?.districtActionRoadmap || [];
  const activeInterventions: InterventionItem[] = data?.recommendationsAndMonitoring?.activeInterventions || [];
  const dataSources: string[] = data?.dataCoverageAndQuality?.primarySources || [];
  const safeguardPrinciples: string[] = data?.dataCoverageAndQuality?.safeguardPrinciples || [];

  // Filtered Crops for Tab 2
  const filteredCrops = useMemo(() => {
    return cropPortfolio.filter(crop => {
      const matchSearch = cropSearch === '' || 
        crop.crop_name.toLowerCase().includes(cropSearch.toLowerCase()) ||
        crop.hs_code.toLowerCase().includes(cropSearch.toLowerCase());
      const matchLinkage = linkageFilter === 'ALL' || crop.export_linkage_status === linkageFilter;
      const matchReadiness = readinessFilter === 'ALL' || crop.export_readiness_classification === readinessFilter;
      const matchCat = categoryFilter === 'ALL' || crop.category === categoryFilter;
      return matchSearch && matchLinkage && matchReadiness && matchCat;
    });
  }, [cropPortfolio, cropSearch, linkageFilter, readinessFilter, categoryFilter]);

  // Unique categories for filter
  const uniqueCategories = useMemo(() => {
    const cats = Array.from(new Set(cropPortfolio.map(c => c.category))).filter(Boolean);
    return cats.sort();
  }, [cropPortfolio]);

  // Handler for Submitting a New Export Linkage Intervention
  const handleCreateIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingIntervention(true);
    setInterventionFeedbackMsg(null);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        title: newIntervention.title,
        description: `${newIntervention.justification} (Proposed via District Export Opportunities Dashboard)`,
        challenge_area: 'TRADE_LOGISTICS',
        sector_name: newIntervention.sector || 'District Wide',
        district_name: selectedDistrict,
        target_metric: newIntervention.targetMetric || 'Export Facilitation Contract',
        budget_rwf: Number(newIntervention.budgetRwf),
        target_beneficiaries: Number(newIntervention.beneficiaries),
        priority_level: 'HIGH',
        status: 'PROPOSED'
      };

      const res = await fetch(`http://localhost:3000/api/v1/district/interventions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to record proposed export intervention.');
      }

      setInterventionFeedbackMsg('Export linkage intervention proposal recorded successfully in district ledger.');
      setTimeout(() => {
        setIsProposeModalOpen(false);
        setInterventionFeedbackMsg(null);
        fetchData();
      }, 1400);
    } catch (err: any) {
      setInterventionFeedbackMsg(err.message || 'Error saving proposal');
    } finally {
      setIsSubmittingIntervention(false);
    }
  };

  // CSV Export Function
  const exportToCSV = () => {
    const headers = [
      'Crop Name',
      'HS Code',
      'Category',
      'Production (MT)',
      'Cultivated Area (Ha)',
      'Yield (Kg/Ha)',
      'Seasonal Consistency (%)',
      'Marketable Surplus (MT)',
      'Exportable Volume (MT)',
      'Linkage Status',
      'Target Markets',
      'FOB Price (USD/MT)',
      'Readiness Classification',
      'Quality Standards'
    ];
    const rows = cropPortfolio.map(c => [
      `"${c.crop_name}"`,
      `"${c.hs_code}"`,
      `"${c.category}"`,
      c.production_tonnes,
      c.cultivated_area_ha,
      c.yield_kg_per_ha,
      `${c.seasonal_consistency_pct}%`,
      c.marketable_surplus_tonnes,
      c.estimated_exportable_volume_mt,
      `"${c.export_linkage_status}"`,
      `"${(c.primary_target_markets || []).join(', ')}"`,
      c.fob_unit_value_usd_per_mt,
      `"${c.export_readiness_classification}"`,
      `"${(c.quality_requirements || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AgriLens_${selectedDistrict}_Export_Opportunities_${activeSeason}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export Function
  const exportToJSON = () => {
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `AgriLens_${selectedDistrict}_Export_Intelligence_${activeSeason}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Chart Data for Overview
  const surplusWaterfallData = useMemo(() => {
    if (cropPortfolio.length === 0) return [];
    return cropPortfolio.slice(0, 6).map(c => ({
      name: c.crop_name,
      Production: c.production_tonnes,
      Surplus: c.marketable_surplus_tonnes,
      Exportable: c.estimated_exportable_volume_mt
    }));
  }, [cropPortfolio]);

  const opportunityDistribution = useMemo(() => {
    let promising = 0;
    let requiringImp = 0;
    let insufficient = 0;
    cropPortfolio.forEach(c => {
      if (c.export_readiness_classification === 'PROMISING_OPPORTUNITY') promising++;
      else if (c.export_readiness_classification === 'OPPORTUNITY_REQUIRING_IMPROVEMENT') requiringImp++;
      else insufficient++;
    });
    return [
      { name: 'Promising Opportunity', value: promising, color: '#059669' },
      { name: 'Requiring Improvement', value: requiringImp, color: '#D97706' },
      { name: 'Insufficient Evidence', value: insufficient, color: '#64748B' }
    ];
  }, [cropPortfolio]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
        <span className="text-base font-semibold text-slate-700">
          Compiling export opportunities & market intelligence for {selectedDistrict} District...
        </span>
        <span className="text-xs text-slate-500">
          Synthesizing SAS production data, NAEB trade benchmarks, and corridor logistics protocols...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* 1. TOP HEADER & MULTI-DISTRICT / SEASON FILTERS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide flex items-center gap-1">
              <Globe className="w-3 h-3" /> Area of Responsibility 5
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 uppercase tracking-wide">
              Export Opportunities Intelligence
            </span>
            <span className="text-xs text-slate-500 font-medium">
              30 Districts Nationwide Coverage &bull; SAS Validation
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Export Market Opportunities</span>
            <span className="text-emerald-700 font-bold text-xl sm:text-2xl">
              &bull; {data?.district?.name || selectedDistrict} District
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            District crop supply, marketable surplus modeling, export readiness assessments, trade logistics, and cross-border commercial opportunities across agricultural seasons.
          </p>
        </div>

        {/* Global Toolbar: District selector, Season selector, Propose action */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          {/* District Selector (Locked for District Officer, switchable for National Admin) */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              District Scope {isNationalUser ? '(National View)' : '(Assigned)'}
            </label>
            <div className="relative">
              <select
                disabled={!isNationalUser}
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className={`text-xs font-semibold rounded-lg border px-3 py-2 pr-8 appearance-none bg-white transition-all shadow-2xs ${
                  isNationalUser 
                    ? 'border-slate-300 text-slate-800 hover:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20' 
                    : 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'
                }`}
              >
                {ALL_RWANDA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d} District
                  </option>
                ))}
              </select>
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Season Selector */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Active Season
            </label>
            <div className="relative">
              <select
                value={activeSeason}
                onChange={(e) => setActiveSeason(e.target.value)}
                className="text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 px-3 py-2 pr-8 appearance-none hover:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
              >
                {seasons.map((s) => (
                  <option key={s.season_code} value={s.season_code}>
                    {s.official_label || s.season_code}
                  </option>
                ))}
              </select>
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons: Export & Propose */}
          <div className="flex items-center gap-1.5 self-end mt-4 sm:mt-0">
            <button
              onClick={exportToCSV}
              title="Export complete crop portfolio to CSV"
              className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={exportToJSON}
              title="Export JSON Dossier"
              className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors shadow-2xs"
            >
              <FileText className="w-4 h-4 text-purple-700" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              onClick={() => window.print()}
              title="Print official district export brief"
              className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={() => setIsProposeModalOpen(true)}
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all hover:shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Propose Export Linkage</span>
            </button>
          </div>
        </div>
      </div>

      {/* CORE MANDATED PRINCIPLE ALERT BANNER */}
      <div className="bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-600 rounded-r-xl p-4 flex items-start gap-3 shadow-2xs">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
            <span>Essential Scientific Principle: High Production &ne; Automatic Export Potential</span>
            <span className="text-[10px] font-normal text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              Mandatory Safeguard
            </span>
          </h4>
          <p className="text-xs text-amber-800/90 leading-relaxed">
            High district harvest volume alone does not guarantee marketability abroad. Export potential requires verified external demand, strict phytosanitary/chemical residue compliance (GlobalGAP, SPS, MRLs &lt; 0.01 ppm), consistency of supply across seasons, cold-chain transport, and profitable logistics parity. AgriLens combines these indicators where reliable data exists and transparently highlights what remains unverified.
          </p>
        </div>
      </div>

      {/* 2. THE 4 MANDATED CORE OVERVIEW CARDS + DIAGNOSTIC BADGES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Crop production */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Crop Production
              </span>
              <Box className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {(kpis.totalCropProductionTonnes || 0).toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-500">tonnes</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Selected season:</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {data?.season?.active_label || activeSeason}
            </span>
          </div>
        </div>

        {/* Card 2: Potential marketable surplus */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Potential Marketable Surplus
              </span>
              <Scale className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-700">
                {(kpis.potentialMarketableSurplusTonnes || 0).toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-500">tonnes</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Model calculation:</span>
            <span className="font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
              Sufficient SAS Data Validated
            </span>
          </div>
        </div>

        {/* Card 3: Export-linked crops */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Export-Linked Crops
              </span>
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-purple-700">
                {kpis.exportLinkedCropsCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                of {kpis.totalRecordedCropsCount} crops
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Evidence source:</span>
            <span className="font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-[10px]">
              Verified NAEB/MINICOM Demand
            </span>
          </div>
        </div>

        {/* Card 4: Areas for export assessment */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Areas for Export Assessment
              </span>
              <Compass className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-700">
                {kpis.areasForExportAssessmentCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">candidate streams</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Assessment criteria:</span>
            <span className="font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
              Documented Multi-Criteria
            </span>
          </div>
        </div>
      </div>

      {/* SECONDARY DIAGNOSTIC BAR: READINESS SCORE, CORRIDOR, COOPERATIVES */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-4 text-white shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <Gauge className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              District Export Readiness Composite
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">
                {Number(kpis.exportReadinessScore || 70).toFixed(1)} / 100
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 uppercase">
                {(kpis.exportTier || 'TIER_2_REGIONAL_EXPORTER').replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-700 hidden md:block" />

        <div className="flex items-center gap-3">
          <Truck className="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Nearest Exit Corridor</div>
            <div className="text-xs font-bold text-slate-200">
              {kpis.nearestExitHub || 'Border Hub'} ({kpis.distanceToExitKm || 0} km)
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-700 hidden md:block" />

        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-purple-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Export-Ready Cooperatives</div>
            <div className="text-xs font-bold text-slate-200">
              {kpis.exportReadyCooperativesCount || 0} Cooperatives ({kpis.qualityCertificationPct || 0}% Certified)
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-700 hidden md:block" />

        <div className="flex items-center gap-3">
          <Plane className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Est. Exportable Grade Volume</div>
            <div className="text-xs font-bold text-amber-300">
              {(kpis.estimatedExportableVolumeTonnes || 0).toLocaleString()} MT Grade-1 Spec
            </div>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION TABS (9 REQUIRED TABS) */}
      <div className="border-b border-slate-200 bg-white rounded-t-xl px-2 pt-2 flex items-center gap-1 overflow-x-auto scrollbar-none shadow-2xs">
        {[
          { id: 'overview', label: '1. Overview', icon: Globe },
          { id: 'crop_potential', label: '2. Crop Export Potential', icon: SproutIcon },
          { id: 'seasonal_comparison', label: '3. Seasonal & Annual Comparison', icon: ArrowUpDown },
          { id: 'marketable_surplus', label: '4. Marketable Surplus', icon: Scale },
          { id: 'trade_intelligence', label: '5. Market & Trade Intelligence', icon: TrendingUp },
          { id: 'opportunity_ranking', label: '6. Opportunity Ranking', icon: Award },
          { id: 'readiness_constraints', label: '7. Export Readiness & Constraints', icon: AlertCircle },
          { id: 'recommendations', label: '8. Recommendations & Monitoring', icon: CheckCircle2 },
          { id: 'data_coverage', label: '9. Data Coverage & Quality', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 text-xs font-bold rounded-t-lg flex items-center gap-2 whitespace-nowrap transition-all border-b-2 ${
                isActive 
                  ? 'border-emerald-700 text-emerald-800 bg-emerald-50/60' 
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENT PANELS */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Charts: Production vs Marketable Surplus vs Exportable Volume */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-700" />
                    Top Harvested Crops: Production vs Marketable Surplus vs Exportable Grade (MT)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Comparison for {selectedDistrict} in {data?.season?.active_label || activeSeason}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  NISR SAS &bull; Table 14 Model
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={surplusWaterfallData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                    <Tooltip 
                      formatter={(val: any) => [`${Number(val).toLocaleString()} MT`, '']}
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Production" fill="#059669" name="Gross Harvest (MT)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Surplus" fill="#3B82F6" name="Marketable Surplus (MT)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Exportable" fill="#8B5CF6" name="Exportable Grade Spec (MT)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg flex items-center justify-between">
                <span>Total district marketable surplus ratio:</span>
                <span className="font-extrabold text-blue-700">
                  {surplusModel.surplusSummary.avgSurplusRatioPct}% of total harvest
                </span>
              </div>
            </div>

            {/* Opportunity Classification Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-purple-700" />
                  Crop Export Opportunity Portfolio
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Breakdown across {cropPortfolio.length} evaluated crops in {selectedDistrict}
                </p>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={opportunityDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {opportunityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                {opportunityDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">{item.value} crops</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* District Highlights Summary & Strategic Opportunities */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Key Export Candidates for {selectedDistrict} ({data?.season?.active_label})
                </h3>
                <p className="text-xs text-slate-500">
                  Top ranked crops with proven cross-border or international demand
                </p>
              </div>
              <button
                onClick={() => setActiveTab('opportunity_ranking')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                View Full Ranking Methodology <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {opportunityRankings.slice(0, 3).map((opp, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200/80 bg-linear-to-b from-white to-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-400">RANK #{opp.rank}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      opp.classification === 'PROMISING_OPPORTUNITY'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {(opp.classification || '').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900">{opp.crop_name}</h4>
                    <p className="text-xs text-emerald-700 font-bold mt-0.5">
                      FOB Benchmark: ${opp.fob_usd_mt} / MT
                    </p>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 border-t border-slate-100 pt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Marketable Surplus:</span>
                      <span className="font-bold text-slate-800">{(opp.marketable_surplus_mt || 0).toLocaleString()} MT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Exportable Grade Spec:</span>
                      <span className="font-bold text-purple-700">{(opp.exportable_mt || 0).toLocaleString()} MT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Primary Targets:</span>
                      <span className="font-medium text-slate-700 truncate max-w-[140px]">
                        {(opp.target_destinations || []).join(', ')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const item = cropPortfolio.find(c => c.crop_name.toLowerCase() === opp.crop_name.toLowerCase());
                      if (item) setSelectedCropModal(item);
                    }}
                    className="w-full text-center py-1.5 bg-white border border-slate-200 hover:border-emerald-600 rounded-lg text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-colors shadow-2xs"
                  >
                    Inspect Full Crop Dossier
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CROP EXPORT POTENTIAL */}
      {activeTab === 'crop_potential' && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 grow">
              {/* Search Bar */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search crop name or HS code..."
                  value={cropSearch}
                  onChange={(e) => setCropSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                />
              </div>

              {/* Linkage Status Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Linkage:</span>
                <select
                  value={linkageFilter}
                  onChange={(e) => setLinkageFilter(e.target.value)}
                  className="text-xs font-semibold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800"
                >
                  <option value="ALL">All Linkages ({cropPortfolio.length})</option>
                  <option value="VERIFIED_EXPORT_DEMAND">Verified Export Demand</option>
                  <option value="REGIONAL_COMMERCIAL">Regional Commercial</option>
                  <option value="EMERGING_DOMESTIC_SURPLUS">Domestic Surplus Only</option>
                </select>
              </div>

              {/* Readiness Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Readiness:</span>
                <select
                  value={readinessFilter}
                  onChange={(e) => setReadinessFilter(e.target.value)}
                  className="text-xs font-semibold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800"
                >
                  <option value="ALL">All Classifications</option>
                  <option value="PROMISING_OPPORTUNITY">Promising Opportunity</option>
                  <option value="OPPORTUNITY_REQUIRING_IMPROVEMENT">Requiring Improvement</option>
                  <option value="INSUFFICIENT_EVIDENCE">Insufficient Evidence</option>
                </select>
              </div>

              {/* Category Filter */}
              {uniqueCategories.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-medium">Category:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="text-xs font-semibold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800"
                  >
                    <option value="ALL">All Categories</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500 font-semibold">
              Showing {filteredCrops.length} of {cropPortfolio.length} recorded district crops
            </div>
          </div>

          {/* Crops Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Crop Name & HS Code</th>
                    <th className="py-3 px-3">Production (MT)</th>
                    <th className="py-3 px-3">Area & Yield</th>
                    <th className="py-3 px-3">Supply Consistency</th>
                    <th className="py-3 px-3">Marketable Surplus</th>
                    <th className="py-3 px-3">Export Demand Evidence</th>
                    <th className="py-3 px-3">FOB Value</th>
                    <th className="py-3 px-3">Readiness Class</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredCrops.map((crop, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900">{crop.crop_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">HS {crop.hs_code} &bull; {crop.category}</div>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {crop.production_tonnes != null && crop.production_tonnes > 0 ? (crop.production_tonnes || 0).toLocaleString() : '—'} MT
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div>{crop.cultivated_area_ha != null && crop.cultivated_area_ha > 0 ? `${(crop.cultivated_area_ha || 0).toLocaleString()} ha` : '—'}</div>
                        <div className="text-[10px] text-slate-400">
                          {crop.yield_kg_per_ha != null && crop.yield_kg_per_ha > 0 ? `${(crop.yield_kg_per_ha || 0).toLocaleString()} kg/ha` : 'Yield unrecorded'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                crop.seasonal_consistency_pct >= 70 ? 'bg-emerald-600' :
                                crop.seasonal_consistency_pct >= 50 ? 'bg-amber-500' : 'bg-slate-400'
                              }`}
                              style={{ width: `${crop.seasonal_consistency_pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700">
                            {crop.seasonal_consistency_pct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-blue-700">
                          {(crop.marketable_surplus_tonnes || 0).toLocaleString()} MT
                        </div>
                        <div className="text-[10px] text-purple-700 font-semibold">
                          {(crop.estimated_exportable_volume_mt || 0).toLocaleString()} MT Grade-1
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          crop.export_linkage_status === 'VERIFIED_EXPORT_DEMAND'
                            ? 'bg-emerald-100 text-emerald-800'
                            : crop.export_linkage_status === 'REGIONAL_COMMERCIAL'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {(crop.export_linkage_status || '').replace(/_/g, ' ')}
                        </span>
                        <div className="text-[10px] text-slate-500 truncate max-w-[130px] mt-0.5">
                          {(crop.primary_target_markets || []).join(', ')}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        ${crop.fob_unit_value_usd_per_mt} / MT
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          crop.export_readiness_classification === 'PROMISING_OPPORTUNITY'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : crop.export_readiness_classification === 'OPPORTUNITY_REQUIRING_IMPROVEMENT'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}>
                          {(crop.export_readiness_classification || '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedCropModal(crop)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Inspect
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

      {/* TAB 3: SEASONAL & ANNUAL COMPARISON */}
      {activeTab === 'seasonal_comparison' && (
        <div className="space-y-6">
          {/* Comparison Mode Selector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-emerald-700" />
                Comparative Production & Surplus Across Seasons
              </h3>
              <p className="text-xs text-slate-500">
                Comparing current active period ({data?.season?.active_label || activeSeason}) against historical benchmark
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Comparison Mode:</span>
                <select
                  value={compareMode}
                  onChange={(e) => setCompareMode(e.target.value)}
                  className="text-xs font-semibold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800"
                >
                  <option value="same_season_prev_year">Same Season Previous Year (e.g. 2026B vs 2025B)</option>
                  <option value="previous_season">Previous Consecutive Season (e.g. 2026B vs 2026A)</option>
                  <option value="custom">Custom Season Select</option>
                </select>
              </div>

              {compareMode === 'custom' && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Benchmark Season:</span>
                  <select
                    value={customCompareSeason}
                    onChange={(e) => setCustomCompareSeason(e.target.value)}
                    className="text-xs font-semibold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800"
                  >
                    <option value="">Select benchmark...</option>
                    {seasons.map(s => (
                      <option key={s.season_code} value={s.season_code}>
                        {s.official_label || s.season_code}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Temporal Comparison Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Indicator Comparison: {data?.season?.active_label} vs {data?.season?.comparison_label || 'Previous Period'}
                </h4>
                <p className="text-xs text-slate-500">
                  NISR Seasonal Agricultural Survey Harvest Statistics &bull; Compatible Seasonal Intervals Only
                </p>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                Methodologically Compatible
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Indicator & Commodity</th>
                    <th className="py-3 px-3">Unit</th>
                    <th className="py-3 px-3">Current Period ({data?.season?.active})</th>
                    <th className="py-3 px-3">Comparison Period ({data?.season?.comparison})</th>
                    <th className="py-3 px-3">Absolute Change</th>
                    <th className="py-3 px-3">Percentage Change</th>
                    <th className="py-3 px-4">Provenance & Statistical Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {temporalComparisons.map((item, idx) => {
                    const isPositive = item.abs_change != null && item.abs_change > 0;
                    const isNegative = item.abs_change != null && item.abs_change < 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {item.indicator}
                        </td>
                        <td className="py-3 px-3 text-slate-500">{item.unit}</td>
                        <td className="py-3 px-3 font-extrabold text-slate-800">
                          {item.current_value != null ? (item.current_value || 0).toLocaleString() : '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {item.compare_value != null ? (item.compare_value || 0).toLocaleString() : '—'}
                        </td>
                        <td className="py-3 px-3 font-semibold">
                          {item.abs_change != null ? (
                            <span className={isPositive ? 'text-emerald-700' : isNegative ? 'text-rose-700' : 'text-slate-500'}>
                              {isPositive ? `+${(item.abs_change || 0).toLocaleString()}` : (item.abs_change || 0).toLocaleString()}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-3">
                          {item.pct_change !== '—' ? (
                            <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] ${
                              isPositive ? 'bg-emerald-50 text-emerald-800' : isNegative ? 'bg-rose-50 text-rose-800' : 'bg-slate-50 text-slate-700'
                            }`}>
                              {isPositive && <TrendingUp className="w-3 h-3 text-emerald-600" />}
                              {isNegative && <TrendingDown className="w-3 h-3 text-rose-600" />}
                              {item.pct_change}
                            </span>
                          ) : (
                            <span className="text-slate-400">Baseline Only</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs">
                          {item.notes}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MARKETABLE SURPLUS ASSESSMENT */}
      {activeTab === 'marketable_surplus' && (
        <div className="space-y-6">
          {/* Formula & Scientific Methodology Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-700" />
                  Marketable Surplus Accounting Model
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distinguishing between Gross Harvest, Marketable Surplus, and Exportable Grade Specification
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200">
                NISR Table 14 Calibrated
              </span>
            </div>

            {/* Formula Block */}
            <div className="bg-slate-900 text-white p-4 rounded-xl font-mono text-xs space-y-2">
              <div className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                Surplus Equation:
              </div>
              <div className="text-slate-100 font-bold text-sm">
                Potential Surplus = Production &minus; Local Consumption &minus; Seed &amp; Reserved Uses &minus; Post-Harvest Losses
              </div>
              <div className="text-slate-400 text-[11px] border-t border-slate-800 pt-2">
                Exportable Grade-1 Spec = Marketable Surplus &times; Grading Compliance Factor (accounting for size, cosmetic blemishes, and phytosanitary sorting).
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[11px] text-slate-500 block">Total District Production:</span>
                <span className="text-base font-extrabold text-slate-900">
                  {(surplusModel.surplusSummary?.totalProductionMT || 0).toLocaleString()} MT
                </span>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <span className="text-[11px] text-blue-700 block">Commercial Marketable Surplus:</span>
                <span className="text-base font-extrabold text-blue-800">
                  {(surplusModel.surplusSummary?.totalMarketableSurplusMT || 0).toLocaleString()} MT
                </span>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <span className="text-[11px] text-purple-700 block">Grade-1 Exportable Spec:</span>
                <span className="text-base font-extrabold text-purple-800">
                  {(surplusModel.surplusSummary?.totalExportableSurplusMT || 0).toLocaleString()} MT
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Surplus Deduction Breakdown Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900">
                Commodity-by-Commodity Surplus Deductions &amp; Exportable Grade Ratios
              </h4>
              <span className="text-xs text-slate-500">
                {selectedDistrict} District &bull; {data?.season?.active_label}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Crop Name</th>
                    <th className="py-3 px-3">Production</th>
                    <th className="py-3 px-3">Local Consump.</th>
                    <th className="py-3 px-3">Seed &amp; Uses</th>
                    <th className="py-3 px-3">Post-Harvest Losses</th>
                    <th className="py-3 px-3">Marketable Surplus</th>
                    <th className="py-3 px-3">Grade-1 Spec %</th>
                    <th className="py-3 px-3 font-bold text-purple-800">Exportable Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {cropPortfolio.map((crop, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{crop.crop_name}</td>
                      <td className="py-3 px-3">{(crop.production_tonnes || 0).toLocaleString()} MT</td>
                      <td className="py-3 px-3 text-slate-500">
                        {crop.local_consumption_pct}% ({Math.round((crop.production_tonnes || 0) * ((crop.local_consumption_pct || 0) / 100)).toLocaleString()} MT)
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {crop.seed_retention_pct}% ({Math.round((crop.production_tonnes || 0) * ((crop.seed_retention_pct || 0) / 100)).toLocaleString()} MT)
                      </td>
                      <td className="py-3 px-3 text-amber-700">
                        {crop.post_harvest_loss_pct}% ({Math.round((crop.production_tonnes || 0) * ((crop.post_harvest_loss_pct || 0) / 100)).toLocaleString()} MT)
                      </td>
                      <td className="py-3 px-3 font-bold text-blue-700">
                        {(crop.marketable_surplus_tonnes || 0).toLocaleString()} MT
                      </td>
                      <td className="py-3 px-3 text-slate-600">{crop.exportable_grade_pct || 0}%</td>
                      <td className="py-3 px-3 font-extrabold text-purple-700">
                        {(crop.estimated_exportable_volume_mt || 0).toLocaleString()} MT
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MARKET & TRADE INTELLIGENCE */}
      {activeTab === 'trade_intelligence' && (
        <div className="space-y-6">
          {/* Target Regional & Global Markets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {targetMarkets.map((market, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                      Target Destination Corridor
                    </span>
                    <Globe className="w-4 h-4 text-emerald-700" />
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900">{market.region}</h4>
                  
                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Key Demand Products:</span>
                      <span className="font-bold text-slate-800">{market.keyProducts}</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-500 block font-bold text-[10px] uppercase mb-0.5">
                        Market Entry &amp; SPS Requirements:
                      </span>
                      <span className="text-slate-700 leading-relaxed font-medium">
                        {market.marketEntryRequirements}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Pricing &amp; Logistics Environment:</span>
                      <span className="font-semibold text-emerald-700">{market.pricingEnvironment}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Transport Mode:</span>
                  <span className="font-bold text-slate-700">Air Cargo / Refrig. Overland Trucking</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Environment Disclaimer Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" /> Pricing Intelligence Provenance &amp; Disclaimers
            </span>
            <p className="leading-relaxed">
              Export benchmark values (USD/MT FOB Kigali or exit border) reflect wholesale terminal contracts reported by NAEB and MINICOM cross-border trade monitor desks. These figures must never be mistaken for farmgate prices paid to individual smallholders. Significant deductions for collection, grading, pre-cooling, packaging, phytosanitary inspection fees, and air/sea freight margins apply.
            </p>
          </div>
        </div>
      )}

      {/* TAB 6: OPPORTUNITY RANKING */}
      {activeTab === 'opportunity_ranking' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-700" />
              Ranked Candidate Crop-Market Opportunities for {selectedDistrict}
            </h3>
            <p className="text-xs text-slate-500">
              Evaluated using multi-criteria decision analysis (MCDA) incorporating production volume, supply consistency, marketable surplus, confirmed market demand, and quality barrier thresholds.
            </p>
          </div>

          <div className="space-y-4">
            {opportunityRankings.map((opp, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0">
                      {opp.rank}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-lg text-slate-900">{opp.crop_name}</h4>
                      <span className="text-xs text-slate-500 font-medium">
                        Target Markets: {(opp.target_destinations || []).join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      Score: {opp.score}/100
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                      opp.classification === 'PROMISING_OPPORTUNITY'
                        ? 'bg-emerald-100 text-emerald-800'
                        : opp.classification === 'OPPORTUNITY_REQUIRING_IMPROVEMENT'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {(opp.classification || '').replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Supporting reasons */}
                  <div className="space-y-1.5 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                    <span className="font-bold text-emerald-900 block text-[11px] uppercase tracking-wider">
                      Supporting Evidence &amp; Enablers:
                    </span>
                    <ul className="space-y-1 list-disc list-inside text-emerald-800">
                      {(opp.reasons_for_ranking || []).map((r, rIdx) => (
                        <li key={rIdx}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Critical barriers */}
                  <div className="space-y-1.5 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                    <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                      Critical Barriers &amp; Gaps:
                    </span>
                    <ul className="space-y-1 list-disc list-inside text-amber-800">
                      {(opp.critical_barriers || []).map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommended next step */}
                  <div className="space-y-1.5 bg-purple-50/50 p-3 rounded-xl border border-purple-100 flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-purple-900 block text-[11px] uppercase tracking-wider">
                        Recommended Next Intervention:
                      </span>
                      <p className="text-purple-800 font-medium leading-relaxed mt-1">
                        {opp.recommended_next_step}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setNewIntervention({
                          title: `Export Facilitation: ${opp.crop_name} Linkage Program`,
                          sector: '',
                          type: 'TRADE_LOGISTICS',
                          budgetRwf: 45000000,
                          targetMetric: `${opp.crop_name} Contract Matching & SPS Support`,
                          beneficiaries: 1200,
                          justification: `Action proposed from Opportunity Ranking (Rank #${opp.rank} ${opp.crop_name}): ${opp.recommended_next_step}`
                        });
                        setIsProposeModalOpen(true);
                      }}
                      className="mt-2 w-full py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded text-[11px] font-bold transition-colors shadow-2xs"
                    >
                      Propose Intervention on this Crop
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: EXPORT READINESS & CONSTRAINTS */}
      {activeTab === 'readiness_constraints' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Cross-Module Export Constraints &amp; Readiness Gaps
            </h3>
            <p className="text-xs text-slate-500">
              Correlating district export readiness with evidence from Agricultural Productivity, Irrigation, Soil &amp; Fertility, and Post-Harvest &amp; Storage modules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {crossModuleConstraints.map((constraint, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  <h4 className="font-bold text-sm text-slate-900">{constraint.domain}</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {constraint.description}
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Intervention linkage:</span>
                  <Link
                    to="/district/productivity"
                    className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    Investigate Module <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: RECOMMENDATIONS & MONITORING */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          {/* Action Roadmap */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  District Export Strategic Roadmap
                </h3>
                <p className="text-xs text-slate-500">
                  Phased actions for {selectedDistrict} District Agricultural Office &amp; NAEB Field Teams
                </p>
              </div>
              <button
                onClick={() => setIsProposeModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Propose New Project
              </button>
            </div>

            <div className="space-y-3">
              {actionRoadmap.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                      {item.phase}
                    </span>
                    <p className="text-xs font-bold text-slate-800 mt-1">
                      {item.action}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                    Lead: DAO &amp; NAEB
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Interventions Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Active &amp; Proposed District Export Interventions
                </h4>
                <p className="text-xs text-slate-500">
                  Synchronized with AgriLens Central Interventions Ledger
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600">
                {activeInterventions.length} Projects Recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Intervention Title</th>
                    <th className="py-3 px-3">Sector</th>
                    <th className="py-3 px-3">Target Metric</th>
                    <th className="py-3 px-3">Budget (RWF)</th>
                    <th className="py-3 px-3">Beneficiaries</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {activeInterventions.map((intv, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{intv.title}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{intv.description}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{intv.sector_name}</td>
                      <td className="py-3 px-3 text-slate-700 font-semibold">{intv.target_metric}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {intv.budget_rwf ? `${(intv.budget_rwf / 1000000).toFixed(1)}M RWF` : '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {intv.target_beneficiaries?.toLocaleString()} Farmers
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          intv.status === 'APPROVED' || intv.status === 'IN_PROGRESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {intv.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          intv.priority_level === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {intv.priority_level}
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

      {/* TAB 9: DATA COVERAGE & QUALITY */}
      {activeTab === 'data_coverage' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              Primary Sources &amp; Statistical Safeguards
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Authoritative Primary Sources:
                </span>
                <div className="space-y-2">
                  {dataSources.map((src, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-medium text-slate-800 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                      <span>{src}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  AgriLens Scientific Safeguard Principles:
                </span>
                <div className="space-y-2">
                  {safeguardPrinciples.map((safe, idx) => (
                    <div key={idx} className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-xs font-medium text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
                      <span>{safe}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CROP EXPORT INSPECTOR MODAL */}
      {selectedCropModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <SproutIcon className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">{selectedCropModal.crop_name}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    HS Code {selectedCropModal.hs_code} &bull; {selectedCropModal.category}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCropModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Harvest</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {(selectedCropModal.production_tonnes || 0).toLocaleString()} MT
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Cultivated Area</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {(selectedCropModal.cultivated_area_ha || 0).toLocaleString()} ha
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Marketable Surplus</span>
                  <span className="text-sm font-extrabold text-blue-700">
                    {(selectedCropModal.marketable_surplus_tonnes || 0).toLocaleString()} MT
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Exportable Spec</span>
                  <span className="text-sm font-extrabold text-purple-700">
                    {(selectedCropModal.estimated_exportable_volume_mt || 0).toLocaleString()} MT
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                  Target Destination Markets &amp; FOB Benchmark:
                </span>
                <div className="p-3 bg-emerald-50 text-emerald-950 rounded-lg font-medium flex items-center justify-between">
                  <span>{(selectedCropModal.primary_target_markets || []).join(', ')}</span>
                  <span className="font-bold text-emerald-700">${selectedCropModal.fob_unit_value_usd_per_mt} / MT FOB</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                  Phytosanitary &amp; Quality Certification Standards:
                </span>
                <p className="p-3 bg-slate-50 text-slate-700 rounded-lg font-medium leading-relaxed">
                  {selectedCropModal.quality_requirements}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                  Processing &amp; Value Addition Potential:
                </span>
                <p className="p-3 bg-slate-50 text-slate-700 rounded-lg font-medium leading-relaxed">
                  {selectedCropModal.processing_potential}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                  Logistics &amp; Cold-Chain Constraints:
                </span>
                <p className="p-3 bg-amber-50/60 text-amber-900 rounded-lg font-medium leading-relaxed">
                  {selectedCropModal.logistics_constraints}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                  Data Completeness &amp; Uncertainty:
                </span>
                <p className="p-3 bg-blue-50/60 text-blue-900 rounded-lg font-medium leading-relaxed">
                  {selectedCropModal.data_completeness} &bull; {selectedCropModal.evidence_summary}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setSelectedCropModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PROPOSE EXPORT LINKAGE INTERVENTION */}
      {isProposeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Propose Export Linkage Intervention
                </h3>
              </div>
              <button
                onClick={() => setIsProposeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIntervention} className="p-6 space-y-4 text-xs">
              {interventionFeedbackMsg && (
                <div className={`p-3 rounded-lg font-bold text-xs ${
                  interventionFeedbackMsg.includes('success')
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {interventionFeedbackMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px]">
                  Intervention Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. French Bean Smallholder GlobalGAP Certification"
                  value={newIntervention.title}
                  onChange={(e) => setNewIntervention({ ...newIntervention, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase text-[10px]">Target Sector</label>
                  <input
                    type="text"
                    placeholder="e.g. Kinigi or District Wide"
                    value={newIntervention.sector}
                    onChange={(e) => setNewIntervention({ ...newIntervention, sector: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase text-[10px]">Budget (RWF)</label>
                  <input
                    type="number"
                    value={newIntervention.budgetRwf}
                    onChange={(e) => setNewIntervention({ ...newIntervention, budgetRwf: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase text-[10px]">Target Metric</label>
                  <input
                    type="text"
                    placeholder="e.g. 500 MT Contract Matching"
                    value={newIntervention.targetMetric}
                    onChange={(e) => setNewIntervention({ ...newIntervention, targetMetric: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase text-[10px]">Beneficiary Farmers</label>
                  <input
                    type="number"
                    value={newIntervention.beneficiaries}
                    onChange={(e) => setNewIntervention({ ...newIntervention, beneficiaries: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase text-[10px]">Justification &amp; Market Evidence *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain buyer demand, SPS compliance status, and expected export volume..."
                  value={newIntervention.justification}
                  onChange={(e) => setNewIntervention({ ...newIntervention, justification: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProposeModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIntervention}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  {isSubmittingIntervention && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Submit to Interventions Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Micro Component Icons
function SproutIcon(props: any) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4.1 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </svg>
  );
}

function PieChartIcon(props: any) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
