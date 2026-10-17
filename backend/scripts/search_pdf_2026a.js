const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function searchPdf() {
  const filePath = path.join('d:', 'AGRI-RW Intelligence', 'data', 'agriculture', '2026', 'SAS 2026B_Main report.pdf');
  const buffer = fs.readFileSync(filePath);
  const uint8 = new Uint8Array(buffer);
  
  const parser = new PDFParse(uint8, { verbosity: 0 });
  await parser.load();
  const result = await parser.getText();

  console.log('Total pages:', result.pages.length);
  const seasonAMentions = [];
  result.pages.forEach(p => {
    const text = p.text;
    const lines = text.split('\n');
    lines.forEach((l, lineIdx) => {
      const low = l.toLowerCase();
      if ((low.includes('season a') && (low.includes('2026') || low.includes('2025'))) || low.includes('2026 a') || low.includes('2026a')) {
        seasonAMentions.push({ page: p.num, line: l.trim() });
      }
    });
  });

  console.log(`Found ${seasonAMentions.length} Season A mentions:`);
  seasonAMentions.forEach(m => console.log(`  Page ${m.page}: ${m.line.substring(0, 100)}`));
}

searchPdf().catch(console.error);
