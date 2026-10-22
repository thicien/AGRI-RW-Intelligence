const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'Mug2thi4',
  database: process.env.DB_NAME || 'agrilens_db',
});

// Complete Official 416 Sectors across all 30 Districts of Rwanda
const DISTRICT_SECTORS = {
  // Northern Province
  'Musanze': ['Busogo', 'Cyuve', 'Gacaca', 'Gashaki', 'Gataraga', 'Kimonyi', 'Kinigi', 'Muhoza', 'Muko', 'Musanze', 'Nkotsi', 'Nyange', 'Remera', 'Rwaza', 'Shingiro'],
  'Burera': ['Bungwe', 'Butaro', 'Cyanika', 'Cyeru', 'Gahunga', 'Gatebe', 'Gitovu', 'Kagogo', 'Kinoni', 'Kinyababa', 'Kivuye', 'Nemba', 'Rugarama', 'Rugendabari', 'Ruhunde', 'Rusarabuye', 'Rwerere'],
  'Gicumbi': ['Bukure', 'Bwisige', 'Byumba', 'Cyumba', 'Giti', 'Kaniga', 'Manyagiro', 'Miyove', 'Kageyo', 'Mukarange', 'Muko', 'Mutete', 'Nyamiyaga', 'Nyankenke', 'Rubaya', 'Rukomo', 'Rushaki', 'Rutare', 'Ruvune', 'Rwamiko', 'Shangasha'],
  'Gakenke': ['Busengo', 'Coko', 'Cyabingo', 'Gakenke', 'Gashenyi', 'Mugunga', 'Janja', 'Kamubuga', 'Karambo', 'Kivuruga', 'Mataba', 'Minazi', 'Muhondo', 'Muyongwe', 'Muzo', 'Nemba', 'Ruli', 'Rusasa', 'Rushashi'],
  'Rulindo': ['Base', 'Burega', 'Bushoki', 'Buyoga', 'Cyinzuzi', 'Cyungo', 'Kinihira', 'Kisaro', 'Masoro', 'Mbogo', 'Murambi', 'Ngoma', 'Ntarabana', 'Rukozo', 'Rusiga', 'Shyorongi', 'Tumba'],

  // Eastern Province
  'Nyagatare': ['Gatunda', 'Karama', 'Karangazi', 'Katabagemu', 'Kiyombe', 'Matimba', 'Mimuri', 'Mukama', 'Musheri', 'Nyagatare', 'Rukomo', 'Rwempasha', 'Rwimiyaga', 'Tabagwe'],
  'Bugesera': ['Gashora', 'Juru', 'Kamabuye', 'Ntarama', 'Mareba', 'Mayange', 'Musenyi', 'Mwogo', 'Ngeruka', 'Nyamata', 'Nyarugenge', 'Rilima', 'Ruhuha', 'Rweru', 'Shyara'],
  'Gatsibo': ['Gasange', 'Gatsibo', 'Gitoki', 'Kabarore', 'Kageyo', 'Kiramuruzi', 'Kiziguro', 'Muhura', 'Murambi', 'Ngarama', 'Nyagihanga', 'Remera', 'Rugarama', 'Rwimbogo'],
  'Kayonza': ['Gahini', 'Kabare', 'Kabarondo', 'Mukarange', 'Murama', 'Murundi', 'Mwiri', 'Ndego', 'Nyamirama', 'Rukara', 'Ruramira', 'Rwinkwavu'],
  'Kirehe': ['Gahara', 'Gatore', 'Kigarama', 'Kigina', 'Kirehe', 'Mahama', 'Mpanga', 'Musaza', 'Mushikiri', 'Nasho', 'Nyamugari', 'Nyarubuye'],
  'Ngoma': ['Gashanda', 'Jarama', 'Karembo', 'Kazo', 'Kibungo', 'Mugesera', 'Murama', 'Mutenderi', 'Remera', 'Rukira', 'Rukumberi', 'Rurenge', 'Sake', 'Zaza'],
  'Rwamagana': ['Fumbwe', 'Gahengeri', 'Gishari', 'Karenge', 'Kigabiro', 'Muhazi', 'Munyaga', 'Munyiginya', 'Musha', 'Muyumbu', 'Mwulire', 'Nyakariro', 'Nzige', 'Rubona'],

  // Southern Province
  'Huye': ['Gishamvu', 'Karama', 'Kigoma', 'Kinazi', 'Maraba', 'Mbazi', 'Mukura', 'Ngoma', 'Ruhashya', 'Rusatira', 'Rwaniro', 'Simbi', 'Tumba', 'Huye'],
  'Gisagara': ['Gikonko', 'Gishubi', 'Kansi', 'Kibilizi', 'Kigembe', 'Mamba', 'Muganza', 'Mugombwa', 'Mukindo', 'Musha', 'Ndora', 'Nyanza', 'Save'],
  'Nyanza': ['Busasamana', 'Busoro', 'Cyabakamyi', 'Kibirizi', 'Kigoma', 'Mukingo', 'Muyira', 'Ntyazo', 'Nyagisozi', 'Rwabicuma'],
  'Ruhango': ['Bweramana', 'Byimana', 'Kabagali', 'Kinazi', 'Kinihira', 'Mbuye', 'Mwendo', 'Ntongwe', 'Ruhango'],
  'Muhanga': ['Cyeza', 'Kabacuzi', 'Kibangu', 'Kiyumba', 'Muhanga', 'Mushishiro', 'Nyabinoni', 'Nyamabuye', 'Nyarusange', 'Rongi', 'Rugendabari', 'Shyogwe'],
  'Kamonyi': ['Gacurabwenge', 'Karama', 'Kayenzi', 'Kayumbu', 'Mugina', 'Musambira', 'Ngamba', 'Nyamiyaga', 'Nyarubaka', 'Rugarika', 'Rukoma', 'Runda'],
  'Nyamagabe': ['Buruhukiro', 'Cyanika', 'Gatare', 'Kaduha', 'Kamegeli', 'Kibirizi', 'Kibumbwe', 'Kitabi', 'Musebeya', 'Mushubi', 'Nkomane', 'Gasaka', 'Mugano', 'Musange', 'Tare', 'Uwinkingi'],
  'Nyaruguru': ['Cyahinda', 'Busanze', 'Kibeho', 'Kivu', 'Mata', 'Muganza', 'Munini', 'Ngera', 'Ngoma', 'Nyabimata', 'Nyagisozi', 'Ruheru', 'Ruramba', 'Rusenge'],

  // Western Province
  'Rubavu': ['Bugeshi', 'Busasamana', 'Cyanzarwe', 'Gisenyi', 'Kanama', 'Kanzenze', 'Mudende', 'Nyakiriba', 'Nyamyumba', 'Nyundo', 'Rubavu', 'Rugerero'],
  'Nyabihu': ['Bigogwe', 'Jenda', 'Jomba', 'Kabatwa', 'Karago', 'Kintobo', 'Mukamira', 'Muringa', 'Rambura', 'Rugera', 'Rurembo', 'Shyira'],
  'Rutsiro': ['Boneza', 'Gihango', 'Kigeyo', 'Kivumu', 'Manihira', 'Mukura', 'Murunda', 'Musasa', 'Mushonyi', 'Mushubati', 'Nyabirasi', 'Ruhango', 'Rusebeya'],
  'Karongi': ['Bwishyura', 'Gishyita', 'Gashari', 'Gitesi', 'Mubuga', 'Murambi', 'Murundi', 'Mutuntu', 'Rubengera', 'Rugabano', 'Ruganda', 'Rwankuba', 'Twumba'],
  'Ngororero': ['Bwira', 'Gatumba', 'Hindiro', 'Kabaya', 'Kageyo', 'Kavumu', 'Matyazo', 'Muhanda', 'Muhororo', 'Ndaro', 'Ngororero', 'Nyange', 'Sovu'],
  'Rusizi': ['Bugarama', 'Butare', 'Bweyeye', 'Gikundamvura', 'Gashonga', 'Giheke', 'Gihundwe', 'Gitambi', 'Kamembe', 'Muganza', 'Mururu', 'Nkanka', 'Nkombo', 'Nkungu', 'Nyakabuye', 'Nyakarenzo', 'Nzahaha', 'Rwimbogo'],
  'Nyamasheke': ['Ruharambuga', 'Bushekeri', 'Bushenge', 'Cyato', 'Gihombo', 'Kagano', 'Kanjongo', 'Karambi', 'Karengera', 'Kirimbi', 'Macuba', 'Nyabitekeri', 'Mahembe', 'Rangiro', 'Shangi'],

  // Kigali City
  'Gasabo': ['Bumbogo', 'Gatsata', 'Jali', 'Gikomero', 'Gisozi', 'Jabana', 'Kinyinya', 'Ndera', 'Nduba', 'Rusororo', 'Rutunga', 'Kacyiru', 'Kimihurura', 'Kimironko', 'Remera'],
  'Kicukiro': ['Gahanga', 'Gatenga', 'Gikondo', 'Kagarama', 'Kanombe', 'Kicukiro', 'Kigarama', 'Masaka', 'Niboye', 'Nyarugunga'],
  'Nyarugenge': ['Gitega', 'Kanyinya', 'Kigali', 'Kimisagara', 'Mageragere', 'Muhima', 'Nyakabanda', 'Nyamirambo', 'Nyarugenge', 'Rwezamenyo']
};

