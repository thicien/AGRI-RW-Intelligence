const xlsx = require('xlsx');
const path = require('path');

const fp = path.resolve(__dirname, '../../data/agriculture/2017/USAS 2017 Tables.xls');
const wb = xlsx.readFile(fp);
const ws = wb.Sheets['Appendix'];
const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });

console.log('Total rows in Appendix:', rows.length);

function printSection(start, end) {
  for (let i = start; i <= Math.min(end, rows.length - 1); i++) {
    const row = rows[i] || [];
    const filtered = row.map(c => (c !== null && c !== undefined ? String(c).trim() : ''));
    if (filtered.some(c => c !== '')) {
      console.log(`L${i}: [${filtered.slice(0, 12).join(' | ')}]`);
    }
  }
}

console.log('\n--- Season A Cultivated (around 62) ---');
printSection(60, 75);

console.log('\n--- Season A Yield (around 95) ---');
printSection(93, 105);

console.log('\n--- Season A Production (around 117) ---');
printSection(115, 127);

console.log('\n--- Season B Cultivated (around 139) ---');
printSection(138, 150);

console.log('\n--- Season B Yield (around 173) ---');
printSection(170, 182);

console.log('\n--- Season B Production (around 196) ---');
printSection(193, 205);

console.log('\n--- Season C Cultivated (around 219) ---');
printSection(218, 228);

console.log('\n--- Season C Yield (around 238) ---');
printSection(236, 245);

console.log('\n--- Season C Production (around 252) ---');
printSection(250, 260);
