const xlsx = require('xlsx');
const path = require('path');
const { Client } = require('pg');

// Crop name normalization map
const cropAliasMap = {
  'maize': 'Maize',
  'sorghum': 'Sorghum',
  'paddy rice': 'Rice',
  'paddy rice wetland': 'Rice',
  'paddy rice wetlands': 'Rice',
  'rice': 'Rice',
  'wheat': 'Wheat',
  'other cereals': 'Other Cereals',
  'cassava': 'Cassava',
  'sweet potato': 'Sweet Potato',
  'sweet potatoe': 'Sweet Potato',
  'sweet potatoes': 'Sweet Potato',
  'irish potato': 'Irish Potato',
  'irish potatoe': 'Irish Potato',
  'irish potatoes': 'Irish Potato',
  'yams & taro': 'Yams & Taro',
  'taro & yams': 'Yams & Taro',
  'yarm & taro': 'Yams & Taro',
  'yarms & taro': 'Yams & Taro',
  'cooking banana': 'Cooking Banana',
  'dessert banana': 'Dessert Banana',
  'banana for beer': 'Banana for Beer',
  'for beer': 'Banana for Beer',
  'banana': 'Banana',
  'bananas': 'Banana',
  'bean': 'Beans',
  'beans': 'Beans',
  'bush bean': 'Bush Bean',
  'bush beans': 'Bush Bean',
  'bush bean+small red bean': 'Bush Bean',
  'climbing bean': 'Climbing Bean',
  'climbing beans': 'Climbing Bean',
  'pea': 'Peas',
  'peas': 'Peas',
  'groundnut': 'Groundnuts',
  'groundnuts': 'Groundnuts',
  'ground nuts': 'Groundnuts',
  'soybean': 'Soybean',
  'soya beans': 'Soybean',
  'chia seed': 'Chia Seed',
  'chia seeds': 'Chia Seed',
  'vegetables': 'Vegetables',
  'fruits': 'Fruits',
  'fodder crops': 'Fodder Crops',
  'folder crops': 'Fodder Crops',
  'other crops': 'Other Crops',
};

function normalizeCropName(raw) {
  if (!raw) return null;
  const clean = String(raw).trim().toLowerCase().replace(/\s+/g, ' ');
  return cropAliasMap[clean] || null;
}

function normalizeNumber(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim().replace(/,/g, '');
  if (str === '-' || str === ' - ' || str === 'na' || str === '...' || str === '') return 0;
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function parseMatrixSheet(ws) {
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  // Find header row containing crop names
  let headerRowIdx = -1;
  for (let r = 0; r < Math.min(8, rows.length); r++) {
    const row = rows[r] || [];
    const countCrops = row.filter(cell => normalizeCropName(cell)).length;
    if (countCrops >= 3) {
      headerRowIdx = r;
      break;
    }
  }

  if (headerRowIdx === -1) return null;

  const headerRow = rows[headerRowIdx] || [];
  const colCrops = [];
  for (let c = 0; c < headerRow.length; c++) {
    const norm = normalizeCropName(headerRow[c]);
    colCrops[c] = norm; // may be null if category header or district column
  }

  // Parse data rows
  const districtData = {}; // { [districtName]: { [cropName]: number } }

  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    // First non-empty cell is usually District name
    let districtCell = row[0] || row[1];
    if (!districtCell || typeof districtCell !== 'string') continue;
    const districtName = districtCell.trim();
    if (districtName.toLowerCase().includes('total') || districtName.toLowerCase().includes('source') || districtName.length < 3) continue;

    districtData[districtName.toLowerCase()] = { rawName: districtName, crops: {} };
    for (let c = 0; c < row.length; c++) {
      const crop = colCrops[c];
      if (crop) {
        districtData[districtName.toLowerCase()].crops[crop] = normalizeNumber(row[c]);
      }
    }
  }

  return districtData;
}

async function testPrototype() {
  const fp = path.resolve(__dirname, '../../data/agriculture/2023/SAS 2023_Annual Tables (3).xlsx');
  const wb = xlsx.readFile(fp);

  console.log('Testing parsing of 2023 Season A...');
  const cultData = parseMatrixSheet(wb.Sheets['Table 10']); // Cultivated A
  const harvData = parseMatrixSheet(wb.Sheets['Table 13']); // Harvested A
  const prodData = parseMatrixSheet(wb.Sheets['Table 22']); // Production A
  const yieldData = parseMatrixSheet(wb.Sheets['Table 16']); // Yield A (Kg/ha)

  const districts = Object.keys(cultData);
  console.log(`Parsed ${districts.length} districts in 2023A.`);

  // Sample check for Bugesera or Nyarugenge
  const sampleDist = districts[0];
  console.log(`Sample District: ${cultData[sampleDist].rawName}`);
  const crops = Object.keys(cultData[sampleDist].crops);
  console.log(`Crops found (${crops.length}):`, crops);

  for (const crop of crops.slice(0, 6)) {
    const cult = cultData[sampleDist]?.crops[crop] || 0;
    const harv = harvData[sampleDist]?.crops[crop] || 0;
    const prod = prodData[sampleDist]?.crops[crop] || 0;
    const repYieldKg = yieldData[sampleDist]?.crops[crop] || 0;
    const calcYieldT = harv > 0 ? (prod / harv) : 0;
    console.log(`  - Crop: ${crop} | Cult: ${cult} Ha | Harv: ${harv} Ha | Prod: ${prod} MT | Rep Yield: ${(repYieldKg/1000).toFixed(2)} t/ha | Calc Yield: ${calcYieldT.toFixed(2)} t/ha`);
  }
}

testPrototype().catch(console.error);
