import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Warehouse, Snowflake, Factory, MapPin, Search, Filter, 
  Layers, Navigation, ExternalLink, ShieldCheck, Download, ChevronRight, 
  Activity, Calendar, Award, Phone, CheckCircle2, AlertCircle, X, 
  Sparkles, RefreshCw, BarChart2, Eye, Compass, Info, ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Rwanda 30 Districts Geo Definition for SVG Map Background
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

// Coordinate projection helper: Converts Rwanda lat/lon to SVG (600x500 viewBox)
// Rwanda Bounding Box:
// Lon: ~28.86 (West) to ~30.90 (East) -> width ~2.04 deg
// Lat: ~ -1.04 (North) to ~ -2.84 (South) -> height ~1.80 deg
function projectCoordinatesToSvg(lon: number, lat: number): { x: number; y: number } {
  const minLon = 28.85;
  const maxLon = 30.92;
  const minLat = -2.86;
  const maxLat = -1.03;

  const svgMinX = 65;
  const svgMaxX = 585;
  const svgMinY = 40;
  const svgMaxY = 475;

  const normX = Math.max(0, Math.min(1, (lon - minLon) / (maxLon - minLon)));
  // SVG Y is inverted (North is top, min Y)
  const normY = Math.max(0, Math.min(1, (maxLat - lat) / (maxLat - minLat)));

  const x = Math.round(svgMinX + normX * (svgMaxX - svgMinX));
  const y = Math.round(svgMinY + normY * (svgMaxY - svgMinY));

  return { x, y };
}

export interface Facility {
  id: string;
  code: string;
  name: string;
  district: string;
  districtCode: string;
  province: string;
  type: string;
  subtype: string;
  status: string;
  owner: string;
  operator: string;
  storageCapacity: number;
  dryingCapacity: number;
  coldStorageCapacity: number;
  processingCapacity: number;
  yearEstablished: number;
  utilizationPct: number;
  commodities: string[];
  roadAccess: string;
  powerSource: string;
  waterAccess: string;
  longitude: number;
  latitude: number;
  lastVerifiedAt: string;
}

