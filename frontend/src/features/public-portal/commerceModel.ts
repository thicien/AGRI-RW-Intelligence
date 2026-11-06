export interface ProductionRow {
  source_name?: string | null;
  dataset_name?: string | null;
  quality_status?: string | null;
  district: string;
  province: string;
  season_code: string;
  crop: string;
  production: number | null;
  area: number | null;
}
export interface Facility {
  id: string;
  name: string;
  district: string;
  province: string;
  facility_type: string;
  status: string | null;
  storage: number | null;
  processing: number | null;
  cold: number | null;
  drying: number | null;
  commodities: unknown;
  export_role: string | null;
  longitude: number | null;
  latitude: number | null;
  last_verified_at: string | null;
  source_name: string | null;
  dataset_name: string | null;
  evidence: string;
}
export interface SeasonalStorage {
  id: string;
  district: string;
  province: string;
  season_code: string;
  storage: number | null;
  processing: number | null;
  cold: number | null;
  drying: number | null;
  facilities: number | null;
  loss_pct: number | null;
  evidence: string;
  sources: string[] | null;
}
export interface TradeScenario {
  id: string;
  season_code: string;
  crop: string;
  quantity: number | null;
  value: number | null;
  currency: string;
  evidence: string;
  category?: string;
  hs_code?: string;
  reference_destinations?: string[];
  peak_months?: string[];
  import_quantity?: number | null;
  import_value?: number | null;
  modelled_production?: number | null;
}
export interface CommercePayload {
  production: ProductionRow[];
  facilities: Facility[];
  records?: SeasonalStorage[];
  scenarios?: TradeScenario[];
  supply?: {
    district: string;
    province: string;
    season_code: string;
    estimated_supply: number | null;
    profile_crops?: string[];
    modelled_surplus?: number | null;
    reference_exit_hub?: string;
    modelled_distance_km?: number | null;
    evidence: string;
  }[];
  actualExports?: unknown[];
  destinations?: unknown[];
  methodology: Record<string, string>;
}
export interface CommerceScope {
  district: string;
  province: string;
  crop: string;
  facilityType: string;
}
export function finiteNumber(v: unknown): number | null {
  return v === null ||
    v === undefined ||
    v === "" ||
    typeof v === "boolean" ||
    !Number.isFinite(Number(v)) ||
    Number(v) < 0
    ? null
    : Number(v);
}
export function total(v: unknown[]): number | null {
  const a = v.map(finiteNumber).filter((n): n is number => n !== null);
  return a.length ? a.reduce((x, y) => x + y, 0) : null;
}
export function sameProvince(a: string, b: string) {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace("city of kigali", "kigali")
      .replace("kigali city", "kigali")
      .replace(" province", "")
      .trim();
  return normalize(a) === normalize(b);
}
export function inGeography(
  r: { district: string; province: string },
  s: CommerceScope,
) {
  return (
    (s.district === "ALL" || r.district === s.district) &&
    (s.province === "ALL" || sameProvince(r.province, s.province))
  );
}
export function productionRows(
  data: CommercePayload,
  scope: CommerceScope,
  period: string,
) {
  return scope.facilityType !== "ALL"
    ? []
    : data.production.filter(
        (r) =>
          r.season_code === period &&
          inGeography(r, scope) &&
          (scope.crop === "ALL" || r.crop === scope.crop),
      );
}
export function facilityCommodities(f: Facility): string[] {
  return Array.isArray(f.commodities)
    ? f.commodities.filter((v): v is string => typeof v === "string")
    : [];
}
export function registryRows(data: CommercePayload, scope: CommerceScope) {
  return data.facilities.filter(
    (f) =>
      inGeography(f, scope) &&
      (scope.facilityType === "ALL" ||
        f.facility_type === scope.facilityType) &&
      (scope.crop === "ALL" ||
        facilityCommodities(f).some(
          (c) => c.toLowerCase() === scope.crop.toLowerCase(),
        )),
  );
}
export function storageRows(
  data: CommercePayload,
  scope: CommerceScope,
  period: string,
) {
  return scope.crop !== "ALL" || scope.facilityType !== "ALL"
    ? []
    : (data.records || []).filter(
        (r) => r.season_code === period && inGeography(r, scope),
      );
}
export function tradeRows(
  data: CommercePayload,
  scope: CommerceScope,
  period: string,
) {
  return scope.district !== "ALL" ||
    scope.province !== "ALL" ||
    scope.facilityType !== "ALL"
    ? []
    : (data.scenarios || []).filter(
        (r) =>
          r.season_code === period &&
          (scope.crop === "ALL" || r.crop === scope.crop),
      );
}
export function groupProduction(
  rows: ProductionRow[],
  key: "district" | "crop",
) {
  return [...new Set(rows.map((r) => r[key]))]
    .map((name) => ({
      name,
      value: total(
        rows.filter((r) => r[key] === name).map((r) => r.production),
      ),
    }))
    .sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
}
export function percentDifference(current: unknown, previous: unknown) {
  const a = finiteNumber(current),
    b = finiteNumber(previous);
  return a === null || b === null || b === 0 ? null : ((a - b) / b) * 100;
}

export function coordinate(
  value: unknown,
  axis: "latitude" | "longitude",
): number | null {
  if (
    value === null ||
    value === undefined ||
    typeof value === "boolean" ||
    String(value).trim() === ""
  )
    return null;
  const n = Number(value),
    limit = axis === "latitude" ? 90 : 180;
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}
