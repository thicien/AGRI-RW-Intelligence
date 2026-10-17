const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

const agricultureDir = path.resolve(__dirname, '../../data/agriculture');

// Master crop alias dictionary
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
  'small red bean': 'Bush Bean',
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

function findSheet(wb, targetName) {
  if (!wb || !targetName) return null;
  const match = wb.SheetNames.find(s => s.trim().toLowerCase() === targetName.trim().toLowerCase());
  return match ? wb.Sheets[match] : null;
}

function parseMatrixSheet(ws) {
  if (!ws) return null;
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
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
    colCrops[c] = normalizeCropName(headerRow[c]);
  }

  const districtData = {};
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    let districtCell = row[0] !== undefined && row[0] !== null && String(row[0]).trim() !== '' ? row[0] : row[1];
    if (!districtCell || typeof districtCell !== 'string') continue;
    const cleanName = districtCell.trim();
    if (cleanName.toLowerCase().includes('total') || cleanName.toLowerCase().includes('source') || cleanName.length < 3) continue;

    districtData[cleanName.toLowerCase()] = { rawName: cleanName, crops: {} };
    for (let c = 0; c < row.length; c++) {
      const crop = colCrops[c];
      if (crop) {
        districtData[cleanName.toLowerCase()].crops[crop] = normalizeNumber(row[c]);
      }
    }
  }

  return districtData;
}

function parseTransposedMatrix(ws) {
  if (!ws) return null;
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  let headerRowIdx = -1;
  for (let r = 0; r < Math.min(8, rows.length); r++) {
    const row = rows[r] || [];
    const hasDistricts = row.some(cell => typeof cell === 'string' && (cell.toLowerCase().includes('gasabo') || cell.toLowerCase().includes('nyarugenge') || cell.toLowerCase().includes('huye')));
    if (hasDistricts) {
      headerRowIdx = r;
      break;
    }
  }

  if (headerRowIdx === -1) return null;

  const headerRow = rows[headerRowIdx] || [];
  const colDistricts = [];
  for (let c = 0; c < headerRow.length; c++) {
    const val = headerRow[c];
    if (val && typeof val === 'string') {
      const clean = val.trim();
      if (!clean.toLowerCase().includes('crop') && !clean.toLowerCase().includes('total') && !clean.toLowerCase().includes('city') && !clean.toLowerCase().includes('province')) {
        colDistricts[c] = clean.toLowerCase();
      }
    }
  }

  const districtData = {};
  for (const d of colDistricts.filter(Boolean)) {
    districtData[d] = { rawName: d, crops: {} };
  }

  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const cropCell = row[0];
    if (!cropCell || typeof cropCell !== 'string') continue;
    const cropNorm = normalizeCropName(cropCell);
    if (!cropNorm) continue;

    for (let c = 1; c < row.length; c++) {
      const d = colDistricts[c];
      if (d && districtData[d]) {
        districtData[d].crops[cropNorm] = normalizeNumber(row[c]);
      }
    }
  }

  return districtData;
}

function parseAnyMatrixSheet(ws) {
  if (!ws) return {};
  const standard = parseMatrixSheet(ws);
  if (standard && Object.keys(standard).length >= 5) return standard;
  const transposed = parseTransposedMatrix(ws);
  if (transposed && Object.keys(transposed).length >= 5) return transposed;
  return {};
}


