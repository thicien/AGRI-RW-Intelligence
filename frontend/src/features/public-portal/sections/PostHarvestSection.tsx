import React, { useState } from 'react';
import { 
  Warehouse, Package, AlertTriangle, ShieldCheck, 
  Layers, MapPin, CheckCircle2, TrendingUp, Info, Building2 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid, Cell, PieChart, Pie 
} from 'recharts';
import type { PostHarvestOverview, DistrictRankingItem, PublicFilterState, SafeguardNotice } from '../types';
import RwandaInteractiveMap from '../components/RwandaInteractiveMap';
import DistrictRankingsCard from '../components/DistrictRankingsCard';
import HistoricalComparisonCard from '../components/HistoricalComparisonCard';
import AccessibleDataTable from '../components/AccessibleDataTable';
import { DISTRICT_PROVINCES } from '../publicPortalApi';

interface PostHarvestSectionProps {
  overview: PostHarvestOverview;
  districts: any[];
  facilities: any[];
  gapScreening: any[];
  safeguardNotice: SafeguardNotice;
  filters: PublicFilterState;
  onSelectDistrict: (district: string) => void;
}

export default function PostHarvestSection({
  overview,
  districts,
  facilities,
  gapScreening,
  safeguardNotice,
  filters,
  onSelectDistrict
}: PostHarvestSectionProps) {
  const [activeIndicatorKey, setActiveIndicatorKey] = useState<string>('storage_capacity_gap_mt');

  const rankingIndicators = [
    {
      key: 'storage_capacity_gap_mt',
      label: 'Storage Capacity Deficit',
      unit: 'MT',
      type: 'DERIVED_ESTIMATE' as const,
      description: 'Estimated unhoused market surplus volume calculated from harvest output intended for sale minus documented usable warehouse capacity.',
      source: 'NISR SAS Table 13 & 14 minus MINAGRI Storage Registry'
    },
    {
      key: 'documented_storage_capacity_mt',
      label: 'Documented Storage Capacity',
      unit: 'MT',
      type: 'RECORDED_STATISTIC' as const,
      description: 'Physical storage volume across registered warehouses, cooperative silos, and collection centres.',
      source: 'MINAGRI & RGCC National Strategic Grain Reserve Registry'
    },
    {
      key: 'market_surplus_volume_mt',
      label: 'Market Surplus Volume',
      unit: 'MT',
      type: 'DERIVED_ESTIMATE' as const,
      description: 'Crop tonnage intended for commercial sale by farmers based on reported usage percentages.',
      source: 'NISR SAS Table 13 (Production) × Table 14 (Pct Sold)'
    },
    {
      key: 'investment_opportunity_score',
      label: 'Aggregation Investment Priority',
      unit: '/ 100',
      type: 'MODELLED_ASSESSMENT' as const,
      description: 'Screening index ranking districts where aggregation hubs and drying grounds would achieve maximum loss reduction.',
      source: 'AgriLens Logistics & Aggregation Decision Screening'
    }
  ];

  const rankings: DistrictRankingItem[] = (districts.length > 0 ? districts : []).map((d, index) => {
    let val = 0;
    let unit = 'MT';

    if (activeIndicatorKey === 'storage_capacity_gap_mt') {
      val = parseFloat(d.storage_capacity_gap_mt || d.gap_mt || 0);
      unit = 'MT';
    } else if (activeIndicatorKey === 'documented_storage_capacity_mt') {
      val = parseFloat(d.documented_storage_capacity_mt || d.storage_capacity_mt || 0);
      unit = 'MT';
    } else if (activeIndicatorKey === 'market_surplus_volume_mt') {
      val = parseFloat(d.market_surplus_volume_mt || d.surplus_mt || 0);
      unit = 'MT';
    } else if (activeIndicatorKey === 'investment_opportunity_score') {
      val = parseFloat(d.investment_opportunity_score || d.investment_score || 0);
      unit = '/ 100';
    }

    const dName = d.district_name || d.name || d.district;

    return {
      rank: index + 1,
      district: dName,
      province: d.province_name || DISTRICT_PROVINCES[dName] || 'Rwanda',
      value: val,
      displayValue: val.toLocaleString(),
      unit,
      sourceCitation: activeIndicatorKey === 'investment_opportunity_score'
        ? 'AgriLens Logistics Decision Screening (Modelled)'
        : activeIndicatorKey === 'documented_storage_capacity_mt'
          ? 'MINAGRI & RGCC Grain Reserve Registry (Recorded)'
          : 'NISR SAS Table 13 & 14 (Derived Estimate)',
      methodologyType: activeIndicatorKey === 'investment_opportunity_score'
        ? ('MODELLED_ASSESSMENT' as const)
        : activeIndicatorKey === 'documented_storage_capacity_mt'
          ? ('RECORDED_STATISTIC' as const)
          : ('DERIVED_ESTIMATE' as const),
    };
  }).sort((a, b) => b.value - a.value).map((item, idx) => ({ ...item, rank: idx + 1 }));

  const activeIndObj = rankingIndicators.find(i => i.key === activeIndicatorKey) || rankingIndicators[0];

  // Farmer Produce Usage Breakdown Data (from official SAS Table 14)
  const usageChartData = [
    { name: 'Sold for Cash Income', percentage: overview.national_avg_sold_pct || 61.2, fill: '#10b981' },
    { name: 'Household Consumption', percentage: overview.national_avg_consumed_pct || 35.0, fill: '#3b82f6' },
    { name: 'Stored for Seed / Reserve', percentage: overview.national_avg_stored_pct || 2.8, fill: '#f59e0b' },
    { name: 'Reported Post-Harvest Loss', percentage: overview.national_avg_lost_pct || 1.0, fill: '#ef4444' },
  ];

  if (filters.viewMode === 'table') {
    return (
      <AccessibleDataTable
        sectionTitle="Post-Harvest Collection & Storage Intelligence"
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
      {/* Safeguard Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 text-xs text-amber-950 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <div className="font-extrabold text-amber-950 mb-0.5">
            {safeguardNotice.title || 'Critical Safeguard Notice on Post-Harvest Infrastructure Data'}
          </div>
          <p className="text-amber-900 leading-relaxed text-[11px]">
            {safeguardNotice.content || 'A facility absence in documentation does not prove an absence on the ground. Unrecorded facilities represent potential coverage gaps rather than guaranteed shortages. Loss rates reflect reported farmer observations under NISR SAS Table 14.'}
          </p>
          <div className="mt-1 text-[10px] text-amber-800 font-bold">
            Citation: {safeguardNotice.sourceCitation}
          </div>
        </div>
      </div>

      {/* 1. National Post-Harvest KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Total Production
          </div>
          <div className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
            {(overview.total_crop_production_mt || 3082086).toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">
            Metric Tonnes (MT)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Market Surplus
          </div>
          <div className="text-xl lg:text-2xl font-black text-emerald-800 tracking-tight">
            {(overview.total_market_surplus_volume_mt || 1891795).toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-emerald-700 mt-1">
            Commercial Output (MT)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Documented Storage
          </div>
          <div className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
            {(overview.total_documented_storage_capacity_mt || 353100).toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">
            Usable Capacity (MT)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Cold Storage
          </div>
          <div className="text-xl lg:text-2xl font-black text-cyan-800 tracking-tight">
            {(overview.total_cold_storage_capacity_mt || 28248).toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-cyan-700 mt-1">
            Horticulture Capacity (MT)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Storage Capacity Gap
          </div>
          <div className="text-xl lg:text-2xl font-black text-rose-600 tracking-tight">
            {(overview.total_storage_capacity_gap_mt || 1568562).toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-rose-700 mt-1">
            Deficit vs Surplus (MT)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Distance to Facility
          </div>
          <div className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
            {(overview.national_avg_distance_facility_km || 11.8).toFixed(1)} km
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">
            National Avg Radius
          </div>
        </div>
      </div>

      {/* 2. Farmer Produce Utilization Breakdown (NISR SAS Table 14) */}
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-700" />
              Farmer Production Disposal Patterns (NISR SAS Table 14)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical survey proportions showing how smallholders distribute seasonal crop output
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            NISR SAS Table 14
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {usageChartData.map((u, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 shadow-2xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">{u.name}</span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: u.fill }} />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {u.percentage.toFixed(1)}%
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full rounded-full" 
                  style={{ width: `${u.percentage}%`, backgroundColor: u.fill }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Interactive Map & Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="h-full min-h-[500px]">
          <RwandaInteractiveMap
            section="post-harvest"
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
            sectionTitle="Storage Capacity & Gap Screening"
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
        sectionTitle="Storage Infrastructure & Capacity"
        currentYear={filters.year}
        seasonLetter={filters.seasonLetter}
        cropName="Storage Capacity"
        districtName={filters.district}
      />
    </div>
  );
}
