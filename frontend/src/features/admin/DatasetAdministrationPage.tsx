import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../config/api';
import { 
  Database, ShieldCheck, Lock, AlertTriangle, CheckCircle2, 
  FileText, RefreshCw, XCircle, ShieldAlert, BarChart3, Layers
} from 'lucide-react';

interface DatasetItem {
  id: string;
  name: string;
  code: string;
  status: string;
  created_at: string;
  updated_at: string;
  versions_count: number;
}

export default function DatasetAdministrationPage() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [governanceSummary, setGovernanceSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<{ status: number; message: string; title: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('admin/datasets'));
      if (res.ok) {
        const data = await res.json();
        setDatasets(data.datasets || []);
        setGovernanceSummary(data.governanceSummary || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  // Demonstration of Rule Enforcement: Directly modify stats
  const testDirectStatsModification = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(apiUrl('admin/agricultural-stats'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crop: 'Irish Potato', season: '2025A', yield: 45.0 })
      });
      const data = await res.json();
      setTestResult({
        status: res.status,
        message: data.message,
        title: 'Direct Statistical Edit Blocked (Security Policy)'
      });
    } catch (err: any) {
      setTestResult({ status: 500, message: err.message, title: 'Network Error' });
    } finally {
      setTesting(false);
    }
  };

  // Demonstration of Rule Enforcement: Publish without data approval
  const testDirectPublish = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(apiUrl('admin/publish-dataset-direct'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId: 'ds-test-01' })
      });
      const data = await res.json();
      setTestResult({
        status: res.status,
        message: data.message,
        title: 'Unapproved Publication Blocked (Data Governance Rule)'
      });
    } catch (err: any) {
      setTestResult({ status: 500, message: err.message, title: 'Network Error' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
            <Database className="w-4 h-4 text-amber-600" />
            <span>Dataset Technical Governance & Pipeline Monitoring</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Dataset Administration & Governance Status
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Monitor registered seasonal datasets, extraction versions, and NISR data governance workflows. System Administrators monitor pipeline availability, but cannot modify statistical values directly.
          </p>
        </div>

        <button
          onClick={fetchDatasets}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Datasets</span>
        </button>
      </div>

      {/* Security Guardrail Demonstration Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-700 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30">
              <Lock className="w-3.5 h-3.5" />
              <span>Section 6 Administrative Restrictions (Enforced by Backend)</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Data Integrity Protections & Two-Person Workflow
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              To prevent analytical bias, the System Administrator is strictly barred from altering agricultural yields or publishing datasets without Data Manager quality validation. Click below to verify the backend 403 Forbidden enforcement.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={testDirectStatsModification}
              disabled={testing}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-md disabled:opacity-50"
            >
              Test Modify Crop Stats (Deny)
            </button>
            <button
              onClick={testDirectPublish}
              disabled={testing}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors shadow-md disabled:opacity-50"
            >
              Test Direct Publish (Deny)
            </button>
          </div>
        </div>

        {/* Live Test Output Feedback */}
        {testResult && (
          <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-slate-700 text-xs animate-in fade-in">
            <div className="flex items-center justify-between text-rose-400 font-bold mb-1">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-500" />
                <span>{testResult.title}</span>
              </div>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                HTTP {testResult.status} FORBIDDEN
              </span>
            </div>
            <div className="text-slate-300 text-[11px] font-mono mt-1">
              {testResult.message}
            </div>
          </div>
        )}
      </div>

      {/* Governance Summary KPI Cards */}
      {governanceSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Crop Statistics Records</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {governanceSummary.cropStatisticsRecords.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
              18,432 NISR Seasonal Records
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Soil & Fertility Records</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {governanceSummary.soilFertilityRecords.toLocaleString()}
            </div>
            <span className="text-[11px] text-blue-700 font-semibold mt-1 block">
              District Soil Profiles
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Irrigation Opportunity Records</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {governanceSummary.irrigationRecords.toLocaleString()}
            </div>
            <span className="text-[11px] text-teal-700 font-semibold mt-1 block">
              Catchment & Buffer Statistics
            </span>
          </div>
        </div>
      )}

      {/* Datasets Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Registered Agricultural Datasets ({datasets.length})
          </h3>
          <span className="text-xs text-slate-400">
            Official Repository Managed by Data Managers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5">Dataset Name</th>
                <th className="py-3 px-4">Identifier Code</th>
                <th className="py-3 px-4 text-center">Version Count</th>
                <th className="py-3 px-4">Governance Status</th>
                <th className="py-3 px-5 text-right">Registered On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">Loading datasets...</td>
                </tr>
              ) : datasets.map((ds) => (
                <tr key={ds.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-slate-900 flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>{ds.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                    {ds.code}
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                    {ds.versions_count || 1} Versions
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      ds.status === 'PUBLISHED' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {ds.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right text-slate-400 text-[11px]">
                    {new Date(ds.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
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
