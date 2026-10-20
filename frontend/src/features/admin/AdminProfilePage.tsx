import React, { useState } from 'react';
import { 
  UserCheck, ShieldCheck, Key, Lock, CheckCircle2, 
  AlertTriangle, Save, User, Mail, Shield
} from 'lucide-react';

export default function AdminProfilePage() {
  const [adminUser] = useState(() => {
    const saved = localStorage.getItem('agrilens_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      name: 'System Administrator',
      email: 'sysadmin@agrilens.gov.rw',
      role: 'PLATFORM_ADMIN',
      roleName: 'Platform Administrator',
    };
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [updating, setUpdating] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFeedback({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setFeedback({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    setUpdating(true);
    setFeedback(null);
    try {
      // In production, posts to admin profile update endpoint
      await new Promise(r => setTimeout(r, 600));
      setFeedback({ type: 'success', message: 'Administrator credentials updated successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update credentials.' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>Identity & Credential Settings</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Administrator Profile & Security
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Manage your administrative profile, authentication credentials, and active session security context.
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-emerald-950/20">
            SA
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{adminUser.name}</h2>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{adminUser.email}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                👑 Platform Administrator
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                System-Wide Authority
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-600" />
          <span>Update Account Password</span>
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              placeholder="••••••••••••"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Password (Min 8 characters)</label>
            <input
              type="password"
              required
              minLength={8}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="••••••••••••"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder="••••••••••••"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={updating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{updating ? 'Updating...' : 'Save New Password'}</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
