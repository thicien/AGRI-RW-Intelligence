const xlsx = require('xlsx');
const path = require('path');

const sampleFile = path.resolve(__dirname, '../../data/agriculture/2024/Tables_2024 Season A (1).xlsx');
const wb = xlsx.readFile(sampleFile);

console.log('=== Table 5 (National crop summary) ===');
const ws5 = wb.Sheets['Table 5'];
const data5 = xlsx.utils.sheet_to_json(ws5, { header: 1 });
for (let i = 0; i < Math.min(35, data5.length); i++) {
  console.log(`R${i}:`, JSON.stringify(data5[i]));
}

console.log('\n=== Table 9 (Cultivated Area by crop type and district) ===');
const ws9 = wb.Sheets['Table 9'];
const data9 = xlsx.utils.sheet_to_json(ws9, { header: 1 });
for (let i = 0; i < Math.min(10, data9.length); i++) {
  console.log(`R${i}:`, JSON.stringify(data9[i]));
}
