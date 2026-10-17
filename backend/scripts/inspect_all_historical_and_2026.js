const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const agricultureDir = path.resolve(__dirname, '../../data/agriculture');

async function inspectFiles() {
  console.log('================ 1. Inspecting 2026 ================');
  const txt2026Path = path.join(agricultureDir, '2026', '2026B_extracted.txt');
  if (fs.existsSync(txt2026Path)) {
    const content = fs.readFileSync(txt2026Path, 'utf8');
    console.log(`2026B_extracted.txt length: ${content.length} chars`);
    // Search for keywords
    const lines = content.split('\n');
    console.log(`Total lines: ${lines.length}`);
    const matches = lines.filter(l => l.toLowerCase().includes('2026a') || l.toLowerCase().includes('2026b') || l.toLowerCase().includes('season 2026') || l.toLowerCase().includes('season a') || l.toLowerCase().includes('season b'));
    console.log(`Lines with season mention: ${matches.length}`);
    matches.slice(0, 15).forEach(m => console.log('  ', m.trim().substring(0, 100)));
  }

  console.log('\n================ 2. Inspecting 2017 ================');
  const f2017 = path.join(agricultureDir, '2017', 'USAS 2017 Tables.xls');
  if (fs.existsSync(f2017)) {
    const wb = xlsx.readFile(f2017);
    console.log(`2017 sheets (${wb.SheetNames.length}):`);
    const relevant = wb.SheetNames.filter(s => {
      const name = s.toLowerCase();
      return name.includes('table 8') || name.includes('table 11') || name.includes('table 12') ||
             name.includes('table 52') || name.includes('table 55') || name.includes('table 56') ||
             name.includes('table 96') || name.includes('table 99') || name.includes('table 100') ||
             name.includes('appendix');
    });
    console.log('Relevant sheet names:', relevant);
    // Print title of Table 8, Table 11, Table 12, Table 52, Table 55, Table 56, Table 96, Table 99, Table 100
    for (const s of relevant) {
      const ws = wb.Sheets[s];
      const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
      const t = (rows.slice(0, 3).map(r => (r||[]).join(' ')).join(' ')).replace(/\s+/g, ' ').trim();
      console.log(`  [${s}] (${rows.length} rows): ${t.substring(0, 80)}`);
    }
  }

  console.log('\n================ 3. Inspecting 2016 ================');
  const f2016 = path.join(agricultureDir, '2016', 'SAS-2016 Final Report.xlsx');
  if (fs.existsSync(f2016)) {
    const wb = xlsx.readFile(f2016);
    console.log(`2016 sheets (${wb.SheetNames.length}):`);
    // Find district or main crop sheets
    const sheetsWithDistrict = [];
    wb.SheetNames.forEach(s => {
      const ws = wb.Sheets[s];
      const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
      const str = JSON.stringify(rows.slice(0, 8)).toLowerCase();
      if (str.includes('huye') || str.includes('gasabo') || str.includes('nyagatare') || str.includes('musanze')) {
        sheetsWithDistrict.push({ sheet: s, preview: str.substring(0, 100) });
      }
    });
    console.log(`Found ${sheetsWithDistrict.length} sheets with district data in 2016:`);
    sheetsWithDistrict.slice(0, 15).forEach(s => console.log(`  [${s.sheet}]`));
  }

  console.log('\n================ 4. Inspecting 2015 ================');
  const f2015 = path.join(agricultureDir, '2015', '2015_Tables _ABC.xls');
  if (fs.existsSync(f2015)) {
    const wb = xlsx.readFile(f2015);
    console.log(`2015 sheets:`, wb.SheetNames);
    wb.SheetNames.forEach(s => {
      const ws = wb.Sheets[s];
      const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
      console.log(`  [${s}] total rows: ${rows.length}`);
      // Find sections or tables inside sheet
      const tablesInside = [];
      rows.forEach((r, idx) => {
        const text = (r || []).join(' ');
        if (text.toLowerCase().includes('table') && text.length < 150) {
          tablesInside.push({ row: idx, text: text.trim() });
        }
      });
      console.log(`    Found ${tablesInside.length} sub-table headers in [${s}]`);
      tablesInside.slice(0, 10).forEach(t => console.log(`      Line ${t.row}: ${t.text.substring(0, 80)}`));
    });
  }
}

inspectFiles().catch(console.error);
