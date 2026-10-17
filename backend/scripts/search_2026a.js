const fs = require('fs');
const path = require('path');

const agricultureDir = path.resolve(__dirname, '../../data/agriculture');
const txtPath = path.join(agricultureDir, '2026', '2026B_extracted.txt');

if (fs.existsSync(txtPath)) {
  const text = fs.readFileSync(txtPath, 'utf8');
  const lines = text.split('\n');
  lines.forEach((l, idx) => {
    const low = l.toLowerCase();
    if (low.includes('season a') || low.includes('2026a') || low.includes('2026 a')) {
      console.log(`L${idx}: ${l.trim().substring(0, 100)}`);
    }
  });
}
