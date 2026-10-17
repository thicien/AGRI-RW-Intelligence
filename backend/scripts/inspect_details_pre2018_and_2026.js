const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const agricultureDir = path.resolve(__dirname, '../../data/agriculture');

async function inspectDetails() {
  console.log('=== 1. DETAIL OF 2026 TEXT FILE ===');
  const txtPath = path.join(agricultureDir, '2026', '2026B_extracted.txt');
  if (fs.existsSync(txtPath)) {
    const lines = fs.readFileSync(txtPath, 'utf8').split('\n');
    lines.forEach((l, i) => {
      const lower = l.toLowerCase();
      if (lower.includes('table 6') || lower.includes('table 5') || lower.includes('table 7') || lower.includes('season a 2026') || lower.includes('2026 season a') || lower.includes('table 14') || lower.includes('table 15') || lower.includes('table 16') || lower.includes('table 17')) {
        console.log(`L${i}: ${l.trim().substring(0, 100)}`);
      }
    });
  }

  console.log('\n=== 2. DETAIL OF 2017 APPENDIX SHEET ===');
  const f2017 = path.join(agricultureDir, '2017', 'USAS 2017 Tables.xls');
  if (fs.existsSync(f2017)) {
    const wb = xlsx.readFile(f2017);
    const ws = wb.Sheets['Appendix'];
    const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
    console.log('Appendix first 40 rows:');
    rows.slice(0, 40).forEach((r, idx) => {
      const txt = (r || []).filter(c => c !== null && c !== undefined && c !== '').join(' | ');
      if (txt) console.log(`  Row ${idx}: ${txt.substring(0, 110)}`);
    });
  }

  console.log('\n=== 3. DETAIL OF 2016 SHEETS ===');
  const f2016 = path.join(agricultureDir, '2016', 'SAS-2016 Final Report.xlsx');
  if (fs.existsSync(f2016)) {
    const wb = xlsx.readFile(f2016);
    console.log('2016 Sheet List (first 50):');
    wb.SheetNames.slice(0, 50).forEach(s => {
      const ws = wb.Sheets[s];
      const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
      const t = (rows.slice(0, 3).map(r => (r||[]).join(' ')).join(' ')).replace(/\s+/g, ' ').trim();
      if (t.toLowerCase().includes('cultivat') || t.toLowerCase().includes('harvest') || t.toLowerCase().includes('yield') || t.toLowerCase().includes('product') || t.toLowerCase().includes('crop')) {
        console.log(`  [${s}]: ${t.substring(0, 90)}`);
      }
    });
  }

  console.log('\n=== 4. DETAIL OF 2015 SUB-TABLES ===');
  const f2015 = path.join(agricultureDir, '2015', '2015_Tables _ABC.xls');
  if (fs.existsSync(f2015)) {
    const wb = xlsx.readFile(f2015);
    ['Tables_A', 'Tables_B', 'Tables_C'].forEach(sName => {
      const ws = wb.Sheets[sName];
      const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
      console.log(`\n--- ${sName} crop/yield tables ---`);
      rows.forEach((r, idx) => {
        const text = (r || []).join(' ');
        const low = text.toLowerCase();
        if ((low.includes('table ') || low.includes('table.')) && (low.includes('cultivat') || low.includes('harvest') || low.includes('yield') || low.includes('product') || low.includes('crop'))) {
          console.log(`  Line ${idx}: ${text.trim().substring(0, 100)}`);
        }
      });
    });
  }
}

inspectDetails().catch(console.error);
