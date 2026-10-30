import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../config/api';
import { useOutletContext } from 'react-router-dom';
import { Bell, CheckCircle2, Clock, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

export default function DistrictNotificationsPage() {
  const { districtName } = useOutletContext<{ districtName: string }>();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('agrilens_token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(apiUrl(`district/notifications?district=${encodeURIComponent(districtName)}`), {
          headers
        });
        if (res.ok) {
          setNotifications(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [districtName]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
            Communication & Tasks
          </span>
          <span className="text-xs text-slate-500 font-medium">{districtName} Desk</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          District Notifications & Updates
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review relevant data releases, seasonal notices, and pending field tasks for {districtName} District.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-slate-500 text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          Loading notifications...
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n: any) => (
            <div key={n.id} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                  <span className="text-[11px] text-slate-400 font-medium flex-shrink-0">{n.date}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {n.message}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                    {n.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
