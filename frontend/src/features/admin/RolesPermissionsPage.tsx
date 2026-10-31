import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../config/api';
import { 
  ShieldAlert, RefreshCw, MapPin
} from 'lucide-react';

interface RoleItem {
  id: string;
  code: string;
  name: string;
  description: string;
  scope_type: string;
  active_users_count: number;
}

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRolesData = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('admin/roles-permissions'));
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
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
            Roles & Authorization Scopes
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Review the 8 official platform roles, their defined geographic authorization scopes, and active user distribution across AgriLens Rwanda.
          </p>
        </div>

        <button
          onClick={fetchRolesData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Roles</span>
        </button>
      </div>

      {/* 8 Official Roles Cards */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">
          Authorized Role Definitions ({roles.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((r) => {
            return (
              <div 
                key={r.code}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                      {r.code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {r.active_users_count} Users
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">
                    {r.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    {r.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Scope:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {r.scope_type || 'SYSTEM_WIDE'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
