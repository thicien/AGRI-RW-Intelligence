const fs = require('fs');
const path = require('path');

const txtPath = path.resolve(__dirname, '../../data/agriculture/2026/2026B_extracted.txt');
const lines = fs.readFileSync(txtPath, 'utf8').split('\n');

function parseTextTable(startLineIdx, endLineIdx) {
  const result = {};
  // Find header row with crops
  let cropHeaders = [];
  let headerFound = false;

  const districtNames = [
    'nyarugenge', 'gasabo', 'kicukiro', 'nyanza', 'gisagara', 'nyaruguru', 'huye',
    'nyamagabe', 'ruhango', 'muhanga', 'kamonyi', 'karongi', 'rutsiro', 'rubavu',
    'nyabihu', 'ngororero', 'rusizi', 'nyamasheke', 'rulindo', 'gakenke', 'musanze',
    'burera', 'gicumbi', 'rwamagana', 'nyagatare', 'gatsibo', 'kayonza', 'kirehe',
    'ngoma', 'bugesera'
  ];

  for (let i = startLineIdx; i <= endLineIdx; i++) {
    const raw = lines[i] || '';
    const parts = raw.split('\t').map(p => p.trim());
    if (parts.length < 5) continue;

    const first = parts[0].toLowerCase();
    if (first.includes('district')) {
      // Header row
      cropHeaders = parts.slice(1);
      headerFound = true;
      continue;
    }

    if (districtNames.includes(first)) {
      result[first] = {};
      for (let c = 1; c < parts.length; c++) {
        const valStr = parts[c].replace(/,/g, '').trim();
        const val = valStr === '-' || valStr === '' ? 0 : parseFloat(valStr);
        const cropName = cropHeaders[c - 1] || `col_${c}`;
        result[first][cropName] = isNaN(val) ? 0 : val;
      }
    }
  }

  return { cropHeaders, data: result };
}

console.log('Testing 2026B Table 9 parser:');
const t9 = parseTextTable(925, 985);
console.log('Table 9 Districts parsed:', Object.keys(t9.data).length);
console.log('Sample Nyarugenge:', t9.data['nyarugenge']);
console.log('Sample Nyagatare:', t9.data['nyagatare']);

console.log('\nTesting 2026B Table 10 parser:');
const t10 = parseTextTable(990, 1050);
console.log('Table 10 Districts parsed:', Object.keys(t10.data).length);

console.log('\nTesting 2026B Table 11 parser:');
const t11 = parseTextTable(1054, 1115);
console.log('Table 11 Districts parsed:', Object.keys(t11.data).length);

console.log('\nTesting 2026B Table 13 parser:');
const t13 = parseTextTable(1180, 1245);
console.log('Table 13 Districts parsed:', Object.keys(t13.data).length);
console.log('Sample Gasabo Production:', t13.data['gasabo']);
