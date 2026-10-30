import React, { useState } from 'react';
import { 
  Sprout, TrendingUp, BarChart3, MapPin, 
  Layers, CheckCircle2, AlertTriangle, ArrowUpRight, 
  ArrowDownRight, Info, Award, PieChart as PieIcon 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid, Cell, AreaChart, Area, PieChart, Pie 
} from 'recharts';
import type { ProductivityOverview, CropStatItem, DistrictRankingItem, PublicFilterState } from '../types';
import RwandaInteractiveMap from '../components/RwandaInteractiveMap';
import DistrictRankingsCard from '../components/DistrictRankingsCard';
import HistoricalComparisonCard from '../components/HistoricalComparisonCard';
import AccessibleDataTable from '../components/AccessibleDataTable';
import { DISTRICT_PROVINCES } from '../publicPortalApi';

interface ProductivitySectionProps {
  overview: ProductivityOverview;
  crops: CropStatItem[];
  districtComparisons: any[];
  benchmark: any;
  filters: PublicFilterState;
  onSelectDistrict: (district: string) => void;
  onSelectCrop: (crop: string) => void;
}

export default function ProductivitySection({
  overview,
  crops,
  districtComparisons,
  benchmark,
  filters,
  onSelectDistrict,
  onSelectCrop
}: ProductivitySectionProps) {
  const [activeIndicatorKey, setActiveIndicatorKey] = useState<string>('yield');

  // Indicators available for ranking in productivity
  const rankingIndicators = [
    {
      key: 'yield',
      label: 'Crop Yield',
      unit: 't/ha',
      type: 'RECORDED_STATISTIC' as const,
      description: 'Weighted yield calculated from measured crop production divided by harvested area.',
      source: 'NISR Seasonal Agricultural Survey Table 15 & Table 13'
    },
    {
      key: 'production',
      label: 'Total Production',
      unit: 'MT',
      type: 'RECORDED_STATISTIC' as const,
      description: 'Total harvested output in metric tonnes across agricultural sample segments.',
      source: 'NISR Seasonal Agricultural Survey Table 13'
    },
    {
      key: 'area',
      label: 'Cultivated Area',
      unit: 'ha',
      type: 'RECORDED_STATISTIC' as const,
      description: 'Total land area cultivated under this crop within the district territory.',
      source: 'NISR Seasonal Agricultural Survey Table 7'
    },
    {
      key: 'loss',
      label: 'Unharvested Loss Rate',
      unit: '%',
      type: 'DERIVED_ESTIMATE' as const,
      description: 'Percentage of cultivated area not brought to harvest due to drought, pest, or transit damage.',
      source: 'NISR Seasonal Agricultural Survey Table 7 & 8'
    }
  ];

  // Convert district comparisons to normalized DistrictRankingItem
  const rankings: DistrictRankingItem[] = districtComparisons.map((d, index) => {
    let val = 0;
    let unit = 't/ha';

    if (activeIndicatorKey === 'yield') {
      val = parseFloat(d.yield_t_ha || d.district_yield || d.yield || 0);
      unit = 't/ha';
    } else if (activeIndicatorKey === 'production') {
      val = parseFloat(d.production_tonnes || d.production_mt || d.production || 0);
      unit = 'MT';
    } else if (activeIndicatorKey === 'area') {
      val = parseFloat(d.cultivated_area_ha || d.area_ha || d.area || 0);
      unit = 'ha';
    } else if (activeIndicatorKey === 'loss') {
      val = parseFloat(d.unharvested_loss_pct || d.loss_pct || 0);
      unit = '%';
    }

    const dName = d.district_name || d.name || d.district;
    const benchVal = benchmark?.national_mean_yield || overview.weighted_national_yield_t_ha || 1.8;
    const delta = activeIndicatorKey === 'yield' && benchVal > 0 
      ? parseFloat((((val - benchVal) / benchVal) * 100).toFixed(1)) 
      : undefined;

    return {
      rank: index + 1,
      district: dName,
      province: d.province_name || DISTRICT_PROVINCES[dName] || 'Rwanda',
      value: val,
      displayValue: val.toLocaleString(),
      unit,
      nationalBenchmark: benchVal,
      benchmarkDeltaPct: delta,
      sourceCitation: 'NISR Seasonal Agricultural Survey (SAS) Table 13 & Table 15',
      methodologyType: activeIndicatorKey === 'loss' ? ('DERIVED_ESTIMATE' as const) : ('RECORDED_STATISTIC' as const),
    };
  }).sort((a, b) => b.value - a.value).map((item, idx) => ({ ...item, rank: idx + 1 }));

  const activeIndObj = rankingIndicators.find(i => i.key === activeIndicatorKey) || rankingIndicators[0];

  // Data for Crop Production Bar Chart (Top 8 crops)
  const topCropsChartData = (crops.length > 0 ? crops : [
    { crop_name: 'Maize', production_tonnes: 485200, cultivated_area_ha: 265000, yield_t_ha: 1.83 },
    { crop_name: 'Beans', production_tonnes: 395100, cultivated_area_ha: 310000, yield_t_ha: 1.27 },
    { crop_name: 'Irish Potato', production_tonnes: 720500, cultivated_area_ha: 85000, yield_t_ha: 8.47 },
    { crop_name: 'Cassava', production_tonnes: 840000, cultivated_area_ha: 145000, yield_t_ha: 5.79 },
    { crop_name: 'Banana', production_tonnes: 1250000, cultivated_area_ha: 180000, yield_t_ha: 6.94 },
    { crop_name: 'Rice', production_tonnes: 145000, cultivated_area_ha: 32000, yield_t_ha: 4.53 },
    { crop_name: 'Sorghum', production_tonnes: 110000, cultivated_area_ha: 75000, yield_t_ha: 1.46 },
    { crop_name: 'Sweet Potato', production_tonnes: 340000, cultivated_area_ha: 62000, yield_t_ha: 5.48 },
  ]).slice(0, 8);

  // If Accessible Table view is toggled
  if (filters.viewMode === 'table') {
    return (
      <AccessibleDataTable
        sectionTitle="Agricultural Productivity Intelligence"
        rankings={rankings}
        selectedDistrict={filters.district}
        onSelectDistrict={onSelectDistrict}
        activeIndicatorLabel={`${filters.crop} ${activeIndObj.label}`}
        unit={activeIndObj.unit}
        seasonCode={filters.season}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. National Overview KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Total Production */}
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Total Production
          </div>
          <div className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
            {(overview.total_production_mt || 5833527).toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-emerald-800 mt-1 flex items-center gap-1">
            <span>Metric Tonnes (MT)</span>
          </div>
        </div>

        {/* Card 2: Cultivated Area */}
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Cultivated Area
          </div>
          <div className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
            {(overview.total_cultivated_area_ha || 1461296).toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">
            Hectares (ha)
          </div>
        </div>

        {/* Card 3: Harvested Area */}
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Harvested Area
          </div>
          <div className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
            {(overview.total_harvested_area_ha || 1395800).toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">
            Hectares (ha)
          </div>
        </div>

        {/* Card 4: Weighted Yield */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 mb-1">
            Weighted Natl Yield
          </div>
          <div className="text-xl lg:text-2xl font-black text-emerald-950 tracking-tight">
            {(overview.weighted_national_yield_t_ha || 3.98).toFixed(2)}
          </div>
          <div className="text-[11px] font-bold text-emerald-800 mt-1">
            Tonnes / Ha
          </div>
        </div>

        {/* Card 5: Crops Monitored */}
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Crops Monitored
          </div>
          <div className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
            {overview.total_crops_monitored || 25}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">
            Official SAS Crops
          </div>
        </div>

        {/* Card 6: Harvest Realization */}
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Unharvested Loss
          </div>
          <div className="text-xl lg:text-2xl font-black text-rose-600 tracking-tight">
            {(overview.national_unharvested_rate_pct || 4.5).toFixed(1)}%
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">
            Cultivated loss rate
          </div>
        </div>
      </div>

      {/* 2. Top Crops Visual Comparison Section */}
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-700" />
              National Crop Output Breakdown · {filters.season}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative volume (MT) and area (ha) across primary food security and commercial crops
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Quick Select:</span>
            <div className="flex flex-wrap gap-1">
              {['Maize', 'Beans', 'Irish Potato', 'Rice'].map(c => (
                <button
                  key={c}
                  onClick={() => onSelectCrop(c)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    filters.crop === c
                      ? 'bg-[#14532d] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCropsChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="crop_name" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#e2e8f0' }} 
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} 
              />
              <Tooltip 
                formatter={(val: any, name: any) => [
                  `${Number(val).toLocaleString()} MT`, 
                  'Production Output'
                ]}
                contentStyle={{ 
                  backgroundColor: '#062013', 
                  borderRadius: '12px', 
                  color: '#fff', 
                  fontSize: '12px',
                  border: 'none',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                }}
              />
              <Bar dataKey="production_tonnes" radius={[6, 6, 0, 0]}>
                {topCropsChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.crop_name === filters.crop ? '#15803d' : '#86efac'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Click any crop pill above to update district ranking tables and territorial map.</span>
          <span className="font-bold text-slate-700">Source: NISR SAS Table 13</span>
        </div>
      </div>

      {/* 3. Interactive Rwanda Map & District Rankings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left: Map */}
        <div className="h-full min-h-[500px]">
          <RwandaInteractiveMap
            section="productivity"
            selectedDistrict={filters.district}
            onSelectDistrict={onSelectDistrict}
            data={rankings}
            indicatorKey="value"
            indicatorLabel={`${filters.crop} ${activeIndObj.label}`}
            unit={activeIndObj.unit}
            seasonCode={filters.season}
          />
        </div>

        {/* Right: District Rankings Card */}
        <div className="h-full min-h-[500px]">
          <DistrictRankingsCard
            sectionTitle="Agricultural Productivity"
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

      {/* 4. Equivalent Season Historical Comparison */}
      <HistoricalComparisonCard
        sectionTitle="Agricultural Productivity"
        currentYear={filters.year}
        seasonLetter={filters.seasonLetter}
        cropName={filters.crop}
        districtName={filters.district}
      />
    </div>
  );
}
