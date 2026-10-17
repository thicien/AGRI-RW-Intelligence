const xlsx = require('xlsx');
const path = require('path');

function getSmartTitle(ws) {
  if (!ws) return '';
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  for (let i = 0; i < Math.min(8, rows.length); i++) {
    const text = (rows[i] || []).filter(Boolean).map(x => String(x).trim()).join(' ');
    if (text.toLowerCase().includes('cultivated area') || text.toLowerCase().includes('harvested area') || text.toLowerCase().includes('production') || text.toLowerCase().includes('average yield')) {
      return text;
    }
  }
  return '';
}

for (const yr of ['2022', '2021', '2020']) {
  const f = yr === '2020' ? 'USAS 2020 _Final_Tables.xlsx' : yr === '2022' ? 'SAS 2022_Tables_0.xlsx' : 'SAS 2021_Tables.xlsx';
  const wb = xlsx.readFile(path.resolve(__dirname, `../../data/agriculture/${yr}/${f}`));
  console.log(`\n=== Year ${yr} ===`);
  for (const s of wb.SheetNames) {
    const t = getSmartTitle(wb.Sheets[s]);
    if (t) {
      console.log(`  [${s.trim()}]: ${t.substring(0, 90)}`);
    }
  }
}
