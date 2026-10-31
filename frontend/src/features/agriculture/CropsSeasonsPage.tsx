import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { apiUrl } from '../../config/api';
import { 
  Sprout, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ShieldAlert, 
  ChevronRight, ArrowUpRight, ArrowDownRight, Filter, Download, 
  MapPin, RefreshCw, FileText, Layers, Droplets, Thermometer, 
  Sparkles, Info, HelpCircle, BarChart3, Calendar, Award, Database,
  Check, FileSpreadsheet, Search, X, Compass, ExternalLink, Globe,
  SlidersHorizontal, ArrowRight, Eye, EyeOff
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  CartesianGrid, Cell, AreaChart, Area, LineChart, Line, Legend
} from 'recharts';

export type MapIndicatorType = 'production_tonnes' | 'cultivated_area_ha' | 'yield_t_ha';

export interface DistrictStat {
  district_id: string;
  district_name: string;
  district_code: string;
  province_name: string;
  production_tonnes: number | null;
  prev_production_tonnes: number | null;
  production_change_pct: number | null;
  cultivated_area_ha: number | null;
  harvested_area_ha: number | null;
  yield_t_ha: number | null;
  national_share_pct: number;
  rank: number;
  has_data: boolean;
  dominant_crops: Array<{
    crop_name: string;
    production_tonnes: number;
    area_ha: number;
    yield_t_ha: number;
    share_pct: number;
  }>;
}

