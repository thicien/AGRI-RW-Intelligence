const xlsx = require('xlsx');
const path = require('path');

for (const yr of ['2022', '2021', '2020', '2019']) {
  const file = path.resolve(__dirname, `../../data/agriculture/${yr}`, yr === '2020' ? 'USAS 2020 _Final_Tables.xlsx' : yr === '2022' ? 'SAS 2022_Tables_0.xlsx' : yr === '2021' ? 'SAS 2021_Tables.xlsx' : 'SAS 2019 _Annual report _Tables.xlsx');
  const wb = xlsx.readFile(file);
  const listSheet = wb.Sheets['List of tables'] || wb.Sheets['List of tables & figure'];
  if (listSheet) {
    const data = xlsx.utils.sheet_to_json(listSheet, { header: 1 });
    console.log(`\n=== ${yr} List of Tables (first 30 rows) ===`);
    data.slice(0, 30).forEach((r, idx) => {
      const text = (r || []).filter(Boolean).join(' | ');
      if (text) console.log(`  [${idx}]: ${text}`);
    });
  }
}
