export interface ProductionRecord {
  season_code: string;
  year: number;
  crop: string;
  district: string;
  province: string;
  production: number | null;
  area: number | null;
  harvested: number | null;
  source_name?: string | null;
  source_provider?: string | null;
  dataset_name?: string | null;
  dataset_version?: string | null;
}
export interface ProductionScope {
  province: string;
  district: string;
  crop: string;
}
export function numeric(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 ? result : null;
}
export function selectRecords(
  records: ProductionRecord[],
  scope: ProductionScope,
  season?: string,
) {
  return records.filter(
    (r) =>
      (!season || r.season_code === season) &&
      (scope.province === "ALL" || r.province === scope.province) &&
      (scope.district === "ALL" || r.district === scope.district) &&
      (scope.crop === "ALL" || r.crop === scope.crop),
  );
}
export function summarize(records: ProductionRecord[]) {
  const sum = (key: "production" | "area") => {
    const values = records
      .map((r) => r[key])
      .filter((v): v is number => v !== null);
    return values.length ? values.reduce((a, b) => a + b, 0) : null;
  };
  const paired = records.filter(
    (r) => r.production !== null && r.harvested !== null && r.harvested > 0,
  );
  const denominator = paired.reduce((s, r) => s + r.harvested!, 0);
  return {
    production: sum("production"),
    area: sum("area"),
    yield:
      denominator > 0
        ? paired.reduce((s, r) => s + r.production!, 0) / denominator
        : null,
    crops: records.length ? new Set(records.map((r) => r.crop)).size : null,
    records: records.length,
    partial: records.some(
      (r) => r.production === null || r.area === null || r.harvested === null,
    ),
  };
}
export function groupRecords(
  records: ProductionRecord[],
  key: "crop" | "district" | "season_code",
) {
  const grouped = new Map<string, ProductionRecord[]>();
  records.forEach((r) => {
    const bucket = grouped.get(r[key]);
    if (bucket) bucket.push(r);
    else grouped.set(r[key], [r]);
  });
  return [...grouped].map(([name, rows]) => ({ name, ...summarize(rows) }));
}
export function percentChange(current: number | null, previous: number | null) {
  return current === null || previous === null || previous === 0
    ? null
    : ((current - previous) / previous) * 100;
}
