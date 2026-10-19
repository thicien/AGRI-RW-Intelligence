import React, { useState, useEffect } from 'react';
import { 
  Cog, Play, RefreshCw, CheckCircle2, AlertTriangle, 
  Clock, Layers, Check, Database, Sparkles, Filter 
} from 'lucide-react';

export default function ProcessingJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJobType, setRunningJobType] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:3000/api/v1/data-manager/processing-jobs', { headers });
      if (res.ok) {
        setJobs(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleTriggerJob = async (jobType: string, moduleName: string) => {
    setRunningJobType(jobType);
    setFeedback(null);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:3000/api/v1/data-manager/processing-jobs/run', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jobType,
          targetModule: moduleName,
          seasonCode: '2026B'
        })
      });

      const json = await res.json();
      if (res.ok) {
        setFeedback(json.message);
        fetchJobs();
      }
    } catch (e: any) {
      setFeedback('Error executing job.');
    } finally {
      setRunningJobType(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 uppercase">
              Section 1.4 Processing Pipeline
            </span>
            <span className="text-xs text-slate-500 font-medium">Analytical Readiness</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Data Processing & Normalization Jobs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Execute cleaning, statistical normalization, aggregation, and spatial alignment pipelines.
          </p>
        </div>

        <button
          onClick={fetchJobs}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline">Dismiss</button>
        </div>
      )}

      {/* Available Authorized Pipeline Tasks */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Trigger Authorized Processing Tasks</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="font-bold text-slate-900 text-xs">Outlier Cleaning & Range Normalization</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Trims extreme statistical outliers in yield and cultivated area using Interquartile Range (IQR).
            </p>
            <button
              onClick={() => handleTriggerJob('CLEANING_NORMALIZATION', 'Agricultural Productivity')}
              disabled={runningJobType === 'CLEANING_NORMALIZATION'}
              className="w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {runningJobType === 'CLEANING_NORMALIZATION' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>Execute Cleaning Task</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="font-bold text-slate-900 text-xs">Spatial Administrative Boundary Match</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Joins tabulated records to 30 district and 413 sector GIS boundaries using NISR standardized geo-codes.
            </p>
            <button
              onClick={() => handleTriggerJob('SPATIAL_PROCESSING', 'Maps & Spatial Data')}
              disabled={runningJobType === 'SPATIAL_PROCESSING'}
              className="w-full py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {runningJobType === 'SPATIAL_PROCESSING' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>Execute Spatial Alignment</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="font-bold text-slate-900 text-xs">Refresh 5 Modules Analytics Cache</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Updates materialized statistical views so that District Officers and Planners access verified fresh metrics.
            </p>
            <button
              onClick={() => handleTriggerJob('MODULE_REFRESH', 'All Five Modules')}
              disabled={runningJobType === 'MODULE_REFRESH'}
              className="w-full py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {runningJobType === 'MODULE_REFRESH' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Refresh Analytics Cache</span>
            </button>
          </div>

        </div>
      </div>

      {/* Jobs History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Job Execution Queue & History</h3>
          <span className="text-xs font-bold text-slate-500">{jobs.length} Total Jobs Executed</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Loading processing jobs...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200 text-[11px]">
                  <th className="p-3.5">Job Name & Type</th>
                  <th className="p-3.5">Target Analytical Module</th>
                  <th className="p-3.5">Season</th>
                  <th className="p-3.5">Records Processed</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Triggered By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 max-w-sm">
                      <div className="font-bold text-slate-900">{job.job_name}</div>
                      <span className="inline-block mt-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold uppercase">
                        {job.job_type}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-700">{job.target_module}</td>
                    <td className="p-3.5 font-mono text-slate-600">{job.season_code || 'ALL'}</td>
                    <td className="p-3.5 font-mono">
                      <div className="font-bold text-slate-900">{job.total_records.toLocaleString()} rows</div>
                      {job.flagged_records > 0 ? (
                        <span className="text-amber-600 font-medium text-[10px]">{job.flagged_records} flagged</span>
                      ) : (
                        <span className="text-emerald-600 font-medium text-[10px]">100% clean</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">{job.duration_seconds}s</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right text-slate-500 font-mono text-[11px]">
                      {job.triggered_by}
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
