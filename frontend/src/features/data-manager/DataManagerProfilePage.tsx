import React, { useState } from 'react';
import { 
  UserCheck, Shield, Key, Lock, CheckCircle2, 
  AlertTriangle, XCircle, ShieldAlert, Check 
} from 'lucide-react';

export default function DataManagerProfilePage() {
  const [dataManager] = useState(() => {
    const saved = localStorage.getItem('agrilens_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      name: 'Jean-Paul Habimana',
      email: 'datamanager@agrilens.gov.rw',
      role: 'DATA_MANAGER',
      roleName: 'Chief Data Manager & Quality Controller',
      scopeLevel: 'NATIONAL_DOMAINS'
    };
  });

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setPwMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({ text: 'Password must be at least 8 characters.', type: 'error' });
      return;
    }
    setPwMsg({ text: 'Password successfully updated for Data Manager account.', type: 'success' });
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
              Section 3 Account & Governance
            </span>
            <span className="text-xs text-slate-500 font-medium">Data Pipeline Access</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Data Manager Profile & Security Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            View pipeline credentials and review security authorizations enforced on your role.
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
          Account Credentials
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Full Name</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{dataManager.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Official Government Email</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block font-mono">{dataManager.email}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Role Assignment</span>
            <span className="font-bold text-emerald-700 mt-0.5 inline-block px-2.5 py-0.5 bg-emerald-50 rounded border border-emerald-200">
              DATA_MANAGER (Data Pipeline Workspace)
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Geographic Scope Level</span>
            <span className="font-bold text-slate-900 mt-0.5 block">
              NATIONAL_DOMAINS (All 30 Districts Data Pipeline)
            </span>
          </div>
        </div>
      </div>

      {/* Permissions Matrix & Restrictions (Section 4 of requirements) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Role Permissions & Architectural Guardrails</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            The central principle: The Data Manager controls the data pipeline, not the entire platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Allowed */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2 text-xs">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5 pb-2 border-b border-emerald-200/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Permitted Pipeline Actions</span>
            </div>
            <ul className="space-y-1.5 text-slate-700">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Upload approved agricultural files (PDF & XLSX)</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Validate and clean incoming staging data</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Update authorized dataset metadata</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Create, inspect and rollback dataset versions</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Publish validated datasets under approval workflow</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Inspect agricultural analytics across all 5 modules</li>
            </ul>
          </div>

          {/* Denied */}
          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/80 space-y-2 text-xs">
            <div className="font-bold text-rose-900 flex items-center gap-1.5 pb-2 border-b border-rose-200/60">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Strictly Denied Actions (NestJS Enforced)</span>
            </div>
            <ul className="space-y-1.5 text-slate-700">
              <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" /> Manage user accounts and assign roles (Deny)</li>
              <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" /> Change system-wide security settings (Deny)</li>
              <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" /> Modify role definitions or grant privileges (Deny)</li>
              <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" /> Permanently delete official historical datasets (Deny)</li>
              <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" /> Access another user's restricted private records (Deny)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
          <Key className="w-4 h-4 text-emerald-700" />
          <span>Change Account Password</span>
        </h3>

        {pwMsg && (
          <div className={`p-3 rounded-xl text-xs font-semibold ${
            pwMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-rose-50 text-rose-800 border border-rose-300'
          }`}>
            {pwMsg.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-3 max-w-sm text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-all shadow-xs"
          >
            Update Security Password
          </button>
        </form>
      </div>

    </div>
  );
}
