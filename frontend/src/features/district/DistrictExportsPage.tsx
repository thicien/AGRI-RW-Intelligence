import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Globe, ArrowUpRight, CheckCircle2, RefreshCw, Plus, ShieldCheck } from 'lucide-react';

export default function DistrictExportsPage() {
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

        const res = await fetch(`http://localhost:3000/api/v1/district/exports?district=${encodeURIComponent(districtName)}&season=${seasonCode}`, {
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
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-600">Loading export market intelligence for {districtName}...</span>
      </div>
    );
  }

  const commodities = data?.exportCommodities || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 uppercase">
              Area of Responsibility 5
            </span>
            <span className="text-xs text-slate-500 font-medium">{districtName} District Scope</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Export Market Opportunities & Value Addition
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review agricultural products, phytosanitary standards compliance, and export-market opportunities relevant to {districtName}.
          </p>
        </div>

        <Link
          to="/district/interventions"
          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Propose Export Linkage
        </Link>
      </div>

      {/* Export Commodities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {commodities.map((item: any, idx: number) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase">
                  Cash Crop / Value Chain
                </span>
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  {item.exportReadinessScore}/100 Readiness
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900">{item.product}</h3>
              
              <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div>
                  <span className="text-slate-400 block mb-0.5">District Production Volume:</span>
                  <span className="font-bold text-slate-800">{item.currentProductionMt?.toLocaleString()} MT</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Primary Target Destinations:</span>
                  <span className="font-semibold text-slate-800">{item.primaryDestinations}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Phytosanitary & Compliance:</span>
                  <span className="font-medium text-purple-900 bg-purple-50 p-2 rounded block">
                    {item.complianceRequirements}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <Link 
                to="/district/interventions" 
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                Plan Cooperative Export Support <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
