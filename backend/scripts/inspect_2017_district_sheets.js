const xlsx = require('xlsx');
const path = require('path');

const fp = path.resolve(__dirname, '../../data/agriculture/2017/USAS 2017 Tables.xls');
const wb = xlsx.readFile(fp);

console.log('2017 sheets mentioning district:');
wb.SheetNames.forEach(s => {
  const ws = wb.Sheets[s];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  const text = (rows.slice(0, 5).map(r => (r || []).join(' ')).join(' ')).toLowerCase();
  if (text.includes('district') && (text.includes('crop') || text.includes('cultivated') || text.includes('production') || text.includes('yield'))) {
    console.log(`- [${s}]: ${text.substring(0, 95)}`);
  }
});
