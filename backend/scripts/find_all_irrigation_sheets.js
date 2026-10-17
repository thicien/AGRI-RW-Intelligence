const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const agDir = path.resolve(__dirname, '../../data/agriculture');
const years = fs.readdirSync(agDir).filter(f => fs.statSync(path.join(agDir, f)).isDirectory());

console.log('Searching for irrigation tables in all agriculture datasets:');

years.forEach(yr => {
  const dirPath = path.join(agDir, yr);
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
  files.forEach(f => {
    try {
      const wb = xlsx.readFile(path.join(dirPath, f));
      wb.SheetNames.forEach(s => {
        const ws = wb.Sheets[s];
        const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
        const text = (rows.slice(0, 4).map(r => (r||[]).join(' ')).join(' ')).toLowerCase();
        if (text.includes('irrig') || s.toLowerCase().includes('irrig')) {
          console.log(`[${yr}][${f}][${s}]: ${text.substring(0, 100)}`);
        }
      });
    } catch (e) {
      // ignore
    }
  });
});
