const xlsx = require('xlsx');
const path = require('path');

const fp = path.resolve(__dirname, '../../data/agriculture/2017/USAS 2017 Tables.xls');
const wb = xlsx.readFile(fp);
const ws = wb.Sheets['Appendix'];
const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });

function parseAppendixTable(headerRowIdx, endRowIdx) {
  const headerRow = rows[headerRowIdx] || [];
  const districtCols = {};
  for (let c = 1; c < headerRow.length; c++) {
    const d = headerRow[c];
    if (d && typeof d === 'string') {
      const clean = d.trim().toLowerCase();
      if (!clean.includes('total') && !clean.includes('overall') && !clean.includes('change') && clean.length > 2) {
        districtCols[c] = clean;
      }
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

  return result;
}

console.log('=== Testing 2017 Section Parsing ===');

// Season A
const cultA = parseAppendixTable(63, 92);
const yieldA = parseAppendixTable(96, 114);
const prodA = parseAppendixTable(118, 136);
console.log(`2017A Cultivated: ${Object.keys(cultA).length} districts, Sample Maize in Nyarugenge:`, cultA['nyarugenge']?.['Maize']);
console.log(`2017A Yield: ${Object.keys(yieldA).length} districts, Sample Maize in Nyarugenge:`, yieldA['nyarugenge']?.['Maize']);
console.log(`2017A Production: ${Object.keys(prodA).length} districts, Sample Maize in Nyarugenge:`, prodA['nyarugenge']?.['Maize']);

// Season B
const cultB = parseAppendixTable(140, 169);
const yieldB = parseAppendixTable(174, 192);
const prodB = parseAppendixTable(197, 215);
console.log(`\n2017B Cultivated: ${Object.keys(cultB).length} districts, Sample Maize in Nyarugenge:`, cultB['nyarugenge']?.['Maize']);
console.log(`2017B Yield: ${Object.keys(yieldB).length} districts, Sample Maize in Nyarugenge:`, yieldB['nyarugenge']?.['Maize']);
console.log(`2017B Production: ${Object.keys(prodB).length} districts, Sample Maize in Nyarugenge:`, prodB['nyarugenge']?.['Maize']);

// Season C
const cultC = parseAppendixTable(220, 235);
const yieldC = parseAppendixTable(239, 248);
const prodC = parseAppendixTable(253, 266);
console.log(`\n2017C Cultivated: ${Object.keys(cultC).length} districts, Sample Sweet potato in Nyarugenge:`, cultC['nyarugenge']?.['Sweet potato']);
console.log(`2017C Yield: ${Object.keys(yieldC).length} districts, Sample Sweet potato in Nyarugenge:`, yieldC['nyarugenge']?.['Sweet potato']);
console.log(`2017C Production: ${Object.keys(prodC).length} districts, Sample Sweet potato in Nyarugenge:`, prodC['nyarugenge']?.['Sweet potato']);
