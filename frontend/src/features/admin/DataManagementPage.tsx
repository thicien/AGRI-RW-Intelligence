import React, { useState } from 'react';
import { 
  Database, UploadCloud, FileText, CheckCircle2, AlertTriangle, 
  Clock, ShieldCheck, RefreshCw, Eye, Download, Search, Filter, 
  ExternalLink, Layers, Check, FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function DataManagementPage() {
  const { currentUser } = useAuth();
  const [selectedSeason, setSelectedSeason] = useState('2026A');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Dataset Inventory
  const datasets = [
    {
      id: 'ds-1',
      name: 'NISR Seasonal Agricultural Survey (SAS) 2026A',
      category: 'Official Survey Microdata',
      source: 'National Institute of Statistics of Rwanda (NISR)',
      records: 1140,
      version: 'v2.6A-Published',
      status: 'APPROVED_PUBLISHED',
      publishedDate: '2026-09-15',
      coverage: '30 Districts × 10 Crops',
      checksum: 'sha256:4a8b79e2...'
    },
    {
      id: 'ds-2',
      name: 'NISR Seasonal Agricultural Survey (SAS) 2025B',
      category: 'Official Survey Microdata',
      source: 'National Institute of Statistics of Rwanda (NISR)',
      records: 1140,
      version: 'v2.5B-Archived',
      status: 'APPROVED_PUBLISHED',
      publishedDate: '2025-07-20',
      coverage: '30 Districts × 10 Crops',
      checksum: 'sha256:9f2c18d4...'
    },
    {
      id: 'ds-3',
      name: 'RAB National Small-Scale Irrigation Inventory',
      category: 'Infrastructure & Water GIS',
      source: 'Rwanda Agricultural Board (RAB)',
      records: 486,
      version: 'v1.4-Current',
      status: 'APPROVED_PUBLISHED',
      publishedDate: '2026-04-10',
      coverage: 'All Agro-Ecological Zones',
      checksum: 'sha256:1b6e42a9...'
    },
    {
      id: 'ds-4',
      name: 'Soil Conservation & Acidity Treatment Census',
      category: 'Agronomic Field Census',
      source: 'MINAGRI & RAB Soil Division',
      records: 1140,
      version: 'v2.1-Current',
      status: 'APPROVED_PUBLISHED',
      publishedDate: '2026-05-18',
      coverage: 'Erosion risk & liming rates',
      checksum: 'sha256:7c9e33b1...'
    },
    {
      id: 'ds-5',
      name: 'MINAGRI Post-Harvest Storage & Processing Registry',
      category: 'Facilities & Logistics',
      source: 'MINAGRI Value Addition Directorate',
      records: 840,
      version: 'v2.0-Verified',
      status: 'APPROVED_PUBLISHED',
      publishedDate: '2026-06-01',
      coverage: 'Warehouses, Dryers, Cold Storage',
      checksum: 'sha256:3d8a94c2...'
    },
    {
      id: 'ds-6',
      name: 'NAEB Agricultural Export & Cross-Border Shipments',
      category: 'Trade & Market Intelligence',
      source: 'National Agricultural Export Development Board (NAEB)',
      records: 1140,
      version: 'v2.6A-Verified',
      status: 'APPROVED_PUBLISHED',
      publishedDate: '2026-10-01',
      coverage: '10 Commodities × Global Markets',
      checksum: 'sha256:5e1f82b7...'
    }
  ];

  const handleSimulateUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    }, 1500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-main">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-warning/15 text-warning-dark border border-warning/30">
              Screen 5: Data Governance
            </span>
            <span className="text-xs text-muted font-medium">Visible to Authorized Data Managers & Administrators</span>
          </div>
          <h1 className="text-2xl font-extrabold text-text-main flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Dataset Inventory & Pipeline Management
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage statistical survey ingestions, extraction previews, automated validation checks, and publication approvals.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface p-2 rounded-xl border border-border-main text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-success" />
          <span>Two-Man Sign-Off Active</span>
        </div>
      </div>

      {/* Upload & Staging Box */}
      <div className="bg-surface p-6 rounded-2xl border border-border-main shadow-sm space-y-4">
        <h2 className="font-extrabold text-base text-text-main flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-primary" />
          Ingest New Survey Dataset or GIS Shapefile
        </h2>

        <form onSubmit={handleSimulateUpload} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs font-bold text-text-main block mb-1">Dataset Type:</label>
            <select className="w-full bg-background border border-border-main p-2 rounded-lg text-xs font-semibold">
              <option>NISR Seasonal Survey (SAS CSV)</option>
              <option>Administrative Boundary (GeoJSON/SHP)</option>
              <option>NAEB Export Statistics (XLSX)</option>
              <option>Soil / Weather Indicators (NetCDF/TIFF)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-text-main block mb-1">Target Agricultural Season:</label>
            <select 
              value={selectedSeason} 
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full bg-background border border-border-main p-2 rounded-lg text-xs font-semibold"
            >
              <option value="2026B">2026 Season B (Upcoming)</option>
              <option value="2026A">2026 Season A (Current)</option>
              <option value="2025B">2025 Season B</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-text-main block mb-1">File Attachment:</label>
            <input 
              type="file" 
              className="w-full bg-background border border-border-main p-1.5 rounded-lg text-xs font-mono text-muted file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary-light text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              Start Ingestion Pipeline
            </button>
          </div>
        </form>

        {uploadSuccess && (
          <div className="p-3 bg-success/15 border border-success/30 rounded-lg text-xs text-success font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Dataset successfully uploaded, schema validated, and queued for publication approval!</span>
          </div>
        )}
      </div>

      {/* Dataset Inventory Table */}
      <div className="bg-surface rounded-2xl border border-border-main shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-border-main">
          <h2 className="font-extrabold text-base text-text-main flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Official Dataset Repository & Version History
          </h2>
          <span className="text-xs text-muted font-medium">6 Verified Data Feeds</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-background text-text-main uppercase font-bold tracking-wider border-b border-border-main text-[11px]">
                <th className="p-3">Dataset Title & Scope</th>
                <th className="p-3">Source & Author</th>
                <th className="p-3">Total Records</th>
                <th className="p-3">Version Tag</th>
                <th className="p-3">Governance Status</th>
                <th className="p-3">Published Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {datasets.map(ds => (
                <tr key={ds.id} className="hover:bg-background/60 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-text-main text-sm">{ds.name}</div>
                    <div className="text-[11px] text-muted">{ds.coverage}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-text-main">{ds.source}</div>
                    <div className="text-[10px] text-muted font-mono">{ds.checksum}</div>
                  </td>
                  <td className="p-3 font-semibold text-primary">{ds.records.toLocaleString()} rows</td>
                  <td className="p-3">
                    <span className="font-mono text-xs bg-background px-2 py-0.5 rounded border border-border-main">
                      {ds.version}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-success/15 text-success border border-success/30">
                      <Check className="w-3 h-3" /> Approved & Official
                    </span>
                  </td>
                  <td className="p-3 text-muted">{ds.publishedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
