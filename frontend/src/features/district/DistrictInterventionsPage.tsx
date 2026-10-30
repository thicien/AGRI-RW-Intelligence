import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../config/api';
import { useOutletContext } from 'react-router-dom';
import { 
  CheckSquare, Plus, RefreshCw, Filter, CheckCircle2, AlertTriangle, 
  Clock, MapPin, Send, Eye, ShieldCheck 
} from 'lucide-react';

export default function DistrictInterventionsPage() {
  const { districtName } = useOutletContext<{ districtName: string }>();

  const [loading, setLoading] = useState(true);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Submit Observation Form State
  const [submittingObs, setSubmittingObs] = useState(false);
  const [showObsForm, setShowObsForm] = useState(false);
  const [obsSector, setObsSector] = useState('');
  const [obsCrop, setObsCrop] = useState('');
  const [obsType, setObsType] = useState('YIELD_VERIFICATION');
  const [obsDesc, setObsDesc] = useState('');
  const [obsNotes, setObsNotes] = useState('');
  const [obsSuccess, setObsSuccess] = useState<string | null>(null);

  // Status update modal
  const [selectedIntervention, setSelectedIntervention] = useState<any | null>(null);
  const [targetStatus, setTargetStatus] = useState('IN_PROGRESS');
  const [statusNotes, setStatusNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchInterventions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(apiUrl(`district/interventions?district=${encodeURIComponent(districtName)}&status=${statusFilter}`), {
        headers
      });
      if (res.ok) {
        setInterventions(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, [districtName, statusFilter]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntervention) return;
    setUpdating(true);
    try {
      const res = await fetch(apiUrl(`district/interventions/${selectedIntervention.id}/status`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, notes: statusNotes })
      });
      if (res.ok) {
        setSelectedIntervention(null);
        fetchInterventions();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const handleObservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingObs(true);
    setObsSuccess(null);
    try {
      const token = localStorage.getItem('agrilens_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(apiUrl('district/field-observations'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          districtName,
          sectorName: obsSector || `${districtName} Central`,
          cropType: obsCrop || 'Irish Potato',
          observationType: obsType,
          description: obsDesc,
          notes: obsNotes,
          userEmail: 'officer@minagri.gov.rw'
        })
      });

      if (res.ok) {
        setObsSuccess('Field verification findings recorded and queued for national validation.');
        setObsDesc('');
        setObsNotes('');
        setTimeout(() => setShowObsForm(false), 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingObs(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
              District Operational Workflow
            </span>
            <span className="text-xs text-slate-500 font-medium">{districtName} Jurisdiction</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            District Interventions & Field Verifications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review authorized interventions, update execution progress, and submit ground-truth field observations for {districtName}.
          </p>
        </div>

        <button
          onClick={() => setShowObsForm(!showObsForm)}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
          {showObsForm ? 'Close Observation Form' : 'Submit Field Verification'}
        </button>
      </div>

      {/* Field Observation Submission Card */}
      {showObsForm && (
        <div className="bg-white rounded-2xl p-6 border-2 border-emerald-500 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Send className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">
              Submit Ground-Truth Field Verification Findings ({districtName})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Record localized agronomic findings, crop cut sample measurements, or storage bottlenecks in authorized sectors.
          </p>

          {obsSuccess && (
            <div className="p-3 mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {obsSuccess}
            </div>
          )}

          <form onSubmit={handleObservationSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Sector</label>
              <input
                type="text"
                value={obsSector}
                onChange={e => setObsSector(e.target.value)}
                placeholder="e.g. Kinigi, Busogo, Muhoza"
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Monitored Crop</label>
              <input
                type="text"
                value={obsCrop}
                onChange={e => setObsCrop(e.target.value)}
                placeholder="e.g. Irish Potato, Maize, Climbing Beans"
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Observation Type</label>
              <select
                value={obsType}
                onChange={e => setObsType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="YIELD_VERIFICATION">Yield Verification & Crop Cut</option>
                <option value="PEST_DISEASE_ALERT">Pest / Disease Outbreak</option>
                <option value="IRRIGATION_FUNCTIONALITY">Irrigation Scheme Status</option>
                <option value="POST_HARVEST_LOSS">Post-Harvest Rot / Storage Bottleneck</option>
                <option value="SOIL_EROSION_EVENT">Severe Runoff & Erosion Event</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">Summary Findings</label>
              <input
                type="text"
                value={obsDesc}
                onChange={e => setObsDesc(e.target.value)}
                placeholder="Brief summary statement of verified ground situation..."
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">Detailed Field Notes & Recommendations</label>
              <textarea
                value={obsNotes}
                onChange={e => setObsNotes(e.target.value)}
                placeholder="Provide detailed context, quantitative yield estimates, or corrective action needed..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowObsForm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingObs}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
              >
                {submittingObs && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm Submission
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interventions Filter Bar & Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Assigned Interventions in {districtName}
            </h2>
            <p className="text-xs text-slate-500">
              Track multi-season interventions authorized by MINAGRI and District Agricultural Office.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            {['ALL', 'PROPOSED', 'PLANNED', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md transition-all ${
                  statusFilter === status ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-500 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            Loading interventions...
          </div>
        ) : interventions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-1">Priority</th>
                  <th className="pb-3">Title & Area</th>
                  <th className="pb-3">Sector</th>
                  <th className="pb-3">Target Objective</th>
                  <th className="pb-3">Budget</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-1">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {interventions.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pl-1">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.priority_level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                        item.priority_level === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.priority_level}
                      </span>
                    </td>
                    <td className="py-3 max-w-sm">
                      <div className="font-bold text-slate-900">{item.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{item.description}</div>
                    </td>
                    <td className="py-3 font-semibold text-emerald-800">{item.sector_name || districtName}</td>
                    <td className="py-3 text-slate-600 font-medium">{item.target_metric}</td>
                    <td className="py-3 font-bold text-slate-800">
                      {item.budget_rwf ? `${(item.budget_rwf / 1000000).toFixed(1)}M RWF` : '—'}
                    </td>
                    <td className="py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'PLANNED' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 text-right pr-1">
                      <button
                        onClick={() => {
                          setSelectedIntervention(item);
                          setTargetStatus(item.status);
                          setStatusNotes('');
                        }}
                        className="px-3 py-1 bg-slate-100 hover:bg-emerald-700 hover:text-white rounded-lg text-slate-700 text-xs font-semibold transition-colors"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            No interventions match status '{statusFilter}' for {districtName} District.
          </div>
        )}
      </div>

      {/* Status Modal */}
      {selectedIntervention && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">
              Update Intervention Status
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              {selectedIntervention.title} ({selectedIntervention.sector_name || districtName} Sector)
            </p>

            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Progress Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="PROPOSED">PROPOSED — Awaiting approval</option>
                  <option value="PLANNED">PLANNED — Budget & site scheduled</option>
                  <option value="IN_PROGRESS">IN_PROGRESS — Field work underway</option>
                  <option value="COMPLETED">COMPLETED — Verification verified</option>
                  <option value="CANCELLED">CANCELLED — Deferred</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Verification Notes & Follow-up
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Record verification notes, contractor progress or field constraints..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIntervention(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  {updating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
