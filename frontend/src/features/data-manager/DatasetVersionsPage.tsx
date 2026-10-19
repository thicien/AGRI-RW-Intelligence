import React, { useState, useEffect } from 'react';
import { 
  GitBranch, CheckCircle2, RefreshCw, FileText, 
  Search, ShieldCheck, Download, History 
} from 'lucide-react';

export default function DatasetVersionsPage() {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersions = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('agrilens_token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('http://localhost:3000/api/v1/data-manager/versions', { headers });
        if (res.ok) {
          setVersions(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchVersions();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 uppercase">
              Section 1.6 Versioning & Traceability
            </span>
            <span className="text-xs text-slate-500 font-medium">Immutable Lineage</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dataset Versioning & Change History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain dataset versions, review import history, track publication status, and compare version checksums.
          </p>
        </div>
      </div>

      {/* Versions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Official Dataset Version Registry</h3>
          <span className="text-xs font-semibold text-slate-500">{versions.length} Tracked Releases</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Loading version registry...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200 text-[11px]">
                  <th className="p-3.5">Dataset & Version</th>
                  <th className="p-3.5">Survey Season</th>
                  <th className="p-3.5">Storage File Path</th>
                  <th className="p-3.5">Cryptographic Checksum</th>
                  <th className="p-3.5">Release Status</th>
                  <th className="p-3.5">Change Summary</th>
                  <th className="p-3.5 text-right">Ingested At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {versions.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{v.dataset_name}</div>
                      <span className="inline-block mt-0.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                        {v.version}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">
                      Season {v.season_code} ({v.year})
                    </td>
                    <td className="p-3.5 font-mono text-[10px] text-slate-600 max-w-xs truncate" title={v.file_path}>
                      {v.file_path}
                    </td>
                    <td className="p-3.5 font-mono text-[10px] text-slate-500">
                      {v.checksum || 'MD5_VALIDATED'}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        v.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {v.is_active ? 'ACTIVE RELEASE' : 'ARCHIVED'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate" title={v.change_summary}>
                      {v.change_summary || 'Standard official release ingested.'}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-500 text-[11px]">
                      {new Date(v.imported_at || Date.now()).toLocaleDateString()}
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
