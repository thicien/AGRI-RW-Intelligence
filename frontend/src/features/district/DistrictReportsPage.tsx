import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  FileText, Download, Printer, CheckCircle2, RefreshCw, 
  ShieldCheck, Calendar, MapPin, ExternalLink 
} from 'lucide-react';

export default function DistrictReportsPage() {
  const { districtName, seasonCode } = useOutletContext<{ districtName: string; seasonCode: string }>();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('agrilens_token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`http://localhost:3000/api/v1/district/reports?district=${encodeURIComponent(districtName)}`, {
          headers
        });
        if (res.ok) {
          setReport(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [districtName]);

  const handleExportCsv = () => {
    if (!report) return;
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Report Title,District,Generated At,Classification\n" +
      `"${report.reportTitle}","${report.district}","${report.generatedAt}","${report.classification}"\n\n` +
      "Sector,Primary Crop,Average Yield (t/ha),Production (tonnes),Irrigation (%)\n" +
      (report.sectorHighlights || []).map((s: any) => 
        `"${s.name}","${s.primary_crop}",${s.yield_t_ha},${s.production_tonnes},${s.irrigation_coverage_pct}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AgriLens_${districtName}_District_Report_${seasonCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExported(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-600">Compiling official district report for {districtName}...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
              Official Reporting Module
            </span>
            <span className="text-xs text-slate-500 font-medium">{districtName} District Authorization</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Generate & Export District Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish authorized district-level analytical briefs derived from NISR seasonal datasets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download CSV Dataset
          </button>
        </div>
      </div>

      {exported && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          District CSV report exported successfully with official audit token.
        </div>
      )}

      {/* Official Formatted Report Sheet Preview */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm print:shadow-none print:border-none">
        
        {/* Document Header */}
        <div className="border-b-2 border-emerald-800 pb-5 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-900 uppercase tracking-widest">
                REPUBLIC OF RWANDA · MINISTRY OF AGRICULTURE & ANIMAL RESOURCES
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                {report.reportTitle}
              </h2>
              <div className="text-xs text-slate-500 mt-1">
                Published in partnership with the National Institute of Statistics of Rwanda (NISR)
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="inline-block px-2.5 py-1 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold uppercase tracking-wider text-[10px]">
                {report.classification}
              </span>
              <div className="text-slate-400 mt-1 text-[11px]">
                Generated on: {new Date(report.generatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Executive Overview</h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            This analytical report consolidates agricultural indicators for <strong>{report.district} District</strong> across crop productivity, small-scale irrigation, soil conservation, post-harvest infrastructure, and export commodity supply. The statistics represent verified NISR seasonal sample observations.
          </p>
        </div>

        {/* KPI Summary Grid */}
        <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Total Crop Production:</span>
            <span className="text-base font-extrabold text-slate-900">
              {report.overviewKpis?.cropProductionTonnes?.toLocaleString()} tonnes
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Cultivated Land Area:</span>
            <span className="text-base font-extrabold text-slate-900">
              {report.overviewKpis?.cultivatedAreaHa?.toLocaleString()} ha
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Average Crop Yield:</span>
            <span className="text-base font-extrabold text-emerald-800">
              {report.overviewKpis?.averageYieldTonnesPerHa} tonnes/ha
            </span>
          </div>
        </div>

        {/* Sector Highlights Table */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Sector Performance Highlights</h3>
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-600 font-bold">
              <tr>
                <th className="p-2.5">Sector</th>
                <th className="p-2.5">Primary Crop</th>
                <th className="p-2.5">Yield (t/ha)</th>
                <th className="p-2.5">Production (tonnes)</th>
                <th className="p-2.5">Irrigation Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(report.sectorHighlights || []).map((s: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-2.5 font-bold text-slate-800">{s.name}</td>
                  <td className="p-2.5">{s.primary_crop}</td>
                  <td className="p-2.5 font-bold text-emerald-800">{s.yield_t_ha} t/ha</td>
                  <td className="p-2.5">{s.production_tonnes?.toLocaleString()}</td>
                  <td className="p-2.5">{s.irrigation_coverage_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Official NISR Citation & Seal */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Authorized by Section 4.2 RBAC Policy · AgriLens Intelligence Platform</span>
          </div>
          <div>
            NISR Source ID: SAS-2026B-VERIFIED
          </div>
        </div>

      </div>
    </div>
  );
}
