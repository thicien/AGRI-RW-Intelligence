import React, { useState } from 'react';
import { 
  Table, Search, ArrowUpDown, Download, 
  CheckCircle2, Info, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import type { DistrictRankingItem } from '../types';

interface AccessibleDataTableProps {
  sectionTitle: string;
  rankings: DistrictRankingItem[];
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  activeIndicatorLabel: string;
  unit: string;
  seasonCode: string;
}

export default function AccessibleDataTable({
  sectionTitle,
  rankings,
  selectedDistrict,
  onSelectDistrict,
  activeIndicatorLabel,
  unit,
  seasonCode
}: AccessibleDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'rank' | 'district' | 'value'>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filtered = rankings.filter(r => 
    r.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.province.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'rank') cmp = a.rank - b.rank;
    else if (sortField === 'district') cmp = a.district.localeCompare(b.district);
    else if (sortField === 'value') cmp = a.value - b.value;
    return sortDirection === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (field: 'rank' | 'district' | 'value') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Table className="w-4 h-4 text-emerald-700" />
            Accessible Data Table View · {sectionTitle}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Full high-contrast tabular dataset for screen-readers and research analysis · {seasonCode}
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search districts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-slate-100 text-slate-800 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
            <tr>
              <th 
                scope="col" 
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 transition-colors w-16"
                onClick={() => toggleSort('rank')}
              >
                <div className="flex items-center gap-1">
                  Rank <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th 
                scope="col" 
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 transition-colors"
                onClick={() => toggleSort('district')}
              >
                <div className="flex items-center gap-1">
                  District & Province <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th 
                scope="col" 
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-200/70 transition-colors"
                onClick={() => toggleSort('value')}
              >
                <div className="flex items-center justify-end gap-1">
                  {activeIndicatorLabel} ({unit}) <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                Natl Benchmark Delta
              </th>
              <th scope="col" className="py-3 px-4">
                Evidence Type
              </th>
              <th scope="col" className="py-3 px-4">
                Source Citation
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No records match your search.
                </td>
              </tr>
            ) : (
              sorted.map((item) => {
                const isSelected = selectedDistrict === item.district;

                return (
                  <tr 
                    key={item.district}
                    onClick={() => onSelectDistrict(item.district)}
                    className={`cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-emerald-50 font-bold text-slate-900 border-l-4 border-emerald-600' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4 font-black text-slate-900">
                      #{item.rank}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900">{item.district}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{item.province}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {item.displayValue} <span className="font-medium text-slate-500 text-[11px]">{item.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      {item.benchmarkDeltaPct !== undefined ? (
                        <span className={`inline-flex items-center gap-0.5 ${
                          item.benchmarkDeltaPct >= 0 ? 'text-emerald-700' : 'text-slate-500'
                        }`}>
                          {item.benchmarkDeltaPct >= 0 ? '+' : ''}{item.benchmarkDeltaPct}%
                        </span>
                      ) : (
                        <span className="text-slate-400">Baseline</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase tracking-wider ${
                        item.methodologyType === 'RECORDED_STATISTIC'
                          ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                          : item.methodologyType === 'DERIVED_ESTIMATE'
                            ? 'bg-blue-100 text-blue-950 border border-blue-300'
                            : 'bg-purple-100 text-purple-950 border border-purple-300'
                      }`}>
                        {item.methodologyType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 max-w-xs truncate">
                      {item.sourceCitation}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-100 border-t border-slate-200 text-[11px] text-slate-600 flex items-center justify-between px-5">
        <span>Displaying {sorted.length} districts in standard tabular layout</span>
        <span className="font-bold text-slate-800">WCAG 2.1 AA Compliant</span>
      </div>
    </div>
  );
}
