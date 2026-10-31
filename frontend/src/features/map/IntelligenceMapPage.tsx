import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Sprout, Droplets, Layers, Warehouse, Globe, ShieldAlert,
  Search, RefreshCw, X, ChevronRight, CheckCircle2, AlertTriangle,
  Info, TrendingUp, TrendingDown, ArrowRight, ExternalLink,
  Building2, MapPin, SlidersHorizontal, HelpCircle, Eye, EyeOff,
  Filter, Calendar, ChevronDown, Compass, Award, BarChart3
} from 'lucide-react';
import { apiUrl } from '../../config/api';

// Types for the 6 Intelligence Layers
export type IntelligenceLayerId = 
  | 'PRODUCTIVITY' 
  | 'IRRIGATION' 
  | 'SOIL' 
  | 'POST_HARVEST' 
  | 'EXPORTS' 
  | 'PRIORITY';

export interface DistrictData {
  name: string;
  code: string;
  province: string;
  longitude: number;
  latitude: number;
  cropProductivity: {
    production_tonnes: number;
    cultivated_area_ha: number;
    harvested_area_ha: number;
    avg_yield_t_ha: number;
    dominant_crops: Array<{
      crop_name: string;
      production_tonnes: number;
      area_ha: number;
      yield_t_ha: number;
      share_pct: number;
    }>;
    prev_production_tonnes: number;
    production_change_pct: number;
    productivity_rank: number;
    performance_status: 'HIGH_PRODUCING' | 'AVERAGE' | 'LOW_PRODUCING';
    trend_status: 'GROWING' | 'STABLE' | 'DECLINING';
  };
  irrigation: {
    modern_irrigated_ha: number;
    traditional_irrigated_ha: number;
    total_irrigated_ha: number;
    total_cultivated_ha: number;
    irrigation_access_pct: number;
    irrigation_gap_ha: number;
    water_deficit_mm: number;
    drought_vulnerability_index: number;
    opportunity_score: number;
    feasibility_tier: string;
    registered_schemes_count: number;
    recommended_technology: string;
  };
  soilConservation: {
    soil_ph: number;
    acidity_status: string;
    erosion_control_ha: number;
    erosion_control_pct: number;
    organic_fertilizer_ha: number;
    inorganic_fertilizer_ha: number;
    organic_carbon_pct: number;
    modelled_erosion_susceptibility: number;
    radical_terracing_gap_ha: number;
    lime_requirement_tons_per_ha: number;
    priority_tier: string;
    recommended_interventions: string[];
  };
  postHarvest: {
    total_crop_production_mt: number;
    market_surplus_volume_mt: number;
    documented_storage_capacity_mt: number;
    storage_capacity_gap_mt: number;
    storage_utilization_pct: number;
    capacity_status: string;
    facilities_count: number;
    investment_opportunity_score: number;
    investment_tier: string;
    bottleneck_warning: string;
  };
  marketExports: {
    primary_export_crops: string[];
    estimated_exportable_volume_mt: number;
    export_readiness_score: number;
    export_tier: string;
    nearest_exit_hub: string;
    distance_to_exit_km: number;
    cooperatives_count: number;
    quality_cert_pct: number;
  };
  priorityAssessment: {
    composite_score: number;
    priority_rank: number;
    priority_level: 'CRITICAL PRIORITY' | 'HIGH PRIORITY' | 'MEDIUM PRIORITY' | 'MONITORING';
    overlapping_challenges_count: number;
    overlapping_challenges: string[];
    potential_explanation: string;
    suggested_actions: string[];
    confidence_score: number;
    evidence_breakdown: {
      observed_data: string[];
      derived_estimates: string[];
      recommendations: string[];
      missing_data_warnings: string[];
    };
  };
}

export interface FacilityMarker {
  id: string;
  name: string;
  district_name: string;
  province_name: string;
  facility_type: string;
  status: string;
  operator_name: string;
  storage_capacity_tonnes: number;
  cold_storage_capacity_tonnes: number;
  drying_capacity_tonnes_day: number;
  processing_capacity_tonnes_day: number;
  longitude: number;
  latitude: number;
  year_established?: number;
}

export interface IrrigationAssetMarker {
  id: string;
  name: string;
  district_name: string;
  province_name: string;
  irrigation_type: string;
  status: string;
  water_source: string;
  irrigation_method: string;
  area_command_ha: number;
  area_irrigable_ha: number;
  beneficiaries_count: number;
  operator_name: string;
  longitude: number;
  latitude: number;
}

// Indicator metadata
interface IndicatorConfig {
  id: string;
  label: string;
  unit: string;
  getValue: (d: DistrictData) => number;
  format: (v: number) => string;
  colorType: 'green' | 'risk' | 'soil_ph' | 'trend';
  description: string;
}

