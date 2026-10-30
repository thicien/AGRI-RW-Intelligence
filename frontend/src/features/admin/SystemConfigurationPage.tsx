import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../config/api';
import { 
  Settings, ShieldCheck, Lock, AlertTriangle, CheckCircle2, 
  Save, RefreshCw, Key, Shield, Clock, Server
} from 'lucide-react';

export default function SystemConfigurationPage() {
  const [config, setConfig] = useState({
    sessionTimeoutMinutes: 60,
    mfaRequiredForAdmins: true,
    rateLimitPerMinute: 120,
    maintenanceMode: false,
    auditRetentionDays: 365,
    maxFailedLoginAttempts: 5,
    lockoutDurationMinutes: 15,
  });
  const [protectedAttributes, setProtectedAttributes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('admin/configuration'));
      if (res.ok) {
        const data = await res.json();
        if (data.config) setConfig(data.config);
        if (data.protectedAttributes) setProtectedAttributes(data.protectedAttributes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(apiUrl('admin/configuration'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save configuration');
      setFeedback({ type: 'success', message: 'System configuration parameters saved and active.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4 text-emerald-600" />
            <span>Platform Operational Settings</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            System Configuration & Policy Parameters
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure permitted runtime policies including administrator multi-factor authentication, session timeouts, and rate limits.
          </p>
        </div>

        <button
          onClick={fetchConfig}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Settings</span>
        </button>
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

      {/* Sensitive Credentials Protection Notice */}
      <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800 shadow-md">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold border border-emerald-400/30">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Protected Secrets & Infrastructure Guard (Section 3 Requirement)
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Sensitive controls, such as database credentials, raw JWT secret keys, and server infrastructure settings, are strictly not exposed in this dashboard. They are managed through secure containerized environment configuration.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono text-emerald-300">
              {protectedAttributes.map((attr, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  🔒 {attr}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        
        {/* Section 1: Authentication & Access Control */}
        <div>
          <h3 className="font-bold text-slate-900 text-sm mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-600" />
            <span>Authentication & Session Security</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Session Timeout (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={1440}
                value={config.sessionTimeoutMinutes}
                onChange={(e) => setConfig({ ...config, sessionTimeoutMinutes: parseInt(e.target.value) || 60 })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Automatic logout interval for inactive administrator sessions (Default: 60 min).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Max Failed Login Attempts
              </label>
              <input
                type="number"
                min={3}
                max={20}
                value={config.maxFailedLoginAttempts}
                onChange={(e) => setConfig({ ...config, maxFailedLoginAttempts: parseInt(e.target.value) || 5 })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Number of failed login attempts before temporary account lockout.
              </span>
            </div>

            <div className="md:col-span-2 p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-emerald-950">
                  Enforce Multi-Factor Authentication (MFA) for Administrators
                </div>
                <div className="text-[11px] text-emerald-800 mt-0.5">
                  Require second-factor verification code for accounts with PLATFORM_ADMIN privileges.
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.mfaRequiredForAdmins}
                onChange={(e) => setConfig({ ...config, mfaRequiredForAdmins: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Rate Limiting & Operational Governance */}
        <div>
          <h3 className="font-bold text-slate-900 text-sm mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <span>API Gateway Rate Limiting & Operations</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                API Rate Limit (Requests per minute per client)
              </label>
              <input
                type="number"
                min={30}
                max={600}
                value={config.rateLimitPerMinute}
                onChange={(e) => setConfig({ ...config, rateLimitPerMinute: parseInt(e.target.value) || 120 })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Protects backend against brute force and automated denial of service.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Audit Log Retention Policy (Days)
              </label>
              <input
                type="number"
                min={90}
                max={3650}
                value={config.auditRetentionDays}
                onChange={(e) => setConfig({ ...config, auditRetentionDays: parseInt(e.target.value) || 365 })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Immutable security logs are archived for 365 days by regulation.
              </span>
            </div>

            <div className="md:col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-900">
                  Platform Maintenance Mode
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Temporarily restricts access to non-administrative users during scheduled updates.
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.maintenanceMode}
                onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration Changes'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
