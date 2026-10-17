const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const agricultureDir = path.resolve(__dirname, '../../data/agriculture');

// Check 2026
console.log('=== 2026 Files ===');
const f2026 = path.join(agricultureDir, '2026');
if (fs.existsSync(f2026)) {
  fs.readdirSync(f2026).forEach(f => {
    const stat = fs.statSync(path.join(f2026, f));
    console.log(`  ${f} (${stat.size} bytes)`);
  });
}

// Check 2017
console.log('\n=== 2017 Spreadsheets ===');
const f2017 = path.join(agricultureDir, '2017', 'USAS 2017 Tables.xls');
if (fs.existsSync(f2017)) {
  const wb = xlsx.readFile(f2017);
  console.log('2017 sheets count:', wb.SheetNames.length);
  // find sheets with crop / district
  wb.SheetNames.forEach(s => {
    const ws = wb.Sheets[s];
    const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
    const title = (rows.slice(0, 5).map(r => (r || []).join(' ')).join(' ')).toLowerCase();
    if (title.includes('cultivated area') || title.includes('harvested area') || title.includes('production') || title.includes('yield')) {
      console.log(`  [${s}]: ${title.substring(0, 90)}`);
    }
  });
}

// Check 2016
console.log('\n=== 2016 Spreadsheets ===');
const f2016 = path.join(agricultureDir, '2016', 'SAS-2016 Final Report.xlsx');
if (fs.existsSync(f2016)) {
  const wb = xlsx.readFile(f2016);
  console.log('2016 sheets count:', wb.SheetNames.length);
  wb.SheetNames.forEach(s => {
    const ws = wb.Sheets[s];
    const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
    const title = (rows.slice(0, 5).map(r => (r || []).join(' ')).join(' ')).toLowerCase();
    if (title.includes('cultivated') || title.includes('harvested') || title.includes('production') || title.includes('yield') || title.includes('crop')) {
      console.log(`  [${s}]: ${title.substring(0, 90)}`);
    }
  });
}

// Check 2015
console.log('\n=== 2015 Spreadsheets ===');
const f2015 = path.join(agricultureDir, '2015', '2015_Tables _ABC.xls');
if (fs.existsSync(f2015)) {
  const wb = xlsx.readFile(f2015);
  console.log('2015 sheets count:', wb.SheetNames.length);
  wb.SheetNames.forEach(s => {
    console.log(`  Sheet: [${s}]`);
  });
}
