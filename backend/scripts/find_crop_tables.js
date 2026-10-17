const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const agricultureDir = path.resolve(__dirname, '../../data/agriculture');

const years = ['2023', '2022', '2021', '2020', '2019', '2018'];

for (const yr of years) {
  const dir = path.join(agricultureDir, yr);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
  for (const f of files) {
    console.log(`\n=================== ${yr} / ${f} ===================`);
    const wb = xlsx.readFile(path.join(dir, f));
    for (const s of wb.SheetNames) {
      const ws = wb.Sheets[s];
      const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
      const title = (data[0] || []).filter(Boolean).join(' ') || (data[1] || []).filter(Boolean).join(' ') || (data[2] || []).filter(Boolean).join(' ');
      if (title.toLowerCase().includes('cultivated area') || title.toLowerCase().includes('harvested area') || title.toLowerCase().includes('yield') || title.toLowerCase().includes('production')) {
        console.log(`  [${s}]: ${title.substring(0, 85)}`);
      }
    }
  }
}
