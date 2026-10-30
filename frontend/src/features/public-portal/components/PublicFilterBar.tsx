import React from 'react';
import { 
  Filter, Calendar, MapPin, Layers, RotateCcw, 
  Search, Eye, Table, CheckCircle2, ChevronRight, Sprout 
} from 'lucide-react';
import type { PublicFilterState, PublicSection, SeasonInfo } from '../types';
import { RWANDA_DISTRICTS } from '../publicPortalApi';

interface PublicFilterBarProps {
  filters: PublicFilterState;
  onChangeFilter: <K extends keyof PublicFilterState>(key: K, value: PublicFilterState[K]) => void;
  availableSeasons: SeasonInfo[];
  availableCrops: string[];
  onResetFilters: () => void;
}

export default function PublicFilterBar({
  filters,
  onChangeFilter,
  availableSeasons,
  availableCrops,
  onResetFilters
}: PublicFilterBarProps) {
  // Derive unique years from available seasons
  const years = Array.from(new Set(availableSeasons.map(s => s.year))).sort((a, b) => b - a);

  // Available seasons for selected year
  const seasonsForYear = availableSeasons.filter(s => s.year === filters.year);

  // Check if Season C exists for the selected year
  const hasSeasonA = seasonsForYear.some(s => s.season_code.endsWith('A'));
  const hasSeasonB = seasonsForYear.some(s => s.season_code.endsWith('B'));
  const hasSeasonC = seasonsForYear.some(s => s.season_code.endsWith('C'));

  // Section names mapping
  const sectionLabels: Record<PublicSection, string> = {
    'productivity': '01. Agricultural Productivity',
    'irrigation': '02. Irrigation Intelligence',
    'soil': '03. Soil & Fertility',
    'post-harvest': '04. Post-Harvest & Storage',
    'export': '05. Export Market Opportunities',
  };

  const handleYearChange = (newYear: number) => {
    onChangeFilter('year', newYear);
    // Find valid season code for that year
    const validSeason = availableSeasons.find(s => s.year === newYear && s.season_code.endsWith(filters.seasonLetter))
      || availableSeasons.find(s => s.year === newYear && s.season_code.endsWith('B'))
      || availableSeasons.find(s => s.year === newYear && s.season_code.endsWith('A'))
      || { season_code: `${newYear}B` };

    const newLetter = validSeason.season_code.endsWith('C') ? 'C' : validSeason.season_code.endsWith('A') ? 'A' : 'B';
    onChangeFilter('season', validSeason.season_code);
    onChangeFilter('seasonLetter', newLetter);
  };

  const handleSeasonLetterChange = (letter: 'A' | 'B' | 'C') => {
    onChangeFilter('seasonLetter', letter);
    const code = `${filters.year}${letter}`;
    onChangeFilter('season', code);
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 sm:p-5 mb-8">
      {/* Top Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-4">
        {/* 1. Explore Section */}
        <div>
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-700" /> Explore Section
          </label>
          <select
            value={filters.section}
            onChange={(e) => onChangeFilter('section', e.target.value as PublicSection)}
            className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="productivity">01. Agricultural Productivity</option>
            <option value="irrigation">02. Irrigation Intelligence</option>
            <option value="soil">03. Soil Conservation & Fertility</option>
            <option value="post-harvest">04. Post-Harvest & Storage</option>
            <option value="export">05. Export Market Opportunities</option>
          </select>
        </div>

        {/* 2. Reporting Year */}
        <div>
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Reporting Year
          </label>
          <select
            value={filters.year}
            onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
            className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* 3. Season */}
        <div>
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Agricultural Season
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              disabled={!hasSeasonA}
              onClick={() => handleSeasonLetterChange('A')}
              className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                filters.seasonLetter === 'A'
                  ? 'bg-white text-emerald-950 font-black shadow-xs'
                  : hasSeasonA
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              Season A
            </button>
            <button
              type="button"
              disabled={!hasSeasonB}
              onClick={() => handleSeasonLetterChange('B')}
              className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                filters.seasonLetter === 'B'
                  ? 'bg-white text-emerald-950 font-black shadow-xs'
                  : hasSeasonB
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              Season B
            </button>
            <button
              type="button"
              disabled={!hasSeasonC}
              onClick={() => handleSeasonLetterChange('C')}
              className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                filters.seasonLetter === 'C'
                  ? 'bg-white text-emerald-950 font-black shadow-xs'
                  : hasSeasonC
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              Season C
            </button>
          </div>
        </div>

        {/* 4. District Scope */}
        <div>
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" /> District Scope
          </label>
          <select
            value={filters.district}
            onChange={(e) => onChangeFilter('district', e.target.value)}
            className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="ALL">All 30 Districts (National View)</option>
            {RWANDA_DISTRICTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* 5. Crop Selector (for Productivity / Export) or Reset */}
        <div>
          {filters.section === 'productivity' || filters.section === 'export' ? (
            <>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-700" /> Monitored Crop
              </label>
              <select
                value={filters.crop}
                onChange={(e) => onChangeFilter('crop', e.target.value)}
                className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {availableCrops.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </>
          ) : (
            <>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" /> Quick Reset
              </label>
              <button
                type="button"
                onClick={onResetFilters}
                className="w-full text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                Reset All Filters
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bottom Summary Bar: Active View Badge & View Mode Toggle */}
      <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Selected View Badge Pill */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Selected View:
          </span>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-950 font-extrabold text-xs shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>{sectionLabels[filters.section]}</span>
            <span className="text-emerald-400">•</span>
            <span>{filters.year} · Season {filters.seasonLetter}</span>
            <span className="text-emerald-400">•</span>
            <span>{filters.district === 'ALL' ? 'All 30 Districts (National View)' : `${filters.district} District`}</span>
            {(filters.section === 'productivity' || filters.section === 'export') && (
              <>
                <span className="text-emerald-400">•</span>
                <span className="text-emerald-800">{filters.crop}</span>
              </>
            )}
          </div>
        </div>

        {/* View Toggle (Visual vs Table) */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => onChangeFilter('viewMode', 'visual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filters.viewMode === 'visual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            Visual Dashboard
          </button>
          <button
            type="button"
            onClick={() => onChangeFilter('viewMode', 'table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filters.viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-slate-600" />
            Accessible Table
          </button>
        </div>
      </div>
    </div>
  );
}
