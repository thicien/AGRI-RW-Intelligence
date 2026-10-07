import { Link } from 'react-router-dom';
import { 
  BarChart3, Map, Network, Target, ChevronRight, 
  ArrowRight, Activity, Database, CheckCircle2, ShieldAlert
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

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
    <div className="min-h-screen bg-background font-sans text-text-main selection:bg-primary-soft selection:text-primary">
      
      {/* 2. Navigation Bar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-border-main py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white">
              <LeafIcon className="w-5 h-5" />
            </div>
            <div className="font-bold text-xl tracking-tight text-primary">
              AgriLens <span className="font-light text-primary-light">RWANDA</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-main">
            <a href="#platform" className="hover:text-primary transition-colors">Platform</a>
            <a href="#intelligence" className="hover:text-primary transition-colors">Intelligence</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-text-main hover:text-primary transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link to="/app/dashboard" className="bg-primary hover:bg-primary-light text-white px-5 py-2 rounded text-sm font-medium transition-colors shadow-sm">
              Access Platform
            </Link>
          </div>
        </div>
      </nav>

      {/* 3. Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: Message */}
          <div className="z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-block px-3 py-1 mb-6 border border-primary/20 bg-primary-soft/50 text-primary text-[11px] font-bold tracking-widest uppercase rounded">
              Rwanda Agricultural Intelligence
            </div>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.15] tracking-tight mb-6 text-text-main">
              Agricultural <span className="text-primary">Intelligence</span> for Better Decisions
            </h1>
            <p className="text-lg text-muted mb-8 max-w-xl leading-relaxed">
              Transform agricultural data into spatial intelligence, evidence-based priorities and actionable interventions for a more informed agricultural future in Rwanda.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <Link to="/app/map" className="bg-primary hover:bg-primary-light text-white px-6 py-3 rounded font-medium flex items-center transition-colors shadow-sm group">
                Explore Intelligence <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="bg-white border border-border-main hover:bg-background text-text-main px-6 py-3 rounded font-medium transition-colors shadow-sm">
                Sign In
              </Link>
            </div>
            
            {/* Bottom Statement */}
            <div className="flex items-center gap-3 text-xs font-semibold text-muted uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Database className="w-4 h-4 text-primary" /> Data-driven</span>
              <span className="w-1 h-1 rounded-full bg-border-main"></span>
              <span className="flex items-center gap-1.5"><Map className="w-4 h-4 text-agriculture" /> Spatial</span>
              <span className="w-1 h-1 rounded-full bg-border-main"></span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary-light" /> Evidence-based</span>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative lg:h-[600px] w-full animate-in fade-in zoom-in-95 duration-1000 delay-200">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-soft to-agriculture-soft rounded-2xl border border-border-main overflow-hidden shadow-2xl">
              {/* Replace the src below with one of the provided images, e.g., /assets/rwanda-map.png */}
              <img src="https://images.unsplash.com/photo-1593352216447-068305e54d8f?auto=format&fit=crop&q=80" alt="Rwanda Agriculture Intelligence" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />
              
              {/* Fake UI Overlays to mimic intelligence map */}
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-danger/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-agriculture/20 rounded-full blur-3xl animate-pulse delay-700"></div>
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm">
                {/* Information Card */}
                <div className="bg-white/95 backdrop-blur shadow-xl border border-border-main rounded-xl p-5 transform hover:-translate-y-1 transition-transform">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">AgriLens Intelligence</div>
                  <h3 className="font-bold text-lg mb-2">Agricultural Priority Analysis</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-primary-soft text-primary text-xs px-2 py-1 rounded font-medium flex items-center"><Map className="w-3 h-3 mr-1"/> Spatial Intelligence</span>
                  </div>
                  <p className="text-sm text-muted">Identifying areas requiring attention based on derived risk indicators and real-time agricultural data.</p>
                  <div className="mt-4 pt-4 border-t border-border-main flex justify-between items-center">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-danger border-2 border-white"></div>
                      <div className="w-6 h-6 rounded-full bg-warning border-2 border-white"></div>
                      <div className="w-6 h-6 rounded-full bg-agriculture border-2 border-white"></div>
                    </div>
                    <span className="text-xs font-semibold text-primary">Live Scan Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. From Data to Action */}
      <section id="platform" className="py-24 bg-white border-y border-border-main">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="text-xs font-bold tracking-widest text-primary uppercase mb-3">The AgriLens Approach</div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">From Agricultural Data to Actionable Intelligence</h2>
          <p className="text-lg text-muted max-w-3xl mx-auto mb-16">
            Agricultural data can tell us what is happening. AgriLens helps transform that information into where attention is needed, why it matters, and what action should follow.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <FlowStep icon={<Database className="w-6 h-6"/>} label="DATA" />
            <ChevronRight className="w-5 h-5 text-border-main hidden md:block" />
            <FlowStep icon={<BarChart3 className="w-6 h-6"/>} label="ANALYSIS" />
            <ChevronRight className="w-5 h-5 text-border-main hidden md:block" />
            <FlowStep icon={<Network className="w-6 h-6"/>} label="INTELLIGENCE" />
            <ChevronRight className="w-5 h-5 text-border-main hidden md:block" />
            <FlowStep icon={<ShieldAlert className="w-6 h-6"/>} label="PRIORITY" />
            <ChevronRight className="w-5 h-5 text-border-main hidden md:block" />
            <FlowStep icon={<Target className="w-6 h-6"/>} label="ACTION" active />
          </div>
        </div>
      </section>

      {/* 8. Four Intelligence Capabilities */}
      <section id="intelligence" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CapabilityCard 
              num="01"
              title="Productivity Intelligence"
              desc="Understand crop production, yield patterns and agricultural productivity across Rwanda."
              icon={<BarChart3 className="w-6 h-6" />}
              imageSrc="https://images.unsplash.com/photo-1593352216447-068305e54d8f?auto=format&fit=crop&q=80"
            />
            <CapabilityCard 
              num="02"
              title="Spatial Intelligence"
              desc="Discover where agricultural problems, risks and opportunities are geographically concentrated."
              icon={<Map className="w-6 h-6" />}
              imageSrc="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80"
            />
            <CapabilityCard 
              num="03"
              title="AI & Evidence"
              desc="Use predictive models while maintaining visibility into the evidence supporting each insight."
              icon={<Network className="w-6 h-6" />}
              imageSrc="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80"
            />
            <CapabilityCard 
              num="04"
              title="Intervention Intelligence"
              desc="Move from identified agricultural challenges to recommendations, interventions and measurable outcomes."
              icon={<Target className="w-6 h-6" />}
              imageSrc="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80"
            />
          </div>
        </div>
      </section>

      {/* 10. How AgriLens Works */}
      <section id="how-it-works" className="py-24 bg-white border-y border-border-main overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">From Data to Decision</h2>
          
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border-main -translate-y-1/2 hidden lg:block"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <WorkStage num="01" title="Data" desc="Agricultural and geospatial information." />
              <WorkStage num="02" title="Intelligence" desc="Analyze patterns, risks and opportunities." />
              <WorkStage num="03" title="Priority" desc="Identify areas requiring attention." />
              <WorkStage num="04" title="Action" desc="Recommend and track interventions." isLast />
            </div>
          </div>
        </div>
      </section>

      {/* 11. Signature Message */}
      <section className="py-32 bg-primary text-white text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-8">
            Know where the problem is.<br/>
            Understand why it matters.<br/>
            Decide what to do next.
          </h2>
          <p className="text-xl text-primary-soft max-w-2xl mx-auto font-medium">
            AgriLens turns agricultural information into evidence-based intelligence for better decisions.
          </p>
        </div>
      </section>

      {/* 12. Final Call to Action */}
      <section className="py-24 bg-background">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Better agricultural decisions start with better intelligence.</h2>
          <p className="text-lg text-muted mb-10">
            Explore agricultural patterns, priority areas and evidence-driven intelligence for Rwanda.
          </p>
          <Link to="/app/map" className="inline-flex items-center bg-primary hover:bg-primary-light text-white px-8 py-4 rounded font-semibold transition-colors shadow-lg group">
            Explore Intelligence <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* 13. Footer */}
      <footer className="bg-surface border-t border-border-main pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            <div className="md:col-span-1">
              <div className="font-bold text-xl tracking-tight text-primary mb-4 flex items-center gap-2">
                <LeafIcon className="w-5 h-5" /> AgriLens <span className="font-light">Rwanda</span>
              </div>
              <p className="text-sm text-muted">Data-driven agricultural intelligence for better decisions.</p>
            </div>
            
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-3 text-sm text-muted">
                <li><Link to="/app/map" className="hover:text-primary transition-colors">Intelligence Map</Link></li>
                <li><Link to="/app/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                <li><Link to="/login" className="hover:text-primary transition-colors">Sign In</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4">About</h4>
              <ul className="space-y-3 text-sm text-muted">
                <li><a href="#intelligence" className="hover:text-primary transition-colors">Intelligence</a></li>
                <li><a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border-main pt-8 text-sm text-muted text-center md:text-left flex flex-col md:flex-row justify-between items-center">
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
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-sm border ${active ? 'bg-primary text-white border-primary' : 'bg-surface text-primary border-border-main'}`}>
        {icon}
      </div>
      <span className={`text-sm font-bold tracking-wider uppercase ${active ? 'text-text-main' : 'text-muted'}`}>{label}</span>
    </div>
  );
}

function CapabilityCard({ num, title, desc, icon, imageSrc }: { num: string, title: string, desc: string, icon: React.ReactNode, imageSrc?: string }) {
  return (
    <div className="bg-white border border-border-main rounded-xl shadow-sm hover:-translate-y-1 transition-transform group cursor-pointer relative overflow-hidden flex flex-col h-full">
      {imageSrc && (
        <div className="h-40 w-full overflow-hidden border-b border-border-main">
          <img src={imageSrc} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <div className="p-8 flex-1 flex flex-col">
        <div className="w-12 h-12 rounded bg-background flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors mb-6 shadow-sm border border-border-main">
          {icon}
        </div>
        <div className="text-4xl font-light text-border-main mb-4 group-hover:text-primary-soft transition-colors absolute top-6 right-6 z-10 drop-shadow-md">{num}</div>
        <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-muted text-sm leading-relaxed mb-6 flex-1">
          {desc}
        </p>
        <div className="text-primary text-sm font-semibold flex items-center mt-auto">
          Explore <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}

function WorkStage({ num, title, desc, isLast = false }: { num: string, title: string, desc: string, isLast?: boolean }) {
  return (
    <div className="relative bg-white p-6 z-10 flex flex-col items-center text-center lg:items-start lg:text-left">
      <div className="w-12 h-12 rounded-full bg-primary-soft text-primary font-bold flex items-center justify-center mb-6 shadow-sm border border-primary/20">
        {num}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted text-sm">{desc}</p>
      {!isLast && <div className="mt-4 lg:hidden"><ArrowRight className="w-6 h-6 text-border-main transform rotate-90" /></div>}
    </div>
  );
}

function LeafIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>;
}
