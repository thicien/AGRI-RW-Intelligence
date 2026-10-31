import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../../config/api';
import { 
  FileText, Shield, Search, RefreshCw, 
  Eye, LogIn, Compass, ShieldAlert, RotateCcw,
  FileSpreadsheet, Download, X, CheckCircle2,
  Calendar, User, Laptop
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  actor_email: string;
  actor_role: string;
  action: string;
  resource: string;
  details: any;
  ip_address: string | null;
  created_at: string;
}

type FilterCategory = 'ALL' | 'LOGIN' | 'SCOPE' | 'DENIED' | 'RESET' | 'EXPORT_REPORT';

const FILTER_OPTIONS: { id: FilterCategory; label: string; icon: React.ElementType; color: string; activeBg: string }[] = [
  { id: 'ALL', label: 'All Activities', icon: FileText, color: 'text-slate-600', activeBg: 'bg-slate-900 text-white' },
  { id: 'LOGIN', label: 'Login', icon: LogIn, color: 'text-emerald-700', activeBg: 'bg-emerald-700 text-white shadow-sm' },
  { id: 'SCOPE', label: 'Scope', icon: Compass, color: 'text-blue-700', activeBg: 'bg-blue-700 text-white shadow-sm' },
  { id: 'DENIED', label: 'Denied', icon: ShieldAlert, color: 'text-rose-700', activeBg: 'bg-rose-700 text-white shadow-sm' },
  { id: 'RESET', label: 'Reset', icon: RotateCcw, color: 'text-purple-700', activeBg: 'bg-purple-700 text-white shadow-sm' },
  { id: 'EXPORT_REPORT', label: 'Export Report', icon: FileSpreadsheet, color: 'text-amber-800', activeBg: 'bg-amber-700 text-white shadow-sm' },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [exporting, setExporting] = useState(false);

  const debounceTimer = useRef<any>(null);

  const fetchLogs = async (category: FilterCategory = activeCategory, query: string = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category && category !== 'ALL') {
        params.append('action', category);
      }
      if (query && query.trim()) {
        params.append('search', query.trim());
      }
      const res = await fetch(apiUrl(`admin/audit-logs?${params.toString()}`));
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(activeCategory, search);
  }, [activeCategory]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchLogs(activeCategory, val);
    }, 300);
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchLogs(activeCategory, '');
  };

  const handleCategorySelect = (cat: FilterCategory) => {
    setActiveCategory(cat);
  };

  const handleExportCSV = () => {
    if (!logs.length) return;
    setExporting(true);

    const headers = ['Timestamp', 'Action Code', 'Actor Email', 'Actor Role', 'Target Resource', 'IP Address', 'Details Payload'];
    const rows = logs.map(l => [
      `"${new Date(l.created_at).toISOString()}"`,
      `"${l.action}"`,
      `"${l.actor_email}"`,
      `"${l.actor_role}"`,
      `"${l.resource}"`,
      `"${l.ip_address || 'N/A'}"`,
      `"${JSON.stringify(l.details).replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filenameCat = activeCategory === 'ALL' ? 'all' : activeCategory.toLowerCase();
    link.setAttribute('download', `agrilens_audit_ledger_${filenameCat}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setExporting(false), 500);
  };

  const getActionBadgeStyle = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('DENIED') || act.includes('VIOLATION') || act.includes('UNAUTHORIZED')) {
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }
    if (act.includes('RESET')) {
      return 'bg-purple-50 text-purple-800 border-purple-200';
    }
    if (act.includes('SCOPE')) {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    }
    if (act.includes('EXPORT') || act.includes('REPORT')) {
      return 'bg-amber-50 text-amber-900 border-amber-200';
    }
    if (act.includes('LOGIN')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Forensic Ledger & Accountability</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Security & Administrative Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Append-only, immutable record of all administrative activities, user authentications, role assignments, password resets, and export requests across AgriLens Rwanda.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={handleExportCSV}
            disabled={exporting || loading || logs.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
          
          <button
            onClick={() => fetchLogs(activeCategory, search)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Filter & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Category Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 text-[10px]">
              Filter By Activity:
            </span>
            {FILTER_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isActive = activeCategory === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleCategorySelect(opt.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isActive 
                      ? `${opt.activeBg} border-transparent shadow-xs scale-102` 
                      : `bg-slate-50/80 hover:bg-slate-100 text-slate-600 border-slate-200/80`
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : opt.color}`} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{logs.length}</strong> recorded events
          </span>
        </div>

        {/* Live Search Input */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search specific activity code, user email, role, target resource, details or IP..."
              className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            {search && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {(activeCategory !== 'ALL' || search) && (
            <button
              onClick={() => {
                setActiveCategory('ALL');
                setSearch('');
                fetchLogs('ALL', '');
              }}
              className="px-3 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors whitespace-nowrap flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-4">Action Code</th>
                <th className="py-3 px-4">Actor / Role</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Loading audit records...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-600">No audit events match your query.</p>
                      <p className="text-[11px] text-slate-400">
                        Try selecting another activity category or clearing your search term.
                      </p>
                      <button
                        onClick={() => {
                          setActiveCategory('ALL');
                          setSearch('');
                          fetchLogs('ALL', '');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                      >
                        Show All Events
                      </button>
                    </div>
                  </td>
                </tr>
              ) : logs.map((log) => {
                const badgeStyle = getActionBadgeStyle(log.action);
                return (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 text-slate-500 text-[11px] font-mono whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString([], { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold border ${badgeStyle}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{log.actor_email}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                        {log.actor_role}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 truncate max-w-xs" title={log.resource}>
                      {log.resource}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal for viewing raw JSON payload */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Audit Event Payload Details
                </h3>
              </div>
              <button 
                onClick={() => setSelectedLog(null)} 
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Event ID:</span>
                  <span className="font-mono text-[11px] text-slate-700 truncate block">{selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Action Code:</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border mt-0.5 ${getActionBadgeStyle(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Actor Email:</span>
                  <span className="font-semibold text-slate-800">{selectedLog.actor_email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Actor Role:</span>
                  <span className="text-slate-700">{selectedLog.actor_role}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Resource:</span>
                  <span className="font-mono text-[11px] text-slate-700">{selectedLog.resource}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Client IP:</span>
                  <span className="font-mono text-[11px] text-slate-700">{selectedLog.ip_address || '127.0.0.1'}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1">Payload JSON:</span>
                <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
