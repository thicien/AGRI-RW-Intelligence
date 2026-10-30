import React, { useState } from 'react';
import { 
  Trophy, ArrowUpRight, ArrowDownRight, Info, 
  Search, SlidersHorizontal, ShieldAlert, CheckCircle2,
  ExternalLink, FileSpreadsheet, ChevronRight, HelpCircle
} from 'lucide-react';
import type { DistrictRankingItem } from '../types';

interface IndicatorOption {
  key: string;
  label: string;
  unit: string;
  type: 'RECORDED_STATISTIC' | 'DERIVED_ESTIMATE' | 'MODELLED_ASSESSMENT';
  description: string;
  source: string;
}

interface DistrictRankingsCardProps {
  sectionTitle: string;
  availableIndicators: IndicatorOption[];
  activeIndicatorKey: string;
  onIndicatorChange: (key: string) => void;
  rankings: DistrictRankingItem[];
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  seasonCode: string;
}

export default function DistrictRankingsCard({
  sectionTitle,
  availableIndicators,
  activeIndicatorKey,
  onIndicatorChange,
  rankings,
  selectedDistrict,
  onSelectDistrict,
  seasonCode
}: DistrictRankingsCardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showMethodologyHelp, setShowMethodologyHelp] = useState(false);

  const activeIndicator = availableIndicators.find(i => i.key === activeIndicatorKey) || availableIndicators[0];

  const filteredRankings = rankings.filter(r => 
    r.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.province.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maxVal = rankings.length > 0 ? Math.max(...rankings.map(r => r.value || 0), 1) : 100;

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Card Header with Indicator Selector */}
      <div className="p-5 border-b border-emerald-50 bg-gradient-to-r from-emerald-50/40 via-white to-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              30 Districts Evidence League Table
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Comparative performance across Rwanda · {seasonCode}
          </p>
        </div>

        {/* Indicator Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 whitespace-nowrap hidden md:block">
            Rank by Indicator:
          </label>
          <select
            value={activeIndicatorKey}
            onChange={(e) => onIndicatorChange(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-white border border-emerald-200 rounded-lg px-3 py-2 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {availableIndicators.map(ind => (
              <option key={ind.key} value={ind.key}>
                {ind.label} ({ind.unit})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Indicator Definition & Methodology Badge */}
      <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 max-w-xl">
          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
            activeIndicator?.type === 'RECORDED_STATISTIC'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
              : activeIndicator?.type === 'DERIVED_ESTIMATE'
                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                : 'bg-purple-100 text-purple-900 border border-purple-200'
          }`}>
            {activeIndicator?.type === 'RECORDED_STATISTIC' 
              ? 'Recorded Statistic' 
              : activeIndicator?.type === 'DERIVED_ESTIMATE' 
                ? 'Derived Estimate' 
                : 'Modelled Assessment'}
          </span>
          <span className="text-slate-600 font-medium truncate">
            {activeIndicator?.description}
          </span>
        </div>

        <button
          onClick={() => setShowMethodologyHelp(!showMethodologyHelp)}
          className="text-emerald-700 font-bold hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          {showMethodologyHelp ? 'Hide Note' : 'Methodology Note'}
        </button>
      </div>

      {/* Expanded Methodology Explanation */}
      {showMethodologyHelp && (
        <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 text-xs text-slate-700 leading-relaxed animate-in fade-in duration-150">
          <div className="font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-700" />
            Ranking Calculation & Source Verification Rule:
          </div>
          <p className="mb-2">
            {activeIndicator?.source}. Districts with identical values receive equivalent rank orders. 
            Do not assume high total production automatically implies high productivity; yield efficiency accounts for land area utilized.
          </p>
          <div className="text-[11px] text-slate-500 font-medium">
            Published under National Institute of Statistics of Rwanda (NISR) Open Data standards.
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="px-5 py-2.5 border-b border-slate-100 bg-white flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search district or province..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="text-[11px] font-bold text-slate-500">
          Showing {filteredRankings.length} of {rankings.length} districts
        </div>
      </div>

      {/* Rankings Table Body */}
      <div className="flex-1 overflow-y-auto max-h-[480px] divide-y divide-slate-100">
        {filteredRankings.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No districts match "{searchTerm}".
          </div>
        ) : (
          filteredRankings.map((item, index) => {
            const isSelected = selectedDistrict === item.district;
            const barWidth = Math.max(4, Math.round((item.value / maxVal) * 100));

            return (
              <div
                key={item.district}
                onClick={() => onSelectDistrict(item.district)}
                className={`px-5 py-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer text-xs ${
                  isSelected 
                    ? 'bg-emerald-50/80 border-l-4 border-emerald-600 font-semibold' 
                    : 'hover:bg-slate-50/80'
                }`}
              >
                {/* Left: Rank & District Name */}
                <div className="flex items-center gap-3.5 min-w-[140px] sm:min-w-[190px]">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center font-extrabold text-[11px] shrink-0 ${
                    item.rank === 1
                      ? 'bg-amber-400 text-amber-950 shadow-2xs'
                      : item.rank === 2
                        ? 'bg-slate-300 text-slate-800'
                        : item.rank === 3
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.rank}
                  </div>

                  <div>
                    <div className="font-extrabold text-slate-900 text-[13px] flex items-center gap-1.5">
                      {item.district}
                      {isSelected && (
                        <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {item.province}
                    </div>
                  </div>
                </div>

                {/* Middle: Relative Progress Bar */}
                <div className="hidden lg:block flex-1 max-w-xs mx-4">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        activeIndicator?.type === 'RECORDED_STATISTIC'
                          ? 'bg-emerald-600'
                          : activeIndicator?.type === 'DERIVED_ESTIMATE'
                            ? 'bg-blue-600'
                            : 'bg-purple-600'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                {/* Right: Measured Value & Delta */}
                <div className="text-right shrink-0">
                  <div className="font-black text-slate-900 text-[13px]">
                    {item.displayValue} <span className="font-medium text-slate-500 text-[11px]">{item.unit}</span>
                  </div>

                  {item.benchmarkDeltaPct !== undefined && (
                    <div className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${
                      item.benchmarkDeltaPct >= 0 ? 'text-emerald-700' : 'text-slate-500'
                    }`}>
                      {item.benchmarkDeltaPct >= 0 ? (
                        <>
                          <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                          +{item.benchmarkDeltaPct}% vs natl avg
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-3 h-3 text-slate-400" />
                          {item.benchmarkDeltaPct}% vs natl avg
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Provenance Note */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between px-5">
        <span className="truncate">Source: {activeIndicator?.source}</span>
        <span className="font-bold text-slate-700 whitespace-nowrap">Official NISR SAS Baseline</span>
      </div>
    </div>
  );
}
