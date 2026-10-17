const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const agricultureDir = path.resolve(__dirname, '../../data/agriculture');

function getHeaders(fp, sheetName) {
  if (!fs.existsSync(fp)) return null;
  const wb = xlsx.readFile(fp);
  const ws = wb.Sheets[sheetName];
  if (!ws) return null;
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  for (let r = 0; r < Math.min(6, rows.length); r++) {
    const row = rows[r] || [];
    // If row has 'Maize' or 'District'
    const str = row.filter(Boolean).map(x => String(x).trim()).join('|');
    if (str.toLowerCase().includes('maize') || str.toLowerCase().includes('district')) {
      return { headerRow: r, cols: row.filter(Boolean).map(x => String(x).trim()) };
    }
  }
  return null;
}

const configs = [
  // 2025
  { yr: '2025', file: 'Tables_2025 Season A.xlsx', s_cult: 'Table 9', s_harv: 'Table 10', s_prod: 'Table 13', season: '2025A' },
  { yr: '2025', file: 'Tables_2025_Season_B_0.xlsx', s_cult: 'Table 9', s_harv: 'Table 10', s_prod: 'Table 13', season: '2025B' },
  { yr: '2025', file: 'SAS 2025_Annual Tables.xlsx', s_cult: 'Table 12', s_harv: 'Table 15', s_prod: 'Table 24', season: '2025C' },

  // 2024
  { yr: '2024', file: 'Tables_2024 Season A (1).xlsx', s_cult: 'Table 9', s_harv: 'Table 10', s_prod: 'Table 13', season: '2024A' },
  { yr: '2024', file: 'Tables_2024 Season B.xlsx', s_cult: 'Table 9', s_harv: 'Table 10', s_prod: 'Table 13', season: '2024B' },
  { yr: '2024', file: 'SAS 2024_Annual Tables.xlsx', s_cult: 'Table 12', s_harv: 'Table 15', s_prod: 'Table 24', season: '2024C' },

  // 2023
  { yr: '2023', file: 'SAS 2023_Annual Tables (3).xlsx', s_cult: 'Table 10', s_harv: 'Table 13', s_prod: 'Table 22', season: '2023A' },
  { yr: '2023', file: 'SAS 2023_Annual Tables (3).xlsx', s_cult: 'Table 11', s_harv: 'Table 14', s_prod: 'Table 23', season: '2023B' },
  { yr: '2023', file: 'SAS 2023_Annual Tables (3).xlsx', s_cult: 'Table 12', s_harv: 'Table 15', s_prod: 'Table 24', season: '2023C' },

  // 2022
  { yr: '2022', file: 'SAS 2022_Tables_0.xlsx', s_cult: 'Table 11', s_harv: 'Table 14', s_prod: 'Table 23', season: '2022A' },
  { yr: '2022', file: 'SAS 2022_Tables_0.xlsx', s_cult: 'Table 12', s_harv: 'Table 15', s_prod: 'Table 24', season: '2022B' },
  { yr: '2022', file: 'SAS 2022_Tables_0.xlsx', s_cult: 'Table 13', s_harv: 'Table 16', s_prod: 'Table 25', season: '2022C' },

  // 2021
  { yr: '2021', file: 'SAS 2021_Tables.xlsx', s_cult: 'Table 11', s_harv: 'Table 14', s_prod: 'Table 24', season: '2021A' },
  { yr: '2021', file: 'SAS 2021_Tables.xlsx', s_cult: 'Table 12', s_harv: 'Table 15', s_prod: 'Table 25', season: '2021B' },
  { yr: '2021', file: 'SAS 2021_Tables.xlsx', s_cult: 'Table 13', s_harv: 'Table 16', s_prod: 'Table 26', season: '2021C' },

  // 2020
  { yr: '2020', file: 'USAS 2020 _Final_Tables.xlsx', s_cult: 'Table 8', s_harv: 'Table 11', s_prod: 'Table 20', season: '2020A' },
  { yr: '2020', file: 'USAS 2020 _Final_Tables.xlsx', s_cult: 'Table 9', s_harv: 'Table 12', s_prod: 'Table 21', season: '2020B' },
  { yr: '2020', file: 'USAS 2020 _Final_Tables.xlsx', s_cult: 'Table 10', s_harv: 'Table 13', s_prod: 'Table 22', season: '2020C' },
];

for (const c of configs) {
  const fp = path.join(agricultureDir, c.yr, c.file);
  const hCult = getHeaders(fp, c.s_cult);
  const hHarv = getHeaders(fp, c.s_harv);
  const hProd = getHeaders(fp, c.s_prod);
  console.log(`\nConfig [${c.season}] ${c.file}:`);
  console.log(`  Cult (${c.s_cult}):`, hCult ? hCult.cols.slice(0, 8) : 'NOT FOUND');
  console.log(`  Harv (${c.s_harv}):`, hHarv ? hHarv.cols.slice(0, 8) : 'NOT FOUND');
  console.log(`  Prod (${c.s_prod}):`, hProd ? hProd.cols.slice(0, 8) : 'NOT FOUND');
}
