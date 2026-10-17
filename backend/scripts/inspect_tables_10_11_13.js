const xlsx = require('xlsx');
const path = require('path');

const sampleFile = path.resolve(__dirname, '../../data/agriculture/2024/Tables_2024 Season A (1).xlsx');
const wb = xlsx.readFile(sampleFile);

for (const t of ['Table 10', 'Table 11', 'Table 13']) {
  console.log(`\n=== ${t} ===`);
  const ws = wb.Sheets[t];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
  for (let i = 0; i < Math.min(4, data.length); i++) {
    console.log(`R${i}:`, JSON.stringify(data[i]));
  }
}
