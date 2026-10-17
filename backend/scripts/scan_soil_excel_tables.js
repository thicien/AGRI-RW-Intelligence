const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const baseDir = path.resolve(__dirname, '../../data/agriculture');

function scanDir(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files = files.concat(scanDir(full));
    } else if (e.name.endsWith('.xlsx') || e.name.endsWith('.xls')) {
      files.push(full);
    }
  }
  return files;
}

const excelFiles = scanDir(baseDir);
console.log(`Found ${excelFiles.length} Excel files.`);

for (const f of excelFiles) {
  try {
    const wb = xlsx.readFile(f);
    const relevant = wb.SheetNames.filter(s => 
      s.toLowerCase().includes('practice') || 
      s.toLowerCase().includes('fertil') || 
      s.toLowerCase().includes('erosion') || 
      s.toLowerCase().includes('table 8') ||
      s.toLowerCase().includes('table 22') ||
      s.toLowerCase().includes('table 23') ||
      s.toLowerCase().includes('table 32') ||
      s.toLowerCase().includes('table 33')
    );
    console.log(`${path.basename(f)}: [${relevant.join(', ')}] (Total sheets: ${wb.SheetNames.length})`);
  } catch (err) {
    console.log(`${path.basename(f)}: Error reading - ${err.message}`);
  }
}
