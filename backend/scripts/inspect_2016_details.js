const xlsx = require('xlsx');
const path = require('path');

const fp = path.resolve(__dirname, '../../data/agriculture/2016/SAS-2016 Final Report.xlsx');
const wb = xlsx.readFile(fp);

console.log('Total 2016 sheets:', wb.SheetNames.length);

const districtNames = ['nyarugenge', 'gasabo', 'kicukiro', 'nyanza', 'gisagara', 'huye', 'musanze', 'rubavu'];

const matches = [];

wb.SheetNames.forEach(s => {
  const ws = wb.Sheets[s];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  let countDistricts = 0;
  for (let r = 0; r < Math.min(rows.length, 35); r++) {
    const rowStr = JSON.stringify(rows[r] || []).toLowerCase();
    if (districtNames.some(d => rowStr.includes(d))) {
      countDistricts++;
    }
  }
  if (countDistricts >= 2) {
    const title = (rows.slice(0, 3).map(r => (r||[]).join(' ')).join(' ')).replace(/\s+/g, ' ').trim();
    matches.push({ sheet: s, rows: rows.length, countDistricts, title: title.substring(0, 90) });
  }
});

console.log(`Found ${matches.length} sheets with multiple district names:`);
matches.forEach(m => console.log(`  [${m.sheet}] (${m.rows} rows, ${m.countDistricts} matches): ${m.title}`));

// Also check sheets that have "Table 17", "Table 21", "Table 22", "Table 59", "Table 63", "Table 64"
console.log('\n--- Checking Table 17, 21, 22, 59, 63, 64 in 2016 ---');
['Table 17', 'Table 21', 'Table22', 'Table 22', 'Table 59', 'Table 63', 'Table 64', 'Table 100', 'Table 103', 'Table 104'].forEach(s => {
  const ws = wb.Sheets[s];
  if (ws) {
    const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
    console.log(`[${s}] (${rows.length} rows): ${JSON.stringify(rows[0] || []).substring(0, 100)}`);
    console.log(`   R1: ${JSON.stringify(rows[1] || []).substring(0, 100)}`);
  }
});
