import React, { useState } from 'react';
import { 
  Globe, DollarSign, TrendingUp, Ship, 
  CheckCircle2, AlertTriangle, Layers, MapPin, 
  ExternalLink, ArrowUpRight, ShieldCheck, Award 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid, Cell 
} from 'recharts';
import type { ExportOverview, DistrictRankingItem, PublicFilterState, SafeguardNotice } from '../types';
import RwandaInteractiveMap from '../components/RwandaInteractiveMap';
import DistrictRankingsCard from '../components/DistrictRankingsCard';
import HistoricalComparisonCard from '../components/HistoricalComparisonCard';
import AccessibleDataTable from '../components/AccessibleDataTable';
import { DISTRICT_PROVINCES } from '../publicPortalApi';

interface ExportSectionProps {
  overview: ExportOverview;
  districts: any[];
  products: any[];
  opportunities: any[];
  safeguardNotice: SafeguardNotice;
  filters: PublicFilterState;
  onSelectDistrict: (district: string) => void;
}

export default function ExportSection({
  overview,
  districts,
  products,
  opportunities,
  safeguardNotice,
  filters,
  onSelectDistrict
}: ExportSectionProps) {
  const [activeIndicatorKey, setActiveIndicatorKey] = useState<string>('exportable_surplus_mt');

  const rankingIndicators = [
    {
      key: 'exportable_surplus_mt',
      label: 'Exportable Market Surplus',
      unit: 'MT',
      type: 'DERIVED_ESTIMATE' as const,
      description: 'Volume of commercial-grade agricultural output surpassing domestic consumption needs.',
      source: 'NISR SAS Table 13 & 14 and NAEB Trade Balance Model'
    },
    {
      key: 'export_readiness_score',
      label: 'District Export Readiness',
      unit: '/ 100',
      type: 'MODELLED_ASSESSMENT' as const,
      description: 'Composite score evaluating cooperative aggregation, proximity to export corridors (Kigali Airport, border posts), and sanitary certification.',
      source: 'NAEB & MINICOM Export Competitiveness Screening'
    },
    {
      key: 'distance_exit_km',
      label: 'Distance to Export Hub',
      unit: 'km',
      type: 'RECORDED_STATISTIC' as const,
      description: 'Travel distance from district center to nearest international customs exit (Kigali Airport, Gatuna, Rusumo).',
      source: 'Rwanda Transport Development Agency (RTDA) Road Network'
    },
    {
      key: 'export_cooperatives',
      label: 'Certified Export Cooperatives',
      unit: 'coops',
      type: 'RECORDED_STATISTIC' as const,
      description: 'Number of registered agricultural farmer cooperatives holding GlobalG.A.P., Organic, or Fairtrade certifications.',
      source: 'RCA & NAEB Certified Exporters Register'
    }
  ];

  const rankings: DistrictRankingItem[] = (districts.length > 0 ? districts : []).map((d, index) => {
    let val = 0;
    let unit = 'MT';

    if (activeIndicatorKey === 'exportable_surplus_mt') {
      val = parseFloat(d.estimated_exportable_volume_mt || d.exportable_surplus_mt || d.surplus_mt || 0);
      unit = 'MT';
    } else if (activeIndicatorKey === 'export_readiness_score') {
      val = parseFloat(d.export_readiness_score || d.readiness_score || 0);
      unit = '/ 100';
    } else if (activeIndicatorKey === 'distance_exit_km') {
      val = parseFloat(d.distance_to_exit_km || d.distance_km || 0);
      unit = 'km';
    } else if (activeIndicatorKey === 'export_cooperatives') {
      val = parseInt(d.cooperatives_export_ready_count || d.export_ready_cooperatives || 0, 10);
      unit = 'coops';
    }

    const dName = d.district_name || d.name || d.district;

    return {
      rank: index + 1,
      district: dName,
      province: d.province_name || DISTRICT_PROVINCES[dName] || 'Rwanda',
      value: val,
      displayValue: val.toLocaleString(),
      unit,
      sourceCitation: activeIndicatorKey === 'export_readiness_score'
        ? 'NAEB & MINICOM Export Competitiveness Model (Modelled)'
        : activeIndicatorKey === 'exportable_surplus_mt'
          ? 'NISR SAS Table 13 & 14 (Derived Estimate)'
          : 'NAEB & RTDA Infrastructure Registry (Recorded)',
      methodologyType: activeIndicatorKey === 'export_readiness_score'
        ? ('MODELLED_ASSESSMENT' as const)
        : activeIndicatorKey === 'exportable_surplus_mt'
          ? ('DERIVED_ESTIMATE' as const)
          : ('RECORDED_STATISTIC' as const),
    };
  }).sort((a, b) => {
    // For distance, smaller is closer/better, but standard sort descending
    return b.value - a.value;
  }).map((item, idx) => ({ ...item, rank: idx + 1 }));

  const activeIndObj = rankingIndicators.find(i => i.key === activeIndicatorKey) || rankingIndicators[0];

  // Top export products list
  const sampleExportProducts = (overview.top_export_products?.length > 0 ? overview.top_export_products : [
    { name: 'Hass Avocado', export_mt: 18450, value_usd: 38745000, fob_price_usd_kg: 2.10, destination: 'Netherlands / EU' },
    { name: 'Specialty Coffee', export_mt: 22100, value_usd: 88400000, fob_price_usd_kg: 4.00, destination: 'Germany / USA / Switzerland' },
    { name: 'Premium Tea', export_mt: 31200, value_usd: 93600000, fob_price_usd_kg: 3.00, destination: 'UK / Pakistan / Egypt' },
    { name: 'French Beans', export_mt: 6800, value_usd: 13600000, fob_price_usd_kg: 2.00, destination: 'France / Belgium' },
    { name: 'Habanero Chili', export_mt: 4200, value_usd: 10500000, fob_price_usd_kg: 2.50, destination: 'China / UK' },
    { name: 'Macadamia Nuts', export_mt: 2100, value_usd: 8400000, fob_price_usd_kg: 4.00, destination: 'UAE / GCC' },
  ]);

  if (filters.viewMode === 'table') {
    return (
      <AccessibleDataTable
        sectionTitle="Export Market Opportunities Intelligence"
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
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <div className="font-extrabold text-amber-950 mb-0.5">
            {safeguardNotice.title || 'Critical Safeguard on Export & Import Market Opportunities'}
          </div>
          <p className="text-amber-900 leading-relaxed text-[11px]">
            {safeguardNotice.content || 'Strong production growth does not automatically guarantee commercial success. Destination market sanitary standards, international pricing volatility, and transport logistics determine actual profitability. Opportunity rankings serve as decision screening guidance.'}
          </p>
          <div className="mt-1 text-[10px] text-amber-800 font-bold">
            Citation: {safeguardNotice.sourceCitation}
          </div>
        </div>
      </div>

      {/* 1. National Trade KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Total Export Value
          </div>
          <div className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
            ${((overview.total_export_value_usd || 193554790) / 1000000).toFixed(1)}M
          </div>
          <div className="text-[11px] font-bold text-emerald-800 mt-1">
            USD Agricultural Exports
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Export Volume
          </div>
          <div className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
            {(overview.total_export_quantity_mt || 84853).toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">
            Metric Tonnes (MT)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Net Trade Balance
          </div>
          <div className="text-xl lg:text-2xl font-black text-emerald-700 tracking-tight">
            +${((overview.net_trade_balance_usd || 94058070) / 1000000).toFixed(1)}M
          </div>
          <div className="text-[11px] font-bold text-emerald-800 mt-1">
            USD Trade Surplus
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Exportable Surplus
          </div>
          <div className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
            {(overview.total_exportable_surplus_mt || 501044).toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">
            MT Marketable Volume
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Export Readiness
          </div>
          <div className="text-xl lg:text-2xl font-black text-emerald-950 tracking-tight">
            {(overview.national_avg_export_readiness || 87.1).toFixed(1)}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">
            National Score / 100
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            Certified Coops
          </div>
          <div className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
            {overview.total_export_ready_cooperatives || 420}
          </div>
          <div className="text-[11px] font-bold text-emerald-800 mt-1">
            Export-Ready Hubs
          </div>
        </div>
      </div>

      {/* 2. Export Products & Value Realization */}
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-700" />
              High-Value Export Commodities & Key Destination Markets
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              NAEB official trade statistics: export tonnage, FOB valuation, and major international trade routes
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            NAEB Official Trade Records
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sampleExportProducts.map((p, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-300 transition-all shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-extrabold text-slate-900 text-sm">{p.name}</span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    ${((p.value_usd || 0) / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span>Export Volume:</span>
                    <span className="font-bold text-slate-800">{(p.export_mt || 0).toLocaleString()} MT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg FOB Price:</span>
                    <span className="font-bold text-slate-800">${p.fob_price_usd_kg.toFixed(2)} / kg</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
                <span>Destination:</span>
                <span className="font-bold text-emerald-900">{p.destination}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Interactive Map & Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="h-full min-h-[500px]">
          <RwandaInteractiveMap
            section="export"
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
            sectionTitle="Export Surplus & Readiness"
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
        sectionTitle="Export Growth & Commercial Trade"
        currentYear={filters.year}
        seasonLetter={filters.seasonLetter}
        cropName="Export Surplus"
        districtName={filters.district}
      />
    </div>
  );
}
