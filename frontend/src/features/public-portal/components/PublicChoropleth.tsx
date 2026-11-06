import { useState } from "react";
import { RWANDA_REAL_DISTRICTS } from "../../landing/components/rwandaRealPaths";

interface Props {
  scaleMaximum?: number | null;
  title: string;
  unit: string;
  data: { name: string; value: number | null }[];
  selectedDistrict: string;
  allowedDistricts: string[];
  onSelectDistrict: (name: string) => void;
}
export default function PublicChoropleth({
  title,
  scaleMaximum,
  unit,
  data,
  selectedDistrict,
  allowedDistricts,
  onSelectDistrict,
}: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const lookup = new Map(data.map((r) => [r.name.toLowerCase(), r.value]));
  const available = data
    .map((r) => r.value)
    .filter((n): n is number => n !== null);
  const maximum =
    scaleMaximum ?? (available.length ? Math.max(...available) : null);
  const active =
    hover || (selectedDistrict === "ALL" ? null : selectedDistrict);
  const value = active ? (lookup.get(active.toLowerCase()) ?? null) : null;
  const format = (n: number | null) =>
    n === null
      ? "No Data"
      : n.toLocaleString("en-GB", { maximumFractionDigits: 2 }) + " " + unit;
  return (
    <figure className="min-w-0 rounded-xl border border-cyan-100 bg-slate-50/60 p-3 sm:p-4">
      <figcaption className="text-sm font-semibold text-slate-800">
        {title}
      </figcaption>
      <svg
        viewBox="0 0 600 528"
        className="mx-auto max-h-[420px] w-full"
        role="group"
        aria-label={title}
      >
        {RWANDA_REAL_DISTRICTS.map((shape) => {
          const n = lookup.get(shape.name.toLowerCase()) ?? null,
            allowed = allowedDistricts.includes(shape.name);
          const fill =
            n === null
              ? "#e2e8f0"
              : `hsl(193,65%,${90 - (maximum ? n / maximum : 0) * 57}%)`;
          return (
            <path
              key={shape.name}
              d={shape.d}
              fill={fill}
              stroke={
                shape.name === selectedDistrict || shape.name === hover
                  ? "#164e63"
                  : "white"
              }
              strokeWidth={shape.name === selectedDistrict ? 3 : 1}
              role="button"
              tabIndex={allowed ? 0 : -1}
              aria-disabled={!allowed}
              aria-pressed={shape.name === selectedDistrict}
              aria-label={`${shape.name}: ${format(n)}`}
              className={
                allowed
                  ? "cursor-pointer focus:outline-none focus:stroke-amber-500"
                  : "opacity-35"
              }
              onMouseEnter={() => setHover(shape.name)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(shape.name)}
              onBlur={() => setHover(null)}
              onClick={() => {
                if (allowed) onSelectDistrict(shape.name);
              }}
              onKeyDown={(e) => {
                if (allowed && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onSelectDistrict(shape.name);
                }
              }}
            >
              <title>
                {shape.name}: {format(n)}
              </title>
            </path>
          );
        })}
      </svg>
      <p
        className="min-h-10 text-xs font-semibold text-cyan-950"
        aria-live="polite"
      >
        {active
          ? `${active}: ${format(value)}`
          : "Hover, focus, or select a district to explore its value."}
      </p>
      <div className="mt-2 h-2 rounded-full bg-gradient-to-r from-cyan-50 to-cyan-800" />
      <div className="mt-1 flex justify-between text-[11px] text-slate-500">
        <span>0 {unit}</span>
        <span>{format(maximum)}</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        <span className="mr-1 inline-block h-3 w-3 rounded-sm bg-slate-200" />
        Grey means No Data in this scope. Pale blue includes recorded zeroes.
      </p>
    </figure>
  );
}
