const xlsx = require('xlsx');
const path = require('path');

const fp = path.resolve(__dirname, '../../data/agriculture/2016/SAS-2016 Final Report.xlsx');
const wb = xlsx.readFile(fp);

function parseStrataShares() {
  const ws = wb.Sheets['Table 2'];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  // Table 2 has columns:
  // Col 1: District for Stratum 1.1, Col 2: Share of 1.1
  // Col 4: District for Stratum 1.2, Col 5: Share of 1.2
  // Col 7: District for Stratum 2.1, Col 8: Share of 2.1
  // Col 10: District for Stratum 2.2, Col 11: Share of 2.2
  // Col 13: District for Stratum 3.0, Col 14: Share of 3.0
  const districtShares = {};

  const strataCols = [
    { name: '1.1', dCol: 1, sCol: 2 },
    { name: '1.2', dCol: 4, sCol: 5 },
    { name: '2.1', dCol: 7, sCol: 8 },
    { name: '2.2', dCol: 10, sCol: 11 },
    { name: '3.0', dCol: 13, sCol: 14 },
  ];

  for (let r = 3; r <= 34; r++) {
    const row = rows[r] || [];
    strataCols.forEach(sc => {
      const dName = row[sc.dCol];
      const shareVal = row[sc.sCol];
      if (dName && typeof dName === 'string' && dName.trim().length > 2) {
        const dClean = dName.trim().toLowerCase();
        if (!districtShares[dClean]) {
          districtShares[dClean] = { '1.1': 0, '1.2': 0, '2.1': 0, '2.2': 0, '3.0': 0 };
        }
        districtShares[dClean][sc.name] = typeof shareVal === 'number' ? shareVal : (parseFloat(shareVal) || 0);
      }
    });
  }

  return districtShares;
}

const shares = parseStrataShares();
console.log('Districts found in Table 2:', Object.keys(shares).length);
console.log('Sample Nyagatare Strata shares:', shares['nyagatare']);
console.log('Sample Gasabo Strata shares:', shares['gasabo']);
console.log('Sample Musanze Strata shares:', shares['musanze']);

// Now test mapping Table 17 (Cultivated area by Stratum) and Table 22 (Production by Stratum)
function parseCropStrataTable(sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) return {};
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  // Find header row with 1.1, 1.2, etc.
  let headerRowIdx = -1;
  for (let r = 0; r < 8; r++) {
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
    if (cleanCrop.toLowerCase().includes('total') || cleanCrop.toLowerCase().includes('category') || cleanCrop.toLowerCase().includes('strata')) continue;

    crops[cleanCrop] = {};
    for (const s in colStrata) {
      const val = row[colStrata[s]];
      crops[cleanCrop][s] = typeof val === 'number' ? val : (parseFloat(String(val).replace(/,/g, '')) || 0);
    }
  }

  return crops;
}

const cult16A = parseCropStrataTable('Table 17');
console.log('\n2016A Cultivated crops count:', Object.keys(cult16A).length);
console.log('Sample Maize by Stratum:', cult16A['Maize']);

const prod16A = parseCropStrataTable('Table22');
console.log('\n2016A Production crops count:', Object.keys(prod16A).length);
console.log('Sample Maize Production by Stratum:', prod16A['Maize']);
