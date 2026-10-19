import React, { useState } from 'react';
import { 
  UploadCloud, FileSpreadsheet, FileText, CheckCircle2, 
  AlertTriangle, RefreshCw, Layers, ArrowRight, Eye, 
  FileCheck, Download, Trash2, Check
} from 'lucide-react';

export default function ImportExtractionPage() {
  const [stagedFiles, setStagedFiles] = useState([
    {
      id: '1',
      filename: 'NISR_SAS_Comprehensive_Full_Archive_2014_2026.xlsx',
      format: 'XLSX',
      domain: 'PRODUCTIVITY',
      totalRows: 17912,
      validRows: 17780,
      invalidRows: 132,
      parser: 'OpenPyXL / SheetJS Tabular Parser',
      status: 'COMMITTED',
      uploadedAt: '2026-10-16 09:17'
    },
    {
      id: '2',
      filename: 'SAS 2026B_Main report.pdf',
      format: 'PDF',
      domain: 'DOCUMENTATION_PDF',
      totalRows: 320,
      validRows: 312,
      invalidRows: 8,
      parser: 'Camelot PDF Table Extractor v2.4',
      status: 'COMMITTED',
      uploadedAt: '2026-10-15 16:02'
    },
    {
      id: '3',
      filename: 'Tables_2025_Season_B_0.xlsx',
      format: 'XLSX',
      domain: 'MIXED',
      totalRows: 1395,
      validRows: 1395,
      invalidRows: 0,
      parser: 'OpenPyXL / SheetJS Tabular Parser',
      status: 'COMMITTED',
      uploadedAt: '2026-10-15 15:02'
    },
    {
      id: '4',
      filename: 'Tables_2026_Season_C_Staging_Draft.xlsx',
      format: 'XLSX',
      domain: 'CROP_STATISTICS',
      totalRows: 420,
      validRows: 406,
      invalidRows: 14,
      parser: 'OpenPyXL / SheetJS Tabular Parser',
      status: 'NEEDS_REVIEW',
      uploadedAt: '2026-10-19 11:20'
    }
  ]);

  const [uploading, setUploading] = useState(false);
  const [uploadedMsg, setUploadedMsg] = useState<string | null>(null);

  const simulateUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploadedMsg('File "NISR_SAS_2026_Season_A_Field_Returns.xlsx" parsed and 1,845 records staged for quality check.');
      setStagedFiles(prev => [
        {
          id: String(Date.now()),
          filename: 'NISR_SAS_2026_Season_A_Field_Returns.xlsx',
          format: 'XLSX',
          domain: 'CROP_STATISTICS',
          totalRows: 1845,
          validRows: 1840,
          invalidRows: 5,
          parser: 'OpenPyXL / SheetJS Tabular Parser',
          status: 'STAGED',
          uploadedAt: 'Just now'
        },
        ...prev
      ]);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
              Step 2: Extract & Stage
            </span>
            <span className="text-xs text-slate-500 font-medium">Data Pipeline Workspace</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Import, Extraction & Table Parsing Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Parse structured tables from NISR agricultural PDF and XLSX documents into temporary staging records.
          </p>
        </div>
      </div>

      {uploadedMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{uploadedMsg}</span>
          </div>
          <button onClick={() => setUploadedMsg(null)} className="underline">Dismiss</button>
        </div>
      )}

      {/* Drag and drop upload zone */}
      <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 transition-all text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
          <UploadCloud className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Upload NISR Survey Files (PDF or XLSX)</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Drag and drop official seasonal agricultural tables or survey reports. Automated table extraction will extract records into the Staging area.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={simulateUpload}
            disabled={uploading}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            <span>{uploading ? 'Parsing Tables...' : 'Select File to Ingest'}</span>
          </button>
        </div>
      </div>

      {/* Staged & Extraction Jobs List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Extraction Jobs & Staging Batches</h3>
            <p className="text-xs text-slate-500">Review parser accuracy and invalid rows before commitment.</p>
          </div>
          <span className="text-xs font-bold text-slate-500">{stagedFiles.length} Ingestion Batches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200 text-[11px]">
                <th className="p-3.5">Filename & Parser</th>
                <th className="p-3.5">Format</th>
                <th className="p-3.5">Target Domain</th>
                <th className="p-3.5">Extracted Rows</th>
                <th className="p-3.5">Validation Breakdown</th>
                <th className="p-3.5">Ingestion Status</th>
                <th className="p-3.5">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stagedFiles.map((file) => (
                <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{file.filename}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{file.parser}</div>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      file.format === 'PDF' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {file.format}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-700">{file.domain}</td>
                  <td className="p-3.5 font-mono font-bold text-slate-800">{file.totalRows.toLocaleString()}</td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-emerald-700 font-bold">{file.validRows.toLocaleString()} valid</span>
                      {file.invalidRows > 0 && (
                        <span className="text-amber-700 font-bold">({file.invalidRows} flagged)</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      file.status === 'COMMITTED' ? 'bg-teal-100 text-teal-800' : 
                      file.status === 'STAGED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {file.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500 text-[11px]">{file.uploadedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
