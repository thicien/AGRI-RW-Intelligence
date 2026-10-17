const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const f2015 = path.resolve(__dirname, '../../data/agriculture/2015/2015_Tables _ABC.xls');
const wb = xlsx.readFile(f2015);
console.log('2015 Sheets:', wb.SheetNames);
for (const s of wb.SheetNames) {
  const ws = wb.Sheets[s];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
  console.log(`Sheet ${s} rows: ${data.length}`);
  for (let i = 0; i < Math.min(5, data.length); i++) {
    console.log(`  R${i}:`, JSON.stringify(data[i]));
  }
}

const f2026 = path.resolve(__dirname, '../../data/agriculture/2026/2026B_extracted.txt');
if (fs.existsSync(f2026)) {
  const txt = fs.readFileSync(f2026, 'utf8');
  console.log('\n2026 preview:\n', txt.substring(0, 500));
}