async function seed() {
  await client.connect();
  console.log('Connected to agrilens_db.');

  // 1. Ensure table columns in interventions for district and sector
  await client.query(`
    ALTER TABLE agrilens.interventions ALTER COLUMN priority_zone_id DROP NOT NULL;
    ALTER TABLE agrilens.interventions 
    ADD COLUMN IF NOT EXISTS district_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS sector_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS admin_unit_id UUID,
    ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'HIGH',
    ADD COLUMN IF NOT EXISTS challenge_area VARCHAR(50) DEFAULT 'PRODUCTIVITY',
    ADD COLUMN IF NOT EXISTS target_metric VARCHAR(100),
    ADD COLUMN IF NOT EXISTS budget_rwf NUMERIC,
    ADD COLUMN IF NOT EXISTS target_beneficiaries INTEGER;
  `);

  // 2. Fetch existing districts
  const distRes = await client.query(`
    SELECT id, name FROM agrilens.administrative_units WHERE unit_type = 'DISTRICT';
  `);
  const distMap = {};
  for (const row of distRes.rows) {
    distMap[row.name.toLowerCase()] = row.id;
  }

  let totalSectorsInserted = 0;
  for (const [distName, sectors] of Object.entries(DISTRICT_SECTORS)) {
    const distId = distMap[distName.toLowerCase()];
    if (!distId) continue;

    for (const secName of sectors) {
      const existing = await client.query(`
        SELECT id FROM agrilens.administrative_units 
        WHERE name = $1 AND parent_id = $2 AND unit_type = 'SECTOR' LIMIT 1;
      `, [secName, distId]);

      if (existing.rows.length === 0) {
        const secCode = `RW-SEC-${distName.substring(0,3).toUpperCase()}-${secName.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
        await client.query(`
          INSERT INTO agrilens.administrative_units (name, unit_type, parent_id, code)
          VALUES ($1, 'SECTOR', $2, $3)
          ON CONFLICT (code) DO NOTHING;
        `, [secName, distId, secCode]);
        totalSectorsInserted++;
      }
    }
  }
  console.log(`Inserted ${totalSectorsInserted} sectors into agrilens.administrative_units.`);

  // 3. Seed Priority Interventions for sample key districts (Musanze, Nyagatare, Bugesera, Gicumbi, Huye, Rubavu, etc.)
  const adminUser = await client.query(`SELECT id FROM agrilens.users WHERE email = 'admin@agrilens.gov.rw' LIMIT 1`);
  const adminId = adminUser.rows[0]?.id;

  const sampleInterventions = [
    // Musanze
    {
      district: 'Musanze',
      sector: 'Kinigi',
      type: 'IRRIGATION',
      area: 'IRRIGATION',
      priority: 'HIGH',
      title: 'Kinigi Volcanic Footprint Small-Scale Drip Irrigation Expansion',
      desc: 'Deploy solar-powered micro-drip irrigation kits for 450 ha of high-value seed potato and pyrethrum cultivation on volcanic loam soils.',
      metric: '+35% Irish Potato yield during dry dry spells',
      budget: 85000000,
      beneficiaries: 1200,
      status: 'PLANNED'
    },
    {
      district: 'Musanze',
      sector: 'Busogo',
      type: 'SOIL_FERTILITY',
      area: 'SOIL_FERTILITY',
      priority: 'CRITICAL',
      title: 'Busogo Agricultural Acidic Soil Liming & Phosphatic Correction',
      desc: 'Subsidize agricultural lime (travertine) and bio-fertilizer application to remediate severe soil acidity (pH 5.1 -> 6.2) across 620 ha.',
      metric: 'Neutralize acidity & increase nutrient uptake by 40%',
      budget: 52000000,
      beneficiaries: 2400,
      status: 'IN_PROGRESS'
    },
    {
      district: 'Musanze',
      sector: 'Muhoza',
      type: 'POST_HARVEST',
      area: 'POST_HARVEST',
      priority: 'HIGH',
      title: 'Muhoza Modern Irish Potato Cold Storage & Aggregation Hub',
      desc: 'Construct a 1,200 MT temperature-controlled diffused light storage facility to reduce post-harvest rot and price crash during peak harvest.',
      metric: 'Reduce potato post-harvest loss from 18.4% to under 6%',
      budget: 140000000,
      beneficiaries: 3800,
      status: 'PROPOSED'
    },
    {
      district: 'Musanze',
      sector: 'Cyuve',
      type: 'EXPORT',
      area: 'EXPORT',
      priority: 'MEDIUM',
      title: 'Cyuve Climbing Bean & French Bean GlobalGAP Certification',
      desc: 'Train 3 farmer cooperatives in phytosanitary traceability, residue testing, and export packhouse grading for EU fresh export.',
      metric: '+220 tonnes export-grade French beans annually',
      budget: 35000000,
      beneficiaries: 650,
      status: 'PLANNED'
    },
    {
      district: 'Musanze',
      sector: 'Nyange',
      type: 'PRODUCTIVITY',
      area: 'PRODUCTIVITY',
      priority: 'HIGH',
      title: 'Nyange Hybrid Maize & High-Yield Seed Demonstration Plots',
      desc: 'Establish 8 participatory Farmer Field Schools (FFS) demonstrating certified drought-tolerant maize varieties with balanced NPK application.',
      metric: 'Elevate average maize yield from 2.8 t/ha to 4.2 t/ha',
      budget: 28000000,
      beneficiaries: 1800,
      status: 'IN_PROGRESS'
    },

    // Nyagatare
    {
      district: 'Nyagatare',
      sector: 'Rukomo',
      type: 'IRRIGATION',
      area: 'IRRIGATION',
      priority: 'CRITICAL',
      title: 'Rukomo Perimeter Marshland Solar Pumping Scheme',
      desc: 'Install floating solar intake pump on Muvumba River tributary to irrigate 320 ha of consolidated rice and soybean fields.',
      metric: 'Double cropping cycle in Season C drought window',
      budget: 110000000,
      beneficiaries: 1600,
      status: 'IN_PROGRESS'
    },
    {
      district: 'Nyagatare',
      sector: 'Matimba',
      type: 'POST_HARVEST',
      area: 'POST_HARVEST',
      priority: 'HIGH',
      title: 'Matimba Consolidated Grain Drying Grounds & Moisture Meters',
      desc: 'Pave 4,000 sqm multi-purpose solar grain drying floors and distribute 45 digital moisture meters to rice cooperatives.',
      metric: 'Eliminate aflatoxin contamination and lower post-harvest moisture to 13.5%',
      budget: 45000000,
      beneficiaries: 2900,
      status: 'PLANNED'
    },
    {
      district: 'Nyagatare',
      sector: 'Karangazi',
      type: 'PRODUCTIVITY',
      area: 'PRODUCTIVITY',
      priority: 'MEDIUM',
      title: 'Karangazi Pastoral Forage & Cattle Feed Value Chain',
      desc: 'Intercrop Brachiaria and Chloris gayana pastures for intensive dairy livestock feed preservation during dry Season B.',
      metric: '+25% milk output per cow during dry spells',
      budget: 38000000,
      beneficiaries: 850,
      status: 'PROPOSED'
    },

    // Bugesera
    {
      district: 'Bugesera',
      sector: 'Gashora',
      type: 'IRRIGATION',
      area: 'IRRIGATION',
      priority: 'CRITICAL',
      title: 'Lake Mirayi Small-Scale Solar Pump Irrigated Horticulture',
      desc: 'Equip smallholders with portable solar water pumps and drip kits drawing from Lake Mirayi for high-value watermelon and hot pepper.',
      metric: 'Expand irrigated command area by 280 ha',
      budget: 95000000,
      beneficiaries: 1400,
      status: 'PLANNED'
    },
    {
      district: 'Bugesera',
      sector: 'Mayange',
      type: 'SOIL_FERTILITY',
      area: 'SOIL_FERTILITY',
      priority: 'HIGH',
      title: 'Mayange Drought-Resilient Agroforestry & Terracing',
      desc: 'Plant 150,000 Calliandra and Grevillea trees on progressive contour bunds to reduce wind erosion and conserve soil organic carbon.',
      metric: 'Conserve topsoil moisture and reduce runoff by 45%',
      budget: 32000000,
      beneficiaries: 2100,
      status: 'IN_PROGRESS'
    },

    // Gicumbi
    {
      district: 'Gicumbi',
      sector: 'Byumba',
      type: 'SOIL_FERTILITY',
      area: 'SOIL_FERTILITY',
      priority: 'CRITICAL',
      title: 'Gicumbi Steep-Slope Radical Terracing & Runoff Cutoff Drains',
      desc: 'Construct 450 ha of bench radical terraces on slopes above 35% to prevent catastrophic landslide erosion and topsoil wash-away.',
      metric: 'Zero topsoil erosion incidents recorded in rainy season',
      budget: 165000000,
      beneficiaries: 3400,
      status: 'IN_PROGRESS'
    },
    {
      district: 'Gicumbi',
      sector: 'Rukomo',
      type: 'EXPORT',
      area: 'EXPORT',
      priority: 'HIGH',
      title: 'Gicumbi Organic Highland Tea & Specialty Coffee Washing Hub',
      desc: 'Upgrade 2 cooperative washing stations with eco-pulpers and wastewater treatment lagoons for Fairtrade export certification.',
      metric: 'Achieve 88+ cupping score and 28% export price premium',
      budget: 78000000,
      beneficiaries: 1150,
      status: 'PLANNED'
    }
  ];

  let insertedInterventions = 0;
  for (const item of sampleInterventions) {
    const existing = await client.query(`
      SELECT id FROM agrilens.interventions WHERE title = $1 LIMIT 1;
    `, [item.title]);

    if (existing.rows.length === 0) {
      const distId = distMap[item.district.toLowerCase()];
      await client.query(`
        INSERT INTO agrilens.interventions 
          (created_by, intervention_type, title, description, status, district_name, sector_name, admin_unit_id, priority_level, challenge_area, target_metric, budget_rwf, target_beneficiaries, start_date, end_date)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_DATE, CURRENT_DATE + INTERVAL '12 months');
      `, [
        adminId, item.type, item.title, item.desc, item.status, 
        item.district, item.sector, distId, item.priority, item.area, 
        item.metric, item.budget, item.beneficiaries
      ]);
      insertedInterventions++;
    }
  }
  console.log(`Seeded ${insertedInterventions} priority interventions.`);

  await client.end();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
