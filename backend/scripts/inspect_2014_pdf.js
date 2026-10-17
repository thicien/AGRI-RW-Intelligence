const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function inspect2014() {
  const filePath = path.join('d:', 'AGRI-RW Intelligence', 'data', 'agriculture', '2014', 'Final_SAS 2014_Report_15_June_2015_.pdf');
  const buffer = fs.readFileSync(filePath);
  const uint8 = new Uint8Array(buffer);
  
  const parser = new PDFParse(uint8, { verbosity: 0 });
  await parser.load();
  const result = await parser.getText();

  console.log('2014 PDF total pages:', result.pages.length);
  const tableLines = [];
  result.pages.slice(0, 10).forEach(p => {
    const lines = p.text.split('\n');
    lines.forEach(l => {
      if (l.toLowerCase().includes('table ') && (l.toLowerCase().includes('crop') || l.toLowerCase().includes('area') || l.toLowerCase().includes('yield') || l.toLowerCase().includes('production'))) {
        tableLines.push({ page: p.num, line: l.trim() });
      }
    });
  });

  console.log(`Found ${tableLines.length} relevant tables in TOC/first pages:`);
  tableLines.slice(0, 20).forEach(t => console.log(`  P${t.page}: ${t.line.substring(0, 90)}`));
}

inspect2014().catch(console.error);
