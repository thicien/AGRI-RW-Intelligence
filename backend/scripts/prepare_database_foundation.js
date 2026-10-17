const { Client } = require('pg');

async function setup() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'Mug2thi4',
    database: 'agrilens_db',
  });

  await client.connect();
  console.log('Connected to agrilens_db on port 5433.');

  // 1. Add columns to crop_statistics if not exist
  await client.query(`
    ALTER TABLE agrilens.crop_statistics 
    ADD COLUMN IF NOT EXISTS data_quality_status VARCHAR(50) DEFAULT 'VERIFIED',
    ADD COLUMN IF NOT EXISTS validation_notes TEXT,
    ADD COLUMN IF NOT EXISTS source_file VARCHAR(255);
  `);
  console.log('✓ Added data quality columns to agrilens.crop_statistics.');

  // 2. Ensure unique constraint on (admin_unit_id, crop_id, season_id)
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_crop_stats_admin_crop_season 
    ON agrilens.crop_statistics(admin_unit_id, crop_id, season_id);
  `);
  console.log('✓ Ensured unique index on crop_statistics.');

  // 3. Register Data Source
  const dsRes = await client.query(`
    INSERT INTO agrilens.data_sources (name, provider, source_type, url, description)
    VALUES (
      'National Institute of Statistics of Rwanda (NISR)',
      'Government of Rwanda',
      'OFFICIAL_STATISTICS',
      'https://www.statistics.gov.rw',
      'Official Seasonal Agricultural Surveys (SAS) and agricultural censuses of Rwanda.'
    )
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
    RETURNING id;
  `).catch(async () => {
    return client.query(`SELECT id FROM agrilens.data_sources WHERE name LIKE '%NISR%' OR name LIKE '%National Institute%' LIMIT 1`);
  });
  const sourceId = dsRes.rows[0]?.id;

  // 4. Ensure all Seasons exist from 2018 to 2026
  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const seasonLetters = ['A', 'B', 'C'];
  for (const yr of years) {
    for (const lettr of seasonLetters) {
      if (yr === 2026 && lettr === 'C') continue; // 2026C not yet surveyed
      const code = `${yr}${lettr}`;
      const name = `Season ${lettr}`;
      const label = `${yr} Season ${lettr}`;
      await client.query(`
        INSERT INTO agrilens.seasons (name, year, season_code, official_label)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (season_code) DO UPDATE SET official_label = EXCLUDED.official_label;
      `, [name, yr, code, label]);
    }
  }
  console.log('✓ Registered all seasons from 2018A through 2026B.');

  // 5. Ensure all Crops exist
  const cropsMaster = [
    // Cereals
    { name: 'Maize', code: 'MAIZE', category: 'Cereal' },
    { name: 'Sorghum', code: 'SORGHUM', category: 'Cereal' },
    { name: 'Rice', code: 'RICE', category: 'Cereal' },
    { name: 'Wheat', code: 'WHEAT', category: 'Cereal' },
    { name: 'Other Cereals', code: 'OTHER_CEREALS', category: 'Cereal' },

    // Roots & Tubers
    { name: 'Cassava', code: 'CASSAVA', category: 'Root crop' },
    { name: 'Sweet Potato', code: 'SWEET_POTATO', category: 'Root crop' },
    { name: 'Irish Potato', code: 'IRISH_POTATO', category: 'Root crop' },
    { name: 'Yams & Taro', code: 'YAMS_TARO', category: 'Root crop' },

    // Bananas
    { name: 'Cooking Banana', code: 'COOKING_BANANA', category: 'Banana' },
    { name: 'Dessert Banana', code: 'DESSERT_BANANA', category: 'Banana' },
    { name: 'Banana for Beer', code: 'BEER_BANANA', category: 'Banana' },
    { name: 'Banana', code: 'BANANA_AGG', category: 'Banana' },

    // Legumes & Pulses
    { name: 'Beans', code: 'BEANS', category: 'Legume' },
    { name: 'Bush Bean', code: 'BUSH_BEAN', category: 'Legume' },
    { name: 'Climbing Bean', code: 'CLIMBING_BEAN', category: 'Legume' },
    { name: 'Peas', code: 'PEAS', category: 'Legume' },
    { name: 'Groundnuts', code: 'GROUNDNUTS', category: 'Legume' },
    { name: 'Soybean', code: 'SOYBEAN', category: 'Legume' },

    // Specialty & Horticulture
    { name: 'Chia Seed', code: 'CHIA_SEED', category: 'Specialty' },
    { name: 'Vegetables', code: 'VEGETABLES', category: 'Horticulture' },
    { name: 'Fruits', code: 'FRUITS', category: 'Horticulture' },

    // Fodder & Cash Crops
    { name: 'Fodder Crops', code: 'FODDER_CROPS', category: 'Fodder' },
    { name: 'Coffee', code: 'COFFEE', category: 'Cash crop' },
    { name: 'Tea', code: 'TEA', category: 'Cash crop' },
    { name: 'Other Crops', code: 'OTHER_CROPS', category: 'Other' },
  ];

  for (const c of cropsMaster) {
    await client.query(`
      INSERT INTO agrilens.crops (name, category, code)
      VALUES ($1, $2, $3)
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category;
    `, [c.name, c.category, c.code]);
  }
  console.log(`✓ Registered ${cropsMaster.length} official crops in agrilens.crops.`);

  await client.end();
  console.log('Foundation schema update complete.');
}

setup().catch(console.error);
