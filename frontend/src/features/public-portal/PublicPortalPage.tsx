import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  BarChart3, Droplets, Leaf, Warehouse, Globe, 
  BookOpen, Download, LogIn, ArrowRight, ShieldCheck, 
  CheckCircle2, RefreshCw, AlertCircle, Info, Database,
  Search, ExternalLink, MapPin
} from 'lucide-react';
import PublicNavbar from './components/PublicNavbar';
import PublicFilterBar from './components/PublicFilterBar';
import DataSourcesMethodologyModal from './components/DataSourcesMethodologyModal';
import ExportReportModal from './components/ExportReportModal';
import ProductivitySection from './sections/ProductivitySection';
import IrrigationSection from './sections/IrrigationSection';
import SoilSection from './sections/SoilSection';
import PostHarvestSection from './sections/PostHarvestSection';
import ExportSection from './sections/ExportSection';
import type { 
  PublicSection, PublicFilterState, SeasonInfo, 
  ProductivityOverview, IrrigationOverview, SoilOverview, 
  PostHarvestOverview, ExportOverview 
} from './types';
import { 
  fetchPublicSeasons, fetchPublicCrops, fetchProductivityData, 
  fetchIrrigationData, fetchSoilData, fetchPostHarvestData, 
  fetchExportData, fetchDistrictDossier, DISTRICT_PROVINCES 
} from './publicPortalApi';

