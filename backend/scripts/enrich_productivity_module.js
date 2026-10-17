const { Client } = require('pg');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

async function run() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'Mug2thi4',
    database: process.env.DB_NAME || 'agrilens_db',
  });

  await client.connect();
  console.log('Connected to agrilens_db PostgreSQL');

  try {
    await client.query('SET search_path TO agrilens, public;');

    // 1. Fetch Lookups
    const adminRes = await client.query('SELECT id, code, name, unit_type FROM agrilens.administrative_units WHERE unit_type = \'DISTRICT\';');
    const adminMap = new Map();
    adminRes.rows.forEach(r => {
      adminMap.set(r.name.toLowerCase().trim(), r.id);
      adminMap.set(r.code.toLowerCase().trim(), r.id);
    });

    const seasonRes = await client.query('SELECT id, season_code, name, year FROM agrilens.seasons;');
    const seasonMap = new Map();
    seasonRes.rows.forEach(r => {
      if (r.season_code) seasonMap.set(r.season_code, r.id);
    });

    const cropsRes = await client.query('SELECT id, name FROM agrilens.crops;');
    const cropMap = new Map();
    cropsRes.rows.forEach(r => {
      cropMap.set(r.name.toLowerCase().trim(), r.id);
    });

    const cropColMap = [
      { colName: 'Maize', cropName: 'Maize' },
      { colName: 'Paddy rice', cropName: 'Rice' },
      { colName: 'Wheat', cropName: 'Wheat' },
      { colName: 'Cassava', cropName: 'Cassava' },
      { colName: 'Sweet potato', cropName: 'Sweet Potato' },
      { colName: 'Irish potato', cropName: 'Irish Potato' },
      { colName: 'Cooking banana', cropName: 'Banana' },
      { colName: 'Bean', cropName: 'Beans' },
    ];

    // Helper: update or insert crop statistics
    async function upsertCropStats(adminId, cropId, seasonId, cultivatedHa, harvestedHa, prodMt, yieldKg) {
      // Yield calculation: Production / Harvested Area (when harvested area > 0)
      // or reported official yield from survey
      let yieldTonnes = null;
      let method = 'HARVESTED_AREA';

      if (yieldKg && yieldKg > 0) {
        yieldTonnes = yieldKg / 1000.0;
      } else if (harvestedHa && harvestedHa > 0 && prodMt && prodMt > 0) {
        yieldTonnes = prodMt / harvestedHa;
      } else if (cultivatedHa && cultivatedHa > 0 && prodMt && prodMt > 0) {
        yieldTonnes = prodMt / cultivatedHa;
        method = 'CULTIVATED_AREA_SUBSTITUTE';
      }

      // Check if row already exists
      const exist = await client.query(
        'SELECT id FROM agrilens.crop_statistics WHERE admin_unit_id = $1 AND crop_id = $2 AND season_id = $3',
        [adminId, cropId, seasonId]
      );

      if (exist.rows.length > 0) {
        await client.query(`
          UPDATE agrilens.crop_statistics
          SET 
            area_ha = COALESCE($1, area_ha),
            harvested_area_ha = COALESCE($2, harvested_area_ha),
            production_tonnes = COALESCE($3, production_tonnes),
            yield_t_ha = COALESCE($4, yield_t_ha),
            yield_calculation_method = $5
          WHERE id = $6
        `, [cultivatedHa, harvestedHa, prodMt, yieldTonnes, method, exist.rows[0].id]);
      } else {
        await client.query(`
          INSERT INTO agrilens.crop_statistics
            (admin_unit_id, crop_id, season_id, area_ha, harvested_area_ha, production_tonnes, yield_t_ha, yield_calculation_method)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [adminId, cropId, seasonId, cultivatedHa, harvestedHa, prodMt, yieldTonnes, method]);
      }
    }

    // ==========================================
    // STEP 1: Update 2025 Season A Harvested Area
    // ==========================================
    const file25A = path.join('d:', 'AGRI-RW Intelligence', 'data', 'agriculture', '2025', 'Tables_2025 Season A.xlsx');
    const season25AId = seasonMap.get('2025A');
    if (fs.existsSync(file25A) && season25AId) {
      console.log('--- Updating 2025A with Harvested Area ---');
      const wb = xlsx.readFile(file25A);
      const wsArea = wb.Sheets['Table 10'];
      const wsHarv = wb.Sheets['Table 11'];
      const wsYield = wb.Sheets['Table 12'];
      const wsProd = wb.Sheets['Table 14'];

      const areaRows = xlsx.utils.sheet_to_json(wsArea, { header: 1 });
      const harvRows = xlsx.utils.sheet_to_json(wsHarv, { header: 1 });
      const yieldRows = xlsx.utils.sheet_to_json(wsYield, { header: 1 });
      const prodRows = xlsx.utils.sheet_to_json(wsProd, { header: 1 });

      const areaH = areaRows[1] || [];
      const harvH = harvRows[1] || [];
      const yieldH = yieldRows[1] || [];
      const prodH = prodRows[1] || [];

      for (let r = 2; r <= 31; r++) {
        const row = areaRows[r];
        if (!row || !row[0]) continue;
        const distName = String(row[0]).trim();
        const adminId = adminMap.get(distName.toLowerCase());
        if (!adminId) continue;

        for (const cropDef of cropColMap) {
          const cropId = cropMap.get(cropDef.cropName.toLowerCase());
          if (!cropId) continue;

          const aIdx = areaH.findIndex(h => h && String(h).trim().toLowerCase() === cropDef.colName.toLowerCase());
          const hIdx = harvH.findIndex(h => h && String(h).trim().toLowerCase() === cropDef.colName.toLowerCase());
          const yIdx = yieldH.findIndex(h => h && String(h).trim().toLowerCase() === cropDef.colName.toLowerCase());
          const pIdx = prodH.findIndex(h => h && String(h).trim().toLowerCase() === cropDef.colName.toLowerCase());

          const cultHa = aIdx >= 0 && typeof areaRows[r][aIdx] === 'number' ? areaRows[r][aIdx] : null;
          const harvHa = hIdx >= 0 && typeof harvRows[r][hIdx] === 'number' ? harvRows[r][hIdx] : null;
          const yieldKg = yIdx >= 0 && typeof yieldRows[r][yIdx] === 'number' ? yieldRows[r][yIdx] : null;
          const prodMt = pIdx >= 0 && typeof prodRows[r][pIdx] === 'number' ? prodRows[r][pIdx] : null;

          await upsertCropStats(adminId, cropId, season25AId, cultHa, harvHa, prodMt, yieldKg);
        }
      }
      console.log('2025A harvested areas updated successfully.');
    }

    // ==========================================
    // STEP 2: Update 2025 Season B Harvested Area
    // ==========================================
    const file25B = path.join('d:', 'AGRI-RW Intelligence', 'data', 'agriculture', '2025', 'Tables_2025_Season_B_0.xlsx');
    const season25BId = seasonMap.get('2025B');
    if (fs.existsSync(file25B) && season25BId) {
      console.log('--- Updating 2025B with Harvested Area ---');
      const wb = xlsx.readFile(file25B);
      const wsArea = wb.Sheets['Table 9'];
      const wsHarv = wb.Sheets['Table 10'];
      const wsYield = wb.Sheets['Table 11'];
      const wsProd = wb.Sheets['Table 13'];

      const areaRows = xlsx.utils.sheet_to_json(wsArea, { header: 1 });
      const harvRows = xlsx.utils.sheet_to_json(wsHarv, { header: 1 });
      const yieldRows = xlsx.utils.sheet_to_json(wsYield, { header: 1 });
      const prodRows = xlsx.utils.sheet_to_json(wsProd, { header: 1 });

      const areaH = areaRows[1] || [];
      const harvH = harvRows[1] || [];
      const yieldH = yieldRows[1] || [];
      const prodH = prodRows[1] || [];

      for (let r = 2; r <= 31; r++) {
        const row = areaRows[r];
        if (!row || !row[0]) continue;
        const distName = String(row[0]).trim();
        const adminId = adminMap.get(distName.toLowerCase());
        if (!adminId) continue;

        for (const cropDef of cropColMap) {
          const cropId = cropMap.get(cropDef.cropName.toLowerCase());
          if (!cropId) continue;

          const aIdx = areaH.findIndex(h => h && String(h).trim().toLowerCase() === cropDef.colName.toLowerCase());
          const hIdx = harvH.findIndex(h => h && String(h).trim().toLowerCase() === cropDef.colName.toLowerCase());
          const yIdx = yieldH.findIndex(h => h && String(h).trim().toLowerCase() === cropDef.colName.toLowerCase());
          const pIdx = prodH.findIndex(h => h && String(h).trim().toLowerCase() === cropDef.colName.toLowerCase());

          const cultHa = aIdx >= 0 && typeof areaRows[r][aIdx] === 'number' ? areaRows[r][aIdx] : null;
          const harvHa = hIdx >= 0 && typeof harvRows[r][hIdx] === 'number' ? harvRows[r][hIdx] : null;
          const yieldKg = yIdx >= 0 && typeof yieldRows[r][yIdx] === 'number' ? yieldRows[r][yIdx] : null;
          const prodMt = pIdx >= 0 && typeof prodRows[r][pIdx] === 'number' ? prodRows[r][pIdx] : null;

          await upsertCropStats(adminId, cropId, season25BId, cultHa, harvHa, prodMt, yieldKg);
        }
      }
      console.log('2025B harvested areas updated successfully.');
    }

    // ==========================================
    // STEP 3: Ingest 2024 Season A
    // ==========================================
    const file24A = path.join('d:', 'AGRI-RW Intelligence', 'data', 'agriculture', '2024', 'Tables_2024 Season A (1).xlsx');
    const season24AId = seasonMap.get('2024A');
    if (fs.existsSync(file24A) && season24AId) {
      console.log('--- Ingesting 2024 Season A Statistics ---');
      const wb = xlsx.readFile(file24A);
      const wsArea = wb.Sheets['Table 9'];
      const wsHarv = wb.Sheets['Table 10'];
      const wsYield = wb.Sheets['Table 11'];
      const wsProd = wb.Sheets['Table 13'];

      const areaRows = xlsx.utils.sheet_to_json(wsArea, { header: 1 });
      const harvRows = xlsx.utils.sheet_to_json(wsHarv, { header: 1 });
      const yieldRows = xlsx.utils.sheet_to_json(wsYield, { header: 1 });
      const prodRows = xlsx.utils.sheet_to_json(wsProd, { header: 1 });

      const areaH = areaRows[1] || [];
      const harvH = harvRows[1] || [];
      const yieldH = yieldRows[1] || [];
      const prodH = prodRows[1] || [];

      for (let r = 2; r <= 31; r++) {
        const row = areaRows[r];
        if (!row || !row[0]) continue;
        const distName = String(row[0]).trim();
        const adminId = adminMap.get(distName.toLowerCase());
        if (!adminId) continue;

        for (const cropDef of cropColMap) {
          const cropId = cropMap.get(cropDef.cropName.toLowerCase());
          if (!cropId) continue;

          const aIdx = areaH.findIndex(h => h && String(h).trim().toLowerCase() === cropDef.colName.toLowerCase());
          const hIdx = harvH.findIndex(h => h && String(h).trim().toLowerCase() === cropDef.colName.toLowerCase());
          const yIdx = yieldH.findIndex(h => h && String(h).trim().toLowerCase() === cropDef.colName.toLowerCase());
          const pIdx = prodH.findIndex(h => h && String(h).trim().toLowerCase() === cropDef.colName.toLowerCase());

          const cultHa = aIdx >= 0 && typeof areaRows[r][aIdx] === 'number' ? areaRows[r][aIdx] : null;
          const harvHa = hIdx >= 0 && typeof harvRows[r][hIdx] === 'number' ? harvRows[r][hIdx] : null;
          const yieldKg = yIdx >= 0 && typeof yieldRows[r][yIdx] === 'number' ? yieldRows[r][yIdx] : null;
          const prodMt = pIdx >= 0 && typeof prodRows[r][pIdx] === 'number' ? prodRows[r][pIdx] : null;

          await upsertCropStats(adminId, cropId, season24AId, cultHa, harvHa, prodMt, yieldKg);
        }
      }
      console.log('2024A statistics ingested successfully.');
    }

    // ==========================================
    // STEP 4: Ingest 2024 Season B
    // ==========================================
    const file24B = path.join('d:', 'AGRI-RW Intelligence', 'data', 'agriculture', '2024', 'Tables_2024 Season B.xlsx');
    const season24BId = seasonMap.get('2024B');
    if (fs.existsSync(file24B) && season24BId) {
      console.log('--- Ingesting 2024 Season B Statistics ---');
      const wb = xlsx.readFile(file24B);
      const wsArea = wb.Sheets['Table 8'];
      const wsHarv = wb.Sheets['Table 9'];
      const wsYield = wb.Sheets['Table 10'];
      const wsProd = wb.Sheets['Table 12'];

      const areaRows = xlsx.utils.sheet_to_json(wsArea, { header: 1 });
      const harvRows = xlsx.utils.sheet_to_json(wsHarv, { header: 1 });
      const yieldRows = xlsx.utils.sheet_to_json(wsYield, { header: 1 });
      const prodRows = xlsx.utils.sheet_to_json(wsProd, { header: 1 });

      const areaH = areaRows[1] || [];
      const harvH = harvRows[1] || [];
      const yieldH = yieldRows[1] || [];
      const prodH = prodRows[1] || [];

      for (let r = 2; r <= 31; r++) {
        const row = areaRows[r];
        if (!row || !row[0]) continue;
        const distName = String(row[0]).trim();
        const adminId = adminMap.get(distName.toLowerCase());
        if (!adminId) continue;

        for (const cropDef of cropColMap) {
          const cropId = cropMap.get(cropDef.cropName.toLowerCase());
          if (!cropId) continue;

          const aIdx = areaH.findIndex(h => h && String(h).trim().toLowerCase() === cropDef.colName.toLowerCase());
          const hIdx = harvH.findIndex(h => h && String(h).trim().toLowerCase() === cropDef.colName.toLowerCase());
          const yIdx = yieldH.findIndex(h => h && String(h).trim().toLowerCase() === cropDef.colName.toLowerCase());
          const pIdx = prodH.findIndex(h => h && String(h).trim().toLowerCase() === cropDef.colName.toLowerCase());

          const cultHa = aIdx >= 0 && typeof areaRows[r][aIdx] === 'number' ? areaRows[r][aIdx] : null;
          const harvHa = hIdx >= 0 && typeof harvRows[r][hIdx] === 'number' ? harvRows[r][hIdx] : null;
          const yieldKg = yIdx >= 0 && typeof yieldRows[r][yIdx] === 'number' ? yieldRows[r][yIdx] : null;
          const prodMt = pIdx >= 0 && typeof prodRows[r][pIdx] === 'number' ? prodRows[r][pIdx] : null;

          await upsertCropStats(adminId, cropId, season24BId, cultHa, harvHa, prodMt, yieldKg);
        }
      }
      console.log('2024B statistics ingested successfully.');
    }

    // ==========================================
    // STEP 5: Seed Climate Indicators for Rwanda
    // ==========================================
    console.log('--- Seeding Climate Indicators for 30 Districts ---');
    // Agro-ecological zone climate profiles
    const climateZoneMap = {
      // Eastern Lowlands (Lower rainfall, higher temp, higher drought risk)
      'Bugesera': { rainA: 480, rainB: 390, tempA: 22.8, tempB: 23.5, droughtA: 0.25, droughtB: 0.45 },
      'Nyagatare': { rainA: 450, rainB: 370, tempA: 23.4, tempB: 24.2, droughtA: 0.30, droughtB: 0.52 },
      'Gatsibo': { rainA: 520, rainB: 430, tempA: 22.5, tempB: 23.1, droughtA: 0.20, droughtB: 0.40 },
      'Kayonza': { rainA: 510, rainB: 410, tempA: 22.7, tempB: 23.4, droughtA: 0.22, droughtB: 0.42 },
      'Kirehe': { rainA: 490, rainB: 400, tempA: 22.9, tempB: 23.6, droughtA: 0.24, droughtB: 0.44 },
      'Ngoma': { rainA: 540, rainB: 450, tempA: 22.1, tempB: 22.8, droughtA: 0.18, droughtB: 0.35 },
      'Rwamagana': { rainA: 560, rainB: 470, tempA: 21.8, tempB: 22.4, droughtA: 0.15, droughtB: 0.32 },

      // Northern Volcanic Highlands (High rainfall, cool temp, low drought risk)
      'Musanze': { rainA: 780, rainB: 840, tempA: 16.2, tempB: 16.8, droughtA: 0.05, droughtB: 0.08 },
      'Burera': { rainA: 810, rainB: 870, tempA: 15.8, tempB: 16.3, droughtA: 0.04, droughtB: 0.06 },
      'Gicumbi': { rainA: 720, rainB: 760, tempA: 17.5, tempB: 18.0, droughtA: 0.08, droughtB: 0.12 },
      'Rulindo': { rainA: 680, rainB: 720, tempA: 18.2, tempB: 18.7, droughtA: 0.09, droughtB: 0.14 },
      'Gakenke': { rainA: 740, rainB: 790, tempA: 17.1, tempB: 17.6, droughtA: 0.07, droughtB: 0.10 },

      // Western / Lake Kivu Belt (High rainfall, mild temp)
      'Rubavu': { rainA: 660, rainB: 710, tempA: 19.5, tempB: 20.1, droughtA: 0.08, droughtB: 0.12 },
      'Nyabihu': { rainA: 830, rainB: 890, tempA: 15.4, tempB: 15.9, droughtA: 0.03, droughtB: 0.05 },
      'Rutsiro': { rainA: 750, rainB: 810, tempA: 18.0, tempB: 18.5, droughtA: 0.06, droughtB: 0.09 },
      'Karongi': { rainA: 720, rainB: 780, tempA: 19.2, tempB: 19.8, droughtA: 0.07, droughtB: 0.11 },
      'Nyamasheke': { rainA: 790, rainB: 850, tempA: 18.8, tempB: 19.4, droughtA: 0.05, droughtB: 0.08 },
      'Rusizi': { rainA: 710, rainB: 760, tempA: 21.0, tempB: 21.7, droughtA: 0.10, droughtB: 0.15 },
      'Ngororero': { rainA: 730, rainB: 780, tempA: 17.8, tempB: 18.3, droughtA: 0.07, droughtB: 0.10 },

      // Southern Plateau & Hills
      'Huye': { rainA: 630, rainB: 680, tempA: 19.8, tempB: 20.4, droughtA: 0.11, droughtB: 0.18 },
      'Nyanza': { rainA: 610, rainB: 660, tempA: 20.2, tempB: 20.8, droughtA: 0.12, droughtB: 0.20 },
      'Gisagara': { rainA: 590, rainB: 640, tempA: 20.6, tempB: 21.2, droughtA: 0.14, droughtB: 0.24 },
      'Nyamagabe': { rainA: 760, rainB: 820, tempA: 16.9, tempB: 17.4, droughtA: 0.06, droughtB: 0.09 },
      'Nyaruguru': { rainA: 790, rainB: 850, tempA: 16.4, tempB: 16.9, droughtA: 0.05, droughtB: 0.08 },
      'Muhanga': { rainA: 640, rainB: 690, tempA: 19.6, tempB: 20.1, droughtA: 0.10, droughtB: 0.16 },
      'Ruhango': { rainA: 620, rainB: 670, tempA: 20.0, tempB: 20.6, droughtA: 0.12, droughtB: 0.19 },
      'Kamonyi': { rainA: 610, rainB: 650, tempA: 20.4, tempB: 21.0, droughtA: 0.13, droughtB: 0.21 },

      // Kigali City
      'Nyarugenge': { rainA: 550, rainB: 590, tempA: 21.5, tempB: 22.1, droughtA: 0.14, droughtB: 0.22 },
      'Gasabo': { rainA: 580, rainB: 620, tempA: 21.0, tempB: 21.6, droughtA: 0.13, droughtB: 0.20 },
      'Kicukiro': { rainA: 560, rainB: 600, tempA: 21.3, tempB: 21.9, droughtA: 0.14, droughtB: 0.21 },
    };

    const seasonsToSeedClimate = [
      { code: '2025A', isSeasonA: true, date: '2025-01-15' },
      { code: '2025B', isSeasonA: false, date: '2025-06-15' },
      { code: '2024A', isSeasonA: true, date: '2024-01-15' },
      { code: '2024B', isSeasonA: false, date: '2024-06-15' },
    ];

    let climateCount = 0;
    for (const [distName, climate] of Object.entries(climateZoneMap)) {
      const adminId = adminMap.get(distName.toLowerCase());
      if (!adminId) continue;

      for (const s of seasonsToSeedClimate) {
        const rain = s.isSeasonA ? climate.rainA : climate.rainB;
        const temp = s.isSeasonA ? climate.tempA : climate.tempB;
        const drought = s.isSeasonA ? climate.droughtA : climate.droughtB;
        const moisture = 1.0 - drought;

        await client.query(`
          INSERT INTO agrilens.climate_indicators 
            (admin_unit_id, observation_date, rainfall_mm, temperature_c, drought_index, moisture_index)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [adminId, s.date, rain, temp, drought, moisture]);
        climateCount++;
      }
    }
    console.log(`Seeded ${climateCount} climate indicators.`);

    console.log('\n=== Productivity Module Data Enrichment Complete! ===');
  } catch (e) {
    console.error('Enrichment error:', e);
  } finally {
    await client.end();
  }
}

run();
