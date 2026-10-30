import { Link } from 'react-router-dom';
import { 
  BarChart3, Map, Network, Target, ChevronRight, 
  ArrowRight, Activity, Database, CheckCircle2, ShieldAlert
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import RwandaSignatureMapBanner from './components/RwandaSignatureMapBanner';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f8f5] font-sans text-slate-800 selection:bg-emerald-200 selection:text-emerald-950">
      
      {/* 2. Navigation Bar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-emerald-100 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png?v=2" alt="AgriLens Logo" className="w-8 h-8 object-contain" />
            <div className="font-extrabold text-xl tracking-tight text-[#14532d]">
              AgriLens <span className="font-light text-emerald-600">RWANDA</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700">
            <Link to="/public-portal" className="text-emerald-800 font-bold hover:text-emerald-950 transition-colors flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" /> Public Portal
            </Link>
            <a href="#portal-sections" className="hover:text-emerald-700 transition-colors">5 Intelligence Sections</a>
            <a href="#platform" className="hover:text-emerald-700 transition-colors">Platform</a>
            <a href="#how-it-works" className="hover:text-emerald-700 transition-colors">How It Works</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-emerald-800 transition-colors hidden sm:block">
              Staff Sign In
            </Link>
            <Link to="/public-portal" className="bg-[#14532d] hover:bg-[#166534] text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm shadow-emerald-950/20 cursor-pointer flex items-center gap-1.5">
              Access the Platform
            </Link>
          </div>
        </div>
      </nav>

      {/* 3. Hero Section - Forest Green Agricultural Aesthetics */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-b from-[#eaf4ed] via-[#f4f8f5] to-white border-b border-emerald-100/70">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Message */}
          <div className="z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-6 border border-emerald-600/30 bg-emerald-100/70 text-emerald-900 text-[11px] font-extrabold tracking-widest uppercase rounded-full shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Rwanda Agricultural Intelligence
            </div>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.15] tracking-tight mb-6 text-slate-900">
              Agricultural <span className="text-[#15803d]">Intelligence</span> for Better Decisions
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-xl leading-relaxed">
              Transform national agricultural surveys into spatial intelligence, evidence-based priorities, and actionable interventions across Rwanda's 30 districts.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <Link to="/public-portal" className="bg-[#14532d] hover:bg-[#166534] text-white px-7 py-3.5 rounded-xl font-bold flex items-center transition-all shadow-md shadow-emerald-950/20 group cursor-pointer text-sm">
                Access the Platform <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-950 px-6 py-3.5 rounded-xl font-bold transition-colors shadow-xs cursor-pointer text-sm">
                Staff Sign In
              </Link>
            </div>
            
            {/* Bottom Statement */}
            <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Database className="w-4 h-4 text-emerald-700" /> Data-driven</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="flex items-center gap-1.5"><Map className="w-4 h-4 text-emerald-600" /> Spatial</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Evidence-based</span>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative lg:h-[600px] w-full animate-in fade-in zoom-in-95 duration-1000 delay-200">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0a2f1c] via-[#14532d] to-[#1c6a3f] rounded-2xl border border-emerald-800/40 overflow-hidden shadow-2xl">
              {/* Agricultural Background */}
              <img src="/crop_productivity.jpg" alt="Rwanda Agriculture Intelligence" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />
              
              {/* Ambient Glows */}
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-emerald-400/25 rounded-full blur-3xl animate-pulse delay-700"></div>
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm">
                {/* Information Card */}
                <div className="bg-white/95 backdrop-blur-md shadow-2xl border border-emerald-100 rounded-xl p-5 transform hover:-translate-y-1 transition-transform">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#14532d] mb-1">AgriLens Intelligence</div>
                  <h3 className="font-extrabold text-lg text-slate-900 mb-2">Agricultural Priority Analysis</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs px-2.5 py-1 rounded-md font-bold flex items-center">
                      <Map className="w-3.5 h-3.5 mr-1 text-emerald-700"/> Spatial Intelligence
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">Identifying vulnerable agricultural zones based on derived risk indicators, yield gaps, and seasonal statistics.</p>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-rose-500 border-2 border-white shadow-xs"></div>
                      <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-xs"></div>
                      <div className="w-6 h-6 rounded-full bg-emerald-600 border-2 border-white shadow-xs"></div>
                    </div>
                    <span className="text-xs font-bold text-[#14532d] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Scan Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Public Agricultural Intelligence Portal Feature Showcase (Open Access) */}
      <section id="portal-sections" className="py-20 bg-gradient-to-b from-white via-emerald-50/30 to-white border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 border border-emerald-600/30 bg-emerald-100 text-emerald-900 text-[11px] font-extrabold tracking-widest uppercase rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Featured Platform Capability
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                Public Agricultural <span className="text-[#15803d]">Intelligence Portal</span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
                Reliable, read-only agricultural intelligence making Rwanda's agricultural performance accessible to researchers, students, development organizations, investors, and members of the public without an account.
              </p>
            </div>

            <Link
              to="/public-portal"
              className="bg-[#14532d] hover:bg-[#166534] text-white px-6 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-emerald-950/15 cursor-pointer shrink-0 self-start md:self-auto"
            >
              Access the Platform <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 5 Agricultural Sections Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            <Link 
              to="/public-portal?section=productivity" 
              className="p-5 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-400 hover:shadow-lg transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-2">01</div>
                <h3 className="font-extrabold text-slate-900 text-base mb-2 group-hover:text-emerald-700 transition-colors">
                  Productivity Intelligence
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Understand what Rwanda produces, which crops are grown, and how yields change across seasons and districts.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-emerald-800 flex items-center gap-1">
                Explore Productivity →
              </div>
            </Link>

            <Link 
              to="/public-portal?section=irrigation" 
              className="p-5 rounded-2xl bg-white border border-cyan-100 hover:border-cyan-400 hover:shadow-lg transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-black text-cyan-700 uppercase tracking-wider mb-2">02</div>
                <h3 className="font-extrabold text-slate-900 text-base mb-2 group-hover:text-cyan-700 transition-colors">
                  Irrigation Intelligence
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Explore documented schemes, modern irrigation coverage, and multi-criteria small-scale opportunity screening.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-cyan-800 flex items-center gap-1">
                Explore Irrigation →
              </div>
            </Link>

            <Link 
              to="/public-portal?section=soil" 
              className="p-5 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-400 hover:shadow-lg transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-2">03</div>
                <h3 className="font-extrabold text-slate-900 text-base mb-2 group-hover:text-emerald-700 transition-colors">
                  Soil Conservation & Fertility
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Examine documented radical terracing, agroforestry, fertilizer adoption, soil acidity (pH), and erosion risks.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-emerald-800 flex items-center gap-1">
                Explore Soil Health →
              </div>
            </Link>

            <Link 
              to="/public-portal?section=post-harvest" 
              className="p-5 rounded-2xl bg-white border border-purple-100 hover:border-purple-400 hover:shadow-lg transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-black text-purple-700 uppercase tracking-wider mb-2">04</div>
                <h3 className="font-extrabold text-slate-900 text-base mb-2 group-hover:text-purple-700 transition-colors">
                  Post-Harvest & Storage
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Investigate registered warehouses, cold storage, usable capacity, and market surplus capacity deficits.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-purple-800 flex items-center gap-1">
                Explore Post-Harvest →
              </div>
            </Link>

            <Link 
              to="/public-portal?section=export" 
              className="p-5 rounded-2xl bg-white border border-amber-100 hover:border-amber-400 hover:shadow-lg transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-black text-amber-700 uppercase tracking-wider mb-2">05</div>
                <h3 className="font-extrabold text-slate-900 text-base mb-2 group-hover:text-amber-700 transition-colors">
                  Export Market Opportunities
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Analyze high-value export commodities (avocado, coffee, tea, chillies), FOB pricing, and destination routes.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-amber-800 flex items-center gap-1">
                Explore Exports →
              </div>
            </Link>
          </div>

          {/* Banner: How Public Access Works */}
          <div className="p-6 rounded-2xl bg-emerald-900 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider">
                Step 1: Access the Platform · Step 2: Explore the 5 Sections · Step 3: Shared Filters · Step 4: Compare Results
              </div>
              <div className="text-lg font-black tracking-tight">
                Open Agricultural Evidence For Everyone
              </div>
              <p className="text-xs text-emerald-100/80 max-w-xl">
                Distinguishes recorded NISR survey statistics from modelled decision assessments. No account required for public exploration.
              </p>
            </div>

            <Link
              to="/public-portal"
              className="bg-white text-emerald-950 hover:bg-emerald-100 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shrink-0 cursor-pointer"
            >
              Enter Public Portal
            </Link>
          </div>
        </div>
      </section>

      {/* 7. From Data to Action */}
      <section id="platform" className="py-24 bg-white border-y border-emerald-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="text-xs font-extrabold tracking-widest text-[#14532d] uppercase mb-3">The AgriLens Approach</div>
          <h2 className="text-3xl lg:text-4xl font-extrabold mb-6 text-slate-900">From Agricultural Data to Actionable Intelligence</h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-16 leading-relaxed">
            Agricultural data tells us what is happening. AgriLens transforms raw survey datasets into where attention is needed, why it matters, and what targeted intervention should follow.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <FlowStep icon={<Database className="w-6 h-6"/>} label="DATA" />
            <ChevronRight className="w-5 h-5 text-emerald-300 hidden md:block" />
            <FlowStep icon={<BarChart3 className="w-6 h-6"/>} label="ANALYSIS" />
            <ChevronRight className="w-5 h-5 text-emerald-300 hidden md:block" />
            <FlowStep icon={<Network className="w-6 h-6"/>} label="INTELLIGENCE" />
            <ChevronRight className="w-5 h-5 text-emerald-300 hidden md:block" />
            <FlowStep icon={<ShieldAlert className="w-6 h-6"/>} label="PRIORITY" />
            <ChevronRight className="w-5 h-5 text-emerald-300 hidden md:block" />
            <FlowStep icon={<Target className="w-6 h-6"/>} label="ACTION" active />
          </div>
        </div>
      </section>

      {/* 8. Four Intelligence Capabilities */}
      <section id="intelligence" className="py-24 bg-[#f7faf8]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CapabilityCard 
              num="01"
              title="Productivity Intelligence"
              desc="Understand crop production, yield patterns and agricultural productivity across Rwanda."
              icon={<BarChart3 className="w-6 h-6" />}
              imageSrc="/crop_productivity.jpg"
            />
            <CapabilityCard 
              num="02"
              title="Spatial Intelligence"
              desc="Discover where agricultural problems, risks and opportunities are geographically concentrated."
              icon={<Map className="w-6 h-6" />}
              imageSrc="/spatial_intelligence.jpg"
            />
            <CapabilityCard 
              num="03"
              title="AI & Evidence"
              desc="Use predictive models while maintaining visibility into the evidence supporting each insight."
              icon={<Network className="w-6 h-6" />}
              imageSrc="/ai_evidence.jpg"
            />
            <CapabilityCard 
              num="04"
              title="Intervention Intelligence"
              desc="Move from identified agricultural challenges to recommendations, interventions and measurable outcomes."
              icon={<Target className="w-6 h-6" />}
              imageSrc="/intervention_intelligence.jpg"
            />
          </div>
        </div>
      </section>

      {/* 10. How AgriLens Works */}
      <section id="how-it-works" className="py-24 bg-white border-y border-emerald-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-center mb-16 text-slate-900">From Data to Decision</h2>
          
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-emerald-200 -translate-y-1/2 hidden lg:block"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <WorkStage num="01" title="Data" desc="Agricultural and geospatial information." />
              <WorkStage num="02" title="Intelligence" desc="Analyze patterns, risks and opportunities." />
              <WorkStage num="03" title="Priority" desc="Identify areas requiring attention." />
              <WorkStage num="04" title="Action" desc="Recommend and track interventions." isLast />
            </div>
          </div>
        </div>
      </section>

      {/* 11. Signature Message - Rwanda Map Intelligence Banner */}
      <RwandaSignatureMapBanner />

      {/* 12. Final Call to Action */}
      <section className="py-24 bg-[#f4f8f5]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold mb-6 text-slate-900">Better agricultural decisions start with better intelligence.</h2>
          <p className="text-lg text-slate-600 mb-10 leading-relaxed">
            Explore agricultural patterns, priority areas and evidence-driven intelligence for Rwanda without creating an account.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/public-portal" className="inline-flex items-center bg-[#14532d] hover:bg-[#166534] text-white px-8 py-4 rounded-xl font-bold transition-all shadow-xl shadow-emerald-950/25 group cursor-pointer text-sm">
              Access the Platform <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="inline-flex items-center bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-950 px-6 py-4 rounded-xl font-bold transition-all shadow-sm cursor-pointer text-sm">
              Staff Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* 13. Footer - Deep Forest Green Night */}
      <footer className="bg-[#082214] text-white border-t border-emerald-950 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            <div className="md:col-span-1">
              <div className="font-bold text-xl tracking-tight text-white mb-4 flex items-center gap-2">
                <img src="/logo.png?v=2" alt="AgriLens Logo" className="w-5 h-5 object-contain" /> AgriLens <span className="font-light text-emerald-400">Rwanda</span>
              </div>
              <p className="text-sm text-emerald-100/70 leading-relaxed">Data-driven agricultural intelligence for better decisions.</p>
            </div>
            
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4 text-emerald-300">Platform</h4>
              <ul className="space-y-3 text-sm text-emerald-100/70">
                <li><Link to="/public-portal" className="text-emerald-300 font-bold hover:text-white transition-colors">Public Intelligence Portal</Link></li>
                <li><Link to="/admin/map" className="hover:text-emerald-300 transition-colors">Intelligence Map</Link></li>
                <li><Link to="/admin/dashboard" className="hover:text-emerald-300 transition-colors">Dashboard</Link></li>
                <li><Link to="/login" className="hover:text-emerald-300 transition-colors">Staff Sign In</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4 text-emerald-300">About</h4>
              <ul className="space-y-3 text-sm text-emerald-100/70">
                <li><a href="#intelligence" className="hover:text-emerald-300 transition-colors">Intelligence</a></li>
                <li><a href="#how-it-works" className="hover:text-emerald-300 transition-colors">How It Works</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-emerald-900/60 pt-8 text-sm text-emerald-200/60 text-center md:text-left flex flex-col md:flex-row justify-between items-center">
            <p>© 2026 AgriLens Rwanda. All rights reserved.</p>
            <p className="mt-4 md:mt-0 text-xs">NISR Big Data Hackathon Project</p>
          </div>
        </div>
      </footer>

    </div>
  );
}

