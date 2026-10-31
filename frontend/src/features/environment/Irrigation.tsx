import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { apiUrl } from '../../config/api';
import { 
  Droplets, Waves, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ShieldAlert, 
  MapPin, RefreshCw, FileText, Layers, Thermometer, Filter, Download, 
  Database, Award, ChevronRight, ArrowUpRight, ArrowDownRight, Compass,
  Check, Info, HelpCircle, Sun, Activity, Zap, ExternalLink, Search,
  X, SlidersHorizontal, ArrowRight, Eye, EyeOff, ShieldCheck, CheckSquare,
  Building2, Landmark, Gauge, Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  CartesianGrid, Cell, AreaChart, Area, LineChart, Line, Legend
} from 'recharts';

export type IrrigationIndicatorType = 'coverage_pct' | 'area_irrigated_ha' | 'facility_count' | 'irrigated_change_pct';

export interface DistrictIrrigationStat {
  district_id: string;
  district_name: string;
  district_code: string;
  province_name: string;
  area_irrigated_ha: number | null;
  cultivated_area_ha: number | null;
  coverage_pct: number | null;
  prev_irrigated_ha: number | null;
  prev_coverage_pct: number | null;
  irrigated_change_pct: number | null;
  coverage_change_pct: number | null;
  national_share_pct: number;
  rank: number;
  coverage_rank: number;
  has_data: boolean;
  facility_count: number;
  documented_command_ha: number;
  documented_irrigable_ha: number;
  total_beneficiaries: number;
  water_deficit_mm: number;
  drought_index: number;
  terrain_slope_pct: number;
  water_source_distance_km: number;
  road_distance_km: number;
  opportunity_score: number;
  feasibility_tier: string;
  recommended_technology: string;
  irrigation_type_breakdown: Record<string, number>;
  soil_texture: string;
  soil_ph: number;
  feasibility_prerequisites: string[];
}

export interface IrrigationFacility {
  id: string;
  name: string;
  district_name: string;
  district_code: string;
  province_name: string;
  irrigation_type: string;
  water_source: string;
  irrigation_method: string;
  area_command_ha: number;
  area_irrigable_ha: number;
  beneficiaries_count: number;
  operator_name: string;
  status: string;
  longitude: number;
  latitude: number;
}

