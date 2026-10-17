const xlsx = require('xlsx');
const path = require('path');

function getSmartTitle(ws) {
  if (!ws) return '';
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  for (let i = 0; i < Math.min(8, rows.length); i++) {
    const text = (rows[i] || []).filter(Boolean).map(x => String(x).trim()).join(' ');
    if (text.toLowerCase().includes('cultivated area') || text.toLowerCase().includes('harvested area') || text.toLowerCase().includes('production') || text.toLowerCase().includes('average yield') || text.toLowerCase().includes('yield of main')) {
      return text;
    }
  }
  return '';
}

for (const yr of ['2019', '2018']) {
  const f = yr === '2019' ? 'SAS 2019 _Annual report _Tables.xlsx' : '2018 Annual Tables_Final (1).xlsx';
  const wb = xlsx.readFile(path.resolve(__dirname, `../../data/agriculture/${yr}/${f}`));
  console.log(`\n=== Year ${yr} ===`);
  for (const s of wb.SheetNames) {
    const t = getSmartTitle(wb.Sheets[s]);
    if (t) {
      console.log(`  [${s.trim()}]: ${t.substring(0, 90)}`);
    }
  }
}
