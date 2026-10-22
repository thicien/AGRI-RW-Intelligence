const { Client } = require('pg');
const argon2 = require('argon2');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'Mug2thi4',
  database: 'agrilens_db'
});

async function setup() {
  await client.connect();
  console.log('Connected to agrilens_db on port 5433.');

  // 1. Ensure table schema enhancements
  await client.query(`
    ALTER TABLE agrilens.datasets 
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'PUBLISHED',
    ADD COLUMN IF NOT EXISTS year INT DEFAULT 2026,
    ADD COLUMN IF NOT EXISTS season_code VARCHAR(20) DEFAULT '2026B',
    ADD COLUMN IF NOT EXISTS file_format VARCHAR(20) DEFAULT 'XLSX',
    ADD COLUMN IF NOT EXISTS file_size_kb INT DEFAULT 4850,
    ADD COLUMN IF NOT EXISTS row_count INT DEFAULT 1420,
    ADD COLUMN IF NOT EXISTS validation_status VARCHAR(30) DEFAULT 'VALIDATED',
    ADD COLUMN IF NOT EXISTS quality_score NUMERIC(5,2) DEFAULT 98.4,
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS published_by VARCHAR(150) DEFAULT 'manager.data@minagri.gov.rw',
    ADD COLUMN IF NOT EXISTS source_organization VARCHAR(150) DEFAULT 'National Institute of Statistics of Rwanda (NISR)';
  `);

  await client.query(`
    ALTER TABLE agrilens.dataset_versions
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS change_summary TEXT DEFAULT 'Official baseline ingested and validated.';
  `);

  // 2. Create data_validation_issues table
  await client.query(`
    CREATE TABLE IF NOT EXISTS agrilens.data_validation_issues (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      dataset_id UUID,
      dataset_name VARCHAR(255) NOT NULL,
      issue_code VARCHAR(50) NOT NULL,
      issue_type VARCHAR(100) NOT NULL,
      severity VARCHAR(20) NOT NULL,
      field_name VARCHAR(100),
      district_name VARCHAR(100),
      season_code VARCHAR(20),
      sample_value TEXT,
      rule_violated TEXT NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(30) DEFAULT 'OPEN',
      resolution_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() - INTERVAL '2 days',
      resolved_at TIMESTAMPTZ
    );
  `);

  // 3. Create data_processing_jobs table
  await client.query(`
    CREATE TABLE IF NOT EXISTS agrilens.data_processing_jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_name VARCHAR(255) NOT NULL,
      job_type VARCHAR(100) NOT NULL,
      target_module VARCHAR(100) NOT NULL,
      season_code VARCHAR(20),
      status VARCHAR(30) DEFAULT 'COMPLETED',
      progress_pct INT DEFAULT 100,
      total_records INT DEFAULT 0,
      successful_records INT DEFAULT 0,
      flagged_records INT DEFAULT 0,
      started_at TIMESTAMPTZ DEFAULT NOW() - INTERVAL '1 hour',
      completed_at TIMESTAMPTZ DEFAULT NOW() - INTERVAL '50 minutes',
      duration_seconds INT DEFAULT 45,
      triggered_by VARCHAR(150) DEFAULT 'manager.data@minagri.gov.rw',
      logs JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW() - INTERVAL '1 hour'
    );
  `);

  // 4. Ensure NISR data source exists
  let nisrSource = await client.query("SELECT id FROM agrilens.data_sources WHERE name ILIKE '%National Institute of Statistics%' LIMIT 1");
  let sourceId;
  if (nisrSource.rows.length === 0) {
    const sRes = await client.query(`
      INSERT INTO agrilens.data_sources (name, provider, source_type, description)
      VALUES ('National Institute of Statistics of Rwanda', 'NISR', 'OFFICIAL_STATISTICS', 'National official seasonal agricultural surveys and statistical tables.')
      RETURNING id;
    `);
    sourceId = sRes.rows[0].id;
  } else {
    sourceId = nisrSource.rows[0].id;
  }

  // 5. Seed authentic datasets covering multiple years and seasons (PDF & XLSX)
  const initialDatasets = [
    {
      name: 'NISR Seasonal Agricultural Survey (SAS) 2026 Season B',
      description: 'Official verified statistical publication on agricultural production, area cultivated and yield across all 30 districts of Rwanda.',
      dataset_type: 'CROP_STATISTICS',
      year: 2026,
      season_code: '2026B',
      file_format: 'XLSX',
      file_size_kb: 5420,
      row_count: 1845,
      validation_status: 'VALIDATED',
      status: 'PUBLISHED',
      quality_score: 99.2
    },
    {
      name: 'SAS 2026B Main Official Analytical Report',
      description: 'Comprehensive qualitative and quantitative NISR report detailing national food balance sheets, macro productivity trends and methodology.',
      dataset_type: 'DOCUMENTATION_PDF',
      year: 2026,
      season_code: '2026B',
      file_format: 'PDF',
      file_size_kb: 14850,
      row_count: 148,
      validation_status: 'VALIDATED',
      status: 'PUBLISHED',
      quality_score: 100.0
    },
    {
      name: 'NISR Seasonal Agricultural Survey (SAS) 2026 Season A',
      description: 'Full seasonal survey covering Season A main cereals (maize, rice, sorghum), legumes and tubers across Rwanda.',
      dataset_type: 'CROP_STATISTICS',
      year: 2026,
      season_code: '2026A',
      file_format: 'XLSX',
      file_size_kb: 5180,
      row_count: 1832,
      validation_status: 'VALIDATED',
      status: 'PUBLISHED',
      quality_score: 98.8
    },
    {
      name: 'SAS 2026A Main Analytical Report',
      description: 'Official published survey report and district summary annexes from the National Institute of Statistics of Rwanda.',
      dataset_type: 'DOCUMENTATION_PDF',
      year: 2026,
      season_code: '2026A',
      file_format: 'PDF',
      file_size_kb: 12400,
      row_count: 136,
      validation_status: 'VALIDATED',
      status: 'PUBLISHED',
      quality_score: 100.0
    },
    {
      name: 'NISR SAS Comprehensive Historical Archive (2018 - 2025)',
      description: 'Consolidated multi-year time series tracking agricultural evolution, productivity transitions and crop substitutions.',
      dataset_type: 'HISTORICAL_SERIES',
      year: 2025,
      season_code: 'MULTI_YEAR',
      file_format: 'XLSX',
      file_size_kb: 28400,
      row_count: 11200,
      validation_status: 'VALIDATED',
      status: 'PUBLISHED',
      quality_score: 97.6
    },
    {
      name: 'Rwanda Marshland & Hillside Irrigation Inventory 2025/2026',
      description: 'National coverage survey of developed dams, river intake weirs, hillside schemes and command areas across 30 districts.',
      dataset_type: 'IRRIGATION',
      year: 2025,
      season_code: '2025B',
      file_format: 'XLSX',
      file_size_kb: 3820,
      row_count: 1195,
      validation_status: 'VALIDATED',
      status: 'PUBLISHED',
      quality_score: 96.5
    },
    {
      name: 'RAB National Soil Fertility & Acidity Assessment Dossier',
      description: 'Laboratory tested and modelled soil pH, organic carbon content, soil texture, erosion risks and liming requirements by district.',
      dataset_type: 'SOIL_FERTILITY',
      year: 2025,
      season_code: '2025B',
      file_format: 'XLSX',
      file_size_kb: 4120,
      row_count: 1140,
      validation_status: 'VALIDATED',
      status: 'PUBLISHED',
      quality_score: 98.1
    },
    {
      name: 'MINAGRI Post-Harvest Storage & Processing Facility Registry',
      description: 'National directory of community warehouses, cold storage rooms, commercial drying grounds and processing centers.',
      dataset_type: 'POST_HARVEST',
      year: 2025,
      season_code: '2025B',
      file_format: 'XLSX',
      file_size_kb: 3250,
      row_count: 1140,
      validation_status: 'VALIDATED',
      status: 'PUBLISHED',
      quality_score: 97.4
    },
    {
      name: 'NAEB Cross-Border Trade & Agricultural Export Statistics 2025-2026',
      description: 'Export volumes, export values (USD), destination markets and phytosanitary compliance ratings for traditional and emerging exports.',
      dataset_type: 'TRADE_EXPORTS',
      year: 2026,
      season_code: '2026B',
      file_format: 'XLSX',
      file_size_kb: 2150,
      row_count: 380,
      validation_status: 'VALIDATED',
      status: 'PUBLISHED',
      quality_score: 99.0
    },
    {
      name: 'NISR SAS 2026 Season C Staged Crop Survey',
      description: 'Incoming pre-publication survey data for marshland vegetable cultivation and minor harvest season C.',
      dataset_type: 'CROP_STATISTICS',
      year: 2026,
      season_code: '2026C',
      file_format: 'XLSX',
      file_size_kb: 1980,
      row_count: 420,
      validation_status: 'NEEDS_REVIEW',
      status: 'IN_REVIEW',
      quality_score: 89.5
    }
  ];

  for (const ds of initialDatasets) {
    const existing = await client.query('SELECT id FROM agrilens.datasets WHERE name = $1 LIMIT 1', [ds.name]);
    let datasetId;
    if (existing.rows.length === 0) {
      const ins = await client.query(`
        INSERT INTO agrilens.datasets (
          source_id, name, description, dataset_type, spatial, temporal, 
          year, season_code, file_format, file_size_kb, row_count, 
          validation_status, status, quality_score
        )
        VALUES ($1, $2, $3, $4, TRUE, TRUE, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id;
      `, [
        sourceId, ds.name, ds.description, ds.dataset_type,
        ds.year, ds.season_code, ds.file_format, ds.file_size_kb, ds.row_count,
        ds.validation_status, ds.status, ds.quality_score
      ]);
      datasetId = ins.rows[0].id;
    } else {
      datasetId = existing.rows[0].id;
      await client.query(`
        UPDATE agrilens.datasets 
        SET status = $1, validation_status = $2, quality_score = $3, year = $4, season_code = $5, file_format = $6
        WHERE id = $7;
      `, [ds.status, ds.validation_status, ds.quality_score, ds.year, ds.season_code, ds.file_format, datasetId]);
    }

    // Ensure a dataset version exists
    const vCheck = await client.query('SELECT id FROM agrilens.dataset_versions WHERE dataset_id = $1 LIMIT 1', [datasetId]);
    if (vCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO agrilens.dataset_versions (dataset_id, version, file_path, storage_uri, checksum, change_summary)
        VALUES ($1, 'v1.0.0', $2, $3, MD5($4), 'Initial verified official release published by NISR Data Operations.');
      `, [
        datasetId,
        `/datasets/${ds.year}/${ds.season_code}/${ds.name.replace(/\s+/g, '_')}.${ds.file_format.toLowerCase()}`,
        `s3://agrilens-datasets-rwanda/${ds.year}/${ds.season_code}/`,
        ds.name
      ]);
    }
  }

  // 6. Seed Realistic Data Validation Issues (Section 1.2)
  await client.query('DELETE FROM agrilens.data_validation_issues');
  const issues = [
    {
      dataset_name: 'NISR SAS 2026 Season C Staged Crop Survey',
      issue_code: 'DQ-1',
      issue_type: 'MISSING_VALUE',
      severity: 'HIGH',
      field_name: 'production_tonnes',
      district_name: 'Nyagatare',
      season_code: '2026C',
      sample_value: 'NULL / NaN',
      rule_violated: 'Mandatory numeric production field required for commercial crops',
      description: 'Found 14 records in Season C Nyagatare vegetable marshlands with null production tonnage despite non-zero cultivated area.',
      status: 'OPEN'
    },
    {
      dataset_name: 'NISR SAS Comprehensive Historical Archive (2018 - 2025)',
      issue_code: 'DQ-3',
      issue_type: 'INCONSISTENT_CROP_NAMING',
      severity: 'MEDIUM',
      field_name: 'crop_name',
      district_name: 'Musanze',
      season_code: '2024A',
      sample_value: '"Irish_Potato" vs "Irish Potato"',
      rule_violated: 'Standardized NISR crop nomenclature catalog mapping',
      description: 'Inconsistent snake_case crop name variant detected in historical import batch. Requires canonical renaming to "Irish Potato".',
      status: 'RESOLVED',
      resolution_notes: 'Mapped to canonical UUID 4a07010a-b30f-48e7-9d7a-c603dc508311 via automated alias translation table.'
    },
    {
      dataset_name: 'Rwanda Marshland & Hillside Irrigation Inventory 2025/2026',
      issue_code: 'DQ-4',
      issue_type: 'INVALID_UNITS',
      severity: 'CRITICAL',
      field_name: 'area_command_ha',
      district_name: 'Gatsibo',
      season_code: '2025B',
      sample_value: '24,500 ha (Outlier)',
      rule_violated: 'Maximum plausible command area ceiling (< 8,000 ha per single scheme)',
      description: 'Input value was recorded in square meters (24,500 m2) instead of hectares, creating a 100x statistical distortion.',
      status: 'RESOLVED',
      resolution_notes: 'Converted 24,500 m2 to 2.45 hectares verified against RAB Engineering Schematics.'
    },
    {
      dataset_name: 'MINAGRI Post-Harvest Storage & Processing Facility Registry',
      issue_code: 'DQ-5',
      issue_type: 'CONFLICTING_GEO_IDENTIFIER',
      severity: 'MEDIUM',
      field_name: 'sector_code',
      district_name: 'Nyamagabe',
      season_code: '2025B',
      sample_value: 'Sector Code RW-02-04-99',
      rule_violated: 'Official Rwanda National Boundary Registry (NISR Geo-Codes)',
      description: 'Assigned sector code does not match the 17 official subordinate sectors of Nyamagabe District.',
      status: 'OPEN'
    },
    {
      dataset_name: 'NISR SAS 2026 Season C Staged Crop Survey',
      issue_code: 'DQ-2',
      issue_type: 'DUPLICATE_RECORDS',
      severity: 'HIGH',
      field_name: '[district_id, crop_id, season_id]',
      district_name: 'Bugesera',
      season_code: '2026C',
      sample_value: 'Duplicate composite key (Bugesera, Climbing Beans, 2026C)',
      rule_violated: 'Unique grain aggregation per district and season',
      description: 'Two separate survey enumerator files submitted overlapping totals for Bugesera climbing beans.',
      status: 'OPEN'
    },
    {
      dataset_name: 'RAB National Soil Fertility & Acidity Assessment Dossier',
      issue_code: 'DQ-6',
      issue_type: 'INCOMPATIBLE_SEASON_DEFINITION',
      severity: 'LOW',
      field_name: 'sampling_date_window',
      district_name: 'Karongi',
      season_code: '2025B',
      sample_value: 'Sampling date 2025-08-30',
      rule_violated: 'Season B calendar threshold ends July 31',
      description: 'Observation date falls during dry season transition; flagged for seasonal calibration check.',
      status: 'RESOLVED',
      resolution_notes: 'Validated as post-harvest late testing; normalized to Season 2025B evaluation cycle.'
    }
  ];

  for (const iss of issues) {
    await client.query(`
      INSERT INTO agrilens.data_validation_issues (
        dataset_name, issue_code, issue_type, severity, field_name,
        district_name, season_code, sample_value, rule_violated, description,
        status, resolution_notes, resolved_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
    `, [
      iss.dataset_name, iss.issue_code, iss.issue_type, iss.severity, iss.field_name,
      iss.district_name, iss.season_code, iss.sample_value, iss.rule_violated, iss.description,
      iss.status, iss.resolution_notes || null, iss.status === 'RESOLVED' ? new Date() : null
    ]);
  }

  // 7. Seed Processing Jobs (Section 1.4)
  await client.query('DELETE FROM agrilens.data_processing_jobs');
  const jobs = [
    {
      name: 'Clean & Normalize SAS 2026B Productivity Outliers',
      type: 'CLEANING_NORMALIZATION',
      module: 'Agricultural Productivity',
      season: '2026B',
      status: 'COMPLETED',
      total: 1845,
      successful: 1838,
      flagged: 7,
      duration: 38
    },
    {
      name: 'Spatial Boundary Match: Rwanda 2026 Administrative Polygons',
      type: 'SPATIAL_PROCESSING',
      module: 'Maps & Spatial Data',
      season: '2026B',
      status: 'COMPLETED',
      total: 443,
      successful: 443,
      flagged: 0,
      duration: 52
    },
    {
      name: 'Aggregate Sector Irrigation Access to District Command Totals',
      type: 'AGGREGATION',
      module: 'Irrigation Opportunities',
      season: '2025B',
      status: 'COMPLETED',
      total: 1195,
      successful: 1195,
      flagged: 0,
      duration: 29
    },
    {
      name: 'Batch Lime Requirement Model Calibration: Acidic Volcanic Hotspots',
      type: 'ANALYTICAL_MODEL',
      module: 'Soil & Fertility',
      season: '2025B',
      status: 'COMPLETED',
      total: 1140,
      successful: 1134,
      flagged: 6,
      duration: 44
    },
    {
      name: 'Post-Harvest Deficit & Storage Gap Extrapolation 2025/2026',
      type: 'ANALYTICAL_CALCULATION',
      module: 'Post-Harvest & Storage',
      season: '2025B',
      status: 'COMPLETED',
      total: 1140,
      successful: 1140,
      flagged: 0,
      duration: 33
    },
    {
      name: 'Staged Survey Ingestion Pipeline: SAS 2026 Season C',
      type: 'INGESTION_EXTRACTION',
      module: 'Agricultural Productivity',
      season: '2026C',
      status: 'IN_PROGRESS',
      total: 420,
      successful: 365,
      flagged: 14,
      duration: 18
    }
  ];

  for (const j of jobs) {
    await client.query(`
      INSERT INTO agrilens.data_processing_jobs (
        job_name, job_type, target_module, season_code, status, progress_pct,
        total_records, successful_records, flagged_records, duration_seconds
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
    `, [
      j.name, j.type, j.module, j.season, j.status, j.status === 'COMPLETED' ? 100 : 78,
      j.total, j.successful, j.flagged, j.duration
    ]);
  }

  // 8. Ensure Data Manager Account exists
  const existingUser = await client.query("SELECT id FROM agrilens.users WHERE email = 'datamanager@agrilens.gov.rw' LIMIT 1");
  const hashedPw = await argon2.hash('Data@2026!');
  let dmUserId;

  if (existingUser.rows.length === 0) {
    const uRes = await client.query(`
      INSERT INTO agrilens.users (full_name, email, password_hash, status)
      VALUES ('Jean-Paul Habimana', 'datamanager@agrilens.gov.rw', $1, 'ACTIVE')
      RETURNING id;
    `, [hashedPw]);
    dmUserId = uRes.rows[0].id;
    console.log('Created datamanager user:', dmUserId);
  } else {
    dmUserId = existingUser.rows[0].id;
    await client.query(`
      UPDATE agrilens.users 
      SET password_hash = $1, full_name = 'Jean-Paul Habimana', status = 'ACTIVE'
      WHERE id = $2;
    `, [hashedPw, dmUserId]);
    console.log('Updated existing datamanager user:', dmUserId);
  }

  // Assign DATA_MANAGER role in agrilens.user_roles
  const dmRole = await client.query("SELECT id FROM agrilens.roles WHERE code = 'DATA_MANAGER' LIMIT 1");
  if (dmRole.rows.length > 0) {
    const roleId = dmRole.rows[0].id;
    await client.query("DELETE FROM agrilens.user_roles WHERE user_id = $1", [dmUserId]);
    await client.query("INSERT INTO agrilens.user_roles (user_id, role_id) VALUES ($1, $2)", [dmUserId, roleId]);
  }

  // Assign NATIONAL_DOMAINS scope with Rwanda country unit
  const rwandaUnit = await client.query("SELECT id FROM agrilens.administrative_units WHERE unit_type = 'COUNTRY' LIMIT 1");
  const rwandaId = rwandaUnit.rows[0]?.id || 'c2d6be65-7c8a-4b7d-92fb-57543aba60ea';
  await client.query("DELETE FROM agrilens.user_locations WHERE user_id = $1", [dmUserId]);
  await client.query(`
    INSERT INTO agrilens.user_locations (user_id, admin_unit_id, scope_level)
    VALUES ($1, $2, 'NATIONAL_DOMAINS');
  `, [dmUserId, rwandaId]);

  // Also update datamanager@nisr.gov.rw with known password Data@2026!
  await client.query(`
    UPDATE agrilens.users 
    SET password_hash = $1, status = 'ACTIVE' 
    WHERE email = 'datamanager@nisr.gov.rw';
  `, [hashedPw]);

  console.log('Data Manager setup script completed successfully!');
  await client.end();
}

setup().catch(console.error);
