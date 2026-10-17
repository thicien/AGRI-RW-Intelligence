const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const agricultureDir = path.resolve(__dirname, '../../data/agriculture');

function checkFile(year, filename, sheetName) {
  const fp = path.join(agricultureDir, year, filename);
  if (!fs.existsSync(fp)) {
    console.log(`File not found: ${year}/${filename}`);
    return;
  }
  const wb = xlsx.readFile(fp);
  const ws = wb.Sheets[sheetName];
  if (!ws) {
    console.log(`Sheet not found: ${sheetName} in ${year}/${filename}`);
    return;
  }
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  console.log(`\n=== ${year} - ${filename} - [${sheetName}] ===`);
  // Print header rows and first 2 district rows
  for (let i = 0; i < Math.min(6, rows.length); i++) {
    console.log(`R${i}:`, JSON.stringify(rows[i]?.slice(0, 10)));
  }
}

// Check 2023
checkFile('2023', 'SAS 2023_Annual Tables (3).xlsx', 'Table 10'); // Cultivated A
checkFile('2023', 'SAS 2023_Annual Tables (3).xlsx', 'Table 13'); // Harvested A
checkFile('2023', 'SAS 2023_Annual Tables (3).xlsx', 'Table 22'); // Production A

// Check 2022
checkFile('2022', 'SAS 2022_Tables_0.xlsx', 'Table 11'); // Cultivated A
checkFile('2022', 'SAS 2022_Tables_0.xlsx', 'Table 14'); // Harvested A
checkFile('2022', 'SAS 2022_Tables_0.xlsx', 'Table 23'); // Production A

// Check 2021
checkFile('2021', 'SAS 2021_Tables.xlsx', 'Table 11'); // Cultivated A
checkFile('2021', 'SAS 2021_Tables.xlsx', 'Table 14'); // Harvested A
checkFile('2021', 'SAS 2021_Tables.xlsx', 'Table 24'); // Production A

// Check 2020
checkFile('2020', 'USAS 2020 _Final_Tables.xlsx', 'Table 8'); // Cultivated A
checkFile('2020', 'USAS 2020 _Final_Tables.xlsx', 'Table 11'); // Harvested A
checkFile('2020', 'USAS 2020 _Final_Tables.xlsx', 'Table 20'); // Production A
