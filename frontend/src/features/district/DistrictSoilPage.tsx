import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Mountain, AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert, Plus, Layers } from 'lucide-react';

export default function DistrictSoilPage() {
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

        const res = await fetch(`http://localhost:3000/api/v1/district/soil?district=${encodeURIComponent(districtName)}&season=${seasonCode}`, {
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
        <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-600">Loading soil fertility dossier for {districtName}...</span>
      </div>
    );
  }

  const { acidityProfile, fertilityProfile, erosionHotspots, activeProjects } = data || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 uppercase">
              Area of Responsibility 3
            </span>
            <span className="text-xs text-slate-500 font-medium">{districtName} District Scope</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Soil Health, Fertility & Conservation Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review soil acidity, organic carbon, erosion hotspots, and terracing practices in {districtName}.
          </p>
        </div>

        <Link
          to="/district/interventions"
          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Propose Liming / Terracing Project
        </Link>
      </div>

      {/* Acidity & Fertility Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Acidity Profile */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Mountain className="w-5 h-5 text-amber-600" />
              Soil Acidity & Lime Requirements
            </h2>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
              pH {acidityProfile?.averagePh || 5.65}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Acidity Classification:</span>
              <span className="font-bold text-slate-800">{acidityProfile?.status}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Recommended Lime Dosage:</span>
              <span className="font-bold text-emerald-800">{acidityProfile?.limeRequirementTonnesPerHa} tonnes/ha</span>
            </div>
            <div className="pt-2">
              <span className="text-slate-500 font-semibold block mb-1">Agronomic Recommendation:</span>
              <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-lg text-amber-900 font-medium">
                {acidityProfile?.recommendedAction}
              </div>
            </div>
          </div>
        </div>

        {/* Fertility Diagnostics */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              Nutrient Availability & Carbon
            </h2>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
              {fertilityProfile?.organicCarbonPct}% Org. Carbon
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Nitrogen (N) Rating:</span>
              <span className="font-bold text-slate-800">{fertilityProfile?.nitrogenStatus}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Phosphorus (P) Availability:</span>
              <span className="font-bold text-slate-800">{fertilityProfile?.phosphorusAvailability}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Potassium (K) Reserve:</span>
              <span className="font-bold text-slate-800">{fertilityProfile?.potassiumStatus}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Erosion Risk Zones & Active Conservation Projects */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          High-Risk Erosion Sectors & Active Soil Conservation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(erosionHotspots || []).map((h: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-slate-900">{h.sector}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">{h.riskLevel}</span>
              </div>
              <div className="text-xs text-slate-600 mb-2">Slope gradient: <span className="font-bold">{h.slopeRange}</span></div>
              <div className="text-xs font-medium text-slate-700 bg-white p-2.5 rounded-lg border border-rose-100">
                {h.recommendedIntervention}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
