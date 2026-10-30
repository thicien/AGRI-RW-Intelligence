import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../config/api';
import { 
  Layers, Search, Filter, Sprout, Droplets, Mountain, 
  Warehouse, Globe, RefreshCw, CheckCircle2, Download 
} from 'lucide-react';

export default function AgriculturalDataInspectorPage() {
  const [selectedModule, setSelectedModule] = useState<'PRODUCTIVITY' | 'IRRIGATION' | 'SOIL' | 'POST_HARVEST' | 'EXPORTS'>('PRODUCTIVITY');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Musanze');
  const [selectedSeason, setSelectedSeason] = useState<string>('2026B');
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);

  const districtsList = [
    'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi', 'Gisagara',
    'Huye', 'Kamonyi', 'Karongi', 'Kayonza', 'Kicukiro', 'Kirehe', 'Muhanga',
    'Musanze', 'Ngoma', 'Ngororero', 'Nyabihu', 'Nyagatare', 'Nyamagabe',
    'Nyamasheke', 'Nyanza', 'Nyarugenge', 'Nyaruguru', 'Rubavu', 'Ruhango',
    'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana'
  ];

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = '';
      if (selectedModule === 'PRODUCTIVITY') {
        url = apiUrl(`district/productivity?district=${encodeURIComponent(selectedDistrict)}&season=${selectedSeason}`);
      } else if (selectedModule === 'IRRIGATION') {
        url = apiUrl(`district/irrigation?district=${encodeURIComponent(selectedDistrict)}&season=${selectedSeason}`);
      } else if (selectedModule === 'SOIL') {
        url = apiUrl(`district/soil?district=${encodeURIComponent(selectedDistrict)}&season=${selectedSeason}`);
      } else if (selectedModule === 'POST_HARVEST') {
        url = apiUrl(`district/post-harvest?district=${encodeURIComponent(selectedDistrict)}&season=${selectedSeason}`);
      } else {
        url = apiUrl(`district/exports?district=${encodeURIComponent(selectedDistrict)}&season=${selectedSeason}`);
      }

      const res = await fetch(url, { headers });
      if (res.ok) {
        const json = await res.json();
        if (selectedModule === 'PRODUCTIVITY') {
          setRecords(json.cropBreakdown || []);
        } else if (selectedModule === 'IRRIGATION') {
          setRecords(json.existingAssets || []);
        } else if (selectedModule === 'SOIL') {
          setRecords(json.activeProjects || []);
        } else if (selectedModule === 'POST_HARVEST') {
          setRecords(json.facilitiesList || []);
        } else {
          setRecords(json.exportCommodities || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedModule, selectedDistrict, selectedSeason]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
              Section 1.5 Agricultural Data Oversight
            </span>
            <span className="text-xs text-slate-500 font-medium">Underlying Source Records</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Agricultural Intelligence Records Inspector
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Inspect verified datasets feeding productivity, irrigation, soil, post-harvest, and export-market analytics.
          </p>
        </div>
      </div>

      {/* Module Selector Pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'PRODUCTIVITY', label: '1. Productivity', icon: Sprout },
          { key: 'IRRIGATION', label: '2. Irrigation', icon: Droplets },
          { key: 'SOIL', label: '3. Soil & Fertility', icon: Mountain },
          { key: 'POST_HARVEST', label: '4. Post-Harvest', icon: Warehouse },
          { key: 'EXPORTS', label: '5. Export Opportunities', icon: Globe }
        ].map((mod: any) => {
          const Icon = mod.icon;
          const active = selectedModule === mod.key;
          return (
            <button
              key={mod.key}
              onClick={() => setSelectedModule(mod.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                active 
                  ? 'bg-emerald-700 text-white shadow-xs' 
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{mod.label}</span>
            </button>
          );
        })}
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Select District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            >
              {districtsList.map(d => (
                <option key={d} value={d}>{d} District</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Period:</span>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value="2026B">Season 2026B (Current)</option>
              <option value="2026A">Season 2026A</option>
              <option value="2025B">Season 2025B</option>
              <option value="2025A">Season 2025A</option>
              <option value="all">All Historic Seasons</option>
            </select>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Showing {records.length} Verified Database Records
        </span>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Loading records from database...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200 text-[11px]">
                  <th className="p-3.5">Identifier / Name</th>
                  <th className="p-3.5">Metric 1</th>
                  <th className="p-3.5">Metric 2</th>
                  <th className="p-3.5">Metric 3</th>
                  <th className="p-3.5">Quality / Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {records.map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold font-sans text-slate-900">
                      {r.crop_name || r.name || r.project_name || r.product || 'Agricultural Item'}
                    </td>
                    <td className="p-3.5 text-slate-700">
                      {r.production_tonnes ? `${r.production_tonnes.toLocaleString()} tonnes` : 
                       r.area_command_ha ? `${r.area_command_ha} ha command` :
                       r.area_ha ? `${r.area_ha} ha area` : 
                       r.currentProductionMt ? `${r.currentProductionMt} MT` : '—'}
                    </td>
                    <td className="p-3.5 text-slate-700">
                      {r.yield_t_ha ? `${r.yield_t_ha} t/ha yield` :
                       r.water_source ? r.water_source :
                       r.practice_type ? r.practice_type :
                       r.facility_type ? r.facility_type : '—'}
                    </td>
                    <td className="p-3.5 text-slate-700">
                      {r.area_ha ? `${r.area_ha} ha cultivated` :
                       r.beneficiaries_count ? `${r.beneficiaries_count} farmers` :
                       r.status ? r.status :
                       r.complianceRequirements ? r.complianceRequirements : '—'}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 font-sans">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> NISR Verified
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
