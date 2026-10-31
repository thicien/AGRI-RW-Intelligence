import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { apiUrl } from '../../config/api';
import { 
  Globe, Plane, Ship, TrendingUp, TrendingDown, DollarSign, Scale, 
  ShieldAlert, Award, FileText, CheckCircle2, AlertTriangle, Filter, 
  Search, Download, RefreshCw, Layers, Compass, ArrowUpRight, 
  ArrowDownRight, Sparkles, Building2, MapPin, Package, Check,
  BarChart3, Info, ExternalLink, Calendar, Truck, Box, ShieldCheck,
  Target, ChevronRight, SlidersHorizontal, Eye, Flame, Snowflake,
  Lock, CheckSquare, HelpCircle, Activity, ChevronDown
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  CartesianGrid, Cell, AreaChart, Area, LineChart, Line, Legend, PieChart, Pie
} from 'recharts';

export type IntelligenceLayerType = 'export_value' | 'export_volume' | 'export_readiness' | 'exportable_surplus' | 'exit_distance' | 'certification';

export interface CommodityProfile {
  id: string;
  product_name: string;
  product_category: string;
  hs_code: string;
  domestic_production_mt: number;
  export_quantity_mt: number;
  export_value_usd: number;
  unit_value_usd_per_mt: number;
  income_share_pct: number;
  growth_trend_pct: number;
  performance_status: string;
  net_trade_status: string;
  primary_destinations: string[];
  peak_months: string[];
  phytosanitary_rules: any;
  quality_standards: {
    exportProductForm: string;
    qualityGrade: string;
    moistureLimit: string;
    packaging: string;
    certifications: string[];
    phytosanitary: string;
    marketBarriers: string;
    readinessPillars: {
      supply: number;
      quality: number;
      processing: number;
      logistics: number;
      market: number;
    };
  };
}

export interface DestinationMarket {
  country_name: string;
  region: string;
  commodities: string[];
  total_export_value_usd: number;
  total_export_quantity_mt: number;
  unit_value_usd_per_mt: number;
  market_share_pct: number;
  tariff_protocol: string;
}

export interface DistrictExportStat {
  id: string;
  district_name: string;
  province_name: string;
  season_code: string;
  year: number;
  season_name: string;
  primary_export_crops: string[];
  total_crop_production_mt: number;
  market_surplus_volume_mt: number;
  estimated_exportable_volume_mt: number;
  export_readiness_score: number;
  export_tier: string;
  nearest_exit_hub: string;
  distance_to_exit_km: number;
  cooperatives_export_ready_count: number;
  quality_certification_pct: number;
  longitude: number;
  latitude: number;
}

export interface ExportExitHub {
  hub_name: string;
  hub_type: string;
  location_desc: string;
  coordinates: [number, number];
  primary_commodities: string[];
  infrastructure: string;
  operational_status: string;
  serviced_districts_count: number;
}

export interface ExportSupportingFacility {
  id: string;
  facility_name: string;
  facility_type: string;
  status: string;
  district_name: string;
  sector_name?: string;
  operator_name: string;
  storage_capacity_tonnes: number;
  processing_capacity_tonnes_day: number;
  cold_storage_capacity_tonnes: number;
  drying_capacity_tonnes_day: number;
  longitude: number | null;
  latitude: number | null;
  last_verified_at?: string;
}

export interface StrategicOpportunity {
  rank: number;
  assessment_id: string;
  product_name: string;
  product_category: string;
  destination_country: string;
  destination_region: string;
  opportunity_score: number;
  opportunity_level: string;
  classification: string;
  pillar_scores: {
    production: number;
    demand: number;
    logistics: number;
    standards: number;
    risk: number;
  };
  evidence_summary: string;
  constraints_and_limitations: string;
  pre_feasibility_checklist: { step: string; status: string; note: string }[];
  institutional_safeguard: string;
}

