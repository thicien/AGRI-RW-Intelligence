import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Loader2, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      const res = await fetch('http://localhost:3000/api/v1/auth/login', {
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
      if (data.user?.role === 'DISTRICT_OFFICER') {
        navigate('/district/overview');
      } else if (data.user?.role === 'DATA_MANAGER') {
        navigate('/data-manager/overview');
      } else if (data.user?.role === 'NATIONAL_PLANNER') {
        navigate('/admin/analytics');
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
    <div className="flex h-screen w-full bg-background font-sans">
      {/* Left Panel: Visual/Map (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative bg-primary flex-col justify-end p-12 overflow-hidden">
        {/* Background Image / Map Mock */}
        <div className="absolute inset-0 z-0 mix-blend-overlay opacity-50">
          <img 
            src="https://images.unsplash.com/photo-1593352216447-068305e54d8f?auto=format&fit=crop&q=80" 
            alt="Rwanda Agricultural Fields" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0D47A1] via-[#0D47A1]/80 to-transparent"></div>
        
        {/* Floating elements to mimic intelligence */}
        <div className="absolute top-20 right-20 w-64 h-64 border border-white/10 rounded-full animate-ping opacity-20"></div>
        <div className="absolute top-[30%] left-[40%] w-2 h-2 bg-warning rounded-full shadow-[0_0_10px_rgba(249,168,37,0.8)]"></div>
        <div className="absolute top-[45%] left-[60%] w-3 h-3 bg-danger rounded-full shadow-[0_0_15px_rgba(198,40,40,0.8)]"></div>
        <div className="absolute top-[60%] left-[30%] w-2 h-2 bg-agriculture rounded-full shadow-[0_0_10px_rgba(46,125,50,0.8)]"></div>

        <div className="relative z-10 text-white max-w-xl">
          <div className="inline-block px-3 py-1 mb-6 border border-white/20 bg-black/20 text-white text-[10px] font-bold tracking-widest uppercase rounded backdrop-blur-sm">
            AGRICULTURAL INTELLIGENCE
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4 tracking-tight">
            Agricultural Intelligence for Better Decisions
          </h1>
          <p className="text-lg text-primary-soft/90 leading-relaxed max-w-md">
            Transforming agricultural data into spatial intelligence, evidence-based priorities and actionable interventions.
          </p>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 bg-surface overflow-y-auto">
        <div className="w-full max-w-[400px]">
          
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <img src="/logo.png" alt="AgriLens Logo" className="w-10 h-10 object-contain shadow-sm" />
            <div>
              <div className="font-bold text-2xl tracking-tight text-primary leading-none">
                AgriLens <span className="font-light text-primary-light">RWANDA</span>
              </div>
              <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mt-1">
                Intelligence & Intervention Platform
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-main mb-2">Welcome back</h2>
            <p className="text-sm text-muted">
              Sign in to access agricultural intelligence, analytics and decision-support tools.
            </p>
          </div>

          {errors.general && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded text-danger text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Unable to sign in</span>
                {errors.general}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-text-main mb-1.5" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={`w-full px-4 py-2.5 rounded border bg-background text-sm transition-colors focus:outline-none focus:ring-2 ${
                  errors.email 
                    ? 'border-danger focus:border-danger focus:ring-danger/20' 
                    : 'border-border-main focus:border-primary focus:ring-primary/20'
                }`}
                disabled={loading}
              />
              {errors.email && (
                <div className="mt-1.5 flex items-center text-xs text-danger font-medium animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.email}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-text-main mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full pl-4 pr-10 py-2.5 rounded border bg-background text-sm transition-colors focus:outline-none focus:ring-2 ${
                    errors.password 
                      ? 'border-danger focus:border-danger focus:ring-danger/20' 
                      : 'border-border-main focus:border-primary focus:ring-primary/20'
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text-main transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <div className="mt-1.5 flex items-center text-xs text-danger font-medium animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errors.password}
                </div>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-primary border-primary text-white' : 'border-border-main bg-background group-hover:border-primary'}`}>
                  {rememberMe && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span className="text-sm font-medium text-text-main select-none">Remember me</span>
              </label>
              
              <a href="#" className="text-sm font-semibold text-primary hover:text-primary-light transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-primary hover:bg-primary-light text-white font-semibold py-2.5 rounded shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
          <div className="mt-8 pt-6 border-t border-border-main">
            <div className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
              Quick Role Sign-In (Official Credentials):
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setQuickCredentials('officer.musanze@minagri.gov.rw', 'Musanze@2026!')}
                className="w-full text-left p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-xs text-emerald-950">
                    🥔 District Officer (Musanze)
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    officer.musanze@minagri.gov.rw
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-200">
                  Fill Credentials
                </span>
              </button>

              <button
                type="button"
                onClick={() => setQuickCredentials('district.nyagatare@minagri.gov.rw', 'AgriLens@2026!')}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-xs text-slate-800">
                    🌾 District Officer (Nyagatare)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    district.nyagatare@minagri.gov.rw
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                  Fill Credentials
                </span>
              </button>

              <button
                type="button"
                onClick={() => setQuickCredentials('datamanager@agrilens.gov.rw', 'Data@2026!')}
                className="w-full text-left p-2.5 rounded-lg border border-teal-200 bg-teal-50/70 hover:bg-teal-100/70 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-xs text-teal-950">
                    📊 Data Manager (National Data Pipeline)
                  </div>
                  <div className="text-[11px] text-teal-800">
                    datamanager@agrilens.gov.rw
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-teal-800 border border-teal-200">
                  Fill Credentials
                </span>
              </button>

              <button
                type="button"
                onClick={() => setQuickCredentials('admin@agrilens.gov.rw', 'Admin@2026!')}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-xs text-slate-800">
                    👑 Platform Administrator
                  </div>
                  <div className="text-[11px] text-slate-500">
                    admin@agrilens.gov.rw
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
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
