const xlsx = require('xlsx');
const path = require('path');

function parseTransposedMatrix(ws) {
  if (!ws) return null;
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  let headerRowIdx = -1;
  // Find row containing Nyarugenge, Gasabo, etc.
  for (let r = 0; r < Math.min(6, rows.length); r++) {
    const row = rows[r] || [];
    const hasDistricts = row.some(cell => typeof cell === 'string' && (cell.toLowerCase().includes('gasabo') || cell.toLowerCase().includes('nyarugenge') || cell.toLowerCase().includes('huye')));
    if (hasDistricts) {
      headerRowIdx = r;
      break;
    }
  }

  if (headerRowIdx === -1) return null;

  const headerRow = rows[headerRowIdx] || [];
  const colDistricts = [];
  for (let c = 0; c < headerRow.length; c++) {
    const val = headerRow[c];
    if (val && typeof val === 'string') {
      const clean = val.trim();
      if (!clean.toLowerCase().includes('crop') && !clean.toLowerCase().includes('total') && !clean.toLowerCase().includes('city') && !clean.toLowerCase().includes('province')) {
        colDistricts[c] = clean.toLowerCase();
      }
    }
  }

  const districtData = {};
  for (const d of colDistricts.filter(Boolean)) {
    districtData[d] = { rawName: d, crops: {} };
  }

  // Rows are crops
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const cropCell = row[0];
    if (!cropCell || typeof cropCell !== 'string') continue;
    const cropName = cropCell.trim();

    for (let c = 1; c < row.length; c++) {
      const d = colDistricts[c];
      if (d && districtData[d]) {
        const val = row[c];
        const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
        districtData[d].crops[cropName] = isNaN(num) ? 0 : num;
      }
    }
  }

  return districtData;
}

const fp = path.resolve(__dirname, '../../data/agriculture/2018/2018 Annual Tables_Final (1).xlsx');
const wb = xlsx.readFile(fp);
const d = parseTransposedMatrix(wb.Sheets['Appendix 1']);
console.log('Districts found in 2018 Appendix 1:', Object.keys(d).length);
console.log('Sample Nyarugenge in 2018:', d['nyarugenge']?.crops);
