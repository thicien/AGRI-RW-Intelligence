const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function main() {
  const filePath = path.join('d:', 'AGRI-RW Intelligence', 'data', 'agriculture', '2026', 'SAS 2026B_Main report.pdf');
  const buffer = fs.readFileSync(filePath);
  const uint8 = new Uint8Array(buffer);
  
  const parser = new PDFParse(uint8, { verbosity: 0 });
  await parser.load();
  
  const result = await parser.getText();
  
  let allText = '';
  if (result && result.pages) {
    for (const page of result.pages) {
      allText += `\n--- PAGE ${page.num} ---\n${page.text}`;
    }
  }
  
  const outPath = path.join('d:', 'AGRI-RW Intelligence', 'data', 'agriculture', '2026', '2026B_extracted.txt');
  fs.writeFileSync(outPath, allText);
  
  console.log('Total pages:', result.pages.length);
  console.log('Text length:', allText.length);
  console.log('\n=== PAGES 1-5 ===\n');
  console.log(allText.substring(0, 8000));
}

main().catch(err => console.error('Error:', err.message));
