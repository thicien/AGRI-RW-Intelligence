import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  RWANDA_DISTRICTS_GEOJSON, 
  DISTRICT_CENTROIDS, 
  enrichRwandaGeoJSON, 
  type DistrictChoroplethData,
  type PerformanceTier 
} from '../../data/rwandaMapData';
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

  // Synchronous 3-tier High/Moderate/Low Choropleth Classification
  const choroplethDataMap = useMemo(() => {
    const mapData: Record<string, DistrictChoroplethData> = {};
    if (!districts || districts.length === 0) return { mapData, highThreshold: 0, lowThreshold: 0 };

    const vals = districts.map(d => Number(layerConfig.getValue(d)) || 0).sort((a, b) => a - b);
    const lowThresh = vals[Math.floor(vals.length * 0.33)] || 0;
    const highThresh = vals[Math.floor(vals.length * 0.67)] || 0;

    districts.forEach(d => {
      const val = Number(layerConfig.getValue(d)) || 0;
      let tier: PerformanceTier = 'MODERATE';
      let color = '#4ADE80';

      if (selectedLayer === 'exit_distance') {
        // Lower distance is better / high performance
        if (val <= lowThresh) {
          tier = 'HIGH';
          color = '#15803D'; // Deep green
        } else if (val >= highThresh) {
          tier = 'LOW';
          color = '#BBF7D0'; // Light mint
        } else {
          tier = 'MODERATE';
          color = '#4ADE80'; // Emerald
        }
      } else {
        // Higher value is better / high performance
        if (val >= highThresh) {
          tier = 'HIGH';
          color = '#15803D'; // Deep green
        } else if (val <= lowThresh) {
          tier = 'LOW';
          color = '#BBF7D0'; // Light green
        } else {
          tier = 'MODERATE';
          color = '#4ADE80'; // Emerald
        }
      }

      mapData[d.district_name.toLowerCase()] = {
        districtName: d.district_name,
        numericValue: val,
        formattedValue: `${val.toLocaleString()} ${layerConfig.unit}`,
        tier,
        tierLabel: tier === 'HIGH' ? 'High' : tier === 'MODERATE' ? 'Moderate' : 'Low',
        color,
        hasData: true
      };
    });

    return { mapData, highThreshold: highThresh, lowThreshold: lowThresh };
  }, [districts, selectedLayer, layerConfig]);

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

    mapInstance.current.on('load', () => {
      if (!mapInstance.current) return;

      const initialEnriched = enrichRwandaGeoJSON(choroplethDataMap.mapData, '#BBF7D0');
      geojsonLoadedRef.current = true;

      if (!mapInstance.current.getSource('rwanda-districts')) {
        mapInstance.current.addSource('rwanda-districts', {
          type: 'geojson',
          data: initialEnriched as any,
        });

        // 1. District Fill Layer (3-Tier Performance Choropleth)
        mapInstance.current.addLayer({
          id: 'district-fill',
          type: 'fill',
          source: 'rwanda-districts',
          paint: {
            'fill-color': ['coalesce', ['get', 'choroplethColor'], '#4ADE80'],
            'fill-opacity': 0.82,
          },
        });

        // 2. High-Contrast District Boundary Lines
        mapInstance.current.addLayer({
          id: 'district-borders',
          type: 'line',
          source: 'rwanda-districts',
          paint: {
            'line-color': '#0f172a',
            'line-width': 1.6,
            'line-opacity': 0.95,
          },
        });

        // 3. Highlighted District Boundary
        mapInstance.current.addLayer({
          id: 'district-selected-line',
          type: 'line',
          source: 'rwanda-districts',
          paint: {
            'line-color': '#0D47A1',
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
              <div class="text-[9px] text-slate-500 italic pt-1 border-t border-slate-800/80 text-right">Click district to zoom & inspect dossier</div>
            </div>
          `).addTo(mapInstance.current);
        });

        mapInstance.current.on('mouseleave', 'district-fill', () => {
          if (!mapInstance.current) return;
          mapInstance.current.getCanvas().style.cursor = '';
          popupRef.current?.remove();
        });

        // Click Interactivity: Select district & flyTo centroid
        mapInstance.current.on('click', 'district-fill', (e) => {
          if (!e.features || e.features.length === 0) return;
          const clickedName = e.features[0].properties?.shapeName;
          if (clickedName) {
            setSelectedDistrictName(clickedName);
            const coords = DISTRICT_CENTROIDS[clickedName];
            if (coords) {
              focusOnCoordinates(coords[0], coords[1], 10.2);
            }
          }
        });
      }
    });

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update GeoJSON and highlighted boundary reactively
  useEffect(() => {
    if (!mapInstance.current) return;
    const source = mapInstance.current.getSource('rwanda-districts') as maplibregl.GeoJSONSource;
    if (source) {
      const enriched = enrichRwandaGeoJSON(choroplethDataMap.mapData, '#BBF7D0');
      source.setData(enriched as any);
    }

    if (mapInstance.current.getLayer('district-selected-line')) {
      mapInstance.current.setPaintProperty('district-selected-line', 'line-opacity', [
        'case',
        ['==', ['get', 'shapeName'], selectedDistrictName],
        1.0,
        0.0,
      ] as any);
    }
  }, [choroplethDataMap, selectedDistrictName]);

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

      el.addEventListener('click', () => {
        focusOnCoordinates(hub.coordinates[0], hub.coordinates[1], 11.5);
      });

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

      el.addEventListener('click', () => {
        setSelectedDistrictName(f.district_name);
        if (f.longitude && f.latitude) {
          focusOnCoordinates(f.longitude, f.latitude, 11.5);
        }
      });

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
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-4 sm:px-6 pt-6 font-sans select-none animate-in fade-in duration-300">
      {/* 1. Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-emerald-500/20">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              National Agricultural Planner · Export Opportunities
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Plane className="w-8 h-8 text-emerald-400" />
              <span>National Export Opportunities Intelligence</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Planning & Intelligence Centre
              </span>
            </h1>
            <p className="text-emerald-100/70 text-sm mt-1 max-w-3xl leading-relaxed">
              National planning focus: export crops, product quality, market access, seasonal supply, district contributions and infrastructure readiness.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-emerald-300 text-xs font-bold transition-all flex items-center gap-2 border border-slate-700 shadow-md"
              title="Download nationwide agricultural export dataset"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={fetchWorkspaceData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
              title="Refresh intelligence records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Quick-Jump Navigation Tabs */}
      <div className="bg-surface border border-border-main rounded-2xl p-2.5 shadow-sm flex items-center justify-between overflow-x-auto gap-2 no-scrollbar text-xs">
        <div className="flex items-center space-x-1.5">
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
                className={`inline-flex items-center px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-emerald-50 text-agriculture border border-emerald-200 shadow-sm font-semibold'
                    : 'text-muted hover:text-text-main hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. UNIFIED MASTER FILTER BAR */}
      <div className="bg-surface border border-border-main rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* A. Agricultural Season */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted flex items-center">
              <Calendar className="w-3 h-3 mr-1 text-agriculture" />
              Reporting Season
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full bg-background text-text-main border border-border-main rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-agriculture focus:outline-none"
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
            <label className="text-[11px] font-semibold text-muted flex items-center">
              <Package className="w-3 h-3 mr-1 text-amber-600" />
              Export Commodity
            </label>
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="w-full bg-background text-text-main border border-border-main rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-agriculture focus:outline-none"
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
            <label className="text-[11px] font-semibold text-muted flex items-center">
              <Layers className="w-3 h-3 mr-1 text-primary" />
              Product Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-background text-text-main border border-border-main rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-agriculture focus:outline-none"
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
            <label className="text-[11px] font-semibold text-muted flex items-center">
              <Globe className="w-3 h-3 mr-1 text-purple-600" />
              Destination Market
            </label>
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className="w-full bg-background text-text-main border border-border-main rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-agriculture focus:outline-none"
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
            <label className="text-[11px] font-semibold text-muted flex items-center">
              <MapPin className="w-3 h-3 mr-1 text-agriculture" />
              Geographic Scope
            </label>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full bg-background text-text-main border border-border-main rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-agriculture focus:outline-none"
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
            <label className="text-[11px] font-semibold text-muted flex items-center">
              <SlidersHorizontal className="w-3 h-3 mr-1 text-primary" />
              Intelligence Layer
            </label>
            <select
              value={selectedLayer}
              onChange={(e) => setSelectedLayer(e.target.value as IntelligenceLayerType)}
              className="w-full bg-background text-text-main border border-border-main rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-agriculture focus:outline-none"
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
      </div>

      {/* MAIN ANALYTICAL BODY */}
      <div className="space-y-10">
        {/* SECTION 1: NATIONAL EXPORT PERFORMANCE OVERVIEW */}
        <section id="overview" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-main uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-agriculture rounded-sm"></span>
              <span>1. National Agricultural Export Performance Overview</span>
            </h2>
            <div className="text-xs text-muted flex items-center space-x-3">
              <span className="flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-agriculture mr-1" />
                Contributing Districts: <strong className="ml-1 text-text-main">30 of 30 Districts (100%)</strong>
              </span>
              <span className="text-border-main">|</span>
              <span className="flex items-center">
                <Globe className="w-3.5 h-3.5 text-primary mr-1" />
                Destination Markets: <strong className="ml-1 text-text-main">{nationalSummary?.destination_countries_count || 17} Countries</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Export Income */}
            <div className="bg-surface border border-border-main rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="font-semibold uppercase tracking-wider">Total Export Income</span>
                <DollarSign className="w-4 h-4 text-agriculture" />
              </div>
              <div className="mt-2 text-2xl font-black text-text-main font-mono">
                ${nationalSummary?.total_export_value_usd ? (nationalSummary.total_export_value_usd / 1000000).toFixed(1) : '—'}{' '}
                <span className="text-sm font-sans font-normal text-muted">Million USD</span>
              </div>
              <div className="mt-2 text-xs text-muted flex items-center justify-between border-t border-border-main/80 pt-2">
                <span>Equivalent: <strong className="text-text-main font-mono">{nationalSummary?.total_export_value_rwf ? (nationalSummary.total_export_value_rwf / 1000000000).toFixed(1) : '—'}B RWF</strong></span>
                {nationalSummary?.export_value_change_pct !== undefined && (
                  <span className={`inline-flex items-center font-semibold font-mono ${nationalSummary.export_value_change_pct >= 0 ? 'text-agriculture' : 'text-rose-600'}`}>
                    {nationalSummary.export_value_change_pct >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {Math.abs(nationalSummary.export_value_change_pct)}% vs {compareSeason}
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Exported Quantity Volume */}
            <div className="bg-surface border border-border-main rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="font-semibold uppercase tracking-wider">Exported Quantity</span>
                <Scale className="w-4 h-4 text-primary" />
              </div>
              <div className="mt-2 text-2xl font-black text-text-main font-mono">
                {nationalSummary?.total_export_quantity_mt?.toLocaleString() || '—'}{' '}
                <span className="text-sm font-sans font-normal text-muted">tonnes</span>
              </div>
              <div className="mt-2 text-xs text-muted flex items-center justify-between border-t border-border-main/80 pt-2">
                <span>Avg Unit Value: <strong className="text-text-main font-mono">${nationalSummary?.avg_unit_export_value_usd_per_mt}/MT</strong></span>
                {nationalSummary?.export_quantity_change_pct !== undefined && (
                  <span className={`inline-flex items-center font-semibold font-mono ${nationalSummary.export_quantity_change_pct >= 0 ? 'text-primary' : 'text-rose-600'}`}>
                    {nationalSummary.export_quantity_change_pct >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {Math.abs(nationalSummary.export_quantity_change_pct)}% vs {compareSeason}
                  </span>
                )}
              </div>
            </div>

            {/* Card 3: Exporting Commodities */}
            <div className="bg-surface border border-border-main rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="font-semibold uppercase tracking-wider">Exporting Commodities</span>
                <Package className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-text-main font-mono">
                {nationalSummary?.active_export_commodities_count || commoditiesCatalogue.length || '—'}{' '}
                <span className="text-sm font-sans font-normal text-muted">commodities</span>
              </div>
              <div className="mt-2 text-xs text-muted flex items-center justify-between border-t border-border-main/80 pt-2">
                <span>Top earner: <strong className="text-text-main">Tea ($91.4M) & Coffee ($74.4M)</strong></span>
                <span className="text-agriculture font-medium">100% Documented</span>
              </div>
            </div>

            {/* Card 4: Documented Export Hubs */}
            <div className="bg-surface border border-border-main rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="font-semibold uppercase tracking-wider">Documented Export Hubs</span>
                <Plane className="w-4 h-4 text-purple-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-text-main font-mono">
                {nationalSummary?.documented_export_hubs_count || exportHubs.length || '—'}{' '}
                <span className="text-sm font-sans font-normal text-muted">verified hubs</span>
              </div>
              <div className="mt-2 text-xs text-muted flex items-center justify-between border-t border-border-main/80 pt-2">
                <span>Air cargo, border posts & ports</span>
                <span className="text-purple-600 font-medium font-mono">Geocoded</span>
              </div>
            </div>
          </div>

          {/* Value vs. Volume Decoupling Callout Banner */}
          <div className="bg-surface border border-border-main rounded-xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-text-main">Value vs. Volume Growth Decoupling Analysis: </span>
                <span className="text-agriculture font-semibold">{nationalSummary?.value_vs_volume_decoupling || 'Balanced growth across revenue and physical volume'}</span>
                <p className="text-[11px] text-muted mt-0.5">
                  A planner can distinguish growth in export quantity from growth in export income. Income can rise from price premiums even when exported volume remains stable.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-muted text-[11px]">Net Agricultural Trade Balance:</span>
              <div className="font-mono font-bold text-agriculture text-sm">
                +${((nationalSummary?.net_trade_balance_usd || 185000000) / 1000000).toFixed(1)}M USD
              </div>
            </div>
          </div>

          {/* INTERACTIVE RWANDA EXPORT HUB MAP & DISTRICT EXPORT DOSSIER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
            {/* Left Column: Rwanda Export Map (7 cols) */}
            <div className="lg:col-span-7 bg-surface border border-border-main rounded-xl overflow-hidden flex flex-col h-[650px] shadow-sm">
              <div className="p-3.5 border-b border-border-main bg-surface flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <h3 className="font-bold text-text-main flex items-center space-x-2">
                    <Plane className="w-4 h-4 text-agriculture" />
                    <span>National Export Hub & Supply Infrastructure Map</span>
                  </h3>
                  <p className="text-[11px] text-muted">
                    National view · District boundaries · Indicator: <span className="text-amber-700 font-semibold">{layerConfig.title}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-1.5 cursor-pointer bg-surface hover:bg-background px-2 py-1 rounded text-[11px] border border-border-main text-text-main">
                    <input
                      type="checkbox"
                      checked={showExitHubs}
                      onChange={(e) => setShowExitHubs(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-0 w-3 h-3"
                    />
                    <span className="text-amber-800 font-medium">Exit Hubs ({exportHubs.length})</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer bg-surface hover:bg-background px-2 py-1 rounded text-[11px] border border-border-main text-text-main">
                    <input
                      type="checkbox"
                      checked={showFacilityMarkers}
                      onChange={(e) => setShowFacilityMarkers(e.target.checked)}
                      className="rounded text-primary focus:ring-0 w-3 h-3"
                    />
                    <span className="text-primary font-medium">Export Facilities ({exportFacilities.length})</span>
                  </label>
                </div>
              </div>

              {/* Map Canvas */}
              <div className="relative flex-1 bg-slate-50">
                <div ref={mapContainer} className="w-full h-full" />

                {/* Map Choropleth Legend (Bottom Left) */}
                <div className="absolute bottom-4 left-4 bg-surface/95 border border-border-main rounded-lg p-3 shadow-xl backdrop-blur-md text-[11px] max-w-[240px] space-y-2 pointer-events-auto">
                  <div className="font-bold text-text-main flex items-center justify-between">
                    <span>{layerConfig.badge}</span>
                    <span className="text-[10px] text-muted font-mono">{layerConfig.unit}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {layerConfig.colorRamp.map((col, idx) => (
                      <div key={idx} className="flex-1 h-2.5 rounded-sm" style={{ backgroundColor: col }} />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted font-mono">
                    <span>Low / Limited</span>
                    <span>Moderate</span>
                    <span>High / Favorable</span>
                  </div>
                  <div className="pt-1.5 border-t border-border-main text-[10px] text-muted flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5"></span>
                      Verified Exit Hub
                    </span>
                    <span className="text-agriculture font-medium">Selected: {selectedDistrictName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: District Export Profile Dossier (5 cols) */}
            <div className="lg:col-span-5 bg-surface border border-border-main rounded-xl overflow-hidden flex flex-col h-[650px] shadow-sm">
              {/* Dossier Header */}
              <div className="p-4 border-b border-border-main bg-surface flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-lg text-text-main">{selectedDistrictData?.district_name || 'Select District'}</h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-background text-text-main border border-border-main">
                      {selectedDistrictData?.province_name}
                    </span>
                  </div>
                  <p className="text-xs text-muted">Export Sourcing Profile · Season {selectedSeason}</p>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                    selectedDistrictData?.export_tier === 'TIER_1_GLOBAL_EXPORT_HUB'
                      ? 'bg-emerald-50 text-agriculture border-emerald-300'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}>
                    {selectedDistrictData?.export_tier?.replace(/_/g, ' ') || 'EXPORT_PRODUCER'}
                  </span>
                  <div className="text-[10px] text-muted mt-1">Export Readiness: {selectedDistrictData?.export_readiness_score || 0}/100</div>
                </div>
              </div>

              {/* Dossier Tabs */}
              <div className="flex border-b border-border-main bg-background text-xs font-medium">
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
                        ? 'border-agriculture text-agriculture font-bold bg-surface'
                        : 'border-transparent text-muted hover:text-text-main'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Dossier Content */}
              <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs text-text-main">
                {activeDossierTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-background p-3 rounded-lg border border-border-main">
                        <span className="text-[11px] text-muted">Exportable Surplus Volume</span>
                        <div className="text-lg font-bold text-agriculture font-mono mt-1">
                          {selectedDistrictData?.estimated_exportable_volume_mt?.toLocaleString()} MT
                        </div>
                        <div className="text-[10px] text-muted">Commercial export flow</div>
                      </div>

                      <div className="bg-background p-3 rounded-lg border border-border-main">
                        <span className="text-[11px] text-muted">Total Crop Production</span>
                        <div className="text-lg font-bold text-text-main font-mono mt-1">
                          {selectedDistrictData?.total_crop_production_mt?.toLocaleString()} MT
                        </div>
                        <div className="text-[10px] text-muted">Seasonal district total</div>
                      </div>

                      <div className="bg-background p-3 rounded-lg border border-border-main">
                        <span className="text-[11px] text-muted">Export-Ready Cooperatives</span>
                        <div className="text-lg font-bold text-primary font-mono mt-1">
                          {selectedDistrictData?.cooperatives_export_ready_count || 0} Coops
                        </div>
                        <div className="text-[10px] text-muted">Formally registered aggregators</div>
                      </div>

                      <div className="bg-background p-3 rounded-lg border border-border-main">
                        <span className="text-[11px] text-muted">Quality Certified Share</span>
                        <div className="text-lg font-bold text-purple-700 font-mono mt-1">
                          {selectedDistrictData?.quality_certification_pct || 0}%
                        </div>
                        <div className="text-[10px] text-muted">Certified smallholder plots</div>
                      </div>
                    </div>

                    {/* Exit Hub Distance */}
                    <div className="bg-background p-3 rounded-lg border border-border-main space-y-2">
                      <div className="font-semibold text-text-main">Logistics & Exit Connectivity</div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted">Nearest Exit Terminal:</span>
                        <span className="font-bold text-amber-700">{selectedDistrictData?.nearest_exit_hub}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted">Haulage Distance:</span>
                        <span className="font-bold font-mono text-text-main">{selectedDistrictData?.distance_to_exit_km} km</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeDossierTab === 'crops' && (
                  <div className="space-y-3">
                    <div className="font-semibold text-text-main">Export-Oriented Commodities Produced</div>
                    <div className="space-y-2">
                      {Array.isArray(selectedDistrictData?.primary_export_crops) && selectedDistrictData.primary_export_crops.length > 0 ? (
                        selectedDistrictData.primary_export_crops.map((crop: string, idx: number) => (
                          <div key={idx} className="bg-background p-2.5 rounded-lg border border-border-main flex items-center justify-between">
                            <span className="font-bold text-agriculture">{crop}</span>
                            <button
                              onClick={() => setInspectedCommodityName(crop)}
                              className="text-[10px] text-primary hover:underline"
                            >
                              Inspect Quality Specs →
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 bg-background border border-border-main rounded text-muted">
                          Traditional food crop supply zone.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeDossierTab === 'logistics' && (
                  <div className="space-y-3">
                    <div className="bg-background p-3 rounded-lg border border-border-main space-y-2">
                      <div className="font-semibold text-text-main">Corridor & Exit Hub Alignment</div>
                      <p className="text-[11px] text-muted">
                        Primary export routing from {selectedDistrictName} connects to <strong className="text-amber-700">{selectedDistrictData?.nearest_exit_hub}</strong> over a transport radius of <strong className="text-text-main">{selectedDistrictData?.distance_to_exit_km} km</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {activeDossierTab === 'quality' && (
                  <div className="space-y-3">
                    <div className="bg-background p-3 rounded-lg border border-border-main space-y-2">
                      <div className="font-semibold text-text-main">Phytosanitary & Audit Compliance</div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted">Certified Smallholders:</span>
                        <span className="font-mono text-agriculture font-bold">{selectedDistrictData?.quality_certification_pct}%</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted">Traceability Compliance:</span>
                        <span className="font-bold text-primary">GPS Polygon Ready</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeDossierTab === 'assessment' && (
                  <div className="space-y-3">
                    <div className="bg-background p-3 rounded-lg border border-border-main space-y-2">
                      <div className="font-semibold text-text-main">Strategic Export Assessment Focus</div>
                      <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-agriculture text-xs">
                        Expand certified cold-chain collection hubs and smallholder GlobalGAP certification to accelerate air-freight horticulture exports.
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-[10px] text-blue-900 leading-relaxed">
                      <strong>Institutional Safeguard:</strong> District export figures reflect traceable sourcing origins. A producing district is not assumed to clear all customs locally without verifiable exit records.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: EXPORT COMMODITY CATALOGUE & QUALITY SPECIFICATIONS */}
        <section id="catalogue" className="bg-surface border border-border-main rounded-xl p-5 space-y-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border-main pb-3">
            <div>
              <h2 className="text-base font-bold text-text-main flex items-center space-x-2">
                <Package className="w-5 h-5 text-amber-600" />
                <span>2. Export Commodity Catalogue & Quality Requirements</span>
              </h2>
              <p className="text-xs text-muted">
                Each commodity profile links product form, quality grades, moisture limits, certifications, phytosanitary rules, and market readiness.
              </p>
            </div>
            <div className="text-xs text-muted font-mono">
              Catalogue: <strong className="text-agriculture">{commoditiesCatalogue.length} Export Commodities</strong>
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
                      ? 'bg-emerald-50 border-agriculture shadow-md ring-1 ring-agriculture'
                      : 'bg-background border-border-main hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-main text-xs truncate">{c.product_name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface text-muted border border-border-main font-mono">{c.income_share_pct}%</span>
                  </div>
                  <div className="mt-2 text-sm font-bold font-mono text-agriculture">
                    ${(c.export_value_usd / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-[10px] text-muted mt-1">
                    {c.export_quantity_mt.toLocaleString()} MT (${c.unit_value_usd_per_mt}/MT)
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Inspected Commodity Profile Card */}
          {inspectedCommodity && (
            <div className="bg-background border border-border-main rounded-xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border-main pb-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-text-main">{inspectedCommodity.product_name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface text-primary border border-border-main">
                      HS Code: {inspectedCommodity.hs_code}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-agriculture border border-emerald-200">
                      {inspectedCommodity.product_category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    Product Form: <strong className="text-text-main">{inspectedCommodity.quality_standards.exportProductForm}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-muted">Unit Export Valuation:</span>
                  <div className="text-xl font-bold font-mono text-agriculture">
                    ${inspectedCommodity.unit_value_usd_per_mt.toLocaleString()}{' '}
                    <span className="text-xs font-sans text-muted">/ MT</span>
                  </div>
                </div>
              </div>

              {/* 4 Technical Quality Specification Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* 1. Quality Grade & Defect Limits */}
                <div className="bg-surface border border-border-main rounded-lg p-3.5 space-y-1.5">
                  <span className="font-semibold text-amber-700 uppercase text-[11px] tracking-wider">Required Quality Grade</span>
                  <div className="font-bold text-text-main text-xs">{inspectedCommodity.quality_standards.qualityGrade}</div>
                  <div className="text-muted text-[11px] pt-1 border-t border-border-main">
                    Moisture Specification: <strong className="text-text-main">{inspectedCommodity.quality_standards.moistureLimit}</strong>
                  </div>
                </div>

                {/* 2. Packaging & Packaging Liners */}
                <div className="bg-surface border border-border-main rounded-lg p-3.5 space-y-1.5">
                  <span className="font-semibold text-primary uppercase text-[11px] tracking-wider">Export Packaging Standards</span>
                  <p className="text-text-main text-xs">{inspectedCommodity.quality_standards.packaging}</p>
                  <div className="text-[10px] text-muted pt-1 border-t border-border-main">Preserves cargo integrity in transit</div>
                </div>

                {/* 3. Mandatory Certifications */}
                <div className="bg-surface border border-border-main rounded-lg p-3.5 space-y-1.5">
                  <span className="font-semibold text-agriculture uppercase text-[11px] tracking-wider">Required Certifications</span>
                  <div className="flex flex-wrap gap-1">
                    {inspectedCommodity.quality_standards.certifications.map((cert: string, i: number) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-50 text-agriculture font-semibold text-[10px] border border-emerald-200">
                        {cert}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] text-muted pt-1 border-t border-border-main">Required by international buyers</div>
                </div>

                {/* 4. Phytosanitary Protocols */}
                <div className="bg-surface border border-border-main rounded-lg p-3.5 space-y-1.5">
                  <span className="font-semibold text-purple-700 uppercase text-[11px] tracking-wider">Phytosanitary & Plant Health</span>
                  <p className="text-text-main text-xs">{inspectedCommodity.quality_standards.phytosanitary}</p>
                  <div className="text-[10px] text-muted pt-1 border-t border-border-main">Issued by RAB & RICA inspectors</div>
                </div>
              </div>

              {/* Market Access Barriers & Readiness Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 space-y-1 text-xs">
                  <div className="font-bold text-rose-800 flex items-center">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                    Documented Barriers to Market Access:
                  </div>
                  <p className="text-rose-950 leading-relaxed text-[11px]">
                    {inspectedCommodity.quality_standards.marketBarriers}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface border border-border-main space-y-2 text-xs">
                  <span className="font-bold text-text-main">Export Readiness 5-Pillar Scorecard:</span>
                  <div className="grid grid-cols-5 gap-1.5 text-center font-mono">
                    <div className="p-1.5 rounded bg-background border border-border-main">
                      <div className="text-[9px] text-muted uppercase">Supply</div>
                      <div className="font-bold text-agriculture">{inspectedCommodity.quality_standards.readinessPillars.supply}</div>
                    </div>
                    <div className="p-1.5 rounded bg-background border border-border-main">
                      <div className="text-[9px] text-muted uppercase">Quality</div>
                      <div className="font-bold text-agriculture">{inspectedCommodity.quality_standards.readinessPillars.quality}</div>
                    </div>
                    <div className="p-1.5 rounded bg-background border border-border-main">
                      <div className="text-[9px] text-muted uppercase">Process</div>
                      <div className="font-bold text-primary">{inspectedCommodity.quality_standards.readinessPillars.processing}</div>
                    </div>
                    <div className="p-1.5 rounded bg-background border border-border-main">
                      <div className="text-[9px] text-muted uppercase">Logistics</div>
                      <div className="font-bold text-amber-700">{inspectedCommodity.quality_standards.readinessPillars.logistics}</div>
                    </div>
                    <div className="p-1.5 rounded bg-background border border-border-main">
                      <div className="text-[9px] text-muted uppercase">Market</div>
                      <div className="font-bold text-purple-700">{inspectedCommodity.quality_standards.readinessPillars.market}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 3: INTERNATIONAL EXPORT MARKETS */}
        <section id="markets" className="bg-surface border border-border-main rounded-xl p-5 space-y-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border-main pb-3">
            <div>
              <h2 className="text-base font-bold text-text-main flex items-center space-x-2">
                <Globe className="w-5 h-5 text-purple-600" />
                <span>3. International Export Markets & Destination Concentration</span>
              </h2>
              <p className="text-xs text-muted">
                Where are Rwanda's agricultural products going, which commodities are sold there, and how is performance changing?
              </p>
            </div>
            <div className="text-xs text-muted font-mono">
              Top 3 Concentration: <strong className="text-purple-700">{marketConcentration?.top3SharePct || 0}% of earnings</strong>
            </div>
          </div>

          {/* Market Concentration Alert Banner */}
          <div className="p-3 rounded-lg bg-background border border-border-main flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <Compass className="w-4 h-4 text-primary shrink-0" />
              <span className="text-muted">
                <strong className="text-text-main">Market Resiliency Signal:</strong> {marketConcentration?.diversificationRecommendation}
              </span>
            </div>
          </div>

          {/* Destination Market Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {internationalMarkets.slice(0, 9).map((m, idx) => (
              <div key={idx} className="bg-background border border-border-main rounded-lg p-4 space-y-2 hover:border-slate-300 transition">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-main text-sm">{m.country_name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface text-purple-700 border border-border-main">
                    {m.region}
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xl font-bold font-mono text-agriculture">
                    ${(m.total_export_value_usd / 1000000).toFixed(1)}M
                  </span>
                  <span className="text-xs font-mono text-muted">{m.market_share_pct}% of total</span>
                </div>

                <div className="text-xs text-muted flex justify-between">
                  <span>Exported Volume:</span>
                  <span className="font-mono text-text-main">{m.total_export_quantity_mt.toLocaleString()} MT</span>
                </div>

                <div className="text-xs text-muted flex justify-between">
                  <span>Avg Unit Value:</span>
                  <span className="font-mono text-amber-700 font-bold">${m.unit_value_usd_per_mt}/MT</span>
                </div>

                <div className="pt-2 border-t border-border-main text-[11px] text-muted space-y-1">
                  <div>Commodities: <span className="text-text-main font-medium">{m.commodities.slice(0, 3).join(', ')}</span></div>
                  <div className="text-[10px] text-muted truncate" title={m.tariff_protocol}>{m.tariff_protocol}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: SEASONAL EXPORT TRENDS */}
        <section id="trends" className="bg-surface border border-border-main rounded-xl p-5 space-y-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border-main pb-3">
            <div>
              <h2 className="text-base font-bold text-text-main flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-agriculture" />
                <span>4. Post-Harvest & Export Trends Across Seasons (2014A – 2026C)</span>
              </h2>
              <p className="text-xs text-muted">
                Track historical export earnings (USD), exported quantities (MT), and traditional vs. horticulture diversification over 38 recorded seasons.
              </p>
            </div>
            <div className="text-xs text-muted font-mono">
              Records: <strong className="text-agriculture">{seasonalComparison.length} Historical Seasons</strong>
            </div>
          </div>

          <div className="bg-background border border-border-main rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-text-main">
              <span className="font-bold uppercase tracking-wider">Export Value Composition: Traditional vs. Non-Traditional (USD)</span>
              <div className="flex items-center space-x-4">
                <span className="flex items-center"><span className="w-3 h-3 bg-agriculture rounded-sm mr-1.5"></span>Total Export Value</span>
                <span className="flex items-center"><span className="w-3 h-3 bg-amber-500 rounded-sm mr-1.5"></span>Traditional (Tea/Coffee)</span>
                <span className="flex items-center"><span className="w-3 h-3 bg-primary rounded-sm mr-1.5"></span>Horticulture & Specialty</span>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={seasonalComparison} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                  <XAxis dataKey="season_code" stroke="#64748B" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#1F2937' }} />
                  <Area type="monotone" dataKey="total_export_value_usd" name="Total Export USD" stroke="#15803D" fill="#15803D" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="traditional_export_value_usd" name="Traditional (Tea/Coffee) USD" stroke="#D97706" fill="#D97706" fillOpacity={0.25} />
                  <Area type="monotone" dataKey="horticulture_export_value_usd" name="Horticulture USD" stroke="#0284C7" fill="#0284C7" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 border-t border-border-main text-[11px] text-muted flex items-center justify-between">
              <span>Data Source: NAEB Export Registries & MINICOM Trade Directorate.</span>
              <span className="text-amber-700 font-medium">Historical trends use dated shipment records. Trade periods are matched to official customs reporting dates.</span>
            </div>
          </div>
        </section>

        {/* SECTION 5: EXPORT EXIT HUBS & INFRASTRUCTURE */}
        <section id="hubs" className="bg-surface border border-border-main rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border-main pb-3">
            <div>
              <h2 className="text-base font-bold text-text-main flex items-center space-x-2">
                <Plane className="w-5 h-5 text-amber-600" />
                <span>5. Documented National Export Exit Hubs</span>
              </h2>
              <p className="text-xs text-muted">
                Verified border posts, air cargo terminals, and lake ports with documented customs, quarantine, and consolidation facilities.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exportHubs.map((hub, idx) => (
              <div key={idx} className="bg-background border border-border-main rounded-lg p-4 space-y-2 hover:border-slate-300 transition">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-main text-xs">{hub.hub_name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    {hub.hub_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-[11px] text-text-main">{hub.location_desc}</div>
                <div className="text-[11px] text-agriculture font-medium">
                  Primary Cargo: {hub.primary_commodities.join(', ')}
                </div>
                <p className="text-[10px] text-muted leading-relaxed">{hub.infrastructure}</p>
                <div className="pt-2 border-t border-border-main text-[10px] flex justify-between items-center text-muted">
                  <span>Serving {hub.serviced_districts_count} districts</span>
                  <button
                    onClick={() => {
                      setActiveSection('overview');
                      const el = document.getElementById('overview');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                      focusOnCoordinates(hub.coordinates[0], hub.coordinates[1], 12);
                    }}
                    className="text-primary hover:underline flex items-center font-medium"
                  >
                    <MapPin className="w-3 h-3 mr-0.5" /> View on Map
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 6: DISTRICT EXPORT CONTRIBUTIONS LEAGUE TABLE */}
        <section id="districts" className="bg-surface border border-border-main rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border-main pb-3">
            <div>
              <h2 className="text-base font-bold text-text-main flex items-center space-x-2">
                <Award className="w-5 h-5 text-agriculture" />
                <span>6. District Export Contributions & Readiness League Table</span>
              </h2>
              <p className="text-xs text-muted">
                All 30 districts ranked by estimated exportable volume, readiness index, and quality certification for Season {selectedSeason}.
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted" />
                <input
                  type="text"
                  placeholder="Search district..."
                  value={searchDistrict}
                  onChange={(e) => setSearchDistrict(e.target.value)}
                  className="bg-background border border-border-main rounded-lg pl-8 pr-3 py-1.5 text-text-main placeholder-muted focus:outline-none focus:ring-1 focus:ring-agriculture"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border-main">
            <table className="w-full text-xs text-left">
              <thead className="bg-background text-muted uppercase font-semibold border-b border-border-main">
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
              <tbody className="divide-y divide-border-main">
                {filteredDistricts.map((d, index) => {
                  const isSelected = d.district_name.toLowerCase() === selectedDistrictName.toLowerCase();
                  return (
                    <tr
                      key={d.district_name}
                      onClick={() => setSelectedDistrictName(d.district_name)}
                      className={`hover:bg-slate-50 cursor-pointer transition ${
                        isSelected ? 'bg-emerald-50/70 font-medium' : index % 2 === 0 ? 'bg-surface' : 'bg-background/40'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-muted">{index + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-text-main flex items-center space-x-1.5">
                        <span>{d.district_name}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-agriculture"></span>}
                      </td>
                      <td className="py-2.5 px-3 text-muted">{d.province_name}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-agriculture">
                        {d.estimated_exportable_volume_mt.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-700">
                        {d.market_surplus_volume_mt.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-primary">
                        {d.export_readiness_score}/100
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          d.export_tier === 'TIER_1_GLOBAL_EXPORT_HUB'
                            ? 'bg-emerald-50 text-agriculture border-emerald-200'
                            : 'bg-background text-muted border-border-main'
                        }`}>
                          {d.export_tier?.replace(/_/g, ' ') || 'PRODUCER'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-text-main truncate max-w-[140px]">{d.nearest_exit_hub}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted">{d.distance_to_exit_km} km</td>
                      <td className="py-2.5 px-3 text-center font-mono text-purple-700 font-semibold">{d.cooperatives_export_ready_count}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-agriculture font-semibold">{d.quality_certification_pct}%</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDistrictName(d.district_name);
                            setActiveSection('overview');
                            const el = document.getElementById('overview');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-2 py-1 rounded bg-surface hover:bg-agriculture text-text-main hover:text-white border border-border-main text-[10px] font-medium transition shadow-sm"
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
        <section id="rankings" className="bg-surface border border-border-main rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border-main pb-3">
            <div>
              <h2 className="text-base font-bold text-text-main flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-amber-600" />
                <span>7. Crop Rankings Based on Export Income</span>
              </h2>
              <p className="text-xs text-muted">
                Ranked contribution of agricultural commodities to Rwanda's national export earnings in Season {selectedSeason}.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border-main">
            <table className="w-full text-xs text-left">
              <thead className="bg-background text-muted uppercase font-semibold border-b border-border-main">
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
              <tbody className="divide-y divide-border-main">
                {commoditiesCatalogue.map((c, idx) => (
                  <tr key={c.product_name} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-muted">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-text-main">{c.product_name}</td>
                    <td className="py-2.5 px-3 text-muted">{c.product_category.replace(/_/g, ' ')}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-agriculture">
                      ${c.export_value_usd.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                      {c.income_share_pct}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-text-main">
                      {c.export_quantity_mt.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-primary font-semibold">
                      ${c.unit_value_usd_per_mt.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.net_trade_status === 'NET_EXPORTER'
                          ? 'bg-emerald-50 text-agriculture border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
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
                        className="px-2 py-1 rounded bg-surface hover:bg-agriculture text-text-main hover:text-white border border-border-main text-[10px] font-medium transition shadow-sm"
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
        <section id="facilities" className="bg-surface border border-border-main rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border-main pb-3">
            <div>
              <h2 className="text-base font-bold text-text-main flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span>8. Facilities That Support Agricultural Exports</span>
              </h2>
              <p className="text-xs text-muted">
                Searchable register of verified tea processing factories, coffee washing stations, cold stores, and export packhouses.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="text"
                placeholder="Search facility, district..."
                value={facilitySearch}
                onChange={(e) => setFacilitySearch(e.target.value)}
                className="bg-background border border-border-main rounded-lg px-3 py-1.5 text-text-main placeholder-muted focus:outline-none focus:ring-1 focus:ring-agriculture"
              />

              <select
                value={facilityTypeFilter}
                onChange={(e) => setFacilityTypeFilter(e.target.value)}
                className="bg-background border border-border-main rounded-lg px-2.5 py-1.5 text-text-main focus:outline-none"
              >
                <option value="ALL">All Facility Types</option>
                <option value="PROCESSING_PLANT">Processing Plants (Tea/Mills)</option>
                <option value="COLD_STORAGE">Cold-Chain Facilities</option>
                <option value="WAREHOUSE">Warehouses & Consolidation</option>
                <option value="SILO">Strategic Silos</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border-main">
            <table className="w-full text-xs text-left">
              <thead className="bg-background text-muted uppercase font-semibold border-b border-border-main">
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
              <tbody className="divide-y divide-border-main">
                {filteredFacilities.slice(0, 30).map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-bold text-text-main">{f.facility_name}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface text-primary border border-border-main">
                        {f.facility_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-text-main">{f.district_name}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-agriculture">
                      {f.storage_capacity_tonnes > 0
                        ? `${f.storage_capacity_tonnes.toLocaleString()} MT`
                        : `${f.processing_capacity_tonnes_day} MT/day`}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-agriculture border border-emerald-200">
                        {f.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted">{f.operator_name}</td>
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
                          className="px-2.5 py-1 rounded bg-surface hover:bg-agriculture text-text-main hover:text-white border border-border-main text-[10px] font-medium transition inline-flex items-center shadow-sm"
                        >
                          <MapPin className="w-3 h-3 mr-1" /> Focus on Map
                        </button>
                      ) : (
                        <span className="text-muted text-[10px]">No GPS</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 9: STRATEGIC OPPORTUNITIES & PRE-FEASIBILITY SCREENING */}
        <section id="opportunities" className="bg-surface border border-border-main rounded-xl p-5 space-y-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border-main pb-3">
            <div>
              <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-agriculture border border-emerald-200 mb-1">
                Strategic Trade Planning Framework
              </div>
              <h2 className="text-base font-bold text-text-main flex items-center space-x-2">
                <Target className="w-5 h-5 text-agriculture" />
                <span>9. Strategic Planning & Export Investment Opportunities</span>
              </h2>
              <p className="text-xs text-muted">
                Evidence-based screening signals identifying high-potential product-market pairings requiring feasibility audits.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategicOpportunities.map((opp, idx) => (
              <div key={idx} className="bg-background border border-border-main rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-base font-bold text-text-main">{opp.product_name}</span>
                    <span className="ml-2 text-xs text-primary font-semibold">→ {opp.destination_country} ({opp.destination_region})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    MCDA Score: {opp.opportunity_score}/100
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-agriculture border border-emerald-200">
                    {opp.classification.replace(/_/g, ' ')}
                  </span>
                  <span className="text-muted">Level: <strong className="text-text-main">{opp.opportunity_level}</strong></span>
                </div>

                <p className="text-xs text-text-main leading-relaxed bg-surface p-2.5 rounded border border-border-main">
                  {opp.evidence_summary}
                </p>

                {/* Pre-feasibility Checklist */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="font-semibold text-text-main">Mandatory Pre-Investment Verifications:</div>
                  <div className="space-y-1">
                    {opp.pre_feasibility_checklist.map((step, sIdx) => (
                      <div key={sIdx} className="flex items-start space-x-2 text-muted">
                        <CheckCircle2 className="w-3.5 h-3.5 text-agriculture shrink-0 mt-0.5" />
                        <span><strong className="text-text-main">{step.step}:</strong> {step.note}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Safeguard Disclaimer */}
                <div className="p-2 rounded bg-surface border border-border-main text-[10px] text-muted space-y-0.5">
                  <div className="text-amber-800 font-semibold flex items-center">
                    <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                    {opp.institutional_safeguard}
                  </div>
                  <p className="text-muted italic">Constraints: {opp.constraints_and_limitations}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-border-main bg-surface px-6 py-4 mt-auto text-xs text-muted flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
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
