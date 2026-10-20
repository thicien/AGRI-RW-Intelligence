import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Filter, ShieldCheck, ShieldAlert, 
  MapPin, CheckCircle2, XCircle, AlertTriangle, Key, Edit3, 
  RefreshCw, Power, Lock, Check, X, Shield, Phone, Mail, Clock
} from 'lucide-react';

interface UserRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  role_id: string;
  role_code: string;
  role_name: string;
  scope_type: string;
  scope_level: string | null;
  district_name: string | null;
  sector_name: string | null;
}

const RWANDA_DISTRICTS = [
  'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi', 'Gisagara',
  'Huye', 'Kamonyi', 'Karongi', 'Kayonza', 'Kicukiro', 'Kirehe', 'Muhanga',
  'Musanze', 'Ngoma', 'Ngororero', 'Nyabihu', 'Nyagatare', 'Nyamagabe',
  'Nyamasheke', 'Nyanza', 'Nyarugenge', 'Nyaruguru', 'Rubavu', 'Ruhango',
  'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana'
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<UserRecord | null>(null);
  const [showRoleModal, setShowRoleModal] = useState<UserRecord | null>(null);

  // Form state for Create User
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    roleCode: 'DISTRICT_OFFICER',
    districtName: 'Musanze',
    sectorName: '',
  });

  // Form state for Password Reset
  const [newPassword, setNewPassword] = useState('');

  // Form state for Role & District update
  const [roleUpdateData, setRoleUpdateData] = useState({
    roleCode: '',
    districtName: '',
    sectorName: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`http://localhost:3000/api/v1/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch user directory');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error loading users.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  // 1. Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create account.');

      setFeedback({ type: 'success', message: data.message });
      setShowCreateModal(false);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        roleCode: 'DISTRICT_OFFICER',
        districtName: 'Musanze',
        sectorName: '',
      });
      fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // 2. Toggle Status (with Last Admin Guard)
  const handleToggleStatus = async (user: UserRecord) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch(`http://localhost:3000/api/v1/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update account status.');

      setFeedback({ type: 'success', message: data.message });
      fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // 3. Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetModal) return;
    try {
      const res = await fetch(`http://localhost:3000/api/v1/admin/users/${showResetModal.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password.');

      setFeedback({ type: 'success', message: data.message });
      setShowResetModal(null);
      setNewPassword('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // 4. Update Role & Scope
  const handleUpdateRoleAndScope = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRoleModal) return;
    try {
      const res = await fetch(`http://localhost:3000/api/v1/admin/users/${showRoleModal.id}/role-scope`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleUpdateData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update role and scope.');

      setFeedback({ type: 'success', message: data.message });
      setShowRoleModal(null);
      fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header and Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Account Management & Identity Security</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            User Accounts & Role Assignments
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Create, activate, suspend, and configure platform user identities. Assign approved roles and bind District Agricultural Officers strictly to their assigned geographic jurisdiction.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/20 transition-all active:scale-95 self-start sm:self-center flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Authorized Account</span>
        </button>
      </div>

      {/* Feedback Banner */}
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
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Security Rule Guard Notice */}
      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>
            <strong>Last-Admin Protection Active:</strong> Backend safeguards prevent suspending or deleting the sole remaining active Platform Administrator account.
          </span>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white text-amber-800 border border-amber-300">
          Enforced
        </span>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or district..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">All Platform Roles</option>
            <option value="PLATFORM_ADMIN">Platform Administrator</option>
            <option value="DATA_MANAGER">Data Manager</option>
            <option value="NATIONAL_PLANNER">National Agricultural Planner</option>
            <option value="DISTRICT_OFFICER">District Agricultural Officer</option>
            <option value="SECTOR_OFFICER">Sector Agricultural Officer</option>
            <option value="RESEARCHER_ANALYST">Researcher / Analyst</option>
            <option value="COOPERATIVE_FARMER">Cooperative / Farmer User</option>
            <option value="PARTNER_VIEWER">Partner / Policymaker / Viewer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">All Account Statuses</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="SUSPENDED">Suspended Accounts</option>
            <option value="INACTIVE">Inactive Accounts</option>
          </select>

          <button
            onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); fetchUsers(); }}
            title="Reset Filters"
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-emerald-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* User Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="font-bold text-sm text-slate-900">
            Registered Accounts ({users.length})
          </div>
          <div className="text-xs text-slate-500">
            Password hashes are stripped and never exposed in responses
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5">User / Contact</th>
                <th className="py-3 px-4">Role Assignment</th>
                <th className="py-3 px-4">Geographic Scope</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading accounts from database records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No accounts found matching your filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isOfficer = user.role_code === 'DISTRICT_OFFICER';
                  const isAdmin = user.role_code === 'PLATFORM_ADMIN' || user.role_code === 'SYSTEM_ADMIN';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isAdmin ? 'bg-amber-100 text-amber-800' :
                            isOfficer ? 'bg-emerald-100 text-emerald-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">
                              {user.full_name}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {user.email}
                              </span>
                              {user.phone && (
                                <span className="flex items-center gap-1 text-slate-400">
                                  • <Phone className="w-3 h-3" /> {user.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Assignment */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isAdmin ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          user.role_code === 'DATA_MANAGER' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                          user.role_code === 'NATIONAL_PLANNER' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                          isOfficer ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {user.role_name}
                        </span>
                      </td>

                      {/* Scope */}
                      <td className="py-3.5 px-4">
                        {isOfficer && user.district_name ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            {user.district_name} District
                          </span>
                        ) : user.scope_level === 'SECTOR' && user.sector_name ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {user.sector_name} Sector
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium">
                            System-wide (Rwanda All)
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          user.status === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {user.status}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(user.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Role & Scope Edit Button */}
                          <button
                            onClick={() => {
                              setShowRoleModal(user);
                              setRoleUpdateData({
                                roleCode: user.role_code,
                                districtName: user.district_name || 'Musanze',
                                sectorName: user.sector_name || '',
                              });
                            }}
                            title="Edit Role & District Scope"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Reset Password Button */}
                          <button
                            onClick={() => {
                              setShowResetModal(user);
                              setNewPassword('');
                            }}
                            title="Reset Password"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          {/* Activate / Suspend Toggle */}
                          <button
                            onClick={() => handleToggleStatus(user)}
                            title={user.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.status === 'ACTIVE'
                                ? 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'
                                : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Create Account */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Create Authorized Platform Account
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Dr. Jean-Baptiste Nkurunziza"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="officer@minagri.gov.rw"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+250 788 123 456"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password (Min 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <div className="text-[11px] text-slate-400 mt-1">
                  Will be hashed with Argon2 before storage.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role Assignment</label>
                <select
                  value={formData.roleCode}
                  onChange={(e) => setFormData({ ...formData, roleCode: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="DISTRICT_OFFICER">District Agricultural Officer</option>
                  <option value="DATA_MANAGER">Data Manager</option>
                  <option value="NATIONAL_PLANNER">National Agricultural Planner</option>
                  <option value="SECTOR_OFFICER">Sector Agricultural Officer</option>
                  <option value="RESEARCHER_ANALYST">Researcher or Data Analyst</option>
                  <option value="COOPERATIVE_FARMER">Cooperative or Farmer User</option>
                  <option value="PARTNER_VIEWER">Partner, Policymaker or Viewer</option>
                  <option value="PLATFORM_ADMIN">Platform Administrator</option>
                </select>
              </div>

              {formData.roleCode === 'DISTRICT_OFFICER' && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <label className="block text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Assigned District (Geographic Scope Restriction)</span>
                  </label>
                  <select
                    value={formData.districtName}
                    onChange={(e) => setFormData({ ...formData, districtName: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-emerald-300 bg-white text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {RWANDA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    The officer will only be permitted to view and manage data connected to this district.
                  </p>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/20"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Reset Password */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Reset Account Password
                </h3>
              </div>
              <button onClick={() => setShowResetModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                Target User: <strong className="text-slate-900">{showResetModal.full_name}</strong> ({showResetModal.email})
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Secure Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter minimum 8 character password"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResetModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-950/20"
                >
                  Enforce Password Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Update Role & Scope */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Update Role & Jurisdiction Scope
                </h3>
              </div>
              <button onClick={() => setShowRoleModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRoleAndScope} className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                User: <strong className="text-slate-900">{showRoleModal.full_name}</strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Approved Role</label>
                <select
                  value={roleUpdateData.roleCode}
                  onChange={(e) => setRoleUpdateData({ ...roleUpdateData, roleCode: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="DISTRICT_OFFICER">District Agricultural Officer</option>
                  <option value="DATA_MANAGER">Data Manager</option>
                  <option value="NATIONAL_PLANNER">National Agricultural Planner</option>
                  <option value="SECTOR_OFFICER">Sector Agricultural Officer</option>
                  <option value="RESEARCHER_ANALYST">Researcher or Data Analyst</option>
                  <option value="COOPERATIVE_FARMER">Cooperative or Farmer User</option>
                  <option value="PARTNER_VIEWER">Partner, Policymaker or Viewer</option>
                  <option value="PLATFORM_ADMIN">Platform Administrator</option>
                </select>
              </div>

              {roleUpdateData.roleCode === 'DISTRICT_OFFICER' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned District</label>
                  <select
                    value={roleUpdateData.districtName}
                    onChange={(e) => setRoleUpdateData({ ...roleUpdateData, districtName: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {RWANDA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  Save Authorization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
