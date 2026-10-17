const { Client } = require('pg');

async function seedTradeIntelligence() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'Mug2thi4',
    database: 'agrilens_db',
  });

  try {
    await client.connect();
    console.log('Connected to agrilens_db on PostgreSQL port 5433.');

    console.log('--- Step 1: Creating Trade Intelligence Tables ---');

    // 1. National & Product Trade Season Statistics (Exports & Imports)
    await client.query(`
      CREATE TABLE IF NOT EXISTS agrilens.trade_season_statistics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        season_code VARCHAR(20) NOT NULL,
        year INTEGER NOT NULL,
        season_name VARCHAR(50) NOT NULL,
        product_id UUID REFERENCES agrilens.agricultural_products(id),
        product_name VARCHAR(100) NOT NULL,
        product_category VARCHAR(50) NOT NULL,
        hs_code VARCHAR(20),
        domestic_production_mt NUMERIC(14,2) DEFAULT 0,
        export_quantity_mt NUMERIC(14,2) DEFAULT 0,
        export_value_usd NUMERIC(14,2) DEFAULT 0,
        unit_value_usd_per_mt NUMERIC(10,2) DEFAULT 0,
        import_quantity_mt NUMERIC(14,2) DEFAULT 0,
        import_value_usd NUMERIC(14,2) DEFAULT 0,
        net_trade_status VARCHAR(50) DEFAULT 'NET_EXPORTER',
        growth_trend_pct NUMERIC(6,2) DEFAULT 0,
        performance_status VARCHAR(50) DEFAULT 'EXPANDING',
        primary_destinations JSONB DEFAULT '[]',
        peak_months JSONB DEFAULT '[]',
        phytosanitary_rules JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_trade_season_product UNIQUE (season_code, product_name)
      );
    `);

    // 2. District-Level Export Supply Statistics across all 30 districts & seasons
    await client.query(`
      CREATE TABLE IF NOT EXISTS agrilens.district_export_supply_statistics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_unit_id UUID NOT NULL REFERENCES agrilens.administrative_units(id),
        district_name VARCHAR(100) NOT NULL,
        province_name VARCHAR(100) NOT NULL,
        season_code VARCHAR(20) NOT NULL,
        year INTEGER NOT NULL,
        season_name VARCHAR(50) NOT NULL,
        primary_export_crops JSONB DEFAULT '[]',
        total_crop_production_mt NUMERIC(14,2) NOT NULL DEFAULT 0,
        market_surplus_volume_mt NUMERIC(14,2) NOT NULL DEFAULT 0,
        estimated_exportable_volume_mt NUMERIC(14,2) NOT NULL DEFAULT 0,
        export_readiness_score NUMERIC(5,2) DEFAULT 50.0,
        export_tier VARCHAR(50) DEFAULT 'TIER_2_REGIONAL_EXPORTER',
        nearest_exit_hub VARCHAR(100) DEFAULT 'Kigali International Airport',
        distance_to_exit_km NUMERIC(6,2) DEFAULT 0,
        cooperatives_export_ready_count INTEGER DEFAULT 0,
        quality_certification_pct NUMERIC(5,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_district_season_trade UNIQUE (district_name, season_code)
      );
    `);

    console.log('--- Step 2: Fetching Seasons, Districts & Products ---');
    const seasonsRes = await client.query('SELECT season_code, year, name AS season_name FROM agrilens.seasons ORDER BY year ASC, season_code ASC;');
    const seasons = seasonsRes.rows;
    console.log(`Loaded ${seasons.length} seasons.`);

    const districtsRes = await client.query(`
      SELECT id, name, code 
      FROM agrilens.administrative_units 
      WHERE unit_type = 'DISTRICT'
      ORDER BY name;
    `);
    const districts = districtsRes.rows;
    console.log(`Loaded ${districts.length} districts.`);

    const productsRes = await client.query('SELECT id, name, product_code, product_category FROM agrilens.agricultural_products;');
    const productsMap = {};
    productsRes.rows.forEach(p => {
      productsMap[p.name] = p.id;
    });

    console.log('--- Step 3: Seeding Comprehensive Export Destinations & Market Protocols ---');
    await client.query(`
      INSERT INTO agrilens.export_destinations (country_name, iso2, iso3, region, active)
      VALUES 
        ('Germany', 'DE', 'DEU', 'EUROPE', true),
        ('Belgium', 'BE', 'BEL', 'EUROPE', true),
        ('Saudi Arabia', 'SA', 'SAU', 'MIDDLE_EAST', true),
        ('Pakistan', 'PK', 'PAK', 'ASIA', true),
        ('Uganda', 'UG', 'UGA', 'REGIONAL_EAC_COMESA', true),
        ('Kenya', 'KE', 'KEN', 'REGIONAL_EAC_COMESA', true)
      ON CONFLICT (country_name) DO NOTHING;
    `);

    console.log('--- Step 4: Seeding National & Product Trade Statistics across 38 Seasons ---');

    // Strategic Commodities Master List
    const tradeCommodities = [
      {
        name: 'Coffee',
        category: 'TRADITIONAL_EXPORT',
        hs_code: '0901',
        baseProd: 22000,
        baseExpQty: 19500,
        unitVal: 5800, // USD/MT
        baseImpQty: 50,
        impUnitVal: 4000,
        status: 'NET_EXPORTER',
        perf: 'EXPANDING',
        growth: 8.4,
        destinations: ['United States', 'Switzerland', 'Germany', 'United Kingdom', 'Belgium'],
        peakMonths: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
        rules: {
          certification: 'Fairtrade, Rainforest Alliance, Specialty Coffee SCA 86+',
          phytosanitary: 'Coffee Berry Borer phytosanitary certificate',
          tariffs: 'Duty-free under AGOA (US) and EBA (EU)'
        }
      },
      {
        name: 'Tea',
        category: 'TRADITIONAL_EXPORT',
        hs_code: '0902',
        baseProd: 38000,
        baseExpQty: 36500,
        unitVal: 3150, // USD/MT
        baseImpQty: 80,
        impUnitVal: 2800,
        status: 'NET_EXPORTER',
        perf: 'EXPANDING',
        growth: 6.2,
        destinations: ['Pakistan', 'United Kingdom', 'Egypt', 'United Arab Emirates', 'Kazakhstan'],
        peakMonths: ['Jan', 'Feb', 'Mar', 'Oct', 'Nov', 'Dec'],
        rules: {
          certification: 'Rainforest Alliance, ISO 22000, Ethical Tea Partnership',
          phytosanitary: 'Standard phytosanitary clearance',
          tariffs: 'Preferential Mombasa Tea Auction trading protocol'
        }
      },
      {
        name: 'Hass Avocado',
        category: 'HORTICULTURE',
        hs_code: '080440',
        baseProd: 42000,
        baseExpQty: 8800,
        unitVal: 2250, // USD/MT
        baseImpQty: 100,
        impUnitVal: 1500,
        status: 'NET_EXPORTER',
        perf: 'EXPANDING',
        growth: 24.5,
        destinations: ['Netherlands', 'United Arab Emirates', 'United Kingdom', 'France', 'Spain'],
        peakMonths: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
        rules: {
          certification: 'GlobalGAP, SMETA Ethical Audit, BRCGS',
          phytosanitary: 'EU Plant Health Directive 2016/2031, False Codling Moth protocol',
          tariffs: '0% duty in EU; Direct air-cargo freight via RwandAir'
        }
      },
      {
        name: 'Fresh Chili (Bird Eye / Habanero)',
        category: 'HORTICULTURE',
        hs_code: '090422',
        baseProd: 12000,
        baseExpQty: 3400,
        unitVal: 3850, // USD/MT
        baseImpQty: 20,
        impUnitVal: 2000,
        status: 'NET_EXPORTER',
        perf: 'EXPANDING',
        growth: 18.2,
        destinations: ['China', 'Belgium', 'United Kingdom', 'Netherlands', 'Germany'],
        peakMonths: ['All Year Round (peak in Season A & B)'],
        rules: {
          certification: 'GlobalGAP, GACC Registration (China)',
          phytosanitary: 'Bilateral GACC China-Rwanda Dried Chili Protocol',
          tariffs: 'Tariff-free under bilateral trade agreement with China'
        }
      },
      {
        name: 'Fine French Beans',
        category: 'HORTICULTURE',
        hs_code: '070820',
        baseProd: 16000,
        baseExpQty: 5200,
        unitVal: 2900, // USD/MT
        baseImpQty: 10,
        impUnitVal: 1800,
        status: 'NET_EXPORTER',
        perf: 'EXPANDING',
        growth: 11.5,
        destinations: ['United Kingdom', 'France', 'Netherlands', 'Belgium'],
        peakMonths: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
        rules: {
          certification: 'GlobalGAP, Tesco Nurture, BRC',
          phytosanitary: 'Strict EU Maximum Residue Limits (MRL) for pesticides',
          tariffs: '0% tariff under EPA / UK DCTS'
        }
      },
      {
        name: 'Macadamia Nuts',
        category: 'PROCESSED_CROP',
        hs_code: '080262',
        baseProd: 1800,
        baseExpQty: 1100,
        unitVal: 11800, // USD/MT
        baseImpQty: 5,
        impUnitVal: 8000,
        status: 'NET_EXPORTER',
        perf: 'EXPANDING',
        growth: 15.0,
        destinations: ['United States', 'Netherlands', 'China', 'Germany'],
        peakMonths: ['Jun', 'Jul', 'Aug', 'Sep'],
        rules: {
          certification: 'HACCP, ISO 22000, Organic USDA/NOP',
          phytosanitary: 'Aflatoxin testing certificate (<4 ppb)',
          tariffs: 'AGOA duty-free; high export margin'
        }
      },
      {
        name: 'Irish Potato',
        category: 'FOOD_CROP',
        hs_code: '070190',
        baseProd: 880000,
        baseExpQty: 46000,
        unitVal: 380, // USD/MT
        baseImpQty: 1200,
        impUnitVal: 550,
        status: 'NET_EXPORTER',
        perf: 'EXPANDING',
        growth: 7.8,
        destinations: ['Democratic Republic of the Congo', 'Burundi', 'Uganda'],
        peakMonths: ['Jan', 'Feb', 'Jul', 'Aug'],
        rules: {
          certification: 'COMESA Simplified Trade Regime (STR)',
          phytosanitary: 'RAB cross-border phytosanitary pass',
          tariffs: '0% COMESA regional tariff via Rubavu and Rusizi borders'
        }
      },
      {
        name: 'Cassava & Flour',
        category: 'FOOD_CROP',
        hs_code: '110814',
        baseProd: 980000,
        baseExpQty: 14500,
        unitVal: 460, // USD/MT
        baseImpQty: 8500,
        impUnitVal: 410,
        status: 'NET_EXPORTER',
        perf: 'EXPANDING',
        growth: 5.5,
        destinations: ['Democratic Republic of the Congo', 'South Sudan'],
        peakMonths: ['Aug', 'Sep', 'Oct', 'Nov'],
        rules: {
          certification: 'RSB Rwandan Quality Mark, COMESA STR',
          phytosanitary: 'Moisture content < 12%, Cyanide screening',
          tariffs: 'Cross-border duty-free'
        }
      },
      {
        name: 'Paddy & Milled Rice',
        category: 'FOOD_CROP',
        hs_code: '100630',
        baseProd: 125000,
        baseExpQty: 3200,
        unitVal: 880, // USD/MT
        baseImpQty: 95000,
        impUnitVal: 720,
        status: 'NET_IMPORTER', // Import substitution opportunity
        perf: 'IMPORT_SUBSTITUTION',
        growth: -2.1,
        destinations: ['Democratic Republic of the Congo'],
        peakMonths: ['Jan', 'Jul'],
        rules: {
          certification: 'RSB EAS 128:2017 standards',
          phytosanitary: 'Pest-free fumigation certificate',
          tariffs: 'EAC Common External Tariff (CET) 75% protects domestic milling'
        }
      },
      {
        name: 'Wheat & Flour',
        category: 'FOOD_CROP',
        hs_code: '100199',
        baseProd: 15000,
        baseExpQty: 450,
        unitVal: 620, // USD/MT
        baseImpQty: 165000,
        impUnitVal: 480,
        status: 'NET_IMPORTER',
        perf: 'IMPORT_SUBSTITUTION',
        growth: 1.2,
        destinations: ['Democratic Republic of the Congo'],
        peakMonths: ['Feb', 'Aug'],
        rules: {
          certification: 'Food safety testing',
          phytosanitary: 'Kigali Mills raw grain standards',
          tariffs: 'Import duty concession for domestic millers'
        }
      }
    ];

    // Seed across all 38 seasons
    for (const season of seasons) {
      const year = season.year;
      const yearFactor = 1.0 + (year - 2018) * 0.045; // Real growth trend over 2014-2026

      for (const comm of tradeCommodities) {
        const prodId = productsMap[comm.name] || null;
        const domesticProd = Math.round(comm.baseProd * yearFactor * (season.season_code.endsWith('A') ? 0.52 : (season.season_code.endsWith('B') ? 0.43 : 0.05)));
        const expQty = Math.round(comm.baseExpQty * yearFactor * (season.season_code.endsWith('A') ? 0.50 : (season.season_code.endsWith('B') ? 0.45 : 0.05)));
        const expVal = Math.round(expQty * comm.unitVal);
        const impQty = Math.round(comm.baseImpQty * yearFactor * (season.season_code.endsWith('A') ? 0.48 : (season.season_code.endsWith('B') ? 0.48 : 0.04)));
        const impVal = Math.round(impQty * comm.impUnitVal);

        await client.query(`
          INSERT INTO agrilens.trade_season_statistics (
            season_code, year, season_name, product_id, product_name, product_category,
            hs_code, domestic_production_mt, export_quantity_mt, export_value_usd,
            unit_value_usd_per_mt, import_quantity_mt, import_value_usd, net_trade_status,
            growth_trend_pct, performance_status, primary_destinations, peak_months, phytosanitary_rules
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          ON CONFLICT (season_code, product_name) DO UPDATE SET
            domestic_production_mt = EXCLUDED.domestic_production_mt,
            export_quantity_mt = EXCLUDED.export_quantity_mt,
            export_value_usd = EXCLUDED.export_value_usd,
            import_quantity_mt = EXCLUDED.import_quantity_mt,
            import_value_usd = EXCLUDED.import_value_usd,
            primary_destinations = EXCLUDED.primary_destinations;
        `, [
          season.season_code, year, season.season_name, prodId, comm.name, comm.category,
          comm.hs_code, domesticProd, expQty, expVal, comm.unitVal,
          impQty, impVal, comm.status, comm.growth, comm.perf,
          JSON.stringify(comm.destinations), JSON.stringify(comm.peakMonths), JSON.stringify(comm.rules)
        ]);
      }
    }
    console.log('Successfully seeded trade statistics for 10 commodities across all 38 seasons.');

    console.log('--- Step 5: Seeding District Export Supply Statistics (30 Districts x 38 Seasons = 1,140 rows) ---');

    // District Specialization & Exit Hubs mapping
    const districtProfiles = {
      'Nyagatare': { crops: ['Maize', 'Beans', 'Chili', 'Beef'], hub: 'Kagitumba Border / Kigali Airport', dist: 145, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 88.5 },
      'Gatsibo': { crops: ['Hass Avocado', 'Chili', 'Maize', 'Beans'], hub: 'Kigali International Airport', dist: 110, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 91.2 },
      'Kayonza': { crops: ['Hass Avocado', 'French Beans', 'Macadamia', 'Maize'], hub: 'Kigali International Airport', dist: 78, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 92.4 },
      'Bugesera': { crops: ['French Beans', 'Chili', 'Hass Avocado', 'Cassava'], hub: 'Kigali Airport / New Bugesera Airport', dist: 35, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 95.0 },
      'Kirehe': { crops: ['Chili', 'Maize', 'Banana', 'Soybean'], hub: 'Rusumo Border / Kigali Airport', dist: 130, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 87.8 },
      'Ngoma': { crops: ['Pineapple', 'Banana', 'Chili', 'Beans'], hub: 'Kigali International Airport', dist: 95, tier: 'TIER_2_REGIONAL_EXPORTER', score: 79.5 },
      'Rwamagana': { crops: ['French Beans', 'Hass Avocado', 'Rice', 'Maize'], hub: 'Kigali International Airport', dist: 52, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 93.6 },
      'Musanze': { crops: ['Irish Potato', 'Pyrethrum', 'French Beans', 'Horticulture'], hub: 'Cyanika Border / Kigali Airport', dist: 92, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 89.4 },
      'Nyabihu': { crops: ['Irish Potato', 'Tea', 'Pyrethrum', 'Cabbage'], hub: 'Rubavu Border / Kigali Airport', dist: 125, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 88.0 },
      'Rubavu': { crops: ['Irish Potato', 'Vegetables', 'Fruits', 'Coffee'], hub: 'Rubavu / Goma Border Post', dist: 8, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 94.2 },
      'Rutsiro': { crops: ['Specialty Coffee', 'Tea', 'Beans'], hub: 'Rubavu Border / Kigali Airport', dist: 140, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 86.5 },
      'Karongi': { crops: ['Specialty Coffee', 'Tea', 'Avocado'], hub: 'Lake Kivu Ports / Kigali Airport', dist: 135, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 85.8 },
      'Nyamasheke': { crops: ['Specialty Coffee', 'Tea', 'Cassava'], hub: 'Rusizi Border / Lake Kivu Ports', dist: 180, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 87.0 },
      'Rusizi': { crops: ['Rice', 'Specialty Coffee', 'Tea', 'Cassava Flour'], hub: 'Rusizi / Bukavu Border Post', dist: 12, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 93.1 },
      'Ngororero': { crops: ['Tea', 'Coffee', 'Irish Potato'], hub: 'Kigali International Airport', dist: 115, tier: 'TIER_2_REGIONAL_EXPORTER', score: 78.4 },
      'Gicumbi': { crops: ['Tea', 'Beans', 'Irish Potato', 'Dairy'], hub: 'Gatuna Border / Kigali Airport', dist: 58, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 86.9 },
      'Rulindo': { crops: ['French Beans', 'Passion Fruit', 'Tea', 'Coffee'], hub: 'Kigali International Airport', dist: 42, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 92.8 },
      'Burera': { crops: ['Irish Potato', 'Wheat', 'Beans', 'Pyrethrum'], hub: 'Cyanika Border', dist: 110, tier: 'TIER_2_REGIONAL_EXPORTER', score: 80.2 },
      'Gakenke': { crops: ['Specialty Coffee', 'Passion Fruit', 'Beans'], hub: 'Kigali International Airport', dist: 75, tier: 'TIER_2_REGIONAL_EXPORTER', score: 82.5 },
      'Huye': { crops: ['Specialty Coffee', 'Soybean', 'Chili', 'Cassava'], hub: 'Akanyaru Border / Kigali Airport', dist: 132, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 86.4 },
      'Nyanza': { crops: ['Cassava Flour', 'Maize', 'Beans'], hub: 'Kigali International Airport', dist: 90, tier: 'TIER_2_REGIONAL_EXPORTER', score: 76.5 },
      'Gisagara': { crops: ['Paddy Rice', 'Banana', 'Coffee'], hub: 'Akanyaru Border / Kigali Airport', dist: 155, tier: 'TIER_2_REGIONAL_EXPORTER', score: 78.2 },
      'Nyamagabe': { crops: ['Tea', 'Coffee', 'Wheat', 'Irish Potato'], hub: 'Rusizi Border / Kigali Airport', dist: 160, tier: 'TIER_2_REGIONAL_EXPORTER', score: 81.0 },
      'Nyaruguru': { crops: ['Tea', 'Wheat', 'Irish Potato', 'Coffee'], hub: 'Akanyaru Border / Kigali Airport', dist: 165, tier: 'TIER_2_REGIONAL_EXPORTER', score: 82.1 },
      'Ruhango': { crops: ['Cassava Flour', 'Coffee', 'Beans'], hub: 'Kigali International Airport', dist: 72, tier: 'TIER_2_REGIONAL_EXPORTER', score: 79.0 },
      'Kamonyi': { crops: ['French Beans', 'Avocado', 'Cassava'], hub: 'Kigali International Airport', dist: 38, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 88.7 },
      'Muhanga': { crops: ['Coffee', 'Beans', 'Horticulture'], hub: 'Kigali International Airport', dist: 50, tier: 'TIER_2_REGIONAL_EXPORTER', score: 81.3 },
      'Gasabo': { crops: ['Export Horticulture Packhouse', 'Vegetables'], hub: 'Kigali International Airport', dist: 14, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 96.5 },
      'Kicukiro': { crops: ['Consolidation Hub', 'Floriculture', 'Chillies'], hub: 'Kigali International Airport', dist: 6, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 97.2 },
      'Nyarugenge': { crops: ['Urban Logistics Hub', 'Fresh Produce Wholesale'], hub: 'Kigali International Airport', dist: 12, tier: 'TIER_1_GLOBAL_EXPORT_HUB', score: 94.0 },
    };

    let districtRowsCount = 0;
    for (const season of seasons) {
      const year = season.year;
      const yearScale = 1.0 + (year - 2018) * 0.04;

      for (const dist of districts) {
        const dName = dist.name;
        const profile = districtProfiles[dName] || {
          crops: ['Beans', 'Maize', 'Vegetables'],
          hub: 'Kigali International Airport',
          dist: 85,
          tier: 'TIER_2_REGIONAL_EXPORTER',
          score: 75.0
        };

        // Determine province
        let prov = 'Southern';
        if (['Nyagatare', 'Gatsibo', 'Kayonza', 'Bugesera', 'Kirehe', 'Ngoma', 'Rwamagana'].includes(dName)) prov = 'Eastern';
        else if (['Musanze', 'Burera', 'Gicumbi', 'Rulindo', 'Gakenke'].includes(dName)) prov = 'Northern';
        else if (['Rubavu', 'Nyabihu', 'Rutsiro', 'Karongi', 'Nyamasheke', 'Rusizi', 'Ngororero'].includes(dName)) prov = 'Western';
        else if (['Gasabo', 'Kicukiro', 'Nyarugenge'].includes(dName)) prov = 'Kigali City';

        const totalProd = Math.round((70000 + (dName.length * 4500)) * yearScale);
        const marketSurplus = Math.round(totalProd * 0.44);
        const exportableSurplus = Math.round(marketSurplus * 0.28); // ~28% of market surplus meets export specs
        const coops = Math.min(18, Math.max(3, Math.round(exportableSurplus / 1200)));
        const certPct = Math.min(92, Math.max(35, Math.round(profile.score * 0.85)));

        await client.query(`
          INSERT INTO agrilens.district_export_supply_statistics (
            admin_unit_id, district_name, province_name, season_code, year, season_name,
            primary_export_crops, total_crop_production_mt, market_surplus_volume_mt,
            estimated_exportable_volume_mt, export_readiness_score, export_tier,
            nearest_exit_hub, distance_to_exit_km, cooperatives_export_ready_count, quality_certification_pct
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (district_name, season_code) DO UPDATE SET
            primary_export_crops = EXCLUDED.primary_export_crops,
            total_crop_production_mt = EXCLUDED.total_crop_production_mt,
            market_surplus_volume_mt = EXCLUDED.market_surplus_volume_mt,
            estimated_exportable_volume_mt = EXCLUDED.estimated_exportable_volume_mt,
            export_readiness_score = EXCLUDED.export_readiness_score,
            export_tier = EXCLUDED.export_tier;
        `, [
          dist.id, dName, prov, season.season_code, year, season.season_name,
          JSON.stringify(profile.crops), totalProd, marketSurplus,
          exportableSurplus, profile.score, profile.tier,
          profile.hub, profile.dist, coops, certPct
        ]);
        districtRowsCount++;
      }
    }
    console.log(`Successfully populated ${districtRowsCount} district export supply records across all 30 districts and 38 seasons.`);

    console.log('--- Step 6: Seeding Strategic Product-Market Export Opportunity Assessments ---');
    // Clear and refresh assessments with 12 high-impact product-market pairs
    await client.query('DELETE FROM agrilens.export_opportunity_assessments;');

    const pairs = [
      {
        prod: 'Hass Avocado',
        dest: 'Netherlands',
        score: 0.94,
        level: 'VERY_HIGH',
        prodAvail: 0.92,
        demand: 0.96,
        logistics: 0.90,
        standards: 0.88,
        risk: 0.12,
        expl: 'Exceptional counter-seasonal European supply window (October to March) with expanding orchard acreage across Bugesera, Kayonza, and Gatsibo. Direct cold-chain air freight to Amsterdam/Rotterdam port access.',
        limit: 'Demands strict GlobalGAP certification and adherence to EU False Codling Moth (FCM) phytosanitary cold-treatment protocols.'
      },
      {
        prod: 'Coffee',
        dest: 'United States',
        score: 0.95,
        level: 'VERY_HIGH',
        prodAvail: 0.94,
        demand: 0.98,
        logistics: 0.88,
        standards: 0.95,
        risk: 0.15,
        expl: 'Rwandan specialty Arabica Bourbon coffee commands high price premiums ($6,500-$9,000/MT) among third-wave US micro-roasters. Strong direct trade relationships and AGOA duty-free access.',
        limit: 'Volatile international C-market benchmark prices; smallholder climate resilience and rejuvenation required in Western highlands.'
      },
      {
        prod: 'Fresh Chili (Bird Eye / Habanero)',
        dest: 'China',
        score: 0.91,
        level: 'VERY_HIGH',
        prodAvail: 0.89,
        demand: 0.96,
        logistics: 0.86,
        standards: 0.88,
        risk: 0.16,
        expl: 'Landmark bilateral protocol between Rwanda and China General Administration of Customs (GACC) allows direct tariff-free dried and fresh chili shipments. Long-term off-take agreements actively scaling.',
        limit: 'Strict zero-tolerance on fruit-fly quarantine pests and aflatoxin contamination standards.'
      },
      {
        prod: 'Fine French Beans',
        dest: 'United Kingdom',
        score: 0.89,
        level: 'HIGH',
        prodAvail: 0.86,
        demand: 0.93,
        logistics: 0.89,
        standards: 0.86,
        risk: 0.18,
        expl: 'High winter demand from UK supermarket chains (Tesco, Sainsbury, M&S). Kigali belly-hold passenger flights offer rapid 18-hour turnaround from harvest in Rwamagana/Bugesera to UK distribution centers.',
        limit: 'Strict European pesticide Maximum Residue Limits (MRL); cold chain interruption causes immediate rejection.'
      },
      {
        prod: 'Tea',
        dest: 'Pakistan',
        score: 0.92,
        level: 'VERY_HIGH',
        prodAvail: 0.95,
        demand: 0.95,
        logistics: 0.89,
        standards: 0.92,
        risk: 0.14,
        expl: 'Pakistan is the world largest black CTC tea importer, taking over 42% of Rwandan tea exports. Renowned high-grown quality from Gisovu, Kitabi, and Pfunda estates commands top auction prices in Mombasa.',
        limit: 'Foreign exchange liquidity fluctuations in destination market; shipping congestion along the Northern Corridor.'
      },
      {
        prod: 'Macadamia Nuts',
        dest: 'Germany',
        score: 0.88,
        level: 'HIGH',
        prodAvail: 0.74,
        demand: 0.95,
        logistics: 0.90,
        standards: 0.92,
        risk: 0.15,
        expl: 'Very high export unit value (exceeding $11,500/MT for shelled kernels). Favorable Rwandan highland agro-climatic conditions produce premium crunch and oil content with low pest incidence.',
        limit: 'Long tree maturation period (4-5 years) limits short-term supply volume scalability.'
      },
      {
        prod: 'Irish Potato',
        dest: 'Democratic Republic of the Congo',
        score: 0.93,
        level: 'VERY_HIGH',
        prodAvail: 0.96,
        demand: 0.97,
        logistics: 0.94,
        standards: 0.82,
        risk: 0.15,
        expl: 'Immense urban food demand in Goma and Eastern DRC (>2 million consumers) dependent on potato production from Musanze and Nyabihu. Cross-border trade is fast, cash-settled, and duty-free under COMESA STR.',
        limit: 'Border administrative delays and informal road levies; perishable nature requires improved packing crates.'
      },
      {
        prod: 'Cassava & Flour',
        dest: 'Democratic Republic of the Congo',
        score: 0.89,
        level: 'HIGH',
        prodAvail: 0.92,
        demand: 0.94,
        logistics: 0.88,
        standards: 0.80,
        risk: 0.18,
        expl: 'High-density border trade via Rusizi to Bukavu and Rubavu to Goma. High demand for Kinazi-standardized fortified cassava flour and clean fermented chips.',
        limit: 'Informal competition and seasonal price suppression during peak dry season harvests.'
      },
      {
        prod: 'Paddy & Milled Rice',
        dest: 'Democratic Republic of the Congo',
        score: 0.76,
        level: 'MODERATE_OPPORTUNITY',
        prodAvail: 0.65,
        demand: 0.92,
        logistics: 0.85,
        standards: 0.82,
        risk: 0.28,
        expl: 'Rwanda is a net importer of rice domestically, but premium aromatic varieties from Bugarama and Rwamagana find strong niche export buyers in Bukavu and Goma.',
        limit: 'Domestic supply deficit makes broad-scale export unviable until national irrigated marshlands expand.'
      },
      {
        prod: 'Hass Avocado',
        dest: 'United Arab Emirates',
        score: 0.92,
        level: 'VERY_HIGH',
        prodAvail: 0.90,
        demand: 0.96,
        logistics: 0.92,
        standards: 0.89,
        risk: 0.13,
        expl: 'Rapidly growing Gulf hub demand. RwandAir direct daily cargo and passenger services to Dubai provide seamless 5.5-hour transit with competitive air-cargo rates.',
        limit: 'Price competition from South African and Kenyan sea-container shipments during their peak harvests.'
      },
      {
        prod: 'Coffee',
        dest: 'Germany',
        score: 0.90,
        level: 'VERY_HIGH',
        prodAvail: 0.92,
        demand: 0.94,
        logistics: 0.86,
        standards: 0.94,
        risk: 0.14,
        expl: 'Germany is Europe premier green coffee trading hub (Hamburg). High preference for Rwandan fully washed Arabica in specialty blends with stringent EU Deforestation Regulation (EUDR) readiness.',
        limit: 'Mandatory EUDR geo-location plot traceability compliance begins 2025/2026.'
      },
      {
        prod: 'Fresh Chili (Bird Eye / Habanero)',
        dest: 'United Kingdom',
        score: 0.87,
        level: 'HIGH',
        prodAvail: 0.84,
        demand: 0.92,
        logistics: 0.88,
        standards: 0.85,
        risk: 0.19,
        expl: 'Strong demand from ethnic wholesale and specialty retail markets for African Bird Eye and Scotch Bonnet chili varieties.',
        limit: 'Strict packaging and moisture control to avoid mold during transatlantic transit.'
      }
    ];

    // Fetch destination IDs
    const destsRes = await client.query('SELECT id, country_name FROM agrilens.export_destinations;');
    const destMap = {};
    destsRes.rows.forEach(d => {
      destMap[d.country_name] = d.id;
      if (d.country_name.includes('Netherlands') || d.country_name.includes('European Union')) destMap['Netherlands'] = d.id;
      if (d.country_name.includes('United States')) destMap['United States'] = d.id;
      if (d.country_name.includes('China')) destMap['China'] = d.id;
      if (d.country_name.includes('Congo')) destMap['Democratic Republic of the Congo'] = d.id;
    });

    const activeSeason = seasons.find(s => s.season_code === '2026B') || seasons[seasons.length - 1];
    const seasonIdRes = await client.query('SELECT id FROM agrilens.seasons WHERE season_code = $1;', [activeSeason.season_code]);
    const seasonUuid = seasonIdRes.rows[0]?.id || null;

    for (const p of pairs) {
      const prodId = productsMap[p.prod];
      const destId = destMap[p.dest];
      if (!prodId || !destId) continue;

      await client.query(`
        INSERT INTO agrilens.export_opportunity_assessments (
          product_id, destination_id, season_id, assessment_date,
          opportunity_score, opportunity_level, production_availability_score,
          market_demand_score, logistics_score, standards_readiness_score, risk_score,
          explanation, limitations
        ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, $10, $11, $12);
      `, [
        prodId, destId, seasonUuid,
        p.score, p.level, p.prodAvail,
        p.demand, p.logistics, p.standards, p.risk,
        p.expl, p.limit
      ]);
    }
    console.log(`Successfully seeded ${pairs.length} strategic export opportunity assessments.`);

    // Quick verification query
    const statsCount = await client.query('SELECT COUNT(*) FROM agrilens.trade_season_statistics;');
    const distCount = await client.query('SELECT COUNT(*) FROM agrilens.district_export_supply_statistics;');
    console.log('\n--- Seeding Summary ---');
    console.log(`Trade Season Statistics Rows: ${statsCount.rows[0].count}`);
    console.log(`District Export Supply Rows: ${distCount.rows[0].count}`);

    const totals2026B = await client.query(`
      SELECT 
        ROUND(SUM(export_value_usd)::numeric, 0) AS total_export_value,
        ROUND(SUM(export_quantity_mt)::numeric, 0) AS total_export_volume,
        ROUND(SUM(import_value_usd)::numeric, 0) AS total_import_value
      FROM agrilens.trade_season_statistics
      WHERE season_code = '2026B';
    `);
    console.log('2026B National Trade Totals:');
    console.table(totals2026B.rows[0]);

  } catch (err) {
    console.error('Error seeding trade intelligence:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedTradeIntelligence();
