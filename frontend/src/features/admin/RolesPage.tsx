import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Shield, ShieldCheck, Key, Lock, Users, UserPlus,
  Database, MapPin, Search, Filter, Settings, CheckCircle2, 
  XCircle, Eye, EyeOff, AlertTriangle, FileSpreadsheet, Download,
  Check, RefreshCw, ChevronDown, UserCheck, Activity, Globe,
  HelpCircle, ArrowRight
} from 'lucide-react';
import { useAuth, PRESET_PERSONAS } from '../auth/AuthContext';
import RegisterDistrictOfficerForm from './RegisterDistrictOfficerForm';

export default function RolesPage() {
  const { currentUser, switchPersona, updateGeographicScope, verifyBackendExport } = useAuth();
  const [activeTab, setActiveTab] = useState<'explorer' | 'matrix' | 'users' | 'register-officer' | 'audit'>('explorer');

  // Interactive Explorer State (Section 4.4)
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>(currentUser.roleCode);

  // Backend Data State
  const [backendRoles, setBackendRoles] = useState<any[]>([]);
  const [matrixData, setMatrixData] = useState<{ capabilities: any[]; matrix: Record<string, Record<string, string>> }>({
    capabilities: [],
    matrix: {}
  });
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [matrixFilter, setMatrixFilter] = useState<string>('ALL');

  // Backend Simulator State
  const [simRole, setSimRole] = useState<string>('COOPERATIVE_FARMER');
  const [simAction, setSimAction] = useState<'REPORT' | 'RAW_DATA'>('RAW_DATA');
  const [simDistrict, setSimDistrict] = useState<string>('Musanze');
  const [simResult, setSimResult] = useState<any>(null);
  const [simTesting, setSimTesting] = useState<boolean>(false);

  // User Management Edit State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [newDistrict, setNewDistrict] = useState<string>('');
  const [newSector, setNewSector] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Fetch backend data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, mRes, uRes, aRes] = await Promise.all([
        fetch('http://localhost:3000/api/v1/auth/roles'),
        fetch('http://localhost:3000/api/v1/auth/permissions-matrix'),
        fetch('http://localhost:3000/api/v1/auth/users'),
        fetch('http://localhost:3000/api/v1/auth/audit-logs?limit=25')
      ]);

      if (rRes.ok) setBackendRoles(await rRes.json());
      if (mRes.ok) setMatrixData(await mRes.json());
      if (uRes.ok) setUsersList(await uRes.json());
      if (aRes.ok) setAuditLogs(await aRes.json());
    } catch (e) {
      console.error('Error fetching RBAC data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update selected role when current user changes if desired
  useEffect(() => {
    setSelectedRoleCode(currentUser.roleCode);
  }, [currentUser.roleCode]);

  // Selected role object
  const currentRoleObj = backendRoles.find(r => r.code === selectedRoleCode) || {
    code: selectedRoleCode,
    name: PRESET_PERSONAS.find(p => p.roleCode === selectedRoleCode)?.roleName || selectedRoleCode,
    description: 'System authorization role',
    details: {
      geographicScope: 'Rwanda-wide or Scoped District',
      allowedCapabilities: ['View authorized dashboards', 'Filter seasonal trends'],
      restrictions: ['Standard platform security constraints apply']
    }
  };

  // Run backend enforcement test
  const handleTestEnforcement = async () => {
    setSimTesting(true);
    setSimResult(null);
    try {
      const res = await fetch('http://localhost:3000/api/v1/auth/export-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: `${simRole.toLowerCase()}@agrilens.rw`,
          roleCode: simRole,
          exportType: simAction,
          requestedDistrict: simDistrict,
          datasetName: 'SAS_2026A_OFFICIAL_STATISTICS'
        })
      });
      const data = await res.json();
      setSimResult({
        status: res.status,
        data
      });
      // Refresh audit logs
      const aRes = await fetch('http://localhost:3000/api/v1/auth/audit-logs?limit=15');
      if (aRes.ok) setAuditLogs(await aRes.json());
    } catch (err: any) {
      setSimResult({ status: 500, data: { message: err.message } });
    } finally {
      setSimTesting(false);
    }
  };

  // Save updated user scope
  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSaveStatus('Saving changes...');
    try {
      const res = await fetch(`http://localhost:3000/api/v1/auth/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleCode: newRole || undefined,
          districtName: newDistrict || undefined,
          sectorName: newSector || undefined,
          scopeLevel: newDistrict ? 'DISTRICT' : (newSector ? 'SECTOR' : 'NATIONAL')
        })
      });
      if (res.ok) {
        setSaveStatus('Authorization updated successfully!');
        setTimeout(() => {
          setEditingUser(null);
          setSaveStatus(null);
          fetchData();
        }, 1200);
      }
    } catch (e: any) {
      setSaveStatus(`Error: ${e.message}`);
    }
  };

  const getPolicyBadge = (policy?: string) => {
    switch (policy) {
      case 'YES':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-success/15 text-success border border-success/30"><Check className="w-3 h-3"/> Yes</span>;
      case 'SCOPED':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-primary/15 text-primary border border-primary/30"><MapPin className="w-3 h-3"/> Scoped</span>;
      case 'AUTHORIZED':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700 border border-purple-300"><Key className="w-3 h-3"/> Authorized</span>;
      case 'CONTROLLED':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300"><Shield className="w-3 h-3"/> Controlled</span>;
      case 'LIMITED':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300"><Eye className="w-3 h-3"/> Limited</span>;
      case 'OPTIONAL':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">Optional</span>;
      case 'NO':
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-danger/10 text-danger/80 border border-danger/20"><XCircle className="w-3 h-3"/> No</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 font-sans">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-light text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/20 text-white backdrop-blur-sm">
              Section 4: User Permissions & Governance
            </span>
            <span className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" /> RBAC + Geographic ABAC Enforced
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            Role-Based Access Control & Scoped Authorization
          </h1>
          <p className="text-sm text-white/85 mt-1 max-w-2xl leading-relaxed">
            Strict role boundaries and geographic rules ensure official statistics, survey microdata, and administrative functions are accessible only to authorized personnel.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
          <div className="text-right">
            <div className="text-[11px] text-white/70 uppercase font-semibold">Active Persona</div>
            <div className="text-sm font-bold text-white">{currentUser.name}</div>
            <div className="text-xs text-primary-soft font-medium flex items-center justify-end gap-1">
              <MapPin className="w-3 h-3" />
              {currentUser.scopeLevel === 'DISTRICT' ? `${currentUser.district} District` : (currentUser.scopeLevel === 'SECTOR' ? `${currentUser.sector} Sector` : 'National Scope')}
            </div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow ${currentUser.avatarColor}`}>
            {currentUser.avatarInitials}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border-main pb-2">
        <button
          onClick={() => setActiveTab('explorer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'explorer'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface text-text-main border border-border-main hover:bg-background'
          }`}
        >
          <Search className="w-4 h-4" />
          4.4 Interactive Permission Explorer
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'matrix'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface text-text-main border border-border-main hover:bg-background'
          }`}
        >
          <Lock className="w-4 h-4" />
          4.2 Permissions Matrix (13 Capabilities)
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface text-text-main border border-border-main hover:bg-background'
          }`}
        >
          <Users className="w-4 h-4" />
          User & Geographic Scopes ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab('register-officer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'register-officer'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Register District Officer
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface text-text-main border border-border-main hover:bg-background'
          }`}
        >
          <Activity className="w-4 h-4" />
          Security Audit Logs & Enforcement
        </button>
      </div>

      {/* TAB 1: INTERACTIVE PERMISSION EXPLORER (SECTION 4.4) */}
      {activeTab === 'explorer' && (
        <div className="space-y-6">
          {/* Role Selector Pills */}
          <div className="bg-surface p-4 rounded-xl border border-border-main shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center justify-between">
              <span>Select a Role to preview authorized capabilities & restrictions:</span>
              <span className="text-primary font-semibold">8 Official Logical Roles</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {PRESET_PERSONAS.map(p => (
                <button
                  key={p.roleCode}
                  onClick={() => setSelectedRoleCode(p.roleCode)}
                  className={`p-2.5 rounded-lg text-left transition-all border flex flex-col justify-between ${
                    selectedRoleCode === p.roleCode
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                      : 'border-border-main bg-background hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-6 h-6 rounded text-[11px] font-bold flex items-center justify-center ${p.avatarColor}`}>
                      {p.avatarInitials}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-muted truncate">{p.scopeLevel}</span>
                  </div>
                  <div className="text-xs font-bold text-text-main leading-tight line-clamp-2">
                    {p.roleName}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Role Profile Dossier */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Card: Role Identity & Geographic Scope */}
            <div className="bg-surface p-6 rounded-2xl border border-border-main shadow-sm flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-text-main leading-tight">{currentRoleObj.name}</h2>
                    <span className="text-xs font-mono font-bold text-primary">{currentRoleObj.code}</span>
                  </div>
                </div>

                <p className="text-sm text-text-main/80 leading-relaxed mb-4">
                  {currentRoleObj.description}
                </p>

                <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl space-y-1.5">
                  <div className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wide">
                    <MapPin className="w-4 h-4" /> Permitted Geographic Scope
                  </div>
                  <div className="text-sm font-semibold text-text-main">
                    {currentRoleObj.details?.geographicScope || 'Configured Scope'}
                  </div>
                </div>
              </div>

              {/* Persona Switcher Quick Action */}
              <div className="pt-4 border-t border-border-main">
                <div className="text-xs text-muted mb-2 font-medium">Want to test AgriLens as this persona?</div>
                <button
                  onClick={() => switchPersona(selectedRoleCode)}
                  className="w-full py-2.5 px-4 bg-primary hover:bg-primary-light text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <UserCheck className="w-4 h-4" />
                  Switch to this Persona
                </button>
              </div>
            </div>

            {/* Middle Card: Allowed Capabilities */}
            <div className="bg-surface p-6 rounded-2xl border border-border-main shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-main">
                <div className="flex items-center gap-2 text-success font-bold text-sm uppercase tracking-wider">
                  <CheckCircle2 className="w-5 h-5" /> Allowed Capabilities
                </div>
                <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded font-bold">Authorized</span>
              </div>

              <ul className="space-y-3">
                {currentRoleObj.details?.allowedCapabilities?.map((cap: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-text-main leading-snug">
                    <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Card: Explicit Restrictions */}
            <div className="bg-surface p-6 rounded-2xl border border-border-main shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-main">
                <div className="flex items-center gap-2 text-danger font-bold text-sm uppercase tracking-wider">
                  <ShieldAlert className="w-5 h-5" /> Security Restrictions
                </div>
                <span className="text-xs bg-danger/10 text-danger px-2 py-0.5 rounded font-bold">Enforced</span>
              </div>

              <ul className="space-y-3">
                {currentRoleObj.details?.restrictions?.map((rest: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-text-main/90 leading-snug">
                    <XCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                    <span>{rest}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>Implementation Note:</strong> Restrictions are verified on backend endpoints. Frontend button hiding is coupled with server 403 authorization guards.
                </span>
              </div>
            </div>

          </div>

          {/* Interactive Backend Enforcement Simulator */}
          <div className="bg-surface p-6 rounded-2xl border border-border-main shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-extrabold text-base text-text-main flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" />
                  Live Backend Security Enforcement Tester
                </h3>
                <p className="text-xs text-muted">
                  Test the backend authorization guard by simulating export requests across roles and geographic boundaries.
                </p>
              </div>
              <span className="text-xs font-mono bg-background px-3 py-1 rounded border border-border-main">
                POST /api/v1/auth/export-check
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-background p-4 rounded-xl border border-border-main">
              <div>
                <label className="text-xs font-bold text-text-main block mb-1">Simulated Role:</label>
                <select 
                  value={simRole}
                  onChange={(e) => setSimRole(e.target.value)}
                  className="w-full bg-surface border border-border-main rounded text-xs p-2 font-medium"
                >
                  {PRESET_PERSONAS.map(p => (
                    <option key={p.roleCode} value={p.roleCode}>{p.roleName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1">Export Type:</label>
                <select 
                  value={simAction}
                  onChange={(e) => setSimAction(e.target.value as any)}
                  className="w-full bg-surface border border-border-main rounded text-xs p-2 font-medium"
                >
                  <option value="RAW_DATA">Raw Survey Microdata (CSV/XLSX)</option>
                  <option value="REPORT">Aggregate Report Brief (PDF)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-text-main block mb-1">Target District:</label>
                <select 
                  value={simDistrict}
                  onChange={(e) => setSimDistrict(e.target.value)}
                  className="w-full bg-surface border border-border-main rounded text-xs p-2 font-medium"
                >
                  <option value="Nyagatare">Nyagatare (Eastern Province)</option>
                  <option value="Musanze">Musanze (Northern Province)</option>
                  <option value="Huye">Huye (Southern Province)</option>
                  <option value="Bugesera">Bugesera (Eastern Province)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleTestEnforcement}
                  disabled={simTesting}
                  className="w-full py-2 px-4 bg-primary hover:bg-primary-light text-white rounded text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {simTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                  Execute Backend Check
                </button>
              </div>
            </div>

            {simResult && (
              <div className={`p-4 rounded-xl border text-sm animate-in fade-in ${
                simResult.status === 200 
                  ? 'bg-success/10 border-success/30 text-success' 
                  : 'bg-danger/10 border-danger/30 text-danger'
              }`}>
                <div className="font-bold flex items-center gap-2 mb-1">
                  {simResult.status === 200 ? <CheckCircle2 className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
                  HTTP {simResult.status} {simResult.status === 200 ? 'Access Granted' : 'Access Denied'}
                </div>
                <div className="text-xs font-mono bg-black/5 p-2 rounded mt-1">
                  {JSON.stringify(simResult.data, null, 2)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PERMISSIONS MATRIX (SECTION 4.2) */}
      {activeTab === 'matrix' && (
        <div className="bg-surface rounded-2xl border border-border-main overflow-hidden shadow-sm space-y-4 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-main">
            <div>
              <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Section 4.2 Permissions Matrix (13 Capabilities × 8 Roles)
              </h2>
              <p className="text-xs text-muted">
                Official starting policy governing dashboard access, raw data export, dataset ingestion, and audit visibility.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1 bg-background p-1 rounded-lg border border-border-main text-xs font-semibold">
              {['ALL', 'DATASETS', 'REPORTING', 'ANALYTICS', 'ADMIN'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setMatrixFilter(cat)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    matrixFilter === cat ? 'bg-primary text-white' : 'text-muted hover:text-text-main'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-background text-text-main uppercase font-extrabold tracking-wider border-b border-border-main text-[11px]">
                  <th className="p-3 w-64">Capability</th>
                  <th className="p-3 text-center">Admin</th>
                  <th className="p-3 text-center">Data Mgr</th>
                  <th className="p-3 text-center">Natl Planner</th>
                  <th className="p-3 text-center bg-primary/5">Dist Officer</th>
                  <th className="p-3 text-center bg-primary/5">Sect Officer</th>
                  <th className="p-3 text-center">Researcher</th>
                  <th className="p-3 text-center">Farmer/Co-op</th>
                  <th className="p-3 text-center">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {matrixData.capabilities
                  .filter(c => matrixFilter === 'ALL' || c.category === matrixFilter)
                  .map(cap => {
                    const rowPolicies = matrixData.matrix[cap.code] || {};
                    return (
                      <tr key={cap.code} className="hover:bg-background/60 transition-colors">
                        <td className="p-3 font-semibold text-text-main">
                          <div>{cap.name}</div>
                          <div className="text-[10px] text-muted font-normal">{cap.description}</div>
                        </td>
                        <td className="p-3 text-center">{getPolicyBadge(rowPolicies['PLATFORM_ADMIN'])}</td>
                        <td className="p-3 text-center">{getPolicyBadge(rowPolicies['DATA_MANAGER'])}</td>
                        <td className="p-3 text-center">{getPolicyBadge(rowPolicies['NATIONAL_PLANNER'])}</td>
                        <td className="p-3 text-center bg-primary/5">{getPolicyBadge(rowPolicies['DISTRICT_OFFICER'])}</td>
                        <td className="p-3 text-center bg-primary/5">{getPolicyBadge(rowPolicies['SECTOR_OFFICER'])}</td>
                        <td className="p-3 text-center">{getPolicyBadge(rowPolicies['RESEARCHER_ANALYST'])}</td>
                        <td className="p-3 text-center">{getPolicyBadge(rowPolicies['COOPERATIVE_FARMER'])}</td>
                        <td className="p-3 text-center">{getPolicyBadge(rowPolicies['PARTNER_VIEWER'])}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-border-main flex flex-wrap gap-4 text-xs text-muted">
            <span className="font-bold text-text-main">Policy Legend:</span>
            <span><strong className="text-success">Yes:</strong> Full nationwide capability</span>
            <span><strong className="text-primary">Scoped:</strong> Restricted strictly to assigned district/sector</span>
            <span><strong className="text-purple-600">Authorized:</strong> Requires separate review/role assignment</span>
            <span><strong className="text-amber-600">Controlled:</strong> Requires two-man approval workflow</span>
            <span><strong className="text-danger">No:</strong> Barred by system firewall</span>
          </div>
        </div>
      )}

      {/* TAB 3: USER & GEOGRAPHIC SCOPE MANAGEMENT (SCREEN 6) */}
      {activeTab === 'users' && (
        <div className="bg-surface rounded-2xl border border-border-main p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-border-main">
            <div>
              <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Screen 6: User Directory & Geographic Scoping
              </h2>
              <p className="text-xs text-muted">
                Administrative assignment of roles and geographical jurisdictions (Rwanda Country, Districts, Sectors).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveTab('register-officer')}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" /> Register District Officer
              </button>
              <button 
                onClick={fetchData}
                className="p-2 border border-border-main rounded-lg hover:bg-background transition-colors text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Accounts
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-background text-text-main uppercase font-extrabold tracking-wider border-b border-border-main text-[11px]">
                  <th className="p-3">User & Contact</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Scope Level</th>
                  <th className="p-3">Geographic Boundary</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {usersList.map(u => (
                  <tr key={u.id} className="hover:bg-background/60 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-text-main text-sm">{u.full_name}</div>
                      <div className="text-muted font-mono">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">
                        {u.role_name || u.role_code || 'Unassigned'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-text-main">
                      {u.scope_level || 'NATIONAL'}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 font-medium text-text-main">
                        <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        {u.district_name ? `${u.district_name} District` : (u.sector_name ? `${u.sector_name} Sector` : 'Rwanda (National)')}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-success/15 text-success">
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setNewRole(u.role_code);
                          setNewDistrict(u.district_name || '');
                          setNewSector(u.sector_name || '');
                        }}
                        className="px-3 py-1 bg-background hover:bg-surface border border-border-main rounded text-xs font-semibold transition-colors"
                      >
                        Edit Scope
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Edit Scope Modal */}
          {editingUser && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-surface rounded-2xl border border-border-main max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-border-main">
                  <h3 className="font-extrabold text-base text-text-main">
                    Edit Geographic Jurisdiction
                  </h3>
                  <button onClick={() => setEditingUser(null)} className="text-muted hover:text-text-main">✕</button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-text-main block mb-1">User Account:</label>
                    <input 
                      disabled 
                      value={`${editingUser.full_name} (${editingUser.email})`}
                      className="w-full bg-background border border-border-main p-2 rounded text-xs font-mono text-muted"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-main block mb-1">Assigned Role:</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full bg-background border border-border-main p-2 rounded text-xs font-semibold"
                    >
                      {PRESET_PERSONAS.map(p => (
                        <option key={p.roleCode} value={p.roleCode}>{p.roleName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-main block mb-1">Assigned District (Geographic Bound):</label>
                    <select
                      value={newDistrict}
                      onChange={(e) => setNewDistrict(e.target.value)}
                      className="w-full bg-background border border-border-main p-2 rounded text-xs font-medium"
                    >
                      <option value="">National (No District Restriction)</option>
                      <option value="Nyagatare">Nyagatare District</option>
                      <option value="Bugesera">Bugesera District</option>
                      <option value="Gatsibo">Gatsibo District</option>
                      <option value="Musanze">Musanze District</option>
                      <option value="Huye">Huye District</option>
                      <option value="Rwamagana">Rwamagana District</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-main block mb-1">Assigned Sector (If Sector Officer):</label>
                    <input
                      placeholder="e.g. Rukomo, Muhoza, Tumba"
                      value={newSector}
                      onChange={(e) => setNewSector(e.target.value)}
                      className="w-full bg-background border border-border-main p-2 rounded text-xs font-medium"
                    />
                  </div>
                </div>

                {saveStatus && (
                  <div className="text-xs p-2 bg-primary/10 text-primary rounded font-semibold text-center">
                    {saveStatus}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-2 bg-background hover:bg-surface border border-border-main rounded text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveUser}
                    className="flex-1 py-2 bg-primary hover:bg-primary-light text-white rounded text-xs font-bold"
                  >
                    Save Jurisdiction
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REGISTER AGRICULTURAL DISTRICT OFFICER */}
      {activeTab === 'register-officer' && (
        <RegisterDistrictOfficerForm 
          onSuccess={fetchData}
          existingUsers={usersList}
        />
      )}

      {/* TAB 5: SECURITY AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-surface rounded-2xl border border-border-main p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-border-main">
            <div>
              <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Security Audit Log & Forensic Trail
              </h2>
              <p className="text-xs text-muted">
                Immutable chronological log of export requests, geographic security violations, and publication sign-offs.
              </p>
            </div>
            <button 
              onClick={fetchData}
              className="p-2 border border-border-main rounded-lg hover:bg-background transition-colors text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-background text-text-main uppercase font-extrabold tracking-wider border-b border-border-main text-[11px]">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor & Role</th>
                  <th className="p-3">Security Action</th>
                  <th className="p-3">Target Resource</th>
                  <th className="p-3">Audit Details</th>
                  <th className="p-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main font-mono">
                {auditLogs.map((log: any) => {
                  const isViolation = log.action?.includes('DENIED') || log.action?.includes('VIOLATION');
                  return (
                    <tr key={log.id} className="hover:bg-background/60 transition-colors">
                      <td className="p-3 text-muted text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-3 font-sans">
                        <div className="font-bold text-text-main">{log.actor_email}</div>
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-semibold font-mono">
                          {log.actor_role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isViolation 
                            ? 'bg-danger/15 text-danger border border-danger/30' 
                            : 'bg-success/15 text-success border border-success/30'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 font-semibold font-sans text-text-main">
                        {log.resource}
                      </td>
                      <td className="p-3 text-[11px] text-muted max-w-xs truncate" title={JSON.stringify(log.details)}>
                        {JSON.stringify(log.details)}
                      </td>
                      <td className="p-3 text-muted text-[11px]">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
