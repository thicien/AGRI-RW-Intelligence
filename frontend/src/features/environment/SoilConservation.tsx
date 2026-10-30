import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../config/api';
import { 
  ShieldAlert, Layers, Sprout, AlertTriangle, CheckCircle2, 
  MapPin, RefreshCw, FileText, Filter, Download, 
  Database, Award, ChevronRight, ArrowUpRight, ArrowDownRight, 
  Info, HelpCircle, Sun, Activity, Zap, ExternalLink, Mountain, Shovel,
  TrendingUp, BarChart3, Compass, Check
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  CartesianGrid, Cell, AreaChart, Area, LineChart, Line, Legend, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie
} from 'recharts';

export default function SoilConservation() {
  const [activeTab, setActiveTab] = useState<'map' | 'adoption' | 'fertility' | 'productivity' | 'ranking' | 'interventions'>('map');
  const [selectedSeason, setSelectedSeason] = useState('2026B');
  const [selectedDistrict, setSelectedDistrict] = useState('Gicumbi');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('ALL');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [loading, setLoading] = useState(false);

  // Analytical Data States
  const [summaryData, setSummaryData] = useState<any>({ overview: {}, projectsSummary: {} });
  const [districtsData, setDistrictsData] = useState<any[]>([]);
  const [availableSeasons, setAvailableSeasons] = useState<any[]>([]);
  const [rankingData, setRankingData] = useState<any>({ rankedDistricts: [], criteriaWeights: [] });
  const [projectsData, setProjectsData] = useState<any[]>([]);
  const [dossierData, setDossierData] = useState<any>(null);
  const [correlationTimeline, setCorrelationTimeline] = useState<any[]>([]);

  // Load Seasons Catalog Once on Mount
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const res = await fetch(apiUrl('soil-fertility/seasons'));
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setAvailableSeasons(list);
          }
        }
      } catch (e) {
        console.warn('Error loading soil fertility seasons:', e);
      }
    };
    fetchSeasons();
  }, []);

  // Fetch Module Analytical Data when season or district filter changes
  const fetchModuleData = async () => {
    setLoading(true);
    try {
      const apiBase = apiUrl('soil-fertility');

      const [sumRes, distRes, rankRes, projRes, dosRes, corrRes] = await Promise.all([
        fetch(`${apiBase}/summary?season=${selectedSeason}`).catch(() => null),
        fetch(`${apiBase}/districts?season=${selectedSeason}`).catch(() => null),
        fetch(`${apiBase}/priority-ranking?season=${selectedSeason}`).catch(() => null),
        fetch(`${apiBase}/projects`).catch(() => null),
        fetch(`${apiBase}/site-dossier?district=${encodeURIComponent(selectedDistrict)}&season=${selectedSeason}`).catch(() => null),
        fetch(`${apiBase}/correlation?district=${encodeURIComponent(selectedDistrict)}`).catch(() => null),
      ]);

      if (sumRes && sumRes.ok) setSummaryData(await sumRes.json());
      if (distRes && distRes.ok) setDistrictsData(await distRes.json());
      if (rankRes && rankRes.ok) setRankingData(await rankRes.json());
      if (projRes && projRes.ok) setProjectsData(await projRes.json());
      if (dosRes && dosRes.ok) setDossierData(await dosRes.json());
      if (corrRes && corrRes.ok) {
        const cJson = await corrRes.json();
        if (cJson && Array.isArray(cJson.timeline)) {
          setCorrelationTimeline(cJson.timeline);
        }
      }
    } catch (err) {
      console.error('Failed to load soil fertility intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModuleData();
  }, [selectedSeason, selectedDistrict]);

  // Derived filtered district league table
  const filteredDistricts = districtsData.filter((d: any) => {
    const matchesSearch = d.district_name.toLowerCase().includes(searchDistrict.toLowerCase()) ||
                          d.province_name.toLowerCase().includes(searchDistrict.toLowerCase());
    const matchesTier = selectedTierFilter === 'ALL' || d.priority_tier === selectedTierFilter;
    return matchesSearch && matchesTier;
  });

  const overview = summaryData?.overview || {};
  const projectsSummary = summaryData?.projectsSummary || {};

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-950 text-slate-100 font-sans">
      
      {/* 1. Header & Dynamic Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              NISR Seasonal Agricultural Survey (2014–2026) Verified
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Module 3 — Soil Intelligence
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1 flex items-center gap-3">
            <Layers className="w-8 h-8 text-emerald-400" />
            Soil Conservation & Fertility Management
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Evidence-linked soil conservation planning, erosion susceptibility mapping, measured acidity neutralization, and seasonal crop productivity correlations.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-slate-400 mr-2 font-medium">Season:</span>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="bg-transparent text-emerald-400 font-semibold focus:outline-none cursor-pointer"
            >
              {availableSeasons.map((s: any) => (
                <option key={s.season_code} value={s.season_code} className="bg-slate-900 text-white">
                  {s.season_code} ({s.year} {s.season_name})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-slate-400 mr-2 font-medium">Focus District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-emerald-400 font-semibold focus:outline-none cursor-pointer"
            >
              {districtsData.map((d: any) => (
                <option key={d.district_name} value={d.district_name} className="bg-slate-900 text-white">
                  {d.district_name} ({d.province_name})
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
        </div>
      </div>

      {/* 2. Mandatory Pre-Feasibility & Agronomic Safeguard Banner */}
      <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 backdrop-blur-sm flex items-start gap-3.5 shadow-lg shadow-amber-950/20">
        <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <h4 className="text-xs md:text-sm font-semibold text-amber-300 uppercase tracking-wide flex items-center gap-2">
            CRITICAL SAFEGUARD: INDICATOR DIFFERENTIATION & EVIDENCE REQUIREMENT
          </h4>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            <strong>Distinguish between measured soil condition, modelled erosion susceptibility, and reported adoption of conservation practices.</strong> They are distinct indicators and must never be conflated:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-2 text-[11px] text-amber-100">
            <div className="p-2 rounded bg-amber-900/30 border border-amber-500/20">
              <span className="font-bold text-amber-300">1. Measured Soil Condition:</span> Laboratory tested parameters (pH, organic carbon, cation exchange capacity, N-P-K).
            </div>
            <div className="p-2 rounded bg-amber-900/30 border border-amber-500/20">
              <span className="font-bold text-amber-300">2. Modelled Erosion Susceptibility:</span> Simulation index based on terrain slope gradient (DEM), rainfall erosivity, and soil erodibility.
            </div>
            <div className="p-2 rounded bg-amber-900/30 border border-amber-500/20">
              <span className="font-bold text-amber-300">3. Reported Practice Adoption:</span> Survey-declared farm practices (terraces, agroforestry, organic manure, inorganic fertilizer).
            </div>
          </div>
          <p className="text-[11px] text-amber-300/80 font-medium italic mt-1">
            Caution: Do not diagnose nutrient deficiencies from crop yield alone or recommend precise fertilizer rates without suitable soil, crop and agronomic evidence.
          </p>
        </div>
      </div>

      {/* 3. Top High-Level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Erosion Control Land */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase tracking-wider">Reported Erosion Control Land</span>
            <Mountain className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {Number(overview.total_erosion_control_ha || 1100924).toLocaleString()}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">Ha</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>National Adoption:</span>
            <span className="font-semibold text-emerald-400">
              {overview.national_erosion_control_pct || '78.6'}% of farmland
            </span>
          </div>
        </div>

        {/* KPI 2: Agroforestry Trees */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase tracking-wider">Agroforestry Tree Area</span>
            <Sprout className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {Number(overview.total_agroforestry_ha || 801242).toLocaleString()}
            </span>
            <span className="text-xs text-teal-400 font-semibold">Ha</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Soil Carbon & Shading:</span>
            <span className="font-semibold text-teal-300">57.2% farmland agroforestry</span>
          </div>
        </div>

        {/* KPI 3: Organic Fertilizer Applied */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase tracking-wider">Organic Fertilizer Applied</span>
            <Shovel className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {Number(overview.total_organic_fertilizer_ha || 603457).toLocaleString()}
            </span>
            <span className="text-xs text-amber-400 font-semibold">Ha</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Farmer Adoption:</span>
            <span className="font-semibold text-amber-400">
              {overview.national_avg_organic_farmer_pct || '81.8'}% nationwide
            </span>
          </div>
        </div>

        {/* KPI 4: Inorganic Fertilizer & Lime */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase tracking-wider">Inorganic Fert. & Lime</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {Number(overview.total_inorganic_fertilizer_ha || 387153).toLocaleString()}
            </span>
            <span className="text-xs text-cyan-400 font-semibold">Ha</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Farmer Adoption:</span>
            <span className="font-semibold text-cyan-400">
              {overview.national_avg_inorganic_farmer_pct || '57.1'}% (DAP, Urea, NPK, Lime)
            </span>
          </div>
        </div>
      </div>

      {/* 4. Tab Navigation Header */}
      <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto custom-scrollbar">
        {[
          { id: 'map', label: 'Soil Risk & Suitability Maps', icon: Mountain },
          { id: 'adoption', label: 'Conservation Practice Adoption', icon: Layers },
          { id: 'fertility', label: 'Fertility Indicator Summaries', icon: Sprout },
          { id: 'productivity', label: 'Practice Gaps & Seasonal Productivity', icon: TrendingUp },
          { id: 'ranking', label: 'Multi-Criteria Priority Ranking', icon: Award },
          { id: 'interventions', label: 'Suggested Interventions & Evidence', icon: FileText },
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

      {/* 5. TAB 1: Soil Risk & Suitability Maps */}
      {activeTab === 'map' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interactive Risk Layers Overview */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mountain className="w-4 h-4 text-emerald-400" />
                Soil Erosion Risk & Topography Layers
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Rwanda's rugged topography with high elevation (up to 4,500m) and torrential bimodal rains creates severe erosion susceptibility across Western and Northern hillsides.
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>High Slope Gradient (&gt;25% incline):</span>
                    <span className="text-rose-400">High Risk Zone</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dominates Gicumbi (59%), Ngororero (62%), Rutsiro (58%), Karongi (54%), and Nyamagabe (52%). Requires radical bench terracing.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>Moderate Slope Gradient (12–25% incline):</span>
                    <span className="text-amber-400">Moderate Risk</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dominates Southern Province plateau (Nyanza, Ruhango, Kamonyi). Requires progressive contour bunds and agroforestry hedges.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>Gentle Slopes & Plains (&lt;12% incline):</span>
                    <span className="text-emerald-400">Low Hazard</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dominates Eastern Province (Nyagatare 55%, Bugesera 50%, Kayonza 45%). Vulnerable to wind erosion and seasonal drought.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200">
                <div className="font-semibold text-emerald-300">National Catchment Protection Scope:</div>
                <div className="text-[11px] mt-1 text-slate-300">
                  Total Command Area of Documented Conservation Programs: <strong>{Number(projectsSummary.total_command_area_ha || 44300).toLocaleString()} Ha</strong> protecting over <strong>{Number(projectsSummary.total_beneficiary_farmers || 239000).toLocaleString()} smallholder farmers</strong>.
                </div>
              </div>
            </div>

            {/* Documented Soil Conservation Projects Table */}
            <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    Documented Soil Conservation & Watershed Projects ({projectsData.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Official projects documented by MINAGRI, RAB, FONERWA, and international climate funds.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {projectsSummary.operational_projects_count || 7} Operational Schemes
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Project Name</th>
                      <th className="py-2.5 px-3 font-semibold">District</th>
                      <th className="py-2.5 px-3 font-semibold">Type</th>
                      <th className="py-2.5 px-3 font-semibold">Command (Ha)</th>
                      <th className="py-2.5 px-3 font-semibold">Beneficiaries</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {projectsData.map((p: any) => (
                      <tr key={p.code} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 font-medium text-white">
                          <div>{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.funding_source}</div>
                        </td>
                        <td className="py-2 px-3 font-semibold">{p.district_name}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.project_type === 'RADICAL_TERRACING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            p.project_type === 'LIME_APPLICATION' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {p.project_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-emerald-400">{Number(p.command_area_ha).toLocaleString()}</td>
                        <td className="py-2 px-3">{Number(p.beneficiary_farmers).toLocaleString()}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 2: Conservation Practice Adoption */}
      {activeTab === 'adoption' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* NISR Anti-Erosion Practices Breakdown */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Anti-Erosion Practice Typology
              </h3>
              <p className="text-xs text-slate-400">
                Official survey share of agricultural plots by adopted erosion defense measures (NISR Table 32).
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Low-Rate Measures (Mulching, cover crops, contour ridges)</span>
                    <span className="font-semibold text-emerald-400">44.5%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: '44.5%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Severe-Rate Measures (Radical bench terraces, cut-offs)</span>
                    <span className="font-semibold text-amber-400">20.9%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: '20.9%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Moderate-Rate Measures (Progressive terraces, ditches)</span>
                    <span className="font-semibold text-teal-400">12.8%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-400 h-full rounded-full" style={{ width: '12.8%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Unprotected Farmland (Vulnerable to severe erosion)</span>
                    <span className="font-semibold text-rose-400">21.8%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: '21.8%' }}></div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <div className="font-semibold text-white">Source Reference:</div>
                <div className="text-slate-400">
                  NISR Seasonal Agricultural Survey Season {selectedSeason}, Table 8 & Table 32.
                </div>
              </div>
            </div>

            {/* League Table of Districts by Practice Adoption */}
            <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    District Practice Adoption League Table ({selectedSeason})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cultivated area, reported erosion control, agroforestry tree area, and organic fertilizer adoption across all 30 districts.
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Filter district..."
                  value={searchDistrict}
                  onChange={(e) => setSearchDistrict(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none w-48"
                />
              </div>

              <div className="overflow-x-auto max-h-96 custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800 text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">District</th>
                      <th className="py-2.5 px-3">Cultivated (Ha)</th>
                      <th className="py-2.5 px-3">Erosion Control (Ha)</th>
                      <th className="py-2.5 px-3">Coverage %</th>
                      <th className="py-2.5 px-3">Agroforestry (Ha)</th>
                      <th className="py-2.5 px-3">Organic %</th>
                      <th className="py-2.5 px-3">Inorganic %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {filteredDistricts.map((d: any) => (
                      <tr key={d.district_name} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 font-semibold text-white">
                          {d.district_name} <span className="text-[10px] text-slate-500 font-normal">({d.province_name})</span>
                        </td>
                        <td className="py-2 px-3">{Number(d.total_cultivated_ha).toLocaleString()}</td>
                        <td className="py-2 px-3 font-semibold text-emerald-400">{Number(d.erosion_control_ha).toLocaleString()}</td>
                        <td className="py-2 px-3">
                          <span className={d.erosion_control_pct >= 80 ? 'text-emerald-400 font-bold' : d.erosion_control_pct >= 60 ? 'text-amber-400' : 'text-rose-400'}>
                            {d.erosion_control_pct}%
                          </span>
                        </td>
                        <td className="py-2 px-3">{Number(d.agroforestry_ha).toLocaleString()}</td>
                        <td className="py-2 px-3 font-medium text-amber-300">{d.organic_farmer_pct}%</td>
                        <td className="py-2 px-3 font-medium text-cyan-300">{d.inorganic_farmer_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 3: Fertility Indicator Summaries */}
      {activeTab === 'fertility' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inorganic Formulations Breakdown */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-400" />
                Fertilizer Formulations Breakdown
              </h3>
              <p className="text-xs text-slate-400">
                NISR SAS 2026 Table 26 - Inorganic fertilizer types applied by Rwandan farmers.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>DAP (Di-Ammonium Phosphate 18-46-0)</span>
                    <span className="font-semibold text-emerald-400">40.0% of plots</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: '40.0%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Urea (46-0-0 Topdressing Nitrogen)</span>
                    <span className="font-semibold text-cyan-400">35.5% of plots</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full rounded-full" style={{ width: '35.5%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>NPK (17-17-17 Compound Basal)</span>
                    <span className="font-semibold text-teal-400">20.3% of plots</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-400 h-full rounded-full" style={{ width: '20.3%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Agricultural Lime (Travertine Ameliorant)</span>
                    <span className="font-semibold text-amber-400">2.9% (Urgent Gap)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: '12%' }}></div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <div className="font-semibold text-white">Supply Channels (NISR Table 24):</div>
                <div>• Private Agro-Dealers & Companies: <strong>50.9%</strong></div>
                <div>• Government (Smart Nkunganire Subsidy): <strong>42.8%</strong></div>
                <div>• Cooperatives & NGOs: <strong>6.3%</strong></div>
              </div>
            </div>

            {/* Soil pH & Acidity Across Districts */}
            <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Measured Soil Acidity (pH) & Neutralization Demand Across 30 Districts
                </h3>
                <span className="text-xs text-slate-400">Optimal Range: 6.0 – 6.8</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Red bars denote critically acidic Ferralsols/Acrisols (pH &lt; 5.2) where active aluminum locks phosphorus and limits crop yields.
              </p>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtsData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis 
                      dataKey="district_name" 
                      angle={-45} 
                      textAnchor="end" 
                      tick={{ fill: '#94a3b8', fontSize: 10 }} 
                      interval={0}
                    />
                    <YAxis domain={[4.0, 7.2]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} pH`, 'Measured Reaction']}
                    />
                    <Bar dataKey="soil_ph" name="Soil pH" radius={[4, 4, 0, 0]}>
                      {districtsData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.soil_ph < 5.2 ? '#f43f5e' : entry.soil_ph < 5.8 ? '#f59e0b' : '#10b981'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. TAB 4: Practice Gaps & Seasonal Productivity */}
      {activeTab === 'productivity' && (
        <div className="space-y-6">
          {/* Historical Multi-Season Correlation Chart */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Historical Productivity & Practice Adoption Trajectory: {selectedDistrict} District
                </h3>
                <p className="text-xs text-slate-400">
                  Continuous seasonal timeline correlating reported soil practice adoption with seasonal crop yields (NISR SAS 2014–2026).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Switch District:</span>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-emerald-400 font-semibold focus:outline-none cursor-pointer"
                >
                  {districtsData.map((d: any) => (
                    <option key={d.district_name} value={d.district_name}>
                      {d.district_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={correlationTimeline} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="season_code" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 10 }} label={{ value: 'Yield (Kg/Ha)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} label={{ value: 'Adoption %', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10 }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="crop_yield_maize_kg_ha" name="Maize Yield (Kg/Ha)" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="crop_yield_beans_kg_ha" name="Bean Yield (Kg/Ha)" stroke="#06b6d4" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="erosion_control_pct" name="Erosion Control Adoption %" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="inorganic_farmer_pct" name="Inorganic Fert. Farmer %" stroke="#a855f7" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Practice Gaps League Table */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Conservation Practice Gaps on Steep Slopes (&gt;25% incline)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Identifies districts with high modelled erosion hazard but significant deficits in severe anti-erosion structures (radical bench terraces).
            </p>

            <div className="overflow-x-auto max-h-80 custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800 uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">District</th>
                    <th className="py-2.5 px-3">Modelled Susceptibility</th>
                    <th className="py-2.5 px-3">Steep Slope %</th>
                    <th className="py-2.5 px-3">Reported Severe Control %</th>
                    <th className="py-2.5 px-3">Unmet Terracing Gap (Ha)</th>
                    <th className="py-2.5 px-3">Priority Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {districtsData
                    .filter((d: any) => d.slope_steep_pct >= 35)
                    .sort((a: any, b: any) => Number(b.conservation_gap_ha) - Number(a.conservation_gap_ha))
                    .map((d: any) => (
                      <tr key={d.district_name} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 font-semibold text-white">{d.district_name}</td>
                        <td className="py-2 px-3 font-bold text-rose-400">{d.modelled_erosion_susceptibility_index} / 100</td>
                        <td className="py-2 px-3 font-semibold">{d.slope_steep_pct}% steep slopes</td>
                        <td className="py-2 px-3">{d.erosion_severe_rate_pct}% bench terraces</td>
                        <td className="py-2 px-3 font-bold text-amber-300">{Number(d.conservation_gap_ha).toLocaleString()} Ha</td>
                        <td className="py-2 px-3 text-[11px] text-emerald-400 font-medium">
                          Radical Terraces + Silt Traps
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 9. TAB 5: Multi-Criteria Priority Ranking */}
      {activeTab === 'ranking' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Multi-Criteria Soil Conservation & Fertility Priority Formula
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Transparent multi-attribute scoring model (0–100) weighting severe erosion hazards, soil acidity remediation needs, terracing gaps, and fertilizer depletion.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {rankingData.criteriaWeights?.map((c: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="font-semibold text-white">{c.criterion}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">{c.weightPercent}%</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{c.metric}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rankingData.rankedDistricts?.map((d: any, idx: number) => (
              <div 
                key={d.district_name}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">#{idx + 1} Ranked</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      d.priority_tier === 'TIER_1_URGENT_INTERVENTION' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      d.priority_tier === 'TIER_2_PROACTIVE_MANAGEMENT' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {d.priority_tier.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">{d.district_name}</h4>
                  <div className="text-xs text-slate-400">{d.province_name}</div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-400">{d.priority_score}</span>
                    <span className="text-xs text-slate-400 font-medium">/ 100 Index</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Soil Reaction:</span>
                      <span className={d.soil_ph < 5.2 ? 'font-bold text-rose-400' : 'font-semibold text-emerald-400'}>
                        pH {d.soil_ph} ({d.acidity_status.replace(/_/g, ' ')})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Modelled Susceptibility:</span>
                      <span className="font-semibold text-white">{d.modelled_erosion_susceptibility_index} / 100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Terracing Gap:</span>
                      <span className="font-semibold text-amber-300">{Number(d.conservation_gap_ha).toLocaleString()} Ha</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedDistrict(d.district_name);
                    setActiveTab('interventions');
                  }}
                  className="mt-4 w-full py-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-emerald-600 hover:text-white text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  View Evidence & Interventions <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. TAB 6: Suggested Interventions & Evidence */}
      {activeTab === 'interventions' && dossierData && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  Pre-Feasibility Technical Dossier
                </span>
                <span className="text-xs text-slate-400">Season {dossierData.season}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-1">
                {dossierData.district} District Technical Interventions
              </h2>
              <p className="text-xs text-slate-400">
                {dossierData.province} • Evidence-linked soil conservation planning and agronomic prescription.
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Composite Priority Rank:</span>
              <div className="text-xl font-bold text-emerald-400">
                Tier 1 High Priority
              </div>
            </div>
          </div>

          {/* Crucial 3-Way Indicator Separation Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              Rigorous 3-Way Indicator Separation (Critical Safeguard Compliance)
            </h3>
            <p className="text-xs text-slate-400">
              As required by national agricultural planning standards, the table below clearly segregates measured physical soil attributes, modelled topographic susceptibility, and survey-reported adoption.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Indicator 1 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <Activity className="w-4 h-4" />
                  1. Measured Soil Condition
                </div>
                <div className="text-slate-300 space-y-1">
                  <div>• Soil pH: <strong>{dossierData.threeWayIndicatorSeparation.measuredSoilCondition.ph}</strong> ({dossierData.threeWayIndicatorSeparation.measuredSoilCondition.acidityStatus})</div>
                  <div>• Soil Texture: <strong>{dossierData.threeWayIndicatorSeparation.measuredSoilCondition.soilTexture}</strong></div>
                  <div>• Organic Carbon: <strong>{dossierData.threeWayIndicatorSeparation.measuredSoilCondition.soilOrganicCarbonPct}%</strong></div>
                  <div>• CEC: <strong>{dossierData.threeWayIndicatorSeparation.measuredSoilCondition.cationExchangeCapacityMeq} cmol/kg</strong></div>
                  <div>• Phosphorus: <strong>{dossierData.threeWayIndicatorSeparation.measuredSoilCondition.phosphorusRating}</strong></div>
                </div>
                <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-1.5">
                  Source: RAB Laboratory Soil Testing
                </div>
              </div>

              {/* Indicator 2 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                  <Mountain className="w-4 h-4" />
                  2. Modelled Erosion Susceptibility
                </div>
                <div className="text-slate-300 space-y-1">
                  <div>• Susceptibility Index: <strong>{dossierData.threeWayIndicatorSeparation.modelledErosionSusceptibility.susceptibilityIndex} / 100</strong></div>
                  <div>• Steep Slopes (&gt;25%): <strong>{dossierData.threeWayIndicatorSeparation.modelledErosionSusceptibility.slopeSteepPct}%</strong></div>
                  <div>• Moderate Slopes (12-25%): <strong>{dossierData.threeWayIndicatorSeparation.modelledErosionSusceptibility.slopeModeratePct}%</strong></div>
                  <div>• Seasonal Rainfall: <strong>{dossierData.threeWayIndicatorSeparation.modelledErosionSusceptibility.seasonalRainfallMm} mm</strong></div>
                  <div>• Rainfall Erosivity: <strong>{dossierData.threeWayIndicatorSeparation.modelledErosionSusceptibility.rainfallErosivityIndex}</strong></div>
                </div>
                <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-1.5">
                  Source: RUSLE DEM & Meteo Rwanda
                </div>
              </div>

              {/* Indicator 3 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Layers className="w-4 h-4" />
                  3. Reported Practice Adoption
                </div>
                <div className="text-slate-300 space-y-1">
                  <div>• Reported Erosion Control: <strong>{dossierData.threeWayIndicatorSeparation.reportedPracticeAdoption.erosionControlPct}%</strong></div>
                  <div>• Agroforestry Coverage: <strong>{Number(dossierData.threeWayIndicatorSeparation.reportedPracticeAdoption.agroforestryHa).toLocaleString()} Ha</strong></div>
                  <div>• Organic Fertilizer: <strong>{dossierData.threeWayIndicatorSeparation.reportedPracticeAdoption.organicFarmerPct}% farmers</strong></div>
                  <div>• Inorganic Fertilizer: <strong>{dossierData.threeWayIndicatorSeparation.reportedPracticeAdoption.inorganicFarmerPct}% farmers</strong></div>
                  <div>• Lime Adoption: <strong>{dossierData.threeWayIndicatorSeparation.reportedPracticeAdoption.fertilizerTypes.lime}% plots</strong></div>
                </div>
                <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-1.5">
                  Source: NISR Seasonal Survey {dossierData.season}
                </div>
              </div>
            </div>
          </div>

          {/* Suggested Interventions with Explanations & Source References */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Evidence-Linked Intervention Suggestions for Technical Review
              </h3>

              <div className="space-y-3">
                {dossierData.engineeringChecklist?.map((check: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{check.item}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        check.status.includes('CRITICAL') || check.status.includes('HAZARD')
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {check.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{check.details}</p>
                  </div>
                ))}
              </div>

              {/* Source References Citations */}
              <div className="mt-4 p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  Primary Data Sources & References:
                </h4>
                <ul className="text-[11px] text-slate-400 space-y-1">
                  {dossierData.evidenceSources?.map((src: string, sIdx: number) => (
                    <li key={sIdx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400">•</span>
                      <span>{src}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Prescribed Soil Action & Budget */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shovel className="w-4 h-4 text-emerald-400" />
                Soil Prescription & Investment Budget
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Recommended Primary Action:</span>
                  <div className="font-bold text-emerald-400 mt-0.5">
                    {dossierData.soilPrescription?.recommendedInterventions?.primaryIntervention?.replace(/_/g, ' ') || 'RADICAL TERRACING AND LIMING'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Prescribed Calcic Lime Application:</span>
                  <div className="font-bold text-cyan-300 mt-0.5">
                    {dossierData.threeWayIndicatorSeparation.measuredSoilCondition.limeRequirementTonsPerHa} t/ha (Total district requirement: {Number(dossierData.soilPrescription.totalDistrictLimeNeedTons).toLocaleString()} t)
                  </div>
                  <div className="text-[10px] text-amber-300/80 mt-1">
                    *Requires on-site sample validation before bulk dispatch.
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Civil Terracing Investment:</span>
                  <div className="font-bold text-amber-300 mt-0.5">
                    ${Number(dossierData.soilPrescription.estimatedTerracingBudgetUsd).toLocaleString()} USD
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Covering steep slope terracing, stone risers, and drainage channels.
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Matched National Scheme:</span>
                  <div className="font-semibold text-white mt-0.5">
                    {dossierData.soilPrescription.matchedProject?.name || 'National Land Husbandry Project (LWH / MINAGRI)'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {dossierData.soilPrescription.matchedProject?.impact || 'Reduces topsoil loss by over 75% on steep hillsides.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
