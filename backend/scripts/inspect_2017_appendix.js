const xlsx = require('xlsx');
const path = require('path');

const fp = path.resolve(__dirname, '../../data/agriculture/2017/USAS 2017 Tables.xls');
const wb = xlsx.readFile(fp);
const ws = wb.Sheets['Appendix'];
if (ws) {
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  console.log('Appendix rows count:', rows.length);
  for (let i = 0; i < Math.min(25, rows.length); i++) {
    console.log(`R${i}:`, JSON.stringify(rows[i]?.slice(0, 10)));
  }
}
