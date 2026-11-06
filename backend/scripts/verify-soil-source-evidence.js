const assert = require('node:assert/strict');
const fs = require('fs'),
  path = require('path'),
  xlsx = require('xlsx');
const text = fs.readFileSync(
  path.join(__dirname, '../src/soil-fertility/seasonal-soil-evidence.ts'),
  'utf8',
);
const data = JSON.parse(
  text
    .slice(text.indexOf('= ') + 2)
    .trim()
    .replace(/;$/, ''),
);
const series = new Map(data.series.map((s) => [s.id, s]));
const seen = new Set(),
  workbooks = new Map();
let checked = 0;
for (const row of data.records) {
  const s = series.get(row.series_id);
  assert.ok(s);
  const key = row.series_id + '|' + row.district;
  assert.ok(!seen.has(key), 'Duplicate district measurement: ' + key);
  seen.add(key);
  assert.ok(Number.isFinite(row.value) && row.value >= 0);
  if (/\.xlsx?$/i.test(s.source)) {
    if (!workbooks.has(s.source))
      workbooks.set(
        s.source,
        xlsx.readFile(
          path.resolve(__dirname, '../../data/agriculture', s.source),
        ),
      );
    const cell = workbooks.get(s.source).Sheets[s.sheet][row.cell];
    assert.equal(
      cell?.v,
      row.value,
      'Source cell mismatch: ' + s.source + ' ' + s.sheet + ' ' + row.cell,
    );
    checked++;
  }
}
assert.equal(data.audit.length, 43);
assert.ok(data.audit.every((a) => a.status !== 'READ_ERROR'));
assert.equal(new Set(data.records.map((r) => r.district)).size, 30);
const latest = data.series.find(
  (s) =>
    s.season_code === '2026B' &&
    s.header === 'Agricultural area under erosion control',
);
assert.ok(latest);
const latestRows = data.records.filter((r) => r.series_id === latest.id);
assert.equal(latestRows.length, 30);
assert.equal(latestRows.find((r) => r.district === 'Nyarugenge').value, 5214);
console.log(
  `PASS: ${checked} workbook cells match their originals; ${data.records.length} source cells; ${data.series.length} distinct series; no duplicate district values; all 43 files audited; all 30 districts represented.`,
);
