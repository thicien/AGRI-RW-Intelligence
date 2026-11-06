export function publicCsv(rows: unknown[][]): string {
  return (
    "\ufeff" +
    rows
      .map((row) =>
        row
          .map((value) => {
            let text =
              value === null || value === undefined ? "" : String(value);
            if (typeof value !== "number" && /^[\s]*[=+@-]/.test(text))
              text = "'" + text;
            return '"' + text.replaceAll('"', '""') + '"';
          })
          .join(","),
      )
      .join("\r\n")
  );
}
export function downloadPublicCsv(name: string, rows: unknown[][]) {
  const url = URL.createObjectURL(
    new Blob([publicCsv(rows)], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
