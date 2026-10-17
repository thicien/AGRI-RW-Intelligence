const xlsx = require('xlsx');
const path = require('path');

const fp = path.resolve(__dirname, '../../data/agriculture/2015/2015_Tables _ABC.xls');
const wb = xlsx.readFile(fp);
const wsA = wb.Sheets['Tables_A'];
const rowsA = xlsx.utils.sheet_to_json(wsA, { header: 1 });

console.log('Searching for 2014 in 2015 Tables_A:');
rowsA.forEach((r, idx) => {
  const line = (r || []).join(' ');
  if (line.includes('2014') && (line.toLowerCase().includes('area') || line.toLowerCase().includes('production') || line.toLowerCase().includes('yield') || line.toLowerCase().includes('crop'))) {
    console.log(`L${idx}: ${line.trim().substring(0, 100)}`);
  }
});