export default function Irrigation() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Filter States
  const [selectedSeason, setSelectedSeason] = useState<string>('2025A');
  const [compareSeason, setCompareSeason] = useState<string>('');
  const [activeIndicator, setActiveIndicator] = useState<IrrigationIndicatorType>('coverage_pct');
  const [selectedProvince, setSelectedProvince] = useState<string>('ALL');
  const [selectedFacilityType, setSelectedFacilityType] = useState<string>('ALL');
  const [showFacilityMarkers, setShowFacilityMarkers] = useState<boolean>(true);
  const [searchDistrict, setSearchDistrict] = useState<string>('');
  const [facilitySearch, setFacilitySearch] = useState<string>('');
  const [rankingFilter, setRankingFilter] = useState<'ALL' | 'TOP_IRRIGATED' | 'HIGH_COVERAGE' | 'EXPANDING' | 'DECLINING' | 'CRITICAL_GAP'>('ALL');

  // Selected District for Side Panel
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('Nyagatare');
  const [districtTab, setDistrictTab] = useState<'OVERVIEW' | 'TRENDS' | 'FACILITIES' | 'OPPORTUNITIES'>('OVERVIEW');

  // Backend Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableSeasons, setAvailableSeasons] = useState<Array<{ code: string; label: string; year: number }>>([]);
  const [availableFacilityTypes, setAvailableFacilityTypes] = useState<Array<{ type: string; count: number }>>([]);
  const [nationalSummary, setNationalSummary] = useState<any>(null);
  const [districts, setDistricts] = useState<DistrictIrrigationStat[]>([]);
  const [seasonalTrends, setSeasonalTrends] = useState<any[]>([]);
  const [facilitiesList, setFacilitiesList] = useState<IrrigationFacility[]>([]);
  const [alerts, setAlerts] = useState<any>({ large_expansions: [], large_declines: [], stable_districts: [] });
  const [opportunityScreening, setOpportunityScreening] = useState<any>({ candidateDistricts: [], criteriaWeights: [] });

  // Refs for map callbacks to prevent stale closures
  const districtsRef = useRef<DistrictIrrigationStat[]>([]);
  const selectedDistrictNameRef = useRef<string>('Nyagatare');
  const geojsonLoadedRef = useRef<boolean>(false);
  const activeIndicatorRef = useRef<IrrigationIndicatorType>('coverage_pct');

  // 1. Fetch Decision Workspace Data from Backend
  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('season', selectedSeason);
      if (compareSeason) params.append('compareSeason', compareSeason);
      if (selectedProvince) params.append('province', selectedProvince);
      if (selectedFacilityType) params.append('facilityType', selectedFacilityType);

      const url = apiUrl(`irrigation/decision-workspace?${params.toString()}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load irrigation intelligence workspace`);

      const data = await res.json();

      setNationalSummary(data.nationalSummary || null);
      const districtList: DistrictIrrigationStat[] = data.districts || [];
      setDistricts(districtList);
      districtsRef.current = districtList;

      setSeasonalTrends(data.seasonalTrends || []);
      setFacilitiesList(data.facilitiesList || []);
      setAlerts(data.alerts || { large_expansions: [], large_declines: [], stable_districts: [] });
      setOpportunityScreening(data.opportunityScreening || { candidateDistricts: [], criteriaWeights: [] });

      if (data.meta?.availableSeasons) {
        setAvailableSeasons(data.meta.availableSeasons);
      }
      if (data.meta?.availableFacilityTypes) {
        setAvailableFacilityTypes(data.meta.availableFacilityTypes);
      }
      if (data.meta?.compareSeason && !compareSeason) {
        setCompareSeason(data.meta.compareSeason);
      }

      // Default selected district if not set
      if (districtList.length > 0) {
        const exists = districtList.some((d: DistrictIrrigationStat) => d.district_name.toLowerCase() === selectedDistrictName.toLowerCase());
        if (!exists) {
          setSelectedDistrictName(districtList[0].district_name);
          selectedDistrictNameRef.current = districtList[0].district_name;
        }
      }
    } catch (err: any) {
      console.error('Error fetching irrigation workspace data:', err);
      setError(err.message || 'Unable to connect to irrigation statistics server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [selectedSeason, compareSeason]);

  // Selected district object
  const selectedDistrict = useMemo(() => {
    return districts.find(d => d.district_name.toLowerCase() === selectedDistrictName.toLowerCase()) || districts[0] || null;
  }, [districts, selectedDistrictName]);

  // Indicator Configuration
  const indicatorConfig = useMemo(() => {
    switch (activeIndicator) {
      case 'coverage_pct':
        return {
          label: 'Irrigation Coverage',
          unit: '% of cultivated land',
          getValue: (d: DistrictIrrigationStat) => d.coverage_pct,
          format: (v: number | null) => v !== null ? `${v.toFixed(2)}%` : 'No data recorded',
          description: 'Share of seasonal cultivated land equipped with irrigation infrastructure.',
        };
      case 'area_irrigated_ha':
        return {
          label: 'Irrigated Area',
          unit: 'Hectares',
          getValue: (d: DistrictIrrigationStat) => d.area_irrigated_ha,
          format: (v: number | null) => v !== null ? `${Math.round(v).toLocaleString()} ha` : 'No data recorded',
          description: 'Physical land area under functional irrigation during this season.',
        };
      case 'facility_count':
        return {
          label: 'Documented Facilities',
          unit: 'Schemes / Assets',
          getValue: (d: DistrictIrrigationStat) => d.facility_count,
          format: (v: number | null) => v !== null ? `${v} documented asset${v !== 1 ? 's' : ''}` : 'None recorded',
          description: 'Count of registered irrigation schemes, dams, and pumping systems in district.',
        };
      case 'irrigated_change_pct':
        return {
          label: 'Seasonal Expansion Delta',
          unit: '% change vs reference season',
          getValue: (d: DistrictIrrigationStat) => d.irrigated_change_pct,
          format: (v: number | null) => v !== null ? `${v > 0 ? '+' : ''}${v.toFixed(1)}%` : 'No comparison available',
          description: 'Percentage change in irrigated hectares compared with the reference season.',
        };
    }
  }, [activeIndicator]);

  // Dynamic Quantiles / Thresholds for Legend
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

  // Color Ramps: Modern Cyan-Teal for Irrigation + Slate Gray for Missing Data
  const cyanRamp = ['#E0F2FE', '#BAE6FD', '#38BDF8', '#0284C7', '#0369A1'];
  const missingColor = '#94A3B8'; // Neutral slate gray for missing/unreported data

  const getDistrictColor = (d: DistrictIrrigationStat): string => {
    const val = indicatorConfig.getValue(d);
    if (val === null || val === undefined || !d.has_data) {
      return missingColor;
    }
    const { min, max, p25, p50, p75 } = extents;
    if (max === min) return cyanRamp[2];
    if (val <= p25) return cyanRamp[0];
    if (val <= p50) return cyanRamp[1];
    if (val <= p75) return cyanRamp[2];
    if (val < max) return cyanRamp[3];
    return cyanRamp[4];
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
            attribution: '© OpenStreetMap contributors, NISR, MINAGRI Rwanda',
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
          let initialFill: any = '#38BDF8';
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
              'line-color': '#0284C7',
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
                <div style="font-family: inherit; padding: 6px 10px; min-width: 180px;">
                  <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                    <span style="font-weight: 800; font-size: 14px; color: #0F172A;">${district.district_name}</span>
                    <span style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">${district.province_name}</span>
                  </div>
                  <div style="font-size: 11px; color: #475569; margin-bottom: 2px;">
                    ${indicatorConfig.label} (${selectedSeason}):
                  </div>
                  <div style="font-size: 16px; font-weight: 800; color: #0369A1; margin-bottom: 6px;">
                    ${formatted}
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 4px;">
                    <span>Irrigated: <b>${Math.round(district.area_irrigated_ha || 0).toLocaleString()} ha</b></span>
                    <span>Rank: <b>#${district.rank} of 30</b></span>
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
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
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

  // 4. Update Documented Facility Markers on the Map
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!showFacilityMarkers || facilitiesList.length === 0) return;

    // Filter facilities if facility type filter or province filter is active
    const filteredFacilities = facilitiesList.filter(f => {
      const matchType = selectedFacilityType === 'ALL' || f.irrigation_type === selectedFacilityType;
      const matchProv = selectedProvince === 'ALL' || f.province_name.toLowerCase() === selectedProvince.toLowerCase();
      return matchType && matchProv;
    });

    filteredFacilities.forEach(f => {
      if (!f.longitude || !f.latitude) return;

      const el = document.createElement('div');
      el.className = 'facility-marker cursor-pointer transition-transform hover:scale-125';
      el.innerHTML = `
        <div style="background-color: #0284C7; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.3); border: 2px solid #ffffff; font-size: 13px;">
          💧
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 14 }).setHTML(`
        <div style="font-family: inherit; padding: 6px; min-width: 200px;">
          <div style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; background: #E0F2FE; color: #0369A1; margin-bottom: 4px;">
            ${f.irrigation_type.replace(/_/g, ' ')}
          </div>
          <div style="font-weight: 800; font-size: 13px; color: #0F172A; margin-bottom: 2px;">${f.name}</div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 4px;">District: <b>${f.district_name}</b> (${f.province_name})</div>
          <div style="border-top: 1px solid #E2E8F0; padding-top: 4px; font-size: 11px;">
            <div>Command Area: <b>${Math.round(f.area_command_ha).toLocaleString()} ha</b></div>
            <div>Water Source: <i>${f.water_source || 'Perennial river'}</i></div>
            <div>Beneficiaries: <b>${(f.beneficiaries_count || 0).toLocaleString()} farmers</b></div>
            <div>Status: <span style="color: #059669; font-weight: 700;">${f.status}</span></div>
          </div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([f.longitude, f.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [facilitiesList, showFacilityMarkers, selectedFacilityType, selectedProvince]);

  // Center map on a specific facility
  const handleFocusFacility = (f: IrrigationFacility) => {
    if (!map.current || !f.longitude || !f.latitude) return;
    map.current.flyTo({
      center: [f.longitude, f.latitude],
      zoom: 11,
      speed: 1.2,
    });
    setSelectedDistrictName(f.district_name);
    selectedDistrictNameRef.current = f.district_name;
  };

  // Filtered & Ranked Districts for Table
  const filteredRankings = useMemo(() => {
    return [...districts].filter(d => {
      const matchSearch = !searchDistrict.trim() || 
        d.district_name.toLowerCase().includes(searchDistrict.toLowerCase()) ||
        d.province_name.toLowerCase().includes(searchDistrict.toLowerCase());
      const matchProv = selectedProvince === 'ALL' || d.province_name.toLowerCase() === selectedProvince.toLowerCase();
      
      let matchTab = true;
      if (rankingFilter === 'TOP_IRRIGATED') matchTab = (d.area_irrigated_ha || 0) >= 1500;
      if (rankingFilter === 'HIGH_COVERAGE') matchTab = (d.coverage_pct || 0) >= 2.5;
      if (rankingFilter === 'EXPANDING') matchTab = (d.irrigated_change_pct ?? 0) >= 8;
      if (rankingFilter === 'DECLINING') matchTab = (d.irrigated_change_pct ?? 0) <= -5;
      if (rankingFilter === 'CRITICAL_GAP') matchTab = (d.coverage_pct || 0) < 1.5 && (d.cultivated_area_ha || 0) > 40000;

      return matchSearch && matchProv && matchTab;
    });
  }, [districts, searchDistrict, selectedProvince, rankingFilter]);

  // Filtered Facilities for Directory Table
  const filteredFacilitiesTable = useMemo(() => {
    return facilitiesList.filter(f => {
      const matchSearch = !facilitySearch.trim() ||
        f.name.toLowerCase().includes(facilitySearch.toLowerCase()) ||
        f.district_name.toLowerCase().includes(facilitySearch.toLowerCase()) ||
        f.operator_name.toLowerCase().includes(facilitySearch.toLowerCase()) ||
        f.water_source.toLowerCase().includes(facilitySearch.toLowerCase());
      const matchType = selectedFacilityType === 'ALL' || f.irrigation_type === selectedFacilityType;
      const matchProv = selectedProvince === 'ALL' || f.province_name.toLowerCase() === selectedProvince.toLowerCase();
      return matchSearch && matchType && matchProv;
    });
  }, [facilitiesList, facilitySearch, selectedFacilityType, selectedProvince]);

  // Export Filtered Table to CSV
  const handleExportCSV = () => {
    const headers = ['District', 'Province', `Irrigated Area (${selectedSeason}) ha`, `Coverage %`, `Previous Irrigated (${compareSeason}) ha`, 'Change %', 'Documented Schemes Count', 'Documented Command ha', 'Water Deficit mm', 'Feasibility Tier'];
    const rows = filteredRankings.map(d => [
      d.district_name,
      d.province_name,
      d.area_irrigated_ha !== null ? d.area_irrigated_ha : 'N/A',
      d.coverage_pct !== null ? `${d.coverage_pct}%` : 'N/A',
      d.prev_irrigated_ha !== null ? d.prev_irrigated_ha : 'N/A',
      d.irrigated_change_pct !== null ? `${d.irrigated_change_pct}%` : 'N/A',
      d.facility_count,
      d.documented_command_ha,
      d.water_deficit_mm,
      d.feasibility_tier,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rwanda_Irrigation_${selectedSeason}_Intelligence.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans select-none animate-in fade-in duration-300">
      
      {/* 1. Top Header Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-cyan-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-cyan-500/20">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-cyan-500/30">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              National Agricultural Planner · Irrigation Opportunity
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Droplets className="w-8 h-8 text-cyan-400" />
              National Irrigation Intelligence
            </h1>
            <p className="text-cyan-100/70 text-sm mt-1 max-w-3xl leading-relaxed">
              Monitor national irrigation performance, track seasonal expansions, explore documented schemes and facilities, and identify candidate districts that merit evidence-based assessment.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              onClick={fetchWorkspaceData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-cyan-300 text-xs font-bold transition-all flex items-center gap-2 border border-slate-700 shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              Export Intelligence CSV
            </button>
          </div>
        </div>
      </div>

      {/* 2. Unified Master Filter Bar */}
      <div className="bg-surface border border-border-main rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-main text-xs text-muted font-bold">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-600" />
            <span className="uppercase tracking-wider">National Agricultural Irrigation Filters</span>
          </div>
          <span className="text-[11px] font-normal text-muted">
            All indicators respond dynamically to selected criteria using PostgreSQL/PostGIS records
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Season Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-500" /> Monitored Season
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full bg-background border border-border-main rounded-xl px-3 py-2 text-xs font-bold text-text-main focus:outline-none focus:border-cyan-600 cursor-pointer"
            >
              {availableSeasons.map(s => (
                <option key={s.code} value={s.code}>
                  {s.label} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Map Indicator Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-600" /> Map Indicator
            </label>
            <select
              value={activeIndicator}
              onChange={(e) => setActiveIndicator(e.target.value as IrrigationIndicatorType)}
              className="w-full bg-background border border-border-main rounded-xl px-3 py-2 text-xs font-bold text-text-main focus:outline-none focus:border-cyan-600 cursor-pointer"
            >
              <option value="coverage_pct">Irrigation Coverage (%)</option>
              <option value="area_irrigated_ha">Irrigated Area (Hectares)</option>
              <option value="facility_count">Documented Facilities Count</option>
              <option value="irrigated_change_pct">Change from Reference Season (%)</option>
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
              className="w-full bg-background border border-border-main rounded-xl px-3 py-2 text-xs font-bold text-text-main focus:outline-none focus:border-cyan-600 cursor-pointer"
            >
              <option value="ALL">All Districts — National View</option>
              <option value="Northern Province">Northern Province</option>
              <option value="Southern Province">Southern Province</option>
              <option value="Eastern Province">Eastern Province</option>
              <option value="Western Province">Western Province</option>
              <option value="Kigali City">Kigali City</option>
            </select>
          </div>

          {/* Facility Type Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3 text-blue-600" /> Facility Asset Type
            </label>
            <select
              value={selectedFacilityType}
              onChange={(e) => setSelectedFacilityType(e.target.value)}
              className="w-full bg-background border border-border-main rounded-xl px-3 py-2 text-xs font-bold text-text-main focus:outline-none focus:border-cyan-600 cursor-pointer"
            >
              <option value="ALL">All Documented Facilities (20)</option>
              {availableFacilityTypes.map(f => (
                <option key={f.type} value={f.type}>
                  {f.type.replace(/_/g, ' ')} ({f.count})
                </option>
              ))}
            </select>
          </div>

          {/* Season Comparison Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" /> Reference Season
            </label>
            <select
              value={compareSeason}
              onChange={(e) => setCompareSeason(e.target.value)}
              className="w-full bg-background border border-border-main rounded-xl px-3 py-2 text-xs font-bold text-text-main focus:outline-none focus:border-cyan-600 cursor-pointer"
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
          
          {/* Recorded Irrigated Area */}
          <div className="bg-surface border border-border-main rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between text-muted text-xs font-bold uppercase tracking-wider mb-1">
              <span>Recorded Irrigated Area</span>
              <Droplets className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-2xl font-black text-text-main mt-1">
              {Math.round(nationalSummary.total_irrigated_ha).toLocaleString()} <span className="text-sm font-bold text-muted">ha</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border-main">
              <span className="text-muted">vs {nationalSummary.compareSeason}:</span>
              {nationalSummary.irrigated_change_pct !== null ? (
                <span className={`font-bold flex items-center gap-0.5 ${
                  nationalSummary.irrigated_change_pct >= 0 ? 'text-agriculture' : 'text-danger'
                }`}>
                  {nationalSummary.irrigated_change_pct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {nationalSummary.irrigated_change_pct > 0 ? '+' : ''}{nationalSummary.irrigated_change_pct}%
                </span>
              ) : (
                <span className="text-muted">No comparison</span>
              )}
            </div>
          </div>

          {/* Irrigation Coverage Rate */}
          <div className="bg-surface border border-border-main rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between text-muted text-xs font-bold uppercase tracking-wider mb-1">
              <span>Irrigation Coverage</span>
              <Gauge className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-text-main mt-1">
              {nationalSummary.national_coverage_pct}% <span className="text-sm font-bold text-muted">of cultivated land</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border-main">
              <span className="text-muted">Valid Denominator:</span>
              <span className="font-bold text-text-main">
                {(Math.round(nationalSummary.total_cultivated_ha / 1000)).toLocaleString()}k ha cultivated
              </span>
            </div>
          </div>

          {/* Documented Infrastructure Facilities */}
          <div className="bg-surface border border-border-main rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between text-muted text-xs font-bold uppercase tracking-wider mb-1">
              <span>Documented Schemes</span>
              <Building2 className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-black text-text-main mt-1">
              {nationalSummary.documented_facilities_count} <span className="text-sm font-bold text-muted">Registered Assets</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border-main">
              <span className="text-muted">Command Footprint:</span>
              <span className="font-bold text-teal-700">
                {Math.round(nationalSummary.total_command_area_ha).toLocaleString()} ha command
              </span>
            </div>
          </div>

          {/* District Data Coverage Card */}
          <div className="bg-surface border border-border-main rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between text-muted text-xs font-bold uppercase tracking-wider mb-1">
              <span>Reporting Completeness</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-text-main mt-1">
              {nationalSummary.districts_reporting} <span className="text-sm font-bold text-muted">/ {nationalSummary.districts_expected} Districts</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border-main">
              <span className="text-muted">NISR Survey Coverage:</span>
              <span className="font-bold text-emerald-600">
                {nationalSummary.data_coverage_pct}% Verified
              </span>
            </div>
          </div>

        </div>
      )}

      {/* 4. Central Workspace: Rwanda Irrigation Map (65%) + District Side Panel (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Rwanda Irrigation Map (7 cols ~ 60-70%) */}
        <div className="lg:col-span-7 bg-surface border border-border-main rounded-2xl shadow-sm overflow-hidden flex flex-col h-[650px] relative">
          
          {/* Map Header */}
          <div className="p-4 border-b border-border-main flex items-center justify-between bg-background/50 z-10 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-600" />
                <h2 className="text-sm font-extrabold text-text-main uppercase tracking-wider">
                  Rwanda Irrigation Performance Map
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                  Interactive GIS
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Displaying <b>{indicatorConfig.label}</b> ({selectedSeason}) across Rwanda's 30 districts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFacilityMarkers(!showFacilityMarkers)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  showFacilityMarkers 
                    ? 'bg-cyan-100 text-cyan-900 border-cyan-300' 
                    : 'bg-background text-muted border-border-main hover:bg-surface'
                }`}
                title="Toggle registered scheme markers on map"
              >
                {showFacilityMarkers ? <Eye className="w-3.5 h-3.5 text-cyan-700" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Schemes</span>
              </button>
              <span className="text-xs font-extrabold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
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
                {cyanRamp.map((color, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: color }} />
                ))}
              </div>

              {/* Quantiles / Scale Numbers */}
              <div className="flex justify-between text-[10px] text-muted font-semibold">
                <span>{indicatorConfig.format(extents.min)}</span>
                <span>{indicatorConfig.format(extents.p50)}</span>
                <span>{indicatorConfig.format(extents.max)}</span>
              </div>

              {/* Missing data explanation & pins note */}
              <div className="mt-2 pt-2 border-t border-border-main space-y-1 text-[10px] text-muted">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-[#94A3B8] shrink-0" />
                  <span>Neutral gray = missing/unreported survey records.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-cyan-600 font-bold">💧 Pins:</span>
                  <span>Documented irrigation schemes (click for capacity & water source).</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: District Intelligence Profile (5 cols ~ 35%) */}
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
                    <div className="flex items-center gap-3 text-xs text-muted mt-1 font-medium">
                      <span>National Rank: <b className="text-text-main">#{selectedDistrict.rank} of 30</b></span>
                      <span>•</span>
                      <span>National Share: <b className="text-cyan-700">{selectedDistrict.national_share_pct}%</b></span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                    selectedDistrict.feasibility_tier.includes('TIER_1') ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                    selectedDistrict.feasibility_tier.includes('TIER_2') ? 'bg-cyan-50 text-cyan-800 border-cyan-300' :
                    'bg-amber-50 text-amber-800 border-amber-300'
                  }`}>
                    {selectedDistrict.feasibility_tier.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Key Metrics Mini-Bar */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border-main text-center">
                  <div className="bg-surface rounded-xl p-2 border border-border-main">
                    <div className="text-[10px] font-bold text-muted uppercase">Irrigated Area</div>
                    <div className="text-sm font-black text-text-main mt-0.5">
                      {selectedDistrict.area_irrigated_ha !== null ? `${Math.round(selectedDistrict.area_irrigated_ha).toLocaleString()} ha` : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-surface rounded-xl p-2 border border-border-main">
                    <div className="text-[10px] font-bold text-muted uppercase">Coverage %</div>
                    <div className="text-sm font-black text-cyan-700 mt-0.5">
                      {selectedDistrict.coverage_pct !== null ? `${selectedDistrict.coverage_pct}%` : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-surface rounded-xl p-2 border border-border-main">
                    <div className="text-[10px] font-bold text-muted uppercase">Facilities</div>
                    <div className="text-sm font-black text-blue-700 mt-0.5">
                      {selectedDistrict.facility_count} Assets
                    </div>
                  </div>
                </div>
              </div>

              {/* District Profile Navigation Tabs */}
              <div className="flex border-b border-border-main bg-background/30 px-3 text-xs font-bold shrink-0">
                {(['OVERVIEW', 'TRENDS', 'FACILITIES', 'OPPORTUNITIES'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDistrictTab(tab)}
                    className={`py-2.5 px-3 border-b-2 transition-all ${
                      districtTab === tab
                        ? 'border-cyan-600 text-cyan-700'
                        : 'border-transparent text-muted hover:text-text-main'
                    }`}
                  >
                    {tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Tab Content Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
                
                {/* TAB 1: OVERVIEW */}
                {districtTab === 'OVERVIEW' && (
                  <div className="space-y-4">
                    {/* Season-over-Season Delta */}
                    <div className="bg-background rounded-xl p-3 border border-border-main">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-text-main">Seasonal Trajectory ({compareSeason} → {selectedSeason})</span>
                        {selectedDistrict.irrigated_change_pct !== null ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1 ${
                            selectedDistrict.irrigated_change_pct >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {selectedDistrict.irrigated_change_pct >= 0 ? '+' : ''}{selectedDistrict.irrigated_change_pct}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted">No comparison</span>
                        )}
                      </div>
                      <p className="text-muted leading-relaxed">
                        In {selectedSeason}, {selectedDistrict.district_name} recorded <b>{Math.round(selectedDistrict.area_irrigated_ha || 0).toLocaleString()} ha</b> under irrigation, representing <b>{selectedDistrict.national_share_pct}%</b> of Rwanda's total seasonal irrigated footprint.
                      </p>
                    </div>

                    {/* Infrastructure & Command Summary */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-text-main uppercase tracking-wider">
                        Documented Irrigation Footprint
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-background rounded-xl p-3 border border-border-main">
                          <span className="text-muted block text-[10px] uppercase font-bold">Documented Command</span>
                          <span className="text-base font-extrabold text-cyan-800">
                            {Math.round(selectedDistrict.documented_command_ha).toLocaleString()} ha
                          </span>
                        </div>
                        <div className="bg-background rounded-xl p-3 border border-border-main">
                          <span className="text-muted block text-[10px] uppercase font-bold">Cultivated Land</span>
                          <span className="text-base font-extrabold text-text-main">
                            {Math.round(selectedDistrict.cultivated_area_ha || 0).toLocaleString()} ha
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Diagnostic Context */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-slate-700">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <Info className="w-4 h-4 text-cyan-600" />
                        <span>Planning Diagnostic Context</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Water Deficit: <b>{selectedDistrict.water_deficit_mm} mm</b> · Drought Index: <b>{selectedDistrict.drought_index}</b> · Average Slope: <b>{selectedDistrict.terrain_slope_pct}%</b>.
                      </p>
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                        Data source: MINAGRI Irrigation Registry & NISR Seasonal Agricultural Survey ({selectedSeason}).
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: SEASONAL TRENDS */}
                {districtTab === 'TRENDS' && (
                  <div className="space-y-3">
                    <div className="font-bold text-text-main">Multi-Season Progression</div>
                    <p className="text-muted text-[11px]">
                      Historical trend of recorded irrigated area across monitored agricultural seasons:
                    </p>

                    <div className="h-48 w-full bg-background rounded-xl p-2 border border-border-main">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={seasonalTrends.slice(-10)}>
                          <defs>
                            <linearGradient id="distIrrGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="season_code" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                          <RechartsTooltip 
                            formatter={(v: any) => [`${Number(v).toLocaleString()} ha`, 'National Total']}
                            contentStyle={{ fontSize: 11, borderRadius: 8 }}
                          />
                          <Area type="monotone" dataKey="total_irrigated_ha" stroke="#0284C7" strokeWidth={2} fill="url(#distIrrGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-background rounded-xl p-3 border border-border-main text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted">Current Irrigated:</span>
                        <span className="font-bold">{selectedDistrict.area_irrigated_ha ? `${Math.round(selectedDistrict.area_irrigated_ha).toLocaleString()} ha` : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Previous ({compareSeason}):</span>
                        <span className="font-bold">{selectedDistrict.prev_irrigated_ha ? `${Math.round(selectedDistrict.prev_irrigated_ha).toLocaleString()} ha` : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-border-main">
                        <span className="text-muted">Net Change:</span>
                        <span className={`font-bold ${
                          (selectedDistrict.irrigated_change_pct ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {selectedDistrict.irrigated_change_pct !== null ? `${selectedDistrict.irrigated_change_pct > 0 ? '+' : ''}${selectedDistrict.irrigated_change_pct}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: FACILITIES */}
                {districtTab === 'FACILITIES' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-main">
                        Assets in {selectedDistrict.district_name} ({facilitiesList.filter(f => f.district_name.toLowerCase() === selectedDistrict.district_name.toLowerCase()).length})
                      </span>
                    </div>

                    {facilitiesList.filter(f => f.district_name.toLowerCase() === selectedDistrict.district_name.toLowerCase()).length > 0 ? (
                      <div className="space-y-2">
                        {facilitiesList
                          .filter(f => f.district_name.toLowerCase() === selectedDistrict.district_name.toLowerCase())
                          .map((fac) => (
                            <div key={fac.id} className="bg-background border border-border-main rounded-xl p-3 space-y-1.5 hover:border-cyan-400 transition-all">
                              <div className="flex items-start justify-between">
                                <span className="font-extrabold text-text-main">{fac.name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-bold">
                                  {fac.irrigation_type.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <div className="text-[11px] text-muted space-y-0.5">
                                <div>Command: <b>{Math.round(fac.area_command_ha).toLocaleString()} ha</b> · Beneficiaries: <b>{fac.beneficiaries_count.toLocaleString()}</b></div>
                                <div>Water Source: <i>{fac.water_source || 'Perennial Stream'}</i></div>
                                <div>Operator: {fac.operator_name}</div>
                              </div>
                              <button
                                onClick={() => handleFocusFacility(fac)}
                                className="mt-1 text-[11px] font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 cursor-pointer"
                              >
                                <Compass className="w-3 h-3" /> Focus on Map
                              </button>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-muted bg-background rounded-xl border border-dashed border-border-main">
                        <Building2 className="w-6 h-6 mx-auto mb-1 text-slate-400 opacity-60" />
                        <div>No documented formal irrigation schemes registered in this district.</div>
                        <div className="text-[10px] mt-1 text-slate-400">Farmers may utilize small-scale informal valley bottom furrow irrigation.</div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: OPPORTUNITIES */}
                {districtTab === 'OPPORTUNITIES' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-main">Evidence-Based Assessment</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-cyan-50 text-cyan-800 border border-cyan-200">
                        Score: {selectedDistrict.opportunity_score} / 100
                      </span>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                        <span>Pre-Feasibility Designation</span>
                      </div>
                      <p className="leading-relaxed">
                        Designated as a <b>Potential Area for Assessment</b> based on high cultivated footprint and seasonal water deficits. This is an indicator for investigation, not an automatic infrastructure commitment.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-text-main text-[11px] uppercase tracking-wider">Required Field Verifications</span>
                      <div className="space-y-1.5">
                        {selectedDistrict.feasibility_prerequisites.map((req, i) => (
                          <div key={i} className="flex items-start gap-2 bg-background p-2 rounded-lg border border-border-main text-[11px]">
                            <CheckSquare className="w-3.5 h-3.5 text-cyan-700 mt-0.5 shrink-0" />
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-[10px] text-muted pt-2 border-t border-border-main">
                      Recommended Engineering Technology: <b>{selectedDistrict.recommended_technology}</b>.
                    </div>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted text-xs">
              Select a district to view intelligence profile
            </div>
          )}

        </div>

      </div>

      {/* 5. Seasonal Irrigation Trends Area Chart (Below Map) */}
      <div className="bg-surface border border-border-main rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-600" />
              <h2 className="text-base font-extrabold text-text-main uppercase tracking-wider">
                National Irrigated Area Trends Across Agricultural Seasons
              </h2>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Chronological multi-season progression in total irrigated hectares and national coverage rate (2014A – {selectedSeason}).
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-cyan-700">
              <span className="w-3 h-3 rounded-full bg-cyan-600 inline-block" />
              <span>Irrigated Area (ha)</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-text-main">
              <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />
              <span>Coverage Rate (%)</span>
            </div>
          </div>
        </div>

        {/* Multi-Season Trend Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={seasonalTrends}>
              <defs>
                <linearGradient id="natIrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="season_code" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k ha`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <RechartsTooltip 
                formatter={(val: any, name: any) => [
                  name === 'total_irrigated_ha' ? `${Math.round(val).toLocaleString()} ha` : `${val}%`,
                  name === 'total_irrigated_ha' ? 'Irrigated Hectares' : 'Coverage Rate'
                ]}
                contentStyle={{ fontSize: 12, borderRadius: 10, borderColor: '#CBD5E1' }}
              />
              <Area yAxisId="left" type="monotone" dataKey="total_irrigated_ha" stroke="#0284C7" strokeWidth={2.5} fill="url(#natIrrGrad)" />
              <Line yAxisId="right" type="monotone" dataKey="coverage_pct" stroke="#0F172A" strokeWidth={2} dot={{ r: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expansion / Stability Alert Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-border-main">
          
          {/* Expanding */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-1">
              <span className="flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-emerald-700" />
                Expanding Districts (&gt;+10%)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800 text-[10px]">
                {alerts.large_expansions.length} Districts
              </span>
            </div>
            <div className="text-[11px] text-emerald-800 flex flex-wrap gap-1">
              {alerts.large_expansions.slice(0, 4).map((d: any) => (
                <span key={d.district_id} className="bg-white/80 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                  {d.district_name} (+{d.irrigated_change_pct}%)
                </span>
              ))}
            </div>
          </div>

          {/* Declining */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs font-bold text-rose-900 mb-1">
              <span className="flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-rose-700" />
                Contracting / Low Maintenance (&lt;-10%)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-rose-200 text-rose-800 text-[10px]">
                {alerts.large_declines.length} Districts
              </span>
            </div>
            <div className="text-[11px] text-rose-800 flex flex-wrap gap-1">
              {alerts.large_declines.length > 0 ? (
                alerts.large_declines.slice(0, 4).map((d: any) => (
                  <span key={d.district_id} className="bg-white/80 px-2 py-0.5 rounded font-semibold border border-rose-200">
                    {d.district_name} ({d.irrigated_change_pct}%)
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-muted italic">No severe contractions recorded this cycle.</span>
              )}
            </div>
          </div>

          {/* Stable */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-slate-600" />
                Stable Infrastructure (±3%)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px]">
                {alerts.stable_districts.length} Districts
              </span>
            </div>
            <div className="text-[11px] text-slate-700 flex flex-wrap gap-1">
              {alerts.stable_districts.slice(0, 4).map((d: any) => (
                <span key={d.district_id} className="bg-white px-2 py-0.5 rounded font-semibold border border-slate-200">
                  {d.district_name} ({d.irrigated_change_pct > 0 ? '+' : ''}{d.irrigated_change_pct}%)
                </span>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 6. District Irrigation Performance Ranking Table */}
      <div className="bg-surface border border-border-main rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-600" />
              <h2 className="text-base font-extrabold text-text-main uppercase tracking-wider">
                District Irrigation Performance Ranking
              </h2>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Ranked district statistics for {selectedSeason} with seasonal deltas vs {compareSeason}. Click a row to inspect district intelligence.
            </p>
          </div>

          {/* Table Search & Tab Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchDistrict}
                onChange={(e) => setSearchDistrict(e.target.value)}
                placeholder="Search district..."
                className="bg-background border border-border-main rounded-xl pl-8 pr-3 py-1.5 text-xs text-text-main focus:outline-none focus:border-cyan-600"
              />
            </div>

            <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border-main text-xs font-bold">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'TOP_IRRIGATED', label: 'Top Irrigated' },
                { id: 'HIGH_COVERAGE', label: 'High Coverage' },
                { id: 'EXPANDING', label: 'Expanding' },
                { id: 'CRITICAL_GAP', label: 'Critical Gap' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRankingFilter(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    rankingFilter === tab.id
                      ? 'bg-cyan-700 text-white shadow-xs'
                      : 'text-muted hover:text-text-main'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto border border-border-main rounded-xl custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-background/80 text-muted font-bold uppercase tracking-wider text-[10px] border-b border-border-main">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">District</th>
                <th className="p-3">Province</th>
                <th className="p-3 text-right">Irrigated Area</th>
                <th className="p-3 text-right">Coverage %</th>
                <th className="p-3 text-right">vs {compareSeason}</th>
                <th className="p-3 text-center">Documented Assets</th>
                <th className="p-3">Feasibility Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {filteredRankings.map((d, index) => {
                const isSelected = selectedDistrictName.toLowerCase() === d.district_name.toLowerCase();
                return (
                  <tr
                    key={d.district_id}
                    onClick={() => {
                      setSelectedDistrictName(d.district_name);
                      selectedDistrictNameRef.current = d.district_name;
                    }}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-cyan-50/80 font-semibold' : 'hover:bg-background/50'
                    }`}
                  >
                    <td className="p-3 font-extrabold text-muted">#{d.rank}</td>
                    <td className="p-3 font-bold text-text-main flex items-center gap-1.5">
                      <span>{d.district_name}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />}
                    </td>
                    <td className="p-3 text-muted">{d.province_name}</td>
                    <td className="p-3 text-right font-bold text-text-main">
                      {d.area_irrigated_ha !== null ? `${Math.round(d.area_irrigated_ha).toLocaleString()} ha` : '—'}
                    </td>
                    <td className="p-3 text-right font-extrabold text-cyan-800">
                      {d.coverage_pct !== null ? `${d.coverage_pct}%` : '—'}
                    </td>
                    <td className="p-3 text-right">
                      {d.irrigated_change_pct !== null ? (
                        <span className={`font-bold flex items-center justify-end gap-0.5 ${
                          d.irrigated_change_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {d.irrigated_change_pct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {d.irrigated_change_pct > 0 ? '+' : ''}{d.irrigated_change_pct}%
                        </span>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-bold border border-blue-200">
                        {d.facility_count}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        d.feasibility_tier.includes('TIER_1') ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        d.feasibility_tier.includes('TIER_2') ? 'bg-cyan-50 text-cyan-800 border-cyan-300' :
                        'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {d.feasibility_tier.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. National Irrigation Facilities & Infrastructure Directory */}
      <div className="bg-surface border border-border-main rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-extrabold text-text-main uppercase tracking-wider">
                National Irrigation Facilities & Schemes Directory
              </h2>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Searchable inventory of documented public and cooperative irrigation schemes recorded in engineering databases.
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={facilitySearch}
              onChange={(e) => setFacilitySearch(e.target.value)}
              placeholder="Search scheme name, water source, operator..."
              className="bg-background border border-border-main rounded-xl pl-8 pr-3 py-1.5 text-xs text-text-main focus:outline-none focus:border-cyan-600 w-64"
            />
          </div>
        </div>

        {/* Facilities Table */}
        <div className="overflow-x-auto border border-border-main rounded-xl custom-scrollbar max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-background/80 text-muted font-bold uppercase tracking-wider text-[10px] border-b border-border-main sticky top-0 backdrop-blur-xs">
              <tr>
                <th className="p-3">Scheme Name</th>
                <th className="p-3">District</th>
                <th className="p-3">Facility Type</th>
                <th className="p-3">Water Source</th>
                <th className="p-3 text-right">Command Area</th>
                <th className="p-3 text-right">Irrigable Area</th>
                <th className="p-3 text-right">Beneficiaries</th>
                <th className="p-3">Operator</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {filteredFacilitiesTable.map(fac => (
                <tr key={fac.id} className="hover:bg-background/50 transition-colors">
                  <td className="p-3 font-bold text-text-main">{fac.name}</td>
                  <td className="p-3 text-muted">{fac.district_name}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[10px] font-bold">
                      {fac.irrigation_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-muted font-medium">{fac.water_source || 'Stream Intake'}</td>
                  <td className="p-3 text-right font-bold text-text-main">{Math.round(fac.area_command_ha).toLocaleString()} ha</td>
                  <td className="p-3 text-right text-muted">{Math.round(fac.area_irrigable_ha).toLocaleString()} ha</td>
                  <td className="p-3 text-right font-semibold text-cyan-800">{fac.beneficiaries_count.toLocaleString()}</td>
                  <td className="p-3 text-muted max-w-[140px] truncate" title={fac.operator_name}>{fac.operator_name}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {fac.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleFocusFacility(fac)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-cyan-100 text-cyan-800 text-[10px] font-bold transition-all"
                    >
                      Locate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. Potential Irrigation Intervention Opportunities (Evidence-Based Screening) */}
      <div className="bg-surface border border-border-main rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-extrabold text-text-main uppercase tracking-wider">
                Potential Irrigation Intervention Opportunities
              </h2>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Evidence-based pre-feasibility screening to guide planners on where field investigation is merited.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            Pre-Feasibility Decision Support
          </span>
        </div>

        {/* Safeguard Notice */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">CRITICAL PLANNING SAFEGUARD:</span> A map showing low recorded irrigation coverage does not automatically conclude that an area has available water, suitable terrain, or economic viability. Wording is strictly designated as <b>“Potential Area for Assessment”</b> until on-the-ground feasibility and environmental permits are verified.
          </div>
        </div>

        {/* Screening Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {opportunityScreening.candidateDistricts.slice(0, 4).map((c: any) => (
            <div key={c.district_id} className="bg-background border border-border-main rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-text-main">{c.district_name}</h3>
                    <span className="text-[10px] text-muted font-bold uppercase">{c.province_name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-cyan-100 text-cyan-900">
                    Score: {c.opportunity_score}
                  </span>
                </div>

                <div className="mt-2.5 text-[11px] text-slate-700 bg-surface p-2.5 rounded-lg border border-border-main space-y-1">
                  <div className="font-bold text-text-main">{c.flag_reason}</div>
                  <div>Coverage: <b className="text-rose-600">{c.coverage_pct}%</b> · Deficit: <b>{c.water_deficit_mm} mm</b></div>
                  <div>Cultivated: <b>{(Math.round(c.cultivated_area_ha / 1000)).toLocaleString()}k ha</b> · Slope: <b>{c.terrain_slope_pct}%</b></div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border-main">
                <div className="text-[10px] text-muted font-bold uppercase">Required Field Verification:</div>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div>• Streamflow & water balance verification</div>
                  <div>• Topography head & soil infiltration survey</div>
                  <div>• REMA environmental safeguard approval</div>
                </div>
                <button
                  onClick={() => {
                    setSelectedDistrictName(c.district_name);
                    selectedDistrictNameRef.current = c.district_name;
                    setDistrictTab('OPPORTUNITIES');
                  }}
                  className="w-full mt-1 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold transition-all text-center"
                >
                  Inspect District Profile
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Criteria Weights Legend */}
        <div className="pt-3 border-t border-border-main text-xs text-muted flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-text-main">Transparent Evaluation Criteria Weights:</span>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {opportunityScreening.criteriaWeights.map((w: any) => (
              <span key={w.name} className="bg-background px-2 py-0.5 rounded border border-border-main">
                {w.name}: <b>{w.weightPct}%</b>
              </span>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
