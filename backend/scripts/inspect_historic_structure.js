const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const agricultureDir = path.resolve(__dirname, '../../data/agriculture');

const testFiles = [
  '2023/SAS 2023_Annual Tables (3).xlsx',
  '2022/SAS 2022_Tables_0.xlsx',
  '2021/SAS 2021_Tables.xlsx',
  '2020/USAS 2020 _Final_Tables.xlsx',
  '2019/SAS 2019 _Annual report _Tables.xlsx',
  '2018/2018 Annual Tables_Final (1).xlsx',
  '2017/USAS 2017 Tables.xls',
  '2016/SAS-2016 Final Report.xlsx',
  '2015/2015_Tables _ABC.xls',
];

for (const rel of testFiles) {
  const full = path.join(agricultureDir, rel);
  if (!fs.existsSync(full)) {
    console.log('Missing:', rel);
    continue;
  }
  try {
    const wb = xlsx.readFile(full);
    console.log(`\n=================== ${rel} ===================`);
    // Find sheets that mention district, crop, or yield
    let matched = 0;
    for (const s of wb.SheetNames) {
      const ws = wb.Sheets[s];
      const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
      const firstFew = (data.slice(0, 3).map(r => (r || []).join(' ')).join(' ')).toLowerCase();
      if (firstFew.includes('cultivated area') || firstFew.includes('harvested area') || firstFew.includes('production') || firstFew.includes('yield') || firstFew.includes('crop')) {
        console.log(`  [${s}]: ${firstFew.substring(0, 100)}`);
        matched++;
        if (matched >= 6) break;
      }
    }
  } catch (e) {
    console.log(`Error in ${rel}: ${e.message}`);
  }
}
