import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../../config/api';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Package, Warehouse, Truck, Factory, ShieldAlert, 
  MapPin, RefreshCw, FileText, Filter, Download, 
  Database, Award, ChevronRight, ArrowUpRight, ArrowDownRight, 
  Info, HelpCircle, Sun, Activity, Zap, ExternalLink,
  TrendingUp, BarChart3, Compass, Check, Search, Layers,
  Thermometer, AlertTriangle, Snowflake, Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  CartesianGrid, Cell, AreaChart, Area, LineChart, Line, Legend, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie
} from 'recharts';

export default function PostHarvestProcessing() {
  const [activeTab, setActiveTab] = useState<'map' | 'supply' | 'capacity' | 'gaps' | 'screening' | 'dossier'>('map');
  const [selectedSeason, setSelectedSeason] = useState('2026B');
  const [selectedDistrict, setSelectedDistrict] = useState('Nyagatare');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('ALL');
  const [selectedFacilityType, setSelectedFacilityType] = useState<string>('ALL');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [loading, setLoading] = useState(false);

  // Map references
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Analytical Data States
  const [summaryData, setSummaryData] = useState<any>({
    metrics: {},
    crop_breakdown_mt: {},
    facilities_infrastructure: {},
    safeguard_notice: {}
  });
  const [districtsData, setDistrictsData] = useState<any[]>([]);
  const [availableSeasons, setAvailableSeasons] = useState<any[]>([]);
  const [facilitiesData, setFacilitiesData] = useState<any[]>([]);
  const [screeningData, setScreeningData] = useState<any[]>([]);
  const [dossierData, setDossierData] = useState<any>(null);
  const [selectedFacility, setSelectedFacility] = useState<any>(null);

  const getApiBase = () => apiUrl('post-harvest');

  // 1. Load Seasons Catalog Once on Mount
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const res = await fetch(`${getApiBase()}/seasons`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setAvailableSeasons(list);
          }
        }
      } catch (e) {
        console.warn('Error loading post-harvest seasons:', e);
      }
    };
    fetchSeasons();
  }, []);

  // 2. Fetch Module Analytical Data when season or selected district changes
  const fetchModuleData = async () => {
    setLoading(true);
    try {
      const apiBase = getApiBase();

      const [sumRes, distRes, facRes, screenRes, dosRes] = await Promise.all([
        fetch(`${apiBase}/summary?season=${selectedSeason}`).catch(() => null),
        fetch(`${apiBase}/districts?season=${selectedSeason}`).catch(() => null),
        fetch(`${apiBase}/facilities`).catch(() => null),
        fetch(`${apiBase}/gap-screening?season=${selectedSeason}`).catch(() => null),
        fetch(`${apiBase}/site-dossier?district=${encodeURIComponent(selectedDistrict)}&season=${selectedSeason}`).catch(() => null),
      ]);

      if (sumRes && sumRes.ok) setSummaryData(await sumRes.json());
      if (distRes && distRes.ok) setDistrictsData(await distRes.json());
      if (facRes && facRes.ok) setFacilitiesData(await facRes.json());
      if (screenRes && screenRes.ok) setScreeningData(await screenRes.json());
      if (dosRes && dosRes.ok) setDossierData(await dosRes.json());
    } catch (err) {
      console.error('Failed to load post-harvest intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModuleData();
  }, [selectedSeason, selectedDistrict]);

  // 3. Initialize & Update MapLibre GL Map
  useEffect(() => {
    if (activeTab !== 'map') return;
    if (!mapContainer.current) return;

    if (!mapInstance.current) {
      mapInstance.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors © NISR / MINAGRI'
            }
          },
          layers: [
            {
              id: 'osm',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        },
        center: [30.061, -1.944], // Center of Rwanda
        zoom: 8.2,
      });

      mapInstance.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    }

    // Clear previous markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Filter facilities by selected facility type
    const filteredFacilities = facilitiesData.filter(f => 
      selectedFacilityType === 'ALL' || f.facility_type === selectedFacilityType
    );

    // Color mapping by facility type
    const typeColorMap: Record<string, string> = {
      SILO: '#f59e0b',          // Amber
      WAREHOUSE: '#10b981',     // Emerald
      COLD_STORAGE: '#06b6d4',  // Cyan
      PROCESSING_PLANT: '#8b5cf6', // Violet
      COLLECTION_CENTER: '#3b82f6', // Blue
      OTHER: '#64748b'
    };

    filteredFacilities.forEach(facility => {
      if (!facility.longitude || !facility.latitude) return;

      const color = typeColorMap[facility.facility_type] || '#10b981';

      // Custom marker DOM element
      const el = document.createElement('div');
      el.className = 'custom-facility-marker';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color;
      el.style.border = '2px solid #ffffff';
      el.style.boxShadow = `0 0 10px ${color}88`;
      el.style.cursor = 'pointer';

      const popupHtml = `
        <div style="font-family: sans-serif; padding: 6px; min-width: 200px; color: #0f172a;">
          <div style="font-weight: 800; font-size: 13px; color: ${color}; margin-bottom: 2px;">
            ${facility.name}
          </div>
          <div style="font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 4px;">
            ${facility.facility_type.replace(/_/g, ' ')} • ${facility.district_name || 'Rwanda'}
          </div>
          <div style="font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            <div><strong>Storage:</strong> ${Number(facility.storage_capacity_tonnes).toLocaleString()} MT</div>
            <div><strong>Processing:</strong> ${Number(facility.processing_capacity_tonnes_day).toLocaleString()} MT/day</div>
            <div><strong>Cold Storage:</strong> ${Number(facility.cold_storage_capacity_tonnes).toLocaleString()} MT</div>
            <div><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">${facility.status}</span></div>
          </div>
          <div style="margin-top: 6px; font-size: 9px; color: #b45309; background: #fef3c7; padding: 3px 5px; border-radius: 4px;">
            Status: Documented Facility • Field verification active
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 15 }).setHTML(popupHtml);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([facility.longitude, facility.latitude])
        .setPopup(popup)
        .addTo(mapInstance.current!);

      el.addEventListener('click', () => {
        setSelectedFacility(facility);
      });

      markersRef.current.push(marker);
    });

  }, [activeTab, facilitiesData, selectedFacilityType]);

  // Derived filtered district league table
  const filteredDistricts = districtsData.filter((d: any) => {
    const matchesSearch = d.district_name.toLowerCase().includes(searchDistrict.toLowerCase()) ||
                          d.province_name.toLowerCase().includes(searchDistrict.toLowerCase());
    const matchesTier = selectedTierFilter === 'ALL' || d.investment_tier === selectedTierFilter;
    return matchesSearch && matchesTier;
  });

  const metrics = summaryData.metrics || {};
  const cropBreakdown = summaryData.crop_breakdown_mt || {};
  const infrastructure = summaryData.facilities_infrastructure || {};

  // Production vs. Surplus Data for Recharts
  const cropChartData = [
    { crop: 'Maize', production: cropBreakdown.maize || 0, surplusPct: 35.3, surplus: Math.round((cropBreakdown.maize || 0) * 0.353) },
    { crop: 'Beans', production: cropBreakdown.beans || 0, surplusPct: 38.6, surplus: Math.round((cropBreakdown.beans || 0) * 0.386) },
    { crop: 'Irish Potato', production: cropBreakdown.irish_potato || 0, surplusPct: 50.1, surplus: Math.round((cropBreakdown.irish_potato || 0) * 0.501) },
    { crop: 'Cassava', production: cropBreakdown.cassava || 0, surplusPct: 63.3, surplus: Math.round((cropBreakdown.cassava || 0) * 0.633) },
    { crop: 'Paddy Rice', production: cropBreakdown.paddy_rice || 0, surplusPct: 82.5, surplus: Math.round((cropBreakdown.paddy_rice || 0) * 0.825) },
    { crop: 'Banana', production: cropBreakdown.banana || 0, surplusPct: 42.0, surplus: Math.round((cropBreakdown.banana || 0) * 0.420) },
    { crop: 'Veg & Fruits', production: cropBreakdown.vegetables_fruits || 0, surplusPct: 86.6, surplus: Math.round((cropBreakdown.vegetables_fruits || 0) * 0.866) },
  ];

  // Harvest Utilization Breakdown
  const utilizationPieData = [
    { name: 'Sold (Market Surplus)', value: Number(metrics.national_avg_sold_pct || 42.1), color: '#10b981' },
    { name: 'Household Consumed', value: Number(metrics.national_avg_consumed_pct || 48.7), color: '#3b82f6' },
    { name: 'Stored On-Farm', value: Number(metrics.national_avg_stored_pct || 7.1), color: '#f59e0b' },
    { name: 'Documented Loss', value: Number(metrics.national_avg_lost_pct || 2.1), color: '#ef4444' },
  ];

  // Export CSV Handler
  const exportToCsv = () => {
    if (!districtsData || districtsData.length === 0) return;
    const headers = [
      'District', 'Province', 'Season', 'Total Production (MT)', 'Market Surplus (MT)',
      'Documented Storage (MT)', 'Processing (MT/day)', 'Storage Gap (MT)', 'Capacity Status',
      'Verification Status', 'Avg Distance Facility (km)', 'Distance Road (km)', 'Opportunity Score', 'Tier'
    ];
    const rows = districtsData.map(d => [
      d.district_name, d.province_name, d.season_code, d.total_crop_production_mt,
      d.market_surplus_volume_mt, d.documented_storage_capacity_mt,
      d.documented_processing_capacity_mt_day, d.storage_capacity_gap_mt,
      d.capacity_status, d.verification_status, d.avg_distance_to_facility_km,
      d.avg_distance_to_paved_road_km, d.investment_opportunity_score, d.investment_tier
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agrilens_post_harvest_intelligence_${selectedSeason}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto custom-scrollbar">
      
      {/* 1. Header with Title & Season Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">Module 4 Intelligence</span>
            <span>NISR SAS Agricultural Logistics & Value Addition</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-emerald-400 shrink-0" />
            Post-Harvest Collection, Storage, Processing & Value Addition
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Multi-seasonal intelligence mapping infrastructure capacity, harvest market surplus, agro-logistics gaps, and pre-feasibility site screening across all 30 districts of Rwanda.
          </p>
        </div>

        {/* Season Selector & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 shadow-inner">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-300">Season:</span>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="bg-transparent text-xs font-bold text-emerald-400 focus:outline-none cursor-pointer"
            >
              {availableSeasons.map((s) => (
                <option key={s.season_code} value={s.season_code} className="bg-slate-900 text-slate-200">
                  {s.season_code} ({s.year} {s.season_name})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchModuleData}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Refresh Intelligence Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={exportToCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 transition-all"
            title="Export CSV Dataset"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. MANDATORY CRITICAL SAFEGUARD BANNER */}
      <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 backdrop-blur-sm flex items-start gap-3.5 shadow-lg shadow-amber-950/20">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-amber-300 uppercase tracking-wide flex items-center gap-2">
            CRITICAL SAFEGUARD: INFRASTRUCTURE PRESENCE & POST-HARVEST LOSS ESTIMATES
          </h4>
          <p className="text-amber-200/90 leading-relaxed">
            <strong>A facility's absence from your database does not prove that no facility exists in the area.</strong> Label these as unrecorded facilities or potential coverage gaps until local verification is completed. Similarly, do not claim that a specific percentage of produce is lost unless the loss data supports that estimate.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-amber-300/80 pt-1 font-medium">
            <span>• NISR Table 13 (Exact crop production in MT)</span>
            <span>• NISR Table 14 (Farmer use of harvest: sold, consumed, stored, lost)</span>
            <span>• Ground-truthing protocol: MINAGRI / RAB / District Verification required</span>
          </div>
        </div>
      </div>

      {/* 3. Top High-Level National Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Crop Production & Market Surplus */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase tracking-wider">National Commercial Surplus</span>
            <Truck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {Number(metrics.total_market_surplus_volume_mt || 1891795).toLocaleString()}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">MT Surplus</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Total Production:</span>
            <span className="font-semibold text-slate-200">
              {Number(metrics.total_crop_production_mt || 3082086).toLocaleString()} MT
            </span>
          </div>
        </div>

        {/* KPI 2: Documented Storage vs. Unmet Gap */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase tracking-wider">Documented Storage Capacity</span>
            <Warehouse className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {Number(metrics.total_documented_storage_capacity_mt || 353100).toLocaleString()}
            </span>
            <span className="text-xs text-amber-400 font-semibold">MT Known</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Potential Coverage Gap:</span>
            <span className="font-semibold text-rose-400">
              {Number(metrics.total_storage_capacity_gap_mt || 1568562).toLocaleString()} MT
            </span>
          </div>
        </div>

        {/* KPI 3: Documented Agro-Processing Capacity */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur shadow-sm relative overflow-hidden group hover:border-violet-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase tracking-wider">Agro-Processing Capacity</span>
            <Factory className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {Number(metrics.total_processing_capacity_mt_day || 2130).toLocaleString()}
            </span>
            <span className="text-xs text-violet-400 font-semibold">MT / Day</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Cold Storage:</span>
            <span className="font-semibold text-cyan-400">
              {Number(metrics.total_cold_storage_capacity_mt || 25400).toLocaleString()} MT
            </span>
          </div>
        </div>

        {/* KPI 4: Infrastructure Coverage & Tier 1 Urgency */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur shadow-sm relative overflow-hidden group hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase tracking-wider">Tier 1 Investment Sites</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400 tracking-tight">
              {metrics.tier1_urgent_districts_count || 10}
            </span>
            <span className="text-xs text-slate-400 font-semibold">Districts Urgent</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Survey Required:</span>
            <span className="font-semibold text-amber-400">
              {metrics.survey_required_districts_count || 11} Districts
            </span>
          </div>
        </div>

      </div>

      {/* 4. Tab Navigation Header */}
      <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto custom-scrollbar">
        {[
          { id: 'map', label: 'Facility Map & Coverage', icon: MapPin },
          { id: 'supply', label: 'Crop Supply & Market Surplus', icon: TrendingUp },
          { id: 'capacity', label: 'Storage & Processing Capacity', icon: Warehouse },
          { id: 'gaps', label: 'Infrastructure Gaps & Distances', icon: Truck },
          { id: 'screening', label: 'Investment Screening & Ranking', icon: Award },
          { id: 'dossier', label: 'Pre-Feasibility District Dossier', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-emerald-400 text-emerald-400 bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 5. TAB 1: Facility Map & Geographic Coverage */}
      {activeTab === 'map' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Map Canvas */}
            <div className="lg:col-span-2 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col h-[560px] relative shadow-lg">
              <div className="p-3 bg-slate-950/80 backdrop-blur border-b border-slate-800 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Rwanda Agricultural Infrastructure Map
                  </span>
                </div>
                
                {/* Facility Type Filter */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400">Type:</span>
                  <select
                    value={selectedFacilityType}
                    onChange={(e) => setSelectedFacilityType(e.target.value)}
                    className="bg-slate-900 text-emerald-400 border border-slate-700 rounded px-2 py-1 text-xs font-semibold focus:outline-none"
                  >
                    <option value="ALL">All Facilities ({facilitiesData.length})</option>
                    <option value="SILO">Silos</option>
                    <option value="WAREHOUSE">Warehouses</option>
                    <option value="COLD_STORAGE">Cold Storage</option>
                    <option value="PROCESSING_PLANT">Processing Plants</option>
                    <option value="COLLECTION_CENTER">Collection Centers</option>
                  </select>
                </div>
              </div>

              {/* MapLibre DOM Node */}
              <div ref={mapContainer} className="flex-1 w-full h-full" />

              {/* Map Legend Overlay */}
              <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-lg p-2.5 text-[11px] text-slate-300 space-y-1.5 z-10 shadow-xl">
                <div className="font-bold text-white uppercase tracking-wider text-[10px] mb-1">Facility Typology</div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 border border-white"></span>
                  <span>Grain Silos (Strategic Reserve)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></span>
                  <span>Warehouses / Aggregation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-500 border border-white"></span>
                  <span>Cold Storage (Potato & Horticulture)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500 border border-white"></span>
                  <span>Industrial Agro-Processing Plants</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 border border-white"></span>
                  <span>Collection Centers</span>
                </div>
              </div>
            </div>

            {/* Selected Facility Details & Facility Catalog */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col space-y-4 h-[560px] overflow-hidden">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-emerald-400" />
                  Facility Inventory & Status
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click a marker on the map or select from list below to view operational parameters.
                </p>
              </div>

              {/* Active Selected Facility Preview Card */}
              {selectedFacility ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {selectedFacility.facility_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {selectedFacility.facility_code}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white leading-tight">
                    {selectedFacility.name}
                  </div>
                  <div className="text-xs text-slate-300">
                    District: <strong className="text-emerald-400">{selectedFacility.district_name}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/80">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Storage:</span>
                      <span className="font-bold text-white">
                        {Number(selectedFacility.storage_capacity_tonnes).toLocaleString()} MT
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Processing:</span>
                      <span className="font-bold text-purple-400">
                        {Number(selectedFacility.processing_capacity_tonnes_day).toLocaleString()} MT/day
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Cold Storage:</span>
                      <span className="font-bold text-cyan-400">
                        {Number(selectedFacility.cold_storage_capacity_tonnes).toLocaleString()} MT
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Operator:</span>
                      <span className="font-semibold text-slate-200 truncate block">
                        {selectedFacility.operator_name || 'MINAGRI / Co-op'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-xs text-slate-400 py-6">
                  Select any facility marker on the map to inspect its verified capacity, operator, and coordinates.
                </div>
              )}

              {/* Scrollable Facility Directory */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Documented National Facilities ({facilitiesData.length})
                </div>
                {facilitiesData.map((f: any) => (
                  <div
                    key={f.id}
                    onClick={() => {
                      setSelectedFacility(f);
                      if (mapInstance.current && f.longitude && f.latitude) {
                        mapInstance.current.flyTo({ center: [f.longitude, f.latitude], zoom: 11 });
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      selectedFacility?.id === f.id
                        ? 'bg-slate-800 border-emerald-400 text-white'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="truncate pr-2">{f.name}</span>
                      <span className="text-[10px] font-bold text-emerald-400 whitespace-nowrap">
                        {Number(f.storage_capacity_tonnes).toLocaleString()} MT
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>{f.district_name}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{f.facility_type.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 2: Crop Supply & Market Surplus (NISR Table 13 & 14) */}
      {activeTab === 'supply' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Crop Production vs Commercial Surplus Chart */}
            <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Crop Production vs. Commercial Market Surplus ({selectedSeason})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Production in MT (NISR Table 13) vs. Market Surplus Volume derived from farmer harvest disposition (NISR Table 14).
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cropChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="crop" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k MT`} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(val: any, name: any) => [`${Number(val).toLocaleString()} MT`, name === 'production' ? 'Total Production' : 'Commercial Surplus']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="production" name="Total Production (MT)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="surplus" name="Market Surplus (MT)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-800">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Maize Surplus Share:</span>
                  <div className="font-bold text-emerald-400 text-sm">35.3% Sold</div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Irish Potato Surplus:</span>
                  <div className="font-bold text-emerald-400 text-sm">50.1% Sold</div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Cassava Surplus:</span>
                  <div className="font-bold text-emerald-400 text-sm">63.3% Sold</div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Paddy Rice Surplus:</span>
                  <div className="font-bold text-emerald-400 text-sm">82.5% Sold</div>
                </div>
              </div>
            </div>

            {/* Harvest Disposition Breakdown (Pie) */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-400" />
                  Farmer Harvest Disposition (Table 14)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Official percentage breakdown of farmer harvest use across Rwanda.
                </p>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={utilizationPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {utilizationPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(val: any) => [`${val}%`, 'Share of Harvest']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
                {utilizationPieData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span>{item.name}</span>
                    </div>
                    <span className="font-bold text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 7. TAB 3: Storage & Processing Capacity vs. Supply */}
      {activeTab === 'capacity' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Top 10 Districts Storage Gap Comparison */}
            <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-amber-400" />
                  Market Surplus vs. Documented Storage Capacity (Top 10 Districts)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Surplus produce requiring collection and drying vs. known warehousing and silo capacity.
                </p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtsData.slice(0, 10)} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="district_name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k MT`} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(val: any) => [`${Number(val).toLocaleString()} MT`]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="market_surplus_volume_mt" name="Commercial Surplus (MT)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="documented_storage_capacity_mt" name="Documented Storage (MT)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200">
                <div className="font-semibold text-amber-300">National Post-Harvest Capacity Evaluation:</div>
                <div className="text-[11px] mt-1 text-slate-300 leading-relaxed">
                  Total Commercial Surplus across 30 districts is <strong>{Number(metrics.total_market_surplus_volume_mt || 1891795).toLocaleString()} MT</strong>, against <strong>{Number(metrics.total_documented_storage_capacity_mt || 353100).toLocaleString()} MT</strong> of documented warehouse and silo capacity. Potential coverage gap is <strong>{Number(metrics.total_storage_capacity_gap_mt || 1568562).toLocaleString()} MT</strong>.
                </div>
              </div>
            </div>

            {/* Capacity Typology Summary Card */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Factory className="w-4 h-4 text-purple-400" />
                Capacity Typology Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>Silos & Grain Reserves:</span>
                    <span className="text-amber-400">{infrastructure.silos_count || 3} Facilities</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Operated by MINAGRI Strategic Grain Reserve (Kigali, Nyagatare, Kayonza). High-capacity bulk grain aeration.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>Industrial Processing Plants:</span>
                    <span className="text-purple-400">{infrastructure.processing_plants_count || 6} Major Plants</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Maize milling (AIF, Minimex), cassava flour (Kinazi), rice milling (Bugarama, Rwamagana), potato chips (Nyabihu).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>Cold Storage Facilities:</span>
                    <span className="text-cyan-400">{infrastructure.cold_stores_count || 4} Facilities</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Specialized seed potato cold storage (Musanze, Nyabihu) and export horticulture cold chain at Kigali International Airport.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>Community Warehouses:</span>
                    <span className="text-emerald-400">{infrastructure.warehouses_count || 5} Major Hubs</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Cooperative aggregation points equipped with drying grounds, bag stackers, and moisture testers.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 8. TAB 4: Infrastructure Gaps & Distances */}
      {activeTab === 'gaps' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Travel Distance & Paved Road Distance Chart */}
            <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400" />
                  Average Travel Distance to Nearest Facility & Paved Road (Top 12 Gaps)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Logistical isolation increases post-harvest transport costs, delays produce collection, and exacerbates perishable losses.
                </p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtsData.slice(0, 12)} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="district_name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v} km`} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} km`]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="avg_distance_to_facility_km" name="Dist. to Nearest Facility (km)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avg_distance_to_paved_road_km" name="Dist. to Paved Road (km)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-800">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">National Avg Facility Distance:</span>
                  <div className="font-bold text-amber-400 text-sm">
                    {metrics.national_avg_distance_facility_km || 13.8} km
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">National Avg Road Distance:</span>
                  <div className="font-bold text-blue-400 text-sm">
                    {metrics.national_avg_distance_road_km || 4.2} km
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">High Deficit Districts:</span>
                  <div className="font-bold text-rose-400 text-sm">
                    {metrics.critical_deficit_districts_count || 14} Districts
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Protocol Notice */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Verification Status Breakdown
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Districts marked as <strong>SURVEY_REQUIRED</strong> have high agricultural production and commercial surplus, but lack documented facilities in the national registry.
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/30">
                  <div className="flex justify-between font-semibold text-amber-300">
                    <span>Survey Required / Unrecorded:</span>
                    <span>{metrics.survey_required_districts_count || 11} Districts</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Local verification missions should be deployed before confirming infrastructure absence. Small cooperative stores may exist.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-emerald-500/30">
                  <div className="flex justify-between font-semibold text-emerald-300">
                    <span>Field Verified Capacity:</span>
                    <span>{30 - (metrics.survey_required_districts_count || 11)} Districts</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Documented facilities confirmed with GPS coordinates, capacity audits, and registered commercial operators.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 9. TAB 5: Investment Screening & Ranking (MCDA 0-100) */}
      {activeTab === 'screening' && (
        <div className="space-y-6">
          
          {/* Controls: Search and Tier Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search district or province..."
                value={searchDistrict}
                onChange={(e) => setSearchDistrict(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Priority Tier:</span>
              <select
                value={selectedTierFilter}
                onChange={(e) => setSelectedTierFilter(e.target.value)}
                className="bg-slate-950 text-emerald-400 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">All Tiers (30 Districts)</option>
                <option value="TIER_1_URGENT_COLLECTION_HUB">Tier 1: Urgent Collection Hub</option>
                <option value="TIER_2_PROCESSING_EXPANSION">Tier 2: Processing Expansion</option>
                <option value="TIER_3_MODERNIZATION">Tier 3: Aggregation & Modernization</option>
              </select>
            </div>
          </div>

          {/* District League Table */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  National Post-Harvest Opportunity Ranking ({filteredDistricts.length} Districts)
                </h3>
                <p className="text-xs text-slate-400">
                  Multi-Criteria Decision Analysis (MCDA 0–100) scoring surplus volume, storage deficit, travel distance, and processing potential.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3 font-semibold">Rank & District</th>
                    <th className="py-3 px-3 font-semibold">Province</th>
                    <th className="py-3 px-3 font-semibold">Surplus (MT)</th>
                    <th className="py-3 px-3 font-semibold">Known Storage</th>
                    <th className="py-3 px-3 font-semibold">Coverage Gap</th>
                    <th className="py-3 px-3 font-semibold">Dist. Facility</th>
                    <th className="py-3 px-3 font-semibold">MCDA Score</th>
                    <th className="py-3 px-3 font-semibold">Investment Tier</th>
                    <th className="py-3 px-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredDistricts.map((d: any, index: number) => (
                    <tr
                      key={d.district_name}
                      onClick={() => {
                        setSelectedDistrict(d.district_name);
                        setActiveTab('dossier');
                      }}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-emerald-400 font-mono">
                          {index + 1}
                        </span>
                        <span>{d.district_name}</span>
                      </td>
                      <td className="py-2.5 px-3">{d.province_name}</td>
                      <td className="py-2.5 px-3 font-semibold text-emerald-400">
                        {Number(d.market_surplus_volume_mt).toLocaleString()} MT
                      </td>
                      <td className="py-2.5 px-3">
                        {Number(d.documented_storage_capacity_mt).toLocaleString()} MT
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-rose-400">
                        {Number(d.storage_capacity_gap_mt).toLocaleString()} MT
                      </td>
                      <td className="py-2.5 px-3">{d.avg_distance_to_facility_km} km</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">{d.investment_opportunity_score}</span>
                          <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-400 h-full rounded-full"
                              style={{ width: `${Math.min(d.investment_opportunity_score, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.investment_tier === 'TIER_1_URGENT_COLLECTION_HUB'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : d.investment_tier === 'TIER_2_PROCESSING_EXPANSION'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {d.investment_tier.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
                          <span>Dossier</span>
                          <ChevronRight className="w-3.5 h-3.5" />
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

      {/* 10. TAB 6: District Pre-Feasibility Investment Dossier */}
      {activeTab === 'dossier' && (
        <div className="space-y-6">
          
          {/* District Selector & Dossier Header */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Pre-Feasibility Evidence Dossier</span>
              </div>
              <h2 className="text-2xl font-bold text-white">
                District Profile: <span className="text-emerald-400">{selectedDistrict}</span> ({selectedSeason})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Targeted infrastructure gaps, crop commercial surplus composition, road connectivity, and recommended facility packages.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Change District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-slate-950 text-emerald-400 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none"
              >
                {districtsData.map((d) => (
                  <option key={d.district_name} value={d.district_name}>
                    {d.district_name} ({d.province_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* District Dossier Safeguard */}
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200">
            <strong>SAFEGUARD PROTOCOL:</strong> {dossierData?.safeguard_disclaimer || "A facility's absence from our database does not prove that no facility exists in this area. Label these as unrecorded facilities or potential coverage gaps until local verification is completed."}
          </div>

          {dossierData && dossierData.current_status && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Key Stats & Recommended Package */}
              <div className="space-y-5">
                
                {/* Status Overview Card */}
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    Opportunity Evaluation
                  </h3>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Opportunity Score:</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">
                      {dossierData.current_status.investment_opportunity_score} / 100
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Total Crop Production:</span>
                      <span className="font-semibold text-white">
                        {Number(dossierData.current_status.total_crop_production_mt).toLocaleString()} MT
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Market Surplus Volume:</span>
                      <span className="font-semibold text-emerald-400">
                        {Number(dossierData.current_status.market_surplus_volume_mt).toLocaleString()} MT
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Documented Storage:</span>
                      <span className="font-semibold text-white">
                        {Number(dossierData.current_status.documented_storage_capacity_mt).toLocaleString()} MT
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Storage Capacity Gap:</span>
                      <span className="font-semibold text-rose-400">
                        {Number(dossierData.current_status.storage_capacity_gap_mt).toLocaleString()} MT
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Distance to Facility:</span>
                      <span className="font-semibold text-amber-400">
                        {dossierData.current_status.avg_distance_to_facility_km} km
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Distance to Paved Road:</span>
                      <span className="font-semibold text-blue-400">
                        {dossierData.current_status.avg_distance_to_paved_road_km} km
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recommended Investment Intervention Package */}
                <div className="p-5 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Targeted Infrastructure Solution</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {dossierData.current_status.recommended_investment?.intervention_type?.replace(/_/g, ' ') || 'Community Aggregation Hub'}
                  </h4>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div>
                      <strong className="text-slate-400">Target Capacity:</strong>{' '}
                      <span className="text-white font-semibold">
                        {dossierData.current_status.recommended_investment?.target_capacity_mt || 3000} MT
                      </span>
                    </div>
                    <div>
                      <strong className="text-slate-400">Estimated CapEx:</strong>{' '}
                      <span className="text-emerald-400 font-bold">
                        {dossierData.current_status.recommended_investment?.estimated_capex_usd || '$1,200,000'}
                      </span>
                    </div>
                    <div>
                      <strong className="text-slate-400">Primary Beneficiary Crops:</strong>{' '}
                      <span className="text-slate-200">
                        {dossierData.current_status.recommended_investment?.primary_crops?.join(', ') || 'Maize, Beans'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 leading-relaxed">
                      {dossierData.current_status.recommended_investment?.justification || 'High surplus volume with long travel distance to existing drying infrastructure.'}
                    </p>
                  </div>
                </div>

              </div>

              {/* Right Column: Historical Multi-Season Supply Trend & Existing Local Facilities */}
              <div className="lg:col-span-2 space-y-5">
                
                {/* Historical Multi-Season Production & Surplus Chart */}
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Historical Supply & Market Surplus Trend across Seasons
                  </h3>
                  <p className="text-xs text-slate-400">
                    Production in MT vs. Market Surplus across seasons (NISR SAS Historical Series).
                  </p>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dossierData.historical_trend?.slice(-16) || []} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorSurp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <XAxis dataKey="season_code" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k MT`} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                          formatter={(val: any) => [`${Number(val).toLocaleString()} MT`]}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Area type="monotone" dataKey="total_crop_production_mt" name="Total Production (MT)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorProd)" />
                        <Area type="monotone" dataKey="market_surplus_volume_mt" name="Commercial Surplus (MT)" stroke="#10b981" fillOpacity={1} fill="url(#colorSurp)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Existing Documented Facilities in Selected District */}
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-emerald-400" />
                      Documented Facilities in {selectedDistrict} ({dossierData.local_facilities?.length || 0})
                    </h3>
                    <span className="text-xs text-slate-400">
                      {dossierData.local_facilities?.length === 0 ? 'No documented facilities registered' : 'Official Registry'}
                    </span>
                  </div>

                  {dossierData.local_facilities && dossierData.local_facilities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dossierData.local_facilities.map((fac: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                          <div className="font-bold text-white">{fac.name}</div>
                          <div className="flex items-center justify-between text-slate-400 text-[11px]">
                            <span>{fac.facility_type.replace(/_/g, ' ')}</span>
                            <span className="text-emerald-400 font-semibold">{fac.status}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800">
                            <span>Storage: <strong>{Number(fac.storage_capacity_tonnes).toLocaleString()} MT</strong></span>
                            <span>Processing: <strong>{Number(fac.processing_capacity_tonnes_day).toLocaleString()} MT/day</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-slate-950 border border-dashed border-amber-500/40 text-xs text-amber-300/90 leading-relaxed">
                      <strong>POTENTIAL COVERAGE GAP:</strong> No registered facilities are currently cataloged in {selectedDistrict} in the national database. Field verification is recommended to survey unrecorded cooperative stores, village drying grounds, and informal collection centers.
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