export default function IntelligenceMapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);

  // Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [season, setSeason] = useState<string>('2026B');
  const [compareSeason, setCompareSeason] = useState<string>('2025B');
  const [availableSeasons, setAvailableSeasons] = useState<Array<{ code: string; label: string }>>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [facilities, setFacilities] = useState<FacilityMarker[]>([]);
  const [irrigationAssets, setIrrigationAssets] = useState<IrrigationAssetMarker[]>([]);
  const [nationalSummary, setNationalSummary] = useState<any>(null);

  // Selection & Filter States
  const [activeLayer, setActiveLayer] = useState<IntelligenceLayerId>('PRODUCTIVITY');
  const [activeIndicatorId, setActiveIndicatorId] = useState<string>('production_tonnes');
  const [selectedProvince, setSelectedProvince] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string | null>(null);
  const [dossierTab, setDossierTab] = useState<'OVERVIEW' | 'CROPS' | 'WATER' | 'SOIL' | 'POST_HARVEST' | 'TRADE' | 'PRIORITY'>('OVERVIEW');
  const [basemapStyle, setBasemapStyle] = useState<'positron' | 'satellite' | 'streets'>('positron');

  // Infrastructure Layer Toggles
  const [showWarehouses, setShowWarehouses] = useState<boolean>(true);
  const [showColdStorage, setShowColdStorage] = useState<boolean>(true);
  const [showProcessing, setShowProcessing] = useState<boolean>(true);
  const [showIrrigationAssets, setShowIrrigationAssets] = useState<boolean>(true);

  // Layer Definitions & Planning Questions
  const layerConfigs: Record<IntelligenceLayerId, {
    title: string;
    shortTitle: string;
    icon: any;
    badge: string;
    planningQuestion: string;
    safeguardNotice?: string;
    indicators: IndicatorConfig[];
  }> = {
    PRODUCTIVITY: {
      title: '1. Crop Productivity Intelligence',
      shortTitle: 'Crop Productivity',
      icon: Sprout,
      badge: 'NISR SAS Table 1-5',
      planningQuestion: 'Which districts produce the most, and which are experiencing declining productivity?',
      indicators: [
        {
          id: 'production_tonnes',
          label: 'Total Crop Production',
          unit: 'Tonnes',
          getValue: (d) => d.cropProductivity.production_tonnes,
          format: (v) => `${v.toLocaleString()} MT`,
          colorType: 'green',
          description: 'Gross seasonal crop output surveyed across agricultural households and large holdings.',
        },
        {
          id: 'avg_yield_t_ha',
          label: 'Average Crop Yield',
          unit: 't/ha',
          getValue: (d) => d.cropProductivity.avg_yield_t_ha,
          format: (v) => `${v.toFixed(2)} t/ha`,
          colorType: 'green',
          description: 'Weighted crop output per harvested hectare across all monitored staple and cash crops.',
        },
        {
          id: 'cultivated_area_ha',
          label: 'Cultivated Area',
          unit: 'Hectares',
          getValue: (d) => d.cropProductivity.cultivated_area_ha,
          format: (v) => `${v.toLocaleString()} ha`,
          colorType: 'green',
          description: 'Physical land area under cultivation during the selected seasonal agricultural cycle.',
        },
        {
          id: 'production_change_pct',
          label: 'Seasonal Production Delta',
          unit: '%',
          getValue: (d) => d.cropProductivity.production_change_pct,
          format: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`,
          colorType: 'trend',
          description: 'Percentage increase or decrease relative to the previous comparable monitored season.',
        },
      ],
    },
    IRRIGATION: {
      title: '2. Irrigation Intelligence',
      shortTitle: 'Irrigation & Water',
      icon: Droplets,
      badge: 'Water & Irrigation Assets',
      planningQuestion: 'Where should planners investigate opportunities to improve water access and reduce dependence on rainfall?',
      safeguardNotice: 'Notice: Do not label an area as irrigation-suitable without supporting water, terrain, and feasibility data.',
      indicators: [
        {
          id: 'irrigation_access_pct',
          label: 'Irrigation Coverage',
          unit: '% of Cultivated Area',
          getValue: (d) => d.irrigation.irrigation_access_pct,
          format: (v) => `${v.toFixed(1)}%`,
          colorType: 'green',
          description: 'Reported share of cultivated agricultural area equipped with modern or traditional water access.',
        },
        {
          id: 'modern_irrigated_ha',
          label: 'Modern Irrigated Area',
          unit: 'Hectares',
          getValue: (d) => d.irrigation.modern_irrigated_ha,
          format: (v) => `${v.toLocaleString()} ha`,
          colorType: 'green',
          description: 'Area irrigated using formal command schemes, solar pumps, center-pivots, or micro-drip.',
        },
        {
          id: 'irrigation_gap_ha',
          label: 'Rainfed Cultivation Gap',
          unit: 'Hectares',
          getValue: (d) => d.irrigation.irrigation_gap_ha,
          format: (v) => `${v.toLocaleString()} ha`,
          colorType: 'risk',
          description: 'Cultivated agricultural area currently completely reliant on rainfall precipitation.',
        },
        {
          id: 'opportunity_score',
          label: 'Irrigation Opportunity Score',
          unit: 'Score / 100',
          getValue: (d) => d.irrigation.opportunity_score,
          format: (v) => `${v.toFixed(1)} / 100`,
          colorType: 'green',
          description: 'Screening index combining water deficit, slope suitability, water body distance, and crop value.',
        },
      ],
    },
    SOIL: {
      title: '3. Soil Fertility & Conservation Intelligence',
      shortTitle: 'Soil & Fertility',
      icon: Layers,
      badge: 'Soil Health & USLE',
      planningQuestion: 'Where could soil conservation and fertility management deserve greater attention?',
      safeguardNotice: 'Notice: Measured soil observations (pH, carbon) are kept distinct from survey-reported farming practices.',
      indicators: [
        {
          id: 'soil_ph',
          label: 'Measured Soil pH',
          unit: 'pH Scale',
          getValue: (d) => d.soilConservation.soil_ph,
          format: (v) => `pH ${v.toFixed(2)}`,
          colorType: 'soil_ph',
          description: 'Laboratory-measured soil reaction. Values below 5.2 denote critical aluminum toxicity and acidity.',
        },
        {
          id: 'erosion_control_pct',
          label: 'Anti-Erosion Adoption',
          unit: '% of Area',
          getValue: (d) => d.soilConservation.erosion_control_pct,
          format: (v) => `${v.toFixed(1)}%`,
          colorType: 'green',
          description: 'Share of agricultural land protected by progressive terracing, radical terraces, or agroforestry.',
        },
        {
          id: 'radical_terracing_gap_ha',
          label: 'Radical Terracing Gap',
          unit: 'Hectares',
          getValue: (d) => d.soilConservation.radical_terracing_gap_ha,
          format: (v) => `${v.toLocaleString()} ha`,
          colorType: 'risk',
          description: 'Steep-slope arable land requiring radical mechanical terracing to curb topsoil runoff.',
        },
        {
          id: 'modelled_erosion_susceptibility',
          label: 'USLE Erosion Risk Index',
          unit: 'Index / 100',
          getValue: (d) => d.soilConservation.modelled_erosion_susceptibility,
          format: (v) => `${v.toFixed(1)} / 100`,
          colorType: 'risk',
          description: 'Universal Soil Loss Equation model accounting for slope length, rainfall erosivity, and soil erodibility.',
        },
      ],
    },
    POST_HARVEST: {
      title: '4. Post-Harvest & Storage Intelligence',
      shortTitle: 'Post-Harvest & Storage',
      icon: Warehouse,
      badge: '97 Strategic Warehouses & Silos',
      planningQuestion: 'Where might production volumes and documented storage capacity indicate a potential post-harvest bottleneck?',
      safeguardNotice: 'Notice: Do not infer a storage deficit from production alone; capacity and loss data are needed to substantiate it.',
      indicators: [
        {
          id: 'documented_storage_capacity_mt',
          label: 'Documented Storage Capacity',
          unit: 'MT',
          getValue: (d) => d.postHarvest.documented_storage_capacity_mt,
          format: (v) => `${v.toLocaleString()} MT`,
          colorType: 'green',
          description: 'Total certified warehouse, strategic grain silo, and cooperative store capacity in metric tonnes.',
        },
        {
          id: 'storage_capacity_gap_mt',
          label: 'Storage Deficit vs Surplus',
          unit: 'MT Deficit',
          getValue: (d) => d.postHarvest.storage_capacity_gap_mt,
          format: (v) => `${v.toLocaleString()} MT`,
          colorType: 'risk',
          description: 'Market surplus volume exceeding verified local institutional and cooperative storage space.',
        },
        {
          id: 'storage_utilization_pct',
          label: 'Capacity Utilization',
          unit: '%',
          getValue: (d) => d.postHarvest.storage_utilization_pct,
          format: (v) => `${v.toFixed(1)}%`,
          colorType: 'green',
          description: 'Ratio of stored commercial harvest volume against available warehouse holding volume.',
        },
        {
          id: 'facilities_count',
          label: 'Registered Facilities',
          unit: 'Units',
          getValue: (d) => d.postHarvest.facilities_count,
          format: (v) => `${v} Facilities`,
          colorType: 'green',
          description: 'Count of verified commercial silos, collection centers, cold storage, and processing mills.',
        },
      ],
    },
    EXPORTS: {
      title: '5. Market & Export Opportunity Intelligence',
      shortTitle: 'Market & Exports',
      icon: Globe,
      badge: 'NAEB & Regional Trade',
      planningQuestion: 'Where could agricultural production, processing capacity, and export demand align to create an investment opportunity?',
      indicators: [
        {
          id: 'export_readiness_score',
          label: 'Export Readiness Index',
          unit: 'Score / 100',
          getValue: (d) => d.marketExports.export_readiness_score,
          format: (v) => `${v.toFixed(1)} / 100`,
          colorType: 'green',
          description: 'Index rating cooperative certification, exportable staple/cash crop volumes, and logistic access.',
        },
        {
          id: 'estimated_exportable_volume_mt',
          label: 'Exportable Surplus Volume',
          unit: 'MT',
          getValue: (d) => d.marketExports.estimated_exportable_volume_mt,
          format: (v) => `${v.toLocaleString()} MT`,
          colorType: 'green',
          description: 'Estimated marketable volume of target export crops (Coffee, Tea, Avocado, French Beans, Chili).',
        },
        {
          id: 'distance_to_exit_km',
          label: 'Distance to Exit Hub',
          unit: 'Kilometers',
          getValue: (d) => d.marketExports.distance_to_exit_km,
          format: (v) => `${v.toFixed(0)} km`,
          colorType: 'risk',
          description: 'Transit distance to Kigali International Airport, Gatuna, Rusumo, or Rubavu border logistics nodes.',
        },
        {
          id: 'cooperatives_count',
          label: 'Export-Ready Cooperatives',
          unit: 'Cooperatives',
          getValue: (d) => d.marketExports.cooperatives_count,
          format: (v) => `${v} Coops`,
          colorType: 'green',
          description: 'Registered farmer cooperatives possessing export aggregation and quality management certificates.',
        },
      ],
    },
    PRIORITY: {
      title: '6. Agricultural Intervention Priority Map',
      shortTitle: 'Priority Finder',
      icon: ShieldAlert,
      badge: 'Evidence-Backed Multi-Pillar Index',
      planningQuestion: 'Given the available evidence, where should government investigate and prioritize its next agricultural interventions?',
      indicators: [
        {
          id: 'composite_score',
          label: 'Composite Intervention Priority Score',
          unit: 'Score / 100',
          getValue: (d) => d.priorityAssessment.composite_score,
          format: (v) => `${v} / 100`,
          colorType: 'risk',
          description: 'Multi-criteria composite score identifying overlapping challenges in production, irrigation, soil, and storage.',
        },
        {
          id: 'overlapping_challenges_count',
          label: 'Overlapping Challenges Count',
          unit: 'Constraints',
          getValue: (d) => d.priorityAssessment.overlapping_challenges_count,
          format: (v) => `${v} Challenges`,
          colorType: 'risk',
          description: 'Number of simultaneous acute constraints detected (e.g. declining yield + low irrigation + high acidity).',
        },
        {
          id: 'priority_rank',
          label: 'National Priority Rank',
          unit: 'Rank (1-30)',
          getValue: (d) => d.priorityAssessment.priority_rank,
          format: (v) => `#${v} of 30`,
          colorType: 'risk',
          description: 'Rank 1 represents the district with the most urgent multi-dimensional agricultural intervention need.',
        },
      ],
    },
  };

  const activeConfig = layerConfigs[activeLayer];
  const activeIndicator = activeConfig.indicators.find(i => i.id === activeIndicatorId) || activeConfig.indicators[0];

  // Selected district object
  const selectedDistrict = useMemo(() => {
    if (!selectedDistrictName) return null;
    return districts.find(d => d.name.toLowerCase() === selectedDistrictName.toLowerCase()) || null;
  }, [districts, selectedDistrictName]);

  // Filtered districts list
  const filteredDistricts = useMemo(() => {
    return districts.filter(d => {
      const matchProv = selectedProvince === 'ALL' || d.province.toLowerCase() === selectedProvince.toLowerCase();
      const matchSearch = searchQuery.trim() === '' || 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.cropProductivity.dominant_crops.some(c => c.crop_name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchProv && matchSearch;
    });
  }, [districts, selectedProvince, searchQuery]);

  // Indicator Min/Max for dynamic color ramp
  const indicatorExtents = useMemo(() => {
    if (districts.length === 0) return { min: 0, max: 100, p25: 25, p50: 50, p75: 75 };
    const values = districts.map(d => activeIndicator.getValue(d)).filter(v => typeof v === 'number' && !isNaN(v));
    if (values.length === 0) return { min: 0, max: 100, p25: 25, p50: 50, p75: 75 };
    
    values.sort((a, b) => a - b);
    const min = values[0];
    const max = values[values.length - 1];
    const p25 = values[Math.floor(values.length * 0.25)] ?? min;
    const p50 = values[Math.floor(values.length * 0.50)] ?? (min + max) / 2;
    const p75 = values[Math.floor(values.length * 0.75)] ?? max;
    return { min, max, p25, p50, p75 };
  }, [districts, activeIndicator]);

  // Color Ramps
  const colorRamps = {
    green: ['#ECFDF5', '#A7F3D0', '#34D399', '#059669', '#064E3B'],
    risk: ['#FEF3C7', '#FDE68A', '#F59E0B', '#EF4444', '#991B1B'],
    soil_ph: ['#DC2626', '#F59E0B', '#10B981', '#059669', '#2563EB'],
    trend: ['#DC2626', '#F87171', '#E2E8F0', '#34D399', '#059669'],
  };

  const getDistrictColor = (d: DistrictData): string => {
    const val = activeIndicator.getValue(d);
    const { min, max, p25, p50, p75 } = indicatorExtents;
    const ramp = colorRamps[activeIndicator.colorType];

    if (activeIndicator.colorType === 'soil_ph') {
      if (val < 4.8) return ramp[0]; // severe acidity
      if (val < 5.3) return ramp[1]; // moderate acidity
      if (val < 6.5) return ramp[2]; // good
      if (val < 7.2) return ramp[3]; // optimal
      return ramp[4]; // alkaline
    }

    if (activeIndicator.colorType === 'trend') {
      if (val < -5.0) return ramp[0];
      if (val < -1.0) return ramp[1];
      if (val <= 1.0) return ramp[2];
      if (val <= 6.0) return ramp[3];
      return ramp[4];
    }

    if (max === min) return ramp[2];
    if (val <= p25) return ramp[0];
    if (val <= p50) return ramp[1];
    if (val <= p75) return ramp[2];
    if (val < max) return ramp[3];
    return ramp[4];
  };

  // 1. Fetch Backend Data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [mapRes, facRes, irrRes] = await Promise.all([
        fetch(apiUrl(`gis/intelligence-map?season=${season}&compareSeason=${compareSeason}`)),
        fetch(apiUrl('gis/facilities')),
        fetch(apiUrl('gis/irrigation-assets')),
      ]);

      if (!mapRes.ok) throw new Error(`Failed to load intelligence map: HTTP ${mapRes.status}`);
      if (!facRes.ok) throw new Error(`Failed to load facilities: HTTP ${facRes.status}`);
      if (!irrRes.ok) throw new Error(`Failed to load irrigation assets: HTTP ${irrRes.status}`);

      const mapData = await mapRes.json();
      const facData = await facRes.json();
      const irrData = await irrRes.json();

      setDistricts(mapData.districts || []);
      setAvailableSeasons(mapData.availableSeasons || []);
      setNationalSummary(mapData.nationalSummary || null);
      setFacilities(facData || []);
      setIrrigationAssets(irrData || []);

      // If no district selected, default to top priority or first district
      if (!selectedDistrictName && mapData.districts?.length > 0) {
        setSelectedDistrictName(mapData.districts[0].name);
      }
    } catch (err: any) {
      console.error('Map intelligence fetch failed:', err);
      setError(err.message || 'Unable to connect to GIS intelligence server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [season, compareSeason]);

  // When layer changes, default to its first indicator
  const handleLayerChange = (layerId: IntelligenceLayerId) => {
    setActiveLayer(layerId);
    setActiveIndicatorId(layerConfigs[layerId].indicators[0].id);
  };

  // 2. Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    const basemapTiles: Record<string, string[]> = {
      positron: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'],
      satellite: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      streets: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    };

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'base-tiles': {
            type: 'raster',
            tiles: basemapTiles[basemapStyle],
            tileSize: 256,
            attribution: '© OpenStreetMap, CARTO, NISR Rwanda',
          },
        },
        layers: [
          {
            id: 'base-tiles-layer',
            type: 'raster',
            source: 'base-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [29.98, -1.94], // Centered on Rwanda
      zoom: 8.4,
      minZoom: 7.5,
      maxZoom: 15,
      pitch: 15,
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    map.current.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

    map.current.on('load', async () => {
      if (!map.current) return;

      try {
        // Load official Rwanda 30 districts GeoJSON
        const res = await fetch('/rwanda-districts.geojson');
        const geojson = await res.json();

        if (!map.current.getSource('rwanda-districts')) {
          map.current.addSource('rwanda-districts', {
            type: 'geojson',
            data: geojson,
          });

          // Districts Fill Layer
          map.current.addLayer({
            id: 'district-fill',
            type: 'fill',
            source: 'rwanda-districts',
            paint: {
              'fill-color': '#10B981',
              'fill-opacity': 0.78,
            },
          });

          // Districts Border Lines
          map.current.addLayer({
            id: 'district-borders',
            type: 'line',
            source: 'rwanda-districts',
            paint: {
              'line-color': '#0F172A',
              'line-width': 1.5,
              'line-opacity': 0.8,
            },
          });

          // Highlighted Selected District Border
          map.current.addLayer({
            id: 'district-selected-border',
            type: 'line',
            source: 'rwanda-districts',
            filter: ['==', 'shapeName', ''],
            paint: {
              'line-color': '#0D47A1',
              'line-width': 3.5,
              'line-opacity': 1.0,
            },
          });

          // Hover interaction
          map.current.on('mousemove', 'district-fill', (e) => {
            if (!map.current || !e.features || e.features.length === 0) return;
            map.current.getCanvas().style.cursor = 'pointer';

            const shapeName = e.features[0].properties?.shapeName;
            if (!shapeName) return;

            const district = districts.find(d => d.name.toLowerCase() === shapeName.toLowerCase());
            if (!district) return;

            const val = activeIndicator.getValue(district);
            const formatted = activeIndicator.format(val);

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
                <div style="font-family: inherit; padding: 6px 10px; min-width: 170px;">
                  <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                    <span style="font-weight: 800; font-size: 14px; color: #0F172A;">${district.name}</span>
                    <span style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">${district.province}</span>
                  </div>
                  <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">${activeIndicator.label}:</div>
                  <div style="font-size: 16px; font-weight: 800; color: #0D47A1; margin-bottom: 6px;">${formatted}</div>
                  <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 4px;">
                    <span>Prod. Rank: <b>#${district.cropProductivity.productivity_rank}</b></span>
                    <span>Priority: <b>#${district.priorityAssessment.priority_rank}</b></span>
                  </div>
                </div>
              `)
              .addTo(map.current);
          });

          map.current.on('mouseleave', 'district-fill', () => {
            if (map.current) map.current.getCanvas().style.cursor = '';
            if (hoverPopupRef.current) {
              hoverPopupRef.current.remove();
            }
          });

          // Click on district polygon
          map.current.on('click', 'district-fill', (e) => {
            if (!e.features || e.features.length === 0) return;
            const shapeName = e.features[0].properties?.shapeName;
            if (shapeName) {
              setSelectedDistrictName(shapeName);
            }
          });
        }
      } catch (err) {
        console.error('Failed to load district boundaries GeoJSON:', err);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [basemapStyle]);

  // 3. Update Choropleth Colors when districts or indicator change
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded() || districts.length === 0) return;
    if (!map.current.getLayer('district-fill')) return;

    // Build MapLibre match expression
    // ['match', ['get', 'shapeName'], 'Musanze', '#color', 'Bugesera', '#color', '#default']
    const matchExpression: any[] = ['match', ['get', 'shapeName']];

    for (const d of districts) {
      const color = getDistrictColor(d);
      matchExpression.push(d.name, color);
    }
    matchExpression.push('#94A3B8'); // Fallback color

    map.current.setPaintProperty('district-fill', 'fill-color', matchExpression as any);

    // Update selected district border
    if (map.current.getLayer('district-selected-border')) {
      map.current.setFilter('district-selected-border', ['==', 'shapeName', selectedDistrictName || ''] as any);
    }
  }, [districts, activeIndicator, selectedDistrictName, indicatorExtents]);

  // 4. Update Infrastructure Pins (Warehouses, Silos, Cold Storage, Irrigation)
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add Facility Markers
    if (showWarehouses || showColdStorage || showProcessing) {
      facilities.forEach(fac => {
        const isCold = fac.facility_type === 'COLD_STORAGE';
        const isProc = fac.facility_type === 'PROCESSING_PLANT';
        const isSilo = fac.facility_type === 'SILO' || fac.facility_type === 'WAREHOUSE' || fac.facility_type === 'COLLECTION_CENTER';

        if (isCold && !showColdStorage) return;
        if (isProc && !showProcessing) return;
        if (isSilo && !showWarehouses) return;

        const el = document.createElement('div');
        el.className = 'facility-marker cursor-pointer transition-transform hover:scale-125';
        
        let bgColor = '#059669'; // Emerald for storage
        let iconHtml = '🏢';
        if (isCold) {
          bgColor = '#0284C7'; // Blue for cold storage
          iconHtml = '❄️';
        } else if (isProc) {
          bgColor = '#D97706'; // Amber for processing
          iconHtml = '⚙️';
        }

        el.innerHTML = `
          <div style="background-color: ${bgColor}; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.3); border: 2px solid #ffffff; font-size: 13px;">
            ${iconHtml}
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 15 }).setHTML(`
          <div style="font-family: inherit; padding: 6px; min-width: 200px;">
            <div style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; background: #E0F2FE; color: #0369A1; margin-bottom: 4px;">
              ${fac.facility_type.replace(/_/g, ' ')}
            </div>
            <div style="font-weight: 800; font-size: 13px; color: #0F172A; margin-bottom: 2px;">${fac.name}</div>
            <div style="font-size: 11px; color: #64748B; margin-bottom: 6px;">District: <b>${fac.district_name}</b></div>
            <div style="border-top: 1px solid #E2E8F0; padding-top: 4px; font-size: 11px;">
              <div>Capacity: <b>${Number(fac.storage_capacity_tonnes).toLocaleString()} MT</b></div>
              ${fac.operator_name ? `<div>Operator: <i>${fac.operator_name}</i></div>` : ''}
              <div>Status: <span style="color: #059669; font-weight: 700;">${fac.status}</span></div>
            </div>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([fac.longitude, fac.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    }

    // Add Irrigation Assets Markers
    if (showIrrigationAssets) {
      irrigationAssets.forEach(irr => {
        const el = document.createElement('div');
        el.className = 'irrigation-marker cursor-pointer transition-transform hover:scale-125';
        el.innerHTML = `
          <div style="background-color: #2563EB; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.3); border: 2px solid #ffffff; font-size: 12px;">
            💧
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 15 }).setHTML(`
          <div style="font-family: inherit; padding: 6px; min-width: 200px;">
            <div style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; background: #DBEAFE; color: #1D4ED8; margin-bottom: 4px;">
              Irrigation Scheme
            </div>
            <div style="font-weight: 800; font-size: 13px; color: #0F172A; margin-bottom: 2px;">${irr.name}</div>
            <div style="font-size: 11px; color: #64748B; margin-bottom: 6px;">District: <b>${irr.district_name}</b></div>
            <div style="border-top: 1px solid #E2E8F0; padding-top: 4px; font-size: 11px;">
              <div>Command Area: <b>${irr.area_command_ha} ha</b></div>
              <div>Water Source: <b>${irr.water_source}</b></div>
              <div>Beneficiaries: <b>${irr.beneficiaries_count.toLocaleString()} farmers</b></div>
            </div>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([irr.longitude, irr.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    }
  }, [facilities, irrigationAssets, showWarehouses, showColdStorage, showProcessing, showIrrigationAssets]);

  // 5. Fly to selected district when changed
  useEffect(() => {
    if (!map.current || !selectedDistrict) return;
    map.current.flyTo({
      center: [selectedDistrict.longitude, selectedDistrict.latitude],
      zoom: 9.8,
      speed: 1.2,
      essential: true,
    });
  }, [selectedDistrictName]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-slate-900 text-slate-100 -m-4 md:-m-6 lg:-m-8 select-none font-sans">
      
      {/* Top Agricultural Intelligence Command Bar */}
      <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-30 shrink-0">
        
        {/* Title & National Scope */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                AgriLens Rwanda
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  National Agricultural Intelligence Map
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1">
              Integrated spatial analytics: NISR SAS Surveys · PostGIS Boundaries · Irrigation · Soil Health · Post-Harvest · Export Targeting
            </p>
          </div>
        </div>

        {/* National Stats Badges */}
        {nationalSummary && (
          <div className="hidden xl:flex items-center gap-2">
            <div className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="text-slate-400">Total Crop Output:</span>{' '}
              <span className="font-extrabold text-emerald-400">{(nationalSummary.total_production_tonnes / 1000).toFixed(0)}k MT</span>
            </div>
            <div className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="text-slate-400">Cultivated Area:</span>{' '}
              <span className="font-extrabold text-teal-400">{(nationalSummary.total_cultivated_area_ha / 1000).toFixed(0)}k ha</span>
            </div>
            <div className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="text-slate-400">Storage Capacity:</span>{' '}
              <span className="font-extrabold text-blue-400">{(nationalSummary.total_storage_capacity_mt / 1000).toFixed(0)}k MT</span>
            </div>
            <div className="px-3 py-1 rounded-lg bg-rose-950/60 border border-rose-800/60 text-xs">
              <span className="text-rose-300">Urgent Intervention:</span>{' '}
              <span className="font-extrabold text-rose-400">{nationalSummary.critical_priority_districts_count} Districts</span>
            </div>
          </div>
        )}

        {/* Filter Controls: Season & Province */}
        <div className="flex items-center gap-2.5">
          {/* Season Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 font-medium">Season:</span>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              {availableSeasons.map((s) => (
                <option key={s.code} value={s.code} className="bg-slate-800 text-white">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Comparison Season */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-slate-400 font-medium">Compare:</span>
            <select
              value={compareSeason}
              onChange={(e) => setCompareSeason(e.target.value)}
              className="bg-transparent text-slate-300 font-semibold outline-none cursor-pointer"
            >
              {availableSeasons.map((s) => (
                <option key={s.code} value={s.code} className="bg-slate-800 text-white">
                  {s.code}
                </option>
              ))}
            </select>
          </div>

          {/* Province Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-teal-400" />
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-800 text-white">All 30 Districts</option>
              <option value="Northern Province" className="bg-slate-800 text-white">Northern Province</option>
              <option value="Southern Province" className="bg-slate-800 text-white">Southern Province</option>
              <option value="Eastern Province" className="bg-slate-800 text-white">Eastern Province</option>
              <option value="Western Province" className="bg-slate-800 text-white">Western Province</option>
              <option value="Kigali City" className="bg-slate-800 text-white">Kigali City</option>
            </select>
          </div>

          {/* Basemap Switcher */}
          <select
            value={basemapStyle}
            onChange={(e) => setBasemapStyle(e.target.value as any)}
            className="bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 font-medium outline-none cursor-pointer"
            title="Basemap style"
          >
            <option value="positron">Clean Light</option>
            <option value="satellite">Precision Satellite</option>
            <option value="streets">OpenStreetMap</option>
          </select>
        </div>
      </div>

      {/* Layer Navigation Tabs (The 6 Intelligence Layers) */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
        {(Object.keys(layerConfigs) as IntelligenceLayerId[]).map((layerId) => {
          const cfg = layerConfigs[layerId];
          const Icon = cfg.icon;
          const isActive = activeLayer === layerId;
          return (
            <button
              key={layerId}
              onClick={() => handleLayerChange(layerId)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/30 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-950/40'
                  : 'bg-slate-800/50 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{cfg.shortTitle}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Planning Question Sub-Banner */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs gap-2 shrink-0">
        <div className="flex items-center gap-2 text-slate-300">
          <HelpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-400">Strategic Planning Question:</span>
          <span className="font-semibold text-white">{activeConfig.planningQuestion}</span>
        </div>

        {activeConfig.safeguardNotice && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 font-medium bg-amber-950/30 px-2 py-0.5 rounded border border-amber-800/40">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>{activeConfig.safeguardNotice}</span>
          </div>
        )}
      </div>

      {/* Main Workspace (Map + Overlays + District Dossier) */}
      <div className="flex-1 relative flex overflow-hidden min-h-0">
        
        {/* Left Floating Controls & Indicator Selector */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2.5 max-w-xs w-full pointer-events-none">
          
          {/* Active Indicators Selector Card */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Active Map Metric
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                {activeConfig.badge}
              </span>
            </div>

            <div className="space-y-1">
              {activeConfig.indicators.map((ind) => {
                const isSelected = activeIndicatorId === ind.id;
                return (
                  <button
                    key={ind.id}
                    onClick={() => setActiveIndicatorId(ind.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/50'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <span>{ind.label}</span>
                    <span className="text-[10px] opacity-80 font-normal">({ind.unit})</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-tight">
              {activeIndicator.description}
            </div>
          </div>

          {/* Infrastructure Layer Toggles Pill */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-xl pointer-events-auto">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
              Physical Infrastructure Pins
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input 
                  type="checkbox" 
                  checked={showWarehouses} 
                  onChange={(e) => setShowWarehouses(e.target.checked)} 
                  className="rounded accent-emerald-500" 
                />
                <span>🏢 Silos & Stores</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input 
                  type="checkbox" 
                  checked={showColdStorage} 
                  onChange={(e) => setShowColdStorage(e.target.checked)} 
                  className="rounded accent-sky-500" 
                />
                <span>❄️ Cold Storage</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input 
                  type="checkbox" 
                  checked={showProcessing} 
                  onChange={(e) => setShowProcessing(e.target.checked)} 
                  className="rounded accent-amber-500" 
                />
                <span>⚙️ Processing Mills</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input 
                  type="checkbox" 
                  checked={showIrrigationAssets} 
                  onChange={(e) => setShowIrrigationAssets(e.target.checked)} 
                  className="rounded accent-blue-500" 
                />
                <span>💧 Irrigation Dams</span>
              </label>
            </div>
          </div>

          {/* Quick District Search Box */}
          <div className="relative pointer-events-auto">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search district, crop or asset..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-xl"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative h-full w-full">
          <div ref={mapContainer} className="absolute inset-0 z-0 bg-slate-950" />

          {/* Dynamic Map Legend (Bottom-Left) */}
          <div className="absolute bottom-6 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-2xl max-w-xs text-xs pointer-events-auto">
            <div className="flex items-center justify-between font-bold text-white mb-1.5">
              <span>{activeIndicator.label}</span>
              <span className="text-[10px] text-slate-400 font-normal">({activeIndicator.unit})</span>
            </div>

            {/* Gradient Bar */}
            <div className="flex h-3 rounded-full overflow-hidden mb-1 border border-slate-700">
              {colorRamps[activeIndicator.colorType].map((c, i) => (
                <div key={i} className="flex-1" style={{ backgroundColor: c }} />
              ))}
            </div>

            {/* Scale Numbers */}
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>{activeIndicator.format(indicatorExtents.min)}</span>
              <span>{activeIndicator.format(indicatorExtents.p50)}</span>
              <span>{activeIndicator.format(indicatorExtents.max)}</span>
            </div>
          </div>
        </div>

        {/* Right Drawer: District Intelligence Dossier */}
        {selectedDistrict && (
          <div className="w-full md:w-[460px] lg:w-[500px] shrink-0 bg-slate-900 border-l border-slate-800 z-30 flex flex-col h-full shadow-2xl overflow-hidden transition-all duration-300">
            
            {/* Dossier Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-white tracking-tight">
                      {selectedDistrict.name}
                    </h2>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {selectedDistrict.province}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                    <span>Prod Rank: <b className="text-emerald-400">#{selectedDistrict.cropProductivity.productivity_rank} of 30</b></span>
                    <span>•</span>
                    <span>Priority Rank: <b className="text-rose-400">#{selectedDistrict.priorityAssessment.priority_rank} of 30</b></span>
                  </div>
                </div>

                {/* Priority Status Badge */}
                <div className="flex items-center gap-1.5">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${
                    selectedDistrict.priorityAssessment.priority_level === 'CRITICAL PRIORITY'
                      ? 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                      : selectedDistrict.priorityAssessment.priority_level === 'HIGH PRIORITY'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                  }`}>
                    {selectedDistrict.priorityAssessment.priority_level}
                  </span>
                  <button 
                    onClick={() => setSelectedDistrictName(null)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Fast 4 KPI Cards */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Production</div>
                  <div className="text-sm font-extrabold text-white mt-0.5">
                    {(selectedDistrict.cropProductivity.production_tonnes / 1000).toFixed(1)}k
                  </div>
                  <div className={`text-[10px] font-bold flex items-center justify-center gap-0.5 ${
                    selectedDistrict.cropProductivity.production_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {selectedDistrict.cropProductivity.production_change_pct >= 0 ? (
                      <TrendingUp className="w-2.5 h-2.5" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5" />
                    )}
                    {selectedDistrict.cropProductivity.production_change_pct > 0 ? '+' : ''}
                    {selectedDistrict.cropProductivity.production_change_pct}%
                  </div>
                </div>

                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Cultivated</div>
                  <div className="text-sm font-extrabold text-teal-300 mt-0.5">
                    {(selectedDistrict.cropProductivity.cultivated_area_ha / 1000).toFixed(1)}k
                  </div>
                  <div className="text-[10px] text-slate-400">ha</div>
                </div>

                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Yield</div>
                  <div className="text-sm font-extrabold text-amber-300 mt-0.5">
                    {selectedDistrict.cropProductivity.avg_yield_t_ha}
                  </div>
                  <div className="text-[10px] text-slate-400">t/ha</div>
                </div>

                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Storage</div>
                  <div className="text-sm font-extrabold text-blue-300 mt-0.5">
                    {(selectedDistrict.postHarvest.documented_storage_capacity_mt / 1000).toFixed(1)}k
                  </div>
                  <div className="text-[10px] text-slate-400">MT</div>
                </div>
              </div>
            </div>

            {/* Dossier Tabs */}
            <div className="bg-slate-950 border-b border-slate-800 px-3 flex items-center gap-1 overflow-x-auto custom-scrollbar shrink-0 text-xs font-semibold">
              <button
                onClick={() => setDossierTab('OVERVIEW')}
                className={`py-2 px-2.5 border-b-2 transition-colors whitespace-nowrap ${
                  dossierTab === 'OVERVIEW'
                    ? 'border-emerald-500 text-emerald-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Overview & Crops
              </button>

              <button
                onClick={() => setDossierTab('WATER')}
                className={`py-2 px-2.5 border-b-2 transition-colors whitespace-nowrap ${
                  dossierTab === 'WATER'
                    ? 'border-emerald-500 text-emerald-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Irrigation
              </button>

              <button
                onClick={() => setDossierTab('SOIL')}
                className={`py-2 px-2.5 border-b-2 transition-colors whitespace-nowrap ${
                  dossierTab === 'SOIL'
                    ? 'border-emerald-500 text-emerald-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Soil & Fertility
              </button>

              <button
                onClick={() => setDossierTab('POST_HARVEST')}
                className={`py-2 px-2.5 border-b-2 transition-colors whitespace-nowrap ${
                  dossierTab === 'POST_HARVEST'
                    ? 'border-emerald-500 text-emerald-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Storage
              </button>

              <button
                onClick={() => setDossierTab('TRADE')}
                className={`py-2 px-2.5 border-b-2 transition-colors whitespace-nowrap ${
                  dossierTab === 'TRADE'
                    ? 'border-emerald-500 text-emerald-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Exports
              </button>

              <button
                onClick={() => setDossierTab('PRIORITY')}
                className={`py-2 px-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 ${
                  dossierTab === 'PRIORITY'
                    ? 'border-rose-500 text-rose-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                Intervention Dossier
              </button>
            </div>

            {/* Dossier Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4 text-xs">
              
              {/* TAB 1: OVERVIEW & CROPS */}
              {dossierTab === 'OVERVIEW' && (
                <div className="space-y-4">
                  {/* Dominant Crops Progress Bars */}
                  <div>
                    <div className="flex items-center justify-between text-slate-300 font-bold mb-2">
                      <span className="flex items-center gap-1.5">
                        <Sprout className="w-4 h-4 text-emerald-400" />
                        Dominant Crops in {selectedDistrict.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Share of Production</span>
                    </div>

                    <div className="space-y-2.5">
                      {selectedDistrict.cropProductivity.dominant_crops.map((crop, i) => (
                        <div key={i} className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                          <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                            <span>{crop.crop_name}</span>
                            <span className="text-emerald-400">{crop.production_tonnes.toLocaleString()} MT ({crop.share_pct}%)</span>
                          </div>
                          
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, crop.share_pct * 2.5)}%` }}
                            />
                          </div>

                          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                            <span>Area: <b>{crop.area_ha.toLocaleString()} ha</b></span>
                            <span>Yield: <b>{crop.yield_t_ha} t/ha</b></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Multi-Season Trend Summary */}
                  <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60 space-y-2">
                    <div className="font-bold text-slate-200 flex items-center justify-between">
                      <span>Seasonal Production Stability</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        selectedDistrict.cropProductivity.trend_status === 'GROWING'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : selectedDistrict.cropProductivity.trend_status === 'DECLINING'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {selectedDistrict.cropProductivity.trend_status}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      District production shifted from {selectedDistrict.cropProductivity.prev_production_tonnes.toLocaleString()} MT ({compareSeason}) 
                      to {selectedDistrict.cropProductivity.production_tonnes.toLocaleString()} MT ({season}), a net change of{' '}
                      <b className={selectedDistrict.cropProductivity.production_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {selectedDistrict.cropProductivity.production_change_pct > 0 ? '+' : ''}{selectedDistrict.cropProductivity.production_change_pct}%
                      </b>.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: IRRIGATION */}
              {dossierTab === 'WATER' && (
                <div className="space-y-3">
                  <div className="bg-blue-950/40 p-3 rounded-lg border border-blue-900/60 space-y-2">
                    <div className="flex items-center justify-between text-blue-200 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Droplets className="w-4 h-4 text-blue-400" />
                        Irrigation Adoption & Water Balance
                      </span>
                      <span className="text-sm font-extrabold text-blue-300">
                        {selectedDistrict.irrigation.irrigation_access_pct}% Coverage
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>Modern Irrigated: <b>{selectedDistrict.irrigation.modern_irrigated_ha.toLocaleString()} ha</b></div>
                      <div>Traditional Scheme: <b>{selectedDistrict.irrigation.traditional_irrigated_ha.toLocaleString()} ha</b></div>
                      <div>Rainfed Cultivation Gap: <b>{selectedDistrict.irrigation.irrigation_gap_ha.toLocaleString()} ha</b></div>
                      <div>Water Deficit: <b>{selectedDistrict.irrigation.water_deficit_mm} mm</b></div>
                    </div>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 space-y-1.5">
                    <div className="font-bold text-slate-200">Feasibility & Infrastructure Tier</div>
                    <div className="text-xs text-emerald-400 font-semibold">{selectedDistrict.irrigation.feasibility_tier}</div>
                    <div className="text-[11px] text-slate-400">
                      Recommended Tech: <b>{selectedDistrict.irrigation.recommended_technology}</b>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Registered Schemes in District: <b>{selectedDistrict.irrigation.registered_schemes_count}</b>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Hydrological borehole yields and river discharge verification are required before public capital expenditure.</span>
                  </div>
                </div>
              )}

              {/* TAB 3: SOIL & FERTILITY */}
              {dossierTab === 'SOIL' && (
                <div className="space-y-3">
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-slate-200 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-emerald-400" />
                        Measured Soil Observations
                      </span>
                      <span className="text-sm font-extrabold text-amber-300">
                        pH {selectedDistrict.soilConservation.soil_ph.toFixed(2)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>Acidity Status: <b>{selectedDistrict.soilConservation.acidity_status}</b></div>
                      <div>Lime Requirement: <b>{selectedDistrict.soilConservation.lime_requirement_tons_per_ha} t/ha</b></div>
                      <div>Organic Carbon: <b>{selectedDistrict.soilConservation.organic_carbon_pct}%</b></div>
                      <div>Terracing Gap: <b>{selectedDistrict.soilConservation.radical_terracing_gap_ha.toLocaleString()} ha</b></div>
                    </div>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 space-y-1.5">
                    <div className="font-bold text-slate-200">Anti-Erosion & Practices</div>
                    <div className="text-xs text-slate-300">
                      Anti-Erosion Coverage: <b>{selectedDistrict.soilConservation.erosion_control_pct}%</b> ({selectedDistrict.soilConservation.erosion_control_ha.toLocaleString()} ha)
                    </div>
                    <div className="text-xs text-slate-300">
                      USLE Erosion Vulnerability Index: <b>{selectedDistrict.soilConservation.modelled_erosion_susceptibility} / 100</b>
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1">
                      Recommended: {selectedDistrict.soilConservation.recommended_interventions.join(', ')}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: POST-HARVEST & STORAGE */}
              {dossierTab === 'POST_HARVEST' && (
                <div className="space-y-3">
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span className="flex items-center gap-1.5">
                        <Warehouse className="w-4 h-4 text-blue-400" />
                        Storage Capacity vs Production
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        selectedDistrict.postHarvest.capacity_status.includes('DEFICIT')
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {selectedDistrict.postHarvest.capacity_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>Documented Storage: <b>{selectedDistrict.postHarvest.documented_storage_capacity_mt.toLocaleString()} MT</b></div>
                      <div>Market Surplus: <b>{selectedDistrict.postHarvest.market_surplus_volume_mt.toLocaleString()} MT</b></div>
                      <div>Storage Gap / Deficit: <b>{selectedDistrict.postHarvest.storage_capacity_gap_mt.toLocaleString()} MT</b></div>
                      <div>Capacity Utilization: <b>{selectedDistrict.postHarvest.storage_utilization_pct}%</b></div>
                    </div>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 space-y-1">
                    <div className="font-bold text-slate-200">Logistics & Bottleneck Analysis</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {selectedDistrict.postHarvest.bottleneck_warning}
                    </p>
                    <div className="text-[11px] text-emerald-400 font-semibold pt-1">
                      Tier: {selectedDistrict.postHarvest.investment_tier}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: EXPORTS */}
              {dossierTab === 'TRADE' && (
                <div className="space-y-3">
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        Export Supply Intelligence
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        {selectedDistrict.marketExports.export_readiness_score} / 100 Readiness
                      </span>
                    </div>

                    <div className="text-xs text-slate-300">
                      Primary Export Crops: <b>{selectedDistrict.marketExports.primary_export_crops.join(', ')}</b>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>Exportable Volume: <b>{selectedDistrict.marketExports.estimated_exportable_volume_mt.toLocaleString()} MT</b></div>
                      <div>Nearest Exit: <b>{selectedDistrict.marketExports.nearest_exit_hub}</b></div>
                      <div>Distance to Exit: <b>{selectedDistrict.marketExports.distance_to_exit_km} km</b></div>
                      <div>Certified Coops: <b>{selectedDistrict.marketExports.cooperatives_count}</b></div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-800/40 border border-slate-700 text-[11px] text-slate-400 leading-relaxed">
                    Export readiness combines cross-border transit logistics, post-harvest drying compliance, and sanitary certificates.
                  </div>
                </div>
              )}

              {/* TAB 6: AGRICULTURAL PRIORITY FINDER & EVIDENCE DOSSIER */}
              {dossierTab === 'PRIORITY' && (
                <div className="space-y-4">
                  {/* Priority Summary Banner */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-rose-950/60 to-slate-900 border border-rose-800/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
                        <span className="text-sm font-extrabold text-white">
                          Priority Assessment: {selectedDistrict.priorityAssessment.priority_level}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-rose-300 bg-rose-900/60 px-2 py-0.5 rounded border border-rose-700">
                        Composite: {selectedDistrict.priorityAssessment.composite_score}/100
                      </span>
                    </div>

                    {/* Overlapping Challenges Tags */}
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Detected Overlapping Challenges:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedDistrict.priorityAssessment.overlapping_challenges.map((ch, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Non-causal Potential Explanation */}
                    <div className="text-[11px] text-slate-300 leading-relaxed border-t border-rose-900/50 pt-2">
                      <span className="font-bold text-white">Potential Investigation Rationale: </span>
                      {selectedDistrict.priorityAssessment.potential_explanation}
                    </div>
                  </div>

                  {/* 3-Tier Evidence Credibility Box */}
                  <div className="space-y-2.5">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-400" />
                      3-Tier Evidence Credibility Breakdown
                    </div>

                    {/* 1. Observed Data */}
                    <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/50 space-y-1">
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        1. Observed Data (NISR Seasonal Statistics)
                      </div>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-300">
                        {selectedDistrict.priorityAssessment.evidence_breakdown.observed_data.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* 2. Derived Estimates */}
                    <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/50 space-y-1">
                      <div className="text-xs font-bold text-blue-400 flex items-center gap-1">
                        <BarChart3 className="w-3.5 h-3.5" />
                        2. Derived Estimates (Models & Seasonal Deltas)
                      </div>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-300">
                        {selectedDistrict.priorityAssessment.evidence_breakdown.derived_estimates.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* 3. Recommended Interventions */}
                    <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/50 space-y-1">
                      <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        3. Suggested Planning Actions & Interventions
                      </div>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-300">
                        {selectedDistrict.priorityAssessment.suggested_actions.map((act, i) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Missing Data Warnings */}
                    <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 space-y-1 text-[11px] text-slate-400">
                      <div className="font-bold text-slate-300">Data Limitations & Safeguards:</div>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {selectedDistrict.priorityAssessment.evidence_breakdown.missing_data_warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Dossier Footer Action Bar */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-2 shrink-0">
              <button 
                onClick={() => setDossierTab('PRIORITY')}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Intervention Dossier
              </button>

              <button 
                onClick={() => {
                  window.open(apiUrl(`gis/district-dossier/${selectedDistrict.name}`), '_blank');
                }}
                className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center gap-1 border border-slate-700"
                title="View Raw JSON API Output"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                API Dossier
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