export default function AgriculturalFacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [summary, setSummary] = useState<any>({
    totalFacilities: 97,
    totalStorageCapacityTonnes: 743400,
    totalColdStorageTonnes: 128950,
    totalProcessingCapacityTonnesDay: 7003,
    avgUtilizationRatePct: 85,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState<'MAP' | 'LIST'>('MAP');

  // Active facility for detailed dossier inspection
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [hoveredFacility, setHoveredFacility] = useState<Facility | null>(null);

  useEffect(() => {
    fetchFacilities();
  }, [selectedType, selectedDistrict]);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'ALL') params.set('type', selectedType);
      if (selectedDistrict !== 'All Districts') params.set('district', selectedDistrict);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`http://localhost:3000/api/v1/infrastructure/facilities?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFacilities(data.facilities || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error('Error fetching facilities:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter facilities locally for instant search response
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchSearch =
        !searchQuery.trim() ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.commodities || []).some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = selectedStatus === 'ALL' || f.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [facilities, searchQuery, selectedStatus]);

  // Type styling helpers
  const getFacilityColor = (type: string) => {
    switch (type) {
      case 'SILO':
        return { bg: 'bg-amber-500', text: 'text-amber-800', border: 'border-amber-500', fill: '#F59E0B' };
      case 'COLD_STORAGE':
        return { bg: 'bg-cyan-500', text: 'text-cyan-800', border: 'border-cyan-500', fill: '#06B6D4' };
      case 'PROCESSING_PLANT':
        return { bg: 'bg-emerald-600', text: 'text-emerald-800', border: 'border-emerald-600', fill: '#16A34A' };
      case 'PACKING_FACILITY':
        return { bg: 'bg-blue-500', text: 'text-blue-800', border: 'border-blue-500', fill: '#3B82F6' };
      case 'AGGREGATION_CENTER':
        return { bg: 'bg-purple-500', text: 'text-purple-800', border: 'border-purple-500', fill: '#A855F7' };
      default:
        return { bg: 'bg-slate-500', text: 'text-slate-800', border: 'border-slate-500', fill: '#64748B' };
    }
  };

  const getFacilityIcon = (type: string) => {
    switch (type) {
      case 'SILO':
        return Warehouse;
      case 'COLD_STORAGE':
        return Snowflake;
      case 'PROCESSING_PLANT':
        return Factory;
      case 'PACKING_FACILITY':
        return Layers;
      default:
        return Building2;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-800">
      
      {/* 1. PAGE HEADER & NATIONAL INFRASTRUCTURE IDENTITY */}
      <div className="bg-gradient-to-r from-[#0F3822] via-[#164E2E] to-[#1C5F38] text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide uppercase">
              <Building2 className="w-3.5 h-3.5" />
              <span>National Post-Harvest Infrastructure Registry</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Rwanda Agricultural Facilities &amp; Value Addition Map
            </h1>
            <p className="text-emerald-100/90 text-sm max-w-2xl leading-relaxed">
              Consolidated spatial registry of strategic grain silos, cold storage chains, tea factories, coffee washing stations, industrial mills, and aggregation centers across all 30 districts of Rwanda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                const csvData = filteredFacilities.map(f => `"${f.name}","${f.code}","${f.district}","${f.province}","${f.type}","${f.storageCapacity}","${f.processingCapacity}","${f.operator}"`).join('\n');
                const blob = new Blob([`"Name","Code","District","Province","Type","Storage Capacity (MT)","Processing Capacity (MT/day)","Operator"\n${csvData}`], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Rwanda_Agri_Facilities_Registry_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
              }}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Facilities (CSV)</span>
            </button>
            <button 
              onClick={fetchFacilities}
              className="p-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 rounded-xl transition-all"
              title="Refresh Registry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 2. SUMMARY METRIC STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-emerald-500/20">
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold mb-1">
              <Building2 className="w-4 h-4" />
              <span>Verified Facilities</span>
            </div>
            <div className="text-xl md:text-2xl font-black text-white">
              {summary.totalFacilities || filteredFacilities.length}
            </div>
            <div className="text-[10px] text-emerald-200/70 mt-0.5">30 Districts Covered</div>
          </div>

          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold mb-1">
              <Warehouse className="w-4 h-4" />
              <span>Total Storage</span>
            </div>
            <div className="text-xl md:text-2xl font-black text-white">
              {Number(summary.totalStorageCapacityTonnes || 743400).toLocaleString()}{' '}
              <span className="text-xs font-medium text-amber-200">MT</span>
            </div>
            <div className="text-[10px] text-emerald-200/70 mt-0.5">Silos &amp; Warehouses</div>
          </div>

          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold mb-1">
              <Snowflake className="w-4 h-4" />
              <span>Cold Storage</span>
            </div>
            <div className="text-xl md:text-2xl font-black text-white">
              {Number(summary.totalColdStorageTonnes || 128950).toLocaleString()}{' '}
              <span className="text-xs font-medium text-cyan-200">MT</span>
            </div>
            <div className="text-[10px] text-emerald-200/70 mt-0.5">Horticulture &amp; Seed Chains</div>
          </div>

          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold mb-1">
              <Factory className="w-4 h-4" />
              <span>Processing Capacity</span>
            </div>
            <div className="text-xl md:text-2xl font-black text-white">
              {Number(summary.totalProcessingCapacityTonnesDay || 7003).toLocaleString()}{' '}
              <span className="text-xs font-medium text-emerald-200">MT/day</span>
            </div>
            <div className="text-[10px] text-emerald-200/70 mt-0.5">Mills, Tea, Coffee &amp; Dairies</div>
          </div>

          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold mb-1">
              <Activity className="w-4 h-4" />
              <span>Average Utilization</span>
            </div>
            <div className="text-xl md:text-2xl font-black text-white">
              {summary.avgUtilizationRatePct || 85}%
            </div>
            <div className="text-[10px] text-emerald-200/70 mt-0.5">Optimal Operating Band</div>
          </div>
        </div>

      </div>

      {/* 3. FILTERS & SEARCH CONTROL TOOLBAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search facilities, operators, commodities, or districts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Facility Type Selector */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">All Facility Types (97)</option>
            <option value="SILO">Strategic Silos</option>
            <option value="COLD_STORAGE">Cold Storage &amp; Packhouses</option>
            <option value="PROCESSING_PLANT">Processing Plants &amp; Mills</option>
            <option value="WAREHOUSE">Warehouses &amp; Depots</option>
            <option value="AGGREGATION_CENTER">Aggregation Centers</option>
          </select>

          {/* District Selector */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="All Districts">All 30 Districts</option>
            {RWANDA_DISTRICTS_GEO.map((d) => (
              <option key={d.name} value={d.name}>{d.name} ({d.province})</option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('MAP')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'MAP' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Interactive Map</span>
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'LIST' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Registry Table</span>
            </button>
          </div>
        </div>

      </div>

      {/* 4. MAIN INTERACTIVE MAP OF RWANDA WITH FACILITIES */}
      {viewMode === 'MAP' ? (
        <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/90 shadow-sm space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Rwanda Facilities Geographic Distribution
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing {filteredFacilities.length} facilities plotted across 30 administrative districts. Click any facility pin to open its comprehensive operational profile.
              </p>
            </div>

            {/* Map Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-xs" />
                <span>Silos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-500 border border-white shadow-xs" />
                <span>Cold Chain</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white shadow-xs" />
                <span>Processing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-500 border border-white shadow-xs" />
                <span>Aggregation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-500 border border-white shadow-xs" />
                <span>Warehouses</span>
              </div>
            </div>
          </div>

          {/* Interactive SVG Canvas */}
          <div className="w-full relative bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] rounded-2xl border border-slate-200/80 p-2 md:p-4 overflow-hidden">
            
            <svg 
              viewBox="0 0 640 520" 
              className="w-full h-auto max-h-[620px] drop-shadow-sm select-none"
            >
              {/* Lake Kivu Water Body Backdrop */}
              <path
                d="M 60 140 Q 55 220 85 280 Q 75 350 50 430 Q 80 440 90 380 Q 115 310 110 240 Q 120 180 80 140 Z"
                fill="#E0F2FE"
                stroke="#BAE6FD"
                strokeWidth="2"
              />
              <text x="68" y="270" fill="#0284C7" fontSize="10" fontWeight="bold" transform="rotate(-90 68 270)">
                LAKE KIVU
              </text>

              {/* 30 Rwanda District Boundaries */}
              <g className="district-polygons">
                {RWANDA_DISTRICTS_GEO.map((d) => {
                  const isFiltered = selectedDistrict === 'All Districts' || selectedDistrict === d.name;
                  const facilityCountInDist = facilities.filter(f => f.district.toLowerCase() === d.name.toLowerCase()).length;

                  return (
                    <g key={d.name} className="transition-all">
                      <path
                        d={d.path}
                        fill={isFiltered ? '#F0FDF4' : '#F8FAFC'}
                        stroke="#94A3B8"
                        strokeWidth={isFiltered ? '1.5' : '0.8'}
                        strokeDasharray={isFiltered ? 'none' : '2,2'}
                        className="transition-colors hover:fill-emerald-100/60 cursor-pointer"
                        onClick={() => setSelectedDistrict(selectedDistrict === d.name ? 'All Districts' : d.name)}
                      />
                      {/* District Label */}
                      <text
                        x={d.labelX}
                        y={d.labelY}
                        fill="#475569"
                        fontSize="9.5"
                        fontWeight="700"
                        textAnchor="middle"
                        className="pointer-events-none select-none opacity-80"
                      >
                        {d.name}
                      </text>
                      {facilityCountInDist > 0 && (
                        <text
                          x={d.labelX}
                          y={d.labelY + 11}
                          fill="#059669"
                          fontSize="8"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="pointer-events-none select-none"
                        >
                          ({facilityCountInDist})
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* Interactive Facility Pins Layer */}
              <g className="facility-markers">
                {filteredFacilities.map((fac) => {
                  const coords = projectCoordinatesToSvg(fac.longitude, fac.latitude);
                  const colors = getFacilityColor(fac.type);
                  const isHovered = hoveredFacility?.id === fac.id;
                  const isSelected = selectedFacility?.id === fac.id;

                  return (
                    <g
                      key={fac.id}
                      transform={`translate(${coords.x}, ${coords.y})`}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredFacility(fac)}
                      onMouseLeave={() => setHoveredFacility(null)}
                      onClick={() => setSelectedFacility(fac)}
                    >
                      {/* Pulse Ring for High Capacity or Selected Facilities */}
                      {(isSelected || fac.storageCapacity >= 10000 || isHovered) && (
                        <circle
                          r="12"
                          fill={colors.fill}
                          opacity="0.3"
                          className="animate-ping"
                        />
                      )}

                      {/* Outer Pin Halo */}
                      <circle
                        r={isHovered || isSelected ? 8.5 : 6}
                        fill={colors.fill}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        className="drop-shadow-md transition-transform duration-200 group-hover:scale-125"
                      />

                      {/* Center Core */}
                      <circle
                        r="2.5"
                        fill="#FFFFFF"
                        className="pointer-events-none"
                      />
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Floating Live Hover Card */}
            {hoveredFacility && (
              <div 
                className="absolute top-6 right-6 bg-slate-900/95 text-white backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl max-w-xs z-30 transition-all pointer-events-none animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${getFacilityColor(hoveredFacility.type).bg}`} />
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    {hoveredFacility.subtype.replace(/_/g, ' ')}
                  </span>
                </div>
                <h4 className="text-sm font-black text-white leading-snug">
                  {hoveredFacility.name}
                </h4>
                <div className="text-xs text-slate-300 mt-1 flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{hoveredFacility.district} District ({hoveredFacility.province})</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-700/80 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Storage Capacity</span>
                    <span className="font-bold text-white">{hoveredFacility.storageCapacity.toLocaleString()} MT</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Utilization</span>
                    <span className="font-bold text-emerald-400">{hoveredFacility.utilizationPct}%</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 mt-2 font-medium flex items-center justify-between">
                  <span>Operator: {hoveredFacility.operator}</span>
                  <span className="text-emerald-300 font-bold">Click to view dossier →</span>
                </div>
              </div>
            )}

            {/* Compass Rose */}
            <div className="absolute left-6 top-6 bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-slate-200/90 shadow-sm flex flex-col items-center pointer-events-none">
              <Compass className="w-5 h-5 text-emerald-700" />
              <span className="text-[9px] font-black text-slate-600 mt-0.5">NORTH</span>
            </div>

            {/* Bottom Map Controls Note */}
            <div className="absolute left-6 bottom-6 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-sm text-[11px] font-semibold text-slate-600 flex items-center gap-2 pointer-events-none">
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              <span>Click on any district to filter facilities or click on a facility pin to inspect details.</span>
            </div>

          </div>

        </div>
      ) : (
        /* 5. REGISTRY TABLE VIEW */
        <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Agricultural Facilities Directory ({filteredFacilities.length} Entries)
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Sorted by Storage Capacity
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-black border-b border-slate-200">
                  <th className="p-3">Facility Name</th>
                  <th className="p-3">Type &amp; Subtype</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Operator</th>
                  <th className="p-3 text-right">Storage (MT)</th>
                  <th className="p-3 text-right">Processing (MT/d)</th>
                  <th className="p-3 text-right">Utilization</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredFacilities.map((f) => {
                  const colors = getFacilityColor(f.type);
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{f.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{f.code}</div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${colors.bg}/15 ${colors.text}`}>
                          {f.subtype.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-800">{f.district}</span>
                        <span className="text-[10px] text-slate-400 block">{f.province}</span>
                      </td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{f.operator}</td>
                      <td className="p-3 text-right font-black text-slate-900">
                        {f.storageCapacity.toLocaleString()} MT
                      </td>
                      <td className="p-3 text-right font-bold text-slate-700">
                        {f.processingCapacity > 0 ? `${f.processingCapacity} MT` : '—'}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700">
                        {f.utilizationPct}%
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{f.status}</span>
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedFacility(f)}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-all"
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
        </div>
      )}

      {/* 6. FACILITY DETAIL DOSSIER MODAL / SLIDE-OUT DRAWER */}
      {selectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white p-6 rounded-t-3xl flex items-start justify-between relative">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/15 text-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified National Asset &bull; {selectedFacility.code}</span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  {selectedFacility.name}
                </h3>
                <p className="text-xs text-emerald-100 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{selectedFacility.district} District &bull; {selectedFacility.province} &bull; Coordinates: {selectedFacility.latitude}, {selectedFacility.longitude}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedFacility(null)}
                className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1">
              
              {/* Primary Key Metrics 4-Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Storage Capacity</span>
                  <span className="text-lg font-black text-slate-900">
                    {selectedFacility.storageCapacity.toLocaleString()} <span className="text-xs font-semibold text-slate-500">MT</span>
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Processing Capacity</span>
                  <span className="text-lg font-black text-slate-900">
                    {selectedFacility.processingCapacity > 0 ? selectedFacility.processingCapacity : '0'} <span className="text-xs font-semibold text-slate-500">MT/d</span>
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Cold Storage</span>
                  <span className="text-lg font-black text-cyan-700">
                    {selectedFacility.coldStorageCapacity > 0 ? selectedFacility.coldStorageCapacity.toLocaleString() : '0'} <span className="text-xs font-semibold text-slate-500">MT</span>
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Utilization Rate</span>
                  <span className="text-lg font-black text-emerald-700">
                    {selectedFacility.utilizationPct}%
                  </span>
                </div>
              </div>

              {/* Progress Utilization Bar */}
              <div className="space-y-1.5 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800">Operational Utilization Rate</span>
                  <span className="text-emerald-800">{selectedFacility.utilizationPct}% Optimal Capacity</span>
                </div>
                <div className="w-full h-2.5 bg-emerald-200/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all"
                    style={{ width: `${selectedFacility.utilizationPct}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Benchmarked against seasonal agricultural harvest flow in {selectedFacility.district} District.
                </span>
              </div>

              {/* Facility Details Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-700" />
                    <span>Operational Management</span>
                  </h4>
                  <div className="space-y-2 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Operator / Manager:</span>
                      <span className="font-bold text-slate-800 text-right">{selectedFacility.operator}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ownership Model:</span>
                      <span className="font-bold text-slate-800">{selectedFacility.owner}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Year Established:</span>
                      <span className="font-bold text-slate-800">{selectedFacility.yearEstablished || 2018}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Operational Status:</span>
                      <span className="font-bold text-emerald-700">{selectedFacility.status}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-blue-700" />
                    <span>Logistics &amp; Infrastructure</span>
                  </h4>
                  <div className="space-y-2 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Road Connectivity:</span>
                      <span className="font-bold text-slate-800">{selectedFacility.roadAccess}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Power Source:</span>
                      <span className="font-bold text-slate-800 text-right">{selectedFacility.powerSource}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Water Supply:</span>
                      <span className="font-bold text-slate-800">{selectedFacility.waterAccess}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Drying Capacity:</span>
                      <span className="font-bold text-slate-800">{selectedFacility.dryingCapacity} MT/day</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Commodities Handled */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Primary Agricultural Commodities Handled</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedFacility.commodities || ['Maize', 'Beans', 'Rice']).map((comm) => (
                    <span 
                      key={comm} 
                      className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold"
                    >
                      {comm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <Link
                  to="/admin/post-harvest"
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <span>Open Module 4 (Post-Harvest Intelligence)</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      alert(`Exporting official facility dossier for ${selectedFacility.name} (Code: ${selectedFacility.code}) to PDF format...`);
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Dossier PDF</span>
                  </button>
                  <button
                    onClick={() => setSelectedFacility(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
