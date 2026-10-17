const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const agricultureDir = path.resolve(__dirname, '../../data/agriculture');

async function inspectMore() {
  console.log('=== 1. Inspect 2026B_extracted.txt around Table 6 & Season comparisons ===');
  const txtPath = path.join(agricultureDir, '2026', '2026B_extracted.txt');
  if (fs.existsSync(txtPath)) {
    const text = fs.readFileSync(txtPath, 'utf8');
    const lines = text.split('\n');
    let foundTable6 = false;
    let t6Lines = [];
    lines.forEach((l, idx) => {
      if (l.includes('Table 6:') || l.includes('Table 6.')) {
        foundTable6 = true;
        t6Lines = lines.slice(idx, idx + 45);
      }
    });
    console.log('--- Table 6 content (45 lines) ---');
    t6Lines.forEach(l => console.log(l));

    // Also look for district tables or maps in 2026B
    console.log('\n--- Searching for district tables in 2026 ---');
    lines.forEach((l, idx) => {
      if (l.toLowerCase().includes('district') && (l.toLowerCase().includes('cultivated') || l.toLowerCase().includes('production') || l.toLowerCase().includes('yield') || l.toLowerCase().includes('harvested'))) {
        console.log(`L${idx}: ${l.trim().substring(0, 100)}`);
      }
    });
  }

  console.log('\n=== 2. Inspect 2017 Table 96, 99, 100 & Appendix ===');
  const f2017 = path.join(agricultureDir, '2017', 'USAS 2017 Tables.xls');
  if (fs.existsSync(f2017)) {
    const wb = xlsx.readFile(f2017);
    ['Table 96', 'Table 99', 'Table 100'].forEach(s => {
      const ws = wb.Sheets[s];
      if (ws) {
        const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
        console.log(`\n--- Sheet ${s} (${rows.length} rows) ---`);
        rows.slice(0, 8).forEach((r, i) => console.log(`  R${i}: ${(r||[]).slice(0, 10).join(' | ')}`));
      }
    });

    console.log('\n--- Appendix Table Sections ---');
    const wsApp = wb.Sheets['Appendix'];
    const appRows = xlsx.utils.sheet_to_json(wsApp, { header: 1 });
    appRows.forEach((r, idx) => {
      const lineStr = (r || []).join(' ');
      if (lineStr.toLowerCase().includes('season') || lineStr.toLowerCase().includes('table') || lineStr.toLowerCase().includes('experiment') || lineStr.toLowerCase().includes('district')) {
        console.log(`  App Line ${idx}: ${lineStr.trim().substring(0, 90)}`);
      }
    });
  }
}

inspectMore().catch(console.error);
