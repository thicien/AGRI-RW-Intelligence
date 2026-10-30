import React, { useState } from 'react';
import { 
  X, Download, Printer, FileSpreadsheet, CheckCircle2, 
  ShieldCheck, FileText, Share2, Sparkles 
} from 'lucide-react';
import type { PublicFilterState, DistrictRankingItem } from '../types';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: PublicFilterState;
  rankings: DistrictRankingItem[];
  overviewData: any;
  activeIndicatorLabel: string;
}

export default function ExportReportModal({
  isOpen,
  onClose,
  filters,
  rankings,
  overviewData,
  activeIndicatorLabel
}: ExportReportModalProps) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const sectionName = {
    'productivity': 'Agricultural Productivity Intelligence',
    'irrigation': 'Irrigation Intelligence',
    'soil': 'Soil Conservation and Fertility Intelligence',
    'post-harvest': 'Post-Harvest Collection and Storage Intelligence',
    'export': 'Export Market Opportunities Intelligence',
  }[filters.section];

  // Generate CSV Content
  const handleDownloadCSV = () => {
    const headers = [
      'Rank',
      'District',
      'Province',
      'Indicator_Label',
      'Measured_Value',
      'Unit',
      'National_Benchmark',
      'Benchmark_Delta_Pct',
      'Observation_Type',
      'Reporting_Season',
      'Reporting_Year',
      'Source_Citation'
    ];

    const rows = rankings.map(r => [
      r.rank,
      `"${r.district}"`,
      `"${r.province}"`,
      `"${activeIndicatorLabel}"`,
      r.value,
      `"${r.unit}"`,
      r.nationalBenchmark ?? 'N/A',
      r.benchmarkDeltaPct ?? 'N/A',
      `"${r.methodologyType}"`,
      `"${filters.season}"`,
      filters.year,
      `"${r.sourceCitation}"`
    ]);

    const csvContent = [
      `# AgriLens Rwanda - Public Agricultural Intelligence Portal Export`,
      `# Section: ${sectionName}`,
      `# Filter: Year ${filters.year}, Season ${filters.seasonLetter}, District ${filters.district}`,
      `# Export Timestamp: ${new Date().toISOString()}`,
      `# Source Institution: National Institute of Statistics of Rwanda (NISR)`,
      `# Status: Approved Public Read-Only Agricultural Data`,
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AgriLens_Rwanda_${filters.section}_${filters.season}_${filters.district.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-emerald-100 bg-gradient-to-r from-emerald-900 to-[#14532d] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Download className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                Export Approved Agricultural Intelligence
              </h2>
              <p className="text-xs text-emerald-200/80">
                Research-ready summaries for researchers, students & planners
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

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700 leading-relaxed">
          {/* Metadata preview card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-extrabold text-slate-900 text-sm flex items-center justify-between">
              <span>{sectionName}</span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Public Read-Only
              </span>
            </div>
            <div className="text-[11px] text-slate-500 space-y-1">
              <div><strong>Selected Period:</strong> {filters.year} Season {filters.seasonLetter} ({filters.season})</div>
              <div><strong>District Scope:</strong> {filters.district === 'ALL' ? 'All 30 Districts (National View)' : `${filters.district} District`}</div>
              <div><strong>Primary Indicator:</strong> {activeIndicatorLabel}</div>
              <div><strong>Total Records in Export:</strong> {rankings.length} districts</div>
            </div>
          </div>

          {/* Export Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CSV Export Option */}
            <div 
              onClick={handleDownloadCSV}
              className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-400 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm mb-1">
                  Research Dataset (CSV)
                </h4>
                <p className="text-[11px] text-slate-600 mb-4">
                  Formatted spreadsheet including district rankings, measurement values, units, benchmark deviations, and NISR source citations.
                </p>
              </div>

              <div className="text-emerald-800 font-bold text-xs flex items-center gap-1 mt-auto">
                {downloadSuccess ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Downloaded!
                  </span>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" /> Download .CSV File
                  </>
                )}
              </div>
            </div>

            {/* Print / PDF Option */}
            <div 
              onClick={handlePrintReport}
              className="p-5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Printer className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm mb-1">
                  Print / Save as PDF
                </h4>
                <p className="text-[11px] text-slate-600 mb-4">
                  High-resolution executive print summary with summary KPI cards, district tables, charts, and methodology notes.
                </p>
              </div>

              <div className="text-slate-800 font-bold text-xs flex items-center gap-1 mt-auto">
                <Printer className="w-3.5 h-3.5" /> Open Print Preview
              </div>
            </div>
          </div>

          {/* Privacy & Safeguard notice */}
          <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-[11px] text-slate-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Public Access Guarantee:</strong> Exports contain only approved, non-confidential aggregated agricultural statistics derived from published NISR SAS reports. Private farmer identifiers or unverified management data are never exposed.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
