import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  Warehouse, Layers, Box, Building2, ThermometerSnowflake, Sun, Flame, 
  Shield, ShieldAlert, AlertTriangle, CheckCircle2, RefreshCw, ArrowUpRight, 
  ChevronRight, Download, Search, Calendar, Info, AlertCircle, ArrowUpDown, 
  ExternalLink, Eye, X, BarChart3, Award, Sparkles, Scale, FileText, ArrowRight, 
  Plus, MapPin, Compass, CheckSquare, SlidersHorizontal, Sprout, Truck, 
  TrendingUp, TrendingDown, Minus, Filter, Clock, Activity, Gauge, Zap, 
  Printer, Share2, HelpCircle, Check, Map as MapIcon
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// TypeScript Interfaces matching Backend Engine
interface SeasonItem {
  season_id: string;
  season_code: string;
  year: number;
  season_name: string;
  official_label: string;
  observation_date: string;
  source_reference: string;
}

interface FacilityItem {
  id: string;
  facility_code: string;
  name: string;
  facility_type: string;
  sector_name: string;
  district_name: string;
  installed_capacity_tonnes: number;
  usable_capacity_tonnes: number;
  occupied_capacity_tonnes: number;
  utilization_pct: number;
  drying_capacity_tonnes_day: number;
  cold_storage_capacity_tonnes: number;
  processing_capacity_tonnes_day: number;
  supported_crops: string[];
  operational_status: 'OPERATIONAL' | 'PARTIAL' | 'NON_OPERATIONAL' | 'PLANNED' | 'UNKNOWN';
  owner_type: 'COOPERATIVE' | 'PUBLIC' | 'PRIVATE' | 'PUBLIC_PRIVATE';
  operator_name: string;
  data_source: string;
  last_verified_at: string;
  verification_warning: boolean;
  coordinates: [number, number];
}

interface CropComparisonItem {
  crop_name: string;
  production_mt: number;
  pct_sold: number;
  pct_stored: number;
  pct_consumed: number;
  pct_lost: number;
  handled_volume_mt: number;
  estimated_demand_mt: number;
  compatible_usable_capacity_mt: number;
  potential_capacity_gap_mt: number;
  shelf_life_category: 'PERISHABLE' | 'SEMI_PERISHABLE' | 'DURABLE';
  gap_status: 'CRITICAL_DEFICIT' | 'MODERATE_DEFICIT' | 'ADEQUATE' | 'SURPLUS';
  handling_notes: string;
}

interface LossStageItem {
  stage_name: string;
  stage_order: number;
  loss_rate_pct: number;
  quantity_lost_mt: number;
  denominator_definition: string;
  evidence_type: 'MEASURED' | 'REPORTED' | 'ESTIMATED' | 'POTENTIAL_RISK';
  primary_vulnerable_crops: string[];
  documented_causes: string;
  recommended_intervention: string;
}

interface TemporalComparisonItem {
  indicator: string;
  unit: string;
  current_value: number;
  compare_value: number;
  abs_change: number;
  pct_change: string;
  comparability_status: 'COMPARABLE' | 'INDICATIVE' | 'INCOMPATIBLE_FREQUENCY' | 'MODELLED_ESTIMATE';
  notes: string;
}

interface SectorSpatialGapItem {
  sector_id: string;
  sector_name: string;
  major_crops: string[];
  production_mt: number;
  market_surplus_mt: number;
  documented_facilities_count: number;
  nearest_facility_distance_km: number;
  nearest_paved_road_distance_km: number;
  documented_usable_capacity_mt: number;
  estimated_storage_demand_mt: number;
  potential_capacity_gap_mt: number;
  gap_status: 'CRITICAL_DEFICIT' | 'MODERATE_DEFICIT' | 'ADEQUATE' | 'SURPLUS';
  cold_chain_deficit: 'HIGH' | 'MEDIUM' | 'LOW';
  unknown_status_facilities_count: number;
  recommended_action: string;
}

