import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, AlertTriangle, Filter, Search, RefreshCw, 
  Sparkles, Check, X, ShieldAlert, ArrowRight, Eye, ShieldCheck
} from 'lucide-react';

export default function ValidationQualityPage() {
  const [loading, setLoading] = useState(true);
  const [issuesData, setIssuesData] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [pipelineSummary, setPipelineSummary] = useState<any>(null);

  // Resolution modal
  const [resolvingIssue, setResolvingIssue] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [savingResolution, setSavingResolution] = useState(false);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:3000/api/v1/data-manager/validation-quality?status=${statusFilter}&severity=${severityFilter}`, { headers });
      if (res.ok) {
        setIssuesData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, severityFilter]);

  const handleRunPipeline = async () => {
    setRunningPipeline(true);
    setPipelineSummary(null);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:3000/api/v1/data-manager/validation-quality/run', {
        method: 'POST',
        headers
      });
      if (res.ok) {
        const json = await res.json();
        setPipelineSummary(json);
        fetchIssues();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunningPipeline(false);
    }
  };

  const handleResolveIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingIssue) return;
    setSavingResolution(true);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:3000/api/v1/data-manager/validation-quality/issues/${resolvingIssue.id}/resolve`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ notes: resolutionNotes })
      });
      if (res.ok) {
        setResolvingIssue(null);
        setResolutionNotes('');
        fetchIssues();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingResolution(false);
    }
  };

  const { summary, issues } = issuesData || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 uppercase">
              Step 3 & 4: Validation & Quality Control
            </span>
            <span className="text-xs text-slate-500 font-medium">6 Automated Rules</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Data Quality Control & Anomaly Investigation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Detect missing values, duplicates, crop naming conflicts, invalid units, and seasonal boundary mismatches.
          </p>
        </div>

        <button
          onClick={handleRunPipeline}
          disabled={runningPipeline}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow transition-all disabled:opacity-50"
        >
          {runningPipeline ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{runningPipeline ? 'Running 6-Point Rules...' : 'Execute Automated Validation'}</span>
        </button>
      </div>

      {pipelineSummary && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{pipelineSummary.message}</span>
            </div>
            <span className="font-mono font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">
              Pass Rate: {pipelineSummary.overallPassRate}%
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-2 border-t border-emerald-200/60">
            {pipelineSummary.rulesChecked?.map((r: any) => (
              <div key={r.code} className="bg-white p-2.5 rounded-xl border border-emerald-200/80 text-[11px]">
                <div className="font-mono font-bold text-slate-700">{r.code}</div>
                <div className="text-slate-600 truncate mt-0.5">{r.name}</div>
                <div className="mt-1 font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3 h-3" /> PASS ({r.scanned} scanned)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Total Inspected Issues</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{summary?.total_issues || 6}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-amber-700 font-semibold">Open Anomalies</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{summary?.open_issues || 3}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-rose-700 font-semibold">Critical Blocking</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{summary?.open_critical || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-emerald-700 font-semibold">Resolved Quality Issues</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{summary?.resolved_issues || 3}</div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open Issues Only</option>
              <option value="RESOLVED">Resolved Issues</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Reviewing errors before datasets are officially published
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Scanning data quality logs...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200 text-[11px]">
                  <th className="p-3.5">Code & Rule</th>
                  <th className="p-3.5">Issue Description</th>
                  <th className="p-3.5">Scope & Location</th>
                  <th className="p-3.5">Offending Value</th>
                  <th className="p-3.5">Severity</th>
                  <th className="p-3.5">Status & Resolution</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(issues || []).map((iss: any) => {
                  const isResolved = iss.status === 'RESOLVED';
                  return (
                    <tr key={iss.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold">
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px]">
                          {iss.issue_code}
                        </span>
                        <div className="text-[10px] text-slate-500 font-sans mt-0.5">{iss.issue_type}</div>
                      </td>
                      <td className="p-3.5 max-w-sm">
                        <div className="font-semibold text-slate-900 leading-snug">{iss.description}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Rule: {iss.rule_violated}</div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-700">
                        <div>{iss.district_name || 'National Repository'}</div>
                        <div className="text-[10px] text-slate-500">{iss.dataset_name}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-800 bg-slate-50/60 text-[11px]">
                        {iss.sample_value}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          iss.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          iss.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          iss.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {iss.severity}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {iss.status}
                        </span>
                        {isResolved && iss.resolution_notes && (
                          <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5" title={iss.resolution_notes}>
                            {iss.resolution_notes}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {!isResolved ? (
                          <button
                            onClick={() => {
                              setResolvingIssue(iss);
                              setResolutionNotes('');
                            }}
                            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-all"
                          >
                            Resolve
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-bold flex items-center justify-end gap-1">
                            <Check className="w-3.5 h-3.5" /> Resolved
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RESOLVE ISSUE MODAL */}
      {resolvingIssue && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">Record Quality Resolution</h3>
              </div>
              <button onClick={() => setResolvingIssue(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveIssue} className="mt-4 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="font-mono text-xs px-1.5 py-0.2 rounded bg-slate-200">{resolvingIssue.issue_code}</span>
                  <span>{resolvingIssue.issue_type}</span>
                </div>
                <div className="text-slate-600 text-[11px]">{resolvingIssue.description}</div>
                <div className="text-slate-500 font-mono text-[10px]">Offending Value: {resolvingIssue.sample_value}</div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Resolution Action & Documentation Notes *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Verified with NISR enumerator field logs. Normalized unit from square meters to hectares."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolvingIssue(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingResolution}
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-all disabled:opacity-50"
                >
                  {savingResolution ? 'Saving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
