import React, { useState } from 'react';
import { 
  FileBarChart, Download, FileText, CheckCircle2, 
  BarChart3, RefreshCw, Printer, ShieldCheck 
} from 'lucide-react';

export default function AnalyticsReportsPage() {
  const [exported, setExported] = useState(false);

  const reportMetrics = [
    { label: 'Overall Pipeline Quality Pass Rate', value: '98.4%', trend: '+1.2% vs baseline' },
    { label: 'Historical Datasets Preserved', value: '11 Datasets', trend: '13 Years (2014-2026)' },
    { label: 'Total Verified Records in Database', value: '21,767 Records', trend: '100% Non-destructive' },
    { label: 'Geographic Completeness Index', value: '100.0%', trend: '30 of 30 Districts' },
    { label: 'Open Data Quality Anomalies', value: '3 Open', trend: '0 Critical Blockers' },
    { label: 'Automated Processing Jobs', value: '6 Executed', trend: 'Average duration 38s' }
  ];

  const handleExportCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "AgriLens Rwanda - Data Governance and Quality Report\n" +
      "Generated At," + new Date().toISOString() + "\n" +
      "Authority,National Institute of Statistics of Rwanda (NISR)\n" +
      "Data Manager,datamanager@agrilens.gov.rw\n\n" +
      "Metric,Value,Status\n" +
      reportMetrics.map(m => `"${m.label}","${m.value}","${m.trend}"`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AgriLens_Data_Governance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExported(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
              Section 1.6 Governance Reports
            </span>
            <span className="text-xs text-slate-500 font-medium">State of Platform Data</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Data Governance & Quality Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Investigate data-quality issues and generate authorized analytical reports on the health of the platform's data.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow transition-all self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>{exported ? 'Report Downloaded' : 'Export Governance Brief (CSV)'}</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {reportMetrics.map((m, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="text-xs font-semibold text-slate-500">{m.label}</div>
            <div className="text-2xl font-black text-slate-900">{m.value}</div>
            <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {m.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Official Data Health Audit Statement */}
      <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <span>Official Data Reliability & Integrity Declaration</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The AgriLens Rwanda data management subsystem enforces strict non-destructive seasonal ingestion. 
          All incoming surveys from the National Institute of Statistics of Rwanda (NISR) undergo a six-point automated quality inspection (missing values, duplicates, taxonomy consistency, range plausible boundaries, administrative unit geo-codes, and seasonal harvest calendar alignment).
          Analytical caching ensures that the five downstream modules (Productivity, Irrigation, Soil, Post-Harvest, and Exports) consume only fully validated and published records.
        </p>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-slate-700">
          <span>Authority: NISR Data Ingestion Engine v2.4</span>
          <span>Compliance: GOR Open Data Directive 2026</span>
          <span className="text-emerald-700 font-bold">Status: PRODUCTION READY</span>
        </div>
      </div>

    </div>
  );
}
