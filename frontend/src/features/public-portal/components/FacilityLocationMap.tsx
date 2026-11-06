import { useEffect, useState } from "react";
import type { Facility } from "../commerceModel";
interface Feature {
  geometry: { type: string; coordinates: number[][][] | number[][][][] };
  properties: { shapeName?: string };
}
let boundaryPromise: Promise<{ features: Feature[] }> | undefined;
export default function FacilityLocationMap({
  facilities,
  selected,
  onSelect,
}: {
  facilities: Facility[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [features, setFeatures] = useState<Feature[]>([]),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    boundaryPromise ??= fetch("/rwanda-districts.geojson").then((r) => {
      if (!r.ok) throw Error();
      return r.json();
    });
    boundaryPromise
      .then((d) => {
        if (active) setFeatures(d.features);
      })
      .catch(() => {
        if (active) setFailed(true);
        boundaryPromise = undefined;
      });
    return () => {
      active = false;
    };
  }, []);
  const coords = (f: Feature): number[][][] =>
    f.geometry.type === "Polygon"
      ? (f.geometry.coordinates as number[][][])
      : (f.geometry.coordinates as number[][][][]).flat();
  const points = features.flatMap((f) => coords(f).flat()),
    minX = points.length ? Math.min(...points.map((p) => p[0])) : 28.8,
    maxX = points.length ? Math.max(...points.map((p) => p[0])) : 30.9,
    minY = points.length ? Math.min(...points.map((p) => p[1])) : -2.9,
    maxY = points.length ? Math.max(...points.map((p) => p[1])) : -1;
  const project = (x: number, y: number) => [
    20 + ((x - minX) / (maxX - minX)) * 560,
    500 - ((y - minY) / (maxY - minY)) * 480,
  ];
  const valid = facilities.filter(
    (f) =>
      f.latitude !== null &&
      f.longitude !== null &&
      f.longitude >= minX &&
      f.longitude <= maxX &&
      f.latitude >= minY &&
      f.latitude <= maxY,
  );
  const chosen = facilities.find((f) => f.id === selected);
  return (
    <figure className="mb-5 rounded-xl border border-cyan-100 bg-slate-50 p-3">
      <figcaption className="font-semibold text-slate-800">
        Recorded facility locations (undated registry)
      </figcaption>
      <p className="my-2 text-xs leading-relaxed text-slate-600">
        {valid.length} entries have usable stored coordinates inside the Rwanda
        boundary extent. Other entries are retained in the directory. Locations
        and operating status require source verification; no district-centre
        points are invented.
      </p>
      {failed ? (
        <p className="text-sm">
          Boundary map could not be loaded. Recorded coordinates remain in
          facility details.
        </p>
      ) : !features.length ? (
        <p role="status" className="p-4 text-sm">
          Loading district boundaries...
        </p>
      ) : (
        <svg
          viewBox="0 0 600 520"
          className="mx-auto max-h-96 w-full"
          role="group"
          aria-label="Recorded agricultural facility locations"
        >
          {features.map((f, i) => (
            <path
              key={i}
              d={coords(f)
                .map(
                  (r) =>
                    r
                      .map((p, i) => {
                        const [x, y] = project(p[0], p[1]);
                        return (
                          (i ? "L" : "M") + x.toFixed(2) + "," + y.toFixed(2)
                        );
                      })
                      .join(" ") + " Z",
                )
                .join(" ")}
              fill="#e2e8f0"
              stroke="white"
              strokeWidth={1}
            >
              <title>{f.properties.shapeName || "District boundary"}</title>
            </path>
          ))}
          {valid.map((f) => {
            const [x, y] = project(f.longitude!, f.latitude!);
            return (
              <g
                key={f.id}
                role="button"
                tabIndex={0}
                aria-label={"Open " + f.name + " in " + f.district}
                onClick={() => onSelect(f.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(f.id);
                  }
                }}
                className="cursor-pointer outline-none focus:stroke-amber-500"
              >
                <title>
                  {f.name + " | " + f.district + " | " + f.facility_type}
                </title>
                <circle cx={x} cy={y} r={11} fill="transparent" />
                <circle
                  cx={x}
                  cy={y}
                  r={selected === f.id ? 7 : 4}
                  fill={selected === f.id ? "#b45309" : "#0e7490"}
                  stroke="white"
                  strokeWidth={1}
                />
              </g>
            );
          })}
        </svg>
      )}
      {chosen && (
        <p className="mt-2 text-sm font-semibold text-cyan-900">
          Selected: {chosen.name}. Full details appear below the directory.
        </p>
      )}
    </figure>
  );
}
