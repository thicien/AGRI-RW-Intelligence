import FacilityLocationMap from "./FacilityLocationMap";
import { useEffect, useState } from "react";
import API_BASE_URL from "../../../config/api";
import type {
  CommercePayload,
  CommerceScope,
  Facility,
} from "../commerceModel";
import {
  facilityCommodities,
  finiteNumber,
  coordinate,
} from "../commerceModel";
import { DISTRICT_PROVINCES } from "../publicPortalApi";
import {
  Field,
  DataTable,
  buttonClass,
  controlClass,
  format,
} from "./EvidenceUI";
export function useCommerce(endpoint: string) {
  const [data, setData] = useState<CommercePayload | null>(null),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setData(null);
    setError(false);
    fetch(API_BASE_URL + "/" + endpoint + "/public-explorer", {
      signal: c.signal,
    })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => {
        if (
          !Array.isArray(d.production) ||
          !Array.isArray(d.facilities) ||
          !d.methodology
        )
          throw Error();
        for (const [field, keys] of Object.entries({
          production: ["production", "area"],
          facilities: [
            "storage",
            "processing",
            "cold",
            "drying",
            "latitude",
            "longitude",
          ],
          records: [
            "storage",
            "processing",
            "cold",
            "drying",
            "facilities",
            "loss_pct",
          ],
          scenarios: ["quantity", "value", "import_quantity", "import_value", "modelled_production"],
          supply: ["estimated_supply", "modelled_surplus", "modelled_distance_km"],
        }))
          if (Array.isArray(d[field]))
            d[field] = d[field].map((row: Record<string, unknown>) => ({
              ...row,
              ...Object.fromEntries(
                keys.map((k) => [
                  k,
                  k === "latitude" || k === "longitude"
                    ? coordinate(row[k], k)
                    : finiteNumber(row[k]),
                ]),
              ),
            }));
        setData(d);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(true);
      });
    return () => c.abort();
  }, [endpoint, retry]);
  return { data, error, retry: () => setRetry(retry + 1) };
}
export function CommerceFilters({
  data,
  scope,
  setScope,
  season,
  setSeason,
  compare,
  setCompare,
  periods,
  exportMode = false,
}: {
  data: CommercePayload;
  scope: CommerceScope;
  setScope: (s: CommerceScope) => void;
  season: string;
  setSeason: (s: string) => void;
  compare: string;
  setCompare: (s: string) => void;
  periods: string[];
  exportMode?: boolean;
}) {
  const crops = [
    ...new Set([
      ...data.production.map((r) => r.crop),
      ...(data.scenarios || []).map((r) => r.crop),
    ]),
  ].sort();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Agricultural year and season">
        <select
          className={controlClass}
          value={season}
          onChange={(e) => setSeason(e.target.value)}
        >
          {periods.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </Field>
      <Field label="Province">
        <select
          className={controlClass}
          value={scope.province}
          onChange={(e) =>
            setScope({ ...scope, province: e.target.value, district: "ALL" })
          }
        >
          <option value="ALL">All provinces</option>
          {[...new Set(Object.values(DISTRICT_PROVINCES))].sort().map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </Field>
      <Field label="District">
        <select
          className={controlClass}
          value={scope.district}
          onChange={(e) => setScope({ ...scope, district: e.target.value })}
        >
          <option value="ALL">All districts</option>
          {Object.keys(DISTRICT_PROVINCES)
            .filter(
              (d) =>
                scope.province === "ALL" ||
                DISTRICT_PROVINCES[d] === scope.province,
            )
            .sort()
            .map((d) => (
              <option key={d}>{d}</option>
            ))}
        </select>
      </Field>
      <Field label="Crop or commodity">
        <select
          className={controlClass}
          value={scope.crop}
          onChange={(e) => setScope({ ...scope, crop: e.target.value })}
        >
          <option value="ALL">All recorded crops</option>
          {crops.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label="Facility type">
        <select
          className={controlClass}
          value={scope.facilityType}
          onChange={(e) => setScope({ ...scope, facilityType: e.target.value })}
        >
          <option value="ALL">All facility types</option>
          {[...new Set(data.facilities.map((f) => f.facility_type))]
            .sort()
            .map((t) => (
              <option key={t}>{t}</option>
            ))}
        </select>
      </Field>
      <Field label="Comparison season">
        <select
          className={controlClass}
          value={compare}
          onChange={(e) => setCompare(e.target.value)}
        >
          <option value="">No comparison</option>
          {periods
            .filter((p) => p !== season)
            .map((p) => (
              <option key={p}>{p}</option>
            ))}
        </select>
      </Field>
      {exportMode && (
        <Field label="Export destination">
          <select
            className={controlClass}
            disabled
            aria-describedby="destination-coverage"
          >
            <option>No verified destination records</option>
          </select>
          <span id="destination-coverage" className="font-normal text-xs">
            Generated destination lists are excluded.
          </span>
        </Field>
      )}
    </div>
  );
}
export function FacilityDirectory({ facilities }: { facilities: Facility[] }) {
  const [open, setOpen] = useState("");
  const f = facilities.find((f) => f.id === open);
  return (
    <div className="space-y-4">
      <FacilityLocationMap
        facilities={facilities}
        selected={open}
        onSelect={setOpen}
      />
      <DataTable
        label="facility directory"
        columns={[
          "Name",
          "District",
          "Type",
          "Commodities",
          "Storage (tonnes)",
          "Processing (tonnes/day)",
          "Status as stored",
        ]}
        rows={facilities.map((f) => [
          f.name,
          f.district,
          f.facility_type,
          facilityCommodities(f).join(", ") || null,
          f.storage,
          f.processing,
          f.status,
        ])}
      />
      <label className="block text-sm font-semibold text-slate-700">
        Open facility details
        <select
          className={controlClass + " mt-2"}
          aria-label="Open facility details"
          value={open}
          onChange={(e) => setOpen(e.target.value)}
        >
          <option value="">Select a facility</option>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </label>
      {f && (
        <div className="rounded-xl border border-cyan-100 bg-cyan-50/40 p-4 text-sm leading-relaxed">
          <h3 className="font-bold">{f.name}</h3>
          <p>
            {f.district} | {f.facility_type} | Status as stored:{" "}
            {f.status || "Not recorded"}
          </p>
          <p>
            Storage: {format(f.storage)} tonnes | Processing:{" "}
            {format(f.processing)} tonnes/day
          </p>
          <p>
            Cold storage: {format(f.cold)} tonnes | Drying: {format(f.drying)}{" "}
            tonnes/day
          </p>
          <p>
            Verification date as stored: {f.last_verified_at || "Not recorded"}{" "}
            | Source: {f.source_name || f.dataset_name || "Not linked"}
          </p>
          <p>Evidence: {f.evidence}. No seasonal attribution is recorded.</p>
          {f.latitude != null && f.longitude != null ? (
            <a
              className="inline-flex min-h-11 items-center font-semibold text-cyan-900 underline"
              target="_blank"
              rel="noreferrer"
              href={`https://www.openstreetmap.org/?mlat=${Number(f.latitude)}&mlon=${Number(f.longitude)}#map=14/${Number(f.latitude)}/${Number(f.longitude)}`}
            >
              View recorded coordinates on OpenStreetMap
            </a>
          ) : (
            <p>Location coordinates are not recorded.</p>
          )}
        </div>
      )}
    </div>
  );
}
export function LoadState({
  error,
  retry,
  label,
}: {
  error: boolean;
  retry: () => void;
  label: string;
}) {
  return (
    <div
      className="rounded-2xl border border-emerald-100 bg-white p-6"
      role={error ? "alert" : "status"}
    >
      <h2 className="text-xl font-bold">
        {error
          ? label + " data could not be loaded"
          : "Loading " + label.toLowerCase() + " evidence..."}
      </h2>
      {error && (
        <button className={buttonClass + " mt-4"} onClick={retry}>
          Retry {label.toLowerCase()} data
        </button>
      )}
    </div>
  );
}
export const facilityColumns = [
  "Name",
  "District",
  "Type",
  "Commodities",
  "Storage (tonnes)",
  "Processing (tonnes/day)",
  "Status as stored",
  "Longitude",
  "Latitude",
  "Verification date",
  "Source",
  "Evidence",
  "Season attribution",
];
export const facilityCsv = (facilities: Facility[]) =>
  facilities.map((f) => [
    f.name,
    f.district,
    f.facility_type,
    facilityCommodities(f).join("; "),
    f.storage,
    f.processing,
    f.status,
    f.longitude,
    f.latitude,
    f.last_verified_at,
    f.source_name || f.dataset_name,
    f.evidence,
    null,
  ]);