async function runPipeline() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'Mug2thi4',
    database: 'agrilens_db',
  });

  await client.connect();
  console.log('Connected to agrilens_db on PostgreSQL port 5433.');

  // Step 1: Ensure Seasons Exist (2018A through 2026B)
  console.log('\n--- Step 1: Checking Seasons Catalog ---');
  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
  for (const yr of years) {
    for (const lettr of ['A', 'B', 'C']) {
      if (yr === 2026 && lettr === 'C') continue;
      const code = `${yr}${lettr}`;
      const name = `Season ${lettr}`;
      const label = `${yr} Season ${lettr}`;
      await client.query(`
        INSERT INTO agrilens.seasons (name, year, season_code, official_label)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name, year) DO UPDATE SET season_code = EXCLUDED.season_code, official_label = EXCLUDED.official_label;
      `, [name, yr, code, label]);
    }
  }

  // Step 2: Ensure Crops Catalog Exists
  console.log('--- Step 2: Checking Crops Master Catalog ---');
  await client.query(`ALTER TABLE agrilens.crops ADD COLUMN IF NOT EXISTS code VARCHAR(50);`);
  const cropsMaster = [
    { name: 'Maize', code: 'MAIZE', category: 'Cereal' },
    { name: 'Sorghum', code: 'SORGHUM', category: 'Cereal' },
    { name: 'Rice', code: 'RICE', category: 'Cereal' },
    { name: 'Wheat', code: 'WHEAT', category: 'Cereal' },
    { name: 'Other Cereals', code: 'OTHER_CEREALS', category: 'Cereal' },
    { name: 'Cassava', code: 'CASSAVA', category: 'Root crop' },
    { name: 'Sweet Potato', code: 'SWEET_POTATO', category: 'Root crop' },
    { name: 'Irish Potato', code: 'IRISH_POTATO', category: 'Root crop' },
    { name: 'Yams & Taro', code: 'YAMS_TARO', category: 'Root crop' },
    { name: 'Cooking Banana', code: 'COOKING_BANANA', category: 'Banana' },
    { name: 'Dessert Banana', code: 'DESSERT_BANANA', category: 'Banana' },
    { name: 'Banana for Beer', code: 'BEER_BANANA', category: 'Banana' },
    { name: 'Banana', code: 'BANANA_AGG', category: 'Banana' },
    { name: 'Beans', code: 'BEANS', category: 'Legume' },
    { name: 'Bush Bean', code: 'BUSH_BEAN', category: 'Legume' },
    { name: 'Climbing Bean', code: 'CLIMBING_BEAN', category: 'Legume' },
    { name: 'Peas', code: 'PEAS', category: 'Legume' },
    { name: 'Groundnuts', code: 'GROUNDNUTS', category: 'Legume' },
    { name: 'Soybean', code: 'SOYBEAN', category: 'Legume' },
    { name: 'Chia Seed', code: 'CHIA_SEED', category: 'Specialty' },
    { name: 'Vegetables', code: 'VEGETABLES', category: 'Horticulture' },
    { name: 'Fruits', code: 'FRUITS', category: 'Horticulture' },
    { name: 'Fodder Crops', code: 'FODDER_CROPS', category: 'Fodder' },
    { name: 'Coffee', code: 'COFFEE', category: 'Cash crop' },
    { name: 'Tea', code: 'TEA', category: 'Cash crop' },
    { name: 'Other Crops', code: 'OTHER_CROPS', category: 'Other' },
  ];

  for (const c of cropsMaster) {
    await client.query(`
      INSERT INTO agrilens.crops (name, category, code, active)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category, code = EXCLUDED.code;
    `, [c.name, c.category, c.code]);
  }

  // Load lookup maps
  const seasonsRes = await client.query('SELECT id, season_code FROM agrilens.seasons');
  const seasonMap = {};
  seasonsRes.rows.forEach(r => seasonMap[r.season_code] = r.id);

  const cropsRes = await client.query('SELECT id, name FROM agrilens.crops');
  const cropDbMap = {};
  cropsRes.rows.forEach(r => cropDbMap[r.name.toLowerCase()] = r.id);

  const adminRes = await client.query(`
    SELECT id, code, name 
    FROM agrilens.administrative_units 
    WHERE unit_type = 'DISTRICT'
  `);
  const districtDbMap = {};
  adminRes.rows.forEach(r => {
    districtDbMap[r.name.toLowerCase()] = r.id;
    // Common alternative spellings
    districtDbMap[r.name.toLowerCase().replace(/-/g, ' ')] = r.id;
  });

  // Data Source & Dataset Version for Lineage
  const dsRes = await client.query(`
    SELECT id FROM agrilens.data_sources WHERE name LIKE '%NISR%' OR name LIKE '%National Institute%' LIMIT 1
  `);
  let sourceId = dsRes.rows[0]?.id;
  if (!sourceId) {
    const newDs = await client.query(`
      INSERT INTO agrilens.data_sources (name, provider, source_type, description)
      VALUES ('National Institute of Statistics of Rwanda', 'NISR', 'OFFICIAL_STATISTICS', 'Seasonal Agricultural Surveys (SAS)')
      RETURNING id;
    `);
    sourceId = newDs.rows[0].id;
  }

  const dsVerRes = await client.query(`
    SELECT id FROM agrilens.dataset_versions LIMIT 1
  `);
  const datasetVersionId = dsVerRes.rows[0]?.id || null;

  // Step 3: Define Ingestion Batches Across All Years
  const batches = [
    // 2025
    { yr: '2025', file: 'Tables_2025 Season A.xlsx', s_cult: 'Table 10', s_harv: 'Table 11', s_prod: 'Table 14', s_yield: 'Table 12', season: '2025A' },
    { yr: '2025', file: 'Tables_2025_Season_B_0.xlsx', s_cult: 'Table 9', s_harv: 'Table 10', s_prod: 'Table 13', s_yield: 'Table 11', season: '2025B' },
    { yr: '2025', file: 'SAS 2025_Annual Tables.xlsx', s_cult: 'Table 15', s_harv: 'Table 18', s_prod: 'Table 26', s_yield: 'Table 21', season: '2025C' },

    // 2024
    { yr: '2024', file: 'Tables_2024 Season A (1).xlsx', s_cult: 'Table 9', s_harv: 'Table 10', s_prod: 'Table 13', s_yield: 'Table 11', season: '2024A' },
    { yr: '2024', file: 'Tables_2024 Season B.xlsx', s_cult: 'Table 8', s_harv: 'Table 9', s_prod: 'Table 12', s_yield: 'Table 10', season: '2024B' },
    { yr: '2024', file: 'SAS 2024_Annual Tables.xlsx', s_cult: 'Table 12', s_harv: 'Table 15', s_prod: 'Table 23', s_yield: 'Table 18', season: '2024C' },

    // 2023
    { yr: '2023', file: 'SAS 2023_Annual Tables (3).xlsx', s_cult: 'Table 10', s_harv: 'Table 13', s_prod: 'Table 22', s_yield: 'Table 16', season: '2023A' },
    { yr: '2023', file: 'SAS 2023_Annual Tables (3).xlsx', s_cult: 'Table 11', s_harv: 'Table 14', s_prod: 'Table 23', s_yield: 'Table 17', season: '2023B' },
    { yr: '2023', file: 'SAS 2023_Annual Tables (3).xlsx', s_cult: 'Table 12', s_harv: 'Table 15', s_prod: 'Table 24', s_yield: 'Table 18', season: '2023C' },

    // 2022
    { yr: '2022', file: 'SAS 2022_Tables_0.xlsx', s_cult: 'Table 11', s_harv: 'Table 14', s_prod: 'Table 23', s_yield: 'Table 17', season: '2022A' },
    { yr: '2022', file: 'SAS 2022_Tables_0.xlsx', s_cult: 'Table 12', s_harv: 'Table 15', s_prod: 'Table 24', s_yield: 'Table 18', season: '2022B' },
    { yr: '2022', file: 'SAS 2022_Tables_0.xlsx', s_cult: 'Table 13', s_harv: 'Table 16', s_prod: 'Table 25', s_yield: 'Table 19', season: '2022C' },

    // 2021
    { yr: '2021', file: 'SAS 2021_Tables.xlsx', s_cult: 'Table 11', s_harv: 'Table 14', s_prod: 'Table 24', s_yield: 'Table 17', season: '2021A' },
    { yr: '2021', file: 'SAS 2021_Tables.xlsx', s_cult: 'Table 12', s_harv: 'Table 15', s_prod: 'Table 25', s_yield: 'Table 18', season: '2021B' },
    { yr: '2021', file: 'SAS 2021_Tables.xlsx', s_cult: 'Table 13', s_harv: 'Table 16', s_prod: 'Table 26', s_yield: 'Table 20', season: '2021C' },

    // 2020
    { yr: '2020', file: 'USAS 2020 _Final_Tables.xlsx', s_cult: 'Table 8', s_harv: 'Table 11', s_prod: 'Table 20', s_yield: 'Table 14', season: '2020A' },
    { yr: '2020', file: 'USAS 2020 _Final_Tables.xlsx', s_cult: 'Table 9', s_harv: 'Table 12', s_prod: 'Table 21', s_yield: 'Table 15', season: '2020B' },
    { yr: '2020', file: 'USAS 2020 _Final_Tables.xlsx', s_cult: 'Table 10', s_harv: 'Table 13', s_prod: 'Table 22', s_yield: 'Table 16', season: '2020C' },

    // 2019
    { yr: '2019', file: 'SAS 2019 _Annual report _Tables.xlsx', s_cult: 'Table 7', s_harv: 'Table 10', s_prod: 'Table 18', s_yield: 'Table 13', season: '2019A' },
    { yr: '2019', file: 'SAS 2019 _Annual report _Tables.xlsx', s_cult: 'Table 8', s_harv: 'Table 11', s_prod: 'Table 19', s_yield: 'Table 14', season: '2019B' },
    { yr: '2019', file: 'SAS 2019 _Annual report _Tables.xlsx', s_cult: 'Table 9', s_harv: 'Table 12', s_prod: 'Table 20', s_yield: 'Table 15', season: '2019C' },

    // 2018
    { yr: '2018', file: '2018 Annual Tables_Final (1).xlsx', s_cult: 'Appendix 1', s_harv: 'Appendix 4', s_prod: 'Appendix 6', s_yield: 'Appendix 9', season: '2018A' },
    { yr: '2018', file: '2018 Annual Tables_Final (1).xlsx', s_cult: 'Appendix 2', s_harv: 'Appendix 5', s_prod: 'Appendix 7', s_yield: 'Appendix 10', season: '2018B' },
    { yr: '2018', file: '2018 Annual Tables_Final (1).xlsx', s_cult: 'Appendix 3', s_harv: 'Appendix 5', s_prod: 'Appendix 8', s_yield: 'Appendix 11', season: '2018C' },
  ];

  console.log(`\n--- Step 4: Executing Ingestion Pipeline across ${batches.length} seasons ---`);
  let totalRowsIngested = 0;
  let totalWarnings = 0;

  for (const batch of batches) {
    const fp = path.join(agricultureDir, batch.yr, batch.file);
    if (!fs.existsSync(fp)) {
      console.log(`[SKIP] File not found: ${batch.yr}/${batch.file}`);
      continue;
    }

    const seasonId = seasonMap[batch.season];
    if (!seasonId) {
      console.log(`[SKIP] Season ID not found for ${batch.season}`);
      continue;
    }

    try {
      const wb = xlsx.readFile(fp);
      const wsCult = findSheet(wb, batch.s_cult);
      const wsHarv = findSheet(wb, batch.s_harv);
      const wsProd = findSheet(wb, batch.s_prod);
      const wsYield = findSheet(wb, batch.s_yield);

      if (!wsCult && !wsHarv && !wsProd) {
        console.log(`[SKIP] Sheets not found in ${batch.season} (${batch.file})`);
        continue;
      }

      const cultData = parseAnyMatrixSheet(wsCult) || {};
      const harvData = parseAnyMatrixSheet(wsHarv) || {};
      const prodData = parseAnyMatrixSheet(wsProd) || {};
      const yieldData = parseAnyMatrixSheet(wsYield) || {};

      // Get all district keys
      const districtKeys = Array.from(new Set([
        ...Object.keys(cultData),
        ...Object.keys(harvData),
        ...Object.keys(prodData),
      ]));

      let batchIngested = 0;

      for (const dKey of districtKeys) {
        const districtId = districtDbMap[dKey];
        if (!districtId) continue; // skip province aggregates or unknown rows

        const dCult = cultData[dKey]?.crops || {};
        const dHarv = harvData[dKey]?.crops || {};
        const dProd = prodData[dKey]?.crops || {};
        const dYield = yieldData[dKey]?.crops || {};

        // All crops in this district
        const cropList = Array.from(new Set([
          ...Object.keys(dCult),
          ...Object.keys(dHarv),
          ...Object.keys(dProd),
          ...Object.keys(dYield),
        ]));

        for (const cropName of cropList) {
          const cropId = cropDbMap[cropName.toLowerCase()];
          if (!cropId) continue;

          let cultArea = dCult[cropName] || 0;
          let harvArea = dHarv[cropName] || 0;
          let prodTonnes = dProd[cropName] || 0;
          let repYield = dYield[cropName] || 0;

          // If reported yield is in Kg/ha (> 50 for non-zeros, convert to t/ha)
          if (repYield > 50) repYield = repYield / 1000.0;

          // Data Quality Rule 1: HARVESTED_AREA_LE_CULTIVATED
          let qualityStatus = 'VERIFIED';
          const validationNotes = [];

          if (cultArea === 0 && harvArea > 0) {
            cultArea = harvArea; // harvest reported without separate cultivated area
            validationNotes.push('Cultivated area imputed from harvested area.');
          }

          if (harvArea > cultArea * 1.05) {
            // Harvest area exceeding cultivated area beyond 5% margin
            qualityStatus = 'HARVEST_GAP_WARNING';
            validationNotes.push(`Harvested area (${harvArea} Ha) exceeds cultivated area (${cultArea} Ha).`);
            totalWarnings++;
          }

          // Data Quality Rule 2: YIELD_INTEGRITY
          // Consistently calculate biological yield = Production / Harvested Area
          let calcYield = 0;
          let calcMethod = 'PRODUCTION_DIVIDED_BY_HARVESTED_AREA';

          if (harvArea > 0) {
            calcYield = prodTonnes / harvArea;
          } else if (repYield > 0 && prodTonnes > 0) {
            calcYield = repYield;
            calcMethod = 'NISR_REPORTED_AVERAGE_YIELD';
          }

          // Outlier sanity check
          if (calcYield > 80) {
            qualityStatus = 'OUTLIER_INVESTIGATION_FLAG';
            validationNotes.push(`Yield ${calcYield.toFixed(2)} t/ha flagged for outlier verification.`);
            totalWarnings++;
          }

          // Skip completely zero/empty records to avoid database bloat
          if (cultArea === 0 && harvArea === 0 && prodTonnes === 0 && calcYield === 0) {
            continue;
          }

          const notesStr = validationNotes.length > 0 ? validationNotes.join('; ') : 'Complies with NISR SAS standard.';

          // UPSERT into crop_statistics
          await client.query(`
            INSERT INTO agrilens.crop_statistics (
              admin_unit_id,
              crop_id,
              season_id,
              dataset_version_id,
              area_ha,
              harvested_area_ha,
              production_tonnes,
              yield_t_ha,
              yield_calculation_method,
              data_quality_status,
              validation_notes,
              source_file,
              created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
            ON CONFLICT (admin_unit_id, crop_id, season_id)
            DO UPDATE SET
              area_ha = EXCLUDED.area_ha,
              harvested_area_ha = EXCLUDED.harvested_area_ha,
              production_tonnes = EXCLUDED.production_tonnes,
              yield_t_ha = EXCLUDED.yield_t_ha,
              yield_calculation_method = EXCLUDED.yield_calculation_method,
              data_quality_status = EXCLUDED.data_quality_status,
              validation_notes = EXCLUDED.validation_notes,
              source_file = EXCLUDED.source_file;
          `, [
            districtId,
            cropId,
            seasonId,
            datasetVersionId,
            cultArea,
            harvArea,
            prodTonnes,
            parseFloat(calcYield.toFixed(3)),
            calcMethod,
            qualityStatus,
            notesStr,
            batch.file,
          ]);

          batchIngested++;
          totalRowsIngested++;
        }
      }

      console.log(`✓ [${batch.season}] Ingested ${batchIngested} crop-district rows from ${batch.file}`);
    } catch (err) {
      console.error(`✗ Error processing ${batch.season} (${batch.file}):`, err.message);
    }
  }

  // Step 5: Summary Audit
  console.log('\n--- Step 5: Pipeline Audit & Summary ---');
  console.log(`Total Seasonal Crop Records Ingested/Updated: ${totalRowsIngested}`);
  console.log(`Total Quality Warnings Logged: ${totalWarnings}`);

  // Query distinct summary from database
  const auditRes = await client.query(`
    SELECT 
      s.season_code,
      COUNT(cs.id) AS total_records,
      COUNT(DISTINCT cs.crop_id) AS distinct_crops,
      COUNT(DISTINCT cs.admin_unit_id) AS distinct_districts,
      ROUND(AVG(cs.yield_t_ha)::numeric, 2) AS avg_yield_t_ha,
      COUNT(CASE WHEN cs.data_quality_status = 'HARVEST_GAP_WARNING' THEN 1 END) AS gap_warnings,
      COUNT(CASE WHEN cs.data_quality_status = 'OUTLIER_INVESTIGATION_FLAG' THEN 1 END) AS outlier_flags
    FROM agrilens.crop_statistics cs
    JOIN agrilens.seasons s ON s.id = cs.season_id
    GROUP BY s.season_code
    ORDER BY s.season_code;
  `);

  console.log('\n================ DATABASE AUDIT BY SEASON ================');
  console.table(auditRes.rows);

  await client.end();
  console.log('\nSeasonal Agricultural Database & Data-Quality Pipeline completed successfully.');
}

runPipeline().catch(console.error);
