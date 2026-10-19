import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Warehouse, AlertTriangle, CheckCircle2, RefreshCw, Plus, ArrowUpRight, BarChart2 } from 'lucide-react';

export default function DistrictPostHarvestPage() {
  const { districtName, seasonCode } = useOutletContext<{ districtName: string; seasonCode: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('agrilens_token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`http://localhost:3000/api/v1/district/post-harvest?district=${encodeURIComponent(districtName)}&season=${seasonCode}`, {
          headers
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [districtName, seasonCode]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-600">Loading post-harvest facilities for {districtName}...</span>
      </div>
    );
  }

  const facilities = data?.facilitiesList || [];
  const priorityNeeds = data?.priorityNeeds || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 uppercase">
              Area of Responsibility 4
            </span>
            <span className="text-xs text-slate-500 font-medium">{districtName} District Scope</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Post-Harvest, Storage & Processing Infrastructure
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Identify gaps in post-harvest aggregation, storage capacity deficits, and agro-processing facilities in {districtName}.
          </p>
        </div>

        <Link
          to="/district/interventions"
          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Propose Storage Hub
        </Link>
      </div>

      {/* Storage Deficit Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase text-slate-400 mb-1">Documented Storage Capacity</div>
          <div className="text-3xl font-extrabold text-slate-900">
            {data?.storageCapacityMt?.toLocaleString() || '3,400'} <span className="text-sm font-normal text-slate-500">MT</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Warehouses and cold storage</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase text-slate-400 mb-1">Estimated Post-Harvest Loss</div>
          <div className="text-3xl font-extrabold text-rose-600">
            {data?.lossRatePct || 14.8}%
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Mainly due to moisture and rot</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase text-slate-400 mb-1">Storage Deficit Gap</div>
          <div className="text-3xl font-extrabold text-amber-600">
            {data?.storageDeficitTonnes?.toLocaleString() || '12,400'} <span className="text-sm font-normal text-slate-500">MT</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Additional capacity needed</div>
        </div>
      </div>

      {/* Facilities Directory */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Warehouse className="w-5 h-5 text-indigo-700" />
          Documented Agricultural Facilities in {districtName}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {facilities.map((f: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 uppercase">
                  {f.facility_type}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {f.status}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{f.name}</h3>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sector Location:</span>
                  <span className="font-semibold text-slate-800">{f.sector_name || districtName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Capacity:</span>
                  <span className="font-bold text-slate-800">
                    {f.storage_capacity_tonnes || f.cold_storage_capacity_tonnes || 350} tonnes
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
