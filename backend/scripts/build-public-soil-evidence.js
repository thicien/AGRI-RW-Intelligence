/* Read original workbooks and audit PDFs. Never writes to the database. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const xlsx = require('xlsx');
const { PDFParse } = require('pdf-parse');
const root = path.resolve(__dirname, '../../data/agriculture');
const districts =
  'Nyarugenge Gasabo Kicukiro Nyanza Gisagara Nyaruguru Huye Nyamagabe Ruhango Muhanga Kamonyi Karongi Rutsiro Rubavu Nyabihu Ngororero Rusizi Nyamasheke Rulindo Gakenke Musanze Burera Gicumbi Rwamagana Nyagatare Gatsibo Kayonza Kirehe Ngoma Bugesera'.split(
    ' ',
  );
const canonical = new Map(districts.map((d) => [d.toLowerCase(), d]));
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
    );
}
function periods(text, year) {
  const codes = [
    ...text.matchAll(
      /(?:season\s*([ABC])\s*[_ -]*(20\d\d)|(20\d\d)\s*[_ -]*season\s*([ABC]))/gi,
    ),
  ].map((m) => (m[2] || m[3]) + (m[1] || m[4]).toUpperCase());
  if (!codes.length && /season\s*[ABC]/i.test(text)) {
    const m = text.match(/season\s*([ABC])/i);
    codes.push(year + m[1].toUpperCase());
  }
  return [...new Set(codes)];
}
(async () => {
  const records = [],
    audit = [];
  for (const file of walk(root)
    .filter((f) => /\.(xlsx?|pdf)$/i.test(f))
    .sort()) {
    const source = path.relative(root, file).replaceAll('\\', '/'),
      year = source.match(/20\d\d/)?.[0] || '';
    const sha256 = crypto
      .createHash('sha256')
      .update(fs.readFileSync(file))
      .digest('hex');
    try {
      if (/\.pdf$/i.test(file)) {
        const parser = new PDFParse({ data: fs.readFileSync(file) });
        const text = await parser.getText();
        await parser.destroy();
        const hits = text.text
          .split(/\r?\n/)
          .filter((l) => /fertili[sz]|erosion|soil|agroforestry/i.test(l));
        const pdfBefore = records.length;
        const lines = text.text.split(/\r?\n/);
        const filePeriod = periods(
          text.text.slice(0, 12000) + ' ' + path.basename(file),
          year,
        );
        for (let li = 0; li < lines.length; li++) {
          const title = lines[li].trim();
          if (!/^Table\s+\d/i.test(title) || /\.{3,}/.test(title)) continue;
          let headers = [];
          if (/area under agricultural practices/i.test(title))
            headers = [
              'Modern irrigated agricultural land',
              'Agricultural area under erosion control',
              'Agricultural area under agroforestry trees',
              'Agricultural area under inorganic fertilizer',
              'Agricultural area under organic fertilizer',
            ];
          else if (/degree of erosion.*district/i.test(title))
            headers = [
              'Severe erosion (plots)',
              'Moderate erosion (plots)',
              'Low erosion (plots)',
              'Very low erosion (plots)',
            ];
          else if (/use of (?:in)?organic fertili[sz]er.*district/i.test(title))
            headers = [
              'Farmers - Overall',
              'Farmers - SSF',
              'Farmers - LSF',
              'Plots - Overall',
              'Plots - SSF',
              'Plots - LSF',
              'Land size - Overall',
              'Land size - SSF',
              'Land size - LSF',
            ];
          if (!headers.length) continue;
          const headingLines = [];
          for (let hi = li + 1; hi < Math.min(lines.length, li + 40); hi++) {
            if (/^Table\s+\d/i.test(lines[hi].trim())) break;
            if (
              [...canonical.keys()].some((d) =>
                new RegExp('^' + d + '\\s', 'i').test(lines[hi].trim()),
              )
            )
              break;
            headingLines.push(lines[hi]);
          }
          const heading = headingLines.join(' ');
          if (headers.length === 4 && !/very\s*low/i.test(heading)) continue;
          if (
            headers.length === 5 &&
            (!/modern.*irrig/i.test(heading) ||
              !/agroforestry/i.test(heading) ||
              !/\bHa\b|hectares/i.test(heading))
          )
            continue;
          if (
            headers.length === 9 &&
            (!/SSF/i.test(heading) ||
              !/LSF/i.test(heading) ||
              !/plots/i.test(heading) ||
              !/land/i.test(heading))
          )
            continue;

          const known = periods(title, year);
          const season =
            known.length === 1
              ? known[0]
              : filePeriod.length === 1
                ? filePeriod[0]
                : null;
          const sheet = title.match(/^Table\s+[\d.]+/i)?.[0] || title;
          let started = false;
          for (let ri = li + 1; ri < Math.min(lines.length, li + 130); ri++) {
            const line = lines[ri].trim();
            if (/^Table\s+\d/i.test(line)) break;
            const match = line.match(/^([A-Za-z]+)\s+(.+)$/);
            if (!match) continue;
            const district = canonical.get(match[1].toLowerCase());
            if (!district) {
              if (started && /^(Rwanda|Total)\b/i.test(line)) break;
              continue;
            }
            started = true;
            const tokens = match[2].trim().split(/\s+/);
            // Reject compacted rows with missing cells; do not shift SSF/LSF columns.
            if (
              tokens.length !== headers.length ||
              tokens.some((t) => !/^(-|[\d,]+(?:\.\d+)?)$/.test(t))
            )
              continue;
            headers.forEach((header, ci) => {
              if (tokens[ci] === '-') return;
              const value = Number(tokens[ci].replaceAll(',', ''));
              if (!Number.isFinite(value)) return;
              records.push({
                district,
                season_code: season,
                year: Number(year),
                indicator: title + ' | ' + header,
                header,
                value,
                unit: /area under/i.test(title)
                  ? /000\s*(?:ha|hectare)/i.test(heading)
                    ? '000 ha'
                    : 'ha'
                  : '%',
                source,
                sheet,
                cell:
                  'Extracted text line ' + (ri + 1) + ', column ' + (ci + 1),
                evidence: 'SOURCE_TABLE',
                period_note: season
                  ? 'Explicit source season'
                  : 'Season not explicit; not assigned to A, B or C',
              });
            });
          }
        }
        audit.push({
          source,
          sha256,
          format: 'PDF',
          pages: text.total,
          periods: periods(text.text.slice(0, 12000), year),
          tables: hits.slice(0, 16).map((l) => l.trim().slice(0, 180)),
          status:
            records.length > pdfBefore
              ? 'PARTIAL_STRUCTURED_EXTRACTION'
              : 'TEXT_REVIEWED_TABLE_EXTRACTION_PENDING',
          records: records.length - pdfBefore,
        });
        continue;
      }
      const workbook = xlsx.readFile(file),
        before = records.length,
        tables = [];
      for (const sheet of workbook.SheetNames) {
        const ws = workbook.Sheets[sheet];
        const rows = xlsx.utils.sheet_to_json(ws, {
          header: 1,
          defval: null,
          blankrows: true,
          range: {
            s: { r: 0, c: 0 },
            e: xlsx.utils.decode_range(ws['!ref'] || 'A1').e,
          },
        });
        const firstDistrict = rows.findIndex((r) =>
          r.some((v) =>
            canonical.has(
              String(v || '')
                .trim()
                .toLowerCase(),
            ),
          ),
        );
        if (firstDistrict < 1) continue;
        const title = rows
          .slice(0, Math.min(firstDistrict, 3))
          .flat()
          .filter((v) => typeof v === 'string')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (
          !/fertili[sz]|erosion|agroforestry|agricultural practices/i.test(
            title,
          )
        )
          continue;
        const titlePeriods = periods(title, year);
        const filePeriods = periods(path.basename(file), year);
        const known =
          titlePeriods.length === 1
            ? titlePeriods
            : filePeriods.length === 1
              ? filePeriods
              : [];
        const filled = rows.slice(0, firstDistrict).map((r) => r.slice());
        for (const merge of ws['!merges'] || [])
          if (merge.s.r < firstDistrict)
            for (
              let rr = merge.s.r;
              rr <= Math.min(merge.e.r, firstDistrict - 1);
              rr++
            )
              for (let cc = merge.s.c; cc <= merge.e.c; cc++)
                if (filled[rr]) filled[rr][cc] = rows[merge.s.r]?.[merge.s.c];
        const starts = records.length;
        for (let ri = firstDistrict; ri < rows.length; ri++) {
          const row = rows[ri],
            dc = row.findIndex((v) =>
              canonical.has(
                String(v || '')
                  .trim()
                  .toLowerCase(),
              ),
            );
          if (dc < 0) continue;
          const district = canonical.get(String(row[dc]).trim().toLowerCase());
          for (let ci = dc + 1; ci < row.length; ci++) {
            const raw = row[ci];
            if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0)
              continue;
            const headerParts = filled
              .map((r) => r[ci])
              .filter((v) => typeof v === 'string' && v.trim())
              .map((v) => v.trim())
              .filter((v) => !/^table\s|list of|summary$/i.test(v));
            const header = [...new Set(headerParts)].join(' / ');
            if (!header) continue;
            const columnPeriod = periods(header, year);
            const season =
              columnPeriod.length === 1 ? columnPeriod[0] : known[0] || null;
            const unit = /\b(ha|hectares)\b/i.test(title)
              ? 'ha'
              : /percent|%/i.test(title + header)
                ? '%'
                : 'Source unit unspecified';
            records.push({
              district,
              source_column: xlsx.utils.encode_col(ci),
              season_code: season,
              year: Number(year),
              indicator:
                title.split(/District|Percentage of farmers who/i)[0].trim() +
                ' | ' +
                header,
              header,
              value: raw,
              unit,
              source,
              sheet,
              cell: xlsx.utils.encode_cell({ r: ri, c: ci }),
              evidence: 'SOURCE_TABLE',
              period_note: season
                ? 'Explicit source season'
                : 'Season not explicit; not assigned to A, B or C',
            });
          }
        }
        if (records.length > starts)
          tables.push({
            sheet,
            title,
            periods: known,
            records: records.length - starts,
          });
      }
      audit.push({
        source,
        sha256,
        format: 'WORKBOOK',
        tables,
        status: 'PARSED',
        records: records.length - before,
      });
    } catch (e) {
      audit.push({
        source,
        sha256,
        status: 'READ_ERROR',
        error: e.message,
        records: 0,
      });
    }
  }
  // Annual compilations and individual-season workbooks may repeat a table.
  // Retain all source cells; the UI selects a specific source table before comparisons.
  const seriesMap = new Map();
  const cells = records.map((r) => {
    const key = [
      r.source,
      r.sheet,
      r.season_code,
      r.header,
      r.source_column || '',
    ].join('|');
    const id = crypto
      .createHash('sha256')
      .update(key)
      .digest('hex')
      .slice(0, 20);
    if (!seriesMap.has(id))
      seriesMap.set(id, {
        ...r,
        id,
        district: undefined,
        value: undefined,
        cell: undefined,
      });
    return {
      series_id: id,
      district: r.district,
      value: r.value,
      cell: r.cell,
    };
  });
  const result = {
    records: cells,
    series: [...seriesMap.values()],
    audit,
    methodology:
      'Original source cells; missing and dash cells are not zero. A season is assigned only when explicitly named in the table, column or workbook. PDF text is audited but numbers are not automatically interpreted as district measurements. Duplicate publications remain separate source tables.',
  };
  const target = path.resolve(
    __dirname,
    '../src/soil-fertility/seasonal-soil-evidence.ts',
  );
  fs.writeFileSync(
    target,
    '// Generated by scripts/build-public-soil-evidence.js. Do not edit values.\nexport const seasonalSoilEvidence: {records: any[]; series: any[]; audit: any[]; methodology: string} = ' +
      JSON.stringify(result) +
      ';\n',
  );
  console.log(
    JSON.stringify({
      files: audit.length,
      records: records.length,
      districts: new Set(records.map((r) => r.district)).size,
      seasons: [
        ...new Set(records.map((r) => r.season_code).filter(Boolean)),
      ].sort(),
      errors: audit
        .filter((a) => a.status === 'READ_ERROR')
        .map((a) => ({ source: a.source, error: a.error })),
    }),
  );
})();
