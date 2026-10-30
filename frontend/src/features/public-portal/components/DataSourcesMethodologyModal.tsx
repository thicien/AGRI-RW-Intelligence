import React from 'react';
import { 
  X, Database, BookOpen, ExternalLink, ShieldCheck, 
  CheckCircle2, AlertCircle, FileText, Globe, Layers 
} from 'lucide-react';

interface DataSourcesMethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DataSourcesMethodologyModal({
  isOpen,
  onClose
}: DataSourcesMethodologyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-emerald-100 bg-gradient-to-r from-emerald-900 via-[#14532d] to-[#0a2f1c] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <BookOpen className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                Data Provenance, Standards & Methodology
              </h2>
              <p className="text-xs text-emerald-200/80">
                Official source verification for the Public Agricultural Intelligence Portal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          
          {/* Institutional Sources */}
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-700" />
              Primary Institutional Data Sources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="font-extrabold text-slate-900 text-xs mb-1">
                  National Institute of Statistics of Rwanda (NISR)
                </div>
                <p className="text-slate-600 text-[11px] mb-2">
                  Seasonal Agricultural Survey (SAS) annual and seasonal publications covering Seasons A, B, and C (2014–2026).
                </p>
                <div className="text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Core Agricultural Statistics & Crop Yields
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="font-extrabold text-slate-900 text-xs mb-1">
                  Ministry of Agriculture and Animal Resources (MINAGRI)
                </div>
                <p className="text-slate-600 text-[11px] mb-2">
                  National irrigation schemes, radical terracing acreage, and national strategic storage inventory.
                </p>
                <div className="text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Irrigation & Storage Infrastructure
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="font-extrabold text-slate-900 text-xs mb-1">
                  Rwanda Agriculture & Animal Resources Board (RAB)
                </div>
                <p className="text-slate-600 text-[11px] mb-2">
                  Soil testing database, pH maps, NPK application rates, lime requirements, and erosion control programs.
                </p>
                <div className="text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Soil Fertility & Agroforestry
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="font-extrabold text-slate-900 text-xs mb-1">
                  National Agricultural Export Development Board (NAEB)
                </div>
                <p className="text-slate-600 text-[11px] mb-2">
                  Export shipment records, exportable surplus indicators, FOB prices, destination markets, and coffee/tea/horticulture trade.
                </p>
                <div className="text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Agricultural Trade & Export Opportunities
                </div>
              </div>
            </div>
          </div>

          {/* Three Tiers of Agricultural Evidence */}
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              Evidence Classification Framework
            </h3>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-950 border border-emerald-300 shrink-0 mt-0.5">
                  Recorded Statistic
                </span>
                <div>
                  <div className="font-bold text-slate-900 text-xs mb-0.5">
                    Direct Field Observations & Official Survey Tables
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Measurements obtained directly from sample plots, farmer interviews, or registered physical assets (e.g., NISR SAS crop production MT, harvested area ha, and registered schemes).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex items-start gap-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-100 text-blue-950 border border-blue-300 shrink-0 mt-0.5">
                  Derived Estimate
                </span>
                <div>
                  <div className="font-bold text-slate-900 text-xs mb-0.5">
                    Mathematically Computed Indicators
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Indicators calculated directly from two or more recorded values using standard formulas (e.g., Crop Yield = Production MT ÷ Harvested Area Ha; Storage Gap = Market Surplus MT − Documented Usable Storage MT).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 flex items-start gap-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-purple-100 text-purple-950 border border-purple-300 shrink-0 mt-0.5">
                  Modelled Assessment
                </span>
                <div>
                  <div className="font-bold text-slate-900 text-xs mb-0.5">
                    Spatial & Multi-Criteria Decision Screening
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Analytical models providing screening guidance (e.g. RUSLE Erosion Susceptibility, Small-Scale Irrigation Feasibility Index, and Export Readiness Score). These serve as decision prioritization tools rather than guarantees.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transparency & Limitations */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60">
            <h4 className="font-extrabold text-amber-950 text-xs mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              Transparency & Missing Data Policy
            </h4>
            <p className="text-amber-900/90 text-[11px] leading-relaxed">
              AgriLens Rwanda operates strictly under research transparency principles. If a district, season, or indicator was not surveyed or recorded in official NISR publications for a specific historical period, it is clearly communicated as "Not Recorded" or "Data Not Available" rather than fabricated. A transparent portal with reliable statistics is more valuable to planners and researchers than an artificial completeness.
            </p>
          </div>

          {/* Official Publications Links */}
          <div>
            <h4 className="font-extrabold text-slate-900 text-xs mb-2">
              Official Reference Publications
            </h4>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <a 
                href="https://www.statistics.gov.rw/publication/seasonal-agricultural-survey-2025" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-bold border border-emerald-200"
              >
                NISR Seasonal Agricultural Survey Portal <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href="https://www.minagri.gov.rw" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-bold border border-emerald-200"
              >
                MINAGRI Official Portal <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href="https://naeb.gov.rw" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-bold border border-emerald-200"
              >
                NAEB Export Reports <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            AgriLens Rwanda Public Agricultural Intelligence Portal
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#14532d] hover:bg-[#166534] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
          >
            Close Provenance Window
          </button>
        </div>
      </div>
    </div>
  );
}
