const xlsx = require('xlsx');
const path = require('path');

const fp = path.resolve(__dirname, '../../data/agriculture/2018/2018 Annual Tables_Final (1).xlsx');
const wb = xlsx.readFile(fp);
console.log('2018 sheet names:', wb.SheetNames.filter(s => s.toLowerCase().includes('appendix')));
const ws = wb.Sheets['Appendix 1'];
if (ws) {
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  for (let i = 0; i < 6; i++) {
    console.log(`R${i}:`, JSON.stringify(rows[i]?.slice(0, 10)));
  }
}
