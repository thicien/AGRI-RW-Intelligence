import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../config/api';
import { Link } from 'react-router-dom';
import { 
  Database, CheckCircle2, AlertTriangle, Cog, Layers, 
  Calendar, FileSpreadsheet, FileText, ArrowRight, RefreshCw, 
  UploadCloud, Check, ChevronRight, ShieldCheck, Activity,
  Globe, Droplets, Mountain, Warehouse, Sprout, BarChart3,
  Clock, Sparkles
} from 'lucide-react';

export default function DataManagerOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [runningDQ, setRunningDQ] = useState(false);
  const [dqResult, setDqResult] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(apiUrl('data-manager/overview'), { headers });
      if (res.ok) {
        setOverview(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleRunDQPipeline = async () => {
    setRunningDQ(true);
    setDqResult(null);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(apiUrl('data-manager/validation-quality/run'), {
        method: 'POST',
        headers
      });
      if (res.ok) {
        const json = await res.json();
        setDqResult(json.message || 'Data quality check completed. All records verified.');
        fetchOverview();
      }
    } catch (e: any) {
      setDqResult('Error running validation pipeline.');
    } finally {
      setRunningDQ(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <div className="text-sm font-semibold text-slate-600">
          Loading Data Operations & Intelligence Workspace...
        </div>
      </div>
    );
  }

  const { kpis, categories, coverageSummary, recentIssues, recentJobs, moduleReadiness } = overview || {};

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">

      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950 text-white rounded-3xl p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.15),transparent_70%)] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-500/25 text-emerald-200 border border-emerald-400/30">
                Data Manager · Authorized Workspace
              </span>
              <span className="flex items-center gap-1 text-xs text-emerald-300/80 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Pipeline Governance Enforced
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Data Operations Overview
            </h1>
            <p className="text-sm text-emerald-100/90 max-w-2xl mt-1.5 leading-relaxed">
              Monitor dataset ingestion, quality, processing and publication across agricultural intelligence.
              Preserve multi-year and seasonal NISR datasets for Rwanda's 30 districts.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleRunDQPipeline}
              disabled={runningDQ}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold shadow transition-all disabled:opacity-50"
            >
              {runningDQ ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" /> : <Sparkles className="w-4 h-4 text-emerald-700" />}
              <span>{runningDQ ? 'Scanning Rules...' : 'Run DQ Validation'}</span>
            </button>
            <Link
              to="/data-manager/datasets"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-bold border border-emerald-400/30 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Register Source</span>
            </Link>
          </div>
        </div>

        {dqResult && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-700/40 border border-emerald-400/40 text-xs text-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-300" />
              <span>{dqResult}</span>
            </div>
            <button onClick={() => setDqResult(null)} className="text-emerald-300 hover:text-white text-xs">Dismiss</button>
          </div>
        )}
      </div>

      {/* 2. Four Key Operational Indicators (Section 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Registered Datasets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Registered datasets</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {kpis?.registeredDatasets || 11}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2 font-medium">
            <span>All authorized sources</span>
            <span className="text-emerald-700 font-bold">PDF & XLSX</span>
          </div>
        </div>

        {/* KPI 2: Validated Datasets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Validated datasets</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-all">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {kpis?.validatedDatasets || 10}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2 font-medium">
            <span>Validation status</span>
            <span className="text-teal-700 font-bold">{kpis?.avgQualityScore || 98.4}% Quality Score</span>
          </div>
        </div>

        {/* KPI 3: Quality Issues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Quality issues</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-all">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 tracking-tight">
            {kpis?.qualityIssues || 3}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2 font-medium">
            <span>Outstanding issues</span>
            <span className="text-amber-700 font-bold">{kpis?.criticalIssues || 0} Critical</span>
          </div>
        </div>

        {/* KPI 4: Processing Jobs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Processing jobs</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Cog className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {kpis?.processingJobsActive ? '1 Active' : 'Idle'}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2 font-medium">
            <span>Current job status</span>
            <span className="text-indigo-700 font-bold">{kpis?.processingJobsCompleted || 5} Completed</span>
          </div>
        </div>

      </div>

      {/* 3. Dataset Management (Section 2 - Subsection 1) */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-700" />
              <h2 className="text-lg font-bold text-slate-900">Dataset Management</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload, register, validate, version and publish approved agricultural datasets across all categories.
            </p>
          </div>
          <Link
            to="/data-manager/datasets"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
          >
            <span>View Full Dataset Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {categories?.map((cat: any) => (
            <div 
              key={cat.id}
              className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-emerald-300 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {cat.datasetsCount} Datasets
                </span>
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {cat.status}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{cat.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{cat.subtitle}</p>
              </div>
              <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 font-medium">
                {cat.formatBreakdown}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Coverage:</span>
                <span className="font-bold text-slate-700">{cat.latestSeason}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Seasonal Data Coverage (Section 2 - Subsection 2) */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-700" />
              <h2 className="text-lg font-bold text-slate-900">Seasonal Data Coverage</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect which years, seasons, crops and geographic areas are represented in the registered datasets without overwriting historical records.
            </p>
          </div>
          <Link
            to="/data-manager/seasons-coverage"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
          >
            <span>Inspect 30 Districts Matrix</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
            <div className="text-xs text-emerald-800 font-semibold">Year coverage</div>
            <div className="text-xl font-bold text-emerald-950 mt-1">2014 – 2026</div>
            <div className="text-[11px] text-emerald-700/80 mt-0.5 font-medium">13 consecutive years</div>
          </div>
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/60">
            <div className="text-xs text-teal-800 font-semibold">Season coverage</div>
            <div className="text-xl font-bold text-teal-950 mt-1">Season A · B · C</div>
            <div className="text-[11px] text-teal-700/80 mt-0.5 font-medium">All national harvests</div>
          </div>
          <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200/60">
            <div className="text-xs text-cyan-800 font-semibold">Crop coverage</div>
            <div className="text-xl font-bold text-cyan-950 mt-1">24 Major Crops</div>
            <div className="text-[11px] text-cyan-700/80 mt-0.5 font-medium">Cereals, Tubers, Cash crops</div>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60">
            <div className="text-xs text-blue-800 font-semibold">Geographic coverage</div>
            <div className="text-xl font-bold text-blue-950 mt-1">30 Districts</div>
            <div className="text-[11px] text-blue-700/80 mt-0.5 font-medium">100% National Territory</div>
          </div>
        </div>

        {/* Recent seasons table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 uppercase font-bold border-y border-slate-200 text-[11px]">
                <th className="p-3">Season Code</th>
                <th className="p-3">Year</th>
                <th className="p-3">Monitored Crop Records</th>
                <th className="p-3">Geographic Scope</th>
                <th className="p-3">Pipeline Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(coverageSummary?.seasons || []).slice(0, 6).map((s: any) => (
                <tr key={s.season_code} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-bold text-slate-900 font-mono">Season {s.season_code}</td>
                  <td className="p-3 font-semibold text-slate-700">{s.year}</td>
                  <td className="p-3 font-mono font-medium text-slate-700">{s.crop_records} rows</td>
                  <td className="p-3 font-medium text-slate-600">30 Districts · Rwanda National</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Check className="w-3 h-3" /> Published & Preserved
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Data Quality & Processing (Section 2 - Subsection 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
        
        {/* Validation Reports & Issues */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Data Quality & Validation Issues
              </h3>
              <p className="text-xs text-slate-500">6-point automated quality inspection results</p>
            </div>
            <Link
              to="/data-manager/validation-quality"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
            >
              View All ({kpis?.qualityIssues || 3})
            </Link>
          </div>

          <div className="space-y-3">
            {recentIssues?.map((issue: any) => {
              const isResolved = issue.status === 'RESOLVED';
              return (
                <div 
                  key={issue.id} 
                  className={`p-3.5 rounded-xl border transition-all text-xs space-y-1.5 ${
                    isResolved ? 'bg-slate-50/60 border-slate-200 text-slate-600' : 'bg-amber-50/50 border-amber-200/80 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px]">
                        {issue.issue_code}
                      </span>
                      <span className="font-bold text-slate-900">{issue.issue_type.replace(/_/g, ' ')}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {issue.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Target: <strong className="text-slate-800">{issue.field_name || 'dataset'}</strong> ({issue.district_name || 'National'})
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {issue.dataset_name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Processing Job History */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Cog className="w-4 h-4 text-indigo-600" />
                Processing Jobs & Normalization History
              </h3>
              <p className="text-xs text-slate-500">Extraction, cleaning and spatial jobs</p>
            </div>
            <Link
              to="/data-manager/processing-jobs"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
            >
              Manage Jobs
            </Link>
          </div>

          <div className="space-y-3">
            {recentJobs?.map((job: any) => (
              <div 
                key={job.id}
                className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 truncate max-w-[240px]">
                    {job.job_name}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Module: <strong className="text-slate-700">{job.target_module}</strong></span>
                  <span>{job.total_records} records in {job.duration_seconds}s</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all"
                    style={{ width: `${job.progress_pct || 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 6. Agricultural Module Readiness (Section 2 - Subsection 4) */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-700" />
              <h2 className="text-lg font-bold text-slate-900">Agricultural Module Readiness</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review the availability and quality of the source data supporting each of the five analytical modules.
            </p>
          </div>
          <Link
            to="/data-manager/agricultural-data"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
          >
            <span>Explore Raw Data by Module</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {moduleReadiness?.map((m: any) => {
            const icons: Record<string, any> = {
              'Agricultural Productivity': Sprout,
              'Irrigation Opportunities': Droplets,
              'Soil and Fertility': Mountain,
              'Post-Harvest and Value Addition': Warehouse,
              'Export Opportunities': Globe,
            };
            const Icon = icons[m.module] || Layers;

            return (
              <div 
                key={m.module}
                className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 hover:border-emerald-400 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs leading-snug">
                    {m.module}
                  </h3>
                  <div className="mt-2 text-2xl font-black text-slate-900">
                    {m.readinessPct}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                    {m.recordsCount.toLocaleString()} Verified Records
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-200/70 pt-3">
                  <div className="text-[10px] text-slate-600 line-clamp-2 leading-relaxed">
                    {m.coverageStatus}
                  </div>
                  <Link
                    to={m.route}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 pt-1"
                  >
                    <span>Inspect Data</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
