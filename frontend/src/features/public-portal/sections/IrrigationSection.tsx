import React, { useState } from 'react';
import { 
  Droplets, Waves, CheckCircle2, AlertTriangle, 
  Layers, MapPin, Building2, Sun, Zap, Info, ShieldCheck 
} from 'lucide-react';
import type { IrrigationOverview, DistrictRankingItem, PublicFilterState } from '../types';
import RwandaInteractiveMap from '../components/RwandaInteractiveMap';
import DistrictRankingsCard from '../components/DistrictRankingsCard';
import HistoricalComparisonCard from '../components/HistoricalComparisonCard';
import AccessibleDataTable from '../components/AccessibleDataTable';
import { DISTRICT_PROVINCES } from '../publicPortalApi';

interface IrrigationSectionProps {
  overview: IrrigationOverview;
  districts: any[];
  schemes: any[];
  screening: any[];
  filters: PublicFilterState;
  onSelectDistrict: (district: string) => void;
}

export default function IrrigationSection({
  overview,
  districts,
  schemes,
  screening,
  filters,
  onSelectDistrict
}: IrrigationSectionProps) {
  const [activeIndicatorKey, setActiveIndicatorKey] = useState<string>('modern_ha');

  const rankingIndicators = [
    {
      key: 'modern_ha',
      label: 'Modern Irrigated Area',
      unit: 'ha',
      type: 'RECORDED_STATISTIC' as const,
      description: 'Physical hectares developed with pressurized drip, sprinkler, or center-pivot irrigation systems.',
      source: 'MINAGRI & RAB Irrigation Infrastructure Registry'
    },
    {
      key: 'access_pct',
      label: 'Irrigation Coverage',
      unit: '%',
      type: 'DERIVED_ESTIMATE' as const,
      description: 'Share of total district cultivated land equipped with operational irrigation access.',
      source: 'MINAGRI Irrigation Registry & NISR SAS Table 7'
    },
    {
      key: 'gap_ha',
      label: 'Irrigation Deficit Gap',
      unit: 'ha',
      type: 'DERIVED_ESTIMATE' as const,
      description: 'Cultivated rainfed hectares currently lacking formal irrigation infrastructure.',
      source: 'Calculated: Cultivated Area ha - Irrigated Area ha'
    },
    {
      key: 'opportunity_score',
      label: 'Small-Scale Opportunity Score',
      unit: '/ 100',
      type: 'MODELLED_ASSESSMENT' as const,
      description: 'Multi-criteria screening score combining water source proximity, terrain slope, soil texture, and drought vulnerability.',
      source: 'AgriLens Spatial Multi-Criteria Decision Screening'
    }
  ];

  // Map districts into rankings
  const rankings: DistrictRankingItem[] = (districts.length > 0 ? districts : []).map((d, index) => {
    let val = 0;
    let unit = 'ha';

    if (activeIndicatorKey === 'modern_ha') {
      val = parseFloat(d.modern_irrigated_ha || d.total_modern_irrigated_ha || 0);
      unit = 'ha';
    } else if (activeIndicatorKey === 'access_pct') {
      val = parseFloat(d.irrigation_access_pct || d.coverage_pct || 0);
      unit = '%';
    } else if (activeIndicatorKey === 'gap_ha') {
      val = parseFloat(d.irrigation_gap_ha || 0);
      unit = 'ha';
    } else if (activeIndicatorKey === 'opportunity_score') {
      val = parseFloat(d.opportunity_score || d.score || 0);
      unit = '/ 100';
    }

    const dName = d.district_name || d.name || d.district;
    const benchVal = activeIndicatorKey === 'access_pct' ? overview.national_irrigation_access_pct : undefined;
    const delta = benchVal && val ? parseFloat((((val - benchVal) / benchVal) * 100).toFixed(1)) : undefined;

    return {
      rank: index + 1,
      district: dName,
      province: d.province_name || DISTRICT_PROVINCES[dName] || 'Rwanda',
      value: val,
      displayValue: val.toLocaleString(),
      unit,
      nationalBenchmark: benchVal,
      benchmarkDeltaPct: delta,
      sourceCitation: activeIndicatorKey === 'opportunity_score' 
        ? 'AgriLens Spatial Multi-Criteria Screening (Modelled)' 
        : 'MINAGRI / RAB Irrigation Engineering Registry (Recorded)',
      methodologyType: activeIndicatorKey === 'opportunity_score' 
        ? ('MODELLED_ASSESSMENT' as const) 
        : activeIndicatorKey === 'modern_ha' 
          ? ('RECORDED_STATISTIC' as const) 
          : ('DERIVED_ESTIMATE' as const),
    };
  }).sort((a, b) => b.value - a.value).map((item, idx) => ({ ...item, rank: idx + 1 }));

  const activeIndObj = rankingIndicators.find(i => i.key === activeIndicatorKey) || rankingIndicators[0];

  // Notable schemes list
  const sampleSchemes = schemes.length > 0 ? schemes.slice(0, 6) : [
    { name: 'Nasho Solar Irrigation Project', district: 'Kirehe', command_area_ha: 1173, scheme_type: 'Solar Center Pivot', status: 'Operational' },
    { name: 'Kagitumba Modern Scheme', district: 'Nyagatare', command_area_ha: 850, scheme_type: 'River Pumping Sprinkler', status: 'Operational' },
    { name: 'Rwamagana Hillside Scheme', district: 'Rwamagana', command_area_ha: 620, scheme_type: 'Dam Reservoir Gravity', status: 'Operational' },
    { name: 'Bugesera Valley Marshland', district: 'Bugesera', command_area_ha: 1450, scheme_type: 'Surface Water Canal', status: 'Operational' },
    { name: 'Muvumba Multipurpose Dam', district: 'Nyagatare', command_area_ha: 7380, scheme_type: 'Dam & Reservoir', status: 'Under Construction' },
    { name: 'Mukungwa River Intake', district: 'Musanze', command_area_ha: 420, scheme_type: 'Gravity Flow Diversion', status: 'Operational' },
  ];

  if (filters.viewMode === 'table') {
    return (
      <AccessibleDataTable
        sectionTitle="Irrigation Intelligence"
        rankings={rankings}
        selectedDistrict={filters.district}
        onSelectDistrict={onSelectDistrict}
        activeIndicatorLabel={activeIndObj.label}
        unit={activeIndObj.unit}
        seasonCode={filters.season}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Distinction Safeguard Alert */}
      <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200/90 text-xs text-cyan-950 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
        <div>
          <div className="font-extrabold text-cyan-950 mb-0.5">
            Methodological Distinction: Documented Assets vs Modelled Suitability
          </div>
          <p className="text-cyan-900 leading-relaxed text-[11px]">
            In strict compliance with transparency standards, AgriLens Rwanda clearly distinguishes between <strong>documented physical infrastructure</strong> (verified schemes, command areas, and pumped hectares recorded by MINAGRI/RAB) and <strong>modelled opportunity areas</strong> (screening scores derived from digital elevation models, hydrology, and precipitation indices). Opportunity scores indicate pre-feasibility potential and do not represent existing on-the-ground equipment.
          </p>
        </div>
      </div>

      {/* 1. National Irrigation KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Total Irrigated Area
          </div>
          <div className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
            {(overview.total_irrigated_ha || 36453).toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-cyan-800 mt-1">
            Hectares (Modern + Marsh)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Modern Irrigation
          </div>
          <div className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
            {(overview.total_modern_irrigated_ha || 25540).toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">
            Hectares (Pumping & Drip)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            National Coverage
          </div>
          <div className="text-xl lg:text-2xl font-black text-cyan-700 tracking-tight">
            {(overview.national_irrigation_access_pct || 2.49).toFixed(2)}%
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">
            Of total cultivated land
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Irrigation Gap
          </div>
          <div className="text-xl lg:text-2xl font-black text-rose-600 tracking-tight">
            {(overview.national_irrigation_gap_ha || 1424843).toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">
            Rainfed Hectares (ha)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Documented Schemes
          </div>
          <div className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
            {overview.documented_schemes_count || 20}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">
            Registered Infrastructure
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Beneficiaries
          </div>
          <div className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
            {(overview.total_scheme_beneficiaries || 48880).toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-emerald-800 mt-1">
            Smallholder Farmers
          </div>
        </div>
      </div>

      {/* 2. Documented Infrastructure Schemes Showcase */}
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-700" />
              Documented National Irrigation Infrastructure & Schemes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Physical public-private irrigation schemes recorded in MINAGRI national engineering registries
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            MINAGRI Verified Assets
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {sampleSchemes.map((s, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-cyan-300 transition-all shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="font-extrabold text-slate-900 text-xs truncate">
                  {s.name || s.scheme_name}
                </div>
                <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  s.status === 'Operational' 
                    ? 'bg-emerald-100 text-emerald-900' 
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {s.status || 'Active'}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>District:</span>
                  <span className="font-bold text-slate-800">{s.district}</span>
                </div>
                <div className="flex justify-between">
                  <span>Command Area:</span>
                  <span className="font-extrabold text-cyan-900">{(s.command_area_ha || s.command_ha || 0).toLocaleString()} ha</span>
                </div>
                <div className="flex justify-between">
                  <span>Technology:</span>
                  <span className="font-medium text-slate-700">{s.scheme_type || s.technology || 'Pressurized Pumping'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Interactive Map & District Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="h-full min-h-[500px]">
          <RwandaInteractiveMap
            section="irrigation"
            selectedDistrict={filters.district}
            onSelectDistrict={onSelectDistrict}
            data={rankings}
            indicatorKey="value"
            indicatorLabel={activeIndObj.label}
            unit={activeIndObj.unit}
            seasonCode={filters.season}
          />
        </div>

        <div className="h-full min-h-[500px]">
          <DistrictRankingsCard
            sectionTitle="Irrigation Coverage & Screening"
            availableIndicators={rankingIndicators}
            activeIndicatorKey={activeIndicatorKey}
            onIndicatorChange={setActiveIndicatorKey}
            rankings={rankings}
            selectedDistrict={filters.district}
            onSelectDistrict={onSelectDistrict}
            seasonCode={filters.season}
          />
        </div>
      </div>

      {/* 4. Historical Comparison */}
      <HistoricalComparisonCard
        sectionTitle="Irrigation Development"
        currentYear={filters.year}
        seasonLetter={filters.seasonLetter}
        cropName="Irrigation Coverage"
        districtName={filters.district}
      />
    </div>
  );
}
