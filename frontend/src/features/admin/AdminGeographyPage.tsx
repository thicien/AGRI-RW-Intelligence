import { apiUrl } from '../../config/api';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, Globe, CheckCircle2, Clock, Users, Search, 
  RefreshCw, ArrowUpRight, ShieldCheck, Building2
} from 'lucide-react';

interface DistrictItem {
  district_id: string;
  district_name: string;
  district_code: string;
  province_name: string;
  sector_count: number;
  officer_id: string | null;
  assigned_officer_name: string | null;
  assigned_officer_email: string | null;
  assigned_officer_phone: string | null;
  officer_status: string | null;
}

export default function AdminGeographyPage() {
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');

  const fetchGeography = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('admin/geography'));
      if (res.ok) {
        const data = await res.json();
        setDistricts(data.districts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeography();
  }, []);

  const filteredDistricts = districts.filter(d => {
    const matchSearch = d.district_name.toLowerCase().includes(search.toLowerCase()) || 
                        d.province_name?.toLowerCase().includes(search.toLowerCase()) ||
                        (d.assigned_officer_name && d.assigned_officer_name.toLowerCase().includes(search.toLowerCase()));
    const matchProvince = !provinceFilter || d.province_name === provinceFilter;
    return matchSearch && matchProvince;
  });

  const coveredCount = districts.filter(d => d.assigned_officer_name).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Administrative Hierarchy & Boundary Authority</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Administrative Geography & Jurisdictions
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Maintain the authorized reference structure of Rwanda's 5 provinces, 30 districts, and 413 sectors. Track District Agricultural Officer assignments to ensure localized data isolation.
          </p>
        </div>

        <Link
          to="/system-admin/users"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/20 transition-all self-start sm:self-center"
        >
          <Users className="w-4 h-4" />
          <span>Assign District Officer</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Provinces</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">5 Provinces</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Kigali + 4 Provinces</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Districts</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">30 Districts</div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
            {coveredCount} Assigned • {30 - coveredCount} Pending
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Active Sectors</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">413 Sectors</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Operational Survey Units</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Officer Coverage</span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {Math.round((coveredCount / 30) * 100)}%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Boundary Isolation Active</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search district or officer name..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">All 5 Provinces</option>
            <option value="Kigali City">Kigali City</option>
            <option value="Eastern Province">Eastern Province</option>
            <option value="Northern Province">Northern Province</option>
            <option value="Southern Province">Southern Province</option>
            <option value="Western Province">Western Province</option>
          </select>

          <button
            onClick={fetchGeography}
            title="Refresh"
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-emerald-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Districts Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Rwanda's 30 Districts ({filteredDistricts.length})
          </h3>
          <span className="text-xs text-slate-400">
            NISR Geo-Referenced Codes & Administrative Sectors
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5">District Name</th>
                <th className="py-3 px-4">Province</th>
                <th className="py-3 px-4">Geo Code</th>
                <th className="py-3 px-4 text-center">Sectors</th>
                <th className="py-3 px-4">Assigned District Officer</th>
                <th className="py-3 px-5 text-right">Jurisdiction Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Loading districts...</td>
                </tr>
              ) : filteredDistricts.map((d) => (
                <tr key={d.district_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{d.district_name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {d.province_name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                    {d.district_code || 'RW-DIST'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700 text-[11px]">
                      {d.sector_count} Sectors
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {d.assigned_officer_name ? (
                      <div>
                        <div className="font-bold text-slate-900">{d.assigned_officer_name}</div>
                        <div className="text-[11px] text-slate-500">{d.assigned_officer_email}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Pending Assignment</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {d.assigned_officer_name ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Assigned
                      </span>
                    ) : (
                      <Link
                        to="/system-admin/users"
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                      >
                        <Clock className="w-3 h-3" /> Assign Officer
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
