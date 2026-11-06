export type IrrigationCategory = "ALL" | "modern" | "traditional";
export type IrrigationMetric = "irrigated" | "coverage";
export interface IrrigationScope {
  province: string;
  district: string;
  crop: string;
  category: IrrigationCategory;
}
export interface IrrigationRecord {
  id?: string;
  district: string;
  province: string;
  season_code: string;
  year: number;
  irrigated: number | null;
  cultivated: number | null;
  modern: number | null;
  traditional: number | null;
  methods: Record<string, unknown> | null;
  evidence: "MODELLED" | "UNVERIFIED";
  source_reference?: string | null;
  source_name?: string | null;
  dataset_name?: string | null;
  dataset_version?: string | null;
}
export interface IrrigationProductionRecord {
  district: string;
  province: string;
  season_code: string;
  year: number;
  crop: string;
  irrigated: number | null;
  area: number | null;
  production: number | null;
  harvested: number | null;
  quality_status?: string | null;
  source_name?: string | null;
  dataset_name?: string | null;
  dataset_version?: string | null;
}
export interface IrrigationScheme {
  id: string;
  name: string;
  district: string;
  province: string;
  type: string | null;
  method: string | null;
  command_area: number | null;
  irrigable_area: number | null;
  longitude: number | null;
  latitude: number | null;
  status: string | null;
  last_verified_at: string | null;
  source_name?: string | null;
  dataset_name?: string | null;
}
export interface IrrigationPayload {
  records: IrrigationRecord[];
  production: IrrigationProductionRecord[];
  schemes: IrrigationScheme[];
  schemeSeasons: { id: string; season_code: string }[];
  methodology: Record<string, string>;
}
export interface IrrigationObservation {
  district: string;
  province: string;
  season_code: string;
  irrigated: number | null;
  cultivated: number | null;
  evidence: string;
  source: string;
  methods: Record<string, unknown> | null;
}
export const irrigationNumber = (value: unknown): number | null => {
  if (
    value === null ||
    value === undefined ||
    typeof value === "boolean" ||
    String(value).trim() === ""
  )
    return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
export function inIrrigationGeography(
  row: { district: string; province: string },
  scope: Pick<IrrigationScope, "district" | "province">,
) {
  return (
    (scope.district === "ALL" || row.district === scope.district) &&
    (scope.province === "ALL" || row.province === scope.province)
  );
}
export function irrigationObservations(
  payload: IrrigationPayload,
  scope: IrrigationScope,
  season: string,
): IrrigationObservation[] {
  if (scope.crop !== "ALL" && scope.category !== "ALL") return [];
  if (scope.crop !== "ALL")
    return payload.production
      .filter(
        (r) =>
          r.crop === scope.crop &&
          r.season_code === season &&
          inIrrigationGeography(r, scope),
      )
      .map((r) => ({
        district: r.district,
        province: r.province,
        season_code: r.season_code,
        irrigated: r.irrigated,
        cultivated: r.area,
        evidence: "CROP_RECORD",
        methods: null,
        source:
          [r.source_name, r.dataset_name, r.dataset_version]
            .filter(Boolean)
            .join(" / ") ||
          "AgriLens crop_statistics; original source metadata unavailable",
      }));
  return payload.records
    .filter((r) => r.season_code === season && inIrrigationGeography(r, scope))
    .map((r) => ({
      district: r.district,
      province: r.province,
      season_code: r.season_code,
      irrigated: scope.category === "ALL" ? r.irrigated : r[scope.category],
      cultivated: r.cultivated,
      evidence: r.evidence,
      methods: scope.category === "ALL" ? r.methods : null,
      source:
        [r.source_reference, r.source_name, r.dataset_name, r.dataset_version]
          .filter(Boolean)
          .join(" / ") ||
        "AgriLens irrigation_season_statistics; original source metadata unavailable",
    }));
}
export function summarizeIrrigation(
  rows: IrrigationObservation[],
  category: IrrigationCategory = "ALL",
) {
  const measured = rows.filter((r) => r.irrigated !== null);
  const compatible = rows.filter(
    (r) =>
      r.irrigated !== null &&
      r.cultivated !== null &&
      r.cultivated >= r.irrigated,
  );
  const denominator = compatible.reduce((s, r) => s + r.cultivated!, 0);
  const values = (key: "irrigated" | "cultivated") => {
    const available = rows
      .map((r) => r[key])
      .filter((v): v is number => v !== null);
    return available.length ? available.reduce((a, b) => a + b, 0) : null;
  };
  return {
    irrigated: values("irrigated"),
    cultivated: values("cultivated"),
    pairedIrrigated: compatible.length
      ? compatible.reduce((sum, row) => sum + row.irrigated!, 0)
      : null,
    coverage:
      denominator > 0
        ? (compatible.reduce((s, r) => s + r.irrigated!, 0) / denominator) * 100
        : null,
    nonIrrigated:
      category === "ALL" && compatible.length
        ? compatible.reduce((s, r) => s + r.cultivated! - r.irrigated!, 0)
        : null,
    districts: measured.length
      ? new Set(measured.map((r) => r.district)).size
      : null,
    pairedDistricts: new Set(compatible.map((r) => r.district)).size,
    modelled: rows.filter((r) => r.evidence === "MODELLED").length,
    incompatible: rows.filter(
      (r) =>
        r.irrigated !== null &&
        r.cultivated !== null &&
        r.irrigated > r.cultivated,
    ).length,
    partial:
      measured.length !== rows.length ||
      rows.some((r) => r.cultivated === null),
    records: rows.length,
  };
}
export function irrigationDistricts(
  rows: IrrigationObservation[],
  category: IrrigationCategory = "ALL",
) {
  const groups = new Map<string, IrrigationObservation[]>();
  rows.forEach((r) => {
    const bucket = groups.get(r.district);
    if (bucket) bucket.push(r);
    else groups.set(r.district, [r]);
  });
  return [...groups].map(([name, records]) => ({
    name,
    province: records[0].province,
    ...summarizeIrrigation(records, category),
  }));
}
export function irrigationChange(
  current: number | null,
  previous: number | null,
) {
  return current === null || previous === null || previous === 0
    ? null
    : ((current - previous) / previous) * 100;
}
export function coverageChange(
  current: number | null,
  previous: number | null,
) {
  return current === null || previous === null ? null : current - previous;
}
export function irrigationMethods(rows: IrrigationObservation[]) {
  const grouped = new Map<string, { district: string; value: number }[]>();
  let incomplete = 0;
  rows.forEach((r) => {
    let total = 0,
      count = 0;
    Object.entries(r.methods || {}).forEach(([key, raw]) => {
      const value = irrigationNumber(raw);
      if (!key.endsWith("_pct") || value === null || value > 100) return;
      const bucket = grouped.get(key) || [];
      bucket.push({ district: r.district, value });
      grouped.set(key, bucket);
      total += value;
      count++;
    });
    if (count && Math.abs(total - 100) > 0.1) incomplete++;
  });
  return {
    incomplete,
    methods: [...grouped].map(([key, values]) => ({
      key,
      name: key.replace(/_pct$/, "").replaceAll("_", " "),
      minimum: Math.min(...values.map((v) => v.value)),
      maximum: Math.max(...values.map((v) => v.value)),
      districts: new Set(values.map((v) => v.district)).size,
    })),
  };
}
export function seasonalSchemeCount(
  payload: IrrigationPayload,
  scope: IrrigationScope,
  season: string,
) {
  if (scope.crop !== "ALL" || scope.category !== "ALL") return null;
  const ids = new Set(
    payload.schemes
      .filter((r) => inIrrigationGeography(r, scope))
      .map((r) => r.id),
  );
  const linked = new Set(
    payload.schemeSeasons
      .filter((r) => r.season_code === season && ids.has(r.id))
      .map((r) => r.id),
  );
  return linked.size || null;
}