interface PriorityAreaItem {
  rank: number;
  site_name: string;
  sector_name: string;
  priority_tier: 'TIER 1 - URGENT' | 'TIER 2 - HIGH' | 'TIER 3 - MEDIUM';
  focus_crops: string[];
  production_volume_mt: number;
  market_surplus_mt: number;
  nearby_facilities_summary: string;
  available_usable_capacity_mt: number;
  evidence_of_loss: string;
  estimated_gap_mt: number;
  calculation_method: string;
  missing_data_uncertainty: string;
  suggested_next_step: string;
  estimated_budget_rwf: number;
  target_beneficiaries_households: number;
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

export default function DistrictPostHarvestPage() {
  const { districtName: contextDistrict, seasonCode: contextSeason } = useOutletContext<{ 
    districtName?: string; 
    seasonCode?: string; 
  }>() || {};

  // Resolve logged in user and RBAC scope
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

  // Navigation & Filter State
  const [selectedDistrict, setSelectedDistrict] = useState<string>(assignedDistrict);
  const [activeSeason, setActiveSeason] = useState<string>(contextSeason || '2026B');
  const [compareMode, setCompareMode] = useState<string>('same_season_prev_year');
  const [customCompareSeason, setCustomCompareSeason] = useState<string>('');
  
  // 9 Required Tabs:
  // 'overview' | 'inventory' | 'capacity_demand' | 'temporal' | 'losses' | 'spatial_gaps' | 'priority_areas' | 'interventions' | 'data_quality'
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Filters for Facility Inventory Tab
  const [facilitySearch, setFacilitySearch] = useState<string>('');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [cropFilter, setCropFilter] = useState<string>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');

  // Filters for Sector Gaps Tab
  const [gapStatusFilter, setGapStatusFilter] = useState<string>('ALL');

  // Modals
  const [selectedFacilityModal, setSelectedFacilityModal] = useState<FacilityItem | null>(null);
  const [isProposeModalOpen, setIsProposeModalOpen] = useState<boolean>(false);

  // New Intervention Form State
  const [newIntervention, setNewIntervention] = useState({
    title: '',
    sector: '',
    type: 'STORAGE_WAREHOUSE',
    budgetRwf: 45000000,
    targetMetric: '',
    beneficiaries: 1500,
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

  // Fetch Post-Harvest & Storage Intelligence Dossier
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = `http://localhost:3000/api/v1/district/post-harvest?district=${encodeURIComponent(selectedDistrict)}&season=${activeSeason}&compareMode=${compareMode}`;
      if (compareMode === 'custom' && customCompareSeason) {
        url += `&compareSeason=${encodeURIComponent(customCompareSeason)}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to fetch post-harvest intelligence (${res.status})`);
      }
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error loading post-harvest dataset.');
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

  const activeYear = activeSeasonObj?.year || (activeSeason ? parseInt(activeSeason.slice(0, 4), 10) : 2026);
  const activeSeasonLetter = activeSeasonObj?.season_name?.slice(-1) || (activeSeason ? activeSeason.slice(-1) : 'B');

  const handleYearChange = (yr: number) => {
    const targetCode = `${yr}${activeSeasonLetter}`;
    const exists = seasons.some(s => s.season_code === targetCode);
    if (exists) {
      setActiveSeason(targetCode);
    } else {
      const firstInYear = seasons.find(s => s.year === yr);
      setActiveSeason(firstInYear ? firstInYear.season_code : targetCode);
    }
  };

  const handleSeasonLetterChange = (letter: string) => {
    const targetCode = `${activeYear}${letter}`;
    setActiveSeason(targetCode);
  };

  const kpis = data?.summaryKPIs || {};
  const facilities: FacilityItem[] = data?.facilitiesInventory || [];
  const cropComparisons: CropComparisonItem[] = data?.capacityAndDemand?.cropComparisons || [];
  const lossStages: LossStageItem[] = data?.postHarvestLosses?.stages || [];
  const temporalItems: TemporalComparisonItem[] = data?.temporalComparison || [];
  const sectorGaps: SectorSpatialGapItem[] = data?.accessAndSpatialGaps?.sectors || [];
  const priorityAreas: PriorityAreaItem[] = data?.priorityInvestmentAreas || [];
  const interventions: InterventionItem[] = data?.interventionsMonitoring || [];
  const dataQuality = data?.dataCoverageAndQuality || {};

  // Distinct sectors in this district
  const districtSectors = useMemo(() => {
    const s = Array.from(new Set(sectorGaps.map(sg => sg.sector_name))).sort();
    return s.length > 0 ? s : ['Muhoza', 'Busogo', 'Kinigi', 'Cyuve', 'Remera'];
  }, [sectorGaps]);

  // Filtered facilities
  const filteredFacilities = useMemo(() => {
    return facilities.filter(f => {
      const matchesSearch = facilitySearch.trim() === '' || 
        f.name.toLowerCase().includes(facilitySearch.toLowerCase()) ||
        f.facility_code.toLowerCase().includes(facilitySearch.toLowerCase()) ||
        f.sector_name.toLowerCase().includes(facilitySearch.toLowerCase()) ||
        f.operator_name.toLowerCase().includes(facilitySearch.toLowerCase());

      const matchesType = facilityTypeFilter === 'ALL' || f.facility_type === facilityTypeFilter;
      const matchesStatus = statusFilter === 'ALL' || f.operational_status === statusFilter;
      const matchesSector = sectorFilter === 'ALL' || f.sector_name === sectorFilter;
      const matchesCrop = cropFilter === 'ALL' || f.supported_crops.some(c => c.toLowerCase().includes(cropFilter.toLowerCase()));

      return matchesSearch && matchesType && matchesStatus && matchesSector && matchesCrop;
    });
  }, [facilities, facilitySearch, facilityTypeFilter, statusFilter, sectorFilter, cropFilter]);

  // Filtered sector gaps
  const filteredSectorGaps = useMemo(() => {
    return sectorGaps.filter(sg => {
      if (gapStatusFilter === 'ALL') return true;
      return sg.gap_status === gapStatusFilter;
    });
  }, [sectorGaps, gapStatusFilter]);

  // Export CSV Dossier
  const handleExportCSV = () => {
    if (!data) return;
    let csv = `AGRILENS POST-HARVEST & STORAGE INTELLIGENCE DOSSIER\n`;
    csv += `District,${selectedDistrict},Season,${activeSeason},ExportedAt,${new Date().toISOString()}\n\n`;
    
    csv += `SUMMARY KPIS\n`;
    csv += `Documented Facilities,${kpis.documentedFacilitiesCount || 0}\n`;
    csv += `Installed Storage Capacity (MT),${kpis.installedStorageCapacityTonnes || 0}\n`;
    csv += `Usable Storage Capacity (MT),${kpis.usableStorageCapacityTonnes || 0}\n`;
    csv += `Current Occupied Capacity (MT),${kpis.occupiedStorageCapacityTonnes || 0}\n`;
    csv += `Production Requiring Handling (MT),${kpis.productionRequiringHandlingTonnes || 0}\n`;
    csv += `Market Surplus Volume (MT),${kpis.marketSurplusVolumeTonnes || 0}\n`;
    csv += `Estimated Storage Demand (MT),${kpis.estimatedStorageDemandTonnes || 0}\n`;
    csv += `Potential Capacity Gap (MT),${kpis.potentialStorageGapTonnes || 0}\n`;
    csv += `Reported Post-Harvest Loss Rate (%),${kpis.lossRatePct || 0}%\n\n`;

    csv += `FACILITY INVENTORY\n`;
    csv += `Facility Code,Facility Name,Type,Sector,Installed MT,Usable MT,Occupied MT,Utilization %,Status,Operator,Last Verified\n`;
    facilities.forEach(f => {
      csv += `"${f.facility_code}","${f.name}","${f.facility_type}","${f.sector_name}",${f.installed_capacity_tonnes},${f.usable_capacity_tonnes},${f.occupied_capacity_tonnes},${f.utilization_pct}%,"${f.operational_status}","${f.operator_name}","${f.last_verified_at}"\n`;
    });
    csv += `\n`;

    csv += `SECTOR SPATIAL GAPS\n`;
    csv += `Sector,Production MT,Surplus MT,Facilities Count,Distance to Facility km,Usable MT,Demand MT,Gap MT,Status,Cold Chain Deficit\n`;
    sectorGaps.forEach(sg => {
      csv += `"${sg.sector_name}",${sg.production_mt},${sg.market_surplus_mt},${sg.documented_facilities_count},${sg.nearest_facility_distance_km},${sg.documented_usable_capacity_mt},${sg.estimated_storage_demand_mt},${sg.potential_capacity_gap_mt},"${sg.gap_status}","${sg.cold_chain_deficit}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `agrilens_post_harvest_${selectedDistrict}_${activeSeason}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `agrilens_post_harvest_${selectedDistrict}_${activeSeason}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Propose Hub Form
  const handleSubmitIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingIntervention(true);
    setInterventionFeedbackMsg(null);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        title: newIntervention.title || `Post-Harvest Hub Proposal in ${newIntervention.sector || selectedDistrict}`,
        description: newIntervention.justification || 'Construct storage and drying aggregation hub to reduce seasonal post-harvest losses.',
        challenge_area: 'POST_HARVEST',
        priority_level: 'HIGH',
        sector_name: newIntervention.sector || districtSectors[0],
        district_name: selectedDistrict,
        target_metric: newIntervention.targetMetric || '1,000 MT Storage & Modern Drying Facility',
        budget_rwf: Number(newIntervention.budgetRwf),
        target_beneficiaries: Number(newIntervention.beneficiaries),
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0]
      };

      const res = await fetch('http://localhost:3000/api/v1/district/interventions', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setInterventionFeedbackMsg('Storage Hub intervention proposed successfully! Registered for district approval.');
        setTimeout(() => {
          setIsProposeModalOpen(false);
          setInterventionFeedbackMsg(null);
          fetchData();
        }, 1500);
      } else {
        throw new Error('Failed to propose intervention.');
      }
    } catch (e: any) {
      setInterventionFeedbackMsg(e.message || 'Error proposing storage hub.');
    } finally {
      setIsSubmittingIntervention(false);
    }
  };

  // Tab definitions
  const tabs = [
    { id: 'overview', label: '1. Overview', icon: Layers },
    { id: 'inventory', label: '2. Facility Inventory', icon: Warehouse },
    { id: 'capacity_demand', label: '3. Storage Capacity & Demand', icon: Gauge },
    { id: 'temporal', label: '4. Seasonal & Annual Comparison', icon: Calendar },
    { id: 'losses', label: '5. Post-Harvest Losses', icon: ShieldAlert },
    { id: 'spatial_gaps', label: '6. Access & Infrastructure Gaps', icon: MapIcon },
    { id: 'priority_areas', label: '7. Priority Areas', icon: Award },
    { id: 'interventions', label: '8. Interventions & Monitoring', icon: Activity },
    { id: 'data_quality', label: '9. Data Coverage & Quality', icon: FileText }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 print:p-0 print:max-w-none text-slate-800">
      
      {/* 1. TOP HEADER & DISTRICT SCOPE SELECTOR */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:border-none print:shadow-none">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 tracking-wide uppercase">
              Area of Responsibility 4
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {data?.district?.province || 'Province'} • {selectedDistrict} District Scope
            </span>
            {!isNationalUser && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                Authorized District Officer Access Enforced
              </span>
            )}
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Warehouse className="w-8 h-8 text-indigo-700 flex-shrink-0" />
            Post-Harvest, Storage & Preservation Intelligence
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            District collection, storage capacity, drying infrastructure, cold-chain preservation, and empirical post-harvest loss assessment.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          {/* District selector for National / Admin Users */}
          {isNationalUser ? (
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1">Select District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                {ALL_RWANDA_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>{dist} District</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1">Your Jurisdiction</label>
              <div className="bg-slate-100 border border-slate-300 text-slate-800 font-extrabold text-xs rounded-xl px-3.5 py-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                {selectedDistrict}
              </div>
            </div>
          )}

          {/* Year & Season Toggle */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase text-slate-400 mb-1">Reporting Period</label>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 p-1 rounded-xl">
              <select
                value={activeYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
                className="bg-transparent font-bold text-xs text-slate-800 outline-none pr-1"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="h-4 w-px bg-slate-300 mx-1" />
              {(['A', 'B', 'C'] as const).map(letter => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => handleSeasonLetterChange(letter)}
                  className={`px-2 py-0.5 rounded text-xs font-black transition-all ${
                    activeSeasonLetter === letter 
                      ? 'bg-indigo-700 text-white shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          {/* Export Dropdown */}
          <div className="flex items-end gap-2 pt-4 sm:pt-0">
            <button
              onClick={handleExportCSV}
              title="Download District Dossier as CSV"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-all shadow-2xs"
            >
              <Download className="w-4 h-4 text-indigo-700" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              title="Export Raw Payload as JSON"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-all shadow-2xs"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              onClick={() => window.print()}
              title="Print Briefing View"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-all shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
            </button>

            <button
              onClick={() => setIsProposeModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Propose Storage Hub
            </button>
          </div>
        </div>
      </div>

      {/* 2. CORE MANDATED DASHBOARD KPIS (SECTION 1 OF SPECIFICATION) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        
        {/* KPI 1: Documented Facilities */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Documented Facilities
              </span>
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {kpis.documentedFacilitiesCount ?? '—'}
              </span>
              <span className="text-xs font-bold text-slate-500">units</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {kpis.operationalFacilitiesCount || 0} Operational
            </span>
            <span className="text-slate-400">Within {selectedDistrict}</span>
          </div>
        </div>

        {/* KPI 2: Installed Storage Capacity */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Installed Storage Capacity
              </span>
              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                <Warehouse className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {kpis.installedStorageCapacityTonnes ? kpis.installedStorageCapacityTonnes.toLocaleString() : '—'}
              </span>
              <span className="text-xs font-bold text-slate-500">Tonnes</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span>Usable: <strong className="text-slate-800">{kpis.usableStorageCapacityTonnes?.toLocaleString() || 0} MT</strong></span>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold text-[10px]">
              {kpis.storageUtilizationPct || 0}% Utilized
            </span>
          </div>
        </div>

        {/* KPI 3: Production Requiring Handling */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Production Requiring Handling
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {kpis.productionRequiringHandlingTonnes ? kpis.productionRequiringHandlingTonnes.toLocaleString() : '—'}
              </span>
              <span className="text-xs font-bold text-slate-500">Tonnes</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span>Market Surplus: <strong className="text-emerald-700">{kpis.marketSurplusVolumeTonnes?.toLocaleString() || 0} MT</strong></span>
            <span className="text-slate-400">{activeSeason} Harvest</span>
          </div>
        </div>

        {/* KPI 4: Areas for Assessment */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Areas for Assessment
              </span>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-700 tracking-tight">
                {kpis.areasForAssessmentCount ?? '5'}
              </span>
              <span className="text-xs font-bold text-slate-500">candidate sites</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span className="text-amber-800 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Documented Evidence
            </span>
            <span className="text-slate-400">Prioritized</span>
          </div>
        </div>

      </div>

      {/* 3. ESSENTIAL SCIENTIFIC SAFEGUARD BANNER */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-600 p-4 rounded-r-2xl bg-white shadow-xs">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1 text-slate-700 leading-relaxed">
            <span className="font-bold text-amber-950 block text-[13px]">
              Scientific Safeguard Principle: Distinguishing Documented Losses from Estimated Risks
            </span>
            <p>
              A district with limited storage infrastructure may face a potential storage gap, but that alone <strong>does not prove how much produce is being lost</strong>. AgriLens strictly separates observation-backed loss surveys and cooperative records from modelled capacity deficits. Furthermore, not all harvested produce requires long-term storage—substantial volumes are sold immediately at farmgate, consumed locally, or processed directly.
            </p>
          </div>
        </div>
      </div>

      {/* 4. NAVIGATION TABS (9 SECTIONS) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-1.5 overflow-x-auto scrollbar-none print:hidden">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. TAB CONTENT ROUTING */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 border border-slate-200 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-700 animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Loading verified post-harvest dossier for {selectedDistrict}...</p>
        </div>
      ) : errorMsg ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-800 text-xs">
          <div className="flex items-center gap-2 font-bold text-sm mb-1">
            <AlertTriangle className="w-4 h-4" />
            Error Loading Post-Harvest Data
          </div>
          <p>{errorMsg}</p>
        </div>
      ) : (
        <>
          {/* =========================================================
              TAB 1: OVERVIEW (THE 6 QUESTIONS AT A GLANCE)
             ========================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* The 6 Core Strategic Questions Card Matrix */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-indigo-700" />
                      Six Core Post-Harvest Intelligence Questions Answered
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Empowering District Agricultural Officers with actionable, validated evidence for {selectedDistrict}.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                    NISR SAS & MINAGRI Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  {/* Question 1 */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black flex items-center justify-center">1</span>
                        <h3 className="font-bold text-slate-900 text-xs">Crops Harvested & Volumes Handled?</h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Total seasonal harvest of <strong className="text-slate-900">{kpis.totalProductionTonnes?.toLocaleString()} MT</strong>, with <strong className="text-indigo-800">{kpis.productionRequiringHandlingTonnes?.toLocaleString()} MT</strong> requiring immediate post-harvest logistics (marketed surplus + cooperative storage).
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('capacity_demand')}
                      className="mt-3 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 self-start"
                    >
                      View crop volume details <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Question 2 */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black flex items-center justify-center">2</span>
                        <h3 className="font-bold text-slate-900 text-xs">Existing Preservation & Storage Assets?</h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong className="text-slate-900">{facilities.length} documented facilities</strong> comprising collection centres, cooperative warehouses, mechanical grain dryers ({kpis.dryingCapacityTonnesDay || 0} MT/day), and cold storage rooms ({kpis.coldStorageCapacityTonnes || 0} MT).
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('inventory')}
                      className="mt-3 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 self-start"
                    >
                      Inspect facility directory <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Question 3 */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black flex items-center justify-center">3</span>
                        <h3 className="font-bold text-slate-900 text-xs">Installed vs. Actually Usable Capacity?</h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong className="text-slate-900">{kpis.installedStorageCapacityTonnes?.toLocaleString()} MT</strong> installed, with <strong className="text-emerald-700">{kpis.usableStorageCapacityTonnes?.toLocaleString()} MT (100%)</strong> verified as structurally operational and available for seasonal intake.
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('capacity_demand')}
                      className="mt-3 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 self-start"
                    >
                      Compare usable vs occupied <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Question 4 */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black flex items-center justify-center">4</span>
                        <h3 className="font-bold text-slate-900 text-xs">Documented vs. Suspected Losses?</h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Overall reported loss rate of <strong className="text-rose-700">{kpis.lossRatePct}%</strong> ({kpis.documentedLossTonnes?.toLocaleString()} MT), primarily driven by drying delays in rainy windows and storage pests. Clearly segregated from capacity deficits.
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('losses')}
                      className="mt-3 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 self-start"
                    >
                      Examine 6 loss stages <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Question 5 */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black flex items-center justify-center">5</span>
                        <h3 className="font-bold text-slate-900 text-xs">How Have Indicators Changed Over Time?</h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Compared against baseline period ({data?.season?.comparison_label || 'Previous Year'}), storage capacity expanded by <strong className="text-slate-900">+1 facility</strong>, while seasonal production requiring handling grew in line with crop yields.
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('temporal')}
                      className="mt-3 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 self-start"
                    >
                      View temporal changes <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Question 6 */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black flex items-center justify-center">6</span>
                        <h3 className="font-bold text-slate-900 text-xs">Priority Areas for Storage & Interventions?</h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Top ranked candidates include <strong className="text-slate-900">{priorityAreas[0]?.site_name || 'Central Catchment'}</strong> due to high marketable surplus and transit distances to registered warehouses exceeding {kpis.avgDistanceToFacilityKm || 8} km.
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('priority_areas')}
                      className="mt-3 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 self-start"
                    >
                      Review ranked priority list <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                </div>
              </div>

              {/* Graphical Overview: Production vs. Capacity vs. Losses */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Crop Production Requiring Handling vs Usable Capacity */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Major Crop Volumes vs. Compatible Storage Capacity
                      </h3>
                      <p className="text-xs text-slate-500">Metric Tonnes (MT) handled in {activeSeason}</p>
                    </div>
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-100">
                      Disaggregated
                    </span>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cropComparisons} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="crop_name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip 
                          formatter={(val: any) => [`${Number(val).toLocaleString()} MT`]}
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar dataKey="handled_volume_mt" name="Production Requiring Handling" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="estimated_demand_mt" name="Estimated Storage Demand (D)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="compatible_usable_capacity_mt" name="Compatible Usable Capacity (C)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Post-Harvest Loss Breakdown across Value Chain */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Post-Harvest Loss Rates by Value Chain Stage
                      </h3>
                      <p className="text-xs text-slate-500">Percentage lost relative to volume entering defined stage</p>
                    </div>
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-100">
                      Empirical Evidence
                    </span>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={lossStages} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 6]} />
                        <YAxis dataKey="stage_name" type="category" tick={{ fontSize: 10, fill: '#334155' }} width={110} />
                        <Tooltip 
                          formatter={(val: any) => [`${val}% loss rate`]}
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        />
                        <Bar dataKey="loss_rate_pct" name="Stage Loss Rate (%)" fill="#e11d48" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Quick Facility Highlights in District */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-indigo-700" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      Key Documented Facilities in {selectedDistrict}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                  >
                    View All {facilities.length} Facilities <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {facilities.slice(0, 3).map((f) => (
                    <div 
                      key={f.id} 
                      onClick={() => setSelectedFacilityModal(f)}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 uppercase">
                          {f.facility_type.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {f.operational_status}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{f.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Sector: <strong className="text-slate-700">{f.sector_name}</strong></p>
                      
                      <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Storage Capacity:</span>
                        <span className="font-extrabold text-slate-900">{f.installed_capacity_tonnes.toLocaleString()} MT</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* =========================================================
              TAB 2: FACILITY INVENTORY (DETAILED DIRECTORY & INSPECTOR)
             ========================================================= */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              
              {/* Filter & Search Bar */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
                  
                  {/* Search Input */}
                  <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search facility name, code, operator, or sector..."
                      value={facilitySearch}
                      onChange={(e) => setFacilitySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    {facilitySearch && (
                      <button onClick={() => setFacilitySearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Summary of Match Count */}
                  <div className="text-xs text-slate-500 font-medium">
                    Showing <strong className="text-slate-900">{filteredFacilities.length}</strong> of {facilities.length} documented facilities
                  </div>
                </div>

                {/* Filter Selectors Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                  
                  {/* Facility Type Filter */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Facility Category</label>
                    <select
                      value={facilityTypeFilter}
                      onChange={(e) => setFacilityTypeFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="WAREHOUSE">Warehouses & Grain Stores</option>
                      <option value="COLLECTION_CENTER">Collection & Aggregation Centres</option>
                      <option value="GRAIN_DRYER">Drying Facilities & Dryers</option>
                      <option value="DRYING_GROUND">Drying Grounds / Floors</option>
                      <option value="COLD_STORAGE">Cold Rooms & Cold-Chain</option>
                      <option value="SILO">Strategic Silos</option>
                      <option value="PROCESSING_PLANT">Agro-Processing Plants</option>
                    </select>
                  </div>

                  {/* Operational Status Filter */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Operational Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="OPERATIONAL">Operational</option>
                      <option value="PARTIAL">Partially Operational</option>
                      <option value="NON_OPERATIONAL">Non-Operational</option>
                      <option value="UNKNOWN">Status Unknown</option>
                    </select>
                  </div>

                  {/* Sector Filter */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Administrative Sector</label>
                    <select
                      value={sectorFilter}
                      onChange={(e) => setSectorFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ALL">All Sectors</option>
                      {districtSectors.map(sec => (
                        <option key={sec} value={sec}>{sec} Sector</option>
                      ))}
                    </select>
                  </div>

                  {/* Crop Filter */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Supported Crop</label>
                    <select
                      value={cropFilter}
                      onChange={(e) => setCropFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ALL">All Supported Crops</option>
                      <option value="Maize">Maize / Cereals</option>
                      <option value="Beans">Beans / Pulses</option>
                      <option value="Potato">Irish Potato</option>
                      <option value="Rice">Paddy Rice</option>
                      <option value="Vegetable">Horticulture</option>
                      <option value="Cassava">Cassava</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Facility Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFacilities.map((fac) => (
                  <div
                    key={fac.id}
                    onClick={() => setSelectedFacilityModal(fac)}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                          {fac.facility_type.replace('_', ' ')}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          {fac.verification_warning && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-0.5" title="Audit over 12 months ago">
                              <AlertCircle className="w-3 h-3" />
                              Audit Due
                            </span>
                          )}
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            fac.operational_status === 'OPERATIONAL' 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : fac.operational_status === 'PARTIAL'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {fac.operational_status}
                          </span>
                        </div>
                      </div>

                      {/* Name & Code */}
                      <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                        {fac.name}
                      </h3>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Code: {fac.facility_code}
                      </div>

                      {/* Location & Operator */}
                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Location:</span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                            {fac.sector_name} Sector
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Operator:</span>
                          <span className="font-medium text-slate-700 line-clamp-1 max-w-[180px]" title={fac.operator_name}>
                            {fac.operator_name}
                          </span>
                        </div>
                      </div>

                      {/* Capacity Metrics */}
                      <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex justify-between items-baseline">
                          <span className="text-slate-500 font-medium">Storage Capacity:</span>
                          <span className="font-black text-slate-900">{fac.installed_capacity_tonnes.toLocaleString()} MT</span>
                        </div>
                        {fac.usable_capacity_tonnes !== fac.installed_capacity_tonnes && (
                          <div className="flex justify-between items-baseline text-[11px]">
                            <span className="text-amber-700 font-medium">Usable Capacity:</span>
                            <span className="font-bold text-amber-800">{fac.usable_capacity_tonnes.toLocaleString()} MT</span>
                          </div>
                        )}
                        {fac.drying_capacity_tonnes_day > 0 && (
                          <div className="flex justify-between items-baseline text-[11px]">
                            <span className="text-slate-500 font-medium">Drying Rate:</span>
                            <span className="font-bold text-indigo-700">{fac.drying_capacity_tonnes_day} MT/day</span>
                          </div>
                        )}
                        {fac.cold_storage_capacity_tonnes > 0 && (
                          <div className="flex justify-between items-baseline text-[11px]">
                            <span className="text-blue-700 font-medium">Cold Storage:</span>
                            <span className="font-bold text-blue-800">{fac.cold_storage_capacity_tonnes} MT</span>
                          </div>
                        )}
                      </div>

                      {/* Supported Crops */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {fac.supported_crops.map(c => (
                          <span key={c} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Verified: {fac.last_verified_at}</span>
                      <span className="text-indigo-700 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                  </div>
                ))}
              </div>

              {filteredFacilities.length === 0 && (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                  <Warehouse className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No facilities found matching your filter criteria.</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting the category or search keywords.</p>
                  <button
                    onClick={() => {
                      setFacilitySearch('');
                      setFacilityTypeFilter('ALL');
                      setStatusFilter('ALL');
                      setCropFilter('ALL');
                      setSectorFilter('ALL');
                    }}
                    className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                  >
                    Reset Filters
                  </button>
                </div>
              )}

            </div>
          )}

          {/* =========================================================
              TAB 3: STORAGE CAPACITY & DEMAND COMPARISON
             ========================================================= */}
          {activeTab === 'capacity_demand' && (
            <div className="space-y-6">
              
              {/* Formula & Scientific Logic Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Gauge className="w-5 h-5 text-indigo-700" />
                      Storage Capacity & Demand Comparison Model
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Comparing usable compatible storage capacity with estimated seasonal crop storage demand.
                    </p>
                  </div>
                  <div className="px-3.5 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase block">Model Formulation</span>
                    <span className="text-sm font-black text-indigo-950 font-mono">
                      Potential Gap = max(0, D - C)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">D = Estimated Demand</span>
                    <div className="text-2xl font-black text-slate-900">
                      {kpis.estimatedStorageDemandTonnes?.toLocaleString() || 0} <span className="text-xs font-semibold text-slate-500">MT</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Accounts for crop durability, harvest duration, farmgate sales rate, and local household retention.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">C = Usable Compatible Capacity</span>
                    <div className="text-2xl font-black text-emerald-700">
                      {kpis.usableStorageCapacityTonnes?.toLocaleString() || 0} <span className="text-xs font-semibold text-slate-500">MT</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Verified operational capacity in active stores; discounts damaged or non-operational facilities.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Potential Capacity Gap</span>
                    <div className={`text-2xl font-black ${
                      (kpis.potentialStorageGapTonnes || 0) > 0 ? 'text-amber-700' : 'text-emerald-700'
                    }`}>
                      {kpis.potentialStorageGapTonnes ? kpis.potentialStorageGapTonnes.toLocaleString() : 0} <span className="text-xs font-semibold text-slate-500">MT</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      {(kpis.potentialStorageGapTonnes || 0) > 0 
                        ? 'Indicates additional infrastructure requirement needing verification.' 
                        : 'Current usable capacity sufficient to cover seasonal peak demand.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Crop-Specific Capacity & Demand Matrix */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Crop-Specific Demand & Capacity Disaggregation
                    </h3>
                    <p className="text-xs text-slate-500">
                      A grain warehouse cannot automatically be treated as suitable storage for perishable tubers or vegetables.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-extrabold">
                        <th className="pb-3 font-extrabold">Crop Commodity</th>
                        <th className="pb-3 text-right">Production (MT)</th>
                        <th className="pb-3 text-center">Disposition (% Sold / Stored / Consumed)</th>
                        <th className="pb-3 text-right">Estimated Demand D</th>
                        <th className="pb-3 text-right">Usable Capacity C</th>
                        <th className="pb-3 text-right">Potential Gap (MT)</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3">Handling Specifics</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cropComparisons.map((c) => (
                        <tr key={c.crop_name} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 font-bold text-slate-900">
                            <div>{c.crop_name}</div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">{c.shelf_life_category}</span>
                          </td>
                          <td className="py-3 text-right font-extrabold text-slate-800">
                            {c.production_mt.toLocaleString()}
                          </td>
                          <td className="py-3 text-center text-[11px]">
                            <span className="text-emerald-700 font-bold">{c.pct_sold}%</span> / 
                            <span className="text-indigo-700 font-bold mx-1">{c.pct_stored}%</span> / 
                            <span className="text-slate-500">{c.pct_consumed}%</span>
                          </td>
                          <td className="py-3 text-right font-bold text-amber-700">
                            {c.estimated_demand_mt.toLocaleString()} MT
                          </td>
                          <td className="py-3 text-right font-bold text-slate-700">
                            {c.compatible_usable_capacity_mt.toLocaleString()} MT
                          </td>
                          <td className="py-3 text-right font-black text-rose-700">
                            {c.potential_capacity_gap_mt > 0 ? `${c.potential_capacity_gap_mt.toLocaleString()} MT` : '0 MT'}
                          </td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              c.gap_status === 'CRITICAL_DEFICIT' 
                                ? 'bg-rose-100 text-rose-800' 
                                : c.gap_status === 'MODERATE_DEFICIT'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {c.gap_status}
                            </span>
                          </td>
                          <td className="py-3 text-[11px] text-slate-600 max-w-xs leading-relaxed">
                            {c.handling_notes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* =========================================================
              TAB 4: SEASONAL & ANNUAL COMPARISONS
             ========================================================= */}
          {activeTab === 'temporal' && (
            <div className="space-y-6">
              
              {/* Comparison Header & Controls */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-700" />
                      Seasonal & Annual Post-Harvest Indicator Tracking
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Comparing validated records across agricultural seasons. Seasonal statistics are distinguished from annual infrastructure censuses.
                    </p>
                  </div>

                  {/* Comparison Mode Selection */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Compare With:</span>
                    <select
                      value={compareMode}
                      onChange={(e) => setCompareMode(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="same_season_prev_year">Same Season Previous Year ({activeYear - 1}{activeSeasonLetter})</option>
                      <option value="prev_season">Previous Agricultural Season</option>
                      <option value="custom">Custom Season Selection</option>
                    </select>

                    {compareMode === 'custom' && (
                      <select
                        value={customCompareSeason}
                        onChange={(e) => setCustomCompareSeason(e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                      >
                        {seasons.filter(s => s.season_code !== activeSeason).map(s => (
                          <option key={s.season_code} value={s.season_code}>{s.official_label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Comparative Table */}
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-extrabold">
                        <th className="pb-3 font-extrabold">Core Indicator</th>
                        <th className="pb-3 font-extrabold">Unit</th>
                        <th className="pb-3 text-right">Current Period ({data?.season?.active_label || activeSeason})</th>
                        <th className="pb-3 text-right">Comparison Period ({data?.season?.comparison_label || 'Baseline'})</th>
                        <th className="pb-3 text-right">Absolute Change</th>
                        <th className="pb-3 text-right">Relative Change</th>
                        <th className="pb-3 text-center">Comparability</th>
                        <th className="pb-3">Methodology & Source Traceability</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {temporalItems.map((item, idx) => {
                        const isPositive = Number(item.abs_change) > 0;
                        const isZero = Number(item.abs_change) === 0;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 font-bold text-slate-900">{item.indicator}</td>
                            <td className="py-3.5 text-slate-500 font-mono text-[11px]">{item.unit}</td>
                            <td className="py-3.5 text-right font-black text-slate-900">{item.current_value?.toLocaleString()}</td>
                            <td className="py-3.5 text-right font-semibold text-slate-600">{item.compare_value?.toLocaleString()}</td>
                            <td className="py-3.5 text-right font-extrabold">
                              <span className={`inline-flex items-center gap-0.5 ${
                                isZero ? 'text-slate-400' : isPositive ? 'text-emerald-700' : 'text-rose-600'
                              }`}>
                                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : !isZero ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                                {isPositive ? `+${item.abs_change?.toLocaleString()}` : item.abs_change?.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3.5 text-right font-extrabold">
                              <span className={isPositive ? 'text-emerald-700' : !isZero ? 'text-rose-600' : 'text-slate-400'}>
                                {item.pct_change}
                              </span>
                            </td>
                            <td className="py-3.5 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {item.comparability_status}
                              </span>
                            </td>
                            <td className="py-3.5 text-[11px] text-slate-500 max-w-xs leading-relaxed">
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

          {/* =========================================================
              TAB 5: POST-HARVEST LOSSES (6 VALUE CHAIN STAGES)
             ========================================================= */}
          {activeTab === 'losses' && (
            <div className="space-y-6">
              
              {/* Formula & Rule Header */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-600" />
                      Post-Harvest Loss Investigation & Value Chain Mapping
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Distinguishing measured field trials and reported cooperative losses from modelled risks.
                    </p>
                  </div>
                  <div className="px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-rose-600 uppercase block">Standardized Calculation</span>
                    <span className="text-xs font-black text-rose-950 font-mono">
                      Loss Rate (%) = (Quantity Lost / Volume at Stage) × 100
                    </span>
                  </div>
                </div>

                {/* 6 Value Chain Stages Detailed Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                  {lossStages.map((stg) => (
                    <div key={stg.stage_order} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-rose-300 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 text-xs font-black flex items-center justify-center">
                            {stg.stage_order}
                          </span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                            {stg.evidence_type}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm">{stg.stage_name}</h3>
                        
                        <div className="my-2.5 flex items-baseline gap-2">
                          <span className="text-2xl font-black text-rose-700">{stg.loss_rate_pct}%</span>
                          <span className="text-xs text-slate-500 font-semibold">({stg.quantity_lost_mt.toLocaleString()} MT lost)</span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div>
                            <span className="text-slate-400 font-medium">Denominator:</span>{' '}
                            <span className="font-semibold text-slate-700">{stg.denominator_definition}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Primary Causes:</span>{' '}
                            <span className="text-slate-700">{stg.documented_causes}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/80 text-[11px]">
                        <span className="text-indigo-800 font-bold block mb-0.5">Recommended Intervention:</span>
                        <span className="text-slate-700">{stg.recommended_intervention}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* =========================================================
              TAB 6: ACCESS & INFRASTRUCTURE GAPS (SECTOR SPATIAL MATRIX)
             ========================================================= */}
          {activeTab === 'spatial_gaps' && (
            <div className="space-y-6">
              
              {/* Sector-Level Spatial Gap Matrix Header */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <MapIcon className="w-5 h-5 text-indigo-700" />
                      Sector-Level Spatial Gap & Access Assessment
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Comparing crop production catchments with verified nearby storage, feeder road proximity, and cold-chain access.
                    </p>
                  </div>

                  {/* Filter by Gap Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Filter Status:</span>
                    <select
                      value={gapStatusFilter}
                      onChange={(e) => setGapStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ALL">All Gap Statuses ({sectorGaps.length})</option>
                      <option value="CRITICAL_DEFICIT">Critical Deficit</option>
                      <option value="MODERATE_DEFICIT">Moderate Deficit</option>
                      <option value="ADEQUATE">Adequate Coverage</option>
                      <option value="SURPLUS">Surplus Usable Capacity</option>
                    </select>
                  </div>
                </div>

                {/* Table of Sectors */}
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-extrabold">
                        <th className="pb-3 font-extrabold">Sector Name</th>
                        <th className="pb-3 text-right">Production (MT)</th>
                        <th className="pb-3 text-right">Market Surplus</th>
                        <th className="pb-3 text-center">Documented Facilities</th>
                        <th className="pb-3 text-right">Distance to Facility</th>
                        <th className="pb-3 text-right">Distance to Paved Road</th>
                        <th className="pb-3 text-right">Usable Capacity C</th>
                        <th className="pb-3 text-right">Demand D</th>
                        <th className="pb-3 text-right">Potential Gap</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3">Recommended Next Step</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSectorGaps.map((sg) => (
                        <tr key={sg.sector_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 font-bold text-slate-900">
                            <div>{sg.sector_name}</div>
                            <span className="text-[10px] text-slate-400">{sg.major_crops.join(', ')}</span>
                          </td>
                          <td className="py-3 text-right font-extrabold text-slate-800">{sg.production_mt.toLocaleString()} MT</td>
                          <td className="py-3 text-right font-semibold text-emerald-700">{sg.market_surplus_mt.toLocaleString()} MT</td>
                          <td className="py-3 text-center font-bold">
                            {sg.documented_facilities_count > 0 ? (
                              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-extrabold">
                                {sg.documented_facilities_count}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-extrabold">0</span>
                            )}
                          </td>
                          <td className="py-3 text-right text-slate-700 font-mono">{sg.nearest_facility_distance_km} km</td>
                          <td className="py-3 text-right text-slate-700 font-mono">{sg.nearest_paved_road_distance_km} km</td>
                          <td className="py-3 text-right font-bold text-slate-800">{sg.documented_usable_capacity_mt.toLocaleString()} MT</td>
                          <td className="py-3 text-right font-bold text-amber-700">{sg.estimated_storage_demand_mt.toLocaleString()} MT</td>
                          <td className="py-3 text-right font-black text-rose-700">
                            {sg.potential_capacity_gap_mt > 0 ? `${sg.potential_capacity_gap_mt.toLocaleString()} MT` : '0 MT'}
                          </td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              sg.gap_status === 'CRITICAL_DEFICIT'
                                ? 'bg-rose-100 text-rose-800'
                                : sg.gap_status === 'MODERATE_DEFICIT'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {sg.gap_status}
                            </span>
                          </td>
                          <td className="py-3 text-[11px] text-slate-600 max-w-xs leading-relaxed">
                            {sg.recommended_action}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* =========================================================
              TAB 7: PRIORITY AREAS (EXPLAINABLE CANDIDATE RANKING)
             ========================================================= */}
          {activeTab === 'priority_areas' && (
            <div className="space-y-6">
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Award className="w-5 h-5 text-indigo-700" />
                      Prioritized Candidate Areas for Post-Harvest Assessment
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Explainable ranking based on verified surplus, usable capacity constraints, and transport haulage distances.
                    </p>
                  </div>
                  <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Transparent Justification Applied
                  </span>
                </div>

                <div className="space-y-4 mt-5">
                  {priorityAreas.map((item) => (
                    <div 
                      key={item.rank}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-indigo-400 hover:shadow-xs transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center ${
                            item.rank === 1 ? 'bg-rose-600 text-white shadow-xs' : 'bg-indigo-700 text-white'
                          }`}>
                            #{item.rank}
                          </span>
                          <h3 className="font-bold text-slate-900 text-base">{item.site_name}</h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700">
                            {item.sector_name} Sector
                          </span>
                        </div>
                        
                        <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full self-start sm:self-auto ${
                          item.priority_tier.includes('TIER 1') 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {item.priority_tier}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-white border border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Focus Crops</span>
                          <span className="font-bold text-slate-800">{item.focus_crops.join(', ')}</span>
                          <span className="text-slate-500 text-[11px] block mt-0.5">Vol: {item.production_volume_mt.toLocaleString()} MT</span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Calculated Gap</span>
                          <span className="font-black text-rose-700">{item.estimated_gap_mt.toLocaleString()} MT</span>
                          <span className="text-slate-500 text-[11px] block mt-0.5">Surplus: {item.market_surplus_mt.toLocaleString()} MT</span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Estimated Capex & Scope</span>
                          <span className="font-bold text-indigo-700">{(item.estimated_budget_rwf / 1000000).toFixed(0)}M RWF</span>
                          <span className="text-slate-500 text-[11px] block mt-0.5">{item.target_beneficiaries_households.toLocaleString()} farmer HHs</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
                        <div>
                          <strong className="text-slate-800">Evidence Basis:</strong> {item.evidence_of_loss}
                        </div>
                        <div>
                          <strong className="text-slate-800">Calculation Method:</strong> {item.calculation_method}
                        </div>
                        <div className="text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-100">
                          <strong>Missing Data & Uncertainty:</strong> {item.missing_data_uncertainty}
                        </div>
                        <div className="text-indigo-900 bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100 font-medium">
                          <strong>Suggested Next Step:</strong> {item.suggested_next_step}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* =========================================================
              TAB 8: INTERVENTIONS & MONITORING
             ========================================================= */}
          {activeTab === 'interventions' && (
            <div className="space-y-6">
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-700" />
                      Post-Harvest & Storage Interventions Portfolio
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Track planned, implemented, and verified storage infrastructure and loss-reduction programs in {selectedDistrict}.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsProposeModalOpen(true)}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Propose Storage Hub
                  </button>
                </div>

                <div className="space-y-3.5 mt-5">
                  {interventions.map((inv) => (
                    <div key={inv.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            inv.status === 'IN_PROGRESS' 
                              ? 'bg-blue-100 text-blue-800' 
                              : inv.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.status}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">{inv.sector_name} Sector</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">{inv.priority_level} PRIORITY</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{inv.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{inv.description}</p>
                        
                        <div className="pt-1.5 flex flex-wrap gap-x-4 text-[11px] text-slate-500">
                          <span>Target: <strong className="text-slate-800">{inv.target_metric}</strong></span>
                          <span>Budget: <strong className="text-indigo-700">{(inv.budget_rwf / 1000000).toFixed(1)}M RWF</strong></span>
                          <span>Beneficiaries: <strong className="text-slate-800">{inv.target_beneficiaries?.toLocaleString()} HHs</strong></span>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-slate-400 flex flex-col justify-between sm:items-end flex-shrink-0">
                        <span>Timeline: {inv.start_date} → {inv.end_date}</span>
                        <span className="text-indigo-700 font-bold">Led by: {inv.created_by_name || 'MINAGRI'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* =========================================================
              TAB 9: DATA COVERAGE & QUALITY ASSURANCE
             ========================================================= */}
          {activeTab === 'data_quality' && (
            <div className="space-y-6">
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-700" />
                    Data Provenance, Quality Assurance & Methodology Traceability
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ensuring complete auditability, verifiable sources, and scientific precision for all metrics.
                  </p>
                </div>

                {/* Primary Sources */}
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Validated Primary Sources</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(dataQuality.primarySources || []).map((src: string, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700 font-medium leading-relaxed">{src}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Capacity Unit Definitions */}
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Standardized Capacity Metrics & Unit Definitions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl border border-slate-200">
                      <strong className="text-slate-900 block mb-1">Installed Capacity (MT)</strong>
                      <p className="text-slate-600">{dataQuality.capacityUnitDefinitions?.installedCapacity}</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200">
                      <strong className="text-slate-900 block mb-1">Usable Capacity (MT)</strong>
                      <p className="text-slate-600">{dataQuality.capacityUnitDefinitions?.usableCapacity}</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200">
                      <strong className="text-slate-900 block mb-1">Occupied Capacity (MT)</strong>
                      <p className="text-slate-600">{dataQuality.capacityUnitDefinitions?.occupiedCapacity}</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200">
                      <strong className="text-slate-900 block mb-1">Processing Throughput (MT/day)</strong>
                      <p className="text-slate-600">{dataQuality.capacityUnitDefinitions?.throughput}</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200">
                      <strong className="text-slate-900 block mb-1">Estimated Demand D (MT)</strong>
                      <p className="text-slate-600">{dataQuality.capacityUnitDefinitions?.estimatedDemand}</p>
                    </div>
                  </div>
                </div>

                {/* Core Safeguards */}
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-2">
                  <span className="font-bold text-amber-950 block text-[13px]">Strict Platform Rules & Safeguards</span>
                  {(dataQuality.safeguards || []).map((s: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-amber-900">
                      <span className="font-black text-amber-700">•</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}
        </>
      )}

      {/* 6. FACILITY INSPECTION MODAL */}
      {selectedFacilityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 uppercase">
                    {selectedFacilityModal.facility_type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {selectedFacilityModal.facility_code}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900">{selectedFacilityModal.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Located in <strong className="text-slate-800">{selectedFacilityModal.sector_name} Sector</strong>, {selectedFacilityModal.district_name} District
                </p>
              </div>

              <button
                onClick={() => setSelectedFacilityModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Capacity & Operational Status Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Installed Capacity</span>
                <span className="text-lg font-black text-slate-900">{selectedFacilityModal.installed_capacity_tonnes.toLocaleString()} MT</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Usable Capacity</span>
                <span className="text-lg font-black text-emerald-700">{selectedFacilityModal.usable_capacity_tonnes.toLocaleString()} MT</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Occupied</span>
                <span className="text-lg font-black text-indigo-700">{selectedFacilityModal.occupied_capacity_tonnes.toLocaleString()} MT</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Utilization</span>
                <span className="text-lg font-black text-slate-900">{selectedFacilityModal.utilization_pct}%</span>
              </div>
            </div>

            {/* Throughput and Preservation Rates */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                <span className="text-slate-500">Mechanical Drying Capacity:</span>
                <strong className="text-slate-900">{selectedFacilityModal.drying_capacity_tonnes_day} MT/day</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                <span className="text-slate-500">Cold Chain Storage:</span>
                <strong className="text-blue-800">{selectedFacilityModal.cold_storage_capacity_tonnes} MT</strong>
              </div>
            </div>

            {/* Facility Details */}
            <div className="space-y-2 text-xs text-slate-600 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-slate-400">Operational Status:</span>
                <span className="font-bold text-slate-900">{selectedFacilityModal.operational_status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-slate-400">Operator & Management:</span>
                <span className="font-semibold text-slate-900">{selectedFacilityModal.operator_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-slate-400">Ownership Model:</span>
                <span className="font-semibold text-slate-900">{selectedFacilityModal.owner_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-slate-400">Supported Commodities:</span>
                <span className="font-bold text-indigo-700">{Array.isArray(selectedFacilityModal.supported_crops) ? selectedFacilityModal.supported_crops.join(', ') : 'Multi-Commodity'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-slate-400">Coordinates (GPS):</span>
                <span className="font-mono text-slate-800">
                  {selectedFacilityModal.coordinates && selectedFacilityModal.coordinates[0] != null && selectedFacilityModal.coordinates[1] != null
                    ? `${Number(selectedFacilityModal.coordinates[0]).toFixed(4)}, ${Number(selectedFacilityModal.coordinates[1]).toFixed(4)}`
                    : 'Location Verified by District Office'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Last Verification Date:</span>
                <span className="font-semibold text-slate-900">{selectedFacilityModal.last_verified_at || '2025-10-15'}</span>
              </div>
            </div>

            {/* Verification Date Alert Notice */}
            {selectedFacilityModal.verification_warning && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Verification Warning:</strong> This facility was last verified over 12 months ago. An on-site operational inspection is recommended before counting its full rated capacity towards peak harvest logistics.
                </span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedFacilityModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 7. PROPOSE STORAGE HUB MODAL */}
      {isProposeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-700" />
                <h3 className="text-lg font-bold text-slate-900">Propose New Post-Harvest Facility</h3>
              </div>
              <button onClick={() => setIsProposeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitIntervention} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Facility Proposal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern Community Grain Drying Floor & Hermetic Store"
                  value={newIntervention.title}
                  onChange={(e) => setNewIntervention({ ...newIntervention, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Sector</label>
                  <select
                    value={newIntervention.sector}
                    onChange={(e) => setNewIntervention({ ...newIntervention, sector: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    {districtSectors.map(s => (
                      <option key={s} value={s}>{s} Sector</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Facility Type</label>
                  <select
                    value={newIntervention.type}
                    onChange={(e) => setNewIntervention({ ...newIntervention, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="STORAGE_WAREHOUSE">Grain Warehouse (1,000 MT)</option>
                    <option value="COLLECTION_HUB">Agricultural Aggregation Hub</option>
                    <option value="DRYING_FLOOR">Community Drying Ground</option>
                    <option value="COLD_ROOM">Solar Cold Preservation Room</option>
                    <option value="HERMETIC_BAGS">PICS Hermetic Bags Distribution</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Estimated Budget (RWF)</label>
                  <input
                    type="number"
                    value={newIntervention.budgetRwf}
                    onChange={(e) => setNewIntervention({ ...newIntervention, budgetRwf: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Beneficiary HHs</label>
                  <input
                    type="number"
                    value={newIntervention.beneficiaries}
                    onChange={(e) => setNewIntervention({ ...newIntervention, beneficiaries: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Metric & Deliverable</label>
                <input
                  type="text"
                  placeholder="e.g. 800m² concrete floor with 500 MT ventilated storage"
                  value={newIntervention.targetMetric}
                  onChange={(e) => setNewIntervention({ ...newIntervention, targetMetric: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Empirical Justification & Evidence Basis</label>
                <textarea
                  rows={3}
                  placeholder="Explain why this sector requires this facility (e.g. high surplus volume, lack of nearby storage, reported mould losses)..."
                  value={newIntervention.justification}
                  onChange={(e) => setNewIntervention({ ...newIntervention, justification: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none resize-none"
                />
              </div>

              {interventionFeedbackMsg && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  interventionFeedbackMsg.includes('success') 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {interventionFeedbackMsg}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProposeModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIntervention}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {isSubmittingIntervention ? 'Submitting...' : 'Submit Proposal to MINAGRI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
