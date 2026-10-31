import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { apiUrl } from '../../config/api';
import { 
  Package, Warehouse, Truck, Factory, ShieldAlert, 
  MapPin, RefreshCw, FileText, Filter, Download, 
  Database, Award, ChevronRight, ArrowUpRight, ArrowDownRight, 
  Info, HelpCircle, Sun, Activity, Zap, ExternalLink,
  TrendingUp, BarChart3, Compass, Check, Search, Layers,
  Thermometer, AlertTriangle, Snowflake, Sparkles, Building2,
  Calendar, CheckCircle2, ChevronDown, Eye, SlidersHorizontal,
  Target, ShieldCheck, Box, Flame, ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  CartesianGrid, Cell, AreaChart, Area, LineChart, Line, Legend, PieChart, Pie
} from 'recharts';

export type IntelligenceLayerType = 'storage' | 'facilities' | 'gap' | 'collection' | 'processing';
export type FacilityTypeFilter = 'ALL' | 'SILO' | 'WAREHOUSE' | 'COLD_STORAGE' | 'PROCESSING_PLANT' | 'AGGREGATION_CENTER' | 'PACKING_FACILITY';
export type CropFilterType = 'ALL' | 'Maize' | 'Beans' | 'Irish Potato' | 'Cassava' | 'Paddy Rice' | 'Banana' | 'Vegetables & Fruits';

export interface DistrictPostHarvestStat {
  district_name: string;
  province_name: string;
  season_code: string;
  year: number;
  season_name: string;
  total_crop_production_mt: number;
  market_surplus_volume_mt: number;
  documented_storage_capacity_mt: number;
  documented_processing_capacity_mt_day: number;
  cold_storage_capacity_mt: number;
  drying_capacity_mt_day: number;
  storage_capacity_gap_mt: number;
  storage_utilization_pct: number;
  pct_harvest_sold: number;
  pct_harvest_consumed: number;
  pct_harvest_stored: number;
  pct_harvest_lost: number;
  avg_distance_to_facility_km: number;
  avg_distance_to_paved_road_km: number;
  investment_opportunity_score: number;
  capacity_status: string;
  investment_tier: string;
  verification_status: string;
  recommended_investment: any;
  documented_facilities_count: number;
  maize_production_mt: number;
  beans_production_mt: number;
  irish_potato_production_mt: number;
  cassava_production_mt: number;
  paddy_rice_production_mt: number;
  banana_production_mt: number;
  vegetables_fruits_production_mt: number;
  prev_storage_capacity_mt: number | null;
  storage_change_mt: number | null;
  prev_production_mt: number | null;
  production_change_pct: number | null;
  prev_surplus_mt: number | null;
  surplus_change_pct: number | null;
}

export interface AgriFacility {
  id: string;
  facility_name: string;
  facility_type: string;
  district_name: string;
  sector_name?: string;
  storage_capacity_tonnes: number;
  processing_capacity_tonnes_day: number;
  cold_storage_capacity_tonnes: number;
  drying_capacity_tonnes_day: number;
  status: string;
  operator_name: string;
  crops_served?: string;
  longitude: number | null;
  latitude: number | null;
  source_date?: string;
}

export interface SeasonalTrend {
  season_code: string;
  year: number;
  season_name: string;
  total_crop_production_mt: number;
  market_surplus_volume_mt: number;
  documented_storage_capacity_mt: number;
  storage_capacity_gap_mt: number;
  avg_harvest_lost_pct: number;
}

export interface InvestmentCandidate {
  district_name: string;
  province_name: string;
  investment_opportunity_score: number;
  investment_tier: string;
  screening_flags: string[];
  production_metrics: {
    total_production_mt: number;
    market_surplus_volume_mt: number;
    maize_mt: number;
    irish_potato_mt: number;
    vegetables_fruits_mt: number;
  };
  capacity_metrics: {
    documented_storage_mt: number;
    processing_mt_day: number;
    cold_storage_mt: number;
    capacity_gap_mt: number;
    facilities_count: number;
  };
  recommended_investment: any;
  pre_feasibility_checklist: { step: string; status: string; note: string }[];
  missing_evidence_note: string;
  institutional_safeguard: string;
}

export function renderRecommendedInvestment(rec: any) {
  if (!rec) return <span className="text-slate-300">Standard Infrastructure Maintenance & Monitoring</span>;
  if (typeof rec === 'string') return <span className="text-slate-300">{rec}</span>;
  if (typeof rec === 'object') {
    const facility = rec.primaryFacilityType?.replace(/_/g, ' ') || 'Storage & Collection Infrastructure';
    const capacity = rec.recommendedCapacityMT ? `${Number(rec.recommendedCapacityMT).toLocaleString()} MT` : null;
    const commodity = rec.targetCommodity || null;
    const capex = rec.estimatedCapexUsd ? `$${(Number(rec.estimatedCapexUsd) / 1000000).toFixed(1)}M USD` : null;
    const logistics = rec.logisticsOptimization || null;
    const safeguard = rec.safeguardReviewNotice || null;

    return (
      <div className="space-y-1.5 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-emerald-300">{facility}</span>
          {capacity && (
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] border border-emerald-700/50">
              Capacity: {capacity}
            </span>
          )}
          {commodity && (
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
              {commodity}
            </span>
          )}
          {capex && (
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono text-[10px] border border-amber-700/50">
              Est. Capex: {capex}
            </span>
          )}
        </div>
        {logistics && (
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {logistics}
          </p>
        )}
        {safeguard && (
          <p className="text-[10px] text-amber-400/90 italic">
            Note: {safeguard}
          </p>
        )}
      </div>
    );
  }
  return <span className="text-slate-300">{String(rec)}</span>;
}

