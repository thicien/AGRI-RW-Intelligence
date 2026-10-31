import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { apiUrl } from '../../config/api';
import { 
  Layers, ShieldAlert, Sprout, AlertTriangle, CheckCircle2, 
  MapPin, RefreshCw, FileText, Filter, Download, 
  Database, Award, ChevronRight, ArrowUpRight, ArrowDownRight, 
  Info, HelpCircle, Sun, Activity, Zap, ExternalLink, Mountain, Shovel,
  TrendingUp, BarChart3, Compass, Check, Search, Eye, SlidersHorizontal,
  ChevronDown, Flame, TreePine, Droplets, Target, ShieldCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  CartesianGrid, Cell, AreaChart, Area, LineChart, Line, Legend
} from 'recharts';

export type IntelligenceLayerType = 'fertility' | 'erosion' | 'soil_condition' | 'priorities';

export type SoilIndicatorType = 
  | 'inorganic_farmer_pct'
  | 'organic_farmer_pct'
  | 'fert_npk_pct'
  | 'fert_urea_pct'
  | 'fert_dap_pct'
  | 'fert_lime_pct'
  | 'erosion_control_pct'
  | 'agroforestry_ha'
  | 'radical_terracing_gap_ha'
  | 'degree_severe_pct'
  | 'soil_ph'
  | 'lime_requirement_tons_per_ha'
  | 'organic_carbon_pct'
  | 'cation_exchange_capacity_meq'
  | 'priority_score'
  | 'modelled_erosion_susceptibility_index'
  | 'slope_steep_pct';

export interface DistrictSoilStat {
  id: string;
  district_name: string;
  province_name: string;
  season_code: string;
  year: number;
  season_name: string;
  total_cultivated_ha: number;
  
  // Erosion Prevention
  erosion_control_ha: number;
  erosion_control_pct: number;
  prev_erosion_control_pct: number | null;
  erosion_control_change_pct: number | null;
  agroforestry_ha: number;
  agroforestry_pct: number;
  radical_terracing_gap_ha: number;
  conservation_gap_ha: number;

  // Organic Inputs
  organic_fertilizer_ha: number;
  organic_farmer_pct: number;
  organic_plot_pct: number;
  prev_organic_farmer_pct: number | null;
  organic_change_pct: number | null;

  // Mineral / Inorganic Inputs
  inorganic_fertilizer_ha: number;
  inorganic_farmer_pct: number;
  inorganic_plot_pct: number;
  prev_inorganic_farmer_pct: number | null;
  inorganic_change_pct: number | null;

  // Fertilizer breakdown
  fert_npk_pct: number;
  fert_urea_pct: number;
  fert_dap_pct: number;
  fert_lime_pct: number;
  fert_other_pct: number;

  // Erosion severity & rates
  erosion_severe_rate_pct: number;
  erosion_mod_rate_pct: number;
  erosion_low_rate_pct: number;
  degree_severe_pct: number;
  degree_moderate_pct: number;
  degree_low_pct: number;
  degree_very_low_pct: number;

  // Measured Soil Condition
  soil_ph: number;
  prev_soil_ph: number | null;
  acidity_status: string;
  lime_requirement_tons_per_ha: number;
  organic_carbon_pct: number;
  soil_texture: string;
  cation_exchange_capacity_meq: number;
  nitrogen_rating: string;
  phosphorus_rating: string;
  potassium_rating: string;

  // Modelled erosion & terrain
  modelled_erosion_susceptibility_index: number;
  slope_steep_pct: number;
  slope_moderate_pct: number;
  slope_gentle_pct: number;
  seasonal_rainfall_mm: number;
  rainfall_erosivity_index: number;

  // Productivity
  crop_yield_maize_kg_ha: number;
  crop_yield_beans_kg_ha: number;
  crop_yield_potato_kg_ha: number;
  crop_yield_cassava_kg_ha: number;
  productivity_index: number;

  // Priority & recommendations
  priority_score: number;
  priority_tier: string;
  recommended_interventions: any;
  evidence_sources: string[];
  indicator_breakdown: any;
  has_data: boolean;
  matching_projects: any[];
  projects_count: number;
}

export interface SoilConservationProject {
  id: string;
  code: string;
  name: string;
  district_name: string;
  province_name: string;
  project_type: string;
  command_area_ha: number;
  beneficiary_farmers: number;
  status: string;
  primary_technologies: string[];
  funding_source: string;
  key_impact: string;
}

// Centroid coordinates for Rwandan districts for quick pan/zoom
const DISTRICT_CENTROIDS: Record<string, [number, number]> = {
  Gicumbi: [30.12, -1.61],
  Nyaruguru: [29.54, -2.71],
  Rubavu: [29.33, -1.67],
  Ngororero: [29.62, -1.86],
  Nyamagabe: [29.47, -2.39],
  Karongi: [29.38, -2.14],
  Gakenke: [29.78, -1.69],
  Bugesera: [30.25, -2.23],
  Kayonza: [30.65, -1.85],
  Rutsiro: [29.35, -1.93],
  Nyagatare: [30.33, -1.30],
  Kirehe: [30.73, -2.27],
  Gatsibo: [30.45, -1.60],
  Rwamagana: [30.43, -1.95],
  Musanze: [29.63, -1.50],
  Burera: [29.83, -1.45],
  Rulindo: [29.98, -1.73],
  Huye: [29.70, -2.60],
  Nyanza: [29.75, -2.35],
  Ruhango: [29.78, -2.22],
  Muhanga: [29.75, -2.08],
  Kamonyi: [29.93, -2.00],
  Gisagara: [29.84, -2.61],
  Rusizi: [28.90, -2.58],
  Nyamasheke: [29.15, -2.35],
  Gasabo: [30.13, -1.90],
  Kicukiro: [30.10, -2.00],
  Nyarugenge: [30.05, -1.96]
};

