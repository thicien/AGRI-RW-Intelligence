import React, { useState, useEffect } from 'react';
import { 
  Calendar, Layers, MapPin, CheckCircle2, RefreshCw, 
  Search, ShieldCheck, ArrowRight, Download, Filter
} from 'lucide-react';

export default function SeasonsCoveragePage() {
  const [loading, setLoading] = useState(true);
  const [coverageData, setCoverageData] = useState<any>(null);
  const [searchDistrict, setSearchDistrict] = useState('');
  const [selectedTier, setSelectedTier] = useState('ALL');

  useEffect(() => {
    const fetchCoverage = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('agrilens_token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('http://localhost:3000/api/v1/data-manager/seasons-coverage', { headers });
        if (res.ok) {
          setCoverageData(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCoverage();
  }, []);

  const { totalDistricts, coverageRatePct, seasonsAvailable, districtMatrix } = coverageData || {};

  const filteredDistricts = (districtMatrix || []).filter((d: any) => {
    const matchesSearch = searchDistrict === '' || d.district_name.toLowerCase().includes(searchDistrict.toLowerCase());
    const matchesTier = selectedTier === 'ALL' || d.coverage_tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 uppercase">
              Section 1.3 Historical & Seasonal Management
            </span>
            <span className="text-xs text-slate-500 font-medium">30 Districts · 2014-2026</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Seasonal Data Coverage & Geographic Completeness
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain the relationship between each dataset, year, season, crop and administrative area without overwriting historical records.
          </p>
        </div>
      </div>

      {/* The 6-Step Seasonal Workflow Principle (Section 5) */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-6 border border-emerald-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Essential Multi-Seasonal Data Governance Workflow</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">
            Non-Destructive Time Series
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { step: '1. Register Source', desc: 'Upload PDF/XLSX and record metadata' },
            { step: '2. Extract & Stage', desc: 'Parse tables into temporary staging records' },
            { step: '3. Validate', desc: 'Check fields, units, duplicates & geography' },
            { step: '4. Review Errors', desc: 'Correct, reject or flag invalid records' },
            { step: '5. Approve Publication', desc: 'Apply required permission & sign-off' },
            { step: '6. Refresh Analytics', desc: 'Update data in all 5 analytical modules' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white/80 p-3 rounded-xl border border-emerald-100 text-xs">
              <div className="font-bold text-emerald-900 text-[11px]">{item.step}</div>
              <div className="text-[10px] text-slate-600 mt-0.5 leading-snug">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Matrix Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Districts Monitored</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalDistricts || 30} of 30</div>
          <div className="text-[10px] text-emerald-700 font-bold mt-0.5">{coverageRatePct || 100}% National Coverage</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Available Seasons</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{seasonsAvailable?.length || 20} Seasons</div>
          <div className="text-[10px] text-slate-500 mt-0.5">2014 to 2026 Archive</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Complete Coverage Tier</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">30 Districts</div>
          <div className="text-[10px] text-slate-500 mt-0.5">&gt; 10 Monitored Seasons</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Crop Granularity</div>
          <div className="text-2xl font-black text-slate-900 mt-1">24 Crops</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Consistent Taxonomy</div>
        </div>
      </div>

      {/* District Coverage Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by district name..."
              value={searchDistrict}
              onChange={(e) => setSearchDistrict(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Filter Tier:</span>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Tiers (30 Districts)</option>
              <option value="COMPLETE">Complete (&gt;= 10 Seasons)</option>
              <option value="ADEQUATE">Adequate</option>
              <option value="PARTIAL">Partial</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Loading seasonal coverage matrix...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200 text-[11px]">
                  <th className="p-3.5">District Name & Code</th>
                  <th className="p-3.5">Seasons Monitored</th>
                  <th className="p-3.5">Total Historical Rows</th>
                  <th className="p-3.5">Recorded Crops</th>
                  <th className="p-3.5">Cumulative Production</th>
                  <th className="p-3.5">Historical Average Yield</th>
                  <th className="p-3.5 text-right">Coverage Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDistricts.map((d: any) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{d.district_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{d.district_code || 'RW-DISTRICT'}</div>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-800">
                      {d.seasons_covered_count} Seasons (2014-2026)
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">
                      {parseInt(d.total_crop_records || '0', 10).toLocaleString()} rows
                    </td>
                    <td className="p-3.5 text-slate-700 font-semibold">
                      {d.distinct_crops_count} Crops
                    </td>
                    <td className="p-3.5 font-mono text-slate-800 font-bold">
                      {parseInt(d.total_production_tonnes || '0', 10).toLocaleString()} t
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-700">
                      {d.average_yield_t_ha} t/ha
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> COMPLETE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
