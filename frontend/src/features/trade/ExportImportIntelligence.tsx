import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../config/api';
import { 
  Globe, Plane, Ship, TrendingUp, TrendingDown, DollarSign, Scale, 
  ShieldAlert, Award, FileText, CheckCircle2, AlertTriangle, Filter, 
  Search, Download, RefreshCw, Layers, Compass, ArrowUpRight, 
  ArrowDownRight, Sparkles, Building2, MapPin, Package, Check,
  BarChart3, Info, ExternalLink, Calendar, Truck
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  CartesianGrid, Cell, AreaChart, Area, LineChart, Line, Legend, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie
} from 'recharts';

export default function ExportImportIntelligence() {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'districts' | 'destinations' | 'screening' | 'dossier'>('overview');
  const [selectedSeason, setSelectedSeason] = useState('2026B');
  const [selectedDistrict, setSelectedDistrict] = useState('Nyagatare');
  const [selectedProduct, setSelectedProduct] = useState('Hass Avocado');
  const [selectedDestination, setSelectedDestination] = useState('Netherlands');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  // Analytical Data States
  const [summaryData, setSummaryData] = useState<any>({ metrics: {}, top_export_product: {}, safeguard_notice: {} });
  const [productsTrade, setProductsTrade] = useState<any[]>([]);
  const [districtsData, setDistrictsData] = useState<any[]>([]);
  const [availableSeasons, setAvailableSeasons] = useState<any[]>([]);
  const [screeningData, setScreeningData] = useState<any[]>([]);
  const [dossierData, setDossierData] = useState<any>(null);

  const getApiBase = () => apiUrl('trade');

  // 1. Load Seasons Catalog Once on Mount
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const res = await fetch(`${getApiBase()}/seasons`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setAvailableSeasons(list);
          }
        }
      } catch (e) {
        console.warn('Error loading trade seasons:', e);
      }
    };
    fetchSeasons();
  }, []);

  // 2. Fetch Module Data when season or selected parameters change
  const fetchTradeData = async () => {
    setLoading(true);
    try {
      const apiBase = getApiBase();

      const [sumRes, prodRes, distRes, screenRes, dosRes] = await Promise.all([
        fetch(`${apiBase}/summary?season=${selectedSeason}`).catch(() => null),
        fetch(`${apiBase}/products-trade?season=${selectedSeason}`).catch(() => null),
        fetch(`${apiBase}/districts?season=${selectedSeason}`).catch(() => null),
        fetch(`${apiBase}/opportunity-screening`).catch(() => null),
        fetch(`${apiBase}/commercial-dossier?product=${encodeURIComponent(selectedProduct)}&destination=${encodeURIComponent(selectedDestination)}`).catch(() => null),
      ]);

      if (sumRes && sumRes.ok) setSummaryData(await sumRes.json());
      if (prodRes && prodRes.ok) setProductsTrade(await prodRes.json());
      if (distRes && distRes.ok) setDistrictsData(await distRes.json());
      if (screenRes && screenRes.ok) setScreeningData(await screenRes.json());
      if (dosRes && dosRes.ok) setDossierData(await dosRes.json());
    } catch (err) {
      console.error('Failed to load trade intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTradeData();
  }, [selectedSeason, selectedProduct, selectedDestination]);

  // Derived filtered districts
  const filteredDistricts = districtsData.filter((d: any) => {
    const matchesSearch = d.district_name.toLowerCase().includes(searchDistrict.toLowerCase()) ||
                          d.province_name.toLowerCase().includes(searchDistrict.toLowerCase());
    const matchesTier = selectedTierFilter === 'ALL' || d.export_tier === selectedTierFilter;
    return matchesSearch && matchesTier;
  });

  const metrics = summaryData.metrics || {};
  const topProduct = summaryData.top_export_product || {};

  // Export CSV Handler
  const exportToCsv = () => {
    if (!productsTrade || productsTrade.length === 0) return;
    const headers = [
      'Product', 'Category', 'HS Code', 'Season', 'Production (MT)', 'Export Volume (MT)',
      'Export Value (USD)', 'Unit Value (USD/MT)', 'Import Volume (MT)', 'Import Value (USD)',
      'Net Trade Status', '5Y Growth (%)', 'Performance'
    ];
    const rows = productsTrade.map(p => [
      p.product_name, p.product_category, p.hs_code, p.season_code,
      p.domestic_production_mt, p.export_quantity_mt, p.export_value_usd,
      p.unit_value_usd_per_mt, p.import_quantity_mt, p.import_value_usd,
      p.net_trade_status, p.growth_trend_pct, p.performance_status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agrilens_trade_intelligence_${selectedSeason}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trade Balance Comparison Chart Data
  const tradeBalanceBarData = [
    { category: 'Exports', value: metrics.total_export_value_usd || 193554790, fill: '#10b981' },
    { category: 'Imports', value: metrics.total_import_value_usd || 99496720, fill: '#ef4444' },
    { category: 'Net Trade Surplus', value: metrics.net_trade_balance_usd || 94058070, fill: '#3b82f6' },
  ];

  // Top Export Commodities for Horizontal Bar
  const topExportsChartData = productsTrade
    .filter(p => p.export_value_usd > 0)
    .slice(0, 6)
    .map(p => ({
      name: p.product_name,
      value_usd: p.export_value_usd,
      volume_mt: p.export_quantity_mt,
      unit_val: p.unit_value_usd_per_mt,
    }));

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto custom-scrollbar">
      
      {/* 1. Header with Title & Season Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">Module 5 Intelligence</span>
            <span>NAEB • MINICOM • NISR Trade & Market Opportunities</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Globe className="w-8 h-8 text-emerald-400 shrink-0" />
            Export Market Opportunities & Trade Intelligence
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Evidence-based trade analytics mapping Rwandan agricultural export trends, domestic supply vs. trade flows, product-market opportunity rankings, and commercial pre-assessments across all 30 districts and 38 seasons.
          </p>
        </div>

        {/* Season Selector & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 shadow-inner">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-300">Season:</span>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="bg-transparent text-xs font-bold text-emerald-400 focus:outline-none cursor-pointer"
            >
              {availableSeasons.map((s) => (
                <option key={s.season_code} value={s.season_code} className="bg-slate-900 text-slate-200">
                  {s.season_code} ({s.year} {s.season_name})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchTradeData}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Refresh Trade Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={exportToCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 transition-all"
            title="Export CSV Dataset"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. MANDATORY CRITICAL SAFEGUARD BANNER */}
      <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 backdrop-blur-sm flex items-start gap-3.5 shadow-lg shadow-amber-950/20">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-amber-300 uppercase tracking-wide flex items-center gap-2">
            CRITICAL SAFEGUARD: COMMERCIAL FEASIBILITY & MARKET-ACCESS EVIDENCE
          </h4>
          <p className="text-amber-200/90 leading-relaxed">
            <strong>Strong production or export growth does not automatically establish profitability or future demand.</strong> The system accounts for missing trade data, quality requirements, destination market phytosanitary rules, transport costs, and international competitor behavior. <strong>Any export-opportunity score is a pre-screening decision aid, not a guarantee of commercial success.</strong>
          </p>
          <div className="flex items-center gap-4 text-[11px] text-amber-300/80 pt-1 font-medium">
            <span>• NAEB / MINICOM Trade Statistics</span>
            <span>• Destination SPS & MRL Compliance Check Required</span>
            <span>• Independent buyer contract verification advised</span>
          </div>
        </div>
      </div>

      {/* 3. Top High-Level Trade KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Agricultural Export Value */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase tracking-wider">Agri Export Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              ${(Number(metrics.total_export_value_usd || 193554790) / 1000000).toFixed(1)}M
            </span>
            <span className="text-xs text-emerald-400 font-semibold">USD</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Export Volume:</span>
            <span className="font-semibold text-slate-200">
              {Number(metrics.total_export_quantity_mt || 84853).toLocaleString()} MT
            </span>
          </div>
        </div>

        {/* KPI 2: Agri Import Value & Substitution Demand */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur shadow-sm relative overflow-hidden group hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase tracking-wider">Agri Import Value</span>
            <Scale className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400 tracking-tight">
              ${(Number(metrics.total_import_value_usd || 99496720) / 1000000).toFixed(1)}M
            </span>
            <span className="text-xs text-slate-400 font-semibold">USD</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Net Trade Balance:</span>
            <span className="font-semibold text-emerald-400">
              +${(Number(metrics.net_trade_balance_usd || 94058070) / 1000000).toFixed(1)}M
            </span>
          </div>
        </div>

        {/* KPI 3: National Exportable Surplus */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur shadow-sm relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase tracking-wider">Exportable District Surplus</span>
            <Ship className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {Number(metrics.total_exportable_surplus_mt || 326700).toLocaleString()}
            </span>
            <span className="text-xs text-blue-400 font-semibold">MT Surplus</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Market Surplus:</span>
            <span className="font-semibold text-slate-200">
              {Number(metrics.total_market_surplus_mt || 1166800).toLocaleString()} MT
            </span>
          </div>
        </div>

        {/* KPI 4: Global Export Readiness Hubs */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur shadow-sm relative overflow-hidden group hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium uppercase tracking-wider">Tier 1 Export Hubs</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400 tracking-tight">
              {metrics.tier1_global_hubs_count || 17}
            </span>
            <span className="text-xs text-slate-400 font-semibold">Districts</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Avg Readiness Score:</span>
            <span className="font-semibold text-emerald-400">
              {metrics.national_avg_export_readiness || 86.4} / 100
            </span>
          </div>
        </div>

      </div>

      {/* 4. Tab Navigation Header */}
      <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto custom-scrollbar">
        {[
          { id: 'overview', label: 'Trade Balance & Flows', icon: Scale },
          { id: 'products', label: 'Commodity Trends & Seasonality', icon: TrendingUp },
          { id: 'districts', label: 'District Export Supply & Hubs', icon: Building2 },
          { id: 'destinations', label: 'Destination Markets & Access', icon: Globe },
          { id: 'screening', label: 'Product-Market Screening (MCDA)', icon: Award },
          { id: 'dossier', label: 'Commercial Pre-Assessment Dossier', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-emerald-400 text-emerald-400 bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 5. TAB 1: Trade Balance & Flows */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* National Agricultural Trade Balance Chart */}
            <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-400" />
                    Agricultural Trade Balance: Exports vs. Imports ({selectedSeason})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Total values in USD comparing official export revenues with major food import expenditure.
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tradeBalanceBarData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(val: any) => [`$${Number(val).toLocaleString()} USD`]}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {tradeBalanceBarData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-800">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Net Exporter Commodities:</span>
                  <div className="font-bold text-emerald-400 text-sm">
                    {metrics.net_exporter_commodities_count || 8} Commodities
                  </div>
                  <span className="text-[10px] text-slate-500">Coffee, Tea, Avocado, Chili, Beans, Potato</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Import Substitution Priority:</span>
                  <div className="font-bold text-rose-400 text-sm">
                    {metrics.import_substitution_commodities_count || 2} Key Deficits
                  </div>
                  <span className="text-[10px] text-slate-500">Wheat Flour, Milled Rice, Cooking Oil</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Average Trade Growth:</span>
                  <div className="font-bold text-blue-400 text-sm">
                    +{metrics.avg_export_growth_pct || 11.2}% YoY
                  </div>
                  <span className="text-[10px] text-slate-500">Strongest in Horticulture (Avocado +24.5%)</span>
                </div>
              </div>
            </div>

            {/* Top Export Earner Spotlight Card */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  <Award className="w-4 h-4" />
                  <span>Leading Export Revenue Earner</span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  {topProduct.name || 'Tea'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Primary foreign exchange earner in {selectedSeason} with high international brand equity and steady demand.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Export Revenue:</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    ${Number(topProduct.value_usd).toLocaleString()} USD
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Export Volume:</span>
                  <span className="font-semibold text-white">
                    {Number(topProduct.volume_mt).toLocaleString()} MT
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Unit Price Realized:</span>
                  <span className="font-semibold text-white">
                    ${Number(topProduct.unit_value_usd_per_mt).toLocaleString()} / MT
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200">
                <div className="font-semibold text-emerald-300">Strategic Target:</div>
                <p className="text-[11px] text-slate-300 mt-1">
                  MINAGRI & NAEB aim to double specialty non-traditional horticulture exports (Hass Avocado, French Beans, Chilies) to $150M+ by 2029.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 6. TAB 2: Commodity Trends & Seasonality */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          
          {/* Top 6 Commodities Revenue Chart */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Top Export Commodities by Revenue (Season {selectedSeason})
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topExportsChartData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={120} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()} USD`, 'Export Revenue']}
                  />
                  <Bar dataKey="value_usd" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Full Commodity Master Table */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
            <div className="p-4 bg-slate-950 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Strategic Commodity Trade Matrix ({productsTrade.length} Commodities)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3 font-semibold">Product Name</th>
                    <th className="py-3 px-3 font-semibold">Category</th>
                    <th className="py-3 px-3 font-semibold">HS Code</th>
                    <th className="py-3 px-3 font-semibold">Domestic Supply</th>
                    <th className="py-3 px-3 font-semibold">Export Qty</th>
                    <th className="py-3 px-3 font-semibold">Export Value</th>
                    <th className="py-3 px-3 font-semibold">Unit Price ($/MT)</th>
                    <th className="py-3 px-3 font-semibold">5Y Growth</th>
                    <th className="py-3 px-3 font-semibold">Trade Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {productsTrade.map((p: any) => (
                    <tr
                      key={p.product_name}
                      onClick={() => {
                        setSelectedProduct(p.product_name);
                        setActiveTab('dossier');
                      }}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-white">{p.product_name}</td>
                      <td className="py-2.5 px-3 text-slate-400">{p.product_category.replace(/_/g, ' ')}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{p.hs_code}</td>
                      <td className="py-2.5 px-3 font-semibold">{Number(p.domestic_production_mt).toLocaleString()} MT</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-400">{Number(p.export_quantity_mt).toLocaleString()} MT</td>
                      <td className="py-2.5 px-3 font-bold text-white">${Number(p.export_value_usd).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono text-cyan-400">${Number(p.unit_value_usd_per_mt).toLocaleString()}</td>
                      <td className="py-2.5 px-3">
                        <span className={`font-bold ${p.growth_trend_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {p.growth_trend_pct > 0 ? `+${p.growth_trend_pct}%` : `${p.growth_trend_pct}%`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.net_trade_status === 'NET_EXPORTER'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {p.net_trade_status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 7. TAB 3: District Export Supply & Hubs */}
      {activeTab === 'districts' && (
        <div className="space-y-6">
          
          {/* Controls: Search and Tier Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search district, province, or crop..."
                value={searchDistrict}
                onChange={(e) => setSearchDistrict(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Export Tier:</span>
              <select
                value={selectedTierFilter}
                onChange={(e) => setSelectedTierFilter(e.target.value)}
                className="bg-slate-950 text-emerald-400 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">All Tiers (30 Districts)</option>
                <option value="TIER_1_GLOBAL_EXPORT_HUB">Tier 1: Global Export Hubs</option>
                <option value="TIER_2_REGIONAL_EXPORTER">Tier 2: Regional Cross-Border Exporters</option>
              </select>
            </div>
          </div>

          {/* District Export League Table */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
            <div className="p-4 bg-slate-950 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                District Export Readiness & Logistics Access ({filteredDistricts.length} Districts)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3 font-semibold">Rank & District</th>
                    <th className="py-3 px-3 font-semibold">Province</th>
                    <th className="py-3 px-3 font-semibold">Export Crops</th>
                    <th className="py-3 px-3 font-semibold">Exportable Surplus</th>
                    <th className="py-3 px-3 font-semibold">Nearest Exit Hub</th>
                    <th className="py-3 px-3 font-semibold">Dist. to Exit</th>
                    <th className="py-3 px-3 font-semibold">Readiness Score</th>
                    <th className="py-3 px-3 font-semibold">Export Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredDistricts.map((d: any, index: number) => (
                    <tr
                      key={d.district_name}
                      onClick={() => {
                        setSelectedDistrict(d.district_name);
                        setActiveTab('dossier');
                      }}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-emerald-400 font-mono">
                          {index + 1}
                        </span>
                        <span>{d.district_name}</span>
                      </td>
                      <td className="py-2.5 px-3">{d.province_name}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {d.primary_export_crops.slice(0, 3).map((c: string) => (
                            <span key={c} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-emerald-400">
                        {Number(d.estimated_exportable_volume_mt).toLocaleString()} MT
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{d.nearest_exit_hub}</td>
                      <td className="py-2.5 px-3 font-mono">{d.distance_to_exit_km} km</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">{d.export_readiness_score}</span>
                          <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-400 h-full rounded-full"
                              style={{ width: `${Math.min(d.export_readiness_score, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.export_tier === 'TIER_1_GLOBAL_EXPORT_HUB'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {d.export_tier === 'TIER_1_GLOBAL_EXPORT_HUB' ? 'Tier 1 Global Hub' : 'Tier 2 Regional Exporter'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 8. TAB 4: Destination Markets & Access Requirements */}
      {activeTab === 'destinations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Market Card 1: European Union */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  EUROPEAN UNION
                </span>
                <span className="text-xs text-slate-400">Netherlands, UK, Germany, France</span>
              </div>
              <h3 className="text-base font-bold text-white">High-Value Fresh Horticulture & Specialty Coffee</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Primary off-taker for Hass avocado, fine French beans, passion fruit, bird-eye chili, and high-cupping Bourbon coffee.
              </p>
              <div className="text-xs space-y-1.5 pt-2 border-t border-slate-800">
                <div><strong className="text-slate-400">Tariff Regime:</strong> <span className="text-emerald-400">0% Duty (Everything But Arms / EPA)</span></div>
                <div><strong className="text-slate-400">Key Standards:</strong> GlobalGAP, EU MRL (Pesticide limits), False Codling Moth protocol</div>
                <div><strong className="text-slate-400">Logistics Route:</strong> Direct belly-hold & cargo air freight via Kigali Airport to Amsterdam/Brussels</div>
              </div>
            </div>

            {/* Market Card 2: Middle East / GCC */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  MIDDLE EAST (GCC)
                </span>
                <span className="text-xs text-slate-400">UAE, Saudi Arabia, Qatar</span>
              </div>
              <h3 className="text-base font-bold text-white">Fresh Fruits, Vegetables & Specialty Tea</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Fast-expanding premium market for avocados, pineapples, chili, and halal meat products with 5.5-hour direct flight links.
              </p>
              <div className="text-xs space-y-1.5 pt-2 border-t border-slate-800">
                <div><strong className="text-slate-400">Tariff Regime:</strong> Preferential Bilateral Trade Agreements</div>
                <div><strong className="text-slate-400">Key Standards:</strong> Halal Certification, GSO Standards, Pre-export Phytosanitary Inspection</div>
                <div><strong className="text-slate-400">Logistics Route:</strong> RwandAir daily direct flights Kigali to Dubai & Doha</div>
              </div>
            </div>

            {/* Market Card 3: Regional EAC & COMESA */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  REGIONAL EAC / COMESA
                </span>
                <span className="text-xs text-slate-400">DRC (Goma/Bukavu), Uganda, Kenya</span>
              </div>
              <h3 className="text-base font-bold text-white">Cross-Border Food Staples & Processed Flours</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Immense cross-border cash trade volume for Irish potato, fortified cassava flour, maize flour, vegetables, and livestock.
              </p>
              <div className="text-xs space-y-1.5 pt-2 border-t border-slate-800">
                <div><strong className="text-slate-400">Tariff Regime:</strong> 0% Duty under COMESA Simplified Trade Regime (STR)</div>
                <div><strong className="text-slate-400">Key Standards:</strong> RSB Quality Mark, Regional Border Phytosanitary Certificate</div>
                <div><strong className="text-slate-400">Logistics Route:</strong> Road corridors via Rubavu/Goma, Rusizi/Bukavu, and Gatuna</div>
              </div>
            </div>

            {/* Market Card 4: Asia / Far East */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  ASIA & FAR EAST
                </span>
                <span className="text-xs text-slate-400">China, Japan, Pakistan</span>
              </div>
              <h3 className="text-base font-bold text-white">Black CTC Tea, Dried Chili & Specialty Coffee</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pakistan absorbs over 42% of black tea via Mombasa. China protocol enables duty-free chili; Japan pays high specialty coffee premiums.
              </p>
              <div className="text-xs space-y-1.5 pt-2 border-t border-slate-800">
                <div><strong className="text-slate-400">Tariff Regime:</strong> Bilateral GACC protocol (China), 0% tariff for 98% Rwandan tariff lines</div>
                <div><strong className="text-slate-400">Key Standards:</strong> GACC facility registration, strict zero fruit-fly tolerance</div>
                <div><strong className="text-slate-400">Logistics Route:</strong> Sea freight from Mombasa/Dar es Salaam to Guangzhou & Karachi</div>
              </div>
            </div>

            {/* Market Card 5: North America */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  NORTH AMERICA
                </span>
                <span className="text-xs text-slate-400">United States, Canada</span>
              </div>
              <h3 className="text-base font-bold text-white">Specialty Arabica Coffee & Macadamia Nuts</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Direct trade buyers paying $7,000-$9,500/MT for micro-lots scoring 87+ points. Emerging market for certified organic macadamia.
              </p>
              <div className="text-xs space-y-1.5 pt-2 border-t border-slate-800">
                <div><strong className="text-slate-400">Tariff Regime:</strong> 0% Duty under African Growth and Opportunity Act (AGOA)</div>
                <div><strong className="text-slate-400">Key Standards:</strong> FDA Bioterrorism Act facility registration, USDA Organic</div>
                <div><strong className="text-slate-400">Logistics Route:</strong> Ocean container via Northern Corridor to US East Coast roasters</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 9. TAB 5: Product-Market Screening (MCDA 0-100) */}
      {activeTab === 'screening' && (
        <div className="space-y-6">
          
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
            <div className="p-4 bg-slate-950 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Multi-Criteria Product-Market Export Opportunity Rankings ({screeningData.length} Evaluated Pairs)
              </h3>
              <p className="text-xs text-slate-400">
                Composite opportunity index (0–100) synthesizing production availability, global market demand, cold-chain logistics, and standards readiness.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3 font-semibold">Rank & Pair</th>
                    <th className="py-3 px-3 font-semibold">Destination</th>
                    <th className="py-3 px-3 font-semibold">Supply Score</th>
                    <th className="py-3 px-3 font-semibold">Demand Score</th>
                    <th className="py-3 px-3 font-semibold">Logistics Score</th>
                    <th className="py-3 px-3 font-semibold">Standards Score</th>
                    <th className="py-3 px-3 font-semibold">Composite Score</th>
                    <th className="py-3 px-3 font-semibold">Level</th>
                    <th className="py-3 px-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {screeningData.map((s: any) => (
                    <tr
                      key={s.assessment_id}
                      onClick={() => {
                        setSelectedProduct(s.product_name);
                        setSelectedDestination(s.destination_country);
                        setActiveTab('dossier');
                      }}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-emerald-400 font-mono">
                          {s.rank}
                        </span>
                        <span>{s.product_name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-cyan-400 font-semibold">{s.destination_country}</td>
                      <td className="py-2.5 px-3 font-mono">{s.production_availability_score}</td>
                      <td className="py-2.5 px-3 font-mono">{s.market_demand_score}</td>
                      <td className="py-2.5 px-3 font-mono">{s.logistics_score}</td>
                      <td className="py-2.5 px-3 font-mono">{s.standards_readiness_score}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">{s.opportunity_score}</span>
                          <div className="w-10 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-400 h-full rounded-full"
                              style={{ width: `${Math.min(s.opportunity_score, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.opportunity_level === 'VERY_HIGH'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {s.opportunity_level.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
                          <span>Dossier</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 10. TAB 6: Commercial Pre-Assessment Dossier */}
      {activeTab === 'dossier' && (
        <div className="space-y-6">
          
          {/* Controls: Product & Destination Selector */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Commercial Pre-Assessment Dossier</span>
              </div>
              <h2 className="text-2xl font-bold text-white">
                {selectedProduct} <span className="text-slate-500 font-light">to</span> <span className="text-emerald-400">{selectedDestination}</span>
              </h2>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Product:</span>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="bg-slate-950 text-emerald-400 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
                >
                  {productsTrade.map((p) => (
                    <option key={p.product_name} value={p.product_name}>
                      {p.product_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Destination:</span>
                <select
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="bg-slate-950 text-emerald-400 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
                >
                  <option value="Netherlands">Netherlands (EU Hub)</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United Arab Emirates">United Arab Emirates (Dubai)</option>
                  <option value="China">China</option>
                  <option value="Democratic Republic of the Congo">DR Congo (Goma/Bukavu)</option>
                  <option value="Germany">Germany</option>
                  <option value="Pakistan">Pakistan</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dossier Safeguard Banner */}
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200">
            <strong>COMMERCIAL DISCLAIMER:</strong> {dossierData?.safeguard_disclaimer || "Strong production or export growth does not automatically establish profitability or future demand. Any export-opportunity score is a screening tool, not a guarantee of commercial success."}
          </div>

          {dossierData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Assessment Breakdown */}
              <div className="space-y-5">
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    Market Assessment Scores
                  </h3>

                  {dossierData.assessment ? (
                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">Opportunity Score:</span>
                        <span className="text-xl font-bold text-emerald-400 font-mono">
                          {dossierData.assessment.opportunity_score} / 100
                        </span>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div>
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>Domestic Production Availability</span>
                            <span className="font-mono text-emerald-400">{dossierData.assessment.production_availability_score}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${dossierData.assessment.production_availability_score}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>Destination Market Demand</span>
                            <span className="font-mono text-blue-400">{dossierData.assessment.market_demand_score}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-400 h-full rounded-full" style={{ width: `${dossierData.assessment.market_demand_score}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>Logistics & Freight Route</span>
                            <span className="font-mono text-cyan-400">{dossierData.assessment.logistics_score}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${dossierData.assessment.logistics_score}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>Phytosanitary & Quality Readiness</span>
                            <span className="font-mono text-purple-400">{dossierData.assessment.standards_readiness_score}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-purple-400 h-full rounded-full" style={{ width: `${dossierData.assessment.standards_readiness_score}%` }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 pt-2">
                        <strong className="text-white text-xs block">Key Opportunity Drivers:</strong>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {dossierData.assessment.explanation}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 space-y-1 text-amber-200">
                        <strong className="text-[11px] text-amber-300 block">Critical Commercial Risks & Limitations:</strong>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {dossierData.assessment.limitations}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                      Standardized opportunity assessment pending for this specific product-market pair. Check general trade statistics.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Historical Trade Trend & Sourcing Districts */}
              <div className="lg:col-span-2 space-y-5">
                
                {/* Historical Multi-Season Trade Trend */}
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Historical Export Trajectory: {selectedProduct} Across Seasons
                  </h3>
                  <p className="text-xs text-slate-400">
                    Export volume (MT) and export revenue (USD) trends across the 38-season historical series.
                  </p>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dossierData.historical_trend?.slice(-16) || []} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorExpVal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <XAxis dataKey="season_code" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                          formatter={(val: any) => [`$${Number(val).toLocaleString()} USD`, 'Export Revenue']}
                        />
                        <Area type="monotone" dataKey="export_value_usd" name="Export Revenue ($)" stroke="#10b981" fillOpacity={1} fill="url(#colorExpVal)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Leading Rwandan Sourcing Districts for this Commodity */}
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Top Rwandan Sourcing Districts for {selectedProduct}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dossierData.top_sourcing_districts?.map((d: any) => (
                      <div key={d.district_name} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white text-sm">{d.district_name}</span>
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Score: {d.export_readiness_score}
                          </span>
                        </div>
                        <div className="text-slate-400 text-[11px]">Province: {d.province_name}</div>
                        <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                          <span>Exportable Surplus: <strong>{Number(d.estimated_exportable_volume_mt).toLocaleString()} MT</strong></span>
                          <span>Exit: <strong>{d.distance_to_exit_km} km</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
