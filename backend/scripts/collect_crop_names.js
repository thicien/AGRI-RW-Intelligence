const xlsx = require('xlsx');
const path = require('path');

const sampleFiles = [
  '2025/Tables_2025 Season A.xlsx',
  '2024/Tables_2024 Season A (1).xlsx',
  '2023/SAS 2023_Annual Tables (3).xlsx',
  '2022/SAS 2022_Tables_0.xlsx',
  '2021/SAS 2021_Tables.xlsx',
  '2020/USAS 2020 _Final_Tables.xlsx',
  '2019/SAS 2019 _Annual report _Tables.xlsx',
  '2018/2018 Annual Tables_Final (1).xlsx',
];

const cropNames = new Set();

for (const rel of sampleFiles) {
  const fp = path.resolve(__dirname, `../../data/agriculture/${rel}`);
  const wb = xlsx.readFile(fp);
  for (const s of wb.SheetNames) {
    const ws = wb.Sheets[s];
    const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
    // Look for row where first cell is District or null and second cell has Maize
    for (let r = 0; r < Math.min(8, rows.length); r++) {
      const row = rows[r] || [];
      const rowStr = row.filter(Boolean).map(x => String(x).trim().toLowerCase()).join(' ');
      if (rowStr.includes('maize') || rowStr.includes('cassava') || rowStr.includes('paddy rice')) {
        for (const cell of row) {
          if (cell && typeof cell === 'string') {
            const clean = cell.trim();
            if (clean.length > 2 && !clean.toLowerCase().includes('district') && !clean.toLowerCase().includes('stratum') && !clean.toLowerCase().includes('total') && !clean.toLowerCase().includes('table')) {
              cropNames.add(clean);
            }
          }
        }
      }
    }
  }
}

console.log('All crop names discovered in NISR sheets:');
console.log(Array.from(cropNames).sort());
