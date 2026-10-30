import React, { useState } from 'react';
import { 
  Leaf, Mountain, AlertTriangle, ShieldCheck, 
  FlaskConical, CheckCircle2, TrendingUp, Info 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid, Cell, PieChart, Pie 
} from 'recharts';
import type { SoilOverview, DistrictRankingItem, PublicFilterState } from '../types';
import RwandaInteractiveMap from '../components/RwandaInteractiveMap';
import DistrictRankingsCard from '../components/DistrictRankingsCard';
import HistoricalComparisonCard from '../components/HistoricalComparisonCard';
import AccessibleDataTable from '../components/AccessibleDataTable';
import { DISTRICT_PROVINCES } from '../publicPortalApi';

interface SoilSectionProps {
  overview: SoilOverview;
  districts: any[];
  ranking: any[];
  projects: any[];
  filters: PublicFilterState;
  onSelectDistrict: (district: string) => void;
}

export default function SoilSection({
  overview,
  districts,
  ranking,
  projects,
  filters,
  onSelectDistrict
}: SoilSectionProps) {
  const [activeIndicatorKey, setActiveIndicatorKey] = useState<string>('erosion_control_pct');

  const rankingIndicators = [
    {
      key: 'erosion_control_pct',
      label: 'Erosion Control Coverage',
      unit: '%',
      type: 'RECORDED_STATISTIC' as const,
      description: 'Percentage of cultivated land with documented anti-erosion structures (terraces, trenches, hedgerows).',
      source: 'NISR SAS Table 32: Anti-erosion activities per district'
    },
    {
      key: 'agroforestry_ha',
      label: 'Agroforestry Footprint',
      unit: 'ha',
      type: 'RECORDED_STATISTIC' as const,
      description: 'Total farmland integrated with multi-purpose agroforestry tree species.',
      source: 'NISR SAS Table 8 & RAB National Agroforestry Strategy'
    },
    {
      key: 'soil_ph',
      label: 'Soil Acidity Level (pH)',
      unit: 'pH',
      type: 'RECORDED_STATISTIC' as const,
      description: 'Laboratory-measured soil reaction (values < 5.5 indicate severe acidity requiring calcic lime).',
      source: 'RAB National Soil Laboratory Testing Database'
    },
    {
      key: 'erosion_susceptibility',
      label: 'Modelled Erosion Risk Index',
      unit: '/ 100',
      type: 'MODELLED_ASSESSMENT' as const,
      description: 'RUSLE slope-climate vulnerability index highlighting areas needing emergency conservation attention.',
      source: 'Terrain Slope DEM 30m & Meteo Rwanda Precipitation Index'
    }
  ];

  const rankings: DistrictRankingItem[] = (districts.length > 0 ? districts : []).map((d, index) => {
    let val = 0;
    let unit = '%';

    if (activeIndicatorKey === 'erosion_control_pct') {
      val = parseFloat(d.erosion_control_pct || d.pct_erosion_control || 0);
      unit = '%';
    } else if (activeIndicatorKey === 'agroforestry_ha') {
      val = parseFloat(d.agroforestry_ha || 0);
      unit = 'ha';
    } else if (activeIndicatorKey === 'soil_ph') {
      val = parseFloat(d.soil_ph || 5.6);
      unit = 'pH';
    } else if (activeIndicatorKey === 'erosion_susceptibility') {
      val = parseFloat(d.modelled_erosion_susceptibility_index || d.erosion_score || 0);
      unit = '/ 100';
    }

    const dName = d.district_name || d.name || d.district;
    const benchVal = activeIndicatorKey === 'erosion_control_pct' ? overview.national_erosion_control_pct : undefined;
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
      sourceCitation: activeIndicatorKey === 'erosion_susceptibility' 
        ? 'RUSLE Terrain Model & Meteo Rwanda (Modelled)' 
        : 'NISR Seasonal Agricultural Survey Table 32 / RAB Soil Lab (Recorded)',
      methodologyType: activeIndicatorKey === 'erosion_susceptibility' 
        ? ('MODELLED_ASSESSMENT' as const) 
        : ('RECORDED_STATISTIC' as const),
    };
  }).sort((a, b) => {
    // For pH, lower is worse (more acidic), but standard sort descending
    return b.value - a.value;
  }).map((item, idx) => ({ ...item, rank: idx + 1 }));

  const activeIndObj = rankingIndicators.find(i => i.key === activeIndicatorKey) || rankingIndicators[0];

  // Fertilizer usage breakdown chart data
  const fertilizerChartData = [
    { name: 'Urea', percentage: overview.avg_urea_pct || 39.1, fill: '#3b82f6' },
    { name: 'DAP', percentage: overview.avg_dap_pct || 36.5, fill: '#10b981' },
    { name: 'NPK', percentage: overview.avg_npk_pct || 21.1, fill: '#f59e0b' },
    { name: 'Lime', percentage: overview.avg_lime_pct || 2.0, fill: '#8b5cf6' },
    { name: 'Other', percentage: 1.3, fill: '#94a3b8' },
  ];

  if (filters.viewMode === 'table') {
    return (
      <AccessibleDataTable
        sectionTitle="Soil Conservation & Fertility Intelligence"
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
      {/* 1. National Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Erosion Control
          </div>
          <div className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
            {(overview.total_erosion_control_ha || 1100924).toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-emerald-800 mt-1">
            Hectares Protected
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Protection Coverage
          </div>
          <div className="text-xl lg:text-2xl font-black text-emerald-700 tracking-tight">
            {(overview.national_erosion_control_pct || 78.6).toFixed(1)}%
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">
            Of cultivated land
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Agroforestry Area
          </div>
          <div className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
            {(overview.total_agroforestry_ha || 801242).toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">
            Farmland Hectares (ha)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Organic Fertilizer
          </div>
          <div className="text-xl lg:text-2xl font-black text-emerald-950 tracking-tight">
            {(overview.national_avg_organic_farmer_pct || 81.8).toFixed(1)}%
          </div>
          <div className="text-[11px] font-bold text-emerald-800 mt-1">
            Farmer Adoption Rate
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Average Soil pH
          </div>
          <div className="text-xl lg:text-2xl font-black text-amber-700 tracking-tight">
            {(overview.national_avg_soil_ph || 5.61).toFixed(2)}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">
            Moderately Acidic
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Conservation Gap
          </div>
          <div className="text-xl lg:text-2xl font-black text-rose-600 tracking-tight">
            {(overview.total_conservation_gap_ha || 71125).toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">
            Hectares Needing Works
          </div>
        </div>
      </div>

      {/* 2. Soil Nutrients & Fertilizer Profile */}
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-emerald-700" />
              Inorganic Fertilizer Application Breakdown (NISR SAS Table 26)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Proportionate utilization of mineral fertilizers and lime across Rwanda's agricultural districts
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            RAB Soil Laboratory Benchmark
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Chart */}
          <div className="lg:col-span-2 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fertilizerChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" unit="%" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip formatter={(val: any) => [`${val}%`, 'Adoption Share']} />
                <Bar dataKey="percentage" radius={[0, 6, 6, 0]}>
                  {fertilizerChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Context Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="font-extrabold text-slate-900 text-xs">
              Soil Health Insight:
            </div>
            <p className="text-[11px] leading-relaxed">
              While <strong>Urea (39.1%)</strong> and <strong>DAP (36.5%)</strong> dominate inorganic use, agricultural lime usage remains at only <strong>2.0%</strong> despite 3 western highland districts exhibiting critical acidity (pH &lt; 5.0).
            </p>
            <div className="pt-2 border-t border-slate-200 text-[10px] text-emerald-800 font-bold">
              Recommendation: Expanded lime subsidies in Nyamagabe, Nyaruguru, and Gicumbi.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Map & Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="h-full min-h-[500px]">
          <RwandaInteractiveMap
            section="soil"
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
            sectionTitle="Soil Conservation & Soil Health"
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
        sectionTitle="Soil Conservation Practices"
        currentYear={filters.year}
        seasonLetter={filters.seasonLetter}
        cropName="Erosion Control"
        districtName={filters.district}
      />
    </div>
  );
}
