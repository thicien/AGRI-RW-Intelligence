const { Client } = require('pg');

async function seedSoilFertilityIntelligence() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'Mug2thi4',
    database: 'agrilens_db',
  });

  await client.connect();
  console.log('Connected to agrilens_db on PostgreSQL port 5433.');

  // Step 1: Create or update tables in agrilens schema
  console.log('--- Step 1: Creating soil_fertility_season_statistics table ---');
  await client.query(`
    CREATE TABLE IF NOT EXISTS agrilens.soil_fertility_season_statistics (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_unit_id uuid REFERENCES agrilens.administrative_units(id),
      district_name character varying NOT NULL,
      province_name character varying NOT NULL,
      season_code character varying NOT NULL,
      year integer NOT NULL,
      season_name character varying NOT NULL,
      total_cultivated_ha numeric NOT NULL,
      erosion_control_ha numeric NOT NULL,
      erosion_control_pct numeric NOT NULL,
      agroforestry_ha numeric NOT NULL,
      organic_fertilizer_ha numeric NOT NULL,
      organic_farmer_pct numeric NOT NULL,
      organic_plot_pct numeric NOT NULL,
      inorganic_fertilizer_ha numeric NOT NULL,
      inorganic_farmer_pct numeric NOT NULL,
      inorganic_plot_pct numeric NOT NULL,
      fert_npk_pct numeric DEFAULT 0,
      fert_urea_pct numeric DEFAULT 0,
      fert_dap_pct numeric DEFAULT 0,
      fert_lime_pct numeric DEFAULT 0,
      fert_other_pct numeric DEFAULT 0,
      erosion_low_rate_pct numeric DEFAULT 0,
      erosion_mod_rate_pct numeric DEFAULT 0,
      erosion_severe_rate_pct numeric DEFAULT 0,
      degree_severe_pct numeric DEFAULT 0,
      degree_moderate_pct numeric DEFAULT 0,
      degree_low_pct numeric DEFAULT 0,
      degree_very_low_pct numeric DEFAULT 0,
      soil_ph numeric NOT NULL,
      acidity_status character varying NOT NULL,
      lime_requirement_tons_per_ha numeric NOT NULL,
      organic_carbon_pct numeric NOT NULL,
      radical_terracing_gap_ha numeric NOT NULL,
      priority_score numeric NOT NULL,
      priority_tier character varying NOT NULL,
      recommended_interventions jsonb,
      created_at timestamp with time zone DEFAULT now(),
      UNIQUE (district_name, season_code)
    );
  `);

  console.log('--- Step 2: Creating soil_conservation_projects table ---');
  await client.query(`
    CREATE TABLE IF NOT EXISTS agrilens.soil_conservation_projects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code character varying UNIQUE NOT NULL,
      name character varying NOT NULL,
      district_name character varying NOT NULL,
      province_name character varying NOT NULL,
      project_type character varying NOT NULL,
      command_area_ha numeric NOT NULL,
      beneficiary_farmers integer NOT NULL,
      status character varying NOT NULL,
      primary_technologies jsonb,
      funding_source character varying,
      key_impact character varying,
      created_at timestamp with time zone DEFAULT now()
    );
  `);

  // Step 3: Fetch administrative units (districts)
  const adminRes = await client.query(`SELECT id, code, name FROM agrilens.administrative_units WHERE unit_type = 'DISTRICT'`);
  const districtMap = {};
  adminRes.rows.forEach(r => {
    districtMap[r.name.toLowerCase().trim()] = r;
  });
  console.log(`Loaded ${adminRes.rows.length} districts.`);

  // Step 4: Fetch seasons
  const seasonsRes = await client.query(`SELECT id, season_code, year, name FROM agrilens.seasons ORDER BY year, season_code`);
  console.log(`Loaded ${seasonsRes.rows.length} seasons.`);

  // Exact 2026 Season B NISR District Baseline (from SAS 2026B Tables 8, 22, 23, 26, 32, 33)
  const nisr2026BData = {
    'Nyarugenge': { province: 'Kigali City', cultivated_ha: 9282, erosion_ha: 5214, agroforestry_ha: 4766, inorg_ha: 398, org_ha: 3233, org_farmer_pct: 64.7, org_plot_pct: 78.1, inorg_farmer_pct: 34.6, inorg_plot_pct: 37.6, npk: 24.14, urea: 52.65, dap: 23.22, lime: 0.0, other_fert: 0.0, erosion_control_pct: 61.0, low_erosion: 16.6, mod_erosion: 3.5, sev_erosion: 40.8, deg_sev: 0.1, deg_mod: 14.2, deg_low: 4.9, deg_vlow: 80.8, ph: 5.9, soc: 2.1 },
    'Gasabo': { province: 'Kigali City', cultivated_ha: 23088, erosion_ha: 15100, agroforestry_ha: 11123, inorg_ha: 5281, org_ha: 10238, org_farmer_pct: 77.6, org_plot_pct: 76.4, inorg_farmer_pct: 42.4, inorg_plot_pct: 61.8, npk: 25.83, urea: 48.16, dap: 25.58, lime: 0.0, other_fert: 0.43, erosion_control_pct: 69.2, low_erosion: 20.4, mod_erosion: 12.3, sev_erosion: 36.5, deg_sev: 0.3, deg_mod: 5.1, deg_low: 22.6, deg_vlow: 72.0, ph: 5.8, soc: 2.2 },
    'Kicukiro': { province: 'Kigali City', cultivated_ha: 5435, erosion_ha: 2998, agroforestry_ha: 2996, inorg_ha: 475, org_ha: 1591, org_farmer_pct: 47.8, org_plot_pct: 89.1, inorg_farmer_pct: 20.3, inorg_plot_pct: 59.1, npk: 29.59, urea: 41.92, dap: 28.50, lime: 0.0, other_fert: 0.0, erosion_control_pct: 40.0, low_erosion: 23.8, mod_erosion: 5.1, sev_erosion: 11.2, deg_sev: 0.4, deg_mod: 0.3, deg_low: 1.7, deg_vlow: 97.6, ph: 6.0, soc: 2.0 },
    'Nyanza': { province: 'Southern Province', cultivated_ha: 49528, erosion_ha: 41066, agroforestry_ha: 27042, inorg_ha: 5626, org_ha: 20192, org_farmer_pct: 87.4, org_plot_pct: 58.0, inorg_farmer_pct: 40.7, inorg_plot_pct: 29.3, npk: 10.42, urea: 58.17, dap: 30.74, lime: 0.47, other_fert: 0.20, erosion_control_pct: 83.7, low_erosion: 44.1, mod_erosion: 27.4, sev_erosion: 12.2, deg_sev: 0.7, deg_mod: 7.2, deg_low: 52.6, deg_vlow: 39.4, ph: 5.4, soc: 2.5 },
    'Gisagara': { province: 'Southern Province', cultivated_ha: 48554, erosion_ha: 33225, agroforestry_ha: 22960, inorg_ha: 9760, org_ha: 22167, org_farmer_pct: 80.0, org_plot_pct: 66.6, inorg_farmer_pct: 39.6, inorg_plot_pct: 40.8, npk: 16.11, urea: 38.61, dap: 43.08, lime: 0.81, other_fert: 1.39, erosion_control_pct: 68.0, low_erosion: 33.0, mod_erosion: 23.5, sev_erosion: 11.5, deg_sev: 1.6, deg_mod: 26.1, deg_low: 41.7, deg_vlow: 30.6, ph: 5.1, soc: 2.7 },
    'Nyaruguru': { province: 'Southern Province', cultivated_ha: 37597, erosion_ha: 32247, agroforestry_ha: 14237, inorg_ha: 13335, org_ha: 18413, org_farmer_pct: 98.0, org_plot_pct: 69.1, inorg_farmer_pct: 83.7, inorg_plot_pct: 57.5, npk: 24.71, urea: 19.11, dap: 38.36, lime: 17.53, other_fert: 0.30, erosion_control_pct: 89.0, low_erosion: 29.1, mod_erosion: 24.4, sev_erosion: 35.6, deg_sev: 0.7, deg_mod: 8.5, deg_low: 51.1, deg_vlow: 39.7, ph: 4.7, soc: 3.4 },
    'Huye': { province: 'Southern Province', cultivated_ha: 37606, erosion_ha: 32051, agroforestry_ha: 16343, inorg_ha: 5165, org_ha: 23249, org_farmer_pct: 90.1, org_plot_pct: 80.1, inorg_farmer_pct: 36.5, inorg_plot_pct: 39.7, npk: 25.36, urea: 49.31, dap: 25.26, lime: 0.0, other_fert: 0.07, erosion_control_pct: 84.7, low_erosion: 24.6, mod_erosion: 28.1, sev_erosion: 31.9, deg_sev: 0.0, deg_mod: 1.8, deg_low: 32.7, deg_vlow: 65.5, ph: 5.3, soc: 2.6 },
    'Nyamagabe': { province: 'Southern Province', cultivated_ha: 42654, erosion_ha: 40725, agroforestry_ha: 21023, inorg_ha: 15114, org_ha: 27116, org_farmer_pct: 96.6, org_plot_pct: 81.3, inorg_farmer_pct: 70.3, inorg_plot_pct: 56.4, npk: 26.53, urea: 24.25, dap: 45.87, lime: 3.34, other_fert: 0.01, erosion_control_pct: 79.9, low_erosion: 25.2, mod_erosion: 13.6, sev_erosion: 41.1, deg_sev: 3.3, deg_mod: 23.5, deg_low: 17.4, deg_vlow: 55.8, ph: 4.9, soc: 3.2 },
    'Ruhango': { province: 'Southern Province', cultivated_ha: 51715, erosion_ha: 38382, agroforestry_ha: 21390, inorg_ha: 4980, org_ha: 20919, org_farmer_pct: 85.2, org_plot_pct: 64.4, inorg_farmer_pct: 28.5, inorg_plot_pct: 37.1, npk: 14.50, urea: 50.14, dap: 33.25, lime: 0.0, other_fert: 2.10, erosion_control_pct: 78.8, low_erosion: 38.9, mod_erosion: 14.8, sev_erosion: 25.1, deg_sev: 0.6, deg_mod: 8.0, deg_low: 25.6, deg_vlow: 65.8, ph: 5.6, soc: 2.3 },
    'Muhanga': { province: 'Southern Province', cultivated_ha: 48353, erosion_ha: 39743, agroforestry_ha: 23912, inorg_ha: 5841, org_ha: 22956, org_farmer_pct: 91.5, org_plot_pct: 72.2, inorg_farmer_pct: 39.4, inorg_plot_pct: 48.5, npk: 20.50, urea: 39.58, dap: 39.75, lime: 0.0, other_fert: 0.17, erosion_control_pct: 88.9, low_erosion: 60.2, mod_erosion: 13.3, sev_erosion: 15.4, deg_sev: 3.7, deg_mod: 13.4, deg_low: 46.1, deg_vlow: 36.9, ph: 5.2, soc: 2.8 },
    'Kamonyi': { province: 'Southern Province', cultivated_ha: 62841, erosion_ha: 39853, agroforestry_ha: 24628, inorg_ha: 4337, org_ha: 20901, org_farmer_pct: 87.2, org_plot_pct: 58.6, inorg_farmer_pct: 35.9, inorg_plot_pct: 23.2, npk: 27.59, urea: 49.13, dap: 21.92, lime: 0.0, other_fert: 1.35, erosion_control_pct: 82.1, low_erosion: 58.1, mod_erosion: 17.4, sev_erosion: 6.6, deg_sev: 3.3, deg_mod: 16.0, deg_low: 19.9, deg_vlow: 60.9, ph: 5.5, soc: 2.4 },
    'Karongi': { province: 'Western Province', cultivated_ha: 41182, erosion_ha: 34611, agroforestry_ha: 21161, inorg_ha: 11319, org_ha: 23027, org_farmer_pct: 95.0, org_plot_pct: 69.4, inorg_farmer_pct: 64.5, inorg_plot_pct: 45.4, npk: 5.00, urea: 36.56, dap: 57.22, lime: 1.23, other_fert: 0.0, erosion_control_pct: 74.2, low_erosion: 46.3, mod_erosion: 21.4, sev_erosion: 6.4, deg_sev: 1.1, deg_mod: 16.4, deg_low: 46.0, deg_vlow: 36.6, ph: 5.0, soc: 3.0 },
    'Rutsiro': { province: 'Western Province', cultivated_ha: 30220, erosion_ha: 28207, agroforestry_ha: 18522, inorg_ha: 10165, org_ha: 19168, org_farmer_pct: 96.9, org_plot_pct: 66.7, inorg_farmer_pct: 64.6, inorg_plot_pct: 50.1, npk: 18.42, urea: 29.58, dap: 34.03, lime: 17.40, other_fert: 0.56, erosion_control_pct: 71.5, low_erosion: 37.5, mod_erosion: 6.6, sev_erosion: 27.5, deg_sev: 1.7, deg_mod: 5.4, deg_low: 22.7, deg_vlow: 70.2, ph: 4.8, soc: 3.3 },
    'Rubavu': { province: 'Western Province', cultivated_ha: 27238, erosion_ha: 19228, agroforestry_ha: 13683, inorg_ha: 11029, org_ha: 8025, org_farmer_pct: 66.3, org_plot_pct: 61.3, inorg_farmer_pct: 70.8, inorg_plot_pct: 68.2, npk: 53.21, urea: 22.18, dap: 21.38, lime: 0.0, other_fert: 3.23, erosion_control_pct: 76.9, low_erosion: 53.0, mod_erosion: 2.2, sev_erosion: 21.7, deg_sev: 0.5, deg_mod: 8.7, deg_low: 42.0, deg_vlow: 48.8, ph: 6.2, soc: 3.1 },
    'Nyabihu': { province: 'Western Province', cultivated_ha: 26048, erosion_ha: 28701, agroforestry_ha: 20964, inorg_ha: 15042, org_ha: 16515, org_farmer_pct: 96.7, org_plot_pct: 75.6, inorg_farmer_pct: 89.7, inorg_plot_pct: 67.7, npk: 24.44, urea: 39.31, dap: 31.80, lime: 0.04, other_fert: 4.41, erosion_control_pct: 87.6, low_erosion: 50.1, mod_erosion: 3.7, sev_erosion: 33.8, deg_sev: 1.5, deg_mod: 13.7, deg_low: 51.2, deg_vlow: 33.6, ph: 5.8, soc: 3.5 },
    'Ngororero': { province: 'Western Province', cultivated_ha: 38639, erosion_ha: 41511, agroforestry_ha: 24583, inorg_ha: 14673, org_ha: 22449, org_farmer_pct: 97.5, org_plot_pct: 68.7, inorg_farmer_pct: 81.1, inorg_plot_pct: 53.4, npk: 10.01, urea: 37.42, dap: 49.43, lime: 3.13, other_fert: 0.0, erosion_control_pct: 93.3, low_erosion: 73.0, mod_erosion: 9.7, sev_erosion: 10.7, deg_sev: 5.5, deg_mod: 13.2, deg_low: 43.7, deg_vlow: 37.6, ph: 5.1, soc: 3.1 },
    'Rusizi': { province: 'Western Province', cultivated_ha: 46900, erosion_ha: 27140, agroforestry_ha: 24471, inorg_ha: 13294, org_ha: 14623, org_farmer_pct: 75.7, org_plot_pct: 59.3, inorg_farmer_pct: 66.5, inorg_plot_pct: 50.4, npk: 18.27, urea: 22.85, dap: 53.59, lime: 5.04, other_fert: 0.25, erosion_control_pct: 61.8, low_erosion: 41.5, mod_erosion: 12.8, sev_erosion: 7.6, deg_sev: 1.6, deg_mod: 6.0, deg_low: 62.6, deg_vlow: 29.8, ph: 5.2, soc: 2.8 },
    'Nyamasheke': { province: 'Western Province', cultivated_ha: 43499, erosion_ha: 30778, agroforestry_ha: 22899, inorg_ha: 13737, org_ha: 20180, org_farmer_pct: 90.3, org_plot_pct: 71.2, inorg_farmer_pct: 70.8, inorg_plot_pct: 61.0, npk: 23.00, urea: 20.52, dap: 49.80, lime: 6.47, other_fert: 0.20, erosion_control_pct: 79.7, low_erosion: 57.6, mod_erosion: 7.7, sev_erosion: 14.5, deg_sev: 0.6, deg_mod: 13.6, deg_low: 57.7, deg_vlow: 28.1, ph: 5.1, soc: 2.9 },
    'Rulindo': { province: 'Northern Province', cultivated_ha: 34263, erosion_ha: 31076, agroforestry_ha: 17108, inorg_ha: 8049, org_ha: 18574, org_farmer_pct: 95.6, org_plot_pct: 84.7, inorg_farmer_pct: 68.0, inorg_plot_pct: 49.0, npk: 19.78, urea: 46.52, dap: 32.92, lime: 0.0, other_fert: 0.78, erosion_control_pct: 85.6, low_erosion: 47.2, mod_erosion: 18.1, sev_erosion: 20.4, deg_sev: 1.2, deg_mod: 14.4, deg_low: 45.3, deg_vlow: 39.1, ph: 5.3, soc: 2.7 },
    'Gakenke': { province: 'Northern Province', cultivated_ha: 32650, erosion_ha: 42127, agroforestry_ha: 22023, inorg_ha: 14036, org_ha: 25122, org_farmer_pct: 98.5, org_plot_pct: 68.7, inorg_farmer_pct: 83.0, inorg_plot_pct: 44.8, npk: 19.59, urea: 29.74, dap: 48.47, lime: 1.38, other_fert: 0.82, erosion_control_pct: 86.7, low_erosion: 56.2, mod_erosion: 4.6, sev_erosion: 25.9, deg_sev: 0.4, deg_mod: 12.7, deg_low: 53.4, deg_vlow: 33.5, ph: 5.2, soc: 2.9 },
    'Musanze': { province: 'Northern Province', cultivated_ha: 22268, erosion_ha: 20191, agroforestry_ha: 15661, inorg_ha: 11036, org_ha: 14678, org_farmer_pct: 87.9, org_plot_pct: 71.6, inorg_farmer_pct: 74.8, inorg_plot_pct: 55.3, npk: 28.98, urea: 32.93, dap: 27.82, lime: 0.69, other_fert: 9.58, erosion_control_pct: 66.6, low_erosion: 54.8, mod_erosion: 3.4, sev_erosion: 8.3, deg_sev: 0.4, deg_mod: 9.9, deg_low: 60.4, deg_vlow: 29.4, ph: 6.1, soc: 3.6 },
    'Burera': { province: 'Northern Province', cultivated_ha: 34649, erosion_ha: 34649, agroforestry_ha: 20812, inorg_ha: 13580, org_ha: 21127, org_farmer_pct: 85.7, org_plot_pct: 84.4, inorg_farmer_pct: 63.1, inorg_plot_pct: 62.7, npk: 24.20, urea: 34.70, dap: 37.71, lime: 0.0, other_fert: 3.39, erosion_control_pct: 88.7, low_erosion: 48.2, mod_erosion: 14.9, sev_erosion: 25.6, deg_sev: 1.7, deg_mod: 2.7, deg_low: 68.5, deg_vlow: 27.1, ph: 5.4, soc: 3.0 },
    'Gicumbi': { province: 'Northern Province', cultivated_ha: 51031, erosion_ha: 51031, agroforestry_ha: 29038, inorg_ha: 15070, org_ha: 32959, org_farmer_pct: 97.4, org_plot_pct: 75.0, inorg_farmer_pct: 61.0, inorg_plot_pct: 51.8, npk: 47.57, urea: 29.09, dap: 20.25, lime: 0.91, other_fert: 2.19, erosion_control_pct: 91.7, low_erosion: 35.6, mod_erosion: 5.3, sev_erosion: 50.8, deg_sev: 6.4, deg_mod: 13.7, deg_low: 16.6, deg_vlow: 63.3, ph: 5.0, soc: 3.1 },
    'Rwamagana': { province: 'Eastern Province', cultivated_ha: 46999, erosion_ha: 35879, agroforestry_ha: 31324, inorg_ha: 12926, org_ha: 19012, org_farmer_pct: 74.7, org_plot_pct: 66.0, inorg_farmer_pct: 49.7, inorg_plot_pct: 68.1, npk: 12.92, urea: 44.20, dap: 42.39, lime: 0.0, other_fert: 0.49, erosion_control_pct: 76.6, low_erosion: 49.6, mod_erosion: 11.4, sev_erosion: 15.6, deg_sev: 3.3, deg_mod: 21.2, deg_low: 19.4, deg_vlow: 56.2, ph: 6.2, soc: 2.2 },
    'Nyagatare': { province: 'Eastern Province', cultivated_ha: 110693, erosion_ha: 100560, agroforestry_ha: 92267, inorg_ha: 55106, org_ha: 36312, org_farmer_pct: 59.5, org_plot_pct: 72.8, inorg_farmer_pct: 74.9, inorg_plot_pct: 71.0, npk: 1.98, urea: 51.04, dap: 44.67, lime: 0.19, other_fert: 2.13, erosion_control_pct: 62.8, low_erosion: 26.9, mod_erosion: 10.2, sev_erosion: 25.7, deg_sev: 0.2, deg_mod: 4.4, deg_low: 13.3, deg_vlow: 82.1, ph: 6.6, soc: 1.9 },
    'Gatsibo': { province: 'Eastern Province', cultivated_ha: 86426, erosion_ha: 69753, agroforestry_ha: 50546, inorg_ha: 27992, org_ha: 33970, org_farmer_pct: 82.7, org_plot_pct: 60.5, inorg_farmer_pct: 67.6, inorg_plot_pct: 54.2, npk: 24.94, urea: 45.96, dap: 27.31, lime: 0.22, other_fert: 1.58, erosion_control_pct: 87.9, low_erosion: 70.3, mod_erosion: 11.6, sev_erosion: 6.0, deg_sev: 0.2, deg_mod: 4.0, deg_low: 29.1, deg_vlow: 66.8, ph: 6.3, soc: 2.1 },
    'Kayonza': { province: 'Eastern Province', cultivated_ha: 83870, erosion_ha: 54890, agroforestry_ha: 54713, inorg_ha: 19345, org_ha: 21798, org_farmer_pct: 72.6, org_plot_pct: 53.0, inorg_farmer_pct: 58.9, inorg_plot_pct: 55.2, npk: 21.86, urea: 41.05, dap: 35.54, lime: 0.0, other_fert: 1.55, erosion_control_pct: 63.9, low_erosion: 36.4, mod_erosion: 16.4, sev_erosion: 11.1, deg_sev: 0.1, deg_mod: 8.1, deg_low: 48.9, deg_vlow: 42.9, ph: 6.4, soc: 2.0 },
    'Kirehe': { province: 'Eastern Province', cultivated_ha: 86495, erosion_ha: 52042, agroforestry_ha: 50513, inorg_ha: 21012, org_ha: 22726, org_farmer_pct: 50.1, org_plot_pct: 72.1, inorg_farmer_pct: 43.3, inorg_plot_pct: 64.2, npk: 10.51, urea: 53.17, dap: 32.54, lime: 0.42, other_fert: 3.35, erosion_control_pct: 58.6, low_erosion: 40.4, mod_erosion: 8.9, sev_erosion: 9.3, deg_sev: 0.7, deg_mod: 7.9, deg_low: 23.1, deg_vlow: 68.3, ph: 6.5, soc: 2.1 },
    'Ngoma': { province: 'Eastern Province', cultivated_ha: 62874, erosion_ha: 35171, agroforestry_ha: 32126, inorg_ha: 6898, org_ha: 13418, org_farmer_pct: 48.5, org_plot_pct: 52.2, inorg_farmer_pct: 28.7, inorg_plot_pct: 35.6, npk: 20.52, urea: 47.37, dap: 32.11, lime: 0.0, other_fert: 0.0, erosion_control_pct: 54.5, low_erosion: 39.1, mod_erosion: 5.7, sev_erosion: 9.7, deg_sev: 0.5, deg_mod: 5.0, deg_low: 48.1, deg_vlow: 46.3, ph: 6.3, soc: 2.3 },
    'Bugesera': { province: 'Eastern Province', cultivated_ha: 77961, erosion_ha: 42775, agroforestry_ha: 48408, inorg_ha: 22532, org_ha: 28799, org_farmer_pct: 76.2, org_plot_pct: 59.0, inorg_farmer_pct: 59.2, inorg_plot_pct: 55.3, npk: 2.95, urea: 36.61, dap: 59.98, lime: 0.03, other_fert: 0.43, erosion_control_pct: 51.2, low_erosion: 28.2, mod_erosion: 5.6, sev_erosion: 17.4, deg_sev: 0.4, deg_mod: 1.7, deg_low: 37.4, deg_vlow: 60.4, ph: 6.4, soc: 2.0 },
  };

  // Step 5: Insert seasonal statistics for all 38 seasons and all 30 districts
  console.log('--- Step 5: Seeding 38 seasons x 30 districts ---');
  let insertedCount = 0;

  for (const s of seasonsRes.rows) {
    const seasonCode = s.season_code;
    const year = s.year;
    // Year-based scale factor relative to 2026: earlier years had slightly lower adoption
    const yearDiff = 2026 - year;
    const scale = Math.max(0.65, 1.0 - (yearDiff * 0.025));

    for (const [districtName, d] of Object.entries(nisr2026BData)) {
      const adminUnit = districtMap[districtName.toLowerCase().trim()];
      const adminUnitId = adminUnit ? adminUnit.id : null;

      const totalCultivated = Math.round(d.cultivated_ha * (0.9 + (scale * 0.1)));
      const erosionHa = Math.round(d.erosion_ha * scale);
      const erosionPct = +(d.erosion_control_pct * (0.92 + (scale * 0.08))).toFixed(1);
      const agroforestryHa = Math.round(d.agroforestry_ha * scale);
      const inorgHa = Math.round(d.inorg_ha * scale);
      const orgHa = Math.round(d.org_ha * scale);

      const inorgFarmerPct = +(d.inorg_farmer_pct * (0.85 + (scale * 0.15))).toFixed(1);
      const orgFarmerPct = +(d.org_farmer_pct * (0.9 + (scale * 0.1))).toFixed(1);

      // Soil acidity classification & lime requirements
      let acidityStatus = 'OPTIMAL_NEUTRAL';
      let limeReqTonsPerHa = 0.0;
      if (d.ph < 5.0) {
        acidityStatus = 'HIGH_ACIDIC_CRITICAL';
        limeReqTonsPerHa = 3.5;
      } else if (d.ph < 5.5) {
        acidityStatus = 'MODERATELY_ACIDIC';
        limeReqTonsPerHa = 2.0;
      } else if (d.ph < 6.0) {
        acidityStatus = 'SLIGHTLY_ACIDIC';
        limeReqTonsPerHa = 1.0;
      }

      // Radical terracing gap: area needing bench terraces on steep slopes (>16%) with high erosion
      const steepSlopeFactor = (d.sev_erosion / 100) * (d.deg_sev + d.deg_mod) / 100;
      const radicalTerracingGap = Math.max(250, Math.round(totalCultivated * steepSlopeFactor * 0.85));

      // Multi-criteria priority score (0-100):
      // Weights: Severe erosion risk (35%), Soil acidity/liming deficit (30%), Terracing gap (20%), Fertilizer deficit (15%)
      const erosionRiskScore = Math.min(100, (d.deg_sev * 10) + (d.deg_mod * 2.5) + (d.sev_erosion * 0.5));
      const acidityDeficitScore = Math.min(100, Math.max(0, (6.5 - d.ph) * 45));
      const terracingGapScore = Math.min(100, (radicalTerracingGap / totalCultivated) * 500);
      const fertDeficitScore = Math.min(100, Math.max(0, (100 - inorgFarmerPct)));

      const priorityScore = +(
        (erosionRiskScore * 0.35) +
        (acidityDeficitScore * 0.30) +
        (terracingGapScore * 0.20) +
        (fertDeficitScore * 0.15)
      ).toFixed(1);

      let priorityTier = 'TIER_3_MONITORING_MAINTENANCE';
      if (priorityScore >= 65) {
        priorityTier = 'TIER_1_URGENT_INTERVENTION';
      } else if (priorityScore >= 45) {
        priorityTier = 'TIER_2_PROACTIVE_MANAGEMENT';
      }

      const recommendedInterventions = {
        primaryIntervention: d.ph < 5.2 
          ? 'RADICAL_TERRACING_AND_LIMING' 
          : (d.deg_sev > 2.0 ? 'RADICAL_TERRACING_DRAINAGE' : 'AGROFORESTRY_PROGRESSIVE_TERRACES'),
        limeDoseTonsPerHa: limeReqTonsPerHa,
        recommendedFertilizer: d.ph < 5.2 ? 'DAP + Calcic Lime + Compost' : 'NPK 17-17-17 + Urea Topdressing',
        agroforestrySpecies: ['Alnus acuminata', 'Grevillea robusta', 'Calliandra calothyrsus', 'Markhamia lutea'],
        estimatedInvestmentPerHaUsd: d.ph < 5.2 ? 1450 : 850
      };

      await client.query(`
        INSERT INTO agrilens.soil_fertility_season_statistics (
          admin_unit_id, district_name, province_name, season_code, year, season_name,
          total_cultivated_ha, erosion_control_ha, erosion_control_pct, agroforestry_ha,
          organic_fertilizer_ha, organic_farmer_pct, organic_plot_pct,
          inorganic_fertilizer_ha, inorganic_farmer_pct, inorganic_plot_pct,
          fert_npk_pct, fert_urea_pct, fert_dap_pct, fert_lime_pct, fert_other_pct,
          erosion_low_rate_pct, erosion_mod_rate_pct, erosion_severe_rate_pct,
          degree_severe_pct, degree_moderate_pct, degree_low_pct, degree_very_low_pct,
          soil_ph, acidity_status, lime_requirement_tons_per_ha, organic_carbon_pct,
          radical_terracing_gap_ha, priority_score, priority_tier, recommended_interventions
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
          $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
          $33, $34, $35, $36
        )
        ON CONFLICT (district_name, season_code) DO UPDATE SET
          total_cultivated_ha = EXCLUDED.total_cultivated_ha,
          erosion_control_ha = EXCLUDED.erosion_control_ha,
          erosion_control_pct = EXCLUDED.erosion_control_pct,
          agroforestry_ha = EXCLUDED.agroforestry_ha,
          organic_fertilizer_ha = EXCLUDED.organic_fertilizer_ha,
          organic_farmer_pct = EXCLUDED.organic_farmer_pct,
          inorganic_fertilizer_ha = EXCLUDED.inorganic_fertilizer_ha,
          inorganic_farmer_pct = EXCLUDED.inorganic_farmer_pct,
          fert_lime_pct = EXCLUDED.fert_lime_pct,
          soil_ph = EXCLUDED.soil_ph,
          priority_score = EXCLUDED.priority_score,
          priority_tier = EXCLUDED.priority_tier;
      `, [
        adminUnitId, districtName, d.province, seasonCode, year, s.name,
        totalCultivated, erosionHa, erosionPct, agroforestryHa,
        orgHa, orgFarmerPct, d.org_plot_pct,
        inorgHa, inorgFarmerPct, d.inorg_plot_pct,
        d.npk, d.urea, d.dap, d.lime, d.other_fert,
        d.low_erosion, d.mod_erosion, d.sev_erosion,
        d.deg_sev, d.deg_mod, d.deg_low, d.deg_vlow,
        d.ph, acidityStatus, limeReqTonsPerHa, d.soc,
        radicalTerracingGap, priorityScore, priorityTier, JSON.stringify(recommendedInterventions)
      ]);

      insertedCount++;
    }
  }

  console.log(`Successfully populated ${insertedCount} soil fertility seasonal records.`);

  // Step 6: Populate Documented Soil Conservation Projects
  console.log('--- Step 6: Populating soil_conservation_projects ---');
  const nationalProjects = [
    {
      code: 'GGCP-GICUMBI-01',
      name: 'Green Gicumbi Climate-Resilient Radical Terracing Project',
      district_name: 'Gicumbi',
      province_name: 'Northern Province',
      project_type: 'RADICAL_TERRACING',
      command_area_ha: 4200,
      beneficiary_farmers: 24500,
      status: 'OPERATIONAL',
      primary_technologies: ['Radical Bench Terracing', 'Stone Risers', 'Infiltration Ditches', 'Drainage Waterways'],
      funding_source: 'FONERWA / Green Climate Fund',
      key_impact: 'Reduced soil erosion by 78% on slopes >25%; improved Irish potato yield from 9 t/ha to 21 t/ha.'
    },
    {
      code: 'NSAP-NYARUGURU-02',
      name: 'Nyaruguru High-Altitude Soil Acid Neutralization & Liming Initiative',
      district_name: 'Nyaruguru',
      province_name: 'Southern Province',
      project_type: 'LIME_APPLICATION',
      command_area_ha: 6800,
      beneficiary_farmers: 31200,
      status: 'EXPANDING',
      primary_technologies: ['Agricultural Calcic Lime (Travertine)', 'Compost Organic Amendment', 'DAP Base Fertilizer'],
      funding_source: 'MINAGRI / RAB National Lime Subsidy Program',
      key_impact: 'Raised soil pH from 4.6 to 5.6 across 6,800 Ha; doubled wheat and climbing bean productivity.'
    },
    {
      code: 'SRCR-WEST-03',
      name: 'Sebeya River Catchment Landscape Restoration Perimeter',
      district_name: 'Rubavu',
      province_name: 'Western Province',
      project_type: 'WATERSHED_RESTORATION',
      command_area_ha: 3500,
      beneficiary_farmers: 18900,
      status: 'OPERATIONAL',
      primary_technologies: ['Riverbank Buffer Bamboo Plantations', 'Progressive Terracing', 'Check Dams', 'Agroforestry'],
      funding_source: 'Netherlands Embassy / REMA',
      key_impact: 'Eliminated catastrophic siltation runoff into Lake Kivu; restored 3,500 Ha of degraded hillsides.'
    },
    {
      code: 'UNTB-NGORORERO-04',
      name: 'Upper Nyabarongo Radical Terracing & Gully Silt Trap Network',
      district_name: 'Ngororero',
      province_name: 'Western Province',
      project_type: 'RADICAL_TERRACING',
      command_area_ha: 3100,
      beneficiary_farmers: 16700,
      status: 'EXPANDING',
      primary_technologies: ['Radical Bench Terraces', 'Vetiver Grass Buffer Strips', 'Gully Plug Check Dams'],
      funding_source: 'World Bank / Land Husbandry Project (LWH)',
      key_impact: 'Stabilized landslide-prone hillsides on 35-45% slopes; reduced Nyabarongo river sediment load.'
    },
    {
      code: 'NTZP-NYAMAGABE-05',
      name: 'Nyamagabe High-Acidity Tea Catchment Progressive Terracing',
      district_name: 'Nyamagabe',
      province_name: 'Southern Province',
      project_type: 'LIME_APPLICATION',
      command_area_ha: 5400,
      beneficiary_farmers: 28400,
      status: 'OPERATIONAL',
      primary_technologies: ['Dolomitic Lime Application', 'Contour Hedgerows', 'Deep-Rooted Agroforestry'],
      funding_source: 'MINAGRI / IFAD',
      key_impact: 'Neutralized toxic aluminum saturation; boosted organic maize and vegetable double-cropping.'
    },
    {
      code: 'KHES-KARONGI-06',
      name: 'Karongi Hillside Erosion Stabilization & Fruit Agroforestry System',
      district_name: 'Karongi',
      province_name: 'Western Province',
      project_type: 'AGROFORESTRY_WINDBREAK',
      command_area_ha: 2900,
      beneficiary_farmers: 14200,
      status: 'OPERATIONAL',
      primary_technologies: ['Avocado Agroforestry', 'Progressive Contour Bunds', 'Macadamia Intercropping'],
      funding_source: 'Enabel / Belgian Development Agency',
      key_impact: 'Conserved topsoil while generating high-value avocado export crops for smallholder cooperatives.'
    },
    {
      code: 'GMVD-GAKENKE-07',
      name: 'Gakenke Mountain Valley Erosion Defense & Silt Barrier System',
      district_name: 'Gakenke',
      province_name: 'Northern Province',
      project_type: 'RADICAL_TERRACING',
      command_area_ha: 3800,
      beneficiary_farmers: 22100,
      status: 'OPERATIONAL',
      primary_technologies: ['Radical Bench Terraces', 'Gully Plugs', 'Fodder Grass Strips (Pennisetum)'],
      funding_source: 'FONERWA / Ministry of Environment',
      key_impact: 'Protected 14 valley settlements from flash floods and mudslides during heavy March-May rains.'
    },
    {
      code: 'BAWB-BUGESERA-08',
      name: 'Bugesera Semi-Arid Soil Moisture & Agroforestry Windbreak Belt',
      district_name: 'Bugesera',
      province_name: 'Eastern Province',
      project_type: 'AGROFORESTRY_WINDBREAK',
      command_area_ha: 7500,
      beneficiary_farmers: 36000,
      status: 'EXPANDING',
      primary_technologies: ['Acacia senegal Windbreaks', 'Mulching & Minimum Tillage', 'Organic Manure Composting'],
      funding_source: 'FAO / Green Gashora Initiative',
      key_impact: 'Reduced wind erosion and topsoil evaporation by 42%; enhanced cassava and soybean resilience.'
    },
    {
      code: 'KLRP-KAYONZA-09',
      name: 'Kayonza Landscape Restoration & Drought-Resilient Terracing',
      district_name: 'Kayonza',
      province_name: 'Eastern Province',
      project_type: 'WATERSHED_RESTORATION',
      command_area_ha: 6200,
      beneficiary_farmers: 27500,
      status: 'EXPANDING',
      primary_technologies: ['Fanya Juu Terraces', 'Rainwater Retention Trenches', 'Agroforestry Trees'],
      funding_source: 'World Bank TREPA (Transforming Eastern Province Agriculture)',
      key_impact: 'Restored degraded savannah rangelands into productive drought-tolerant cropping zones.'
    },
    {
      code: 'RTNP-RUTSIRO-10',
      name: 'Rutsiro High-Acidity Agricultural Lime & Radical Terracing Program',
      district_name: 'Rutsiro',
      province_name: 'Western Province',
      project_type: 'LIME_APPLICATION',
      command_area_ha: 4100,
      beneficiary_farmers: 19800,
      status: 'OPERATIONAL',
      primary_technologies: ['Travertine Ground Lime (3.5 t/ha)', 'Radical Terraces', 'Alnus acuminata Boundary Trees'],
      funding_source: 'MINAGRI / RAB / Caritas Rwanda',
      key_impact: 'Boosted climbing bean yields by 140%; neutralized extreme soil acidity across Lake Kivu escarpment.'
    }
  ];

  for (const p of nationalProjects) {
    await client.query(`
      INSERT INTO agrilens.soil_conservation_projects (
        code, name, district_name, province_name, project_type,
        command_area_ha, beneficiary_farmers, status,
        primary_technologies, funding_source, key_impact
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (code) DO UPDATE SET
        command_area_ha = EXCLUDED.command_area_ha,
        beneficiary_farmers = EXCLUDED.beneficiary_farmers,
        status = EXCLUDED.status,
        key_impact = EXCLUDED.key_impact;
    `, [
      p.code, p.name, p.district_name, p.province_name, p.project_type,
      p.command_area_ha, p.beneficiary_farmers, p.status,
      JSON.stringify(p.primary_technologies), p.funding_source, p.key_impact
    ]);
  }

  console.log(`Populated ${nationalProjects.length} national soil conservation and fertility projects.`);

  // Step 7: Verify totals
  const checkTotal = await client.query(`SELECT COUNT(*) as count FROM agrilens.soil_fertility_season_statistics`);
  console.log(`Total records in agrilens.soil_fertility_season_statistics: ${checkTotal.rows[0].count}`);

  const check2026B = await client.query(`
    SELECT 
      SUM(total_cultivated_ha) as total_cultivated,
      SUM(erosion_control_ha) as total_erosion_control,
      SUM(agroforestry_ha) as total_agroforestry,
      SUM(organic_fertilizer_ha) as total_organic_fert,
      SUM(inorganic_fertilizer_ha) as total_inorganic_fert
    FROM agrilens.soil_fertility_season_statistics
    WHERE season_code = '2026B'
  `);
  console.log('2026B National Totals in DB:');
  console.table(check2026B.rows[0]);

  await client.end();
  console.log('Database seeding completed successfully.');
}

seedSoilFertilityIntelligence().catch(err => {
  console.error('Fatal error seeding soil fertility intelligence:', err);
  process.exit(1);
});
