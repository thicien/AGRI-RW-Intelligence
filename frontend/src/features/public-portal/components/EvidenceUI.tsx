import { useState, Children, isValidElement, cloneElement } from "react";
import type { ReactNode, ReactElement } from "react";
import ResponsiveTable from "../../../components/ResponsiveTable";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { downloadPublicCsv } from "../publicDownloads";
export const controlClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500";
export const buttonClass =
  "min-h-11 rounded-xl border border-cyan-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-900 hover:bg-cyan-50 focus-visible:ring-2 focus-visible:ring-cyan-500";
export const number = (n: unknown): number | null =>
  n === null ||
  n === undefined ||
  n === "" ||
  typeof n === "boolean" ||
  !Number.isFinite(Number(n)) ||
  Number(n) < 0
    ? null
    : Number(n);
export const format = (n: unknown) =>
  n === null ||
  n === undefined ||
  n === "" ||
  typeof n === "boolean" ||
  !Number.isFinite(Number(n))
    ? "Not available"
    : Number(n).toLocaleString("en-GB", { maximumFractionDigits: 2 });
export function sum(values: unknown[]): number | null {
  const a = values.map(number).filter((v): v is number => v !== null);
  return a.length ? a.reduce((s, v) => s + v, 0) : null;
}
export function Panel({
  id,
  title,
  note,
  children,
}: {
  id?: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="min-w-0 scroll-mt-24 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-6"
    >
      <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
      {note && (
        <p className="mb-5 mt-2 text-sm leading-relaxed text-slate-600">
          {note}
        </p>
      )}
      <div className="mt-4 min-w-0">{children}</div>
    </section>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
      {children}
    </p>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold text-slate-700">
      {label}
      {Children.map(children, (child) =>
        isValidElement(child) &&
        (child.type === "select" || child.type === "input")
          ? cloneElement(child as ReactElement<Record<string, unknown>>, {
              "aria-label": label,
            })
          : child,
      )}
    </label>
  );
}
export function Stats({
  items,
}: {
  items: { label: string; value: string; detail?: string }[];
}) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4">
      {items.map((i) => (
        <div
          key={i.label}
          className="min-w-0 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            {i.label}
          </p>
          <p className="my-2 break-words text-2xl font-bold text-emerald-950">
            {i.value}
          </p>
          {i.detail && (
            <p className="text-xs leading-relaxed text-slate-600">{i.detail}</p>
          )}
        </div>
      ))}
    </div>
  );
}
export function DataTable({
  columns,
  rows,
  label,
  searchable = true,
}: {
  columns: string[];
  rows: (string | number | null | undefined)[][];
  label: string;
  searchable?: boolean;
}) {
  const [query, setQuery] = useState(""),
    [sort, setSort] = useState<{ index: number; asc: boolean }>({
      index: 0,
      asc: true,
    }),
    [limit, setLimit] = useState(30);
  const visible = rows
    .filter((r) =>
      r.some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    )
    .sort((a, b) => {
      const x = a[sort.index],
        y = b[sort.index];
      if (x == null) return y == null ? 0 : 1;
      if (y == null) return -1;
      return (
        (typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y), undefined, { numeric: true })) *
        (sort.asc ? 1 : -1)
      );
    });
  return (
    <div className="space-y-3">
      {searchable && (
        <label className="block max-w-md text-sm text-slate-600">
          Search {label}
          <input
            className={controlClass + " mt-1"}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(30);
            }}
          />
        </label>
      )}
      <ResponsiveTable aria-label={label} className="w-full text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((c, i) => (
              <th
                key={c}
                scope="col"
                aria-sort={
                  sort.index === i
                    ? sort.asc
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className="px-3 py-2"
              >
                <button
                  className="min-h-11 text-left font-semibold"
                  onClick={() =>
                    setSort({
                      index: i,
                      asc: sort.index === i ? !sort.asc : true,
                    })
                  }
                >
                  {c}{" "}
                  <span aria-hidden="true">
                    {sort.index === i ? (sort.asc ? "Asc" : "Desc") : "Sort"}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.slice(0, limit).map((r, i) => (
            <tr key={i} className="border-t border-slate-100">
              {r.map((v, j) => (
                <td
                  key={j}
                  className="max-w-sm px-3 py-3 align-top [overflow-wrap:anywhere]"
                >
                  {v == null
                    ? "Not available"
                    : typeof v === "number"
                      ? format(v)
                      : v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </ResponsiveTable>
      {!visible.length && (
        <p className="p-4 text-sm text-slate-500">
          No matching records. Missing records do not mean zero.
        </p>
      )}
      <p className="text-xs text-slate-500">
        {Math.min(limit, visible.length)} of {visible.length} matching rows
      </p>
      {visible.length > limit && (
        <button className={buttonClass} onClick={() => setLimit(limit + 50)}>
          Show more records
        </button>
      )}
    </div>
  );
}
export function Chart({
  rows,
  unit,
  line = false,
}: {
  rows: { name: string; value: number | null }[];
  unit: string;
  line?: boolean;
}) {
  if (!rows.some((r) => r.value !== null))
    return (
      <p className="py-8 text-sm text-slate-500">
        No compatible measurements are available for this chart.
      </p>
    );
  return (
    <div
      className="h-72 min-w-0 w-full"
      role="img"
      aria-label={
        (line ? "Seasonal trend" : "Ranking") +
        " in " +
        unit +
        ". Exact values are in the accompanying table."
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        {line ? (
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis width={65} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [format(v), unit]} />
            <Line
              dataKey="value"
              stroke="#0e7490"
              strokeWidth={2}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        ) : (
          <BarChart
            data={rows.slice(0, 15)}
            layout="vertical"
            margin={{ left: 12, right: 16 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tick={{ fontSize: 11 }}
            />
            <Tooltip formatter={(v) => [format(v), unit]} />
            <Bar
              dataKey="value"
              fill="#0e7490"
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
export function CsvButton({
  name,
  columns,
  rows,
  label,
}: {
  name: string;
  columns: string[];
  rows: unknown[][];
  label: string;
}) {
  return (
    <button
      className={buttonClass}
      onClick={() => downloadPublicCsv(name, [columns, ...rows])}
    >
      {label}
    </button>
  );
}
export function ChartExport({
  id,
  name,
  available = true,
}: {
  id: string;
  name: string;
  available?: boolean;
}) {
  return (
    <button
      className={buttonClass}
      disabled={!available}
      title={
        available
          ? "Download chart as SVG"
          : "No chart is available for the selected filters"
      }
      onClick={() => {
        const element = document
          .getElementById(id)
          ?.querySelector("svg.recharts-surface");
        if (!element) return;
        const svg = element.cloneNode(true) as SVGElement;
        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        const url = URL.createObjectURL(
          new Blob([new XMLSerializer().serializeToString(svg)], {
            type: "image/svg+xml",
          }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = name + ".svg";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}
    >
      Export chart (SVG)
    </button>
  );
}