export default function ExportImportIntelligence() {
  // Navigation & Filter States
  const [selectedSeason, setSelectedSeason] = useState<string>('2025A');
  const [compareSeason, setCompareSeason] = useState<string>('2024A');
  const [selectedCommodity, setSelectedCommodity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDestination, setSelectedDestination] = useState<string>('ALL');
  const [selectedProvince, setSelectedProvince] = useState<string>('ALL');
  const [selectedLayer, setSelectedLayer] = useState<IntelligenceLayerType>('export_value');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('Nyarugenge');
  const [searchDistrict, setSearchDistrict] = useState<string>('');
  const [activeDossierTab, setActiveDossierTab] = useState<'overview' | 'crops' | 'logistics' | 'quality' | 'assessment'>('overview');
  const [showExitHubs, setShowExitHubs] = useState<boolean>(true);
  const [showFacilityMarkers, setShowFacilityMarkers] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<string>('overview');

  // Loading & Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [availableSeasons, setAvailableSeasons] = useState<any[]>([]);
  const [nationalSummary, setNationalSummary] = useState<any>(null);
  const [commoditiesCatalogue, setCommoditiesCatalogue] = useState<CommodityProfile[]>([]);
  const [internationalMarkets, setInternationalMarkets] = useState<DestinationMarket[]>([]);
  const [marketConcentration, setMarketConcentration] = useState<any>(null);
  const [seasonalComparison, setSeasonalComparison] = useState<any[]>([]);
  const [districts, setDistricts] = useState<DistrictExportStat[]>([]);
  const [exportHubs, setExportHubs] = useState<ExportExitHub[]>([]);
  const [exportFacilities, setExportFacilities] = useState<ExportSupportingFacility[]>([]);
  const [strategicOpportunities, setStrategicOpportunities] = useState<StrategicOpportunity[]>([]);

  // Selected Commodity for Deep Inspection
  const [inspectedCommodityName, setInspectedCommodityName] = useState<string>('Tea');

  // Register Filters
  const [facilitySearch, setFacilitySearch] = useState<string>('');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState<string>('ALL');

  // Map references
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const hubMarkersRef = useRef<maplibregl.Marker[]>([]);
  const facilityMarkersRef = useRef<maplibregl.Marker[]>([]);
  const geojsonLoadedRef = useRef<boolean>(false);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  // Synchronized refs for MapLibre events
  const districtsRef = useRef<DistrictExportStat[]>([]);
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
      const url = `${apiUrl('trade')}/decision-workspace?season=${selectedSeason}&compareSeason=${compareSeason}&commodity=${selectedCommodity}&destination=${selectedDestination}&province=${selectedProvince}&layer=${selectedLayer}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.meta?.availableSeasons) {
          setAvailableSeasons(data.meta.availableSeasons);
        }
        setNationalSummary(data.nationalSummary || null);
        setCommoditiesCatalogue(data.commoditiesCatalogue || []);
        setInternationalMarkets(data.internationalMarkets || []);
        setMarketConcentration(data.marketConcentration || null);
        setSeasonalComparison(data.seasonalComparison || []);
        setDistricts(data.districtContributions || []);
        setExportHubs(data.exportHubs || []);
        setExportFacilities(data.exportFacilities || []);
        setStrategicOpportunities(data.strategicOpportunities || []);

        if (data.commoditiesCatalogue?.length > 0 && !inspectedCommodityName) {
          setInspectedCommodityName(data.commoditiesCatalogue[0].product_name);
        }
      }
    } catch (err) {
      console.error('Failed to load trade decision workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [selectedSeason, compareSeason, selectedCommodity, selectedCategory, selectedDestination, selectedProvince, selectedLayer]);

  // Selected District Dossier Object
  const selectedDistrictData = useMemo(() => {
    return districts.find(d => d.district_name.toLowerCase() === selectedDistrictName.toLowerCase()) || districts[0] || null;
  }, [districts, selectedDistrictName]);

  // Currently Inspected Commodity Profile
  const inspectedCommodity = useMemo(() => {
    return commoditiesCatalogue.find(c => c.product_name.toLowerCase() === inspectedCommodityName.toLowerCase()) || commoditiesCatalogue[0] || null;
  }, [commoditiesCatalogue, inspectedCommodityName]);

  // Layer Indicator Configuration
  const layerConfig = useMemo(() => {
    switch (selectedLayer) {
      case 'export_value':
        return {
          title: 'Export Earnings Revenue',
          unit: 'USD',
          badge: 'Trade Earnings',
          description: 'Attributable national and regional export revenue generated by agricultural output.',
          getValue: (d: DistrictExportStat) => d.estimated_exportable_volume_mt * 1250, // indicative valuation
          format: (v: number) => `$${Math.round(v).toLocaleString()}`,
          colorRamp: ['#d1fae5', '#6ee7b7', '#10b981', '#059669', '#047857'],
        };
      case 'export_volume':
      case 'exportable_surplus':
        return {
          title: 'Estimated Exportable Surplus',
          unit: 'Tonnes (MT)',
          badge: 'Export Volume',
          description: 'Documented marketable harvest surplus meeting export commodity requirements.',
          getValue: (d: DistrictExportStat) => d.estimated_exportable_volume_mt,
          format: (v: number) => `${v.toLocaleString()} MT`,
          colorRamp: ['#e0f2fe', '#7dd3fc', '#0284c7', '#0369a1', '#075985'],
        };
      case 'export_readiness':
        return {
          title: 'District Export Readiness Index',
          unit: 'Score (0-100)',
          badge: 'Export Readiness',
          description: 'Composite readiness combining export cooperative density, quality certification, and exit proximity.',
          getValue: (d: DistrictExportStat) => d.export_readiness_score,
          format: (v: number) => `${v.toFixed(1)}/100`,
          colorRamp: ['#fef3c7', '#fde68a', '#f59e0b', '#d97706', '#b45309'],
        };
      case 'exit_distance':
        return {
          title: 'Distance to Nearest Export Exit Hub',
          unit: 'km',
          badge: 'Logistics Access',
          description: 'Travel distance from district administrative center to nearest border post or air cargo terminal.',
          getValue: (d: DistrictExportStat) => d.distance_to_exit_km,
          format: (v: number) => `${v} km`,
          colorRamp: ['#047857', '#10b981', '#f59e0b', '#f97316', '#dc2626'], // inverted (lower is greener)
        };
      case 'certification':
        return {
          title: 'Quality Certification Adoption',
          unit: '% of Coops',
          badge: 'Standards Compliance',
          description: 'Proportion of export-oriented farmer cooperatives with verified GlobalGAP or fair trade certificates.',
          getValue: (d: DistrictExportStat) => d.quality_certification_pct,
          format: (v: number) => `${v}%`,
          colorRamp: ['#ede9fe', '#c4b5fd', '#8b5cf6', '#6d28d9', '#4c1d95'],
        };
    }
  }, [selectedLayer]);

  // Color Calculation for District Choropleth
  const getDistrictChoroplethColor = (d: DistrictExportStat | undefined): string => {
    if (!d) return '#334155';
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
            attribution: '&copy; OpenStreetMap contributors | NAEB, MINICOM & NISR Rwanda',
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
            className: 'export-tooltip',
          });

          // Hover Interactivity
          mapInstance.current.on('mousemove', 'district-fill', (e) => {
            if (!mapInstance.current || !e.features || e.features.length === 0) return;
            mapInstance.current.getCanvas().style.cursor = 'pointer';

            const shapeName = e.features[0].properties?.shapeName || '';
            const match = districtsRef.current.find(d => d.district_name.toLowerCase() === shapeName.toLowerCase());

            const valStr = match ? layerConfig.format(layerConfig.getValue(match)) : 'No data recorded';
            const surpStr = match ? `${match.estimated_exportable_volume_mt.toLocaleString()} MT` : '—';
            const hubStr = match ? match.nearest_exit_hub : '—';

            popupRef.current?.setLngLat(e.lngLat).setHTML(`
              <div class="p-3 bg-slate-900/95 text-slate-100 rounded-lg shadow-2xl border border-slate-700/80 backdrop-blur-md min-w-[210px] text-xs space-y-1.5 font-sans">
                <div class="flex items-center justify-between border-b border-slate-800 pb-1">
                  <span class="font-bold text-sm text-emerald-400">${shapeName} District</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">${match?.province_name || 'Rwanda'}</span>
                </div>
                <div class="pt-1 space-y-1">
                  <div class="flex justify-between items-center text-slate-300">
                    <span class="text-slate-400">${layerConfig.title}:</span>
                    <span class="font-bold text-amber-400 font-mono">${valStr}</span>
                  </div>
                  <div class="flex justify-between items-center text-slate-300">
                    <span class="text-slate-400">Exportable Surplus:</span>
                    <span class="font-mono text-slate-200">${surpStr}</span>
                  </div>
                  <div class="flex justify-between items-center text-slate-300">
                    <span class="text-slate-400">Nearest Exit Hub:</span>
                    <span class="text-[11px] text-cyan-300 truncate max-w-[120px]">${hubStr}</span>
                  </div>
                  <div class="flex justify-between items-center text-slate-300">
                    <span class="text-slate-400">Readiness Score:</span>
                    <span class="font-bold text-emerald-400 font-mono">${match?.export_readiness_score || 0}/100</span>
                  </div>
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
        console.error('Error loading Rwanda district geojson in export map:', err);
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

  // Update Export Hub Markers on Map
  useEffect(() => {
    if (!mapInstance.current) return;

    hubMarkersRef.current.forEach(m => m.remove());
    hubMarkersRef.current = [];

    if (!showExitHubs) return;

    exportHubs.forEach(hub => {
      const el = document.createElement('div');
      el.className = 'w-6 h-6 rounded-full border-2 border-amber-300 bg-amber-500 shadow-xl flex items-center justify-center cursor-pointer transform transition-transform hover:scale-150';
      el.innerHTML = '<svg class="w-3 h-3 text-slate-950 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>';
      el.title = `${hub.hub_name} (${hub.hub_type})`;

      const popup = new maplibregl.Popup({ offset: 14, className: 'export-hub-popup' }).setHTML(`
        <div class="p-3 bg-slate-900 text-slate-100 rounded-lg shadow-2xl border border-amber-500/50 min-w-[220px] text-xs font-sans space-y-1.5">
          <div class="font-bold text-amber-400 border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>${hub.hub_name}</span>
          </div>
          <div class="text-[11px] text-slate-300"><span class="text-slate-400">Type:</span> <span class="font-semibold text-emerald-400">${hub.hub_type.replace(/_/g, ' ')}</span></div>
          <div class="text-[11px] text-slate-300"><span class="text-slate-400">Location:</span> ${hub.location_desc}</div>
          <div class="text-[11px] text-slate-300"><span class="text-slate-400">Primary Cargo:</span> <span class="text-cyan-300">${hub.primary_commodities.join(', ')}</span></div>
          <div class="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">${hub.infrastructure}</div>
          <div class="text-[10px] text-emerald-400 font-semibold">Serving ${hub.serviced_districts_count} productive districts</div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(hub.coordinates)
        .setPopup(popup)
        .addTo(mapInstance.current!);

      hubMarkersRef.current.push(marker);
    });
  }, [exportHubs, showExitHubs]);

  // Update Facility Markers on Map
  useEffect(() => {
    if (!mapInstance.current) return;

    facilityMarkersRef.current.forEach(m => m.remove());
    facilityMarkersRef.current = [];

    if (!showFacilityMarkers) return;

    const visibleFacilities = exportFacilities.filter(f => f.longitude !== null && f.latitude !== null);

    visibleFacilities.forEach(f => {
      const el = document.createElement('div');
      el.className = 'w-3 h-3 rounded-full border border-cyan-300 bg-cyan-500 shadow-md cursor-pointer transform transition-transform hover:scale-150';
      el.title = `${f.facility_name} (${f.facility_type})`;

      const popup = new maplibregl.Popup({ offset: 10, className: 'export-fac-popup' }).setHTML(`
        <div class="p-2.5 bg-slate-900 text-slate-100 rounded-lg shadow-xl border border-slate-700 min-w-[190px] text-xs font-sans space-y-1">
          <div class="font-bold text-white border-b border-slate-800 pb-1">${f.facility_name}</div>
          <div class="text-[11px] text-slate-300"><span class="text-slate-400">Category:</span> <span class="text-emerald-400">${f.facility_type.replace('_', ' ')}</span></div>
          <div class="text-[11px] text-slate-300"><span class="text-slate-400">District:</span> ${f.district_name}</div>
          <div class="text-[11px] text-slate-300"><span class="text-slate-400">Capacity:</span> <span class="font-mono text-amber-300">${f.storage_capacity_tonnes > 0 ? `${f.storage_capacity_tonnes.toLocaleString()} MT` : `${f.processing_capacity_tonnes_day} MT/d`}</span></div>
          <div class="text-[10px] text-slate-400"><span class="text-slate-500">Operator:</span> ${f.operator_name}</div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([f.longitude!, f.latitude!])
        .setPopup(popup)
        .addTo(mapInstance.current!);

      facilityMarkersRef.current.push(marker);
    });
  }, [exportFacilities, showFacilityMarkers]);

  // Focus map on coordinates
  const focusOnCoordinates = (lng: number, lat: number, zoomLevel: number = 11.5) => {
    if (!mapInstance.current) return;
    mapInstance.current.flyTo({
      center: [lng, lat],
      zoom: zoomLevel,
      essential: true,
      duration: 1600,
    });
  };

  // Export CSV Dataset
  const handleExportCSV = () => {
    if (!commoditiesCatalogue || commoditiesCatalogue.length === 0) return;
    const headers = [
      'Commodity', 'Category', 'HS Code', 'Season', 'Export Value (USD)', 'Export Quantity (MT)',
      'Unit Value (USD/MT)', 'Income Share (%)', 'Growth Trend (%)', 'Net Trade Status',
      'Primary Destinations', 'Quality Grade', 'Moisture Limit'
    ];

    const rows = commoditiesCatalogue.map(c => [
      `"${c.product_name}"`,
      `"${c.product_category}"`,
      `"${c.hs_code}"`,
      `"${selectedSeason}"`,
      c.export_value_usd,
      c.export_quantity_mt,
      c.unit_value_usd_per_mt,
      c.income_share_pct,
      c.growth_trend_pct,
      `"${c.net_trade_status}"`,
      `"${c.primary_destinations.join('; ')}"`,
      `"${c.quality_standards?.qualityGrade || ''}"`,
      `"${c.quality_standards?.moistureLimit || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rwanda_Export_Intelligence_${selectedSeason}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered District Rankings
  const filteredDistricts = useMemo(() => {
    return districts
      .filter(d => {
        if (selectedProvince !== 'ALL' && d.province_name.toLowerCase() !== selectedProvince.toLowerCase()) return false;
        if (searchDistrict && !d.district_name.toLowerCase().includes(searchDistrict.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (selectedLayer === 'export_value' || selectedLayer === 'export_volume' || selectedLayer === 'exportable_surplus') {
          return b.estimated_exportable_volume_mt - a.estimated_exportable_volume_mt;
        }
        if (selectedLayer === 'export_readiness') return b.export_readiness_score - a.export_readiness_score;
        if (selectedLayer === 'exit_distance') return a.distance_to_exit_km - b.distance_to_exit_km;
        if (selectedLayer === 'certification') return b.quality_certification_pct - a.quality_certification_pct;
        return b.estimated_exportable_volume_mt - a.estimated_exportable_volume_mt;
      });
  }, [districts, selectedProvince, searchDistrict, selectedLayer]);

  // Filtered Facilities for Register
  const filteredFacilities = useMemo(() => {
    return exportFacilities.filter(f => {
      if (facilityTypeFilter !== 'ALL' && f.facility_type !== facilityTypeFilter) return false;
      if (facilitySearch) {
        const q = facilitySearch.toLowerCase();
        return f.facility_name.toLowerCase().includes(q) || f.district_name.toLowerCase().includes(q) || f.operator_name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [exportFacilities, facilityTypeFilter, facilitySearch]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. INSTITUTIONAL HEADER & BANNER */}
      <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-30 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-semibold tracking-wider uppercase text-emerald-400">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>National Agricultural Planner · Module 5: Export Opportunities</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">NAEB · MINICOM · NISR Trade Statistics</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-3">
              <span>National Export Opportunities Intelligence</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                Planning & Intelligence Centre
              </span>
            </h1>
            <p className="text-xs text-slate-400 max-w-4xl">
              National planning focus: export crops, product quality, market access, seasonal supply, district contributions and infrastructure readiness.
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
              title="Download nationwide agricultural export dataset"
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
              { id: 'catalogue', label: '2. Export Commodity Catalogue & Quality', icon: Package },
              { id: 'markets', label: '3. International Destination Markets', icon: Globe },
              { id: 'trends', label: '4. Seasonal Export Comparisons', icon: TrendingUp },
              { id: 'hubs', label: '5. Export Exit Hubs & Infrastructure', icon: Plane },
              { id: 'districts', label: '6. District Export Contributions', icon: Award },
              { id: 'rankings', label: '7. Commodity Earnings Rankings', icon: DollarSign },
              { id: 'facilities', label: '8. Export Supporting Facilities', icon: Building2 },
              { id: 'readiness', label: '9. Supply, Quality & Readiness', icon: ShieldCheck },
              { id: 'opportunities', label: '10. Strategic Opportunities & Reports', icon: Target },
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
              Reporting Season
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

          {/* B. Commodity Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center">
              <Package className="w-3 h-3 mr-1 text-amber-400" />
              Export Commodity
            </label>
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="w-full bg-slate-800 text-slate-100 border border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              <option value="ALL">All Commodities (National Total)</option>
              {commoditiesCatalogue.map(c => (
                <option key={c.product_name} value={c.product_name}>
                  {c.product_name}
                </option>
              ))}
            </select>
          </div>

          {/* C. Commodity Category */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center">
              <Layers className="w-3 h-3 mr-1 text-cyan-400" />
              Product Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-800 text-slate-100 border border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="TRADITIONAL_EXPORT">Traditional Exports (Tea, Coffee)</option>
              <option value="HORTICULTURE">Horticulture (Avocado, Beans, Chili)</option>
              <option value="FOOD_CROP">Food Crops (Irish Potato, Cassava)</option>
              <option value="PROCESSED_CROP">Processed & Value-Added (Macadamia)</option>
            </select>
          </div>

          {/* D. Destination Market */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center">
              <Globe className="w-3 h-3 mr-1 text-purple-400" />
              Destination Market
            </label>
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className="w-full bg-slate-800 text-slate-100 border border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
            >
              <option value="ALL">All International Markets</option>
              {internationalMarkets.map(m => (
                <option key={m.country_name} value={m.country_name}>
                  {m.country_name} ({m.region})
                </option>
              ))}
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

          {/* F. Intelligence Layer */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center">
              <SlidersHorizontal className="w-3 h-3 mr-1 text-blue-400" />
              Intelligence Layer
            </label>
            <select
              value={selectedLayer}
              onChange={(e) => setSelectedLayer(e.target.value as IntelligenceLayerType)}
              className="w-full bg-slate-800 text-slate-100 border border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="export_value">Export Earnings (USD)</option>
              <option value="export_volume">Export Volume (MT)</option>
              <option value="export_readiness">Export Readiness Index</option>
              <option value="exportable_surplus">Exportable Surplus Volume</option>
              <option value="exit_distance">Distance to Exit Hub</option>
              <option value="certification">Quality Certification Adoption</option>
            </select>
          </div>
        </div>
      </section>

      {/* MAIN ANALYTICAL BODY */}
      <main className="max-w-7xl mx-auto w-full px-6 py-6 space-y-10 flex-1">
        {/* SECTION 1: NATIONAL EXPORT PERFORMANCE OVERVIEW */}
        <section id="overview" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span>
              <span>1. National Agricultural Export Performance Overview</span>
            </h2>
            <div className="text-xs text-slate-400 flex items-center space-x-3">
              <span className="flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                Contributing Districts: <strong className="ml-1 text-slate-200">30 of 30 Districts (100%)</strong>
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center">
                <Globe className="w-3.5 h-3.5 text-purple-400 mr-1" />
                Destination Markets: <strong className="ml-1 text-slate-200">{nationalSummary?.destination_countries_count || 17} Countries</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Export Income */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Total Export Income</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-white font-mono">
                ${nationalSummary?.total_export_value_usd ? (nationalSummary.total_export_value_usd / 1000000).toFixed(1) : '—'}{' '}
                <span className="text-sm font-sans font-normal text-slate-400">Million USD</span>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span>Equivalent: <strong className="text-slate-200 font-mono">{nationalSummary?.total_export_value_rwf ? (nationalSummary.total_export_value_rwf / 1000000000).toFixed(1) : '—'}B RWF</strong></span>
                {nationalSummary?.export_value_change_pct !== undefined && (
                  <span className={`inline-flex items-center font-semibold font-mono ${nationalSummary.export_value_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {nationalSummary.export_value_change_pct >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {Math.abs(nationalSummary.export_value_change_pct)}% vs {compareSeason}
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Exported Quantity Volume */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Exported Quantity</span>
                <Scale className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-white font-mono">
                {nationalSummary?.total_export_quantity_mt?.toLocaleString() || '—'}{' '}
                <span className="text-sm font-sans font-normal text-slate-400">tonnes</span>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span>Avg Unit Value: <strong className="text-slate-200 font-mono">${nationalSummary?.avg_unit_export_value_usd_per_mt}/MT</strong></span>
                {nationalSummary?.export_quantity_change_pct !== undefined && (
                  <span className={`inline-flex items-center font-semibold font-mono ${nationalSummary.export_quantity_change_pct >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                    {nationalSummary.export_quantity_change_pct >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {Math.abs(nationalSummary.export_quantity_change_pct)}% vs {compareSeason}
                  </span>
                )}
              </div>
            </div>

            {/* Card 3: Exporting Commodities */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Exporting Commodities</span>
                <Package className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-white font-mono">
                {nationalSummary?.active_export_commodities_count || commoditiesCatalogue.length || '—'}{' '}
                <span className="text-sm font-sans font-normal text-slate-400">commodities</span>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span>Top earner: <strong className="text-slate-200">Tea ($91.4M) & Coffee ($74.4M)</strong></span>
                <span className="text-emerald-400 font-medium">100% Documented</span>
              </div>
            </div>

            {/* Card 4: Documented Export Hubs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Documented Export Hubs</span>
                <Plane className="w-4 h-4 text-purple-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-white font-mono">
                {nationalSummary?.documented_export_hubs_count || exportHubs.length || '—'}{' '}
                <span className="text-sm font-sans font-normal text-slate-400">verified hubs</span>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span>Air cargo, border posts & ports</span>
                <span className="text-purple-400 font-medium font-mono">Geocoded</span>
              </div>
            </div>
          </div>

          {/* Value vs. Volume Decoupling Callout Banner */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white">Value vs. Volume Growth Decoupling Analysis: </span>
                <span className="text-emerald-400 font-semibold">{nationalSummary?.value_vs_volume_decoupling || 'Balanced growth across revenue and physical volume'}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  A planner can distinguish growth in export quantity from growth in export income. Income can rise from price premiums even when exported volume remains stable.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-slate-400 text-[11px]">Net Agricultural Trade Balance:</span>
              <div className="font-mono font-bold text-emerald-400 text-sm">
                +${((nationalSummary?.net_trade_balance_usd || 185000000) / 1000000).toFixed(1)}M USD
              </div>
            </div>
          </div>

          {/* INTERACTIVE RWANDA EXPORT HUB MAP & DISTRICT EXPORT DOSSIER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
            {/* Left Column: Rwanda Export Map (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[650px] shadow-sm">
              <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <h3 className="font-bold text-slate-100 flex items-center space-x-2">
                    <Plane className="w-4 h-4 text-emerald-400" />
                    <span>National Export Hub & Supply Infrastructure Map</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    National view · District boundaries · Indicator: <span className="text-amber-400 font-semibold">{layerConfig.title}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-1.5 cursor-pointer bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-[11px] border border-slate-700">
                    <input
                      type="checkbox"
                      checked={showExitHubs}
                      onChange={(e) => setShowExitHubs(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-0 w-3 h-3"
                    />
                    <span className="text-amber-300 font-medium">Exit Hubs ({exportHubs.length})</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-[11px] border border-slate-700">
                    <input
                      type="checkbox"
                      checked={showFacilityMarkers}
                      onChange={(e) => setShowFacilityMarkers(e.target.checked)}
                      className="rounded text-cyan-500 focus:ring-0 w-3 h-3"
                    />
                    <span className="text-cyan-300 font-medium">Export Facilities ({exportFacilities.length})</span>
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
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5"></span>
                      Verified Exit Hub
                    </span>
                    <span className="text-amber-400 font-medium">Selected: {selectedDistrictName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: District Export Profile Dossier (5 cols) */}
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
                  <p className="text-xs text-slate-400">Export Sourcing Profile · Season {selectedSeason}</p>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                    selectedDistrictData?.export_tier === 'TIER_1_GLOBAL_EXPORT_HUB'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border-amber-800'
                  }`}>
                    {selectedDistrictData?.export_tier?.replace(/_/g, ' ') || 'EXPORT_PRODUCER'}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1">Export Readiness: {selectedDistrictData?.export_readiness_score || 0}/100</div>
                </div>
              </div>

              {/* Dossier Tabs */}
              <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs font-medium">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'crops', label: 'Export Crops' },
                  { id: 'logistics', label: 'Logistics' },
                  { id: 'quality', label: 'Standards' },
                  { id: 'assessment', label: 'Assessment' },
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

              {/* Dossier Content */}
              <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs text-slate-300">
                {activeDossierTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400">Exportable Surplus Volume</span>
                        <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
                          {selectedDistrictData?.estimated_exportable_volume_mt?.toLocaleString()} MT
                        </div>
                        <div className="text-[10px] text-slate-500">Commercial export flow</div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400">Total Crop Production</span>
                        <div className="text-lg font-bold text-white font-mono mt-1">
                          {selectedDistrictData?.total_crop_production_mt?.toLocaleString()} MT
                        </div>
                        <div className="text-[10px] text-slate-500">Seasonal district total</div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400">Export-Ready Cooperatives</span>
                        <div className="text-lg font-bold text-cyan-400 font-mono mt-1">
                          {selectedDistrictData?.cooperatives_export_ready_count || 0} Coops
                        </div>
                        <div className="text-[10px] text-slate-500">Formally registered aggregators</div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400">Quality Certified Share</span>
                        <div className="text-lg font-bold text-purple-400 font-mono mt-1">
                          {selectedDistrictData?.quality_certification_pct || 0}%
                        </div>
                        <div className="text-[10px] text-slate-500">Certified smallholder plots</div>
                      </div>
                    </div>

                    {/* Exit Hub Distance */}
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="font-semibold text-slate-200">Logistics & Exit Connectivity</div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Nearest Exit Terminal:</span>
                        <span className="font-bold text-amber-400">{selectedDistrictData?.nearest_exit_hub}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Haulage Distance:</span>
                        <span className="font-bold font-mono text-white">{selectedDistrictData?.distance_to_exit_km} km</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeDossierTab === 'crops' && (
                  <div className="space-y-3">
                    <div className="font-semibold text-slate-200">Export-Oriented Commodities Produced</div>
                    <div className="space-y-2">
                      {Array.isArray(selectedDistrictData?.primary_export_crops) && selectedDistrictData.primary_export_crops.length > 0 ? (
                        selectedDistrictData.primary_export_crops.map((crop: string, idx: number) => (
                          <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                            <span className="font-bold text-emerald-400">{crop}</span>
                            <button
                              onClick={() => setInspectedCommodityName(crop)}
                              className="text-[10px] text-cyan-400 hover:underline"
                            >
                              Inspect Quality Specs →
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded text-slate-400">
                          Traditional food crop supply zone.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeDossierTab === 'logistics' && (
                  <div className="space-y-3">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="font-semibold text-slate-200">Corridor & Exit Hub Alignment</div>
                      <p className="text-[11px] text-slate-400">
                        Primary export routing from {selectedDistrictName} connects to <strong className="text-amber-400">{selectedDistrictData?.nearest_exit_hub}</strong> over a transport radius of <strong className="text-white">{selectedDistrictData?.distance_to_exit_km} km</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {activeDossierTab === 'quality' && (
                  <div className="space-y-3">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="font-semibold text-slate-200">Phytosanitary & Audit Compliance</div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Certified Smallholders:</span>
                        <span className="font-mono text-emerald-400 font-bold">{selectedDistrictData?.quality_certification_pct}%</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Traceability Compliance:</span>
                        <span className="font-bold text-cyan-300">GPS Polygon Ready</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeDossierTab === 'assessment' && (
                  <div className="space-y-3">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="font-semibold text-slate-200">Strategic Export Assessment Focus</div>
                      <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs">
                        Expand certified cold-chain collection hubs and smallholder GlobalGAP certification to accelerate air-freight horticulture exports.
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-blue-950/40 border border-blue-800/40 text-[10px] text-blue-300 leading-relaxed">
                      <strong>Institutional Safeguard:</strong> District export figures reflect traceable sourcing origins. A producing district is not assumed to clear all customs locally without verifiable exit records.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: EXPORT COMMODITY CATALOGUE & QUALITY SPECIFICATIONS */}
        <section id="catalogue" className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Package className="w-5 h-5 text-amber-400" />
                <span>2. Export Commodity Catalogue & Quality Requirements</span>
              </h2>
              <p className="text-xs text-slate-400">
                Each commodity profile links product form, quality grades, moisture limits, certifications, phytosanitary rules, and market readiness.
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Catalogue: <strong className="text-amber-400">{commoditiesCatalogue.length} Export Commodities</strong>
            </div>
          </div>

          {/* Commodity Selection Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {commoditiesCatalogue.map((c) => {
              const isSelected = c.product_name.toLowerCase() === inspectedCommodityName.toLowerCase();
              return (
                <button
                  key={c.product_name}
                  onClick={() => setInspectedCommodityName(c.product_name)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500/80 shadow-md ring-1 ring-amber-500'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs truncate">{c.product_name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">{c.income_share_pct}%</span>
                  </div>
                  <div className="mt-2 text-sm font-bold font-mono text-emerald-400">
                    ${(c.export_value_usd / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {c.export_quantity_mt.toLocaleString()} MT (${c.unit_value_usd_per_mt}/MT)
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Inspected Commodity Profile Card */}
          {inspectedCommodity && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-white">{inspectedCommodity.product_name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-cyan-300 border border-slate-700">
                      HS Code: {inspectedCommodity.hs_code}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                      {inspectedCommodity.product_category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Product Form: <strong className="text-slate-200">{inspectedCommodity.quality_standards.exportProductForm}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">Unit Export Valuation:</span>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    ${inspectedCommodity.unit_value_usd_per_mt.toLocaleString()}{' '}
                    <span className="text-xs font-sans text-slate-400">/ MT</span>
                  </div>
                </div>
              </div>

              {/* 4 Technical Quality Specification Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* 1. Quality Grade & Defect Limits */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-1.5">
                  <span className="font-semibold text-amber-400 uppercase text-[11px] tracking-wider">Required Quality Grade</span>
                  <div className="font-bold text-white text-xs">{inspectedCommodity.quality_standards.qualityGrade}</div>
                  <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                    Moisture Specification: <strong className="text-slate-200">{inspectedCommodity.quality_standards.moistureLimit}</strong>
                  </div>
                </div>

                {/* 2. Packaging & Packaging Liners */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-1.5">
                  <span className="font-semibold text-cyan-400 uppercase text-[11px] tracking-wider">Export Packaging Standards</span>
                  <p className="text-slate-300 text-xs">{inspectedCommodity.quality_standards.packaging}</p>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">Preserves cargo integrity in transit</div>
                </div>

                {/* 3. Mandatory Certifications */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-1.5">
                  <span className="font-semibold text-emerald-400 uppercase text-[11px] tracking-wider">Required Certifications</span>
                  <div className="flex flex-wrap gap-1">
                    {inspectedCommodity.quality_standards.certifications.map((cert: string, i: number) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-semibold text-[10px] border border-emerald-800/40">
                        {cert}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">Required by international buyers</div>
                </div>

                {/* 4. Phytosanitary Protocols */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-1.5">
                  <span className="font-semibold text-purple-400 uppercase text-[11px] tracking-wider">Phytosanitary & Plant Health</span>
                  <p className="text-slate-300 text-xs">{inspectedCommodity.quality_standards.phytosanitary}</p>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">Issued by RAB & RICA inspectors</div>
                </div>
              </div>

              {/* Market Access Barriers & Readiness Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 space-y-1 text-xs">
                  <div className="font-bold text-rose-300 flex items-center">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-400" />
                    Documented Barriers to Market Access:
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {inspectedCommodity.quality_standards.marketBarriers}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-slate-200">Export Readiness 5-Pillar Scorecard:</span>
                  <div className="grid grid-cols-5 gap-1.5 text-center font-mono">
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                      <div className="text-[9px] text-slate-400 uppercase">Supply</div>
                      <div className="font-bold text-emerald-400">{inspectedCommodity.quality_standards.readinessPillars.supply}</div>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                      <div className="text-[9px] text-slate-400 uppercase">Quality</div>
                      <div className="font-bold text-emerald-400">{inspectedCommodity.quality_standards.readinessPillars.quality}</div>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                      <div className="text-[9px] text-slate-400 uppercase">Process</div>
                      <div className="font-bold text-cyan-400">{inspectedCommodity.quality_standards.readinessPillars.processing}</div>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                      <div className="text-[9px] text-slate-400 uppercase">Logistics</div>
                      <div className="font-bold text-amber-400">{inspectedCommodity.quality_standards.readinessPillars.logistics}</div>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                      <div className="text-[9px] text-slate-400 uppercase">Market</div>
                      <div className="font-bold text-purple-400">{inspectedCommodity.quality_standards.readinessPillars.market}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 3: INTERNATIONAL EXPORT MARKETS */}
        <section id="markets" className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Globe className="w-5 h-5 text-purple-400" />
                <span>3. International Export Markets & Destination Concentration</span>
              </h2>
              <p className="text-xs text-slate-400">
                Where are Rwanda's agricultural products going, which commodities are sold there, and how is performance changing?
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Top 3 Concentration: <strong className="text-purple-400">{marketConcentration?.top3SharePct || 0}% of earnings</strong>
            </div>
          </div>

          {/* Market Concentration Alert Banner */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-slate-300">
                <strong className="text-white">Market Resiliency Signal:</strong> {marketConcentration?.diversificationRecommendation}
              </span>
            </div>
          </div>

          {/* Destination Market Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {internationalMarkets.slice(0, 9).map((m, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2 hover:border-slate-700 transition">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{m.country_name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-purple-300 border border-slate-800">
                    {m.region}
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    ${(m.total_export_value_usd / 1000000).toFixed(1)}M
                  </span>
                  <span className="text-xs font-mono text-slate-400">{m.market_share_pct}% of total</span>
                </div>

                <div className="text-xs text-slate-400 flex justify-between">
                  <span>Exported Volume:</span>
                  <span className="font-mono text-slate-200">{m.total_export_quantity_mt.toLocaleString()} MT</span>
                </div>

                <div className="text-xs text-slate-400 flex justify-between">
                  <span>Avg Unit Value:</span>
                  <span className="font-mono text-amber-300 font-bold">${m.unit_value_usd_per_mt}/MT</span>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div>Commodities: <span className="text-slate-200 font-medium">{m.commodities.slice(0, 3).join(', ')}</span></div>
                  <div className="text-[10px] text-slate-500 truncate" title={m.tariff_protocol}>{m.tariff_protocol}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: SEASONAL EXPORT TRENDS */}
        <section id="trends" className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>4. Post-Harvest & Export Trends Across Seasons (2014A – 2026C)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Track historical export earnings (USD), exported quantities (MT), and traditional vs. horticulture diversification over 38 recorded seasons.
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Records: <strong className="text-emerald-400">{seasonalComparison.length} Historical Seasons</strong>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold uppercase tracking-wider">Export Value Composition: Traditional vs. Non-Traditional (USD)</span>
              <div className="flex items-center space-x-4">
                <span className="flex items-center"><span className="w-3 h-3 bg-emerald-500 rounded-sm mr-1.5"></span>Total Export Value</span>
                <span className="flex items-center"><span className="w-3 h-3 bg-amber-500 rounded-sm mr-1.5"></span>Traditional (Tea/Coffee)</span>
                <span className="flex items-center"><span className="w-3 h-3 bg-cyan-500 rounded-sm mr-1.5"></span>Horticulture & Specialty</span>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={seasonalComparison} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="season_code" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Area type="monotone" dataKey="total_export_value_usd" name="Total Export USD" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="traditional_export_value_usd" name="Traditional (Tea/Coffee) USD" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} />
                  <Area type="monotone" dataKey="horticulture_export_value_usd" name="Horticulture USD" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Data Source: NAEB Export Registries & MINICOM Trade Directorate.</span>
              <span className="text-amber-400 font-medium">Historical trends use dated shipment records. Trade periods are matched to official customs reporting dates.</span>
            </div>
          </div>
        </section>

        {/* SECTION 5: EXPORT EXIT HUBS & INFRASTRUCTURE */}
        <section id="hubs" className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Plane className="w-5 h-5 text-amber-400" />
                <span>5. Documented National Export Exit Hubs</span>
              </h2>
              <p className="text-xs text-slate-400">
                Verified border posts, air cargo terminals, and lake ports with documented customs, quarantine, and consolidation facilities.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exportHubs.map((hub, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2 hover:border-slate-700 transition">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{hub.hub_name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-amber-400 border border-slate-800">
                    {hub.hub_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">{hub.location_desc}</div>
                <div className="text-[11px] text-emerald-400 font-medium">
                  Primary Cargo: {hub.primary_commodities.join(', ')}
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">{hub.infrastructure}</p>
                <div className="pt-2 border-t border-slate-800 text-[10px] flex justify-between items-center text-slate-500">
                  <span>Serving {hub.serviced_districts_count} districts</span>
                  <button
                    onClick={() => {
                      setActiveSection('overview');
                      const el = document.getElementById('overview');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                      focusOnCoordinates(hub.coordinates[0], hub.coordinates[1], 12);
                    }}
                    className="text-cyan-400 hover:underline flex items-center"
                  >
                    <MapPin className="w-3 h-3 mr-0.5" /> View on Map
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 6: DISTRICT EXPORT CONTRIBUTIONS LEAGUE TABLE */}
        <section id="districts" className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <span>6. District Export Contributions & Readiness League Table</span>
              </h2>
              <p className="text-xs text-slate-400">
                All 30 districts ranked by estimated exportable volume, readiness index, and quality certification for Season {selectedSeason}.
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search district..."
                  value={searchDistrict}
                  onChange={(e) => setSearchDistrict(e.target.value)}
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
                  <th className="py-3 px-3 text-right">Exportable Volume (MT)</th>
                  <th className="py-3 px-3 text-right">Market Surplus (MT)</th>
                  <th className="py-3 px-3 text-center">Readiness Index</th>
                  <th className="py-3 px-3 text-center">Export Tier</th>
                  <th className="py-3 px-3">Nearest Exit Hub</th>
                  <th className="py-3 px-3 text-right">Distance (km)</th>
                  <th className="py-3 px-3 text-center">Export Coops</th>
                  <th className="py-3 px-3 text-center">Cert. %</th>
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
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        {d.estimated_exportable_volume_mt.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                        {d.market_surplus_volume_mt.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-cyan-400">
                        {d.export_readiness_score}/100
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          d.export_tier === 'TIER_1_GLOBAL_EXPORT_HUB'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {d.export_tier?.replace(/_/g, ' ') || 'PRODUCER'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 truncate max-w-[140px]">{d.nearest_exit_hub}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">{d.distance_to_exit_km} km</td>
                      <td className="py-2.5 px-3 text-center font-mono text-purple-400 font-semibold">{d.cooperatives_export_ready_count}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-300 font-semibold">{d.quality_certification_pct}%</td>
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

        {/* SECTION 7: COMMODITY EARNINGS RANKINGS */}
        <section id="rankings" className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <span>7. Crop Rankings Based on Export Income</span>
              </h2>
              <p className="text-xs text-slate-400">
                Ranked contribution of agricultural commodities to Rwanda's national export earnings in Season {selectedSeason}.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">Rank</th>
                  <th className="py-3 px-3">Commodity</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Export Value (USD)</th>
                  <th className="py-3 px-3 text-right">Income Share (%)</th>
                  <th className="py-3 px-3 text-right">Export Volume (MT)</th>
                  <th className="py-3 px-3 text-right">Unit Value ($/MT)</th>
                  <th className="py-3 px-3 text-center">Net Trade Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {commoditiesCatalogue.map((c, idx) => (
                  <tr key={c.product_name} className="hover:bg-slate-800/50 transition">
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{c.product_name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{c.product_category.replace(/_/g, ' ')}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      ${c.export_value_usd.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                      {c.income_share_pct}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                      {c.export_quantity_mt.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-cyan-300 font-semibold">
                      ${c.unit_value_usd_per_mt.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.net_trade_status === 'NET_EXPORTER'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                          : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                      }`}>
                        {c.net_trade_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setInspectedCommodityName(c.product_name);
                          setActiveSection('catalogue');
                          const el = document.getElementById('catalogue');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white text-[10px] font-medium transition"
                      >
                        Catalogue →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 8: EXPORT SUPPORTING FACILITIES REGISTER */}
        <section id="facilities" className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <span>8. Facilities That Support Agricultural Exports</span>
              </h2>
              <p className="text-xs text-slate-400">
                Searchable register of verified tea processing factories, coffee washing stations, cold stores, and export packhouses.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="text"
                placeholder="Search facility, district..."
                value={facilitySearch}
                onChange={(e) => setFacilitySearch(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />

              <select
                value={facilityTypeFilter}
                onChange={(e) => setFacilityTypeFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Facility Types</option>
                <option value="PROCESSING_PLANT">Processing Plants (Tea/Mills)</option>
                <option value="COLD_STORAGE">Cold-Chain Facilities</option>
                <option value="WAREHOUSE">Warehouses & Consolidation</option>
                <option value="SILO">Strategic Silos</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Facility Name</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Location (District)</th>
                  <th className="py-3 px-3 text-right">Throughput / Capacity</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Operator</th>
                  <th className="py-3 px-3 text-center">Map Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredFacilities.slice(0, 30).map((f) => (
                  <tr key={f.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-2.5 px-3 font-bold text-white">{f.facility_name}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-cyan-300 border border-slate-700">
                        {f.facility_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{f.district_name}</td>
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
        </section>

        {/* SECTION 9: STRATEGIC OPPORTUNITIES & PRE-FEASIBILITY SCREENING */}
        <section id="opportunities" className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40 mb-1">
                Strategic Trade Planning Framework
              </div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <span>9. Strategic Planning & Export Investment Opportunities</span>
              </h2>
              <p className="text-xs text-slate-400">
                Evidence-based screening signals identifying high-potential product-market pairings requiring feasibility audits.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategicOpportunities.map((opp, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-base font-bold text-white">{opp.product_name}</span>
                    <span className="ml-2 text-xs text-cyan-400 font-semibold">→ {opp.destination_country} ({opp.destination_region})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800/40">
                    MCDA Score: {opp.opportunity_score}/100
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                    {opp.classification.replace(/_/g, ' ')}
                  </span>
                  <span className="text-slate-400">Level: <strong className="text-slate-200">{opp.opportunity_level}</strong></span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-2.5 rounded border border-slate-800/80">
                  {opp.evidence_summary}
                </p>

                {/* Pre-feasibility Checklist */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="font-semibold text-slate-300">Mandatory Pre-Investment Verifications:</div>
                  <div className="space-y-1">
                    {opp.pre_feasibility_checklist.map((step, sIdx) => (
                      <div key={sIdx} className="flex items-start space-x-2 text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong className="text-slate-300">{step.step}:</strong> {step.note}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Safeguard Disclaimer */}
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 space-y-0.5">
                  <div className="text-amber-400 font-semibold flex items-center">
                    <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                    {opp.institutional_safeguard}
                  </div>
                  <p className="text-slate-500 italic">Constraints: {opp.constraints_and_limitations}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-900/60 px-6 py-4 mt-auto text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-3">
        <div>
          AgriLens Rwanda · National Agricultural Export Planning & Intelligence Centre · NAEB & MINICOM Compliant
        </div>
        <div className="flex items-center space-x-4">
          <span>Reporting Seasons: 38 Recorded</span>
          <span>Verified Exit Hubs: 10</span>
          <span>Destination Markets: 17</span>
        </div>
      </footer>
    </div>
  );
}