export default function CropsSeasonsPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);

  // Filter States
  const [selectedSeason, setSelectedSeason] = useState<string>('2025A');
  const [selectedCrop, setSelectedCrop] = useState<string>('All crops');
  const [activeIndicator, setActiveIndicator] = useState<MapIndicatorType>('production_tonnes');
  const [selectedProvince, setSelectedProvince] = useState<string>('ALL');
  const [compareSeason, setCompareSeason] = useState<string>('');
  const [searchDistrict, setSearchDistrict] = useState<string>('');
  const [tableSearch, setTableSearch] = useState<string>('');

  // Selected District for Side Panel
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('Nyagatare');
  const [districtTab, setDistrictTab] = useState<'OVERVIEW' | 'CROPS' | 'TRENDS' | 'QUALITY'>('OVERVIEW');

  // Refs for map callbacks to prevent stale closures
  const districtsRef = useRef<DistrictStat[]>([]);
  const selectedDistrictNameRef = useRef<string>('Nyagatare');
  const geojsonLoadedRef = useRef<boolean>(false);
  const activeIndicatorRef = useRef<MapIndicatorType>('production_tonnes');

  // Backend Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableSeasons, setAvailableSeasons] = useState<Array<{ code: string; label: string }>>([]);
  const [availableCrops, setAvailableCrops] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [nationalSummary, setNationalSummary] = useState<any>(null);
  const [districts, setDistricts] = useState<DistrictStat[]>([]);
  const [seasonalTrends, setSeasonalTrends] = useState<any[]>([]);
  const [cropComparisonTable, setCropComparisonTable] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any>({ large_increases: [], large_decreases: [], stable_crops: [] });
  const [tableSortField, setTableSortField] = useState<string>('current_production_tonnes');
  const [tableSortAsc, setTableSortAsc] = useState<boolean>(false);

  // 1. Fetch Decision Workspace Data from Backend
  const fetchDecisionWorkspace = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('season', selectedSeason);
      if (selectedCrop) params.append('crop', selectedCrop);
      if (compareSeason) params.append('compareSeason', compareSeason);
      if (selectedProvince) params.append('province', selectedProvince);

      const url = apiUrl(`crop-statistics/decision-workspace?${params.toString()}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load crops intelligence`);

      const data = await res.json();

      setNationalSummary(data.nationalSummary || null);
      const districtList: DistrictStat[] = data.districts || [];
      setDistricts(districtList);
      districtsRef.current = districtList;
      setSeasonalTrends(data.seasonalTrends || []);
      setCropComparisonTable(data.cropComparisonTable || []);
      setAlerts(data.alerts || { large_increases: [], large_decreases: [], stable_crops: [] });

      if (data.meta?.availableSeasons) {
        setAvailableSeasons(data.meta.availableSeasons);
      }
      if (data.meta?.availableCrops) {
        setAvailableCrops(data.meta.availableCrops);
      }
      if (data.meta?.compareSeason && !compareSeason) {
        setCompareSeason(data.meta.compareSeason);
      }

      // If current selected district is not set or not in list, pick the highest producing
      if (districtList.length > 0) {
        const exists = districtList.some((d: DistrictStat) => d.district_name.toLowerCase() === selectedDistrictName.toLowerCase());
        if (!exists) {
          setSelectedDistrictName(districtList[0].district_name);
          selectedDistrictNameRef.current = districtList[0].district_name;
        }
      }
    } catch (err: any) {
      console.error('Error fetching decision workspace data:', err);
      setError(err.message || 'Unable to connect to crop statistics server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisionWorkspace();
  }, [selectedSeason, selectedCrop, compareSeason]);

  // Selected district object
  const selectedDistrict = useMemo(() => {
    return districts.find(d => d.district_name.toLowerCase() === selectedDistrictName.toLowerCase()) || districts[0] || null;
  }, [districts, selectedDistrictName]);

  // Indicator Label, Unit & Extents
  const indicatorConfig = useMemo(() => {
    switch (activeIndicator) {
      case 'production_tonnes':
        return {
          label: 'Total Production',
          unit: 'Tonnes',
          getValue: (d: DistrictStat) => d.production_tonnes,
          format: (v: number | null) => v !== null ? `${Math.round(v).toLocaleString()} MT` : 'No data recorded',
          description: 'Gross agricultural output harvested in the selected season.',
        };
      case 'cultivated_area_ha':
        return {
          label: 'Cultivated Area',
          unit: 'Hectares',
          getValue: (d: DistrictStat) => d.cultivated_area_ha,
          format: (v: number | null) => v !== null ? `${Math.round(v).toLocaleString()} ha` : 'No data recorded',
          description: 'Physical land area under cultivation during the agricultural cycle.',
        };
      case 'yield_t_ha':
        return {
          label: 'Crop Yield',
          unit: 't/ha',
          getValue: (d: DistrictStat) => d.yield_t_ha,
          format: (v: number | null) => v !== null ? `${v.toFixed(2)} t/ha` : 'No data recorded',
          description: 'Output per harvested hectare (Biological yield).',
        };
    }
  }, [activeIndicator]);

  // Dynamic Quantiles / Thresholds for Legend
  const extents = useMemo(() => {
    const validVals = districts
      .map(d => indicatorConfig.getValue(d))
      .filter((v): v is number => typeof v === 'number' && !isNaN(v) && v > 0)
      .sort((a, b) => a - b);

    if (validVals.length === 0) {
      return { min: 0, p25: 25, p50: 50, p75: 75, max: 100 };
    }

    const min = validVals[0];
    const max = validVals[validVals.length - 1];
    const p25 = validVals[Math.floor(validVals.length * 0.25)] ?? min;
    const p50 = validVals[Math.floor(validVals.length * 0.50)] ?? (min + max) / 2;
    const p75 = validVals[Math.floor(validVals.length * 0.75)] ?? max;
    return { min, p25, p50, p75, max };
  }, [districts, indicatorConfig]);

  // Color Ramp: 5 sequential green shades + neutral gray for missing data
  const greenRamp = ['#E8F5E9', '#A5D6A7', '#4CAF50', '#2E7D32', '#1B5E20'];
  const missingColor = '#94A3B8'; // Neutral slate gray for missing/unreported data

  const getDistrictColor = (d: DistrictStat): string => {
    const val = indicatorConfig.getValue(d);
    if (val === null || val === undefined || !d.has_data) {
      return missingColor;
    }
    const { min, max, p25, p50, p75 } = extents;
    if (max === min) return greenRamp[2];
    if (val <= p25) return greenRamp[0];
    if (val <= p50) return greenRamp[1];
    if (val <= p75) return greenRamp[2];
    if (val < max) return greenRamp[3];
    return greenRamp[4];
  };

  // 2. Initialize MapLibre GL JS
  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    // Use OpenStreetMap standard tiles for guaranteed reliability across all environments
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors, NISR Rwanda',
          },
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [29.98, -1.94],
      zoom: 8.3,
      minZoom: 7.2,
      maxZoom: 14,
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    map.current.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

    map.current.on('load', async () => {
      if (!map.current) return;

      try {
        const res = await fetch('/rwanda-districts.geojson');
        const geojson = await res.json();
        geojsonLoadedRef.current = true;

        if (!map.current.getSource('rwanda-districts')) {
          map.current.addSource('rwanda-districts', {
            type: 'geojson',
            data: geojson,
          });

          // Build match expression from current districts state if available
          let initialFill: any = '#4CAF50';
          const currentList = districtsRef.current;
          if (currentList && currentList.length > 0) {
            const matchExpr: any[] = ['match', ['get', 'shapeName']];
            for (const d of currentList) {
              matchExpr.push(d.district_name, getDistrictColor(d));
            }
            matchExpr.push(missingColor);
            initialFill = matchExpr;
          }

          // District Fill Layer
          map.current.addLayer({
            id: 'district-fill',
            type: 'fill',
            source: 'rwanda-districts',
            paint: {
              'fill-color': initialFill,
              'fill-opacity': 0.82,
            },
          });

          // District Boundary Lines
          map.current.addLayer({
            id: 'district-borders',
            type: 'line',
            source: 'rwanda-districts',
            paint: {
              'line-color': '#0F172A',
              'line-width': 1.3,
              'line-opacity': 0.75,
            },
          });

          // Selected District Glowing Highlight Border
          map.current.addLayer({
            id: 'district-selected-border',
            type: 'line',
            source: 'rwanda-districts',
            filter: ['==', 'shapeName', selectedDistrictNameRef.current || ''],
            paint: {
              'line-color': '#0D47A1',
              'line-width': 3.5,
              'line-opacity': 1.0,
            },
          });

          // Fit map bounds to Rwanda territory
          map.current.fitBounds([
            [28.86, -2.84],
            [30.90, -1.05]
          ], { padding: 25 });

          // Hover interaction
          map.current.on('mousemove', 'district-fill', (e) => {
            if (!map.current || !e.features || e.features.length === 0) return;
            map.current.getCanvas().style.cursor = 'pointer';

            const shapeName = e.features[0].properties?.shapeName;
            if (!shapeName) return;

            const district = districtsRef.current.find(d => d.district_name.toLowerCase() === shapeName.toLowerCase());
            if (!district) return;

            const val = indicatorConfig.getValue(district);
            const formatted = indicatorConfig.format(val);

            if (!hoverPopupRef.current) {
              hoverPopupRef.current = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
                offset: 12,
              });
            }

            hoverPopupRef.current
              .setLngLat(e.lngLat)
              .setHTML(`
                <div style="font-family: inherit; padding: 6px 10px; min-width: 175px;">
                  <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                    <span style="font-weight: 800; font-size: 14px; color: #0F172A;">${district.district_name}</span>
                    <span style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">${district.province_name}</span>
                  </div>
                  <div style="font-size: 11px; color: #475569; margin-bottom: 2px;">
                    ${selectedCrop} · ${indicatorConfig.label}:
                  </div>
                  <div style="font-size: 16px; font-weight: 800; color: #166534; margin-bottom: 6px;">
                    ${formatted}
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 4px;">
                    <span>Rank: <b>#${district.rank} of 30</b></span>
                    <span>Share: <b>${district.national_share_pct}%</b></span>
                  </div>
                </div>
              `)
              .addTo(map.current);
          });

          map.current.on('mouseleave', 'district-fill', () => {
            if (map.current) map.current.getCanvas().style.cursor = '';
            if (hoverPopupRef.current) hoverPopupRef.current.remove();
          });

          // Click on district polygon
          map.current.on('click', 'district-fill', (e) => {
            if (!e.features || e.features.length === 0) return;
            const shapeName = e.features[0].properties?.shapeName;
            if (shapeName) {
              setSelectedDistrictName(shapeName);
              selectedDistrictNameRef.current = shapeName;
            }
          });
        }
      } catch (err) {
        console.error('Failed to load district boundaries GeoJSON:', err);
      }
    });

    const handleResize = () => {
      map.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    const initialResizeTimer = setTimeout(() => {
      map.current?.resize();
    }, 300);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(initialResizeTimer);
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // 3. Update Choropleth Colors when districts or indicator change
  useEffect(() => {
    districtsRef.current = districts;
    selectedDistrictNameRef.current = selectedDistrictName;
    activeIndicatorRef.current = activeIndicator;

    if (!map.current || !map.current.isStyleLoaded() || !geojsonLoadedRef.current || districts.length === 0) return;
    if (!map.current.getLayer('district-fill')) return;

    const matchExpression: any[] = ['match', ['get', 'shapeName']];

    for (const d of districts) {
      const color = getDistrictColor(d);
      matchExpression.push(d.district_name, color);
    }
    matchExpression.push(missingColor);

    map.current.setPaintProperty('district-fill', 'fill-color', matchExpression as any);

    if (map.current.getLayer('district-selected-border')) {
      map.current.setFilter('district-selected-border', ['==', 'shapeName', selectedDistrictName || ''] as any);
    }

    map.current.resize();
  }, [districts, activeIndicator, selectedDistrictName, extents]);

  // Sortable Crop Comparison Table
  const sortedTableData = useMemo(() => {
    return [...cropComparisonTable]
      .filter((c: any) => {
        if (!tableSearch.trim()) return true;
        return c.crop_name.toLowerCase().includes(tableSearch.toLowerCase()) ||
               c.category.toLowerCase().includes(tableSearch.toLowerCase());
      })
      .sort((a: any, b: any) => {
        const valA = a[tableSortField] ?? 0;
        const valB = b[tableSortField] ?? 0;
        if (typeof valA === 'string') {
          return tableSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return tableSortAsc ? valA - valB : valB - valA;
      });
  }, [cropComparisonTable, tableSearch, tableSortField, tableSortAsc]);

  // Export Filtered Table to CSV
  const handleExportCSV = () => {
    const headers = ['Crop Name', 'Category', `Selected Season (${selectedSeason}) Production MT`, `Compare Season (${compareSeason}) Production MT`, 'Change MT', 'Change %', 'Yield t/ha', 'Cultivated ha', 'National Share %', 'Leading District'];
    const rows = sortedTableData.map(c => [
      c.crop_name,
      c.category,
      c.current_production_tonnes,
      c.prev_production_tonnes !== null ? c.prev_production_tonnes : 'N/A',
      c.change_tonnes !== null ? c.change_tonnes : 'N/A',
      c.change_pct !== null ? `${c.change_pct}%` : 'N/A',
      c.current_yield_t_ha,
      c.current_area_ha,
      `${c.national_share_pct}%`,
      c.leading_district ? `${c.leading_district.name} (${c.leading_district.production_tonnes} MT)` : 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rwanda_Crops_${selectedCrop}_${selectedSeason}_Comparison.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans select-none animate-in fade-in duration-300">
      
      {/* 1. Page Header & Planning Workspace Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-emerald-500/20">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              National Agricultural Planner · Crops & Seasons
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Sprout className="w-8 h-8 text-emerald-400" />
              National Crop Production Intelligence
            </h1>
            <p className="text-emerald-100/70 text-sm mt-1 max-w-3xl leading-relaxed">
              National agricultural decision-making workspace. Assess where Rwanda produces the most, track production variations across seasons, detect expanding or declining crops, and target agricultural interventions with real NISR-derived data.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              onClick={fetchDecisionWorkspace}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-emerald-300 text-xs font-bold transition-all flex items-center gap-2 border border-slate-700 shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-950"
            >
              <Download className="w-3.5 h-3.5" />
              Export Dataset
            </button>
          </div>
        </div>
      </div>

      {/* 2. Unified Master Filter Bar */}
      <div className="bg-surface border border-border-main rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-main">
          <div className="flex items-center gap-2 text-xs font-bold text-text-main uppercase tracking-wider">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            Decision-Making Parameters (Controls All Visualizations)
          </div>
          <span className="text-[11px] text-muted">
            All maps, charts, comparisons, and district dossiers sync to these 4 parameters.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Season Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-primary" /> Monitored Season
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full bg-background border border-border-main rounded-xl px-3 py-2 text-xs font-bold text-text-main focus:outline-none focus:border-primary cursor-pointer"
            >
              {availableSeasons.map(s => (
                <option key={s.code} value={s.code}>
                  {s.label} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Crop Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
              <Sprout className="w-3 h-3 text-agriculture" /> Crop Focus
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full bg-background border border-border-main rounded-xl px-3 py-2 text-xs font-bold text-text-main focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="All crops">🌾 All Crops (National Total)</option>
              {availableCrops.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.category})
                </option>
              ))}
            </select>
          </div>

          {/* Map Indicator Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
              <BarChart3 className="w-3 h-3 text-primary" /> Map Indicator
            </label>
            <select
              value={activeIndicator}
              onChange={(e) => setActiveIndicator(e.target.value as MapIndicatorType)}
              className="w-full bg-background border border-border-main rounded-xl px-3 py-2 text-xs font-bold text-text-main focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="production_tonnes">Total Production (Tonnes)</option>
              <option value="cultivated_area_ha">Cultivated Area (Hectares)</option>
              <option value="yield_t_ha">Biological Yield (t/ha)</option>
            </select>
          </div>

          {/* Geographic Scope Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-teal-600" /> Geographic Scope
            </label>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full bg-background border border-border-main rounded-xl px-3 py-2 text-xs font-bold text-text-main focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Districts — National View</option>
              <option value="Northern Province">Northern Province</option>
              <option value="Southern Province">Southern Province</option>
              <option value="Eastern Province">Eastern Province</option>
              <option value="Western Province">Western Province</option>
              <option value="Kigali City">Kigali City</option>
            </select>
          </div>

          {/* Season Comparison Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-amber-600" /> Comparison Season
            </label>
            <select
              value={compareSeason}
              onChange={(e) => setCompareSeason(e.target.value)}
              className="w-full bg-background border border-border-main rounded-xl px-3 py-2 text-xs font-bold text-text-main focus:outline-none focus:border-primary cursor-pointer"
            >
              {availableSeasons.map(s => (
                <option key={s.code} value={s.code}>
                  Compare with {s.code}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* 3. National Performance Summary Cards */}
      {nationalSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Production Card */}
          <div className="bg-surface border border-border-main rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between text-muted text-xs font-bold uppercase tracking-wider mb-1">
              <span>Total Production</span>
              <Sprout className="w-4 h-4 text-agriculture" />
            </div>
            <div className="text-2xl font-black text-text-main mt-1">
              {(nationalSummary.total_production_tonnes).toLocaleString()} <span className="text-sm font-bold text-muted">MT</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border-main">
              <span className="text-muted">vs {nationalSummary.compareSeason}:</span>
              {nationalSummary.production_change_pct !== null ? (
                <span className={`font-bold flex items-center gap-0.5 ${
                  nationalSummary.production_change_pct >= 0 ? 'text-agriculture' : 'text-danger'
                }`}>
                  {nationalSummary.production_change_pct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {nationalSummary.production_change_pct > 0 ? '+' : ''}{nationalSummary.production_change_pct}%
                </span>
              ) : (
                <span className="text-muted">No comparison</span>
              )}
            </div>
          </div>

          {/* Cultivated Area Card */}
          <div className="bg-surface border border-border-main rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between text-muted text-xs font-bold uppercase tracking-wider mb-1">
              <span>Cultivated Area</span>
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-black text-text-main mt-1">
              {(nationalSummary.total_cultivated_area_ha).toLocaleString()} <span className="text-sm font-bold text-muted">ha</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border-main">
              <span className="text-muted">Harvested Area:</span>
              <span className="font-bold text-text-main">
                {nationalSummary.total_harvested_area_ha.toLocaleString()} ha
              </span>
            </div>
          </div>

          {/* Average Yield (Area-Weighted Method) */}
          <div className="bg-surface border border-border-main rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between text-muted text-xs font-bold uppercase tracking-wider mb-1">
              <span className="flex items-center gap-1">
                Average Yield
                <span title="Calculated as Total Production divided by Total Valid Harvested Area. NOT a simple average of district yields.">
                  <HelpCircle className="w-3 h-3 text-muted cursor-pointer" />
                </span>
              </span>
              <Award className="w-4 h-4 text-warning" />
            </div>
            <div className="text-2xl font-black text-text-main mt-1">
              {nationalSummary.weighted_yield_t_ha} <span className="text-sm font-bold text-muted">t/ha</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border-main">
              <span className="text-muted">Area-Weighted:</span>
              {nationalSummary.yield_change_pct !== null ? (
                <span className={`font-bold flex items-center gap-0.5 ${
                  nationalSummary.yield_change_pct >= 0 ? 'text-agriculture' : 'text-danger'
                }`}>
                  {nationalSummary.yield_change_pct > 0 ? '+' : ''}{nationalSummary.yield_change_pct}%
                </span>
              ) : (
                <span className="text-muted">Verified Valid</span>
              )}
            </div>
          </div>

          {/* District Data Coverage Card */}
          <div className="bg-surface border border-border-main rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between text-muted text-xs font-bold uppercase tracking-wider mb-1">
              <span>District Data Coverage</span>
              <CheckCircle2 className="w-4 h-4 text-primary-light" />
            </div>
            <div className="text-2xl font-black text-text-main mt-1">
              {nationalSummary.districts_reporting} <span className="text-sm font-bold text-muted">/ {nationalSummary.districts_expected} Districts</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border-main">
              <span className="text-muted">Completeness:</span>
              <span className="font-bold text-agriculture">
                {nationalSummary.data_coverage_pct}% Reported
              </span>
            </div>
          </div>

        </div>
      )}

      {/* 4. Main Workspace: Rwanda Production Map (65%) + District Side Panel (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Rwanda Production Map (Occupies 7 cols on desktop ~ 60-70%) */}
        <div className="lg:col-span-7 bg-surface border border-border-main rounded-2xl shadow-sm overflow-hidden flex flex-col h-[650px] relative">
          
          {/* Map Sub-Header */}
          <div className="p-4 border-b border-border-main flex items-center justify-between bg-background/50 z-10 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-agriculture" />
                <h2 className="text-sm font-extrabold text-text-main uppercase tracking-wider">
                  Rwanda Agricultural Production Map
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-agriculture-soft text-agriculture border border-agriculture/20">
                  Interactive GIS
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Displaying <b>{selectedCrop}</b> · <b>{indicatorConfig.label}</b> ({selectedSeason}) across Rwanda's 30 districts.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted hidden sm:inline">District:</span>
              <span className="text-xs font-extrabold text-primary bg-primary-soft px-2.5 py-1 rounded-lg">
                {selectedDistrict?.district_name || 'Select District'}
              </span>
            </div>
          </div>

          {/* Map Canvas */}
          <div className="flex-1 w-full relative min-h-[560px] overflow-hidden">
            <div 
              ref={mapContainer} 
              className="w-full h-full" 
              style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            />

            {/* Dynamic Map Legend Overlay */}
            <div className="absolute bottom-5 left-4 z-10 bg-white/95 backdrop-blur-md border border-border-main rounded-xl p-3 shadow-xl max-w-xs text-xs">
              <div className="flex items-center justify-between font-bold text-text-main mb-1.5">
                <span>{indicatorConfig.label}</span>
                <span className="text-[10px] text-muted font-normal">({indicatorConfig.unit})</span>
              </div>

              {/* Gradient Bar */}
              <div className="flex h-3 rounded-full overflow-hidden mb-1.5 border border-border-main">
                {greenRamp.map((color, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: color }} />
                ))}
              </div>

              {/* Quantiles / Scale Numbers */}
              <div className="flex justify-between text-[10px] text-muted font-semibold">
                <span>{indicatorConfig.format(extents.min)}</span>
                <span>{indicatorConfig.format(extents.p50)}</span>
                <span>{indicatorConfig.format(extents.max)}</span>
              </div>

              {/* Missing data explanation */}
              <div className="mt-2 pt-2 border-t border-border-main flex items-center gap-2 text-[10px] text-muted">
                <div className="w-3 h-3 rounded bg-[#94A3B8] shrink-0" />
                <span>Neutral gray denotes missing/unreported survey records (not zero production).</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: District Intelligence Panel (Occupies 5 cols on desktop ~ 35%) */}
        <div className="lg:col-span-5 bg-surface border border-border-main rounded-2xl shadow-sm overflow-hidden flex flex-col h-[650px]">
          
          {selectedDistrict ? (
            <div className="flex flex-col h-full">
              
              {/* District Panel Header */}
              <div className="p-4 border-b border-border-main bg-background/60 shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-text-main">
                        {selectedDistrict.district_name}
                      </h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-surface border border-border-main text-muted">
                        {selectedDistrict.province_name}
                      </span>
                    </div>
                    <div className="text-xs text-muted flex items-center gap-3 mt-1">
                      <span>Production Rank: <b className="text-agriculture">#{selectedDistrict.rank} of 30</b></span>
                      <span>•</span>
                      <span>National Share: <b className="text-primary">{selectedDistrict.national_share_pct}%</b></span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded text-xs font-extrabold uppercase tracking-wider border ${
                    selectedDistrict.has_data
                      ? 'bg-agriculture-soft text-agriculture border-agriculture/30'
                      : 'bg-slate-100 text-slate-500 border-slate-300'
                  }`}>
                    {selectedDistrict.has_data ? 'Surveyed' : 'Missing Data'}
                  </span>
                </div>

                {/* District Key Metric Cards */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="bg-surface p-2.5 rounded-xl border border-border-main text-center">
                    <div className="text-[10px] text-muted font-bold uppercase">Production</div>
                    <div className="text-sm font-extrabold text-text-main mt-0.5">
                      {selectedDistrict.production_tonnes !== null 
                        ? `${Math.round(selectedDistrict.production_tonnes).toLocaleString()} MT` 
                        : '—'}
                    </div>
                  </div>

                  <div className="bg-surface p-2.5 rounded-xl border border-border-main text-center">
                    <div className="text-[10px] text-muted font-bold uppercase">Cultivated</div>
                    <div className="text-sm font-extrabold text-primary mt-0.5">
                      {selectedDistrict.cultivated_area_ha !== null 
                        ? `${Math.round(selectedDistrict.cultivated_area_ha).toLocaleString()} ha` 
                        : '—'}
                    </div>
                  </div>

                  <div className="bg-surface p-2.5 rounded-xl border border-border-main text-center">
                    <div className="text-[10px] text-muted font-bold uppercase">Yield</div>
                    <div className="text-sm font-extrabold text-agriculture mt-0.5">
                      {selectedDistrict.yield_t_ha !== null 
                        ? `${selectedDistrict.yield_t_ha} t/ha` 
                        : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* District Detail Tabs */}
              <div className="bg-background/80 border-b border-border-main px-3 flex items-center gap-1 shrink-0 text-xs font-bold">
                <button
                  onClick={() => setDistrictTab('OVERVIEW')}
                  className={`py-2 px-3 border-b-2 transition-colors ${
                    districtTab === 'OVERVIEW'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-text-main'
                  }`}
                >
                  Overview
                </button>

                <button
                  onClick={() => setDistrictTab('CROPS')}
                  className={`py-2 px-3 border-b-2 transition-colors ${
                    districtTab === 'CROPS'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-text-main'
                  }`}
                >
                  Top Crops
                </button>

                <button
                  onClick={() => setDistrictTab('TRENDS')}
                  className={`py-2 px-3 border-b-2 transition-colors ${
                    districtTab === 'TRENDS'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-text-main'
                  }`}
                >
                  Seasonal Trends
                </button>

                <button
                  onClick={() => setDistrictTab('QUALITY')}
                  className={`py-2 px-3 border-b-2 transition-colors ${
                    districtTab === 'QUALITY'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-text-main'
                  }`}
                >
                  Data Quality
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4 text-xs">
                
                {/* TAB 1: OVERVIEW */}
                {districtTab === 'OVERVIEW' && (
                  <div className="space-y-4">
                    <div className="bg-background/50 p-3 rounded-xl border border-border-main space-y-2">
                      <div className="font-bold text-text-main flex items-center justify-between">
                        <span>Seasonal Production Trajectory</span>
                        {selectedDistrict.production_change_pct !== null && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            selectedDistrict.production_change_pct >= 0 ? 'bg-agriculture-soft text-agriculture' : 'bg-red-50 text-danger'
                          }`}>
                            {selectedDistrict.production_change_pct > 0 ? '+' : ''}{selectedDistrict.production_change_pct}%
                          </span>
                        )}
                      </div>
                      <p className="text-muted leading-relaxed text-[11px]">
                        In {selectedSeason}, {selectedDistrict.district_name} produced{' '}
                        <b>{selectedDistrict.production_tonnes?.toLocaleString() || 0} tonnes</b> of {selectedCrop}, accounting for{' '}
                        <b className="text-primary">{selectedDistrict.national_share_pct}%</b> of national output. Compared to {compareSeason}, production changed by{' '}
                        <b>{selectedDistrict.production_change_pct !== null ? `${selectedDistrict.production_change_pct}%` : 'N/A'}</b>.
                      </p>
                    </div>

                    {/* Dominant Crops List */}
                    <div>
                      <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                        Leading Crops in {selectedDistrict.district_name}
                      </div>
                      <div className="space-y-2">
                        {selectedDistrict.dominant_crops.map((c, i) => (
                          <div key={i} className="p-2 bg-surface rounded-lg border border-border-main flex items-center justify-between">
                            <div>
                              <div className="font-bold text-text-main">{c.crop_name}</div>
                              <div className="text-[10px] text-muted">{c.area_ha.toLocaleString()} ha · {c.yield_t_ha} t/ha</div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-agriculture">{c.production_tonnes.toLocaleString()} MT</div>
                              <div className="text-[10px] text-muted">{c.share_pct}% share</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: CROPS */}
                {districtTab === 'CROPS' && (
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                      Crop Share Distribution
                    </div>
                    {selectedDistrict.dominant_crops.map((c, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{c.crop_name}</span>
                          <span className="text-muted">{c.production_tonnes.toLocaleString()} MT ({c.share_pct}%)</span>
                        </div>
                        <div className="w-full bg-background h-2 rounded-full overflow-hidden border border-border-main">
                          <div 
                            className="bg-agriculture h-full rounded-full"
                            style={{ width: `${Math.min(100, c.share_pct * 2)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 3: TRENDS */}
                {districtTab === 'TRENDS' && (
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-muted uppercase tracking-wider">
                      Multi-Season Historical Records
                    </div>
                    <div className="p-3 bg-background/50 rounded-xl border border-border-main text-[11px] text-muted">
                      Historical production across surveyed NISR seasons. Seasonal fluctuations reflect weather patterns, rainfall distribution, and acreage adjustments.
                    </div>
                    <div className="divide-y divide-border-main border border-border-main rounded-xl overflow-hidden bg-surface">
                      {seasonalTrends.slice(-5).map((t, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                          <span className="font-bold text-text-main">{t.season_code} ({t.year})</span>
                          <span className="font-bold text-agriculture">{t.production_tonnes.toLocaleString()} MT</span>
                          <span className="text-muted">{t.yield_t_ha} t/ha</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: DATA QUALITY */}
                {districtTab === 'QUALITY' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-primary-soft/50 rounded-xl border border-primary/20 space-y-1.5 text-[11px] text-text-main">
                      <div className="font-bold text-primary flex items-center gap-1">
                        <Database className="w-3.5 h-3.5" />
                        NISR Data Provenance & Lineage
                      </div>
                      <p className="text-muted leading-relaxed">
                        Data is ingested from the National Institute of Statistics of Rwanda (NISR) Seasonal Agricultural Surveys (SAS). All biological yields are validated using planted-to-harvested ratio rules.
                      </p>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between py-1 border-b border-border-main">
                        <span className="text-muted">Reporting Period:</span>
                        <span className="font-bold">{selectedSeason} Agricultural Cycle</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border-main">
                        <span className="text-muted">Geographic Resolution:</span>
                        <span className="font-bold">District Level (30 Administrative Units)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border-main">
                        <span className="text-muted">Survey Design:</span>
                        <span className="font-bold">Two-stage cluster probability sampling</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted">
              <MapPin className="w-10 h-10 text-muted/50 mb-2" />
              <div className="font-bold text-sm text-text-main">No District Selected</div>
              <p className="text-xs mt-1 max-w-xs">Click on any district polygon on the map to inspect its detailed crop intelligence.</p>
            </div>
          )}

        </div>

      </div>

      {/* 5. Crop Performance by Season Section (Below the Map) */}
      <div className="space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-main pb-3">
          <div>
            <h3 className="text-lg font-black text-text-main flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-agriculture" />
              Crop Performance & Multi-Season Analytics
            </h3>
            <p className="text-xs text-muted">
              Analyze historical production trajectories, investigate alert anomalies, and compare crops between seasons.
            </p>
          </div>

          <div className="text-xs text-muted">
            Displaying chronological data spanning <b>2018A to {selectedSeason}</b>.
          </div>
        </div>

        {/* Multi-Season Trend Chart */}
        <div className="bg-surface border border-border-main rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted">Historical Trajectory</div>
              <h4 className="text-base font-extrabold text-text-main">
                {selectedCrop} Production Over Monitored Seasons (Tonnes)
              </h4>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-background border border-border-main text-muted">
              Chronological NISR Dataset
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={seasonalTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cropProdGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2E7D32" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="season_code" tick={{ fontSize: 11 }} stroke="#64748B" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748B" tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                <RechartsTooltip 
                  formatter={(val: any) => [`${Number(val).toLocaleString()} MT`, 'Production']}
                  labelFormatter={(lbl) => `Season ${lbl}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="production_tonnes" 
                  stroke="#2E7D32" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#cropProdGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts & Stability Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Large Increases */}
          <div className="bg-surface border border-border-main rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-agriculture font-bold text-xs uppercase tracking-wider mb-2">
              <TrendingUp className="w-4 h-4" /> Expanding Crops (&gt;+15%)
            </div>
            {alerts.large_increases?.length > 0 ? (
              <div className="space-y-2">
                {alerts.large_increases.map((c: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs p-2 rounded-lg bg-background">
                    <span className="font-bold text-text-main">{c.crop_name}</span>
                    <span className="font-extrabold text-agriculture">+{c.change_pct}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">No crops experienced an increase greater than 15% between {compareSeason} and {selectedSeason}.</p>
            )}
          </div>

          {/* Large Decreases */}
          <div className="bg-surface border border-border-main rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-danger font-bold text-xs uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4" /> Declining Crops (&lt;-15%)
            </div>
            {alerts.large_decreases?.length > 0 ? (
              <div className="space-y-2">
                {alerts.large_decreases.map((c: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs p-2 rounded-lg bg-background">
                    <span className="font-bold text-text-main">{c.crop_name}</span>
                    <span className="font-extrabold text-danger">{c.change_pct}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">No crops experienced a decline greater than 15% between {compareSeason} and {selectedSeason}.</p>
            )}
          </div>

          {/* Stable Production */}
          <div className="bg-surface border border-border-main rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-4 h-4" /> Stable Output Crops (±4%)
            </div>
            {alerts.stable_crops?.length > 0 ? (
              <div className="space-y-2">
                {alerts.stable_crops.map((c: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs p-2 rounded-lg bg-background">
                    <span className="font-bold text-text-main">{c.crop_name}</span>
                    <span className="font-extrabold text-primary">{c.change_pct > 0 ? `+${c.change_pct}%` : `${c.change_pct}%`}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">No high-volume crops maintained a stable delta between {compareSeason} and {selectedSeason}.</p>
            )}
          </div>

        </div>

        {/* 6. Comprehensive Seasonal Crop Comparison Table */}
        <div className="bg-surface border border-border-main rounded-2xl shadow-sm overflow-hidden">
          
          <div className="p-4 border-b border-border-main flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background/50">
            <div>
              <h4 className="text-sm font-extrabold text-text-main uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                Seasonal Crop Comparison Table ({selectedSeason} vs {compareSeason})
              </h4>
              <p className="text-xs text-muted mt-0.5">
                Displays surveyed output, percentage change, and leading production districts for all monitored crops.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search crop in table..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="bg-surface border border-border-main rounded-xl pl-8 pr-3 py-1.5 text-xs text-text-main focus:outline-none focus:border-primary"
                />
              </div>

              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-xl bg-surface border border-border-main hover:bg-background text-text-main text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-muted" />
                CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-main bg-background text-muted font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3">Crop Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">{selectedSeason} Output (MT)</th>
                  <th className="p-3 text-right">{compareSeason} Output (MT)</th>
                  <th className="p-3 text-right">Change (MT)</th>
                  <th className="p-3 text-right">Change (%)</th>
                  <th className="p-3 text-right">Yield (t/ha)</th>
                  <th className="p-3 text-right">National Share</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Leading District</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {sortedTableData.map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-primary-soft/20 transition-colors">
                    <td className="p-3 font-bold text-text-main flex items-center gap-1.5">
                      <Sprout className="w-3.5 h-3.5 text-agriculture" />
                      {c.crop_name}
                    </td>
                    <td className="p-3 text-muted">{c.category}</td>
                    <td className="p-3 text-right font-black text-text-main">
                      {c.current_production_tonnes.toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-muted">
                      {c.prev_production_tonnes !== null ? c.prev_production_tonnes.toLocaleString() : '—'}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {c.change_tonnes !== null ? (
                        <span className={c.change_tonnes >= 0 ? 'text-agriculture font-bold' : 'text-danger font-bold'}>
                          {c.change_tonnes > 0 ? `+${c.change_tonnes.toLocaleString()}` : c.change_tonnes.toLocaleString()}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {c.change_pct !== null ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          c.change_pct >= 5.0 ? 'bg-agriculture-soft text-agriculture' :
                          c.change_pct <= -5.0 ? 'bg-red-50 text-danger' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {c.change_pct > 0 ? `+${c.change_pct}%` : `${c.change_pct}%`}
                        </span>
                      ) : (
                        <span className="text-muted text-[10px]">No comparison</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-text-main font-semibold">
                      {c.current_yield_t_ha}
                    </td>
                    <td className="p-3 text-right text-muted">
                      {c.national_share_pct}%
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        c.trend_status === 'GROWING' ? 'bg-agriculture-soft text-agriculture' :
                        c.trend_status === 'DECLINING' ? 'bg-red-50 text-danger' :
                        c.trend_status === 'NEW_DATA' ? 'bg-blue-50 text-primary' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {c.trend_status}
                      </span>
                    </td>
                    <td className="p-3 text-muted">
                      {c.leading_district ? (
                        <span className="font-semibold text-text-main">
                          {c.leading_district.name} ({Math.round(c.leading_district.production_tonnes).toLocaleString()} MT)
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-background border-t border-border-main flex items-center justify-between text-xs text-muted">
            <span>Showing {sortedTableData.length} monitored crops for {selectedSeason}.</span>
            <span>Source: National Institute of Statistics of Rwanda (NISR) Seasonal Agricultural Surveys.</span>
          </div>

        </div>

      </div>

    </div>
  );
}
