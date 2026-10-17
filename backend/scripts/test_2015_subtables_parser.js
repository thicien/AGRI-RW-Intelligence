const xlsx = require('xlsx');
const path = require('path');

const fp = path.resolve(__dirname, '../../data/agriculture/2015/2015_Tables _ABC.xls');
const wb = xlsx.readFile(fp);

function parse2015Section(ws, tableStartPattern) {
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  let startIdx = -1;
  for (let r = 0; r < rows.length; r++) {
    const text = (rows[r] || []).join(' ');
    if (text.toLowerCase().includes(tableStartPattern.toLowerCase())) {
      startIdx = r;
      break;
    }
  }
  if (startIdx === -1) return {};

  // Find header row with 1.1, 1.2, etc.
  let headerRowIdx = -1;
  for (let r = startIdx; r < Math.min(startIdx + 6, rows.length); r++) {
    const row = rows[r] || [];
    if (row.some(c => String(c).includes('1.1'))) {
      headerRowIdx = r;
      break;
    }
  }
  if (headerRowIdx === -1) return {};

  const colStrata = {};
  rows[headerRowIdx].forEach((c, idx) => {
    const str = String(c).trim();
    if (['1.1', '1.2', '2.1', '2.2', '3.0'].includes(str)) {
      colStrata[str] = idx;
    }
  });

  const crops = {};
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const crop = row[0];
    if (!crop || typeof crop !== 'string') continue;
    const cleanCrop = crop.trim();
    if (cleanCrop.toLowerCase().includes('total') || cleanCrop.toLowerCase().includes('category') || cleanCrop.toLowerCase().includes('table')) {
      if (cleanCrop.toLowerCase().includes('table')) break; // Next table started
      continue;
    }

    crops[cleanCrop] = {};
    for (const s in colStrata) {
      const val = row[colStrata[s]];
      crops[cleanCrop][s] = typeof val === 'number' ? val : (parseFloat(String(val).replace(/,/g, '')) || 0);
    }
  }

  return crops;
}

const cult15A = parse2015Section(wb.Sheets['Tables_A'], 'Table 17');
console.log('2015A Table 17 crops:', Object.keys(cult15A).length);
console.log('Sample Maize 2015A Cultivated:', cult15A['Maize']);

const prod15A = parse2015Section(wb.Sheets['Tables_A'], 'Table 22');
console.log('2015A Table 22 crops:', Object.keys(prod15A).length);
console.log('Sample Maize 2015A Production:', prod15A['Maize']);

const cult15B = parse2015Section(wb.Sheets['Tables_B'], 'Table 59');
console.log('2015B Table 59 crops:', Object.keys(cult15B).length);

const prod15B = parse2015Section(wb.Sheets['Tables_B'], 'Table 64');
console.log('2015B Table 64 crops:', Object.keys(prod15B).length);

const cult15C = parse2015Section(wb.Sheets['Tables_C'], 'Table 100');
console.log('2015C Table 100 crops:', Object.keys(cult15C).length);

const prod15C = parse2015Section(wb.Sheets['Tables_C'], 'Table 104');
console.log('2015C Table 104 crops:', Object.keys(prod15C).length);
