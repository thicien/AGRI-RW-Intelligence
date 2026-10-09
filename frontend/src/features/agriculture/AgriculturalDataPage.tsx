import React, { useState, useEffect } from 'react';
import { 
  Database, FileText, Search, Filter, Download, 
  CheckCircle2, AlertTriangle, FileSpreadsheet,
  Calendar, MapPin, Eye, ChevronRight, Check, Loader2, TrendingUp, BarChart3, Globe
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function AgriculturalDataPage() {
  const [activeTab, setActiveTab] = useState('statistics');

  const [kpis, setKpis] = useState({
    cultivatedArea: 0,
    harvestedArea: 0,
    totalProduction: 0,
    avgYield: 0,
    cropsCovered: 0,
    seasonsCovered: 0
  });

  const [observations, setObservations] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [seasonStats, setSeasonStats] = useState<any[]>([]);
  const [geoStats, setGeoStats] = useState<any[]>([]);
  const [matrixStats, setMatrixStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [mainTab, setMainTab] = useState('overview'); // overview, trends, seasons, geography

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const [kpiRes, obsRes, trendsRes, seasonsRes, geoRes, matrixRes] = await Promise.all([
          fetch('http://localhost:3000/api/v1/agricultural-data/kpis'),
          fetch('http://localhost:3000/api/v1/agricultural-data/observations'),
          fetch('http://localhost:3000/api/v1/agricultural-data/trends'),
          fetch('http://localhost:3000/api/v1/agricultural-data/season-comparison'),
          fetch('http://localhost:3000/api/v1/agricultural-data/geography'),
          fetch('http://localhost:3000/api/v1/agricultural-data/matrix')
        ]);
        
        const kpiData = await kpiRes.json();
        const obsData = await obsRes.json();
        const trendsData = await trendsRes.json();
        const seasonsData = await seasonsRes.json();
        const geoData = await geoRes.json();
        const matrixData = await matrixRes.json();
        
        setKpis(kpiData);
        setObservations(obsData.data || []);
        setTrends(trendsData);
        setSeasonStats(seasonsData);
        setGeoStats(geoData);
        setMatrixStats(matrixData);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRealData();
  }, []);

  // Mock Data Quality
  const dataQuality = {
    valid: 96,
    missing: 2,
    duplicates: 1,
    errors: 1
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" /> 
            Agricultural Evidence & Intelligence
          </h1>
          <p className="text-sm text-muted mt-1">
            The central evidence layer of AgriLens consolidating validated observations from PDF and XLSX datasets.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-md shadow-sm hover:bg-primary-light transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Dataset
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'CULTIVATED AREA (HA)', value: kpis.cultivatedArea },
          { label: 'HARVESTED AREA (HA)', value: kpis.harvestedArea },
          { label: 'TOTAL PRODUCTION (MT)', value: kpis.totalProduction },
          { label: 'AVERAGE YIELD (MT/HA)', value: kpis.avgYield },
          { label: 'CROPS COVERED', value: kpis.cropsCovered },
          { label: 'SEASONS COVERED', value: kpis.seasonsCovered },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-surface rounded-xl border border-border-main p-4 shadow-sm flex flex-col justify-between hover:border-primary/30 transition-colors">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">{kpi.label}</span>
            <div className="text-xl font-black text-text-main tracking-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(Number(kpi.value))}
            </div>
          </div>
        ))}
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex space-x-1 bg-surface border border-border-main p-1 rounded-xl shadow-sm">
        {[
          { id: 'overview', icon: Database, label: 'Statistical Overview' },
          { id: 'trends', icon: TrendingUp, label: 'Historical Trends' },
          { id: 'seasons', icon: BarChart3, label: 'Season Analysis' },
          { id: 'geography', icon: Globe, label: 'Geographic Breakdown' },
          { id: 'matrix', icon: FileSpreadsheet, label: 'District Crop Matrix' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMainTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
              mainTab === tab.id 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-muted hover:text-text-main hover:bg-background'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {mainTab === 'overview' && (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2">
        
        {/* Left Column: Data Coverage & Quality */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Data Coverage */}
          <div className="bg-surface rounded-xl border border-border-main p-6 shadow-sm">
            <h3 className="font-bold text-sm text-text-main uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Data Coverage
            </h3>
            <div className="space-y-3">
              {/* We hardcode the mock coverage display since it's a visual layout element */}
              {[
                { year: 2026, a: true, b: false },
                { year: 2025, a: true, b: true },
                { year: 2024, a: true, b: true },
                { year: 2023, a: true, b: true },
                { year: 2022, a: true, b: true },
              ].map((cov) => (
                <div key={cov.year} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-text-main">{cov.year}</span>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1 text-muted">
                      A: {cov.a ? <CheckCircle2 className="w-4 h-4 text-success" /> : <span className="w-4 h-4 rounded-full border border-border-main" />}
                    </span>
                    <span className="flex items-center gap-1 text-muted">
                      B: {cov.b ? <CheckCircle2 className="w-4 h-4 text-success" /> : <span className="w-4 h-4 rounded-full border border-border-main" />}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-xs font-bold text-primary hover:bg-background rounded-md border border-border-main transition-colors">
              View All Years (2014-2026)
            </button>
          </div>

          {/* Data Quality */}
          <div className="bg-surface rounded-xl border border-border-main p-6 shadow-sm">
            <h3 className="font-bold text-sm text-text-main uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" /> Data Quality
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-text-main">Valid Records</span>
                  <span className="text-success font-bold">{dataQuality.valid}%</span>
                </div>
                <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                  <div className="bg-success h-full" style={{ width: `${dataQuality.valid}%` }}></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="p-3 bg-background border border-border-main rounded text-center">
                  <div className="text-xl font-bold text-warning">{dataQuality.missing}%</div>
                  <div className="text-[10px] uppercase text-muted font-semibold mt-1">Missing</div>
                </div>
                <div className="p-3 bg-background border border-border-main rounded text-center">
                  <div className="text-xl font-bold text-danger">{dataQuality.errors}%</div>
                  <div className="text-[10px] uppercase text-muted font-semibold mt-1">Errors</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Main Data Table */}
        <div className="lg:col-span-3 space-y-6">
          
          <div className="bg-surface rounded-xl border border-border-main shadow-sm flex flex-col h-full min-h-[500px]">
            {/* Tabs & Filters */}
            <div className="p-4 border-b border-border-main flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface rounded-t-xl">
              <div className="flex gap-1 bg-background p-1 rounded-lg border border-border-main">
                <button 
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'statistics' ? 'bg-surface text-text-main shadow-sm border border-border-main' : 'text-muted hover:text-text-main'}`}
                  onClick={() => setActiveTab('statistics')}
                >
                  Agricultural Statistics
                </button>
                <button 
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'evidence' ? 'bg-surface text-text-main shadow-sm border border-border-main' : 'text-muted hover:text-text-main'}`}
                  onClick={() => setActiveTab('evidence')}
                >
                  PDF Evidence & Findings
                </button>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input 
                    type="text" 
                    placeholder="Search observations..." 
                    className="w-full pl-9 pr-4 py-1.5 text-xs bg-background border border-border-main rounded-md outline-none focus:border-primary"
                  />
                </div>
                <button className="px-3 py-1.5 bg-background border border-border-main text-text-main text-xs font-semibold rounded-md hover:bg-border-main transition-colors flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" /> Filters
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm h-full">
                <thead className="bg-background/50 text-muted text-[11px] uppercase tracking-wider font-bold border-b border-border-main">
                  <tr>
                    <th className="px-4 py-3">Year</th>
                    <th className="px-4 py-3">Season</th>
                    <th className="px-4 py-3">Geography</th>
                    <th className="px-4 py-3">Crop</th>
                    <th className="px-4 py-3 text-right">Cultivated (ha)</th>
                    <th className="px-4 py-3 text-right">Production (MT)</th>
                    <th className="px-4 py-3 text-right">Yield</th>
                    <th className="px-4 py-3 text-right">Traceability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                        Loading real observations from PostGIS database...
                      </td>
                    </tr>
                  ) : observations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted">
                        No agricultural observations found. Please ensure the ingestion engine has run.
                      </td>
                    </tr>
                  ) : (
                    observations.map((obs) => (
                      <tr key={obs.id} className="hover:bg-background transition-colors group">
                        <td className="px-4 py-3 font-semibold text-text-main">{obs.year}</td>
                        <td className="px-4 py-3 font-semibold text-text-main">{obs.season?.name || 'A'}</td>
                        <td className="px-4 py-3 text-muted flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3 h-3" /> {obs.geography}
                        </td>
                        <td className="px-4 py-3 font-semibold text-text-main">{obs.crop?.name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-right">{obs.cultivated_area_ha ? new Intl.NumberFormat('en-US').format(obs.cultivated_area_ha) : '-'}</td>
                        <td className="px-4 py-3 text-right">{obs.production_mt ? new Intl.NumberFormat('en-US').format(obs.production_mt) : '-'}</td>
                        <td className="px-4 py-3 text-right font-medium">{obs.yield_mt_ha ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(obs.yield_mt_ha) : '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <button className="text-primary hover:text-primary-light text-xs font-bold flex items-center gap-1 justify-end w-full" title={obs.source_file}>
                            <FileSpreadsheet className="w-3.5 h-3.5" /> View Source
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-border-main bg-surface rounded-b-xl flex justify-between items-center text-xs text-muted">
              <span>Showing 5 of 1,248,590 observations</span>
              <div className="flex gap-2">
                <button className="px-2 py-1 border border-border-main rounded hover:bg-background">Prev</button>
                <button className="px-2 py-1 border border-border-main rounded hover:bg-background">Next</button>
              </div>
            </div>

          </div>
        </div>
      </div>
      )}

      {mainTab === 'trends' && (
        <div className="bg-surface rounded-xl border border-border-main p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 min-h-[500px]">
          <h2 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" /> Multi-Year Production & Yield Trends
          </h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2E8B57" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2E8B57" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="year" stroke="#888" tick={{ fill: '#888' }} />
                <YAxis stroke="#888" tick={{ fill: '#888' }} tickFormatter={(val) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(val)} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1a1d24', borderColor: '#2E8B57', color: '#fff', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Area type="monotone" dataKey="production" name="Total Production (MT)" stroke="#2E8B57" fillOpacity={1} fill="url(#colorProd)" />
                <Area type="monotone" dataKey="area" name="Cultivated Area (HA)" stroke="#8884d8" fillOpacity={0.3} fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {mainTab === 'seasons' && (
        <div className="bg-surface rounded-xl border border-border-main p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 min-h-[500px]">
          <h2 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> Season A vs Season B Performance
          </h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seasonStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="season" stroke="#888" tick={{ fill: '#888' }} />
                <YAxis stroke="#888" tick={{ fill: '#888' }} tickFormatter={(val) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(val)} />
                <RechartsTooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#1a1d24', borderColor: '#2E8B57', color: '#fff', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="production" name="Total Production (MT)" fill="#2E8B57" radius={[4, 4, 0, 0]} />
                <Bar dataKey="area" name="Cultivated Area (HA)" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {mainTab === 'geography' && (
        <div className="bg-surface rounded-xl border border-border-main p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 min-h-[500px]">
          <h2 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" /> Geographic Breakdown
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {geoStats.map((geo, idx) => (
              <div key={idx} className="bg-background border border-border-main rounded-xl p-5 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-lg text-text-main">{geo.geography}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-border-main pb-2">
                    <span className="text-muted text-sm">Production</span>
                    <span className="font-bold text-text-main">{new Intl.NumberFormat('en-US').format(geo.production)} MT</span>
                  </div>
                  <div className="flex justify-between border-b border-border-main pb-2">
                    <span className="text-muted text-sm">Cultivated Area</span>
                    <span className="font-bold text-text-main">{new Intl.NumberFormat('en-US').format(geo.area)} HA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted text-sm">Avg Yield</span>
                    <span className="font-bold text-success">{new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(geo.yield)} MT/ha</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mainTab === 'matrix' && (
        <div className="bg-surface rounded-xl border border-border-main shadow-sm animate-in fade-in slide-in-from-bottom-2 flex flex-col h-[700px]">
          <div className="p-6 border-b border-border-main flex justify-between items-center">
            <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-primary" /> Cultivated area by crop type and district (Ha)
            </h2>
            <button className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-md hover:bg-primary-light transition-colors flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export Excel
            </button>
          </div>
          <div className="overflow-auto flex-1 p-0 custom-scrollbar">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#2a8b4b] text-white sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 font-bold sticky left-0 bg-[#2a8b4b] z-20 border-r border-[#3a9b5b]">District</th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Maize</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Sorghum</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Paddy rice</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Wheat</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Other cereals</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Cassava</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Sweet potato</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Irish potato</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Yams & Taro</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Banana</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Cooking banana</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Dessert banana</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Banana for beer</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Beans</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Bush bean</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Climbing bean</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Pea</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Groundnut</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Soybean</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Vegetables</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Fruits</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Fodder Crops</div></th>
                  <th className="px-3 py-3 border-r border-[#3a9b5b] hover:bg-[#3a9b5b] transition-colors"><div className="-rotate-90 origin-left translate-x-2 translate-y-8 w-4 h-24">Other crops</div></th>
                  <th className="px-4 py-3 font-bold bg-[#1a7b3b] sticky right-0 z-20">Total area (ha)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {matrixStats.map((row, idx) => (
                  <tr key={idx} className="hover:bg-background transition-colors">
                    <td className="px-4 py-2 font-bold text-text-main sticky left-0 bg-surface border-r border-border-main z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{row.district}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Maize'] ? new Intl.NumberFormat('en-US').format(row['Maize']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Sorghum'] ? new Intl.NumberFormat('en-US').format(row['Sorghum']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Paddy rice'] ? new Intl.NumberFormat('en-US').format(row['Paddy rice']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Wheat'] ? new Intl.NumberFormat('en-US').format(row['Wheat']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Other cereals'] ? new Intl.NumberFormat('en-US').format(row['Other cereals']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Cassava'] ? new Intl.NumberFormat('en-US').format(row['Cassava']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Sweet potato'] ? new Intl.NumberFormat('en-US').format(row['Sweet potato']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Irish potato'] ? new Intl.NumberFormat('en-US').format(row['Irish potato']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Yams & Taro'] ? new Intl.NumberFormat('en-US').format(row['Yams & Taro']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Banana'] ? new Intl.NumberFormat('en-US').format(row['Banana']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Cooking banana'] ? new Intl.NumberFormat('en-US').format(row['Cooking banana']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Dessert banana'] ? new Intl.NumberFormat('en-US').format(row['Dessert banana']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Banana for beer'] ? new Intl.NumberFormat('en-US').format(row['Banana for beer']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Beans'] ? new Intl.NumberFormat('en-US').format(row['Beans']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Bush bean'] ? new Intl.NumberFormat('en-US').format(row['Bush bean']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Climbing bean'] ? new Intl.NumberFormat('en-US').format(row['Climbing bean']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Pea'] ? new Intl.NumberFormat('en-US').format(row['Pea']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Groundnut'] ? new Intl.NumberFormat('en-US').format(row['Groundnut']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Soybean'] ? new Intl.NumberFormat('en-US').format(row['Soybean']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Vegetables'] ? new Intl.NumberFormat('en-US').format(row['Vegetables']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Fruits'] ? new Intl.NumberFormat('en-US').format(row['Fruits']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Fodder Crops'] ? new Intl.NumberFormat('en-US').format(row['Fodder Crops']) : '-'}</td>
                    <td className="px-3 py-2 text-right border-r border-border-main hover:bg-border-main/20">{row['Other crops'] ? new Intl.NumberFormat('en-US').format(row['Other crops']) : '-'}</td>
                    <td className="px-4 py-2 font-bold text-text-main text-right sticky right-0 bg-surface shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      {new Intl.NumberFormat('en-US').format(row.totalArea)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
