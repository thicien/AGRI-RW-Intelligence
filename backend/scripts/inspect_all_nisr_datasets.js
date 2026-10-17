const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const agricultureDir = path.resolve(__dirname, '../../data/agriculture');

const years = fs.readdirSync(agricultureDir).filter(f => fs.statSync(path.join(agricultureDir, f)).isDirectory());

console.log('Years found:', years);

for (const yr of years) {
  const yrPath = path.join(agricultureDir, yr);
  const files = fs.readdirSync(yrPath).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
  console.log(`\n=== Year ${yr} (${files.length} spreadsheets) ===`);
  for (const file of files) {
    const fullPath = path.join(yrPath, file);
    try {
      const wb = xlsx.readFile(fullPath, { bookSheets: true });
      console.log(`File: ${file}`);
      console.log(`  Sheets (${wb.SheetNames.length}):`, wb.SheetNames.slice(0, 15));
      if (wb.SheetNames.length > 15) {
        console.log(`  ... + ${wb.SheetNames.length - 15} more sheets`);
      }
    } catch (e) {
      console.log(`  Error reading ${file}: ${e.message}`);
    }
  }
}