export default function SoilConservation() {
  // DOM & Map references
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Filter States
  const [selectedSeason, setSelectedSeason] = useState<string>('2025A');
  const [compareSeason, setCompareSeason] = useState<string>('2024A');
  const [activeLayer, setActiveLayer] = useState<IntelligenceLayerType>('fertility');
  const [activeIndicator, setActiveIndicator] = useState<SoilIndicatorType>('inorganic_farmer_pct');
  const [selectedProvince, setSelectedProvince] = useState<string>('ALL');
  const [selectedProjectType, setSelectedProjectType] = useState<string>('ALL');
  const [showProjectMarkers, setShowProjectMarkers] = useState<boolean>(true);
  const [searchDistrict, setSearchDistrict] = useState<string>('');
  const [rankingFilter, setRankingFilter] = useState<'ALL' | 'HIGH_FERTILITY' | 'HIGH_ORGANIC' | 'HIGH_CONSERVATION' | 'CRITICAL_ACIDITY' | 'SEVERE_EROSION' | 'TIER_1_PRIORITY'>('ALL');

  // Selected District for Side Panel Dossier
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('Gicumbi');
  const [districtTab, setDistrictTab] = useState<'OVERVIEW' | 'FERTILITY' | 'CONSERVATION' | 'MEASURED_SOIL' | 'INTERVENTIONS'>('OVERVIEW');

  // Backend Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableSeasons, setAvailableSeasons] = useState<Array<{ code: string; label: string; year: number }>>([]);
  const [availableProjectTypes, setAvailableProjectTypes] = useState<Array<{ type: string; count: number }>>([]);
  const [nationalSummary, setNationalSummary] = useState<any>(null);
  const [districts, setDistricts] = useState<DistrictSoilStat[]>([]);
  const [seasonalTrends, setSeasonalTrends] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<SoilConservationProject[]>([]);
  const [interventionScreening, setInterventionScreening] = useState<any>({ candidateDistricts: [], criteriaWeights: [] });

  // Refs for map callbacks to prevent stale closures
  const districtsRef = useRef<DistrictSoilStat[]>([]);
  const selectedDistrictNameRef = useRef<string>('Gicumbi');
  const geojsonLoadedRef = useRef<boolean>(false);
  const activeIndicatorRef = useRef<SoilIndicatorType>('inorganic_farmer_pct');

  // Synchronize indicator when layer changes
  useEffect(() => {
    switch (activeLayer) {
      case 'fertility':
        setActiveIndicator('inorganic_farmer_pct');
        break;
      case 'erosion':
        setActiveIndicator('erosion_control_pct');
        break;
      case 'soil_condition':
        setActiveIndicator('soil_ph');
        break;
      case 'priorities':
        setActiveIndicator('priority_score');
        break;
    }
  }, [activeLayer]);

  // 1. Fetch Decision Workspace Data from Backend
  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('season', selectedSeason);
      if (compareSeason) params.append('compareSeason', compareSeason);
      if (selectedProvince) params.append('province', selectedProvince);
      if (selectedProjectType) params.append('projectType', selectedProjectType);

      const url = apiUrl(`soil-fertility/decision-workspace?${params.toString()}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load soil intelligence workspace`);

      const data = await res.json();

      setNationalSummary(data.nationalSummary || null);
      const districtList: DistrictSoilStat[] = data.districts || [];
      setDistricts(districtList);
      districtsRef.current = districtList;

      setSeasonalTrends(data.seasonalTrends || []);
      setProjectsList(data.projectsList || []);
      setInterventionScreening(data.interventionScreening || { candidateDistricts: [], criteriaWeights: [] });

      if (data.meta?.availableSeasons) {
        setAvailableSeasons(data.meta.availableSeasons);
      }
      if (data.meta?.availableProjectTypes) {
        setAvailableProjectTypes(data.meta.availableProjectTypes);
      }
    } catch (err: any) {
      console.error('Error fetching soil workspace data:', err);
      setError(err.message || 'Error connecting to national soil intelligence API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [selectedSeason, compareSeason, selectedProvince, selectedProjectType]);

  useEffect(() => {
    districtsRef.current = districts;
  }, [districts]);

  useEffect(() => {
    selectedDistrictNameRef.current = selectedDistrictName;
  }, [selectedDistrictName]);

  useEffect(() => {
    activeIndicatorRef.current = activeIndicator;
  }, [activeIndicator]);

  // Configuration for Active Map Indicator
  const indicatorConfig = useMemo(() => {
    switch (activeIndicator) {
      case 'inorganic_farmer_pct':
        return {
          label: 'Mineral Fertilizer Adoption Rate',
          unit: '% of farmers',
          isWarning: false,
          getValue: (d: DistrictSoilStat) => d.inorganic_farmer_pct,
          format: (v: number | null) => v !== null ? `${v.toFixed(1)}%` : 'No data',
          description: 'Percentage of smallholders applying mineral fertilizers (NPK, Urea, DAP) on cultivated plots.',
        };
      case 'organic_farmer_pct':
        return {
          label: 'Organic Input Adoption Rate',
          unit: '% of farmers',
          isWarning: false,
          getValue: (d: DistrictSoilStat) => d.organic_farmer_pct,
          format: (v: number | null) => v !== null ? `${v.toFixed(1)}%` : 'No data',
          description: 'Percentage of farmers applying animal manure, green compost, or organic residues.',
        };
      case 'fert_npk_pct':
        return {
          label: 'NPK 17-17-17 Formulation Share',
          unit: '% of fertilizer used',
          isWarning: false,
          getValue: (d: DistrictSoilStat) => d.fert_npk_pct,
          format: (v: number | null) => v !== null ? `${v.toFixed(1)}%` : 'No data',
          description: 'Share of NPK compound fertilizer within the district mineral fertilizer distribution.',
        };
      case 'fert_urea_pct':
        return {
          label: 'Urea (46% N) Formulation Share',
          unit: '% of fertilizer used',
          isWarning: false,
          getValue: (d: DistrictSoilStat) => d.fert_urea_pct,
          format: (v: number | null) => v !== null ? `${v.toFixed(1)}%` : 'No data',
          description: 'Share of Urea nitrogen fertilizer applied during top-dressing.',
        };
      case 'fert_dap_pct':
        return {
          label: 'DAP (18-46-0) Basal Share',
          unit: '% of fertilizer used',
          isWarning: false,
          getValue: (d: DistrictSoilStat) => d.fert_dap_pct,
          format: (v: number | null) => v !== null ? `${v.toFixed(1)}%` : 'No data',
          description: 'Share of Diammonium Phosphate used as basal fertilizer at planting.',
        };
      case 'fert_lime_pct':
        return {
          label: 'Agricultural Lime Adoption Share',
          unit: '% of soil amendments',
          isWarning: false,
          getValue: (d: DistrictSoilStat) => d.fert_lime_pct,
          format: (v: number | null) => v !== null ? `${v.toFixed(1)}%` : 'No data',
          description: 'Share of calcic/dolomitic lime applied for soil acidity neutralization.',
        };
      case 'erosion_control_pct':
        return {
          label: 'Erosion-Control Practice Adoption',
          unit: '% of cultivated land',
          isWarning: false,
          getValue: (d: DistrictSoilStat) => d.erosion_control_pct,
          format: (v: number | null) => v !== null ? `${v.toFixed(1)}%` : 'No data',
          description: 'Percentage of agricultural area protected by terraces, bunds, grass strips, or ditches.',
        };
      case 'agroforestry_ha':
        return {
          label: 'Agroforestry Tree Protected Area',
          unit: 'hectares',
          isWarning: false,
          getValue: (d: DistrictSoilStat) => d.agroforestry_ha,
          format: (v: number | null) => v !== null ? `${v.toLocaleString()} ha` : 'No data',
          description: 'Cultivated area integrated with nitrogen-fixing, fruit, or timber agroforestry species.',
        };
      case 'radical_terracing_gap_ha':
        return {
          label: 'Radical Terracing Unmet Need Gap',
          unit: 'hectares needed',
          isWarning: true,
          getValue: (d: DistrictSoilStat) => d.radical_terracing_gap_ha,
          format: (v: number | null) => v !== null ? `${v.toLocaleString()} ha` : 'No data',
          description: 'Steep hillside farmland (>25% slope) requiring physical bench terracing and stone risers.',
        };
      case 'degree_severe_pct':
        return {
          label: 'Severe Erosion Frequency Hotspot',
          unit: '% of plots affected',
          isWarning: true,
          getValue: (d: DistrictSoilStat) => d.degree_severe_pct,
          format: (v: number | null) => v !== null ? `${v.toFixed(2)}%` : 'No data',
          description: 'Share of survey plots recording severe rill, gully erosion, or soil landslides.',
        };
      case 'soil_ph':
        return {
          label: 'Measured Soil pH (Acidity)',
          unit: 'pH value',
          isWarning: false, // Low pH is acid; we show favorable green for optimal pH (5.8-6.5)
          getValue: (d: DistrictSoilStat) => d.soil_ph,
          format: (v: number | null) => v !== null ? `${v.toFixed(2)} pH` : 'No data',
          description: 'Laboratory-measured potentiometric soil reaction (1:2.5 H2O). pH < 5.5 causes Al toxicity.',
        };
      case 'lime_requirement_tons_per_ha':
        return {
          label: 'Agricultural Lime Requirement',
          unit: 'tons / hectare',
          isWarning: true,
          getValue: (d: DistrictSoilStat) => d.lime_requirement_tons_per_ha,
          format: (v: number | null) => v !== null ? `${v.toFixed(1)} t/ha` : 'No data',
          description: 'Calcic lime needed to raise topsoil pH to 5.8 for optimal nutrient bioavailability.',
        };
      case 'organic_carbon_pct':
        return {
          label: 'Soil Organic Carbon (SOC)',
          unit: '% organic carbon',
          isWarning: false,
          getValue: (d: DistrictSoilStat) => d.organic_carbon_pct,
          format: (v: number | null) => v !== null ? `${v.toFixed(2)}%` : 'No data',
          description: 'Walkley-Black tested organic carbon. Indicator of soil fertility, moisture retention, and health.',
        };
      case 'cation_exchange_capacity_meq':
        return {
          label: 'Cation Exchange Capacity (CEC)',
          unit: 'meq / 100g',
          isWarning: false,
          getValue: (d: DistrictSoilStat) => d.cation_exchange_capacity_meq,
          format: (v: number | null) => v !== null ? `${v.toFixed(1)} meq` : 'No data',
          description: 'Soil capacity to hold exchangeable cations (Ca2+, Mg2+, K+).',
        };
      case 'priority_score':
        return {
          label: 'Multi-Criteria Conservation Priority Score',
          unit: 'index (0-100)',
          isWarning: true,
          getValue: (d: DistrictSoilStat) => d.priority_score,
          format: (v: number | null) => v !== null ? `${v.toFixed(1)}` : 'No data',
          description: 'Transparent composite need index combining severe erosion, slope hazard, acidity, and adoption deficit.',
        };
      case 'modelled_erosion_susceptibility_index':
        return {
          label: 'Modelled Erosion Susceptibility Index',
          unit: 'RUSLE index (0-100)',
          isWarning: true,
          getValue: (d: DistrictSoilStat) => d.modelled_erosion_susceptibility_index,
          format: (v: number | null) => v !== null ? `${v.toFixed(0)}` : 'No data',
          description: 'Terrain slope gradient, rainfall erosivity, and soil erodibility modelled index.',
        };
      case 'slope_steep_pct':
        return {
          label: 'Steep Hillside Farmland Share (>25% Slope)',
          unit: '% of cultivated land',
          isWarning: true,
          getValue: (d: DistrictSoilStat) => d.slope_steep_pct,
          format: (v: number | null) => v !== null ? `${v.toFixed(1)}%` : 'No data',
          description: 'Percentage of cultivated land located on steep mountain slopes exceeding 25% incline.',
        };
    }
  }, [activeIndicator]);

  // Quantile Extents for Legend
  const extents = useMemo(() => {
    const validVals = districts
      .map(d => indicatorConfig.getValue(d))
      .filter((v): v is number => typeof v === 'number' && !isNaN(v))
      .sort((a, b) => a - b);

    if (validVals.length === 0) {
      return { min: 0, p25: 1, p50: 2, p75: 3, max: 5 };
    }

    const min = validVals[0];
    const max = validVals[validVals.length - 1];
    const p25 = validVals[Math.floor(validVals.length * 0.25)] ?? min;
    const p50 = validVals[Math.floor(validVals.length * 0.50)] ?? (min + max) / 2;
    const p75 = validVals[Math.floor(validVals.length * 0.75)] ?? max;
    return { min, p25, p50, p75, max };
  }, [districts, indicatorConfig]);

  // Color Ramps
  // Favorable: Pale emerald -> Rich Forest Green
  const favorableRamp = ['#ECFDF5', '#A7F3D0', '#34D399', '#059669', '#064E3B'];
  // Warning/Hazard: Pale Amber -> Crimson Red
  const warningRamp = ['#FEF3C7', '#FDE68A', '#F59E0B', '#EF4444', '#991B1B'];
  const missingColor = '#94A3B8'; // Slate gray for missing records

  const activeRamp = indicatorConfig.isWarning ? warningRamp : favorableRamp;

  const getDistrictColor = (d: DistrictSoilStat): string => {
    const val = indicatorConfig.getValue(d);
    if (val === null || val === undefined || !d.has_data) {
      return missingColor;
    }
    const { min, max, p25, p50, p75 } = extents;
    if (max === min) return activeRamp[2];

    if (val <= p25) return activeRamp[0];
    if (val <= p50) return activeRamp[1];
    if (val <= p75) return activeRamp[2];
    if (val < max) return activeRamp[3];
    return activeRamp[4];
  };

  // 2. Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors | NISR & RAB Rwanda',
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

          // Build match expression
          let initialFill: any = '#34D399';
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
              'line-color': '#059669',
              'line-width': 3.5,
              'line-opacity': 1.0,
            },
          });

          // Fit map bounds to Rwanda
          map.current.fitBounds([
            [28.86, -2.84],
            [30.90, -1.05]
          ], { padding: 25 });

          // Hover interaction
          map.current.on('mousemove', 'district-fill', (e: any) => {
            if (!map.current || !e.features || e.features.length === 0) return;
            map.current.getCanvas().style.cursor = 'pointer';

            const shapeName = e.features[0].properties?.shapeName;
            const currentListInner = districtsRef.current;
            const districtData = currentListInner.find(
              (d) => d.district_name.toLowerCase() === (shapeName || '').toLowerCase()
            );

            if (!hoverPopupRef.current) {
              hoverPopupRef.current = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
                className: 'soil-map-popup',
              });
            }

            const activeInd = activeIndicatorRef.current;
            const val = districtData ? (districtData as any)[activeInd] : null;

            const popupHtml = `
              <div style="font-family: inherit; font-size: 11px; padding: 4px; min-width: 170px;">
                <div style="font-weight: 700; color: #064E3B; font-size: 13px;">${shapeName || 'District'}</div>
                <div style="color: #64748B; font-size: 10px; margin-bottom: 4px;">${districtData?.province_name || 'Rwanda'} · Season ${selectedSeason}</div>
                <div style="border-top: 1px solid #E2E8F0; padding-top: 4px;">
                  <span style="color: #475569;">${activeInd.replace(/_/g, ' ').toUpperCase()}:</span>
                  <span style="font-weight: 700; color: #0F172A; float: right;">
                    ${typeof val === 'number' ? val.toLocaleString() : (val || 'No Record')}
                  </span>
                </div>
                <div style="margin-top: 3px; font-size: 9px; color: #059669; font-weight: 600;">
                  Data Source: NISR SAS & RAB Soil Testing
                </div>
              </div>
            `;

            hoverPopupRef.current
              .setLngLat(e.lngLat)
              .setHTML(popupHtml)
              .addTo(map.current);
          });

          map.current.on('mouseleave', 'district-fill', () => {
            if (!map.current) return;
            map.current.getCanvas().style.cursor = '';
            if (hoverPopupRef.current) {
              hoverPopupRef.current.remove();
            }
          });

          // Click on district
          map.current.on('click', 'district-fill', (e: any) => {
            if (!e.features || e.features.length === 0) return;
            const shapeName = e.features[0].properties?.shapeName;
            if (shapeName) {
              setSelectedDistrictName(shapeName);
              selectedDistrictNameRef.current = shapeName;
              if (map.current && map.current.getLayer('district-selected-border')) {
                map.current.setFilter('district-selected-border', ['==', 'shapeName', shapeName]);
              }
            }
          });
        }
      } catch (err) {
        console.error('Error loading Rwanda districts GeoJSON:', err);
      }
    });

    const handleResize = () => {
      map.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update choropleth colors when districts or indicator changes
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded() || !map.current.getLayer('district-fill')) return;

    if (districts.length > 0) {
      const matchExpr: any[] = ['match', ['get', 'shapeName']];
      for (const d of districts) {
        matchExpr.push(d.district_name, getDistrictColor(d));
      }
      matchExpr.push(missingColor);
      map.current.setPaintProperty('district-fill', 'fill-color', matchExpr as any);
    }
  }, [districts, activeIndicator, extents]);

  // Update selected district border
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded() || !map.current.getLayer('district-selected-border')) return;
    map.current.setFilter('district-selected-border', ['==', 'shapeName', selectedDistrictName || '']);
  }, [selectedDistrictName]);

  // Update Documented Project Markers on Map
  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!showProjectMarkers || projectsList.length === 0) return;

    for (const project of projectsList) {
      const coords = DISTRICT_CENTROIDS[project.district_name];
      if (!coords) continue;

      const el = document.createElement('div');
      el.className = 'soil-project-marker';
      el.style.cssText = `
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${project.project_type === 'RADICAL_TERRACING' ? '#D97706' : project.project_type === 'LIME_APPLICATION' ? '#0891B2' : '#059669'};
        border: 2px solid #FFFFFF;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s ease;
      `;
      el.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.25)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div style="font-size: 11px; padding: 4px; font-family: inherit; max-width: 220px;">
          <div style="font-weight: 700; color: #064E3B; font-size: 12px; margin-bottom: 2px;">${project.name}</div>
          <div style="color: #64748B; font-size: 10px; margin-bottom: 4px;">${project.district_name} · ${project.project_type.replace(/_/g, ' ')}</div>
          <div style="background: #F1F5F9; padding: 4px; border-radius: 4px; margin-bottom: 4px;">
            <div><strong>Command Area:</strong> ${Number(project.command_area_ha).toLocaleString()} Ha</div>
            <div><strong>Beneficiaries:</strong> ${Number(project.beneficiary_farmers).toLocaleString()} farmers</div>
            <div><strong>Funding:</strong> ${project.funding_source}</div>
          </div>
          <div style="font-size: 10px; color: #334155; font-style: italic;">"${project.key_impact}"</div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map.current);

      markersRef.current.push(marker);
    }
  }, [projectsList, showProjectMarkers]);

  // Selected district object
  const selectedDistrictData = useMemo(() => {
    return districts.find(
      (d) => d.district_name.toLowerCase() === selectedDistrictName.toLowerCase()
    ) || districts[0] || null;
  }, [districts, selectedDistrictName]);

  // Focus map on a district
  const focusDistrictOnMap = (districtName: string) => {
    setSelectedDistrictName(districtName);
    const coords = DISTRICT_CENTROIDS[districtName];
    if (map.current && coords) {
      map.current.flyTo({
        center: coords,
        zoom: 9.8,
        essential: true,
      });
    }
  };

  // Filtered districts for performance ranking table
  const filteredRankingDistricts = useMemo(() => {
    let list = [...districts];

    if (searchDistrict.trim()) {
      const q = searchDistrict.toLowerCase();
      list = list.filter(
        (d) => d.district_name.toLowerCase().includes(q) || d.province_name.toLowerCase().includes(q)
      );
    }

    switch (rankingFilter) {
      case 'HIGH_FERTILITY':
        return list.sort((a, b) => b.inorganic_farmer_pct - a.inorganic_farmer_pct);
      case 'HIGH_ORGANIC':
        return list.sort((a, b) => b.organic_farmer_pct - a.organic_farmer_pct);
      case 'HIGH_CONSERVATION':
        return list.sort((a, b) => b.erosion_control_pct - a.erosion_control_pct);
      case 'CRITICAL_ACIDITY':
        return list.filter((d) => d.soil_ph < 5.5).sort((a, b) => a.soil_ph - b.soil_ph);
      case 'SEVERE_EROSION':
        return list.filter((d) => d.degree_severe_pct >= 2.0).sort((a, b) => b.degree_severe_pct - a.degree_severe_pct);
      case 'TIER_1_PRIORITY':
        return list.filter((d) => d.priority_tier === 'TIER_1_URGENT_INTERVENTION').sort((a, b) => b.priority_score - a.priority_score);
      default:
        return list.sort((a, b) => b.priority_score - a.priority_score);
    }
  }, [districts, searchDistrict, rankingFilter]);

  // Download filtered data as CSV
  const handleExportCSV = () => {
    if (districts.length === 0) return;
    const headers = [
      'District', 'Province', 'Season', 'Cultivated_Ha', 'Erosion_Control_Pct', 'Agroforestry_Ha',
      'Organic_Farmer_Pct', 'Inorganic_Farmer_Pct', 'NPK_Pct', 'Urea_Pct', 'DAP_Pct', 'Lime_Pct',
      'Soil_pH', 'Acidity_Status', 'Lime_Req_Tons_Ha', 'Severe_Erosion_Pct', 'Priority_Score', 'Priority_Tier'
    ];
    const rows = districts.map((d) => [
      d.district_name,
      d.province_name,
      d.season_code,
      d.total_cultivated_ha,
      d.erosion_control_pct,
      d.agroforestry_ha,
      d.organic_farmer_pct,
      d.inorganic_farmer_pct,
      d.fert_npk_pct,
      d.fert_urea_pct,
      d.fert_dap_pct,
      d.fert_lime_pct,
      d.soil_ph,
      d.acidity_status,
      d.lime_requirement_tons_per_ha,
      d.degree_severe_pct,
      d.priority_score,
      d.priority_tier
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agrilens_soil_fertility_intelligence_${selectedSeason}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ns = nationalSummary;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-950 text-slate-100 font-sans">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              National Agricultural Planner · Soil & Fertility
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              NISR Seasonal Agricultural Survey (SAS) & RAB RwandaSIS Verified
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1.5 flex items-center gap-3">
            <Layers className="w-8 h-8 text-emerald-400" />
            National Soil Health, Fertility & Conservation Intelligence
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-4xl">
            Monitor fertility-management adoption, compare modern and traditional practices, evaluate erosion prevention, and explore district-level changes across agricultural seasons.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 transition-colors shadow-xs"
            title="Export filtered intelligence dataset as CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchWorkspaceData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs disabled:opacity-50"
            title="Refresh Intelligence Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Unified Master Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2 font-semibold text-slate-300">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span>NATIONAL SOIL & FERTILITY FILTER CONTROLS</span>
          </div>
          <span className="text-[11px] text-slate-500 italic">
            Filters synchronize across map, KPI cards, charts, and ranked league tables.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Filter 1: Agricultural Season */}
          <div className="space-y-1">
            <label className="text-slate-400 font-medium flex items-center justify-between">
              <span>Agricultural Season</span>
              <span className="text-[10px] text-emerald-400 font-bold">NISR SAS</span>
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500"
            >
              {availableSeasons.map((s) => (
                <option key={s.code} value={s.code} className="bg-slate-900 text-white">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Intelligence Layer */}
          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Intelligence Layer</label>
            <select
              value={activeLayer}
              onChange={(e) => setActiveLayer(e.target.value as IntelligenceLayerType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="fertility">Fertility-Management Adoption</option>
              <option value="erosion">Soil Erosion Prevention</option>
              <option value="soil_condition">Measured Soil Condition</option>
              <option value="priorities">Conservation & Liming Priorities</option>
            </select>
          </div>

          {/* Filter 3: Specific Indicator Selector */}
          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Map Indicator & Metric</label>
            <select
              value={activeIndicator}
              onChange={(e) => setActiveIndicator(e.target.value as SoilIndicatorType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-medium focus:outline-none focus:border-emerald-500"
            >
              {activeLayer === 'fertility' && (
                <>
                  <option value="inorganic_farmer_pct">Mineral Fertilizer Adoption (% farmers)</option>
                  <option value="organic_farmer_pct">Organic Input Adoption (% farmers)</option>
                  <option value="fert_npk_pct">NPK Formulation Share (%)</option>
                  <option value="fert_urea_pct">Urea Nitrogen Share (%)</option>
                  <option value="fert_dap_pct">DAP Basal Share (%)</option>
                  <option value="fert_lime_pct">Lime Amendment Share (%)</option>
                </>
              )}
              {activeLayer === 'erosion' && (
                <>
                  <option value="erosion_control_pct">Erosion-Control Practice Adoption (%)</option>
                  <option value="agroforestry_ha">Agroforestry Tree Protected Area (ha)</option>
                  <option value="radical_terracing_gap_ha">Radical Terracing Unmet Need (ha)</option>
                  <option value="degree_severe_pct">Severe Erosion Frequency Hotspot (%)</option>
                </>
              )}
              {activeLayer === 'soil_condition' && (
                <>
                  <option value="soil_ph">Measured Soil pH (Acidity Reaction)</option>
                  <option value="lime_requirement_tons_per_ha">Lime Requirement (t/ha)</option>
                  <option value="organic_carbon_pct">Soil Organic Carbon (SOC %)</option>
                  <option value="cation_exchange_capacity_meq">Cation Exchange Capacity (CEC meq)</option>
                </>
              )}
              {activeLayer === 'priorities' && (
                <>
                  <option value="priority_score">Multi-Criteria Priority Score (0-100)</option>
                  <option value="modelled_erosion_susceptibility_index">Modelled Erosion Susceptibility (0-100)</option>
                  <option value="slope_steep_pct">Steep Slope Farmland Share (&gt;25%)</option>
                </>
              )}
            </select>
          </div>

          {/* Filter 4: Geographic Scope */}
          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Geographic Scope</label>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Districts — National View</option>
              <option value="Eastern">Eastern Province</option>
              <option value="Northern">Northern Province</option>
              <option value="Southern">Southern Province</option>
              <option value="Western">Western Province</option>
              <option value="Kigali">Kigali City</option>
            </select>
          </div>

          {/* Filter 5: Comparison Season */}
          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Comparison Season</label>
            <select
              value={compareSeason}
              onChange={(e) => setCompareSeason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="">Auto (Previous Comparable)</option>
              {availableSeasons.filter(s => s.code !== selectedSeason).map((s) => (
                <option key={s.code} value={s.code} className="bg-slate-900 text-white">
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Mandatory Pre-Feasibility & Agronomic Safeguard Banner */}
      <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 backdrop-blur-sm flex items-start gap-3.5 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <div className="font-bold text-amber-300 uppercase tracking-wide flex items-center gap-2">
            METHODOLOGICAL SAFEGUARD: INDICATOR SEPARATION & EVIDENCE REQUIREMENT
          </div>
          <p className="text-amber-200/90 leading-relaxed">
            <strong>Distinguish between reported practice adoption, laboratory-measured soil properties, and modelled terrain hazard:</strong> A district with high fertilizer adoption does not automatically possess healthy soil; likewise, low adoption of terraces is not identical to measured severe erosion.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-[11px] text-amber-100">
            <div className="p-2 rounded bg-amber-900/30 border border-amber-500/20">
              <span className="font-bold text-amber-300">1. Reported Practices:</span> Survey-declared farm practices (NISR SAS: terraces, agroforestry, organic manure, mineral fertilizer).
            </div>
            <div className="p-2 rounded bg-amber-900/30 border border-amber-500/20">
              <span className="font-bold text-amber-300">2. Measured Soil Condition:</span> Laboratory tested parameters (RAB archives: pH, organic carbon %, CEC, lime requirement).
            </div>
            <div className="p-2 rounded bg-amber-900/30 border border-amber-500/20">
              <span className="font-bold text-amber-300">3. Modelled Hazard:</span> Simulation index based on terrain slope gradient (DEM), rainfall erosivity, and soil erodibility.
            </div>
          </div>
        </div>
      </div>

      {/* 4. National Soil & Fertility Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Fertility Practice Adoption */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Fertility Practice Adoption</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white tracking-tight">
              {ns ? `${ns.national_avg_inorganic_farmer_pct}%` : '—'}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">of farmers</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Mineral Treated Farmland:</span>
            <span className="font-semibold text-emerald-300">
              {ns ? `${ns.total_inorganic_fertilizer_ha.toLocaleString()} ha` : '—'}
              {ns?.inorganic_change_pct !== null && ns?.inorganic_change_pct !== undefined && (
                <span className={`ml-1 font-bold ${ns.inorganic_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ({ns.inorganic_change_pct >= 0 ? '+' : ''}{ns.inorganic_change_pct}%)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Card 2: Organic Fertility Inputs */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Organic Fertility Inputs</span>
            <Shovel className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white tracking-tight">
              {ns ? `${ns.national_avg_organic_farmer_pct}%` : '—'}
            </span>
            <span className="text-xs text-amber-400 font-semibold">of farmers</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Manure & Compost Area:</span>
            <span className="font-semibold text-amber-300">
              {ns ? `${ns.total_organic_fertilizer_ha.toLocaleString()} ha` : '—'}
              {ns?.organic_change_pct !== null && ns?.organic_change_pct !== undefined && (
                <span className={`ml-1 font-bold ${ns.organic_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ({ns.organic_change_pct >= 0 ? '+' : ''}{ns.organic_change_pct}%)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Card 3: Erosion-Control Adoption */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Erosion-Control Adoption</span>
            <Mountain className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white tracking-tight">
              {ns ? `${ns.national_erosion_control_pct}%` : '—'}
            </span>
            <span className="text-xs text-teal-400 font-semibold">of cultivated area</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Protected Land:</span>
            <span className="font-semibold text-teal-300">
              {ns ? `${ns.total_erosion_control_ha.toLocaleString()} ha` : '—'}
              {ns?.erosion_control_change_pct !== null && ns?.erosion_control_change_pct !== undefined && (
                <span className={`ml-1 font-bold ${ns.erosion_control_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ({ns.erosion_control_change_pct >= 0 ? '+' : ''}{ns.erosion_control_change_pct}%)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Card 4: District Data Coverage */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">District Data Coverage</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white tracking-tight">
              {ns ? `${ns.districts_reporting} / ${ns.districts_expected}` : '—'}
            </span>
            <span className="text-xs text-cyan-400 font-semibold">
              ({ns ? ns.data_coverage_pct : 100}%)
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Documented Projects:</span>
            <span className="font-semibold text-cyan-300">
              {ns ? `${ns.documented_projects_count} schemes (${ns.total_project_command_area_ha.toLocaleString()} ha)` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Central Interactive Workspace: MapLibre Map (65%) + District Profile (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (65%): MapLibre Map */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Rwanda Soil & Fertility Performance Map
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Active Indicator: <strong className="text-emerald-400">{indicatorConfig.label}</strong> ({indicatorConfig.unit}) · Season {selectedSeason}
              </p>
            </div>

            {/* Toggle Project Markers */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={showProjectMarkers}
                  onChange={(e) => setShowProjectMarkers(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-800"
                />
                <span>Documented Conservation Schemes ({projectsList.length})</span>
              </label>
              <button
                onClick={() => {
                  map.current?.fitBounds([
                    [28.86, -2.84],
                    [30.90, -1.05]
                  ], { padding: 25 });
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                title="Reset Map Extent"
              >
                Reset Zoom
              </button>
            </div>
          </div>

          {/* Map Container */}
          <div className="min-h-[580px] h-[580px] relative w-full overflow-hidden rounded-xl border border-slate-800 shadow-md bg-slate-950">
            <div 
              ref={mapContainer} 
              style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} 
            />

            {/* Floating Map Legend */}
            <div className="absolute bottom-4 right-4 z-10 p-3 rounded-lg bg-slate-950/92 border border-slate-800/90 backdrop-blur-md text-[11px] text-slate-300 shadow-lg max-w-xs space-y-1.5 pointer-events-auto">
              <div className="font-semibold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
                <span>Map Classification Ramp</span>
                <span className="text-[10px] text-slate-400 font-normal">{indicatorConfig.unit}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-xs" style={{ backgroundColor: activeRamp[4] }}></span>
                  <span>{extents.p75.toFixed(1)} – {extents.max.toFixed(1)} (Upper Quantile)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-xs" style={{ backgroundColor: activeRamp[3] }}></span>
                  <span>{extents.p50.toFixed(1)} – {extents.p75.toFixed(1)} (Moderate-High)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-xs" style={{ backgroundColor: activeRamp[2] }}></span>
                  <span>{extents.p25.toFixed(1)} – {extents.p50.toFixed(1)} (Median Range)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-xs" style={{ backgroundColor: activeRamp[1] }}></span>
                  <span>{extents.min.toFixed(1)} – {extents.p25.toFixed(1)} (Low Range)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-xs" style={{ backgroundColor: missingColor }}></span>
                  <span className="text-slate-400">Missing / Unreported District Record</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1">
                {indicatorConfig.isWarning ? (
                  <span className="text-rose-400 font-medium">⚠️ Warning: Higher values indicate elevated risk / deficit</span>
                ) : (
                  <span className="text-emerald-400 font-medium">✓ Favorable: Higher values indicate higher adoption / favorable status</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (35%): District Soil & Fertility Profile */}
        <div className="lg:col-span-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col h-[650px] overflow-hidden">
          {selectedDistrictData ? (
            <>
              {/* Profile Header */}
              <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      {selectedDistrictData.district_name}
                    </h3>
                    <div className="text-xs text-slate-400">
                      {selectedDistrictData.province_name} · Season {selectedSeason}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    selectedDistrictData.priority_tier === 'TIER_1_URGENT_INTERVENTION'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {selectedDistrictData.priority_tier.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Quick Indicators Bar */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center">
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Erosion Control</div>
                    <div className="text-xs font-bold text-teal-400">{selectedDistrictData.erosion_control_pct}%</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Mineral Fert.</div>
                    <div className="text-xs font-bold text-emerald-400">{selectedDistrictData.inorganic_farmer_pct}%</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Measured pH</div>
                    <div className="text-xs font-bold text-cyan-400">{selectedDistrictData.soil_ph.toFixed(1)}</div>
                  </div>
                </div>

                {/* Dossier Tabs */}
                <div className="flex border-b border-slate-800 space-x-1 mt-3 overflow-x-auto custom-scrollbar">
                  {[
                    { id: 'OVERVIEW', label: 'Overview' },
                    { id: 'FERTILITY', label: 'Fertility' },
                    { id: 'CONSERVATION', label: 'Conservation' },
                    { id: 'MEASURED_SOIL', label: 'Soil Test' },
                    { id: 'INTERVENTIONS', label: 'Action Plan' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setDistrictTab(tab.id as any)}
                      className={`px-2.5 py-1 text-[11px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
                        districtTab === tab.id
                          ? 'border-emerald-400 text-emerald-400 bg-slate-900'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile Body (Scrollable) */}
              <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs text-slate-300">
                {/* TAB 1: OVERVIEW */}
                {districtTab === 'OVERVIEW' && (
                  <div className="space-y-3.5">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                      <div className="font-semibold text-white flex items-center justify-between">
                        <span>Farmland & Adoption Footprint</span>
                        <span className="text-emerald-400">{selectedDistrictData.total_cultivated_ha.toLocaleString()} ha</span>
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Erosion Control Land:</span>
                          <span className="font-medium text-slate-200">
                            {selectedDistrictData.erosion_control_ha.toLocaleString()} ha ({selectedDistrictData.erosion_control_pct}%)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Agroforestry Tree Area:</span>
                          <span className="font-medium text-slate-200">
                            {selectedDistrictData.agroforestry_ha.toLocaleString()} ha ({selectedDistrictData.agroforestry_pct}%)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Organic Manure Farmers:</span>
                          <span className="font-medium text-slate-200">
                            {selectedDistrictData.organic_fertilizer_ha.toLocaleString()} ha ({selectedDistrictData.organic_farmer_pct}%)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Mineral Fertilizer Farmers:</span>
                          <span className="font-medium text-slate-200">
                            {selectedDistrictData.inorganic_fertilizer_ha.toLocaleString()} ha ({selectedDistrictData.inorganic_farmer_pct}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* National Comparison */}
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-[11px]">
                      <div className="font-semibold text-white">National Benchmark Comparison</div>
                      <div className="space-y-1.5">
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                            <span>Erosion Control Adoption</span>
                            <span>{selectedDistrictData.erosion_control_pct}% vs {ns?.national_erosion_control_pct || 76.8}% National</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(100, selectedDistrictData.erosion_control_pct)}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                            <span>Mineral Fertilizer Adoption</span>
                            <span>{selectedDistrictData.inorganic_farmer_pct}% vs {ns?.national_avg_inorganic_farmer_pct || 56.9}% National</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, selectedDistrictData.inorganic_farmer_pct)}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                            <span>Organic Input Adoption</span>
                            <span>{selectedDistrictData.organic_farmer_pct}% vs {ns?.national_avg_organic_farmer_pct || 81.6}% National</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, selectedDistrictData.organic_farmer_pct)}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Data Provenance & Citation */}
                    <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-[10px] text-emerald-300">
                      <strong>Audit Traceability:</strong> Derived from NISR Seasonal Agricultural Survey (SAS Table 8 & Table 22/23) and RAB laboratory soil testing database.
                    </div>
                  </div>
                )}

                {/* TAB 2: FERTILITY PRACTICES */}
                {districtTab === 'FERTILITY' && (
                  <div className="space-y-3.5">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                      <div className="font-semibold text-white">Fertilizer Type Formulations</div>
                      <p className="text-[11px] text-slate-400">
                        Breakdown of mineral fertilizer and lime applied in {selectedDistrictData.district_name}:
                      </p>
                      <div className="space-y-1.5 text-[11px] pt-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Urea (46% Nitrogen):</span>
                          <span className="font-bold text-cyan-400">{selectedDistrictData.fert_urea_pct}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">DAP (18-46-0 Basal):</span>
                          <span className="font-bold text-emerald-400">{selectedDistrictData.fert_dap_pct}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">NPK (17-17-17 Compound):</span>
                          <span className="font-bold text-teal-400">{selectedDistrictData.fert_npk_pct}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Agricultural Calcic Lime:</span>
                          <span className="font-bold text-amber-400">{selectedDistrictData.fert_lime_pct}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Other Micronutrients:</span>
                          <span className="font-bold text-slate-300">{selectedDistrictData.fert_other_pct}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-[11px]">
                      <div className="font-semibold text-white">Integrated Soil Fertility Management (ISFM)</div>
                      <p className="text-slate-300 leading-relaxed">
                        Smallholder plots combining organic manure ({selectedDistrictData.organic_plot_pct}% of plots) with mineral basal dressing ({selectedDistrictData.inorganic_plot_pct}% of plots) achieve higher crop resilience and nitrogen use efficiency.
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 3: CONSERVATION & EROSION */}
                {districtTab === 'CONSERVATION' && (
                  <div className="space-y-3.5">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-[11px]">
                      <div className="font-semibold text-white">Terrain Slope & Erosion Hazard</div>
                      <div className="grid grid-cols-2 gap-2 text-center pt-1">
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <div className="text-[10px] text-slate-400">Steep Slopes (&gt;25%)</div>
                          <div className="text-sm font-bold text-rose-400">{selectedDistrictData.slope_steep_pct}%</div>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <div className="text-[10px] text-slate-400">Severe Erosion Plots</div>
                          <div className="text-sm font-bold text-amber-400">{selectedDistrictData.degree_severe_pct}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-[11px]">
                      <div className="font-semibold text-white">Physical Terracing Need Gap</div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Radical Bench Terraces Needed:</span>
                        <span className="font-bold text-rose-400">{selectedDistrictData.radical_terracing_gap_ha.toLocaleString()} ha</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">General Conservation Gap:</span>
                        <span className="font-bold text-amber-400">{selectedDistrictData.conservation_gap_ha.toLocaleString()} ha</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Modelled Susceptibility Index:</span>
                        <span className="font-bold text-slate-200">{selectedDistrictData.modelled_erosion_susceptibility_index} / 100</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: MEASURED SOIL TEST */}
                {districtTab === 'MEASURED_SOIL' && (
                  <div className="space-y-3.5">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-[11px]">
                      <div className="font-semibold text-white flex items-center justify-between">
                        <span>Laboratory Soil Reactions</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          selectedDistrictData.soil_ph < 5.5 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {selectedDistrictData.acidity_status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Measured Soil pH (H2O):</span>
                          <span className="font-bold text-white">{selectedDistrictData.soil_ph.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Lime Requirement (Calcic):</span>
                          <span className="font-bold text-cyan-400">{selectedDistrictData.lime_requirement_tons_per_ha} tons / ha</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Soil Organic Carbon (SOC):</span>
                          <span className="font-bold text-amber-400">{selectedDistrictData.organic_carbon_pct}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Cation Exchange Capacity:</span>
                          <span className="font-bold text-teal-400">{selectedDistrictData.cation_exchange_capacity_meq} meq/100g</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Dominant Soil Texture:</span>
                          <span className="font-bold text-slate-300">{selectedDistrictData.soil_texture}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-[11px]">
                      <div className="font-semibold text-white">Macronutrient Ratings (RAB Baseline)</div>
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                          <div className="text-[10px] text-slate-400">Nitrogen (N)</div>
                          <div className="text-xs font-semibold text-slate-200">{selectedDistrictData.nitrogen_rating}</div>
                        </div>
                        <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                          <div className="text-[10px] text-slate-400">Phosphorus (P)</div>
                          <div className="text-xs font-semibold text-rose-400">{selectedDistrictData.phosphorus_rating}</div>
                        </div>
                        <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                          <div className="text-[10px] text-slate-400">Potassium (K)</div>
                          <div className="text-xs font-semibold text-emerald-400">{selectedDistrictData.potassium_rating}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: ACTION PLAN & INTERVENTIONS */}
                {districtTab === 'INTERVENTIONS' && (
                  <div className="space-y-3.5">
                    {/* Matching Documented Project */}
                    {selectedDistrictData.matching_projects && selectedDistrictData.matching_projects.length > 0 ? (
                      <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-2 text-[11px]">
                        <div className="font-semibold text-emerald-300 flex items-center justify-between">
                          <span>Documented Conservation Scheme</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                            {selectedDistrictData.matching_projects[0].status}
                          </span>
                        </div>
                        <div className="font-bold text-white text-xs">{selectedDistrictData.matching_projects[0].name}</div>
                        <div className="text-slate-300 text-[10px]">
                          Command Area: <strong>{Number(selectedDistrictData.matching_projects[0].command_area_ha).toLocaleString()} ha</strong> · Beneficiaries: <strong>{Number(selectedDistrictData.matching_projects[0].beneficiary_farmers).toLocaleString()} farmers</strong>
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          Funding: {selectedDistrictData.matching_projects[0].funding_source}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                        No major external funded watershed scheme currently documented in this district.
                      </div>
                    )}

                    {/* Pre-Feasibility Checklist */}
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-[11px]">
                      <div className="font-semibold text-white">Pre-Feasibility Action Checklist</div>
                      <div className="space-y-1.5">
                        <div className="p-2 rounded bg-slate-900 border border-slate-800/80 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-slate-200">Soil Core Acidity Validation</div>
                            <div className="text-[10px] text-slate-400">Confirm buffer pH and aluminum saturation across target sectors before liming.</div>
                          </div>
                        </div>

                        <div className="p-2 rounded bg-slate-900 border border-slate-800/80 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-slate-200">Micro-Catchment Contour Survey</div>
                            <div className="text-[10px] text-slate-400">Survey slope gradient and waterways for radical bench terrace stone risers.</div>
                          </div>
                        </div>

                        <div className="p-2 rounded bg-slate-900 border border-slate-800/80 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-slate-200">Smart Nkunganire Subsidy Link</div>
                            <div className="text-[10px] text-slate-400">Facilitate subsidized travertine delivery to registered farming cooperatives.</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/20 text-[10px] text-amber-300 italic">
                      Institutional Disclaimer: Flagged strictly as a Potential Area for Assessment. Does not constitute an automatic engineering prescription.
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs my-auto">
              Select a district on the map or ranking table to view its detailed soil intelligence profile.
            </div>
          )}
        </div>
      </div>

      {/* 6. Analytical Section A: Fertility-Management Adoption: Modern, Traditional & Integrated Practices */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-400" />
              Fertility-Management Adoption: Modern, Traditional & Integrated Practices
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare reported mineral fertilizer, organic manure, and soil amendment adoption across seasons and districts.
            </p>
          </div>
          <div className="text-[11px] text-slate-400 italic">
            *Categories overlap: farmers commonly integrate both mineral inputs and organic manure on the same plots.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Chart 1: Practice Type Adoption Comparison */}
          <div className="lg:col-span-7 h-72">
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span>National Practice Adoption Comparison (% of Farmers)</span>
              <span className="text-[10px] text-emerald-400">Season {selectedSeason}</span>
            </div>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={[
                  { practice: 'Organic Manure / Residues', adoptionPct: ns?.national_avg_organic_farmer_pct || 81.6, fill: '#F59E0B' },
                  { practice: 'Erosion Prevention Bunds', adoptionPct: ns?.national_erosion_control_pct || 76.8, fill: '#059669' },
                  { practice: 'Mineral / Inorganic Fert.', adoptionPct: ns?.national_avg_inorganic_farmer_pct || 56.9, fill: '#0284C7' },
                  { practice: 'Agroforestry Tree Cover', adoptionPct: 55.9, fill: '#10B981' },
                ]}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="practice" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(val: any) => [`${val}%`, 'Adoption Rate']}
                />
                <Bar dataKey="adoptionPct" radius={[4, 4, 0, 0]}>
                  {
                    [
                      { fill: '#F59E0B' },
                      { fill: '#059669' },
                      { fill: '#0284C7' },
                      { fill: '#10B981' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Fertilizer Formulation Breakdown */}
          <div className="lg:col-span-5 h-72 flex flex-col justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Mineral Fertilizer Formulation Shares</span>
                <span className="text-[10px] text-cyan-400">MINAGRI SAS</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                National distribution share of chemical fertilizers and agricultural lime:
              </p>
            </div>

            <div className="space-y-2.5 my-auto text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Urea 46% N (Top Dressing)</span>
                  <span className="text-cyan-400 font-bold">{ns?.fert_breakdown?.urea || 39.1}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${ns?.fert_breakdown?.urea || 39.1}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>DAP 18-46-0 (Basal Rooting)</span>
                  <span className="text-emerald-400 font-bold">{ns?.fert_breakdown?.dap || 36.5}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${ns?.fert_breakdown?.dap || 36.5}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>NPK 17-17-17 (Balanced Compound)</span>
                  <span className="text-teal-400 font-bold">{ns?.fert_breakdown?.npk || 21.1}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${ns?.fert_breakdown?.npk || 21.1}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Agricultural Calcic Lime</span>
                  <span className="text-amber-400 font-bold">{ns?.fert_breakdown?.lime || 2.0}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(ns?.fert_breakdown?.lime || 2.0) * 10}%` }}></div>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-2">
              Note: Lime application is expanding under the National Acid Soil Neutralization Subsidy.
            </div>
          </div>
        </div>
      </div>

      {/* 7. Analytical Section B: Seasonal Soil Management Trends */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Seasonal Soil Health & Conservation Trends (2014A – 2026C)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Long-term national trajectory across 38 chronological agricultural seasons.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
              <span>Erosion Control %</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>Organic Manure %</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span>Mineral Fert %</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={seasonalTrends} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="erosionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="organicGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="inorganicGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284C7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="season_code" stroke="#94A3B8" tick={{ fontSize: 10 }} interval={3} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
              <RechartsTooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                formatter={(val: any, name: any) => [`${val}%`, name]}
              />
              <Area type="monotone" dataKey="erosion_control_pct" name="Erosion Control" stroke="#14B8A6" strokeWidth={2} fillOpacity={1} fill="url(#erosionGrad)" />
              <Area type="monotone" dataKey="organic_farmer_pct" name="Organic Manure" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#organicGrad)" />
              <Area type="monotone" dataKey="inorganic_farmer_pct" name="Mineral Fertilizer" stroke="#0284C7" strokeWidth={2} fillOpacity={1} fill="url(#inorganicGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Dynamic Shift Alert Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2">
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4" />
              <span>High Adoption Expansion Zone</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Districts with &gt;10% increase in erosion control adoption: Bugesera, Kayonza, Nyagatare (scale up of contour bunds & agroforestry).
            </p>
          </div>

          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30">
            <div className="font-bold text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Critical Soil Acidity Hotspots</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              High altitude volcanic/laterite zones with pH &lt; 5.2 requiring urgent lime distribution: Nyaruguru, Nyamagabe, Rutsiro.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/30">
            <div className="font-bold text-cyan-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Stabilized Conservation Corridors</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Consolidated radical bench terracing perimeters maintaining &gt;85% soil coverage: Gicumbi, Gakenke, Rulindo.
            </p>
          </div>
        </div>
      </div>

      {/* 8. District Soil & Fertility Performance Ranking Table */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              District Soil & Fertility League Table ({filteredRankingDistricts.length} Districts)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Search, sort, filter, and inspect verified district-level soil indicators for Season {selectedSeason}.
            </p>
          </div>

          {/* Table Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchDistrict}
                onChange={(e) => setSearchDistrict(e.target.value)}
                placeholder="Search district or province..."
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-56"
              />
            </div>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: 'ALL', label: 'All Districts' },
            { id: 'HIGH_FERTILITY', label: 'Top Mineral Fert.' },
            { id: 'HIGH_ORGANIC', label: 'Top Organic Inputs' },
            { id: 'HIGH_CONSERVATION', label: 'Top Erosion Control' },
            { id: 'CRITICAL_ACIDITY', label: 'Acid Soil (pH < 5.5)' },
            { id: 'SEVERE_EROSION', label: 'Severe Erosion Hotspots' },
            { id: 'TIER_1_PRIORITY', label: 'Tier 1 Urgent Interventions' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setRankingFilter(pill.id as any)}
              className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                rankingFilter === pill.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Interactive League Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Rank</th>
                <th className="py-2.5 px-3 font-semibold">District</th>
                <th className="py-2.5 px-3 font-semibold">Province</th>
                <th className="py-2.5 px-3 font-semibold">Erosion Control (%)</th>
                <th className="py-2.5 px-3 font-semibold">Organic (%)</th>
                <th className="py-2.5 px-3 font-semibold">Mineral Fert (%)</th>
                <th className="py-2.5 px-3 font-semibold">Measured pH</th>
                <th className="py-2.5 px-3 font-semibold">Lime Need (t/ha)</th>
                <th className="py-2.5 px-3 font-semibold">Priority Score</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredRankingDistricts.map((d, idx) => (
                <tr 
                  key={d.id} 
                  className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${
                    selectedDistrictName.toLowerCase() === d.district_name.toLowerCase() ? 'bg-emerald-950/30 border-l-4 border-emerald-500' : ''
                  }`}
                  onClick={() => focusDistrictOnMap(d.district_name)}
                >
                  <td className="py-2 px-3 font-mono text-slate-400">#{idx + 1}</td>
                  <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5">
                    <span>{d.district_name}</span>
                    {d.priority_tier === 'TIER_1_URGENT_INTERVENTION' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" title="Tier 1 Priority"></span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-400">{d.province_name}</td>
                  <td className="py-2 px-3 font-semibold text-teal-400">{d.erosion_control_pct}%</td>
                  <td className="py-2 px-3 font-semibold text-amber-400">{d.organic_farmer_pct}%</td>
                  <td className="py-2 px-3 font-semibold text-cyan-400">{d.inorganic_farmer_pct}%</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      d.soil_ph < 5.2 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      d.soil_ph < 5.6 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {d.soil_ph.toFixed(2)} pH
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-300 font-mono">
                    {d.lime_requirement_tons_per_ha > 0 ? `${d.lime_requirement_tons_per_ha} t/ha` : '0 t/ha'}
                  </td>
                  <td className="py-2 px-3">
                    <span className="font-bold text-white">{d.priority_score.toFixed(1)}</span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        focusDistrictOnMap(d.district_name);
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-semibold transition-colors"
                    >
                      Inspect Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 9. National Documented Soil Conservation Projects Directory */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Mountain className="w-5 h-5 text-emerald-400" />
              National Soil Conservation & Catchment Projects Directory ({projectsList.length} Verified Schemes)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Official watershed rehabilitation, radical terracing, and lime programs documented by MINAGRI, RAB, FONERWA, and climate funds.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {ns ? `${ns.total_project_command_area_ha.toLocaleString()} ha Command Area` : '47,500 ha'}
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Project Name & Code</th>
                <th className="py-2.5 px-3 font-semibold">District</th>
                <th className="py-2.5 px-3 font-semibold">Technology Type</th>
                <th className="py-2.5 px-3 font-semibold">Command (Ha)</th>
                <th className="py-2.5 px-3 font-semibold">Beneficiary Smallholders</th>
                <th className="py-2.5 px-3 font-semibold">Funding Source</th>
                <th className="py-2.5 px-3 font-semibold">Operational Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Map Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {projectsList.map((p) => (
                <tr key={p.code} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-3 font-medium text-white">
                    <div>{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{p.code}</div>
                  </td>
                  <td className="py-2 px-3 font-bold text-slate-200">{p.district_name}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      p.project_type === 'RADICAL_TERRACING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      p.project_type === 'LIME_APPLICATION' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {p.project_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono font-semibold text-slate-200">
                    {Number(p.command_area_ha).toLocaleString()} ha
                  </td>
                  <td className="py-2 px-3 text-slate-300">
                    {Number(p.beneficiary_farmers).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-slate-400">{p.funding_source}</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => focusDistrictOnMap(p.district_name)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-semibold transition-colors"
                    >
                      Focus on Map
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 10. Soil Management Intervention Priorities (Evidence-Based Pre-Screening) */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        <div className="border-b border-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Soil Management Intervention Priorities (Pre-Feasibility Decision Support)
            </h3>
            <span className="text-[11px] text-amber-300 font-semibold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
              Screening Framework — Not an Automatic Prescription
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Evidence-based pre-screening to prioritize micro-catchment field assessment, soil sampling, and lime distribution.
          </p>
        </div>

        {/* Screening Criteria Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {interventionScreening?.criteriaWeights?.map((c: any) => (
            <div key={c.criterion} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex justify-between font-bold text-slate-200">
                <span>{c.criterion}</span>
                <span className="text-emerald-400">{c.weightPercent}%</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                {c.description}
              </p>
            </div>
          ))}
        </div>

        {/* Candidate Districts Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {interventionScreening?.candidateDistricts?.map((cd: any) => (
            <div key={cd.district_name} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{cd.district_name}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Score: {cd.priority_score.toFixed(1)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">{cd.province_name}</div>

                <div className="mt-2.5 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-300">Screening Flags:</div>
                  {cd.screening_flags.map((f: string, i: number) => (
                    <div key={i} className="p-1.5 rounded bg-rose-950/20 border border-rose-500/20 text-[10px] text-rose-300 flex items-start gap-1">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="text-[10px] text-slate-400 leading-tight">
                  <strong>Missing Evidence:</strong> {cd.missing_evidence_note}
                </div>
                <button
                  onClick={() => focusDistrictOnMap(cd.district_name)}
                  className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Open Pre-Feasibility Dossier</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
