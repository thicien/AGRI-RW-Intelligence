const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const agricultureDir = path.resolve(__dirname, '../../data/agriculture');

const filesToScan = [
  // 2025
  { yr: '2025', file: 'Tables_2025 Season A.xlsx', season: '2025A' },
  { yr: '2025', file: 'Tables_2025_Season_B_0.xlsx', season: '2025B' },
  { yr: '2025', file: 'SAS 2025_Annual Tables.xlsx', season: '2025C' },

  // 2024
  { yr: '2024', file: 'Tables_2024 Season A (1).xlsx', season: '2024A' },
  { yr: '2024', file: 'Tables_2024 Season B.xlsx', season: '2024B' },
  { yr: '2024', file: 'SAS 2024_Annual Tables.xlsx', season: '2024C' },

  // 2023
  { yr: '2023', file: 'SAS 2023_Annual Tables (3).xlsx', season: 'ALL' },

  // 2022
  { yr: '2022', file: 'SAS 2022_Tables_0.xlsx', season: 'ALL' },

  // 2021
  { yr: '2021', file: 'SAS 2021_Tables.xlsx', season: 'ALL' },

  // 2020
  { yr: '2020', file: 'USAS 2020 _Final_Tables.xlsx', season: 'ALL' },
];

function getSheetTitle(ws) {
  if (!ws) return '';
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const text = (rows[i] || []).filter(Boolean).map(x => String(x).trim()).join(' ');
    if (text.length > 10) return text;
  }
  return '';
}

for (const entry of filesToScan) {
  const fp = path.join(agricultureDir, entry.yr, entry.file);
  if (!fs.existsSync(fp)) continue;
  const wb = xlsx.readFile(fp);
  console.log(`\n=================== ${entry.yr} / ${entry.file} ===================`);
  
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const title = getSheetTitle(ws);
    const tLower = title.toLowerCase();

    const isDistrict = tLower.includes('district');
    const isCrop = tLower.includes('crop');

    if (isDistrict && isCrop) {
      let type = 'OTHER';
      if (tLower.includes('cultivated area') || tLower.includes('area cultivated')) type = 'CULTIVATED';
      else if (tLower.includes('harvested area') || tLower.includes('area harvested')) type = 'HARVESTED';
      else if (tLower.includes('production')) type = 'PRODUCTION';
      else if (tLower.includes('yield') && !tLower.includes('large-scale') && !tLower.includes('large scale')) type = 'YIELD';

      if (type !== 'OTHER') {
        console.log(`  [${sheetName.trim()}] (${type}): ${title.substring(0, 90)}`);
      }
    }
  }
}
