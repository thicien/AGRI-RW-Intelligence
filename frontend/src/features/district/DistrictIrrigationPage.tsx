import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Droplets, CheckCircle2, AlertCircle, RefreshCw, Sun, Zap, Mountain, ArrowUpRight, Plus } from 'lucide-react';

export default function DistrictIrrigationPage() {
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

        const res = await fetch(`http://localhost:3000/api/v1/district/irrigation?district=${encodeURIComponent(districtName)}&season=${seasonCode}`, {
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
        <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-600">Loading irrigation assessments for {districtName}...</span>
      </div>
    );
  }

  const existingAssets = data?.existingAssets || [];
  const potentialSites = data?.potentialSites || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-800 uppercase">
              Area of Responsibility 2
            </span>
            <span className="text-xs text-slate-500 font-medium">{districtName} District Scope</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Irrigation Coverage & Development Potential
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review existing irrigation infrastructure, small-scale solar pumping feasibility and command area expansion in {districtName}.
          </p>
        </div>

        <Link
          to="/district/interventions"
          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Propose Irrigation Intervention
        </Link>
      </div>

      {/* Existing Operational Assets */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Droplets className="w-5 h-5 text-cyan-700" />
          Monitored Irrigation Schemes & Infrastructure ({districtName})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {existingAssets.map((asset: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 uppercase">
                  {asset.asset_type || 'CANAL_NETWORK'}
                </span>
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {asset.operational_status || 'OPERATIONAL'}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{asset.name}</h3>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Water Source:</span>
                  <span className="font-semibold text-slate-700">{asset.water_source || 'Marshland'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Command Area:</span>
                  <span className="font-bold text-slate-800">{asset.area_command_ha || 250} ha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Beneficiary Farmers:</span>
                  <span className="font-semibold text-slate-700">{asset.beneficiaries_count || 480}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Small-Scale Irrigation Feasibility Dossier */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Sun className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900">
            Small-Scale Irrigation Opportunity Screening ({districtName})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {potentialSites.map((site: any, idx: number) => (
            <div key={idx} className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-emerald-500 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-800">{site.priority} PRIORITY</span>
                <span className="text-xs font-extrabold text-cyan-700">{site.solarPumpingFeasibilityScore}/100 Score</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-2">{site.siteName}</h3>
              
              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Potential Area:</span>
                  <span className="font-bold text-slate-800">{site.commandAreaHa} ha</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Technology:</span>
                  <span className="font-semibold text-slate-800">{site.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Est. Investment:</span>
                  <span className="font-bold text-emerald-700">{(site.estimatedCostRwf / 1000000).toFixed(1)}M RWF</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
