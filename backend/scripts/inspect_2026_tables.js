const fs = require('fs');
const path = require('path');

const agricultureDir = path.resolve(__dirname, '../../data/agriculture');
const txtPath = path.join(agricultureDir, '2026', '2026B_extracted.txt');

if (fs.existsSync(txtPath)) {
  const lines = fs.readFileSync(txtPath, 'utf8').split('\n');

  console.log('=== Inspecting Table 9 (Cultivated by district) in 2026B ===');
  lines.slice(925, 965).forEach((l, idx) => console.log(`${925 + idx}: ${l}`));

  console.log('\n=== Inspecting Table 10 (Harvested by district) in 2026B ===');
  lines.slice(990, 1025).forEach((l, idx) => console.log(`${990 + idx}: ${l}`));

  console.log('\n=== Inspecting Table 11 (Yield by district) in 2026B ===');
  lines.slice(1052, 1085).forEach((l, idx) => console.log(`${1052 + idx}: ${l}`));

  console.log('\n=== Inspecting Table 13 (Production by district) in 2026B ===');
  lines.slice(1180, 1215).forEach((l, idx) => console.log(`${1180 + idx}: ${l}`));

  console.log('\n=== Searching for 2026 Season A tables or data in text ===');
  lines.forEach((l, idx) => {
    if (l.toLowerCase().includes('season a 2026') || l.toLowerCase().includes('2026 season a') || l.toLowerCase().includes('2026a')) {
      console.log(`L${idx}: ${l.trim().substring(0, 120)}`);
    }
  });
}
