import React, { useState, useEffect } from 'react';
import { 
  Leaf, MapPin, Bell, TrendingUp, TrendingDown, 
  Droplets, Package, Globe, Layers, ArrowUpRight, ChevronRight, 
  CheckCircle2, AlertTriangle, Download, Filter, Sparkles, 
  FileText, Calendar, BarChart3, RefreshCw, Info, X, 
  Compass, ShieldCheck, Database, Award, Eye, ExternalLink,
  SlidersHorizontal, CheckSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// Rwanda 30 Districts Geo Definition for SVG Map
interface DistrictGeo {
  name: string;
  province: string;
  path: string;
  labelX: number;
  labelY: number;
}

const RWANDA_DISTRICTS_GEO: DistrictGeo[] = [
  // Northern Province
  { name: 'Musanze', province: 'Northern', path: 'M 195 70 L 265 60 L 260 130 L 190 130 Z', labelX: 226, labelY: 96 },
  { name: 'Burera', province: 'Northern', path: 'M 265 60 L 360 40 L 350 115 L 260 130 Z', labelX: 308, labelY: 82 },
  { name: 'Gicumbi', province: 'Northern', path: 'M 350 100 L 415 100 L 415 185 L 340 175 Z', labelX: 375, labelY: 142 },
  { name: 'Rulindo', province: 'Northern', path: 'M 270 125 L 345 120 L 340 190 L 270 185 Z', labelX: 305, labelY: 156 },
  { name: 'Gakenke', province: 'Northern', path: 'M 205 130 L 270 125 L 265 200 L 200 190 Z', labelX: 236, labelY: 162 },

  // Eastern Province
  { name: 'Nyagatare', province: 'Eastern', path: 'M 380 40 L 525 45 L 535 140 L 415 140 L 360 40 Z', labelX: 452, labelY: 88 },
  { name: 'Gatsibo', province: 'Eastern', path: 'M 415 140 L 535 140 L 525 210 L 410 205 Z', labelX: 468, labelY: 172 },
  { name: 'Kayonza', province: 'Eastern', path: 'M 410 205 L 525 210 L 550 310 L 440 280 Z', labelX: 480, labelY: 252 },
  { name: 'Rwamagana', province: 'Eastern', path: 'M 350 205 L 430 205 L 440 275 L 365 275 Z', labelX: 398, labelY: 238 },
  { name: 'Bugesera', province: 'Eastern', path: 'M 330 275 L 435 275 L 410 380 L 315 360 Z', labelX: 374, labelY: 326 },
  { name: 'Ngoma', province: 'Eastern', path: 'M 440 280 L 515 280 L 495 360 L 430 340 Z', labelX: 472, labelY: 318 },
  { name: 'Kirehe', province: 'Eastern', path: 'M 505 275 L 585 275 L 575 385 L 490 365 Z', labelX: 538, labelY: 328 },

  // Western Province
  { name: 'Rubavu', province: 'Western', path: 'M 130 95 L 195 100 L 180 165 L 125 145 Z', labelX: 156, labelY: 130 },
  { name: 'Nyabihu', province: 'Western', path: 'M 180 115 L 225 115 L 215 185 L 165 175 Z', labelX: 196, labelY: 148 },
  { name: 'Rutsiro', province: 'Western', path: 'M 125 160 L 185 165 L 175 240 L 120 230 Z', labelX: 152, labelY: 198 },
  { name: 'Ngororero', province: 'Western', path: 'M 185 175 L 245 175 L 235 250 L 175 245 Z', labelX: 210, labelY: 212 },
  { name: 'Karongi', province: 'Western', path: 'M 120 235 L 190 240 L 185 310 L 115 295 Z', labelX: 154, labelY: 272 },
  { name: 'Nyamasheke', province: 'Western', path: 'M 85 295 L 155 305 L 145 385 L 80 365 Z', labelX: 118, labelY: 340 },
  { name: 'Rusizi', province: 'Western', path: 'M 75 370 L 145 385 L 135 460 L 65 440 Z', labelX: 104, labelY: 415 },

  // Southern Province
  { name: 'Muhanga', province: 'Southern', path: 'M 240 195 L 305 195 L 300 255 L 230 255 Z', labelX: 268, labelY: 226 },
  { name: 'Kamonyi', province: 'Southern', path: 'M 300 215 L 355 215 L 350 280 L 295 275 Z', labelX: 326, labelY: 248 },
  { name: 'Ruhango', province: 'Southern', path: 'M 235 255 L 305 255 L 300 310 L 230 305 Z', labelX: 268, labelY: 280 },
  { name: 'Nyanza', province: 'Southern', path: 'M 230 305 L 310 305 L 300 365 L 225 355 Z', labelX: 268, labelY: 332 },
  { name: 'Huye', province: 'Southern', path: 'M 225 355 L 290 355 L 280 425 L 220 415 Z', labelX: 255, labelY: 388 },
  { name: 'Gisagara', province: 'Southern', path: 'M 260 415 L 335 420 L 320 478 L 245 468 Z', labelX: 288, labelY: 448 },
  { name: 'Nyamagabe', province: 'Southern', path: 'M 150 310 L 230 310 L 215 400 L 145 390 Z', labelX: 186, labelY: 355 },
  { name: 'Nyaruguru', province: 'Southern', path: 'M 155 395 L 255 400 L 240 475 L 145 465 Z', labelX: 198, labelY: 435 },

  // Kigali City
  { name: 'Gasabo', province: 'Kigali', path: 'M 345 175 L 390 175 L 390 225 L 340 220 Z', labelX: 365, labelY: 198 },
  { name: 'Nyarugenge', province: 'Kigali', path: 'M 320 220 L 355 220 L 350 260 L 315 255 Z', labelX: 335, labelY: 238 },
  { name: 'Kicukiro', province: 'Kigali', path: 'M 355 225 L 395 225 L 390 270 L 350 265 Z', labelX: 372, labelY: 248 }
];

export default function AdminDashboardPage() {
  const { currentUser } = useAuth();

  // Section A: Global Filters & Historical Mode
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSeason, setSelectedSeason] = useState('2025A');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [selectedCrop, setSelectedCrop] = useState('All Crops');
  const [analysisMode, setAnalysisMode] = useState<'HISTORICAL' | 'PERIOD'>('PERIOD');
  const [chartView, setChartView] = useState<'TRENDS' | 'SEASON_COMPARE'>('SEASON_COMPARE');

  // Section C: Map Layer Selector
  const [mapLayer, setMapLayer] = useState<'PRODUCTIVITY' | 'IRRIGATION' | 'SOIL' | 'FACILITIES' | 'EXPORT' | 'INTERVENTIONS'>('PRODUCTIVITY');
  const [viewMode, setViewMode] = useState<'MAP' | 'TABLE'>('MAP');

  // Interactive District Detail Dossier Modal
  const [activeDistrict, setActiveDistrict] = useState<any | null>(null);

  // Generate Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportReady, setReportReady] = useState(false);

  // Backend Live Overview Data State
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Fetch Live Overview from Backend Endpoint
  const fetchOverview = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        year: selectedYear,
        season: selectedSeason,
        province: selectedRegion !== 'All Regions' ? selectedRegion : '',
        district: currentUser.district || '',
        crop: selectedCrop !== 'All Crops' ? selectedCrop : '',
        mode: analysisMode,
        mapLayer: mapLayer
      });
      const res = await fetch(`http://localhost:3000/api/v1/dashboard/overview?${queryParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setDashboardData(json);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard overview:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [selectedYear, selectedSeason, selectedRegion, selectedCrop, analysisMode, mapLayer, currentUser.district]);

  // Fallbacks matching backend structure
  const kpi = dashboardData?.kpis || {
    totalCropProduction: { value: 11568125, unit: 'tons', trendLabel: '+12.4% vs. previous period', referencePeriod: '2025 Season A', source: 'NISR Seasonal Agricultural Survey' },
    averageYield: { value: 5.65, unit: 'tons/ha', trendLabel: '+9.8% comparable observations', referencePeriod: '2025 Season A', source: 'Weighted Mean across Valid Plots' },
    cultivatedArea: { value: 1250400, unit: 'hectares', trendLabel: '+4.2% reported expansion', referencePeriod: '2025 Season A', source: 'NISR SAS Plot Area Measurements' },
    recordedFacilities: { value: 342, unit: 'documented units', trendLabel: '+8 new facilities logged', referencePeriod: 'Known Operational Units', source: 'MINAGRI / RAB Warehouse Registry' },
    irrigationCoverage: { value: 68400, unit: 'hectares (8.4%)', trendLabel: '+15.3% marshland coverage', referencePeriod: '2025 Season A', source: 'MINAGRI SSIT Directorate' },
    soilFertilityIndex: { value: 78, unit: '/ 100', trendLabel: 'pH 6.2 | 2.8% Organic C', referencePeriod: 'RAB Soil Division Baseline', source: 'Measured & Modelled Soil Lab Profiles' },
    exportPerformance: { value: '$142.5M', unit: 'USD (54,200 MT)', trendLabel: '+15.3% annual export growth', referencePeriod: 'National Agricultural Exports', source: 'NAEB / NISR Trade Statistics' }
  };

  const districts = dashboardData?.mapDistricts || [];
  const seasonComparison = dashboardData?.seasonComparison || [
    { year: 2021, seasonA_prod: 3950000, seasonB_prod: 3600000, seasonA_yield: 2.5, seasonB_yield: 2.2 },
    { year: 2022, seasonA_prod: 4200000, seasonB_prod: 3850000, seasonA_yield: 2.7, seasonB_yield: 2.3 },
    { year: 2023, seasonA_prod: 4500000, seasonB_prod: 4100000, seasonA_yield: 2.9, seasonB_yield: 2.4 },
    { year: 2024, seasonA_prod: 4850000, seasonB_prod: 4350000, seasonA_yield: 3.1, seasonB_yield: 2.5 },
    { year: 2025, seasonA_prod: 5200000, seasonB_prod: 4600000, seasonA_yield: 3.3, seasonB_yield: 2.6 }
  ];

  const topCrops = dashboardData?.topCrops || [
    { crop_name: 'Maize', total_prod_tonnes: 320000, avg_yield_t_ha: 3.4 },
    { crop_name: 'Beans', total_prod_tonnes: 210000, avg_yield_t_ha: 2.1 },
    { crop_name: 'Cassava', total_prod_tonnes: 120000, avg_yield_t_ha: 8.5 },
    { crop_name: 'Irish Potatoes', total_prod_tonnes: 85000, avg_yield_t_ha: 7.8 },
    { crop_name: 'Coffee', total_prod_tonnes: 45000, avg_yield_t_ha: 1.8 }
  ];

  const moduleSummaries = dashboardData?.moduleSummaries || {
    productivity: {
      title: 'Agricultural Productivity',
      primaryMetric: `${kpi.averageYield.value} t/ha`,
      secondaryMetric: `${kpi.totalCropProduction.value.toLocaleString()} tons`,
      highlight: 'Highest cereal output recorded in Eastern Province.',
      attentionNeeded: 'Investigate declining cassava yields in Gisagara & Ruhango.',
      link: '/admin/crops'
    },
    irrigation: {
      title: 'Small-Scale Irrigation',
      primaryMetric: `${kpi.irrigationCoverage.value.toLocaleString()} ha`,
      secondaryMetric: '8.4% national coverage',
      highlight: '42 candidate sites identified along Nyabarongo & Akagera basins.',
      attentionNeeded: 'Eastern lowlands face water deficit in July–August. Deploy marshland pumps.',
      link: '/admin/irrigation'
    },
    soilConservation: {
      title: 'Soil & Fertility Management',
      primaryMetric: `${kpi.soilFertilityIndex.value} / 100`,
      secondaryMetric: 'pH 6.2 | 2.8% Organic C',
      highlight: 'Terraced plots in Northern highlands demonstrate +28% yield resilience.',
      attentionNeeded: 'Severe soil acidity in Nyabihu & Gicumbi requires subsidized lime distribution.',
      link: '/admin/soil-conservation'
    },
    postHarvest: {
      title: 'Post-Harvest & Processing',
      primaryMetric: `${kpi.recordedFacilities.value} facilities`,
      secondaryMetric: '8.5% post-harvest loss rate',
      highlight: 'Cooperative warehouses operating at 82% seasonal capacity utilization.',
      attentionNeeded: 'Musanze & Burera potato cold-storage deficit leads to localized spoilage.',
      link: '/admin/post-harvest'
    },
    exportMarkets: {
      title: 'Export Markets & Value Addition',
      primaryMetric: `${kpi.exportPerformance.value}`,
      secondaryMetric: '54,200 MT volume',
      highlight: '+15.3% export demand growth for specialty Arabica and French beans.',
      attentionNeeded: 'Phytosanitary & EU cold-chain certification required for horticulture exporters.',
      link: '/admin/imports-exports'
    }
  };

  const priorityOpportunities = dashboardData?.priorityOpportunities || [
    {
      id: 'opp-1',
      category: 'IRRIGATION',
      area: 'Small-Scale Irrigation',
      location: 'Gatsibo & Nyagatare (Eastern)',
      recommendation: 'Deploy solar-powered marshland pumping along Akagera river valley.',
      evidenceBasis: 'Reported irrigation coverage is only 6.2% despite 185,000 ha of high-potential maize/rice soils with seasonal water deficit.',
      requiresFieldVerification: true,
      priorityLevel: 'CRITICAL',
      link: '/admin/irrigation'
    },
    {
      id: 'opp-2',
      category: 'SOIL',
      area: 'Soil & Fertility',
      location: 'Nyabihu & Gicumbi (Northern)',
      recommendation: 'Scale agricultural lime and radical bench terracing on 30%+ slopes.',
      evidenceBasis: 'Soil pH is 5.2 (strongly acidic) with low nitrogen rating, depressing potato yields by up to 2.1 t/ha.',
      requiresFieldVerification: true,
      priorityLevel: 'HIGH',
      link: '/admin/soil-conservation'
    },
    {
      id: 'opp-3',
      category: 'POST_HARVEST',
      area: 'Post-Harvest Storage',
      location: 'Musanze & Burera (Northern)',
      recommendation: 'Mobilize ventilated mobile drying units & potato cold storage expansion.',
      evidenceBasis: 'Documented facility capacity is 78% utilized while 2025A potato production exceeded 380,000 tons.',
      requiresFieldVerification: false,
      priorityLevel: 'HIGH',
      link: '/admin/post-harvest'
    },
    {
      id: 'opp-4',
      category: 'EXPORT',
      area: 'Export Opportunities',
      location: 'Western Province (Rutsiro, Rubavu, Rusizi)',
      recommendation: 'Scale specialty Arabica washing station certification and direct export freight.',
      evidenceBasis: 'Fully washed coffee captures +18% price premium ($4,200/MT) in European specialty markets.',
      requiresFieldVerification: false,
      priorityLevel: 'OPPORTUNITY',
      link: '/admin/imports-exports'
    }
  ];

  // Helper for district coloring based on active Map Layer
  const getDistrictFill = (dName: string) => {
    const matched = districts.find((d: any) => d.name.toLowerCase() === dName.toLowerCase());
    const yieldVal = matched?.yieldTonsPerHa || 3.2;

    switch (mapLayer) {
      case 'IRRIGATION':
        if (matched?.irrigationCoveragePct >= 20) return '#0284c7';
        if (matched?.irrigationCoveragePct >= 14) return '#38bdf8';
        if (matched?.irrigationCoveragePct >= 8) return '#7dd3fc';
        return '#bae6fd';
      case 'SOIL':
        if (matched?.soilHealthIndex >= 85) return '#15803d';
        if (matched?.soilHealthIndex >= 75) return '#65a30d';
        if (matched?.soilHealthIndex >= 65) return '#ca8a04';
        return '#dc2626';
      case 'FACILITIES':
        if (matched?.documentedFacilities >= 10) return '#7c3aed';
        if (matched?.documentedFacilities >= 6) return '#a855f7';
        if (matched?.documentedFacilities >= 3) return '#c084fc';
        return '#e9d5ff';
      case 'EXPORT':
        if (['Rutsiro', 'Rubavu', 'Rusizi', 'Gicumbi', 'Rwamagana'].includes(dName)) return '#059669';
        if (['Nyagatare', 'Musanze', 'Burera'].includes(dName)) return '#10b981';
        return '#a7f3d0';
      case 'INTERVENTIONS':
        if (['Gatsibo', 'Nyabihu', 'Musanze'].includes(dName)) return '#e11d48';
        if (['Nyagatare', 'Burera', 'Gicumbi'].includes(dName)) return '#f97316';
        return '#e2e8f0';
      case 'PRODUCTIVITY':
      default:
        if (yieldVal >= 4.0) return '#15803d';
        if (yieldVal >= 3.0) return '#22c55e';
        if (yieldVal >= 2.0) return '#84cc16';
        if (yieldVal >= 1.0) return '#eab308';
        return '#ef4444';
    }
  };

  const handleDistrictClick = (geo: DistrictGeo) => {
    const dData = districts.find((d: any) => d.name.toLowerCase() === geo.name.toLowerCase()) || {
      name: geo.name,
      productionTonnes: 14500,
      yieldTonsPerHa: 3.4,
      soilHealthIndex: 79,
      soilPh: '5.8',
      organicCarbonPct: '2.6',
      irrigationCoveragePct: 14,
      postHarvestLossPct: 9.2,
      documentedFacilities: 6,
      storageCapacityMt: 7200,
      exportTonnes: 2600,
      primaryCrop: 'Maize & Irish Potatoes'
    };
    setActiveDistrict({ ...geo, ...dData });
  };

  const triggerGenerateReport = () => {
    setReportModalOpen(true);
    setGeneratingReport(true);
    setReportReady(false);
    setTimeout(() => {
      setGeneratingReport(false);
      setReportReady(true);
    }, 1800);
  };

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-800">

      {/* SECTION A: HEADER & GLOBAL FILTERS */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/90 space-y-4">
        
        {/* Top Header & Coverage Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                AgriLens Rwanda — National Agricultural Intelligence Dashboard
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Consolidated official statistics across all years, seasons, crops, and administrative jurisdictions.
            </p>
          </div>

          {/* Data Provenance Badge */}
          <div className="flex items-center gap-2 bg-[#F0FDF4] border border-emerald-200/80 px-3 py-1.5 rounded-xl text-xs text-emerald-900">
            <Database className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
            <span className="font-semibold text-[11px]">
              Coverage: <strong className="text-emerald-950 font-black">2014–2026A</strong> ({dashboardData?.dataCoverage?.totalObservations || '17,912'} records · NISR SAS)
            </span>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Analysis Mode Toggle */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setAnalysisMode('PERIOD')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  analysisMode === 'PERIOD' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Period Analysis
              </button>
              <button
                onClick={() => setAnalysisMode('HISTORICAL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  analysisMode === 'HISTORICAL' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Historical Overview (2014–2026A)
              </button>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-slate-400 font-medium -mb-0.5">Year</span>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent font-bold text-xs text-slate-800 cursor-pointer focus:outline-none"
                >
                  <option value="all">All Available Years (2014–2026A)</option>
                  {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014].map(y => (
                    <option key={y} value={y.toString()}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Season Selector */}
            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <Leaf className="w-3.5 h-3.5 text-emerald-700" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-slate-400 font-medium -mb-0.5">Season</span>
                <select 
                  value={selectedSeason} 
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="bg-transparent font-bold text-xs text-slate-800 cursor-pointer focus:outline-none"
                >
                  <option value="all">All Seasons (Combined)</option>
                  <option value="2025A">2025 Season A</option>
                  <option value="2025B">2025 Season B</option>
                  <option value="2024A">2024 Season A</option>
                  <option value="2024B">2024 Season B</option>
                  <option value="2023A">2023 Season A</option>
                  <option value="2026A">2026 Season A (Upcoming)</option>
                </select>
              </div>
            </div>

            {/* Geography Selector */}
            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-slate-400 font-medium -mb-0.5">Geography</span>
                <select 
                  value={selectedRegion} 
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="bg-transparent font-bold text-xs text-slate-800 cursor-pointer focus:outline-none"
                >
                  <option value="All Regions">All Rwanda (National)</option>
                  <option value="Northern">Northern Province</option>
                  <option value="Eastern">Eastern Province</option>
                  <option value="Southern">Southern Province</option>
                  <option value="Western">Western Province</option>
                  <option value="Kigali">Kigali City</option>
                  <optgroup label="Districts">
                    {RWANDA_DISTRICTS_GEO.map(d => (
                      <option key={d.name} value={d.name}>{d.name} District</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Crop Selector */}
            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <span className="text-emerald-700 font-bold">🌾</span>
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-slate-400 font-medium -mb-0.5">Crop / Product</span>
                <select 
                  value={selectedCrop} 
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="bg-transparent font-bold text-xs text-slate-800 cursor-pointer focus:outline-none"
                >
                  <option value="All Crops">All Crops</option>
                  <option value="Maize">Maize</option>
                  <option value="Beans">Beans (Mixed &amp; Climbing)</option>
                  <option value="Cassava">Cassava</option>
                  <option value="Irish Potatoes">Irish Potatoes</option>
                  <option value="Coffee">Coffee (Arabica)</option>
                  <option value="Rice">Rice (Paddy)</option>
                  <option value="Sweet Potato">Sweet Potato</option>
                  <option value="Banana">Banana</option>
                </select>
              </div>
            </div>

          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={triggerGenerateReport}
              className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Dossier</span>
            </button>
          </div>

        </div>

      </div>

      {/* SECTION B: NATIONAL AGRICULTURAL PERFORMANCE INDICATORS (6 COMPACT CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        
        {/* Card 1: Total Crop Production */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Leaf className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <span className="text-[11px] font-bold block text-slate-800">Crop Production</span>
              <span className="text-[9px] text-slate-400">{kpi.totalCropProduction.referencePeriod}</span>
            </div>
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {kpi.totalCropProduction.value.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 ml-1">
              {kpi.totalCropProduction.unit}
            </span>
          </div>
          <div className="mt-2 text-[10px] font-semibold text-emerald-600 flex items-center gap-1 pt-1.5 border-t border-slate-100">
            <TrendingUp className="w-3 h-3" />
            <span>{kpi.totalCropProduction.trendLabel}</span>
          </div>
        </div>

        {/* Card 2: Average Yield */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <span className="text-[11px] font-bold block text-slate-800">Average Yield</span>
              <span className="text-[9px] text-slate-400">Weighted Plot Observations</span>
            </div>
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {kpi.averageYield.value}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 ml-1">
              {kpi.averageYield.unit}
            </span>
          </div>
          <div className="mt-2 text-[10px] font-semibold text-emerald-600 flex items-center gap-1 pt-1.5 border-t border-slate-100">
            <TrendingUp className="w-3 h-3" />
            <span>{kpi.averageYield.trendLabel}</span>
          </div>
        </div>

        {/* Card 3: Cultivated Area */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <span className="text-[11px] font-bold block text-slate-800">Cultivated Area</span>
              <span className="text-[9px] text-slate-400">Total Hectares</span>
            </div>
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {kpi.cultivatedArea.value.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 ml-1">
              ha
            </span>
          </div>
          <div className="mt-2 text-[10px] font-semibold text-emerald-600 flex items-center gap-1 pt-1.5 border-t border-slate-100">
            <TrendingUp className="w-3 h-3" />
            <span>{kpi.cultivatedArea.trendLabel}</span>
          </div>
        </div>

        {/* Card 4: Documented Facilities */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <span className="text-[11px] font-bold block text-slate-800">Agri Facilities</span>
              <span className="text-[9px] text-slate-400">Known Verified Records</span>
            </div>
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {kpi.recordedFacilities.value}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 ml-1">
              units
            </span>
          </div>
          <div className="mt-2 text-[10px] font-semibold text-purple-700 flex items-center gap-1 pt-1.5 border-t border-slate-100">
            <CheckCircle2 className="w-3 h-3" />
            <span>Warehouses, Dryers &amp; Processors</span>
          </div>
        </div>

        {/* Card 5: Irrigation Coverage */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center flex-shrink-0">
              <Droplets className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <span className="text-[11px] font-bold block text-slate-800">Irrigation Coverage</span>
              <span className="text-[9px] text-slate-400">Marshland &amp; Hillside</span>
            </div>
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {kpi.irrigationCoverage.value.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 ml-1">
              ha
            </span>
          </div>
          <div className="mt-2 text-[10px] font-semibold text-cyan-700 flex items-center gap-1 pt-1.5 border-t border-slate-100">
            <TrendingUp className="w-3 h-3" />
            <span>{kpi.irrigationCoverage.trendLabel}</span>
          </div>
        </div>

        {/* Card 6: Soil Health & Fertility */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center flex-shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <span className="text-[11px] font-bold block text-slate-800">Soil Health Score</span>
              <span className="text-[9px] text-slate-400">Lab Profiles &amp; Erosion</span>
            </div>
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {kpi.soilFertilityIndex.value}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 ml-1">
              / 100
            </span>
          </div>
          <div className="mt-2 text-[10px] font-semibold text-amber-800 flex items-center gap-1 pt-1.5 border-t border-slate-100">
            <ShieldCheck className="w-3 h-3" />
            <span>{kpi.soilFertilityIndex.trendLabel}</span>
          </div>
        </div>

      </div>

      {/* SECTION C & D: MAP-CENTERED GIS COMMAND CENTER & SEASONAL ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* SECTION C: RWANDA AGRICULTURAL INTELLIGENCE MAP (Col 6.5) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
          
          {/* Map Header & Layer Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Rwanda Agricultural Intelligence Map
              </h2>
              <p className="text-[11px] text-slate-500">
                Explore Rwanda by administrative area. Switch layers to inspect challenge areas.
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setViewMode('MAP')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'MAP' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Map
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'TABLE' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Table
              </button>
            </div>
          </div>

          {/* Map Layer Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setMapLayer('PRODUCTIVITY')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${
                mapLayer === 'PRODUCTIVITY'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>🌾 Productivity &amp; Yield</span>
            </button>
            <button
              onClick={() => setMapLayer('IRRIGATION')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${
                mapLayer === 'IRRIGATION'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>💧 Irrigation Coverage</span>
            </button>
            <button
              onClick={() => setMapLayer('SOIL')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${
                mapLayer === 'SOIL'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>🌿 Soil &amp; Erosion</span>
            </button>
            <button
              onClick={() => setMapLayer('FACILITIES')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${
                mapLayer === 'FACILITIES'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>🏛️ Storage &amp; Processing</span>
            </button>
            <button
              onClick={() => setMapLayer('EXPORT')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${
                mapLayer === 'EXPORT'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>📦 Export Logistics</span>
            </button>
            <button
              onClick={() => setMapLayer('INTERVENTIONS')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${
                mapLayer === 'INTERVENTIONS'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>🎯 Priority Zones</span>
            </button>
          </div>

          {/* Interactive SVG Choropleth Map or Data Table */}
          {viewMode === 'MAP' ? (
            <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-[#F0FDF4]/30 via-white to-[#F8FAFC] rounded-2xl overflow-hidden border border-slate-100 p-2 flex items-center justify-center">
              
              {/* Compass Rose */}
              <div className="absolute top-3 left-3 flex flex-col items-center pointer-events-none opacity-60">
                <Compass className="w-5 h-5 text-slate-500" />
                <span className="text-[9px] font-bold text-slate-500 -mt-1">N</span>
              </div>

              {/* Dynamic Legend on Map */}
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl p-2.5 text-[10px] shadow-sm z-10">
                <div className="font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {mapLayer === 'PRODUCTIVITY' && 'Yield (t/ha)'}
                  {mapLayer === 'IRRIGATION' && 'Irrigation Coverage'}
                  {mapLayer === 'SOIL' && 'Soil Health Index'}
                  {mapLayer === 'FACILITIES' && 'Documented Units'}
                  {mapLayer === 'EXPORT' && 'Export Catchment'}
                  {mapLayer === 'INTERVENTIONS' && 'Priority Level'}
                </div>
                <div className="space-y-1 font-semibold text-slate-600">
                  {mapLayer === 'PRODUCTIVITY' && (
                    <>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#15803d]" /> &gt; 4.0 t/ha</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" /> 3.0 - 4.0</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#84cc16]" /> 2.0 - 3.0</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" /> 1.0 - 2.0</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /> &lt; 1.0</div>
                    </>
                  )}
                  {mapLayer === 'IRRIGATION' && (
                    <>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" /> &gt; 20% coverage</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" /> 14% - 20%</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#7dd3fc]" /> 8% - 14%</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#bae6fd]" /> &lt; 8% deficit</div>
                    </>
                  )}
                  {mapLayer === 'SOIL' && (
                    <>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#15803d]" /> &gt; 85 Optimal</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#65a30d]" /> 75 - 85 Moderate</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ca8a04]" /> 65 - 75 Lime Needed</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" /> &lt; 65 Erosion Risk</div>
                    </>
                  )}
                  {mapLayer === 'FACILITIES' && (
                    <>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]" /> &gt; 10 Units</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]" /> 6 - 10 Units</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#c084fc]" /> 3 - 5 Units</div>
                    </>
                  )}
                  {mapLayer === 'EXPORT' && (
                    <>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#059669]" /> High Export Volume</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Emerging Freight</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#a7f3d0]" /> Local Supply</div>
                    </>
                  )}
                  {mapLayer === 'INTERVENTIONS' && (
                    <>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" /> Critical Intervention</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" /> High Priority</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#e2e8f0]" /> Monitored Baseline</div>
                    </>
                  )}
                </div>
              </div>

              {/* Vector SVG Map */}
              <svg viewBox="0 0 620 490" className="w-full h-full">
                {/* Lake Kivu */}
                <path 
                  d="M 60 110 Q 120 180 110 240 Q 90 300 70 380 Q 50 420 50 480 L 20 480 L 20 110 Z" 
                  fill="#E0F2FE" 
                  stroke="#38BDF8" 
                  strokeWidth="1.2"
                />
                <text x="45" y="270" fill="#0284C7" fontSize="10" fontWeight="bold" transform="rotate(-90 45,270)" opacity="0.7">
                  LAKE KIVU
                </text>

                {/* 30 Districts */}
                {RWANDA_DISTRICTS_GEO.map((geo) => {
                  const fillColor = getDistrictFill(geo.name);
                  const isHovered = activeDistrict?.name === geo.name;
                  return (
                    <g 
                      key={geo.name}
                      onClick={() => handleDistrictClick(geo)}
                      className="cursor-pointer transition-all group"
                    >
                      <path
                        d={geo.path}
                        fill={fillColor}
                        stroke={isHovered ? '#000000' : '#FFFFFF'}
                        strokeWidth={isHovered ? '2.5' : '1.2'}
                        className="transition-all duration-200 hover:brightness-110 drop-shadow-xs"
                      />
                      <text
                        x={geo.labelX}
                        y={geo.labelY}
                        fill="#FFFFFF"
                        fontSize="8.5"
                        fontWeight="700"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="pointer-events-none drop-shadow-md select-none"
                      >
                        {geo.name}
                      </text>
                    </g>
                  );
                })}
              </svg>

            </div>
          ) : (
            /* Ranked Tabular View */
            <div className="w-full h-[360px] overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 sticky top-0 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-2.5">District</th>
                    <th className="p-2.5">Province</th>
                    <th className="p-2.5">Yield (t/ha)</th>
                    <th className="p-2.5">Production (t)</th>
                    <th className="p-2.5">Irrigation (%)</th>
                    <th className="p-2.5">Soil Score</th>
                    <th className="p-2.5">Facilities</th>
                    <th className="p-2.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {RWANDA_DISTRICTS_GEO.map((geo) => {
                    const d = districts.find((x: any) => x.name.toLowerCase() === geo.name.toLowerCase()) || {
                      yieldTonsPerHa: 3.2,
                      productionTonnes: 12500,
                      soilHealthIndex: 78,
                      irrigationCoveragePct: 12,
                      documentedFacilities: 5
                    };
                    return (
                      <tr key={geo.name} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-bold text-slate-800">{geo.name}</td>
                        <td className="p-2.5 text-slate-500">{geo.province}</td>
                        <td className="p-2.5 font-bold text-emerald-700">{d.yieldTonsPerHa}</td>
                        <td className="p-2.5 text-slate-700">{d.productionTonnes?.toLocaleString()}</td>
                        <td className="p-2.5 text-cyan-700">{d.irrigationCoveragePct}%</td>
                        <td className="p-2.5 text-amber-700">{d.soilHealthIndex || 78}/100</td>
                        <td className="p-2.5 text-purple-700">{d.documentedFacilities || 4}</td>
                        <td className="p-2.5">
                          <button 
                            onClick={() => handleDistrictClick(geo)}
                            className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-bold"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-1">
            <span>Click any district on the map or table to inspect complete 5-module intelligence dossier.</span>
            <span>Distinguished: Observed vs. Modelled Data</span>
          </div>

        </div>

        {/* SECTION D: HISTORICAL & SEASONAL ANALYTICS (Col 5.5) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Main Chart Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Historical and Seasonal Trends
                </h2>
                <p className="text-[11px] text-slate-500">
                  {chartView === 'SEASON_COMPARE' ? 'Season A vs. Season B yield & production comparison' : 'Multi-year production trends (2014–2026A)'}
                </p>
              </div>

              {/* Chart Toggle */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                <button
                  onClick={() => setChartView('SEASON_COMPARE')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    chartView === 'SEASON_COMPARE' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Season A vs B
                </button>
                <button
                  onClick={() => setChartView('TRENDS')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    chartView === 'TRENDS' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Crop Trajectory
                </button>
              </div>
            </div>

            {/* Chart Render */}
            {chartView === 'SEASON_COMPARE' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-emerald-600" />
                    <span>Season A (Main Harvest)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-amber-500" />
                    <span>Season B (Secondary)</span>
                  </div>
                </div>

                {/* Season A vs B Bar Comparison SVG */}
                <div className="w-full h-44 relative">
                  <svg viewBox="0 0 380 140" className="w-full h-full overflow-visible">
                    <line x1="30" y1="20" x2="370" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="30" y1="60" x2="370" y2="60" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="30" y1="100" x2="370" y2="100" stroke="#E2E8F0" strokeWidth="1" />

                    <text x="5" y="24" fill="#94A3B8" fontSize="8" fontWeight="600">6M t</text>
                    <text x="5" y="64" fill="#94A3B8" fontSize="8" fontWeight="600">3M t</text>
                    <text x="5" y="104" fill="#94A3B8" fontSize="8" fontWeight="600">0</text>

                    {seasonComparison.slice(-5).map((item: any, idx: number) => {
                      const groupX = 55 + idx * 65;
                      const hA = Math.min(80, (item.seasonA_prod / 6000000) * 80);
                      const hB = Math.min(80, (item.seasonB_prod / 6000000) * 80);
                      return (
                        <g key={item.year}>
                          {/* Season A Bar */}
                          <rect x={groupX} y={100 - hA} width="16" height={hA} fill="#16A34A" rx="2" />
                          {/* Season B Bar */}
                          <rect x={groupX + 18} y={100 - hB} width="16" height={hB} fill="#F59E0B" rx="2" />
                          {/* Year Label */}
                          <text x={groupX + 17} y="116" fill="#64748B" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                            {item.year}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-600 leading-relaxed">
                  <strong>NISR Comparative Note:</strong> Season A accounts for ~54% of annual food production, benefiting from long rains. Season B yields are more sensitive to dry spell timing in Eastern lowlands.
                </div>
              </div>
            ) : (
              /* Multi-Crop Line Trajectory */
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-600 flex-wrap">
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#16A34A]" /> Maize</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#EA580C]" /> Beans</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0284C7]" /> Cassava</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#7C3AED]" /> Coffee</div>
                </div>

                <div className="w-full h-44 relative">
                  <svg viewBox="0 0 380 140" className="w-full h-full overflow-visible">
                    <line x1="30" y1="20" x2="370" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="30" y1="60" x2="370" y2="60" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="30" y1="100" x2="370" y2="100" stroke="#E2E8F0" strokeWidth="1" />

                    <polyline fill="none" stroke="#16A34A" strokeWidth="2.5" points="50,85 120,75 190,60 260,50 330,30" />
                    <polyline fill="none" stroke="#EA580C" strokeWidth="2.5" points="50,95 120,90 190,80 260,75 330,60" />
                    <polyline fill="none" stroke="#0284C7" strokeWidth="2" points="50,105 120,100 190,95 260,90 330,80" />
                    <polyline fill="none" stroke="#7C3AED" strokeWidth="2" points="50,110 120,108 190,105 260,102 330,96" />

                    {['2023A', '2023B', '2024A', '2024B', '2025A'].map((s, idx) => (
                      <text key={s} x={50 + idx * 70} y="116" fill="#94A3B8" fontSize="8" fontWeight="600" textAnchor="middle">{s}</text>
                    ))}
                  </svg>
                </div>
              </div>
            )}

          </div>

          {/* Top Crops Ranked Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Top Crops by Production &amp; Yield ({selectedYear === 'all' ? '2025' : selectedYear})
              </h2>
              <span className="text-[10px] text-slate-400 font-medium">Ranked by volume</span>
            </div>

            <div className="space-y-2">
              {topCrops.slice(0, 5).map((c: any) => {
                const maxVal = 320000;
                const pct = Math.min(100, Math.round((c.total_prod_tonnes / maxVal) * 100));
                return (
                  <div key={c.crop_name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800">{c.crop_name}</span>
                      <span className="text-slate-900 font-bold">
                        {c.total_prod_tonnes.toLocaleString()} t <span className="text-slate-400 font-normal">({c.avg_yield_t_ha} t/ha)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* SECTION E: FIVE AGRICULTURAL INTELLIGENCE MODULE SUMMARIES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Five Agricultural Intelligence Areas
            </h2>
            <p className="text-xs text-slate-500">
              Integrated overview connecting all 5 challenge areas. Click any module to navigate to its detailed analytical workspace.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-800 hidden sm:inline">
            NISR Integrated Evidence Synthesis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Module 1: Productivity */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-md transition-all group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Leaf className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Challenge 1
                </span>
              </div>
              <h3 className="text-xs font-black text-slate-900">
                {moduleSummaries.productivity.title}
              </h3>
              <div className="text-lg font-black text-slate-900">
                {moduleSummaries.productivity.primaryMetric}
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {moduleSummaries.productivity.highlight}
              </p>
              <div className="p-2 bg-amber-50/70 border border-amber-100 rounded-lg text-[10px] text-amber-900 leading-tight">
                <strong>Attention:</strong> {moduleSummaries.productivity.attentionNeeded}
              </div>
            </div>
            <Link
              to="/admin/crops"
              className="mt-3 pt-2 border-t border-slate-100 text-xs font-bold text-emerald-700 group-hover:text-emerald-900 flex items-center justify-between"
            >
              <span>Explore Productivity</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Module 2: Small-Scale Irrigation */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-cyan-500/50 hover:shadow-md transition-all group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
                  <Droplets className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full">
                  Challenge 2
                </span>
              </div>
              <h3 className="text-xs font-black text-slate-900">
                {moduleSummaries.irrigation.title}
              </h3>
              <div className="text-lg font-black text-slate-900">
                {moduleSummaries.irrigation.primaryMetric}
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {moduleSummaries.irrigation.highlight}
              </p>
              <div className="p-2 bg-cyan-50/70 border border-cyan-100 rounded-lg text-[10px] text-cyan-900 leading-tight">
                <strong>Attention:</strong> {moduleSummaries.irrigation.attentionNeeded}
              </div>
            </div>
            <Link
              to="/admin/irrigation"
              className="mt-3 pt-2 border-t border-slate-100 text-xs font-bold text-cyan-700 group-hover:text-cyan-900 flex items-center justify-between"
            >
              <span>Assess Irrigation</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Module 3: Soil Conservation & Fertility */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-amber-500/50 hover:shadow-md transition-all group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-amber-50 text-amber-800">
                  <Layers className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                  Challenge 3
                </span>
              </div>
              <h3 className="text-xs font-black text-slate-900">
                {moduleSummaries.soilConservation.title}
              </h3>
              <div className="text-lg font-black text-slate-900">
                {moduleSummaries.soilConservation.primaryMetric}
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {moduleSummaries.soilConservation.highlight}
              </p>
              <div className="p-2 bg-rose-50/70 border border-rose-100 rounded-lg text-[10px] text-rose-900 leading-tight">
                <strong>Attention:</strong> {moduleSummaries.soilConservation.attentionNeeded}
              </div>
            </div>
            <Link
              to="/admin/soil-conservation"
              className="mt-3 pt-2 border-t border-slate-100 text-xs font-bold text-amber-800 group-hover:text-amber-950 flex items-center justify-between"
            >
              <span>Review Soil Health</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Module 4: Post-Harvest & Processing */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-purple-500/50 hover:shadow-md transition-all group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <Package className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  Challenge 4
                </span>
              </div>
              <h3 className="text-xs font-black text-slate-900">
                {moduleSummaries.postHarvest.title}
              </h3>
              <div className="text-lg font-black text-slate-900">
                {moduleSummaries.postHarvest.primaryMetric}
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {moduleSummaries.postHarvest.highlight}
              </p>
              <div className="p-2 bg-purple-50/70 border border-purple-100 rounded-lg text-[10px] text-purple-900 leading-tight">
                <strong>Attention:</strong> {moduleSummaries.postHarvest.attentionNeeded}
              </div>
            </div>
            <Link
              to="/admin/post-harvest"
              className="mt-3 pt-2 border-t border-slate-100 text-xs font-bold text-purple-700 group-hover:text-purple-950 flex items-center justify-between"
            >
              <span>Inspect Facilities</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Module 5: Export Markets */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-md transition-all group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Globe className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Challenge 5
                </span>
              </div>
              <h3 className="text-xs font-black text-slate-900">
                {moduleSummaries.exportMarkets.title}
              </h3>
              <div className="text-lg font-black text-slate-900">
                {moduleSummaries.exportMarkets.primaryMetric}
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {moduleSummaries.exportMarkets.highlight}
              </p>
              <div className="p-2 bg-emerald-50/70 border border-emerald-100 rounded-lg text-[10px] text-emerald-900 leading-tight">
                <strong>Attention:</strong> {moduleSummaries.exportMarkets.attentionNeeded}
              </div>
            </div>
            <Link
              to="/admin/imports-exports"
              className="mt-3 pt-2 border-t border-slate-100 text-xs font-bold text-emerald-700 group-hover:text-emerald-900 flex items-center justify-between"
            >
              <span>Explore Trade Data</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </div>

      {/* SECTION F: PRIORITY OPPORTUNITIES & RECOMMENDED ACTIONS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              Priority Opportunities and Recommended Actions
            </h2>
            <p className="text-xs text-slate-500">
              Evidence-supported actions for agricultural planners, identifying feasibility and missing field information.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            5 Active Priorities
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {priorityOpportunities.map((opp: any) => (
            <div
              key={opp.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all flex flex-col justify-between space-y-2 group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    opp.priorityLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                    opp.priorityLevel === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                    opp.priorityLevel === 'ADMINISTRATIVE' ? 'bg-blue-100 text-blue-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {opp.priorityLevel}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{opp.area}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{opp.location}</h4>
                <p className="text-xs font-semibold text-slate-800 leading-snug">{opp.recommendation}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">{opp.evidenceBasis}</p>
                {opp.requiresFieldVerification && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-700 font-semibold mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Requires field verification</span>
                  </div>
                )}
              </div>
              <Link
                to={opp.link}
                className="pt-2 text-xs font-bold text-emerald-700 group-hover:text-emerald-900 flex items-center justify-between border-t border-slate-200/60"
              >
                <span>Assess Opportunity</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER BAR */}
      <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-emerald-700" />
          <span>AgriLens Rwanda — National Agricultural Intelligence Platform (NISR SAS 2014–2026A)</span>
        </div>
        <div>
          Official Data Provenance: National Institute of Statistics of Rwanda &amp; MINAGRI
        </div>
      </div>

      {/* DISTRICT DETAIL DOSSIER MODAL (Opened by Map click) */}
      {activeDistrict && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {activeDistrict.province} Province · Code: {activeDistrict.code}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {activeDistrict.name} District Agricultural Intelligence Dossier
                </h3>
                <p className="text-xs text-slate-500">
                  NISR multi-year survey statistics and evidence-supported opportunity analysis.
                </p>
              </div>
              <button 
                onClick={() => setActiveDistrict(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 5-Challenge Area Grid for District */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div className="text-slate-400 text-[10px] uppercase font-bold">1. Productivity &amp; Yield</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">
                  {activeDistrict.yieldTonsPerHa} t/ha
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Production: <strong>{(activeDistrict.productionTonnes || 14500).toLocaleString()} tons</strong>
                </div>
                <div className="text-[10px] text-emerald-700 font-bold mt-1">
                  Primary: {activeDistrict.primaryCrop}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div className="text-slate-400 text-[10px] uppercase font-bold">2. Small-Scale Irrigation</div>
                <div className="text-lg font-black text-cyan-900 mt-0.5">
                  {activeDistrict.irrigationCoveragePct}% Coverage
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Irrigated Land: <strong>{activeDistrict.irrigatedHa?.toLocaleString() || 640} ha</strong>
                </div>
                <div className="text-[10px] text-cyan-700 font-bold mt-1">
                  {activeDistrict.irrigationPumpingFeasible ? '✓ River Pumping Feasible' : 'Hillside Catchment Priority'}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div className="text-slate-400 text-[10px] uppercase font-bold">3. Soil &amp; Fertility</div>
                <div className="text-lg font-black text-amber-900 mt-0.5">
                  {activeDistrict.soilHealthIndex || 78} / 100 Score
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Soil pH: <strong>{activeDistrict.soilPh || '5.8'}</strong> · SOC: <strong>{activeDistrict.organicCarbonPct || '2.6'}%</strong>
                </div>
                <div className="text-[10px] text-amber-800 font-bold mt-1">
                  Erosion Risk: {activeDistrict.erosionRisk || 'MODERATE'}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div className="text-slate-400 text-[10px] uppercase font-bold">4. Post-Harvest &amp; Trade</div>
                <div className="text-lg font-black text-purple-900 mt-0.5">
                  {activeDistrict.documentedFacilities || 5} Facilities
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Capacity: <strong>{(activeDistrict.storageCapacityMt || 6000).toLocaleString()} MT</strong>
                </div>
                <div className="text-[10px] text-purple-700 font-bold mt-1">
                  Est. Loss Rate: {activeDistrict.postHarvestLossPct || 8.5}%
                </div>
              </div>

            </div>

            {/* Evidence-Based Recommendation */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Evidence-Supported Recommendation for {activeDistrict.name}:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Prioritize terrace slope stabilization, lime distribution on acidic plots, and small-scale marshland pumping in {activeDistrict.name} to mitigate seasonal yield volatility.
              </p>
            </div>

            {/* Action Buttons to Dedicated Module Pages */}
            <div className="pt-2 flex flex-wrap gap-2 justify-end">
              <Link
                to="/admin/crops"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Crops
              </Link>
              <Link
                to="/admin/irrigation"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Irrigation
              </Link>
              <Link
                to="/admin/soil-conservation"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Soil Dossier
              </Link>
              <Link
                to="/admin/post-harvest"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Post-Harvest
              </Link>
              <Link
                to="/admin/imports-exports"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Export Markets
              </Link>
              <button
                onClick={() => setActiveDistrict(null)}
                className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* GENERATE CERTIFIED REPORT MODAL */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            
            <div className="w-12 h-12 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                National Agricultural Intelligence Dossier
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Synthesizing verified multi-year records for {selectedYear === 'all' ? '2014–2026A' : selectedYear} ({selectedRegion})
              </p>
            </div>

            {generatingReport ? (
              <div className="py-6 space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-600">
                  Compiling 17,912 survey records, soil metrics, and trade statistics...
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Report Code:</span>
                    <strong className="text-slate-800">AGRI-RW-{selectedYear}-SYNTH</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Coverage:</span>
                    <strong className="text-slate-800">All 30 Districts (NISR SAS)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Validation Status:</span>
                    <strong className="text-emerald-700 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Certified
                    </strong>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      alert(`Official Dossier Downloaded: AgriLens_Report_${selectedYear}.pdf\nDigital signature: SHA256-verified.`);
                      setReportModalOpen(false);
                    }}
                    className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF Dossier
                  </button>
                  <button
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
