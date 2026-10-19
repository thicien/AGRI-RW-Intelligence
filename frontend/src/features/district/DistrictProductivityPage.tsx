import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  Sprout, TrendingUp, Mountain, Filter, RefreshCw, AlertTriangle, 
  Layers, ArrowUpRight, CheckCircle2, ChevronRight, Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function DistrictProductivityPage() {
  const { districtName, seasonCode } = useOutletContext<{ districtName: string; seasonCode: string }>();

  const [loading, setLoading] = useState(true);
  const [productivityData, setProductivityData] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('agrilens_token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`http://localhost:3000/api/v1/district/productivity?district=${encodeURIComponent(districtName)}&season=${seasonCode}`, {
          headers
        });
        if (res.ok) {
          const json = await res.json();
          setProductivityData(json);
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
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-600">Loading productivity statistics for {districtName}...</span>
      </div>
    );
  }

  const crops = productivityData?.cropBreakdown || [];
  const filteredCrops = selectedCategory === 'ALL' 
    ? crops 
    : crops.filter((c: any) => c.crop_category === selectedCategory);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
              Area of Responsibility 1
            </span>
            <span className="text-xs text-slate-500 font-medium">{districtName} District Scope</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Agricultural Productivity & Crop Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor crop production, cultivated area and yield within {districtName} across seasons.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/district/reports"
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Productivity Dossier
          </Link>
        </div>
      </div>

      {/* Crop Yield Comparison Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Crop Yield & Production Breakdown ({districtName} · {seasonCode})
            </h2>
            <p className="text-xs text-slate-500">
              Comparing average yield (t/ha) and production volume across recorded agricultural crops.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            {['ALL', 'CEREALS', 'TUBERS', 'LEGUMES', 'HORTICULTURE'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md transition-all ${
                  selectedCategory === cat ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={filteredCrops.slice(0, 10).map((c: any) => ({
                name: c.crop_name,
                'Yield (t/ha)': c.yield_t_ha,
                'Production (x10 MT)': Math.round((c.production_tonnes || 0) / 10)
              }))}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" height={45} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Bar dataKey="Yield (t/ha)" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Production (x10 MT)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Crop Statistics Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          Recorded Crop Performance Records in {districtName}
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 pl-1">Crop Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Production (tonnes)</th>
                <th className="pb-3">Cultivated Area (ha)</th>
                <th className="pb-3">Average Yield (t/ha)</th>
                <th className="pb-3">Modern Irrigated (ha)</th>
                <th className="pb-3 text-right pr-1">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCrops.map((c: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 pl-1 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {c.crop_name}
                  </td>
                  <td className="py-3 font-semibold text-slate-500">{c.crop_category || 'CROP'}</td>
                  <td className="py-3 font-bold text-slate-800">{Number(c.production_tonnes).toLocaleString()}</td>
                  <td className="py-3 text-slate-600">{Number(c.area_ha).toLocaleString()} ha</td>
                  <td className="py-3 font-extrabold text-emerald-800">{c.yield_t_ha} t/ha</td>
                  <td className="py-3 text-slate-600">{c.irrigated_area_ha ? `${c.irrigated_area_ha} ha` : '—'}</td>
                  <td className="py-3 text-right pr-1">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Compatible
                    </span>
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