/* Helper Components */

function FlowStep({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-sm border transition-all ${active ? 'bg-[#14532d] text-white border-[#14532d] shadow-md shadow-emerald-950/20' : 'bg-white text-[#14532d] border-emerald-200 hover:border-emerald-400'}`}>
        {icon}
      </div>
      <span className={`text-sm font-bold tracking-wider uppercase ${active ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
    </div>
  );
}

function CapabilityCard({ num, title, desc, icon, imageSrc }: { num: string, title: string, desc: string, icon: React.ReactNode, imageSrc?: string }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="bg-white border border-emerald-100 rounded-xl shadow-xs hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-950/5 transition-all group cursor-pointer relative overflow-hidden flex flex-col h-full">
      <div className="h-40 w-full overflow-hidden border-b border-emerald-100 bg-gradient-to-tr from-[#0a2f1c] to-[#14532d] relative flex items-center justify-center">
        {imageSrc && !hasError ? (
          <img 
            src={imageSrc} 
            alt={title} 
            onError={() => setHasError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-emerald-200 p-4 bg-gradient-to-tr from-[#082214] via-[#0d331f] to-[#14532d]">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-1 text-emerald-300">
              {icon}
            </div>
            <span className="text-[10px] font-extrabold tracking-widest text-emerald-300 uppercase">{title}</span>
          </div>
        )}
      </div>
      <div className="p-8 flex-1 flex flex-col">
        <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-[#14532d] group-hover:bg-[#14532d] group-hover:text-white transition-colors mb-6 shadow-2xs border border-emerald-100">
          {icon}
        </div>
        <div className="text-4xl font-light text-slate-200 mb-4 group-hover:text-emerald-200 transition-colors absolute top-6 right-6 z-10 drop-shadow-sm">{num}</div>
        <h3 className="text-xl font-bold mb-3 group-hover:text-[#14532d] transition-colors text-slate-900">{title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
          {desc}
        </p>
        <div className="text-[#14532d] text-sm font-bold flex items-center mt-auto group-hover:text-emerald-700">
          Explore <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}

function WorkStage({ num, title, desc, isLast = false }: { num: string, title: string, desc: string, isLast?: boolean }) {
  return (
    <div className="relative bg-white p-6 z-10 flex flex-col items-center text-center lg:items-start lg:text-left rounded-xl border border-emerald-100/70 shadow-2xs">
      <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#14532d] font-black flex items-center justify-center mb-6 shadow-xs border border-emerald-300">
        {num}
      </div>
      <h3 className="text-xl font-bold mb-2 text-slate-900">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
      {!isLast && <div className="mt-4 lg:hidden"><ArrowRight className="w-6 h-6 text-emerald-300 transform rotate-90" /></div>}
    </div>
  );
}
