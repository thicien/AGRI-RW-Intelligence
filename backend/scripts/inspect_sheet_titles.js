const xlsx = require('xlsx');
const path = require('path');

const sampleFile = path.resolve(__dirname, '../../data/agriculture/2024/Tables_2024 Season A (1).xlsx');
const wb = xlsx.readFile(sampleFile);

console.log('Sample file sheets:');
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  // get top 5 rows
  const data = xlsx.utils.sheet_to_json(ws, { header: 1, range: 0 });
  const title = (data[0] || []).filter(Boolean).join(' ') || (data[1] || []).filter(Boolean).join(' ') || (data[2] || []).filter(Boolean).join(' ');
  console.log(`- [${name}]: ${title.substring(0, 80)}`);
}
