import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Loader2, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../../config/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // States for Phase 1 simulation
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = () => {
    const newErrors: any = {};
    if (!email) {
      newErrors.email = 'Please enter your email address.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    
    if (!password) {
      newErrors.password = 'Please enter your password.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      const res = await fetch(apiUrl('auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors({ general: data.message || 'The email or password you entered is incorrect.' });
        return;
      }

      // Store auth session
      localStorage.setItem('agrilens_token', data.accessToken);
      localStorage.setItem('agrilens_user', JSON.stringify(data.user));

      // Role-Based Redirection (Directing users to authorized workspaces)
      if (data.user?.role === 'PLATFORM_ADMIN' || data.user?.role === 'SYSTEM_ADMIN') {
        navigate('/system-admin/overview');
      } else if (data.user?.role === 'DATA_MANAGER') {
        navigate('/data-manager/overview');
      } else if (data.user?.role === 'DISTRICT_OFFICER') {
        navigate('/district/overview');
      } else if (data.user?.role === 'NATIONAL_PLANNER') {
        navigate('/admin/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setErrors({ general: err.message || 'Unable to connect to authentication service.' });
    } finally {
      setLoading(false);
    }
  };

  const setQuickCredentials = (em: string, pass: string) => {
    setEmail(em);
    setPassword(pass);
    setErrors({});
  };

  return (
    <div className="flex h-screen w-full bg-[#f3f7f4] font-sans">
      {/* Left Panel: Visual/Map (Hidden on small screens) - Forest Green Theme */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative bg-[#0d331f] flex-col justify-end p-12 overflow-hidden">
        {/* Background Image / Map Mock */}
        <div className="absolute inset-0 z-0 mix-blend-overlay opacity-60">
          <img 
            src="/crop_productivity.jpg" 
            alt="Rwanda Agricultural Fields" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Forest Green Gradient Overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#082214] via-[#0e3b24]/85 to-[#14532d]/30"></div>
        
        {/* Floating elements to mimic intelligence */}
        <div className="absolute top-20 right-20 w-64 h-64 border border-emerald-500/20 rounded-full animate-ping opacity-25"></div>
        <div className="absolute top-[30%] left-[40%] w-2.5 h-2.5 bg-amber-400 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.9)]"></div>
        <div className="absolute top-[45%] left-[60%] w-3 h-3 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.9)]"></div>
        <div className="absolute top-[60%] left-[30%] w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_14px_rgba(52,211,153,0.9)]"></div>

        <div className="relative z-10 text-white max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 border border-emerald-400/30 bg-emerald-950/60 text-emerald-300 text-[10px] font-bold tracking-widest uppercase rounded backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            AGRICULTURAL INTELLIGENCE PLATFORM
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-4 tracking-tight text-white drop-shadow-sm">
            Agricultural Intelligence for Better Decisions
          </h1>
          <p className="text-lg text-emerald-100/90 leading-relaxed max-w-md font-medium">
            Transforming agricultural data into spatial intelligence, evidence-based priorities and actionable interventions for Rwanda.
          </p>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 bg-white overflow-y-auto border-l border-emerald-950/10">
        <div className="w-full max-w-[400px]">
          
          {/* Logo with Forest Green Accents */}
          <div className="flex items-center gap-2 mb-8">
            <img src="/logo.png?v=2" alt="AgriLens Logo" className="w-10 h-10 object-contain shadow-sm" />
            <div>
              <div className="font-extrabold text-2xl tracking-tight text-[#14532d] leading-none">
                AgriLens <span className="font-light text-emerald-600">RWANDA</span>
              </div>
              <div className="text-[10px] font-bold text-emerald-800/70 uppercase tracking-wider mt-1">
                Intelligence & Intervention Platform
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sign in to access agricultural intelligence, analytics and decision-support tools.
            </p>
          </div>

          {errors.general && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <div>
                <span className="font-semibold block mb-0.5">Unable to sign in</span>
                {errors.general}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={`w-full px-4 py-2.5 rounded-lg border bg-[#f8faf8] text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                  errors.email 
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' 
                    : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/20'
                }`}
                disabled={loading}
              />
              {errors.email && (
                <div className="mt-1.5 flex items-center text-xs text-rose-600 font-medium animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.email}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full pl-4 pr-10 py-2.5 rounded-lg border bg-[#f8faf8] text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                    errors.password 
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' 
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/20'
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <div className="mt-1.5 flex items-center text-xs text-rose-600 font-medium animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.password}
                </div>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-emerald-700 border-emerald-700 text-white' : 'border-slate-300 bg-white group-hover:border-emerald-600'}`}>
                  {rememberMe && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span className="text-sm font-medium text-slate-700 select-none">Remember me</span>
              </label>
              
              <a href="#" className="text-sm font-semibold text-emerald-800 hover:text-emerald-700 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button in Forest Green */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-[#14532d] hover:bg-[#166534] active:bg-[#0f3d22] text-white font-bold py-2.5 rounded-lg shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Panel */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-900/70 mb-3">
              Quick Role Sign-In (Official Credentials):
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setQuickCredentials('admin@agrilens.rw', 'Admin@2026!')}
                className="w-full text-left p-2.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100/90 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                    <span>🌾</span>
                    <span>National Agricultural Planner (Hon. Jean-Claude Musabyimana)</span>
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    admin@agrilens.rw
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-800 text-white shadow-xs">
                  Fill Credentials
                </span>
              </button>

              <button
                type="button"
                onClick={() => setQuickCredentials('sysadmin@agrilens.gov.rw', 'Admin@2026!')}
                className="w-full text-left p-2.5 rounded-lg border border-slate-300 bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                    <span>👑</span>
                    <span>Platform System Administrator (Technical Governance Center)</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    sysadmin@agrilens.gov.rw
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-extrabold shadow-xs">
                  Fill Credentials
                </span>
              </button>

              <button
                type="button"
                onClick={() => setQuickCredentials('datamanager@agrilens.gov.rw', 'Data@2026!')}
                className="w-full text-left p-2.5 rounded-lg border border-emerald-200 bg-[#f0fdf4] hover:bg-emerald-100/70 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                    <span>📊</span>
                    <span>Data Manager (National Data Pipeline & Governance)</span>
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    datamanager@agrilens.gov.rw
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-emerald-900 border border-emerald-300 shadow-2xs">
                  Fill Credentials
                </span>
              </button>

              <button
                type="button"
                onClick={() => setQuickCredentials('officer.musanze@minagri.gov.rw', 'Musanze@2026!')}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 bg-[#fafcfa] hover:bg-emerald-50 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <span>🥔</span>
                    <span>District Agricultural Officer (Musanze District)</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    officer.musanze@minagri.gov.rw
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 shadow-2xs">
                  Fill Credentials
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