export default function PublicPortalPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initial section from query parameter or default to 'productivity'
  const initialSection = (searchParams.get('section') as PublicSection) || 'productivity';
  const initialDistrict = searchParams.get('district') || 'ALL';

  const [filters, setFilters] = useState<PublicFilterState>({
    section: initialSection,
    year: 2025,
    season: '2025B',
    seasonLetter: 'B',
    district: initialDistrict,
    crop: 'Maize',
    searchQuery: '',
    viewMode: 'visual'
  });

  const [availableSeasons, setAvailableSeasons] = useState<SeasonInfo[]>([]);
  const [availableCrops, setAvailableCrops] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Section data states
  const [productivityData, setProductivityData] = useState<any>({
    overview: {} as ProductivityOverview,
    crops: [],
    districtComparisons: [],
    benchmark: null
  });

  const [irrigationData, setIrrigationData] = useState<any>({
    overview: {} as IrrigationOverview,
    districts: [],
    schemes: [],
    screening: []
  });

  const [soilData, setSoilData] = useState<any>({
    overview: {} as SoilOverview,
    districts: [],
    ranking: [],
    projects: []
  });

  const [postHarvestData, setPostHarvestData] = useState<any>({
    overview: {} as PostHarvestOverview,
    districts: [],
    facilities: [],
    gapScreening: [],
    safeguardNotice: { title: '', content: '', sourceCitation: '' }
  });

  const [exportData, setExportData] = useState<any>({
    overview: {} as ExportOverview,
    districts: [],
    products: [],
    opportunities: [],
    safeguardNotice: { title: '', content: '', sourceCitation: '' }
  });

  const [districtDossier, setDistrictDossier] = useState<any>(null);

  // Modals
  const [methodologyModalOpen, setMethodologyModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // 1. Initial Load of Master Seasons & Crops
  useEffect(() => {
    let isMounted = true;
    async function loadMasterData() {
      try {
        const [seasons, crops] = await Promise.all([
          fetchPublicSeasons(),
          fetchPublicCrops()
        ]);
        if (isMounted) {
          setAvailableSeasons(seasons);
          setAvailableCrops(crops);

          // Select the most recent verified season
          if (seasons.length > 0) {
            const first = seasons[0];
            const letter = first.season_code.endsWith('C') ? 'C' : first.season_code.endsWith('A') ? 'A' : 'B';
            setFilters(prev => ({
              ...prev,
              year: first.year,
              season: first.season_code,
              seasonLetter: letter
            }));
          }
        }
      } catch (err) {
        console.error('Error loading master data:', err);
      }
    }
    loadMasterData();
    return () => { isMounted = false; };
  }, []);

  // 2. Load Section Data whenever Section, Season, or Crop changes
  useEffect(() => {
    let isMounted = true;
    async function loadSectionData() {
      setLoading(true);
      try {
        if (filters.section === 'productivity') {
          const data = await fetchProductivityData(filters.season, filters.crop, filters.district);
          if (isMounted) setProductivityData(data);
        } else if (filters.section === 'irrigation') {
          const data = await fetchIrrigationData(filters.season);
          if (isMounted) setIrrigationData(data);
        } else if (filters.section === 'soil') {
          const data = await fetchSoilData(filters.season);
          if (isMounted) setSoilData(data);
        } else if (filters.section === 'post-harvest') {
          const data = await fetchPostHarvestData(filters.season);
          if (isMounted) setPostHarvestData(data);
        } else if (filters.section === 'export') {
          const data = await fetchExportData(filters.season);
          if (isMounted) setExportData(data);
        }

        // If a specific district is selected, load its dossier
        if (filters.district !== 'ALL') {
          const dossier = await fetchDistrictDossier(filters.district, filters.season);
          if (isMounted) setDistrictDossier(dossier);
        } else {
          if (isMounted) setDistrictDossier(null);
        }
      } catch (err) {
        console.error(`Error loading data for ${filters.section}:`, err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSectionData();
    return () => { isMounted = false; };
  }, [filters.section, filters.season, filters.crop, filters.district]);

  // Sync section with URL search params
  const handleSectionSelect = (section: PublicSection) => {
    setFilters(prev => ({ ...prev, section }));
    setSearchParams(prev => {
      prev.set('section', section);
      return prev;
    });
  };

  const handleDistrictSelect = (district: string) => {
    setFilters(prev => ({ ...prev, district }));
    setSearchParams(prev => {
      if (district === 'ALL') prev.delete('district');
      else prev.set('district', district);
      return prev;
    });
  };

  const handleFilterChange = <K extends keyof PublicFilterState>(key: K, value: PublicFilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'section') {
      setSearchParams(p => {
        p.set('section', String(value));
        return p;
      });
    }
  };

  const handleResetFilters = () => {
    setFilters(prev => ({
      ...prev,
      district: 'ALL',
      searchQuery: '',
      crop: 'Maize'
    }));
    setSearchParams(prev => {
      prev.delete('district');
      return prev;
    });
  };

  // Section cards definition for section switcher
  const sectionCards = [
    {
      id: 'productivity' as PublicSection,
      num: '01',
      title: 'Agricultural Productivity',
      desc: 'Crop production, cultivated area, and yield across seasons.',
      icon: <BarChart3 className="w-5 h-5 text-emerald-700" />,
      accent: 'border-emerald-500'
    },
    {
      id: 'irrigation' as PublicSection,
      num: '02',
      title: 'Irrigation Intelligence',
      desc: 'Documented schemes, coverage, and opportunity areas.',
      icon: <Droplets className="w-5 h-5 text-cyan-700" />,
      accent: 'border-cyan-500'
    },
    {
      id: 'soil' as PublicSection,
      num: '03',
      title: 'Soil & Fertility',
      desc: 'Soil conditions, fertility indicators, erosion risks, and conservation.',
      icon: <Leaf className="w-5 h-5 text-emerald-700" />,
      accent: 'border-emerald-600'
    },
    {
      id: 'post-harvest' as PublicSection,
      num: '04',
      title: 'Post-Harvest & Storage',
      desc: 'Collection centres, storage capacity, and infrastructure gaps.',
      icon: <Warehouse className="w-5 h-5 text-purple-700" />,
      accent: 'border-purple-500'
    },
    {
      id: 'export' as PublicSection,
      num: '05',
      title: 'Export Opportunities',
      desc: 'Production trends, commercial surplus, and market readiness.',
      icon: <Globe className="w-5 h-5 text-amber-700" />,
      accent: 'border-amber-500'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f4f8f5] font-sans text-slate-800 selection:bg-emerald-200 selection:text-emerald-950 flex flex-col">
      {/* 1. Portal Navigation Header */}
      <PublicNavbar
        activeSection={filters.section}
        onSelectSection={handleSectionSelect}
        onOpenMethodology={() => setMethodologyModalOpen(true)}
        onOpenExport={() => setExportModalOpen(true)}
      />

      {/* 2. Portal Hero & Mission Introduction */}
      <section className="bg-gradient-to-b from-[#eaf4ed] via-[#f4f8f5] to-white border-b border-emerald-100/70 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-3.5 border border-emerald-600/30 bg-emerald-100/80 text-emerald-950 text-[11px] font-extrabold tracking-widest uppercase rounded-full shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                AgriLens Rwanda · Open Public Evidence
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3">
                Public Agricultural <span className="text-[#15803d]">Intelligence</span> Portal
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                A reliable, read-only agricultural intelligence portal designed for researchers, students, development organizations, investors, and members of the public to explore Rwanda’s agricultural performance across districts, crops, seasons, and years.
              </p>
            </div>

            {/* Quick Access Badges & Mode Notice */}
            <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-md text-xs space-y-2.5 max-w-sm shrink-0">
              <div className="flex items-center justify-between font-extrabold text-slate-900 text-sm">
                <span className="flex items-center gap-1.5 text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Read-Only Public Portal
                </span>
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  No Login Required
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Empowered by verified datasets from the <strong>National Institute of Statistics of Rwanda (NISR)</strong> and <strong>MINAGRI</strong>. Visitors can explore, compare, and download approved research summaries.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => setMethodologyModalOpen(true)}
                  className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" /> View Methodology
                </button>
                <Link to="/login" className="text-slate-500 font-bold hover:text-emerald-800 transition-colors">
                  Staff Workspace →
                </Link>
              </div>
            </div>
          </div>

          {/* Five Sections Switcher Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-8">
            {sectionCards.map((sec) => {
              const isActive = filters.section === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => handleSectionSelect(sec.id)}
                  className={`p-4 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                    isActive
                      ? 'bg-white border-[#14532d] shadow-md shadow-emerald-950/10 ring-2 ring-[#14532d]/20 -translate-y-1'
                      : 'bg-white/80 border-emerald-100/80 hover:bg-white hover:border-emerald-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                        {sec.icon}
                      </span>
                      <span className="text-xs font-black text-slate-300">{sec.num}</span>
                    </div>
                    <div className={`font-extrabold text-sm mb-1 ${isActive ? 'text-[#14532d]' : 'text-slate-900'}`}>
                      {sec.title}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {sec.desc}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className={`font-bold ${isActive ? 'text-emerald-800' : 'text-slate-400'}`}>
                      {isActive ? 'Active Section' : 'Explore'}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'translate-x-1 text-emerald-800' : 'text-slate-300'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Main Body Container with Universal Filter Bar & Section Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Universal Filter Bar */}
        <PublicFilterBar
          filters={filters}
          onChangeFilter={handleFilterChange}
          availableSeasons={availableSeasons}
          availableCrops={availableCrops}
          onResetFilters={handleResetFilters}
        />

        {/* Selected District Dossier Banner (if specific district is isolated) */}
        {filters.district !== 'ALL' && (
          <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-emerald-900 via-[#14532d] to-[#0a2f1c] text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                <MapPin className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300 mb-0.5">
                  District Investigation Dossier · {DISTRICT_PROVINCES[filters.district] || 'Rwanda'}
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  {filters.district} District Agricultural Profile
                </h2>
                <p className="text-xs text-emerald-100/80 mt-0.5">
                  Isolating verified NISR agricultural statistics, infrastructure, and priority indices for {filters.season}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDistrictSelect('ALL')}
              className="text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors cursor-pointer self-start md:self-auto"
            >
              ← Back to National View
            </button>
          </div>
        )}

        {/* Section Loading State */}
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-700 animate-spin mx-auto" />
            <div className="text-sm font-extrabold text-slate-800">
              Retrieving Approved Agricultural Evidence...
            </div>
            <div className="text-xs text-slate-500 max-w-sm mx-auto">
              Querying verified NISR Seasonal Agricultural Survey datasets for {filters.season} across Rwanda's 30 districts.
            </div>
          </div>
        ) : (
          /* Render Active Agricultural Section */
          <>
            {filters.section === 'productivity' && (
              <ProductivitySection
                overview={productivityData.overview}
                crops={productivityData.crops}
                districtComparisons={productivityData.districtComparisons}
                benchmark={productivityData.benchmark}
                filters={filters}
                onSelectDistrict={handleDistrictSelect}
                onSelectCrop={(c) => handleFilterChange('crop', c)}
              />
            )}

            {filters.section === 'irrigation' && (
              <IrrigationSection
                overview={irrigationData.overview}
                districts={irrigationData.districts}
                schemes={irrigationData.schemes}
                screening={irrigationData.screening}
                filters={filters}
                onSelectDistrict={handleDistrictSelect}
              />
            )}

            {filters.section === 'soil' && (
              <SoilSection
                overview={soilData.overview}
                districts={soilData.districts}
                ranking={soilData.ranking}
                projects={soilData.projects}
                filters={filters}
                onSelectDistrict={handleDistrictSelect}
              />
            )}

            {filters.section === 'post-harvest' && (
              <PostHarvestSection
                overview={postHarvestData.overview}
                districts={postHarvestData.districts}
                facilities={postHarvestData.facilities}
                gapScreening={postHarvestData.gapScreening}
                safeguardNotice={postHarvestData.safeguardNotice}
                filters={filters}
                onSelectDistrict={handleDistrictSelect}
              />
            )}

            {filters.section === 'export' && (
              <ExportSection
                overview={exportData.overview}
                districts={exportData.districts}
                products={exportData.products}
                opportunities={exportData.opportunities}
                safeguardNotice={exportData.safeguardNotice}
                filters={filters}
                onSelectDistrict={handleDistrictSelect}
              />
            )}
          </>
        )}
      </main>

      {/* 4. Public Access vs Authorized Access Comparison Section */}
      <section className="bg-white border-t border-emerald-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#14532d]">
              Platform Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 mb-3">
              Public Read-Only Access vs. Authorized Workspace
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              AgriLens Rwanda strictly isolates public evidence exploration from internal management workflows to ensure complete institutional integrity and data security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Public Visitor Card */}
            <div className="p-6 rounded-2xl border-2 border-emerald-200 bg-emerald-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="font-black text-lg text-emerald-950">
                    Public Visitor
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-full">
                    No Login Required
                  </span>
                </div>
                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>View approved national agricultural statistics & rankings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Explore reporting seasons, years, and all 30 districts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Examine interactive territorial maps and historical comparisons</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Download approved public research summaries (CSV / PDF)</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Read-only: Cannot modify source datasets or add interventions</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-emerald-100 text-[11px] font-bold text-emerald-900">
                ✓ Currently Active: Public Agricultural Intelligence Portal
              </div>
            </div>

            {/* Authenticated Platform User Card */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="font-black text-lg text-slate-900">
                    Authenticated Platform User
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                    Login Required
                  </span>
                </div>
                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Access role-specific decision workflows & administrative consoles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Upload raw NISR survey datasets and monitor ETL ingestion</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Authorize and manage district agricultural interventions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Execute AI predictive scenarios, stress tests, and policy simulations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Configure user accounts, RBAC permissions, and security audit logs</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  to="/login"
                  className="w-full py-2.5 bg-[#14532d] hover:bg-[#166534] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <LogIn className="w-4 h-4" /> Sign In to Authorized Workspace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Portal Footer */}
      <footer className="bg-[#082214] text-white border-t border-emerald-950 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-xs">
            {/* Col 1 */}
            <div className="md:col-span-2 space-y-3">
              <div className="font-black text-lg tracking-tight text-white flex items-center gap-2">
                <img src="/logo.png?v=2" alt="AgriLens Logo" className="w-6 h-6 object-contain" />
                AgriLens <span className="font-light text-emerald-400">RWANDA</span>
              </div>
              <p className="text-emerald-100/70 text-xs leading-relaxed max-w-md">
                Public Agricultural Intelligence Portal — Transforming National Institute of Statistics of Rwanda (NISR) Seasonal Agricultural Surveys into spatial evidence, district rankings, and research-grade agricultural intelligence.
              </p>
              <div className="text-[11px] text-emerald-300 font-bold">
                NISR Big Data Hackathon Project · Agricultural Productivity Challenge
              </div>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="font-bold uppercase tracking-wider mb-3 text-emerald-300 text-xs">
                Intelligence Sections
              </h4>
              <ul className="space-y-2 text-emerald-100/70 text-xs">
                <li>
                  <button onClick={() => handleSectionSelect('productivity')} className="hover:text-emerald-300 transition-colors cursor-pointer">
                    01. Agricultural Productivity
                  </button>
                </li>
                <li>
                  <button onClick={() => handleSectionSelect('irrigation')} className="hover:text-emerald-300 transition-colors cursor-pointer">
                    02. Irrigation Intelligence
                  </button>
                </li>
                <li>
                  <button onClick={() => handleSectionSelect('soil')} className="hover:text-emerald-300 transition-colors cursor-pointer">
                    03. Soil & Fertility
                  </button>
                </li>
                <li>
                  <button onClick={() => handleSectionSelect('post-harvest')} className="hover:text-emerald-300 transition-colors cursor-pointer">
                    04. Post-Harvest & Storage
                  </button>
                </li>
                <li>
                  <button onClick={() => handleSectionSelect('export')} className="hover:text-emerald-300 transition-colors cursor-pointer">
                    05. Export Market Opportunities
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="font-bold uppercase tracking-wider mb-3 text-emerald-300 text-xs">
                Transparency & Platform
              </h4>
              <ul className="space-y-2 text-emerald-100/70 text-xs">
                <li>
                  <button onClick={() => setMethodologyModalOpen(true)} className="hover:text-emerald-300 transition-colors cursor-pointer">
                    Data Sources & Provenance
                  </button>
                </li>
                <li>
                  <button onClick={() => setExportModalOpen(true)} className="hover:text-emerald-300 transition-colors cursor-pointer">
                    Download Research Summary (CSV)
                  </button>
                </li>
                <li>
                  <Link to="/" className="hover:text-emerald-300 transition-colors">
                    Landing Page
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-emerald-300 transition-colors font-bold text-emerald-400">
                    Authorized Sign In
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-emerald-200/60 gap-3">
            <p>© 2026 AgriLens Rwanda. Read-Only Public Agricultural Intelligence Portal.</p>
            <p>Official Data Partner: National Institute of Statistics of Rwanda (NISR)</p>
          </div>
        </div>
      </footer>

      {/* Methodology Modal */}
      <DataSourcesMethodologyModal
        isOpen={methodologyModalOpen}
        onClose={() => setMethodologyModalOpen(false)}
      />

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        filters={filters}
        rankings={
          filters.section === 'productivity' ? productivityData.districtComparisons :
          filters.section === 'irrigation' ? irrigationData.districts :
          filters.section === 'soil' ? soilData.districts :
          filters.section === 'post-harvest' ? postHarvestData.districts :
          exportData.districts
        }
        overviewData={
          filters.section === 'productivity' ? productivityData.overview :
          filters.section === 'irrigation' ? irrigationData.overview :
          filters.section === 'soil' ? soilData.overview :
          filters.section === 'post-harvest' ? postHarvestData.overview :
          exportData.overview
        }
        activeIndicatorLabel={filters.section.toUpperCase()}
      />
    </div>
  );
}
