import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Check, X, Shield, Lock, 
  MapPin, RefreshCw, Eye, AlertCircle, HelpCircle, FileText
} from 'lucide-react';

interface RoleItem {
  id: string;
  code: string;
  name: string;
  description: string;
  scope_type: string;
  active_users_count: number;
}

interface CapabilityItem {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
}

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [capabilities, setCapabilities] = useState<CapabilityItem[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const fetchRolesData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/v1/admin/roles-permissions');
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
        setCapabilities(data.permissions || []);
        setMatrix(data.matrix || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesData();
  }, []);

  const getPolicyBadge = (policy?: string) => {
    if (!policy || policy === 'NO' || policy === 'DENY') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-400">
          <X className="w-3 h-3" /> Denied
        </span>
      );
    }
    if (policy === 'YES' || policy === 'ALLOW' || policy === 'NATIONAL' || policy === 'SYSTEM_WIDE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
          <Check className="w-3 h-3" /> Allowed
        </span>
      );
    }
    if (policy === 'SCOPED' || policy === 'DISTRICT' || policy === 'SECTOR') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
          <MapPin className="w-3 h-3" /> Scoped
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
        {policy}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            <span>Role-Based Access Control (RBAC) Governance</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Roles & Permissions Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Review the 8 official platform roles, their defined geographic authorization scopes, and the 13 platform capabilities enforced by the backend security gateway.
          </p>
        </div>

        <button
          onClick={fetchRolesData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Policies</span>
        </button>
      </div>

      {/* 8 Official Roles Cards */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">
          Authorized Role Definitions ({roles.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((r) => {
            const isSelected = selectedRole === r.code;
            return (
              <div 
                key={r.code}
                onClick={() => setSelectedRole(isSelected ? null : r.code)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-md' 
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {r.code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {r.active_users_count} Users
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  {r.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {r.description}
                </p>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Scope:</span>
                  <span className="font-bold text-emerald-800">
                    {r.scope_type || 'SYSTEM_WIDE'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Section 4.2 Capabilities Matrix (13 Capabilities × 8 Roles)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enforced on every API request. Green indicates granted, blue indicates geographically scoped, grey indicates denied.
            </p>
          </div>
          {selectedRole && (
            <button
              onClick={() => setSelectedRole(null)}
              className="text-xs font-bold text-blue-700 hover:underline"
            >
              Clear Role Filter
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5 min-w-[200px]">Capability / Permission</th>
                <th className="py-3 px-3 text-center">Category</th>
                {roles.filter(r => !selectedRole || r.code === selectedRole).map(r => (
                  <th key={r.code} className="py-3 px-3 text-center min-w-[110px]">
                    <div className="font-bold text-slate-800">{r.code.replace(/_/g, ' ')}</div>
                    <div className="font-normal text-[9px] text-slate-400 lowercase">{r.scope_type}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {capabilities.map((cap) => (
                <tr key={cap.code} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-5">
                    <div className="font-bold text-slate-900 leading-tight">
                      {cap.name}
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                      {cap.code}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {cap.category}
                    </span>
                  </td>
                  {roles.filter(r => !selectedRole || r.code === selectedRole).map(r => {
                    const policy = matrix[cap.code]?.[r.code];
                    return (
                      <td key={r.code} className="py-3 px-3 text-center">
                        {getPolicyBadge(policy)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
