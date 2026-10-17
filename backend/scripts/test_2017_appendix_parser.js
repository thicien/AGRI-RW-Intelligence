const xlsx = require('xlsx');
const path = require('path');

const fp = path.resolve(__dirname, '../../data/agriculture/2017/USAS 2017 Tables.xls');
const wb = xlsx.readFile(fp);
const ws = wb.Sheets['Appendix'];
const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });

function parseAppendixBlock(headerRowIdx, endRowIdx) {
  const headerRow = rows[headerRowIdx] || [];
  // Find districts in headerRow
  const districtCols = {};
  for (let c = 1; c < headerRow.length; c++) {
    const d = headerRow[c];
    if (d && typeof d === 'string' && d.trim().length > 2) {
      districtCols[c] = d.trim().toLowerCase();
    }
  }

  const result = {};
  for (const c in districtCols) {
    result[districtCols[c]] = {};
  }

  for (let r = headerRowIdx + 1; r <= endRowIdx; r++) {
    const row = rows[r] || [];
    const cropCell = row[0];
    if (!cropCell || typeof cropCell !== 'string') continue;
    const cropName = cropCell.trim();
    if (cropName.toLowerCase().includes('total') || cropName.toLowerCase().includes('category') || cropName.toLowerCase().includes('survey')) continue;

    for (const c in districtCols) {
      const d = districtCols[c];
      const val = row[c];
      const num = typeof val === 'number' ? val : (parseFloat(String(val).replace(/,/g, '')) || 0);
      result[d][cropName] = num;
    }
  }

  return { districtsCount: Object.keys(result).length, sampleDist: Object.keys(result)[0], sampleData: result[Object.keys(result)[0]], all: result };
}

console.log('--- 2017 Season A Cultivated (Row 62 to 91) ---');
const cultA = parseAppendixBlock(62, 91);
console.log(`Districts: ${cultA.districtsCount}, Sample (${cultA.sampleDist}):`, cultA.sampleData);

console.log('\n--- 2017 Season A Production (Row 117 to 135) ---');
const prodA = parseAppendixBlock(117, 135);
console.log(`Districts: ${prodA.districtsCount}, Sample (${prodA.sampleDist}):`, prodA.sampleData);

console.log('\n--- 2017 Season B Cultivated (Row 139 to 168) ---');
const cultB = parseAppendixBlock(139, 168);
console.log(`Districts: ${cultB.districtsCount}, Sample (${cultB.sampleDist}):`, cultB.sampleData);

console.log('\n--- 2017 Season B Production (Row 196 to 215) ---');
const prodB = parseAppendixBlock(196, 215);
console.log(`Districts: ${prodB.districtsCount}, Sample (${prodB.sampleDist}):`, prodB.sampleData);

console.log('\n--- 2017 Season C Cultivated (Row 219 to 233) ---');
const cultC = parseAppendixBlock(219, 233);
console.log(`Districts: ${cultC.districtsCount}, Sample (${cultC.sampleDist}):`, cultC.sampleData);

console.log('\n--- 2017 Season C Production (Row 252 to 266) ---');
const prodC = parseAppendixBlock(252, 266);
console.log(`Districts: ${prodC.districtsCount}, Sample (${prodC.sampleDist}):`, prodC.sampleData);