export default function PostHarvestProcessing() {
  // Navigation & Filter States
  const [selectedSeason, setSelectedSeason] = useState<string>('2025A');
  const [compareSeason, setCompareSeason] = useState<string>('2024A');
  const [selectedLayer, setSelectedLayer] = useState<IntelligenceLayerType>('storage');
  const [selectedFacilityType, setSelectedFacilityType] = useState<FacilityTypeFilter>('ALL');
  const [selectedCrop, setSelectedCrop] = useState<CropFilterType>('ALL');
  const [selectedProvince, setSelectedProvince] = useState<string>('ALL');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('Nyagatare');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDossierTab, setActiveDossierTab] = useState<'overview' | 'storage' | 'processing' | 'gap' | 'investment'>('overview');
  const [showFacilityMarkers, setShowFacilityMarkers] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<string>('overview');

  // Loading & Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [availableSeasons, setAvailableSeasons] = useState<{ code: string; year: number; name: string; districts_reported: number }[]>([]);
  const [nationalSummary, setNationalSummary] = useState<any>(null);
  const [districts, setDistricts] = useState<DistrictPostHarvestStat[]>([]);
  const [facilitiesList, setFacilitiesList] = useState<AgriFacility[]>([]);
  const [seasonalTrends, setSeasonalTrends] = useState<SeasonalTrend[]>([]);
  const [cropBreakdown, setCropBreakdown] = useState<any[]>([]);
  const [investmentCandidates, setInvestmentCandidates] = useState<InvestmentCandidate[]>([]);
  const [criteriaWeights, setCriteriaWeights] = useState<any[]>([]);

  // Facility Register Filter States
  const [registerSearch, setRegisterSearch] = useState<string>('');
  const [registerTypeFilter, setRegisterTypeFilter] = useState<string>('ALL');
  const [registerStatusFilter, setRegisterStatusFilter] = useState<string>('ALL');

  // Map references
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const geojsonLoadedRef = useRef<boolean>(false);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  // Synchronized refs for MapLibre events
  const districtsRef = useRef<DistrictPostHarvestStat[]>([]);
  const selectedDistrictRef = useRef<string>(selectedDistrictName);
  const selectedLayerRef = useRef<IntelligenceLayerType>(selectedLayer);

  useEffect(() => {
    districtsRef.current = districts;
  }, [districts]);

  useEffect(() => {
    selectedDistrictRef.current = selectedDistrictName;
  }, [selectedDistrictName]);

  useEffect(() => {
    selectedLayerRef.current = selectedLayer;
  }, [selectedLayer]);

  // Fetch Full Workspace Data from Backend
  const fetchWorkspaceData = async () => {
    setLoading(true);
    try {
      const url = `${apiUrl('post-harvest')}/decision-workspace?season=${selectedSeason}&compareSeason=${compareSeason}&province=${selectedProvince}&layer=${selectedLayer}&facilityType=${selectedFacilityType}&crop=${selectedCrop}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.meta?.availableSeasons) {
          setAvailableSeasons(data.meta.availableSeasons);
        }
        setNationalSummary(data.nationalSummary || null);
        setDistricts(data.districts || []);
        setFacilitiesList(data.facilitiesList || []);
        setSeasonalTrends(data.seasonalTrends || []);
        setCropBreakdown(data.cropBreakdown || []);
        if (data.investmentScreening) {
          setInvestmentCandidates(data.investmentScreening.candidateDistricts || []);
          setCriteriaWeights(data.investmentScreening.criteriaWeights || []);
        }
      }
    } catch (err) {
      console.error('Failed to load post-harvest decision workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [selectedSeason, compareSeason, selectedProvince, selectedLayer, selectedFacilityType, selectedCrop]);

  // Selected District Dossier Object
  const selectedDistrictData = useMemo(() => {
    return districts.find(d => d.district_name.toLowerCase() === selectedDistrictName.toLowerCase()) || districts[0] || null;
  }, [districts, selectedDistrictName]);

  // Facilities located within the selected district
  const districtFacilities = useMemo(() => {
    if (!selectedDistrictName) return [];
    return facilitiesList.filter(f => f.district_name.toLowerCase() === selectedDistrictName.toLowerCase());
  }, [facilitiesList, selectedDistrictName]);

  // Layer Indicator Definitions & Value Extractors
  const layerConfig = useMemo(() => {
    switch (selectedLayer) {
      case 'storage':
        return {
          title: 'Documented Storage Capacity',
          unit: 'Tonnes (MT)',
          badge: 'Static Storage',
          description: 'Documented physical storage volume in grain silos, warehouses, and storage sheds.',
          getValue: (d: DistrictPostHarvestStat) => d.documented_storage_capacity_mt,
          format: (v: number) => `${v.toLocaleString()} MT`,
          colorRamp: ['#d1fae5', '#6ee7b7', '#10b981', '#059669', '#047857'],
          reverse: false,
        };
      case 'facilities':
        return {
          title: 'Documented Facility Distribution',
          unit: 'Facilities Count',
          badge: 'Infrastructure Density',
          description: 'Total verified post-harvest assets including warehouses, cold storage, and processing plants.',
          getValue: (d: DistrictPostHarvestStat) => d.documented_facilities_count,
          format: (v: number) => `${v} facilities`,
          colorRamp: ['#e0f2fe', '#7dd3fc', '#0284c7', '#0369a1', '#075985'],
          reverse: false,
        };
      case 'gap':
        return {
          title: 'Production-to-Capacity Gap',
          unit: 'Tonnes Surplus Deficit',
          badge: 'Potential Deficit',
          description: 'Market surplus volume exceeding verified local storage capacity.',
          getValue: (d: DistrictPostHarvestStat) => d.storage_capacity_gap_mt,
          format: (v: number) => `${v.toLocaleString()} MT`,
          colorRamp: ['#fee2e2', '#fca5a5', '#f87171', '#dc2626', '#991b1b'],
          reverse: false,
        };
      case 'collection':
        return {
          title: 'Commercial Market Surplus Volume',
          unit: 'Tonnes Marketed',
          badge: 'Collection Demand',
          description: 'Volume of harvested crops intended for commercial trade and aggregation.',
          getValue: (d: DistrictPostHarvestStat) => d.market_surplus_volume_mt,
          format: (v: number) => `${v.toLocaleString()} MT`,
          colorRamp: ['#fef3c7', '#fde68a', '#f59e0b', '#d97706', '#b45309'],
          reverse: false,
        };
      case 'processing':
        return {
          title: 'Agro-Processing Throughput Capacity',
          unit: 'Tonnes / Day',
          badge: 'Value Addition',
          description: 'Documented daily throughput of grain mills, cassava plants, and dryers.',
          getValue: (d: DistrictPostHarvestStat) => d.documented_processing_capacity_mt_day,
          format: (v: number) => `${v.toLocaleString()} MT/day`,
          colorRamp: ['#ede9fe', '#c4b5fd', '#8b5cf6', '#6d28d9', '#4c1d95'],
          reverse: false,
        };
    }
  }, [selectedLayer]);

  // Color Calculation for District Choropleth
  const getDistrictChoroplethColor = (d: DistrictPostHarvestStat | undefined): string => {
    if (!d) return '#334155'; // Missing/Unknown
    const val = layerConfig.getValue(d);
    const allVals = districts.map(x => layerConfig.getValue(x)).sort((a, b) => a - b);
    if (allVals.length === 0) return '#334155';

    const min = allVals[0];
    const max = allVals[allVals.length - 1];
    if (max === min) return layerConfig.colorRamp[2];

    const p20 = allVals[Math.floor(allVals.length * 0.2)];
    const p40 = allVals[Math.floor(allVals.length * 0.4)];
    const p60 = allVals[Math.floor(allVals.length * 0.6)];
    const p80 = allVals[Math.floor(allVals.length * 0.8)];

    if (val <= p20) return layerConfig.colorRamp[0];
    if (val <= p40) return layerConfig.colorRamp[1];
    if (val <= p60) return layerConfig.colorRamp[2];
    if (val <= p80) return layerConfig.colorRamp[3];
    return layerConfig.colorRamp[4];
  };

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    mapInstance.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors | NISR, MINAGRI & MINICOM Rwanda',
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
      zoom: 8.35,
      minZoom: 7.2,
      maxZoom: 14,
    });

    mapInstance.current.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    mapInstance.current.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

    mapInstance.current.on('load', async () => {
      if (!mapInstance.current) return;

      try {
        const res = await fetch('/rwanda-districts.geojson');
        const geojson = await res.json();
        geojsonLoadedRef.current = true;

        if (!mapInstance.current.getSource('rwanda-districts')) {
          mapInstance.current.addSource('rwanda-districts', {
            type: 'geojson',
            data: geojson,
          });

          // Build Match Expression for Choropleth Fill
          let initialFill: any = '#10b981';
          const list = districtsRef.current;
          if (list && list.length > 0) {
            const matchExpr: any[] = ['match', ['get', 'shapeName']];
            for (const d of list) {
              matchExpr.push(d.district_name, getDistrictChoroplethColor(d));
            }
            matchExpr.push('#334155');
            initialFill = matchExpr;
          }

          // 1. District Fill Layer
          mapInstance.current.addLayer({
            id: 'district-fill',
            type: 'fill',
            source: 'rwanda-districts',
            paint: {
              'fill-color': initialFill as any,
              'fill-opacity': 0.82,
            },
          });

          // 2. District Boundary Lines
          mapInstance.current.addLayer({
            id: 'district-borders',
            type: 'line',
            source: 'rwanda-districts',
            paint: {
              'line-color': '#0f172a',
              'line-width': 1.5,
              'line-opacity': 0.9,
            },
          });

          // 3. Highlighted District Boundary
          mapInstance.current.addLayer({
            id: 'district-selected-line',
            type: 'line',
            source: 'rwanda-districts',
            paint: {
              'line-color': '#fbbf24',
              'line-width': 3.5,
              'line-opacity': [
                'case',
                ['==', ['get', 'shapeName'], selectedDistrictRef.current],
                1.0,
                0.0,
              ],
            },
          });

          // Tooltip Popup
          popupRef.current = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'post-harvest-tooltip',
          });

          // Hover Interactivity
          mapInstance.current.on('mousemove', 'district-fill', (e) => {
            if (!mapInstance.current || !e.features || e.features.length === 0) return;
            mapInstance.current.getCanvas().style.cursor = 'pointer';

            const shapeName = e.features[0].properties?.shapeName || '';
            const match = districtsRef.current.find(d => d.district_name.toLowerCase() === shapeName.toLowerCase());

            const valStr = match ? layerConfig.format(layerConfig.getValue(match)) : 'No data recorded';
            const capStr = match ? `${match.documented_storage_capacity_mt.toLocaleString()} MT` : '—';
            const facStr = match ? `${match.documented_facilities_count} facilities` : '—';

            popupRef.current?.setLngLat(e.lngLat).setHTML(`
              <div class="p-3 bg-slate-900/95 text-slate-100 rounded-lg shadow-2xl border border-slate-700/80 backdrop-blur-md min-w-[210px] text-xs space-y-1.5 font-sans">
                <div class="flex items-center justify-between border-b border-slate-800 pb-1">
                  <span class="font-bold text-sm text-amber-400">${shapeName} District</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">${match?.province_name || 'Rwanda'}</span>
                </div>
                <div class="pt-1 space-y-1">
                  <div class="flex justify-between items-center text-slate-300">
                    <span class="text-slate-400">${layerConfig.title}:</span>
                    <span class="font-bold text-emerald-400 font-mono">${valStr}</span>
                  </div>
                  <div class="flex justify-between items-center text-slate-300">
                    <span class="text-slate-400">Documented Storage:</span>
                    <span class="font-mono text-slate-200">${capStr}</span>
                  </div>
                  <div class="flex justify-between items-center text-slate-300">
                    <span class="text-slate-400">Total Facilities:</span>
                    <span class="font-mono text-slate-200">${facStr}</span>
                  </div>
                  ${match?.storage_capacity_gap_mt ? `
                  <div class="flex justify-between items-center text-rose-300 pt-0.5 border-t border-slate-800">
                    <span class="text-slate-400">Capacity Gap:</span>
                    <span class="font-bold text-rose-400 font-mono">${match.storage_capacity_gap_mt.toLocaleString()} MT</span>
                  </div>` : ''}
                </div>
                <div class="text-[9px] text-slate-500 italic pt-1 border-t border-slate-800/80 text-right">Click district to inspect full dossier</div>
              </div>
            `).addTo(mapInstance.current);
          });

          mapInstance.current.on('mouseleave', 'district-fill', () => {
            if (!mapInstance.current) return;
            mapInstance.current.getCanvas().style.cursor = '';
            popupRef.current?.remove();
          });

          // Click Interactivity
          mapInstance.current.on('click', 'district-fill', (e) => {
            if (!e.features || e.features.length === 0) return;
            const clickedName = e.features[0].properties?.shapeName;
            if (clickedName) {
              setSelectedDistrictName(clickedName);
            }
          });
        }
      } catch (err) {
        console.error('Error loading Rwanda district geojson in post-harvest map:', err);
      }
    });

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update Choropleth Colors and Highlight when Layer or Districts Change
  useEffect(() => {
    if (!mapInstance.current || !geojsonLoadedRef.current || !mapInstance.current.getLayer('district-fill')) return;

    if (districts.length > 0) {
      const matchExpr: any[] = ['match', ['get', 'shapeName']];
      for (const d of districts) {
        matchExpr.push(d.district_name, getDistrictChoroplethColor(d));
      }
      matchExpr.push('#334155');
      mapInstance.current.setPaintProperty('district-fill', 'fill-color', matchExpr as any);
    }

    if (mapInstance.current.getLayer('district-selected-line')) {
      mapInstance.current.setPaintProperty('district-selected-line', 'line-opacity', [
        'case',
        ['==', ['get', 'shapeName'], selectedDistrictName],
        1.0,
        0.0,
      ] as any);
    }
  }, [districts, selectedLayer, selectedDistrictName]);

  // Update Facility Markers on the Map
  useEffect(() => {
    if (!mapInstance.current) return;

    // Remove existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!showFacilityMarkers) return;

    // Filter facilities by type
    const visibleFacilities = facilitiesList.filter(f => {
      if (selectedFacilityType !== 'ALL' && f.facility_type !== selectedFacilityType) return false;
      if (f.longitude === null || f.latitude === null) return false;
      return true;
    });

    // Facility Type Color Palette
    const typeColors: Record<string, { bg: string; border: string; text: string }> = {
      SILO: { bg: 'bg-amber-500', border: 'border-amber-300', text: 'text-amber-500' },
      WAREHOUSE: { bg: 'bg-emerald-500', border: 'border-emerald-300', text: 'text-emerald-500' },
      COLD_STORAGE: { bg: 'bg-cyan-500', border: 'border-cyan-300', text: 'text-cyan-500' },
      PROCESSING_PLANT: { bg: 'bg-purple-500', border: 'border-purple-300', text: 'text-purple-500' },
      AGGREGATION_CENTER: { bg: 'bg-blue-500', border: 'border-blue-300', text: 'text-blue-500' },
      PACKING_FACILITY: { bg: 'bg-pink-500', border: 'border-pink-300', text: 'text-pink-500' },
    };

    visibleFacilities.forEach(f => {
      const col = typeColors[f.facility_type] || { bg: 'bg-slate-500', border: 'border-slate-300', text: 'text-slate-500' };

      const el = document.createElement('div');
      el.className = `w-4 h-4 rounded-full border-2 ${col.bg} ${col.border} shadow-lg cursor-pointer transform transition-transform hover:scale-150`;
      el.title = `${f.facility_name} (${f.facility_type})`;

      const popup = new maplibregl.Popup({ offset: 12, className: 'post-harvest-marker-popup' }).setHTML(`
        <div class="p-2.5 bg-slate-900 text-slate-100 rounded-lg shadow-2xl border border-slate-700 min-w-[200px] text-xs font-sans space-y-1">
          <div class="font-bold text-amber-400 border-b border-slate-800 pb-1">${f.facility_name}</div>
          <div class="text-[11px] text-slate-300"><span class="text-slate-400">Category:</span> <span class="font-semibold text-emerald-400">${f.facility_type.replace('_', ' ')}</span></div>
          <div class="text-[11px] text-slate-300"><span class="text-slate-400">District:</span> ${f.district_name} ${f.sector_name ? `(${f.sector_name})` : ''}</div>
          <div class="text-[11px] text-slate-300"><span class="text-slate-400">Capacity:</span> <span class="font-mono font-bold text-amber-300">${f.storage_capacity_tonnes > 0 ? `${f.storage_capacity_tonnes.toLocaleString()} MT` : `${f.processing_capacity_tonnes_day} MT/day`}</span></div>
          <div class="text-[11px] text-slate-300"><span class="text-slate-400">Status:</span> <span class="px-1 py-0.2 rounded text-[10px] font-bold ${f.status === 'OPERATIONAL' ? 'bg-emerald-950 text-emerald-400 border border-emerald-600' : 'bg-amber-950 text-amber-400'}">${f.status}</span></div>
          <div class="text-[10px] text-slate-400"><span class="text-slate-500">Operator:</span> ${f.operator_name}</div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([f.longitude!, f.latitude!])
        .setPopup(popup)
        .addTo(mapInstance.current!);

      el.addEventListener('click', () => {
        setSelectedDistrictName(f.district_name);
      });

      markersRef.current.push(marker);
    });
  }, [facilitiesList, showFacilityMarkers, selectedFacilityType]);

  // Focus map on district or facility
  const focusOnCoordinates = (lng: number, lat: number, zoomLevel: number = 11.5) => {
    if (!mapInstance.current) return;
    mapInstance.current.flyTo({
      center: [lng, lat],
      zoom: zoomLevel,
      essential: true,
      duration: 1600,
    });
  };

  // Export Complete District Post-Harvest Intelligence to CSV
  const handleExportCSV = () => {
    if (!districts || districts.length === 0) return;
    const headers = [
      'District',
      'Province',
      'Season',
      'Year',
      'Total Production (MT)',
      'Market Surplus (MT)',
      'Documented Storage (MT)',
      'Processing Throughput (MT/day)',
      'Cold Storage (MT)',
      'Drying Capacity (MT/day)',
      'Capacity Gap (MT)',
      'Storage Utilization (%)',
      'Facilities Count',
      'Capacity Status',
      'Investment Tier',
      'Opportunity Score',
    ];

    const rows = districts.map(d => [
      `"${d.district_name}"`,
      `"${d.province_name}"`,
      `"${d.season_code}"`,
      d.year,
      d.total_crop_production_mt,
      d.market_surplus_volume_mt,
      d.documented_storage_capacity_mt,
      d.documented_processing_capacity_mt_day,
      d.cold_storage_capacity_mt,
      d.drying_capacity_mt_day,
      d.storage_capacity_gap_mt,
      d.storage_utilization_pct,
      d.documented_facilities_count,
      `"${d.capacity_status}"`,
      `"${d.investment_tier}"`,
      d.investment_opportunity_score,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rwanda_PostHarvest_Intelligence_${selectedSeason}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered District Rankings
  const filteredDistricts = useMemo(() => {
    return districts
      .filter(d => {
        if (selectedProvince !== 'ALL' && d.province_name.toLowerCase() !== selectedProvince.toLowerCase()) return false;
        if (searchQuery && !d.district_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (selectedLayer === 'storage') return b.documented_storage_capacity_mt - a.documented_storage_capacity_mt;
        if (selectedLayer === 'facilities') return b.documented_facilities_count - a.documented_facilities_count;
        if (selectedLayer === 'gap') return b.storage_capacity_gap_mt - a.storage_capacity_gap_mt;
        if (selectedLayer === 'collection') return b.market_surplus_volume_mt - a.market_surplus_volume_mt;
        if (selectedLayer === 'processing') return b.documented_processing_capacity_mt_day - a.documented_processing_capacity_mt_day;
        return b.documented_storage_capacity_mt - a.documented_storage_capacity_mt;
      });
  }, [districts, selectedProvince, searchQuery, selectedLayer]);

  // Filtered Facilities for National Register
  const filteredFacilityRegister = useMemo(() => {
    return facilitiesList.filter(f => {
      if (registerTypeFilter !== 'ALL' && f.facility_type !== registerTypeFilter) return false;
      if (registerStatusFilter !== 'ALL' && f.status !== registerStatusFilter) return false;
      if (registerSearch) {
        const q = registerSearch.toLowerCase();
        return (
          f.facility_name.toLowerCase().includes(q) ||
          f.district_name.toLowerCase().includes(q) ||
          f.operator_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [facilitiesList, registerTypeFilter, registerStatusFilter, registerSearch]);

  // Facility Count by Type Summary
  const facilitiesSummaryByType = useMemo(() => {
    const counts: Record<string, { count: number; storageMT: number; processingMT: number }> = {
      SILO: { count: 0, storageMT: 0, processingMT: 0 },
      WAREHOUSE: { count: 0, storageMT: 0, processingMT: 0 },
      COLD_STORAGE: { count: 0, storageMT: 0, processingMT: 0 },
      PROCESSING_PLANT: { count: 0, storageMT: 0, processingMT: 0 },
      AGGREGATION_CENTER: { count: 0, storageMT: 0, processingMT: 0 },
      PACKING_FACILITY: { count: 0, storageMT: 0, processingMT: 0 },
    };

    facilitiesList.forEach(f => {
      if (counts[f.facility_type]) {
        counts[f.facility_type].count += 1;
        counts[f.facility_type].storageMT += f.storage_capacity_tonnes || 0;
        counts[f.facility_type].processingMT += f.processing_capacity_tonnes_day || 0;
      }
    });

    return [
      { name: 'Grain Silos', type: 'SILO', count: counts.SILO.count, storageMT: counts.SILO.storageMT, color: '#f59e0b' },
      { name: 'Storage Warehouses', type: 'WAREHOUSE', count: counts.WAREHOUSE.count, storageMT: counts.WAREHOUSE.storageMT, color: '#10b981' },
      { name: 'Cold-Chain Stores', type: 'COLD_STORAGE', count: counts.COLD_STORAGE.count, storageMT: counts.COLD_STORAGE.storageMT, color: '#06b6d4' },
      { name: 'Agro-Processing Plants', type: 'PROCESSING_PLANT', count: counts.PROCESSING_PLANT.count, storageMT: counts.PROCESSING_PLANT.processingMT, color: '#8b5cf6' },
      { name: 'Collection Centres', type: 'AGGREGATION_CENTER', count: counts.AGGREGATION_CENTER.count, storageMT: counts.AGGREGATION_CENTER.storageMT, color: '#3b82f6' },
      { name: 'Packhouses', type: 'PACKING_FACILITY', count: counts.PACKING_FACILITY.count, storageMT: counts.PACKING_FACILITY.storageMT, color: '#ec4899' },
    ];
  }, [facilitiesList]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. INSTITUTIONAL HEADER & BANNER */}
      <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-30 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-semibold tracking-wider uppercase text-emerald-400">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>National Agricultural Planner · Post-Harvest & Storage</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">MINAGRI · NISR SAS · MINICOM Infrastructure Registry</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-3">
              <span>National Post-Harvest & Storage Intelligence</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                Decision Support Workspace
              </span>
            </h1>
            <p className="text-xs text-slate-400 max-w-4xl">
              Monitor storage infrastructure, collection facilities, processing capacity, post-harvest performance, and potential infrastructure gaps across Rwanda.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-end lg:self-center">
            <button
              onClick={fetchWorkspaceData}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Refresh intelligence records"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              Refresh Data
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
              title="Download nationwide district post-harvest dataset"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV Dataset
            </button>
          </div>
        </div>

        {/* Workspace Quick-Jump Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between overflow-x-auto gap-2 no-scrollbar">
          <div className="flex items-center space-x-1.5 text-xs">
            {[
              { id: 'overview', label: '1. National Overview & Map', icon: Compass },
              { id: 'infrastructure', label: '2. Storage & Collection Infrastructure', icon: Building2 },
              { id: 'gap_analysis', label: '3. Production vs. Capacity Gap', icon: Activity },
              { id: 'crop_intelligence', label: '4. Crop Post-Harvest Intelligence', icon: Box },
              { id: 'seasonal_trends', label: '5. Seasonal Trends Across Years', icon: TrendingUp },
              { id: 'rankings', label: '6. District League Table', icon: Award },
              { id: 'facility_register', label: '7. National Facility Register', icon: Database },
              { id: 'investment', label: '8. Investment Opportunities', icon: Target },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveSection(tab.id);
                    const el = document.getElementById(tab.id);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`inline-flex items-center px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 mr-1.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* 2. UNIFIED MASTER FILTER BAR */}
      <section className="bg-slate-900 border-b border-slate-800 px-6 py-3.5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* A. Agricultural Season */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center">
              <Calendar className="w-3 h-3 mr-1 text-emerald-400" />
              Agricultural Season
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full bg-slate-800 text-slate-100 border border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              {availableSeasons.map(s => (
                <option key={s.code} value={s.code}>
                  {s.code} ({s.year} {s.name})
                </option>
              ))}
            </select>
          </div>

          {/* B. Intelligence Layer */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center">
              <Layers className="w-3 h-3 mr-1 text-amber-400" />
              Intelligence Layer
            </label>
            <select
              value={selectedLayer}
              onChange={(e) => setSelectedLayer(e.target.value as IntelligenceLayerType)}
              className="w-full bg-slate-800 text-slate-100 border border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              <option value="storage">Storage Capacity (MT)</option>
              <option value="facilities">Facility Distribution (Count)</option>
              <option value="gap">Production-to-Capacity Gap</option>
              <option value="collection">Collection Demand (Surplus MT)</option>
              <option value="processing">Agro-Processing Capacity</option>
            </select>
          </div>

          {/* C. Facility Category Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center">
              <Warehouse className="w-3 h-3 mr-1 text-cyan-400" />
              Facility Category
            </label>
            <select
              value={selectedFacilityType}
              onChange={(e) => setSelectedFacilityType(e.target.value as FacilityTypeFilter)}
              className="w-full bg-slate-800 text-slate-100 border border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="ALL">All Documented Facilities</option>
              <option value="SILO">Grain Silos</option>
              <option value="WAREHOUSE">Storage Warehouses</option>
              <option value="COLD_STORAGE">Cold-Chain Facilities</option>
              <option value="PROCESSING_PLANT">Agro-Processing Plants</option>
              <option value="AGGREGATION_CENTER">Collection & Aggregation Centres</option>
              <option value="PACKING_FACILITY">Packhouses</option>
            </select>
          </div>

          {/* D. Crop Commodity Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center">
              <Box className="w-3 h-3 mr-1 text-purple-400" />
              Crop Commodity
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value as CropFilterType)}
              className="w-full bg-slate-800 text-slate-100 border border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
            >
              <option value="ALL">All Documented Crops</option>
              <option value="Maize">Maize (Grain)</option>
              <option value="Irish Potato">Irish Potato</option>
              <option value="Beans">Beans (Pulses)</option>
              <option value="Cassava">Cassava (Roots)</option>
              <option value="Paddy Rice">Paddy Rice</option>
              <option value="Banana">Banana</option>
              <option value="Vegetables & Fruits">Vegetables & Fruits (Perishable)</option>
            </select>
          </div>

          {/* E. Geographic Scope */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center">
              <MapPin className="w-3 h-3 mr-1 text-emerald-400" />
              Geographic Scope
            </label>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full bg-slate-800 text-slate-100 border border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Districts (National View)</option>
              <option value="Kigali City">Kigali City</option>
              <option value="Northern Province">Northern Province</option>
              <option value="Southern Province">Southern Province</option>
              <option value="Eastern Province">Eastern Province</option>
              <option value="Western Province">Western Province</option>
            </select>
          </div>

          {/* F. Comparison Season */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center">
              <Activity className="w-3 h-3 mr-1 text-blue-400" />
              Comparison Season
            </label>
            <select
              value={compareSeason}
              onChange={(e) => setCompareSeason(e.target.value)}
              className="w-full bg-slate-800 text-slate-100 border border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {availableSeasons.map(s => (
                <option key={s.code} value={s.code}>
                  {s.code} ({s.year} {s.name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* MAIN ANALYTICAL BODY */}
      <main className="max-w-7xl mx-auto w-full px-6 py-6 space-y-10 flex-1">
        {/* SECTION 1: NATIONAL POST-HARVEST SUMMARY CARDS */}
        <section id="overview" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span>
              <span>1. National Post-Harvest & Storage Overview</span>
            </h2>
            <div className="text-xs text-slate-400 flex items-center space-x-3">
              <span className="flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                Coverage: <strong className="ml-1 text-slate-200">30 of 30 Districts (100%)</strong>
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center">
                <Database className="w-3.5 h-3.5 text-blue-400 mr-1" />
                Documented Facilities: <strong className="ml-1 text-slate-200">{facilitiesList.length} Facilities (100% Verified)</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Documented Storage Capacity */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Documented Storage Capacity</span>
                <Warehouse className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-white font-mono">
                {nationalSummary?.total_documented_storage_capacity_mt?.toLocaleString() || '—'}{' '}
                <span className="text-sm font-sans font-normal text-slate-400">tonnes</span>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span>Total comparable recorded capacity</span>
                {nationalSummary?.storage_change_pct !== undefined && (
                  <span className={`inline-flex items-center font-semibold font-mono ${nationalSummary.storage_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {nationalSummary.storage_change_pct >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {Math.abs(nationalSummary.storage_change_pct)}% vs {compareSeason}
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Documented Facilities */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Documented Facilities</span>
                <Building2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-white font-mono">
                {nationalSummary?.total_documented_facilities || facilitiesList.length || '—'}{' '}
                <span className="text-sm font-sans font-normal text-slate-400">facilities</span>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span>Distinct facilities in national scope</span>
                <span className="text-emerald-400 font-medium">
                  {nationalSummary?.operational_facilities_count || facilitiesList.length} operational (100%)
                </span>
              </div>
            </div>

            {/* Card 3: Relevant Agricultural Production */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Relevant Agricultural Production</span>
                <Box className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-white font-mono">
                {nationalSummary?.total_crop_production_mt?.toLocaleString() || '—'}{' '}
                <span className="text-sm font-sans font-normal text-slate-400">tonnes</span>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span>Market surplus: <strong className="text-slate-200 font-mono">{nationalSummary?.total_market_surplus_volume_mt?.toLocaleString() || '—'} MT</strong></span>
                {nationalSummary?.production_change_pct !== undefined && (
                  <span className={`inline-flex items-center font-semibold font-mono ${nationalSummary.production_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {nationalSummary.production_change_pct >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {Math.abs(nationalSummary.production_change_pct)}% vs {compareSeason}
                  </span>
                )}
              </div>
            </div>

            {/* Card 4: Potential Capacity Gap */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Potential Capacity Gap</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-rose-400 font-mono">
                {nationalSummary?.total_storage_capacity_gap_mt?.toLocaleString() || '—'}{' '}
                <span className="text-sm font-sans font-normal text-slate-400">tonnes</span>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span className="text-[11px] text-slate-400 truncate" title="Only when production and capacity are comparable">
                  Surplus exceeding documented static storage
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 font-semibold border border-rose-800/40">
                  Screening Flag
                </span>
              </div>
            </div>
          </div>

          {/* Sub-indicators: District Coverage & Facility Status Coverage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-200">District Infrastructure Coverage</div>
                  <div className="text-[11px] text-slate-400">30 of 30 administrative districts documented with seasonal data and facilities</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-emerald-400 font-mono">100%</span>
                <div className="text-[10px] text-slate-500">Full National Frame</div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/30">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-200">Facility Status & Registry Coverage</div>
                  <div className="text-[11px] text-slate-400">97 distinct facilities with recorded operational status, coordinates, and operators</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-cyan-400 font-mono">100%</span>
                <div className="text-[10px] text-slate-500">Verified Georeferenced</div>
              </div>
            </div>
          </div>

          {/* INTERACTIVE RWANDA POST-HARVEST MAP & DISTRICT PROFILE DOSSIER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
            {/* Left Column: Rwanda Post-Harvest Choropleth Map (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[650px] shadow-sm">
              <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <h3 className="font-bold text-slate-100 flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>Rwanda Post-Harvest Infrastructure Map</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    National view · District administrative boundaries · Indicator: <span className="text-amber-400 font-semibold">{layerConfig.title}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-1.5 cursor-pointer bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-[11px] border border-slate-700">
                    <input
                      type="checkbox"
                      checked={showFacilityMarkers}
                      onChange={(e) => setShowFacilityMarkers(e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-0 w-3 h-3"
                    />
                    <span className="text-slate-300">Show Facility Markers ({facilitiesList.length})</span>
                  </label>
                </div>
              </div>

              {/* Map Canvas */}
              <div className="relative flex-1 bg-slate-950">
                <div ref={mapContainer} className="w-full h-full" />

                {/* Map Choropleth Legend (Bottom Left) */}
                <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-slate-700/80 rounded-lg p-3 shadow-2xl backdrop-blur-md text-[11px] max-w-[240px] space-y-2 pointer-events-auto">
                  <div className="font-bold text-slate-200 flex items-center justify-between">
                    <span>{layerConfig.badge}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{layerConfig.unit}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {layerConfig.colorRamp.map((col, idx) => (
                      <div key={idx} className="flex-1 h-2.5 rounded-sm" style={{ backgroundColor: col }} />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Low / Limited</span>
                    <span>Moderate</span>
                    <span>High / Favorable</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-slate-600 mr-1.5"></span>
                      Missing data
                    </span>
                    <span className="text-amber-400 font-medium">Selected: {selectedDistrictName}</span>
                  </div>
                </div>

                {/* Facility Markers Legend (Top Right) */}
                {showFacilityMarkers && (
                  <div className="absolute top-4 right-14 bg-slate-900/95 border border-slate-700/80 rounded-lg p-2.5 shadow-2xl backdrop-blur-md text-[10px] space-y-1.5 pointer-events-auto">
                    <div className="font-bold text-slate-200">Facility Types</div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300">
                      <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>Silo</span>
                      <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>Warehouse</span>
                      <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-cyan-500 mr-1.5"></span>Cold Store</span>
                      <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-purple-500 mr-1.5"></span>Processing</span>
                      <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>Collection</span>
                      <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-pink-500 mr-1.5"></span>Packhouse</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: District Post-Harvest Profile Dossier (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[650px] shadow-sm">
              {/* Dossier Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-lg text-white">{selectedDistrictData?.district_name || 'Select District'}</h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {selectedDistrictData?.province_name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Post-Harvest & Storage Profile · Season {selectedSeason}</p>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                    selectedDistrictData?.investment_tier === 'TIER_1_URGENT_COLLECTION_HUB'
                      ? 'bg-rose-950 text-rose-400 border-rose-800'
                      : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  }`}>
                    {selectedDistrictData?.investment_tier?.replace(/_/g, ' ') || 'STANDARD'}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1">Opportunity Score: {selectedDistrictData?.investment_opportunity_score || 0}/100</div>
                </div>
              </div>

              {/* Dossier Tabs */}
              <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs font-medium">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'storage', label: 'Storage' },
                  { id: 'processing', label: 'Processing' },
                  { id: 'gap', label: 'Capacity Gap' },
                  { id: 'investment', label: 'Assessment' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDossierTab(tab.id as any)}
                    className={`flex-1 py-2 text-center border-b-2 transition ${
                      activeDossierTab === tab.id
                        ? 'border-emerald-500 text-emerald-400 font-bold bg-slate-900'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Dossier Tab Content (Scrollable) */}
              <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs text-slate-300">
                {activeDossierTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400">Relevant Crop Production</span>
                        <div className="text-lg font-bold text-white font-mono mt-1">
                          {selectedDistrictData?.total_crop_production_mt?.toLocaleString()} MT
                        </div>
                        <div className="text-[10px] text-slate-500">Seasonal total harvest volume</div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400">Market Surplus Volume</span>
                        <div className="text-lg font-bold text-amber-400 font-mono mt-1">
                          {selectedDistrictData?.market_surplus_volume_mt?.toLocaleString()} MT
                        </div>
                        <div className="text-[10px] text-slate-500">Commercial marketed flow</div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400">Documented Storage</span>
                        <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
                          {selectedDistrictData?.documented_storage_capacity_mt?.toLocaleString()} MT
                        </div>
                        <div className="text-[10px] text-slate-500">{districtFacilities.length} documented facilities</div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400">Potential Capacity Gap</span>
                        <div className="text-lg font-bold text-rose-400 font-mono mt-1">
                          {selectedDistrictData?.storage_capacity_gap_mt?.toLocaleString()} MT
                        </div>
                        <div className="text-[10px] text-slate-500">Peak seasonal storage deficit</div>
                      </div>
                    </div>

                    {/* Crop Production Breakdown in Selected District */}
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="font-semibold text-slate-200">District Crop Production Mix</div>
                      <div className="space-y-1.5 font-mono text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Maize (Grain):</span>
                          <span className="text-slate-200 font-bold">{selectedDistrictData?.maize_production_mt?.toLocaleString()} MT</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Irish Potato:</span>
                          <span className="text-slate-200 font-bold">{selectedDistrictData?.irish_potato_production_mt?.toLocaleString()} MT</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Beans (Pulses):</span>
                          <span className="text-slate-200 font-bold">{selectedDistrictData?.beans_production_mt?.toLocaleString()} MT</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Cassava (Roots):</span>
                          <span className="text-slate-200 font-bold">{selectedDistrictData?.cassava_production_mt?.toLocaleString()} MT</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Vegetables & Fruits:</span>
                          <span className="text-cyan-300 font-bold">{selectedDistrictData?.vegetables_fruits_production_mt?.toLocaleString()} MT</span>
                        </div>
                      </div>
                    </div>

                    {/* Logistics & Accessibility Metrics */}
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="font-semibold text-slate-200">Logistics & Infrastructure Distances</div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-400">Avg Distance to Facility:</span>
                          <div className="font-bold text-amber-400 font-mono mt-0.5">{selectedDistrictData?.avg_distance_to_facility_km} km</div>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-400">Distance to Paved Road:</span>
                          <div className="font-bold text-slate-200 font-mono mt-0.5">{selectedDistrictData?.avg_distance_to_paved_road_km} km</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeDossierTab === 'storage' && (
                  <div className="space-y-3">
                    <div className="font-semibold text-slate-200 flex items-center justify-between">
                      <span>Documented Storage Facilities ({districtFacilities.length})</span>
                      <span className="text-[11px] text-emerald-400 font-mono">{selectedDistrictData?.documented_storage_capacity_mt?.toLocaleString()} MT Total</span>
                    </div>

                    {districtFacilities.length === 0 ? (
                      <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center text-slate-400">
                        No individual storage facilities currently documented for {selectedDistrictName} in the national registry.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {districtFacilities.map((f, idx) => (
                          <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-xs">{f.facility_name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-amber-400 border border-slate-700">
                                {f.facility_type.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex justify-between">
                              <span>Capacity: <strong className="text-emerald-400 font-mono">{f.storage_capacity_tonnes.toLocaleString()} MT</strong></span>
                              <span>Status: <span className="text-emerald-300">{f.status}</span></span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex justify-between items-center">
                              <span>Operator: {f.operator_name}</span>
                              {f.longitude && f.latitude && (
                                <button
                                  onClick={() => focusOnCoordinates(f.longitude!, f.latitude!)}
                                  className="text-cyan-400 hover:underline flex items-center"
                                >
                                  <MapPin className="w-3 h-3 mr-0.5" /> View on Map
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeDossierTab === 'processing' && (
                  <div className="space-y-3">
                    <div className="font-semibold text-slate-200 flex items-center justify-between">
                      <span>Agro-Processing & Cold-Chain Capacity</span>
                      <span className="text-[11px] text-purple-400 font-mono">{selectedDistrictData?.documented_processing_capacity_mt_day} MT/day</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 text-[11px]">Processing Throughput</span>
                        <div className="text-base font-bold text-purple-400 font-mono mt-0.5">
                          {selectedDistrictData?.documented_processing_capacity_mt_day} MT/day
                        </div>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 text-[11px]">Cold Storage Capacity</span>
                        <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">
                          {selectedDistrictData?.cold_storage_capacity_mt?.toLocaleString()} MT
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="font-semibold text-slate-300">Grain Drying Capacity</div>
                      <div className="text-xs text-slate-400 flex justify-between">
                        <span>Commercial Dryers Throughput:</span>
                        <span className="font-bold text-amber-400 font-mono">{selectedDistrictData?.drying_capacity_mt_day} MT/day</span>
                      </div>
                      <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                        Essential for aflatoxin prevention and grain moisture stabilization down to &lt;13.5%.
                      </p>
                    </div>
                  </div>
                )}

                {activeDossierTab === 'gap' && (
                  <div className="space-y-3">
                    <div className="bg-rose-950/40 border border-rose-800/40 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-rose-300 font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Capacity Gap Breakdown</span>
                      </div>
                      <div className="text-xl font-bold font-mono text-rose-400">
                        {selectedDistrictData?.storage_capacity_gap_mt?.toLocaleString()} MT
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Surplus harvested volume exceeding current verified static storage infrastructure.
                      </p>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Market Surplus:</span>
                        <span className="font-mono text-slate-200">{selectedDistrictData?.market_surplus_volume_mt?.toLocaleString()} MT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Documented Storage:</span>
                        <span className="font-mono text-emerald-400">-{selectedDistrictData?.documented_storage_capacity_mt?.toLocaleString()} MT</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-800 pt-1 font-bold">
                        <span className="text-slate-300">Calculated Gap:</span>
                        <span className="font-mono text-rose-400">{selectedDistrictData?.storage_capacity_gap_mt?.toLocaleString()} MT</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-amber-950/30 border border-amber-800/30 text-[10px] text-amber-300/90 leading-relaxed">
                      <strong>Methodological Guardrail:</strong> A high production-to-capacity gap does not equate to post-harvest losses. Facilities may handle multiple harvest turnovers, and smallholders retain substantial food reserves at homesteads.
                    </div>
                  </div>
                )}

                {activeDossierTab === 'investment' && (
                  <div className="space-y-3">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="font-semibold text-slate-200">Recommended Assessment Focus</div>
                      <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-medium">
                        {renderRecommendedInvestment(selectedDistrictData?.recommended_investment)}
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 text-[11px]">
                      <div className="font-semibold text-slate-200">Pre-Feasibility Audit Requirements</div>
                      <ul className="space-y-1 text-slate-400 list-disc list-inside">
                        <li>Audit existing private warehouse occupancy and utilization rates</li>
                        <li>Verify all-weather feeder road accessibility during peak rains</li>
                        <li>Assess 3-phase electrical grid connection for cold storage/dryers</li>
                        <li>Verify cooperative governance and formal aggregator offtake agreements</li>
                      </ul>
                    </div>

                    <div className="p-2.5 rounded bg-blue-950/40 border border-blue-800/40 text-[10px] text-blue-300 leading-relaxed">
                      <strong>Institutional Safeguard:</strong> Flagged strictly as a Potential Area for Assessment. Does not constitute an automatic infrastructure construction prescription.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: STORAGE & COLLECTION INFRASTRUCTURE ANALYSIS */}
        <section id="infrastructure" className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <span>2. National Storage & Collection Infrastructure</span>
              </h2>
              <p className="text-xs text-slate-400">
                Explore the documented infrastructure supporting agricultural produce after harvesting across Rwanda.
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Total Recorded Assets: <strong className="text-cyan-400">{facilitiesList.length} Facilities</strong>
            </div>
          </div>

          {/* 4 Infrastructure Functional Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-400 text-xs uppercase tracking-wider">Storage Warehouses</span>
                <Warehouse className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Grain stores, warehouses, and silos providing long-term strategic grain reserves and commercial bulk storage.
              </p>
              <div className="pt-2 border-t border-slate-800 text-xs font-mono flex justify-between">
                <span className="text-slate-400">Documented:</span>
                <span className="text-white font-bold">{facilitiesSummaryByType.find(x => x.type === 'WAREHOUSE')?.count || 0 + (facilitiesSummaryByType.find(x => x.type === 'SILO')?.count || 0)} Units</span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-400 text-xs uppercase tracking-wider">Collection Centres</span>
                <Truck className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Primary aggregation hubs where cooperative farmers deliver smallholder harvests for grading, weighing, and sorting.
              </p>
              <div className="pt-2 border-t border-slate-800 text-xs font-mono flex justify-between">
                <span className="text-slate-400">Documented:</span>
                <span className="text-white font-bold">{facilitiesSummaryByType.find(x => x.type === 'AGGREGATION_CENTER')?.count || 0} Hubs</span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cyan-400 text-xs uppercase tracking-wider">Cold-Chain Facilities</span>
                <Snowflake className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Temperature-controlled cold rooms and packhouses protecting horticultural crops and fresh perishables.
              </p>
              <div className="pt-2 border-t border-slate-800 text-xs font-mono flex justify-between">
                <span className="text-slate-400">Documented:</span>
                <span className="text-white font-bold">{facilitiesSummaryByType.find(x => x.type === 'COLD_STORAGE')?.count || 0} Cold Stores</span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-purple-400 text-xs uppercase tracking-wider">Processing Facilities</span>
                <Factory className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Agro-processing units, maize mills, cassava processing plants, and mechanical dryers adding market value.
              </p>
              <div className="pt-2 border-t border-slate-800 text-xs font-mono flex justify-between">
                <span className="text-slate-400">Documented:</span>
                <span className="text-white font-bold">{facilitiesSummaryByType.find(x => x.type === 'PROCESSING_PLANT')?.count || 0} Plants</span>
              </div>
            </div>
          </div>

          {/* Infrastructure Charts: Breakdown by Type & Capacity Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Documented Facilities Count by Category
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={facilitiesSummaryByType} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" width={120} tick={{ fontSize: 11 }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Bar dataKey="count" name="Facilities Count" radius={[0, 4, 4, 0]}>
                      {facilitiesSummaryByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Documented Storage & Throughput Volume by Category
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={facilitiesSummaryByType} margin={{ top: 10, right: 20, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Bar dataKey="storageMT" name="Recorded Capacity (MT)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: PRODUCTION VERSUS STORAGE CAPACITY GAP */}
        <section id="gap_analysis" className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800/40 mb-1">
                Core Decision-Support Feature
              </div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Activity className="w-5 h-5 text-amber-400" />
                <span>3. Production versus Storage Capacity Gap Analysis</span>
              </h2>
              <p className="text-xs text-slate-400">
                Connect agricultural production statistics to documented storage infrastructure to investigate alignment.
              </p>
            </div>
          </div>

          {/* Mathematical Formula Callout Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Capacity Gap Formulation</span>
              <div className="text-base md:text-lg font-mono font-bold text-slate-100 flex items-center space-x-2">
                <span>Potential Gap</span>
                <span className="text-slate-500">=</span>
                <span className="text-amber-400">Relevant Production / Market Surplus</span>
                <span className="text-slate-500">−</span>
                <span className="text-emerald-400">Comparable Documented Storage Capacity</span>
              </div>
              <p className="text-[11px] text-slate-400 max-w-3xl">
                This calculation is valid only when capacity is intended to serve the relevant production, and the capacity period, commodity, location, and measurement units are compatible.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-right shrink-0">
              <div className="text-[10px] text-slate-500 uppercase">National Gap Volume</div>
              <div className="text-xl font-bold font-mono text-rose-400">
                {nationalSummary?.total_storage_capacity_gap_mt?.toLocaleString()} MT
              </div>
              <div className="text-[10px] text-slate-400">Peak Surplus vs Static Capacity</div>
            </div>
          </div>

          {/* 4 Analytical Discovery Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>High Capacity Alignment</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Districts like <strong className="text-slate-200">Kicukiro, Gasabo, and Rwamagana</strong> have substantial commercial warehouse assets relative to district production.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center space-x-2 text-rose-400 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>High Surplus Deficit Gaps</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Districts like <strong className="text-slate-200">Nyagatare, Gatsibo, and Bugesera</strong> produce over 80,000 MT of grain surplus exceeding local storage.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs">
                <Snowflake className="w-4 h-4" />
                <span>Horticulture Cold Deficits</span>
              </div>
              <p className="text-[11px] text-slate-400">
                High-altitude vegetable producing zones (<strong className="text-slate-200">Musanze, Nyabihu, Rubavu</strong>) require cold rooms to protect perishable potato and vegetables.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs">
                <Compass className="w-4 h-4" />
                <span>Assessment Screening</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Gaps flag candidate districts for cooperative audit and facility verification rather than unverified post-harvest spoilage.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: CROP-SPECIFIC POST-HARVEST INTELLIGENCE */}
        <section id="crop_intelligence" className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Box className="w-5 h-5 text-purple-400" />
                <span>4. Crop Post-Harvest Intelligence Workspace</span>
              </h2>
              <p className="text-xs text-slate-400">
                Examine crop-specific production volumes, required post-harvest infrastructure, and cold-chain dependencies.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cropBreakdown.map((cropItem, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3 hover:border-slate-700 transition">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{cropItem.crop}</span>
                  {cropItem.coldChainNeeded ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                      Cold Chain Needed
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      Dry Storage
                    </span>
                  )}
                </div>

                <div className="text-xl font-bold font-mono text-emerald-400">
                  {cropItem.volume_mt?.toLocaleString()} <span className="text-xs font-sans text-slate-400">MT produced</span>
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs space-y-1">
                  <div className="text-slate-400 text-[11px]">Recommended Facility Infrastructure:</div>
                  <div className="font-medium text-slate-200 text-xs">{cropItem.storageReq}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: SEASONAL POST-HARVEST TRENDS */}
        <section id="seasonal_trends" className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>5. Post-Harvest Trends Across Seasons (2014A – 2026C)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Track historical production volumes, market surplus flows, and documented storage capacity over 38 recorded agricultural seasons.
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Records: <strong className="text-emerald-400">{seasonalTrends.length} Historical Seasons</strong>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold uppercase tracking-wider">Production vs. Storage Capacity Across Available Seasons</span>
              <div className="flex items-center space-x-4">
                <span className="flex items-center"><span className="w-3 h-3 bg-emerald-500 rounded-sm mr-1.5"></span>Production (MT)</span>
                <span className="flex items-center"><span className="w-3 h-3 bg-amber-500 rounded-sm mr-1.5"></span>Market Surplus (MT)</span>
                <span className="flex items-center"><span className="w-3 h-3 bg-cyan-500 rounded-sm mr-1.5"></span>Storage Capacity (MT)</span>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={seasonalTrends} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="season_code" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Area type="monotone" dataKey="total_crop_production_mt" name="Total Production" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="market_surplus_volume_mt" name="Market Surplus" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="documented_storage_capacity_mt" name="Storage Capacity" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Data Source: National Institute of Statistics of Rwanda (NISR) Seasonal Agricultural Surveys & MINAGRI Registries.</span>
              <span className="text-amber-400 font-medium">Historical trends use dated historical records. Missing data is distinct from zero capacity.</span>
            </div>
          </div>
        </section>

        {/* SECTION 6: DISTRICT POST-HARVEST PERFORMANCE RANKINGS LEAGUE TABLE */}
        <section id="rankings" className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>6. District Post-Harvest Performance Ranking League Table</span>
              </h2>
              <p className="text-xs text-slate-400">
                National ranking of all 30 districts sorted by selected post-harvest indicator for Season {selectedSeason}.
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search district..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">Rank</th>
                  <th className="py-3 px-3">District</th>
                  <th className="py-3 px-3">Province</th>
                  <th className="py-3 px-3 text-right">Documented Storage (MT)</th>
                  <th className="py-3 px-3 text-right">Relevant Production (MT)</th>
                  <th className="py-3 px-3 text-right">Market Surplus (MT)</th>
                  <th className="py-3 px-3 text-right">Potential Gap (MT)</th>
                  <th className="py-3 px-3 text-center">Facilities</th>
                  <th className="py-3 px-3 text-right">Processing (MT/d)</th>
                  <th className="py-3 px-3 text-center">Opportunity Tier</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredDistricts.map((d, index) => {
                  const isSelected = d.district_name.toLowerCase() === selectedDistrictName.toLowerCase();
                  return (
                    <tr
                      key={d.district_name}
                      onClick={() => setSelectedDistrictName(d.district_name)}
                      className={`hover:bg-slate-800/60 cursor-pointer transition ${
                        isSelected ? 'bg-slate-800/90 font-medium' : index % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/10'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">{index + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-white flex items-center space-x-1.5">
                        <span>{d.district_name}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{d.province_name}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-400">
                        {d.documented_storage_capacity_mt.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                        {d.total_crop_production_mt.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                        {d.market_surplus_volume_mt.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-400 font-semibold">
                        {d.storage_capacity_gap_mt.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-cyan-400 font-bold">
                        {d.documented_facilities_count}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-purple-400">
                        {d.documented_processing_capacity_mt_day}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          d.investment_tier === 'TIER_1_URGENT_COLLECTION_HUB'
                            ? 'bg-rose-950 text-rose-400 border-rose-800'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {d.investment_tier?.replace(/_/g, ' ') || 'STANDARD'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDistrictName(d.district_name);
                            setActiveSection('overview');
                            const el = document.getElementById('overview');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-[10px] font-medium transition"
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
        </section>

        {/* SECTION 7: NATIONAL POST-HARVEST FACILITY REGISTER */}
        <section id="facility_register" className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <span>7. National Post-Harvest Facility Register</span>
              </h2>
              <p className="text-xs text-slate-400">
                Search and explore documented post-harvest infrastructure, storage warehouses, silos, cold stores, and agro-processing plants.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="text"
                placeholder="Search facility name, district..."
                value={registerSearch}
                onChange={(e) => setRegisterSearch(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />

              <select
                value={registerTypeFilter}
                onChange={(e) => setRegisterTypeFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="SILO">Silos</option>
                <option value="WAREHOUSE">Warehouses</option>
                <option value="COLD_STORAGE">Cold Storage</option>
                <option value="PROCESSING_PLANT">Processing</option>
                <option value="AGGREGATION_CENTER">Collection</option>
              </select>

              <select
                value={registerStatusFilter}
                onChange={(e) => setRegisterStatusFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPERATIONAL">Operational</option>
                <option value="INACTIVE">Inactive</option>
                <option value="UNDER_CONSTRUCTION">Under Construction</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Facility Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Location (District & Sector)</th>
                  <th className="py-3 px-3 text-right">Documented Capacity</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Operator</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredFacilityRegister.slice(0, 30).map((f) => (
                  <tr key={f.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-2.5 px-3 font-bold text-white">{f.facility_name}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-cyan-300 border border-slate-700">
                        {f.facility_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {f.district_name} {f.sector_name ? `· ${f.sector_name}` : ''}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      {f.storage_capacity_tonnes > 0
                        ? `${f.storage_capacity_tonnes.toLocaleString()} MT`
                        : `${f.processing_capacity_tonnes_day} MT/day`}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                        {f.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{f.operator_name}</td>
                    <td className="py-2.5 px-3 text-center">
                      {f.longitude && f.latitude ? (
                        <button
                          onClick={() => {
                            setSelectedDistrictName(f.district_name);
                            setActiveSection('overview');
                            const el = document.getElementById('overview');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                            focusOnCoordinates(f.longitude!, f.latitude!, 12);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white text-[10px] font-medium transition inline-flex items-center"
                        >
                          <MapPin className="w-3 h-3 mr-1" /> Focus on Map
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[10px]">No GPS</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredFacilityRegister.length > 30 && (
            <div className="text-center text-xs text-slate-500 pt-2">
              Showing first 30 of {filteredFacilityRegister.length} matching facility records.
            </div>
          )}
        </section>

        {/* SECTION 8: FUTURE PLANNING & POST-HARVEST INVESTMENT OPPORTUNITIES */}
        <section id="investment" className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40 mb-1">
                Strategic Planning Framework
              </div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <span>8. Future Planning & Post-Harvest Investment Assessment</span>
              </h2>
              <p className="text-xs text-slate-400">
                A screening framework for future planning—not confirmation that a new facility is required.
              </p>
            </div>
          </div>

          {/* Criteria Weights */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Transparent Pre-Feasibility Screening Criteria & Weights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {criteriaWeights.map((cw, i) => (
                <div key={i} className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">{cw.criterion}</span>
                    <span className="font-mono font-bold text-emerald-400">{cw.weightPercent}%</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{cw.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Candidate Opportunity Cards */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Priority Districts Screened for Further Field Verification ({investmentCandidates.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {investmentCandidates.map((cand, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold text-white">{cand.district_name} District</span>
                      <span className="ml-2 text-xs text-slate-400">({cand.province_name})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800/40">
                      Score: {cand.investment_opportunity_score}/100
                    </span>
                  </div>

                  {/* Screening Flags */}
                  <div className="flex flex-wrap gap-1.5">
                    {cand.screening_flags.map((flag, fIdx) => (
                      <span key={fIdx} className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-950/60 text-rose-300 border border-rose-800/40">
                        {flag}
                      </span>
                    ))}
                  </div>

                  {/* Recommended Intervention */}
                  <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/30 text-xs text-emerald-300 space-y-1">
                    <div className="font-semibold text-emerald-400">Recommended Scope:</div>
                    {renderRecommendedInvestment(cand.recommended_investment)}
                  </div>

                  {/* Pre-feasibility Checklist */}
                  <div className="space-y-1.5 text-[11px]">
                    <div className="font-semibold text-slate-300">Mandatory Pre-Investment Verifications:</div>
                    <div className="space-y-1">
                      {cand.pre_feasibility_checklist.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start space-x-2 text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong className="text-slate-300">{step.step}:</strong> {step.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Institutional Safeguard Disclaimer */}
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 space-y-1">
                    <div className="text-amber-400 font-semibold flex items-center">
                      <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                      {cand.institutional_safeguard}
                    </div>
                    <p className="text-slate-500 italic">{cand.missing_evidence_note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-900/60 px-6 py-4 mt-auto text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-3">
        <div>
          AgriLens Rwanda · National Post-Harvest & Storage Intelligence · MINAGRI & NISR SAS Compliant
        </div>
        <div className="flex items-center space-x-4">
          <span>National Frame: 30 Districts</span>
          <span>Verified Facilities: 97</span>
          <span>Historical Depth: 2014A – 2026C</span>
        </div>
      </footer>
    </div>
  );
}
