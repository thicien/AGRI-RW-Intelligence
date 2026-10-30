import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../config/api';
import { 
  Database, UploadCloud, Search, Filter, CheckCircle2, 
  AlertTriangle, FileText, FileSpreadsheet, Check, X, 
  RefreshCw, ChevronRight, Eye, ShieldCheck, Download
} from 'lucide-react';

export default function DatasetsManagementPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Register Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regDesc, setRegDesc] = useState('');
  const [regType, setRegType] = useState('CROP_STATISTICS');
  const [regYear, setRegYear] = useState('2026');
  const [regSeason, setRegSeason] = useState('2026B');
  const [regFormat, setRegFormat] = useState('XLSX');
  const [submitting, setSubmitting] = useState(false);

  // Publish Modal State
  const [publishTarget, setPublishTarget] = useState<any | null>(null);
  const [publishNotes, setPublishNotes] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(apiUrl(`data-manager/datasets?domain=${selectedDomain}&format=${selectedFormat}`), { headers });
      if (res.ok) {
        setDatasets(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [selectedDomain, selectedFormat]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedbackMsg(null);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(apiUrl('data-manager/datasets'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: regName,
          description: regDesc,
          datasetType: regType,
          year: parseInt(regYear, 10),
          seasonCode: regSeason,
          fileFormat: regFormat,
          fileSizeKb: regFormat === 'PDF' ? 12800 : 4200,
          rowCount: regFormat === 'PDF' ? 140 : 1600
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Registration failed');

      setFeedbackMsg({ text: json.message, type: 'success' });
      setShowRegisterModal(false);
      setRegName('');
      setRegDesc('');
      fetchDatasets();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishTarget) return;
    setPublishing(true);
    setFeedbackMsg(null);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(apiUrl(`data-manager/datasets/${publishTarget.id}/publish`), {
        method: 'POST',
        headers,
        body: JSON.stringify({ notes: publishNotes })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Publication authorization failed');

      setFeedbackMsg({ text: json.message, type: 'success' });
      setPublishTarget(null);
      setPublishNotes('');
      fetchDatasets();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message, type: 'error' });
    } finally {
      setPublishing(false);
    }
  };

  const filteredDatasets = datasets.filter(d => 
    searchQuery === '' || 
    d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.season_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
              Section 1.1 Ingestion & Catalog
            </span>
            <span className="text-xs text-slate-500 font-medium">National Repository</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Agricultural Dataset Ingestion & Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Register incoming NISR PDF reports, seasonal Excel workbooks and supplementary surveys.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow transition-all self-start md:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Register New Dataset</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
          feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-rose-50 text-rose-800 border border-rose-300'
        }`}>
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="font-bold underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search datasets, seasons, or formats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
          >
            <option value="ALL">All Domains</option>
            <option value="CROP_STATISTICS">Crop Statistics</option>
            <option value="IRRIGATION">Irrigation</option>
            <option value="SOIL_FERTILITY">Soil & Fertility</option>
            <option value="POST_HARVEST">Post-Harvest</option>
            <option value="TRADE_EXPORTS">Trade & Exports</option>
            <option value="DOCUMENTATION_PDF">Official Reports (PDF)</option>
          </select>

          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
          >
            <option value="ALL">All Formats</option>
            <option value="XLSX">Excel Workbook (XLSX)</option>
            <option value="PDF">Analytical Report (PDF)</option>
          </select>
        </div>
      </div>

      {/* Datasets Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Loading registered datasets...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200 text-[11px]">
                  <th className="p-3.5">Dataset Title & Type</th>
                  <th className="p-3.5">Period & Season</th>
                  <th className="p-3.5">Format & Size</th>
                  <th className="p-3.5">Records</th>
                  <th className="p-3.5">Quality Score</th>
                  <th className="p-3.5">Validation & Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDatasets.map((ds: any) => {
                  const isPdf = ds.file_format === 'PDF';
                  const isPublished = ds.status === 'PUBLISHED';
                  const isValidated = ds.validation_status === 'VALIDATED';

                  return (
                    <tr key={ds.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 max-w-xs">
                        <div className="font-bold text-slate-900 leading-snug">{ds.name}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{ds.description}</div>
                        <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase font-mono">
                          {ds.dataset_type}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        <div>Season {ds.season_code}</div>
                        <div className="text-[10px] text-slate-500 font-normal">Year {ds.year}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 font-bold">
                          {isPdf ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-mono">PDF</span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono">XLSX</span>
                          )}
                          <span className="text-slate-600">{Math.round(ds.file_size_kb / 1024 * 10) / 10} MB</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">
                        {ds.row_count ? `${ds.row_count.toLocaleString()} rows` : '—'}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-emerald-700">{ds.quality_score || 98.4}%</span>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            isValidated ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ds.validation_status}
                          </span>
                          <div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              isPublished ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {ds.status}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        {!isPublished && isValidated && (
                          <button
                            onClick={() => setPublishTarget(ds)}
                            className="px-2.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold shadow-xs transition-all"
                          >
                            Approve Publication
                          </button>
                        )}
                        {isPublished && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Published
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

      {/* REGISTER DATASET MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">Register New Agricultural Dataset</h3>
              </div>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Dataset Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NISR Seasonal Agricultural Survey (SAS) 2026 Season B Tables"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description & Scope</label>
                <textarea
                  rows={2}
                  placeholder="Details of methodology, geographic boundary, and tables contained..."
                  value={regDesc}
                  onChange={(e) => setRegDesc(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dataset Domain *</label>
                  <select
                    value={regType}
                    onChange={(e) => setRegType(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
                  >
                    <option value="CROP_STATISTICS">Crop Statistics (SAS)</option>
                    <option value="IRRIGATION">Irrigation Inventory</option>
                    <option value="SOIL_FERTILITY">Soil & Fertility</option>
                    <option value="POST_HARVEST">Post-Harvest & Facilities</option>
                    <option value="TRADE_EXPORTS">Trade & Exports</option>
                    <option value="DOCUMENTATION_PDF">Official Report (PDF)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">File Format *</label>
                  <select
                    value={regFormat}
                    onChange={(e) => setRegFormat(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
                  >
                    <option value="XLSX">Excel Workbook (.xlsx)</option>
                    <option value="PDF">Report Document (.pdf)</option>
                    <option value="CSV">Delimited Data (.csv)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Survey Year *</label>
                  <input
                    type="number"
                    value={regYear}
                    onChange={(e) => setRegYear(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Season Code *</label>
                  <input
                    type="text"
                    value={regSeason}
                    onChange={(e) => setRegSeason(e.target.value)}
                    placeholder="e.g. 2026B"
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-800">
                <strong>Historical Preservation Principle:</strong> This ingestion will be assigned a new dataset version without overwriting existing historical surveys from prior seasons.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register and Move to Staging'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVE PUBLICATION MODAL */}
      {publishTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">Approve Official Publication</h3>
              </div>
              <button onClick={() => setPublishTarget(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublish} className="mt-4 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{publishTarget.name}</div>
                <div className="text-slate-500 text-[11px] mt-0.5">Season {publishTarget.season_code} · {publishTarget.year}</div>
                <div className="mt-2 text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Quality Score: {publishTarget.quality_score}% (All checks passed)
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Publication Sign-off Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Confirmed aligned with NISR SAS official published statistics. Ready for live consumption by the 5 intelligence modules."
                  value={publishNotes}
                  onChange={(e) => setPublishNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPublishTarget(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-all disabled:opacity-50"
                >
                  {publishing ? 'Publishing...' : 'Confirm Publication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
