import React, { useState } from 'react';
import { 
  UserPlus, ShieldCheck, MapPin, Key, Lock, Eye, EyeOff, 
  CheckCircle2, AlertCircle, Copy, ArrowRight, ExternalLink, RefreshCw, Sparkles 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RWANDA_DISTRICTS = [
  'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi', 'Gisagara', 
  'Huye', 'Kamonyi', 'Karongi', 'Kayonza', 'Kicukiro', 'Kirehe', 'Muhanga', 
  'Musanze', 'Ngoma', 'Ngororero', 'Nyabihu', 'Nyagatare', 'Nyamagabe', 
  'Nyamasheke', 'Nyanza', 'Nyarugenge', 'Nyaruguru', 'Rubavu', 'Ruhango', 
  'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana'
];

interface Props {
  onSuccess?: () => void;
  existingUsers?: any[];
}

export default function RegisterDistrictOfficerForm({ onSuccess, existingUsers = [] }: Props) {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [districtName, setDistrictName] = useState('Musanze');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-generate official email based on district
  const handleDistrictChange = (dist: string) => {
    setDistrictName(dist);
    if (!email || email.includes('.officer@minagri.gov.rw') || email.includes('district.')) {
      setEmail(`district.${dist.toLowerCase()}@minagri.gov.rw`);
    }
  };

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let res = `${districtName}@2026!`;
    setPassword(res);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessData(null);
    setSubmitting(true);

    try {
      const res = await fetch('http://localhost:3000/api/v1/auth/register-district-officer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email: email.trim().toLowerCase(),
          phone,
          password,
          districtName,
          notes,
          registeredByEmail: 'admin@agrilens.gov.rw'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      setSuccessData({
        ...data.user,
        plainPassword: password
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect to backend registration endpoint.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (!successData) return;
    const text = `AgriLens Rwanda — District Agricultural Officer Credentials\n` +
      `Officer Name: ${successData.name}\n` +
      `Email: ${successData.email}\n` +
      `Password: ${successData.plainPassword}\n` +
      `Assigned District: ${successData.district}\n` +
      `Scope: ${successData.district} District & Subordinate Sectors Only\n` +
      `Login URL: http://localhost:5173/login`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const testLoginAsOfficer = async () => {
    if (!successData) return;
    try {
      const res = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: successData.email,
          password: successData.plainPassword
        })
      });
      if (res.ok) {
        const loginData = await res.json();
        localStorage.setItem('agrilens_token', loginData.accessToken);
        localStorage.setItem('agrilens_user', JSON.stringify(loginData.user));
        navigate('/district/overview');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter existing district officers from directory
  const districtOfficers = existingUsers.filter(u => 
    u.role_code === 'DISTRICT_OFFICER' || u.role_name?.includes('District')
  );

  return (
    <div className="space-y-6">
      
      {/* 1. Registration Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Register Agricultural District Officer
            </h2>
            <p className="text-xs text-slate-500">
              Provision official credentials and establish single-district geographic authorization. The officer will see only data for their assigned district.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Card with Credentials */}
        {successData && (
          <div className="mt-4 p-5 bg-emerald-50/90 border-2 border-emerald-500 rounded-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span>Agricultural District Officer Registered Successfully</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                ACTIVE IN SYSTEM
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
              <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Full Name</span>
                <span className="font-bold text-slate-900">{successData.name}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Official Login Email</span>
                <span className="font-bold text-slate-900 truncate block">{successData.email}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Assigned District</span>
                <span className="font-extrabold text-emerald-800">{successData.district}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Password</span>
                <span className="font-mono font-bold text-slate-900">{successData.plainPassword}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Backend Guard: Access strictly restricted to {successData.district} District & subordinate sectors.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
                </button>
                <button
                  type="button"
                  onClick={testLoginAsOfficer}
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>Launch District Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="mt-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Officer Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Jean Damascene Nkundabagenzi"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Official Email */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Official Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. district.musanze@minagri.gov.rw"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+250 788 123 456"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* District Dropdown */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Assigned Rwanda District <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={districtName}
                  onChange={e => handleDistrictChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none bg-white cursor-pointer"
                >
                  {RWANDA_DISTRICTS.map(d => (
                    <option key={d} value={d}>{d} District</option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Initial Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Initial Password <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateSecurePassword}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Suggest Password
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create secure initial password"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role & Scope Fixed Metadata */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-center">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
                Assigned Role & Enforcement
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                  District Agricultural Officer
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 font-semibold text-[11px]">
                  Scope: {districtName} & Subordinate Sectors
                </span>
              </div>
            </div>

          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Office Notes / Deployment Location
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Northern Province — Musanze District Agricultural Directorate"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Registering Officer...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Register & Issue District Credentials</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Registered District Officers Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Registered District Agricultural Officers Directory
            </h3>
            <p className="text-xs text-slate-500">
              Active officers with single-district access authorization.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
            {districtOfficers.length} Officers Registered
          </span>
        </div>

        {districtOfficers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-1">Officer Name</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Assigned District</th>
                  <th className="pb-3">Scope Boundary</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-1">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {districtOfficers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pl-1 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center">
                        {u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      {u.full_name}
                    </td>
                    <td className="py-3 text-slate-600 font-medium">{u.email}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <MapPin className="w-3 h-3 text-emerald-700" />
                        {u.district_name || 'Assigned'} District
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">
                      {u.district_name ? `${u.district_name} & Subordinate Sectors` : 'District Level'}
                    </td>
                    <td className="py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ACTIVE
                      </span>
                    </td>
                    <td className="py-3 text-right pr-1">
                      <button
                        onClick={() => {
                          const userObj = {
                            id: u.id,
                            name: u.full_name,
                            email: u.email,
                            role: 'DISTRICT_OFFICER',
                            roleName: 'District Agricultural Officer',
                            scopeLevel: 'DISTRICT',
                            district: u.district_name || 'Musanze'
                          };
                          localStorage.setItem('agrilens_user', JSON.stringify(userObj));
                          navigate('/district/overview');
                        }}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <span>Open Dashboard</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            No district officers found. Register an officer above.
          </div>
        )}
      </div>

    </div>
  );
}
