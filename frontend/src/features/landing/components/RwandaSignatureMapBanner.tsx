import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RWANDA_REAL_DISTRICTS } from './rwandaRealPaths';

export default function RwandaSignatureMapBanner() {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-r from-[#072415] via-[#14532d] to-[#0b331f] text-white border-y border-emerald-900/60 shadow-inner relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Exact Signature Message - Clean & Pure */}
          <div className="lg:col-span-6 text-left">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-6 drop-shadow-md">
              Know where the problem is.<br />
              Understand why it matters.<br />
              Decide what to do next.
            </h2>
            <p className="text-lg sm:text-xl text-emerald-100 max-w-xl font-medium leading-relaxed">
              AgriLens turns agricultural information into evidence-based intelligence for better decisions.
            </p>
          </div>

          {/* Right Column: Real Geographic Map of Rwanda */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-lg aspect-[600/528] bg-[#051c10]/60 rounded-3xl p-4 sm:p-6 border border-emerald-500/20 shadow-2xl backdrop-blur-sm">
              
              {/* Hover Badge */}
              <div className="absolute top-4 right-4 z-20">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {hoveredDistrict ? `${hoveredDistrict} District` : 'Rwanda (30 Districts)'}
                </span>
              </div>

              {/* Real Rwanda SVG Map */}
              <svg
                viewBox="0 0 600 528"
                className="w-full h-full drop-shadow-2xl select-none"
              >
                <defs>
                  <filter id="real-district-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#34d399" floodOpacity="0.8" />
                  </filter>
                </defs>

                <g>
                  {RWANDA_REAL_DISTRICTS.map((shape) => {
                    const isHovered = hoveredDistrict === shape.name;

                    return (
                      <Link
                        key={shape.name}
                        to={`/public-portal?district=${encodeURIComponent(shape.name)}`}
                        className="cursor-pointer group focus:outline-none"
                        onMouseEnter={() => setHoveredDistrict(shape.name)}
                        onMouseLeave={() => setHoveredDistrict(null)}
                      >
                        <path
                          d={shape.d}
                          fill={isHovered ? '#10b981' : '#0c3e24'}
                          stroke={isHovered ? '#a7f3d0' : '#1b633d'}
                          strokeWidth={isHovered ? 2.5 : 1.1}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          filter={isHovered ? 'url(#real-district-glow)' : undefined}
                          className="transition-all duration-150 hover:brightness-125"
                        />
                        <text
                          x={shape.cx}
                          y={shape.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={isHovered ? "11" : "8.5"}
                          fontWeight={isHovered ? "900" : "700"}
                          fill={isHovered ? "#ffffff" : "#a7f3d0"}
                          pointerEvents="none"
                          className="select-none transition-all drop-shadow-sm opacity-90 group-hover:opacity-100"
                        >
                          {shape.name}
                        </text>
                      </Link>
                    );
                  })}
                </g>
              </svg>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
