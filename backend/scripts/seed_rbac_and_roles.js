const { Client } = require('pg');
const argon2 = require('argon2');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'Mug2thi4',
  database: process.env.DB_NAME || 'agrilens_db',
});

// The 8 Official Logical Roles defined in Section 4.1
const ROLES = [
  {
    code: 'PLATFORM_ADMIN',
    name: 'Platform Administrator',
    description: 'Highest privilege. Manages accounts, role assignments, permissions, system configuration and security. Can access audit information and administrative tools.',
    scope_type: 'SYSTEM_WIDE'
  },
  {
    code: 'DATA_MANAGER',
    name: 'Data Manager',
    description: 'Manages dataset uploads, extraction jobs, metadata, data validation, corrections and publication of approved datasets. Cannot manage platform security.',
    scope_type: 'NATIONAL_DOMAINS'
  },
  {
    code: 'NATIONAL_PLANNER',
    name: 'National Agricultural Planner',
    description: 'Views national and district-level indicators, compares seasons, reviews opportunity rankings, generates reports and exports permitted aggregated data.',
    scope_type: 'NATIONAL'
  },
  {
    code: 'DISTRICT_OFFICER',
    name: 'District Agricultural Officer',
    description: 'Views the assigned district and its sectors, analyzes local agricultural trends, reviews intervention priorities and generates district reports.',
    scope_type: 'DISTRICT'
  },
  {
    code: 'SECTOR_OFFICER',
    name: 'Sector Agricultural Officer',
    description: 'Views the assigned sector, available local indicators and aggregated agricultural statistics. Can submit field-verification findings if enabled.',
    scope_type: 'SECTOR'
  },
  {
    code: 'RESEARCHER_ANALYST',
    name: 'Researcher or Data Analyst',
    description: 'Explores authorized datasets, filters seasonal and geographic data, conducts comparisons and exports permitted records for analysis.',
    scope_type: 'AUTHORIZED_SCOPE'
  },
  {
    code: 'COOPERATIVE_FARMER',
    name: 'Cooperative or Farmer User',
    description: 'Views accessible crop trends, seasonal guidance, nearby verified facilities and relevant market information. Can submit feedback or requests.',
    scope_type: 'LOCAL_COOPERATIVE'
  },
  {
    code: 'PARTNER_VIEWER',
    name: 'Partner, Policymaker or Viewer',
    description: 'Accesses approved dashboards, public maps and published reports. Cannot upload datasets, change official records or administer users.',
    scope_type: 'PUBLIC_PUBLISHED'
  }
];

// The 13 Capabilities defined in Permissions Matrix 4.2
const CAPABILITIES = [
  { code: 'VIEW_PUBLISHED_DASHBOARDS', name: 'View published dashboards', category: 'DASHBOARDS', desc: 'Access published operational & strategic dashboards' },
  { code: 'VIEW_RAW_SOURCE_FILES', name: 'View raw source files', category: 'DATASETS', desc: 'Inspect underlying raw survey microdata and shapefiles' },
  { code: 'UPLOAD_DATASETS', name: 'Upload datasets', category: 'DATASETS', desc: 'Upload new seasonal datasets, surveys, or GIS layers' },
  { code: 'VALIDATE_IMPORTED_RECORDS', name: 'Validate imported records', category: 'DATASETS', desc: 'Review ingestion pipeline errors and execute validation passes' },
  { code: 'APPROVE_DATASET_PUBLICATION', name: 'Approve dataset publication', category: 'DATASETS', desc: 'Authoritative two-man rule signoff to publish datasets to production' },
  { code: 'FILTER_YEAR_CROP_SEASON', name: 'Filter year, crop and season', category: 'ANALYTICS', desc: 'Apply multidimensional filters across time, crop, and location' },
  { code: 'VIEW_OPPORTUNITY_RANKINGS', name: 'View opportunity rankings', category: 'INTELLIGENCE', desc: 'Access MCDA rankings for irrigation, soil, storage, and exports' },
  { code: 'EXPORT_REPORTS', name: 'Export reports', category: 'REPORTING', desc: 'Export formatted summary dossiers, PDF briefs, and charts' },
  { code: 'EXPORT_RAW_DATA', name: 'Export raw data', category: 'REPORTING', desc: 'Export tabular CSV/XLSX data with backend rate-limiting & tracking' },
  { code: 'EDIT_OFFICIAL_STATISTICS', name: 'Edit official statistics', category: 'DATASETS', desc: 'Controlled correction workflow for published agricultural statistics' },
  { code: 'SUBMIT_FIELD_OBSERVATIONS', name: 'Submit field observations', category: 'OPERATIONS', desc: 'Submit ground-truth verifications, soil samples, and farmer feedback' },
  { code: 'MANAGE_USERS_ROLES', name: 'Manage users and roles', category: 'ADMIN', desc: 'Create user accounts, assign roles, and define geographic scopes' },
  { code: 'VIEW_SECURITY_AUDIT_LOGS', name: 'View security audit logs', category: 'ADMIN', desc: 'Inspect chronological system events, access logs, and export trails' }
];

// Exact Matrix 4.2 Mapping
// Policy values: 'YES', 'SCOPED', 'AUTHORIZED', 'CONTROLLED', 'LIMITED', 'PUBLISHED', 'NO', 'OPTIONAL'
const MATRIX_MAPPING = {
  VIEW_PUBLISHED_DASHBOARDS: {
    PLATFORM_ADMIN: 'YES',
    DATA_MANAGER: 'YES',
    NATIONAL_PLANNER: 'YES',
    DISTRICT_OFFICER: 'SCOPED',
    SECTOR_OFFICER: 'SCOPED',
    RESEARCHER_ANALYST: 'YES',
    COOPERATIVE_FARMER: 'LIMITED',
    PARTNER_VIEWER: 'YES'
  },
  VIEW_RAW_SOURCE_FILES: {
    PLATFORM_ADMIN: 'AUTHORIZED',
    DATA_MANAGER: 'YES',
    NATIONAL_PLANNER: 'NO',
    DISTRICT_OFFICER: 'NO',
    SECTOR_OFFICER: 'NO',
    RESEARCHER_ANALYST: 'AUTHORIZED',
    COOPERATIVE_FARMER: 'NO',
    PARTNER_VIEWER: 'NO'
  },
  UPLOAD_DATASETS: {
    PLATFORM_ADMIN: 'OPTIONAL',
    DATA_MANAGER: 'YES',
    NATIONAL_PLANNER: 'NO',
    DISTRICT_OFFICER: 'NO',
    SECTOR_OFFICER: 'NO',
    RESEARCHER_ANALYST: 'NO',
    COOPERATIVE_FARMER: 'NO',
    PARTNER_VIEWER: 'NO'
  },
  VALIDATE_IMPORTED_RECORDS: {
    PLATFORM_ADMIN: 'OPTIONAL',
    DATA_MANAGER: 'YES',
    NATIONAL_PLANNER: 'NO',
    DISTRICT_OFFICER: 'NO',
    SECTOR_OFFICER: 'NO',
    RESEARCHER_ANALYST: 'NO',
    COOPERATIVE_FARMER: 'NO',
    PARTNER_VIEWER: 'NO'
  },
  APPROVE_DATASET_PUBLICATION: {
    PLATFORM_ADMIN: 'AUTHORIZED',
    DATA_MANAGER: 'YES',
    NATIONAL_PLANNER: 'NO',
    DISTRICT_OFFICER: 'NO',
    SECTOR_OFFICER: 'NO',
    RESEARCHER_ANALYST: 'NO',
    COOPERATIVE_FARMER: 'NO',
    PARTNER_VIEWER: 'NO'
  },
  FILTER_YEAR_CROP_SEASON: {
    PLATFORM_ADMIN: 'YES',
    DATA_MANAGER: 'YES',
    NATIONAL_PLANNER: 'YES',
    DISTRICT_OFFICER: 'SCOPED',
    SECTOR_OFFICER: 'SCOPED',
    RESEARCHER_ANALYST: 'YES',
    COOPERATIVE_FARMER: 'LIMITED',
    PARTNER_VIEWER: 'YES'
  },
  VIEW_OPPORTUNITY_RANKINGS: {
    PLATFORM_ADMIN: 'YES',
    DATA_MANAGER: 'YES',
    NATIONAL_PLANNER: 'YES',
    DISTRICT_OFFICER: 'SCOPED',
    SECTOR_OFFICER: 'SCOPED',
    RESEARCHER_ANALYST: 'YES',
    COOPERATIVE_FARMER: 'LIMITED',
    PARTNER_VIEWER: 'YES'
  },
  EXPORT_REPORTS: {
    PLATFORM_ADMIN: 'AUTHORIZED',
    DATA_MANAGER: 'AUTHORIZED',
    NATIONAL_PLANNER: 'YES',
    DISTRICT_OFFICER: 'SCOPED',
    SECTOR_OFFICER: 'SCOPED',
    RESEARCHER_ANALYST: 'AUTHORIZED',
    COOPERATIVE_FARMER: 'LIMITED',
    PARTNER_VIEWER: 'YES'
  },
  EXPORT_RAW_DATA: {
    PLATFORM_ADMIN: 'AUTHORIZED',
    DATA_MANAGER: 'AUTHORIZED',
    NATIONAL_PLANNER: 'NO',
    DISTRICT_OFFICER: 'NO',
    SECTOR_OFFICER: 'NO',
    RESEARCHER_ANALYST: 'AUTHORIZED',
    COOPERATIVE_FARMER: 'NO',
    PARTNER_VIEWER: 'NO'
  },
  EDIT_OFFICIAL_STATISTICS: {
    PLATFORM_ADMIN: 'CONTROLLED',
    DATA_MANAGER: 'CONTROLLED',
    NATIONAL_PLANNER: 'NO',
    DISTRICT_OFFICER: 'NO',
    SECTOR_OFFICER: 'NO',
    RESEARCHER_ANALYST: 'NO',
    COOPERATIVE_FARMER: 'NO',
    PARTNER_VIEWER: 'NO'
  },
  SUBMIT_FIELD_OBSERVATIONS: {
    PLATFORM_ADMIN: 'OPTIONAL',
    DATA_MANAGER: 'OPTIONAL',
    NATIONAL_PLANNER: 'OPTIONAL',
    DISTRICT_OFFICER: 'OPTIONAL',
    SECTOR_OFFICER: 'OPTIONAL',
    RESEARCHER_ANALYST: 'OPTIONAL',
    COOPERATIVE_FARMER: 'OPTIONAL',
    PARTNER_VIEWER: 'NO'
  },
  MANAGE_USERS_ROLES: {
    PLATFORM_ADMIN: 'YES',
    DATA_MANAGER: 'NO',
    NATIONAL_PLANNER: 'NO',
    DISTRICT_OFFICER: 'NO',
    SECTOR_OFFICER: 'NO',
    RESEARCHER_ANALYST: 'NO',
    COOPERATIVE_FARMER: 'NO',
    PARTNER_VIEWER: 'NO'
  },
  VIEW_SECURITY_AUDIT_LOGS: {
    PLATFORM_ADMIN: 'YES',
    DATA_MANAGER: 'NO',
    NATIONAL_PLANNER: 'NO',
    DISTRICT_OFFICER: 'NO',
    SECTOR_OFFICER: 'NO',
    RESEARCHER_ANALYST: 'NO',
    COOPERATIVE_FARMER: 'NO',
    PARTNER_VIEWER: 'NO'
  }
};

// 8 Persona Users to Seed for Live Demonstration & RBAC validation
const PERSONAS = [
  {
    name: 'Hon. Jean-Claude Musabyimana',
    email: 'admin@agrilens.gov.rw',
    role: 'PLATFORM_ADMIN',
    scope_level: 'NATIONAL',
    district: null,
    sector: null,
    phone: '+250 788 100 001',
    password: 'Admin@2026!'
  },
  {
    name: 'Claudine Uwera (NISR Data Lead)',
    email: 'datamanager@nisr.gov.rw',
    role: 'DATA_MANAGER',
    scope_level: 'NATIONAL',
    district: null,
    sector: null,
    phone: '+250 788 100 002',
    password: 'AgriLens@2026!'
  },
  {
    name: 'Dr. Telesphore Ndabamenye',
    email: 'planner@minagri.gov.rw',
    role: 'NATIONAL_PLANNER',
    scope_level: 'NATIONAL',
    district: null,
    sector: null,
    phone: '+250 788 100 003',
    password: 'AgriLens@2026!'
  },
  {
    name: 'Patrick Gasana (DAO Nyagatare)',
    email: 'district.nyagatare@minagri.gov.rw',
    role: 'DISTRICT_OFFICER',
    scope_level: 'DISTRICT',
    district: 'Nyagatare',
    sector: null,
    phone: '+250 788 100 004',
    password: 'AgriLens@2026!'
  },
  {
    name: 'Aline Mukamana (SAO Rukomo)',
    email: 'sector.rukomo@minagri.gov.rw',
    role: 'SECTOR_OFFICER',
    scope_level: 'SECTOR',
    district: 'Nyagatare',
    sector: 'Rukomo',
    phone: '+250 788 100 005',
    password: 'AgriLens@2026!'
  },
  {
    name: 'Prof. Innocent Ndikumana (UR AgTech)',
    email: 'researcher@ur.ac.rw',
    role: 'RESEARCHER_ANALYST',
    scope_level: 'NATIONAL',
    district: null,
    sector: null,
    phone: '+250 788 100 006',
    password: 'AgriLens@2026!'
  },
  {
    name: 'Emmanuel Habimana (Nyagatare Rice Coop)',
    email: 'farmer.coop@agrilens.rw',
    role: 'COOPERATIVE_FARMER',
    scope_level: 'DISTRICT',
    district: 'Nyagatare',
    sector: 'Rukomo',
    phone: '+250 788 100 007',
    password: 'AgriLens@2026!'
  },
  {
    name: 'Sarah Jenkins (World Bank Ag Lead)',
    email: 'viewer.partner@worldbank.org',
    role: 'PARTNER_VIEWER',
    scope_level: 'NATIONAL',
    district: null,
    sector: null,
    phone: '+250 788 100 008',
    password: 'AgriLens@2026!'
  }
];

async function seedRBAC() {
  await client.connect();
  console.log('Connected to agrilens_db. Seeding Section 4 RBAC & Permissions Matrix...');

  // Ensure tables in agrilens schema
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS agrilens;
    SET search_path TO agrilens, public;
  `);

  // Ensure permissions table has code and category columns, relax constraints if needed
  await client.query(`
    ALTER TABLE agrilens.permissions ADD COLUMN IF NOT EXISTS code VARCHAR(100);
    ALTER TABLE agrilens.permissions ADD COLUMN IF NOT EXISTS category VARCHAR(100);
    ALTER TABLE agrilens.permissions ALTER COLUMN resource DROP NOT NULL;
    ALTER TABLE agrilens.permissions ALTER COLUMN action DROP NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_code ON agrilens.permissions(code);
  `);

  // Upsert all 13 Capabilities
  console.log('Seeding 13 Official Capabilities...');
  const permMap = {};
  for (const cap of CAPABILITIES) {
    const res = await client.query(`
      INSERT INTO agrilens.permissions (code, name, category, description, resource, action)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (code) DO UPDATE 
      SET name = EXCLUDED.name, category = EXCLUDED.category, description = EXCLUDED.description,
          resource = EXCLUDED.resource, action = EXCLUDED.action
      RETURNING id, code;
    `, [cap.code, cap.name, cap.category, cap.desc, cap.category.toLowerCase(), 'access']);
    permMap[cap.code] = res.rows[0].id;
  }
  console.log('Capabilities seeded:', Object.keys(permMap).length);

  // Ensure roles table has code column
  await client.query(`
    ALTER TABLE agrilens.roles ADD COLUMN IF NOT EXISTS code VARCHAR(100) UNIQUE;
    ALTER TABLE agrilens.roles ADD COLUMN IF NOT EXISTS scope_type VARCHAR(100);
  `);

  // Upsert the 8 Roles
  console.log('Seeding 8 Official Roles...');
  const roleMap = {};
  for (const r of ROLES) {
    const res = await client.query(`
      INSERT INTO agrilens.roles (code, name, description, scope_type)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (code) DO UPDATE
      SET name = EXCLUDED.name, description = EXCLUDED.description, scope_type = EXCLUDED.scope_type
      RETURNING id, code;
    `, [r.code, r.name, r.description, r.scope_type]);
    roleMap[r.code] = res.rows[0].id;
  }
  console.log('Roles seeded:', Object.keys(roleMap).length);

  // Ensure role_permissions table
  await client.query(`
    CREATE TABLE IF NOT EXISTS agrilens.role_permissions (
      role_id UUID NOT NULL REFERENCES agrilens.roles(id) ON DELETE CASCADE,
      permission_id UUID NOT NULL REFERENCES agrilens.permissions(id) ON DELETE CASCADE,
      policy_value VARCHAR(50) NOT NULL DEFAULT 'YES',
      PRIMARY KEY (role_id, permission_id)
    );
    ALTER TABLE agrilens.role_permissions ADD COLUMN IF NOT EXISTS policy_value VARCHAR(50) DEFAULT 'YES';
  `);

  // Populate Role Permissions according to Matrix 4.2
  console.log('Populating Role Permissions Matrix...');
  await client.query('DELETE FROM agrilens.role_permissions');

  for (const [capCode, rolePolicies] of Object.entries(MATRIX_MAPPING)) {
    const permId = permMap[capCode];
    if (!permId) continue;

    for (const [roleCode, policy] of Object.entries(rolePolicies)) {
      const roleId = roleMap[roleCode];
      if (!roleId) continue;

      await client.query(`
        INSERT INTO agrilens.role_permissions (role_id, permission_id, policy_value)
        VALUES ($1, $2, $3)
        ON CONFLICT (role_id, permission_id) DO UPDATE SET policy_value = EXCLUDED.policy_value;
      `, [roleId, permId, policy]);
    }
  }
  console.log('Role Permissions Matrix populated successfully.');

  // Ensure user_locations has scope_level and text references
  await client.query(`
    ALTER TABLE agrilens.user_locations ADD COLUMN IF NOT EXISTS scope_level VARCHAR(50) DEFAULT 'NATIONAL';
    ALTER TABLE agrilens.user_locations ADD COLUMN IF NOT EXISTS district_name VARCHAR(100);
    ALTER TABLE agrilens.user_locations ADD COLUMN IF NOT EXISTS sector_name VARCHAR(100);
  `);

  // Find administrative unit IDs for Country (Rwanda), Nyagatare and Rukomo
  const rwandaUnit = await client.query(`
    SELECT id FROM agrilens.administrative_units WHERE unit_type = 'COUNTRY' LIMIT 1
  `);
  const rwandaId = rwandaUnit.rows[0]?.id || null;

  const nyagatareUnit = await client.query(`
    SELECT id FROM agrilens.administrative_units WHERE name ILIKE 'Nyagatare' AND unit_type = 'DISTRICT' LIMIT 1
  `);
  const nyagatareId = nyagatareUnit.rows[0]?.id || null;

  // Insert or find Rukomo sector in administrative units if missing
  let rukomoId = null;
  const rukomoUnit = await client.query(`
    SELECT id FROM agrilens.administrative_units WHERE name ILIKE 'Rukomo' LIMIT 1
  `);
  if (rukomoUnit.rows.length > 0) {
    rukomoId = rukomoUnit.rows[0].id;
  } else if (nyagatareId) {
    const ins = await client.query(`
      INSERT INTO agrilens.administrative_units (name, code, unit_type, parent_id)
      VALUES ('Rukomo', 'RW-05-01-RK', 'SECTOR', $1)
      RETURNING id;
    `, [nyagatareId]);
    rukomoId = ins.rows[0].id;
    console.log('Created administrative unit Rukomo Sector (id: ' + rukomoId + ')');
  }

  // Seed Personas
  console.log('Seeding 8 Personas and user locations...');
  for (const p of PERSONAS) {
    const roleId = roleMap[p.role];
    const hash = await argon2.hash(p.password);

    // Upsert User
    const userRes = await client.query(`
      INSERT INTO agrilens.users (full_name, email, password_hash, phone, status)
      VALUES ($1, $2, $3, $4, 'ACTIVE')
      ON CONFLICT (email) DO UPDATE
      SET full_name = EXCLUDED.full_name, password_hash = EXCLUDED.password_hash, phone = EXCLUDED.phone, status = 'ACTIVE'
      RETURNING id;
    `, [p.name, p.email, hash, p.phone]);
    const userId = userRes.rows[0].id;

    // Assign Role in user_roles
    await client.query(`
      INSERT INTO agrilens.user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    `, [userId, roleId]);

    // Map Geographic Scope
    await client.query('DELETE FROM agrilens.user_locations WHERE user_id = $1', [userId]);

    let assignedUnitId = rwandaId;
    if (p.scope_level === 'DISTRICT') assignedUnitId = nyagatareId;
    if (p.scope_level === 'SECTOR') assignedUnitId = rukomoId;

    await client.query(`
      INSERT INTO agrilens.user_locations (user_id, admin_unit_id, scope_level, district_name, sector_name)
      VALUES ($1, $2, $3, $4, $5);
    `, [userId, assignedUnitId, p.scope_level, p.district, p.sector]);

    console.log(`Persona Ready: ${p.name} (${p.email}) -> Role: ${p.role}, Scope: ${p.scope_level} ${p.district || ''}`);
  }

  // Ensure agrilens.field_observations table and columns exist
  await client.query(`
    CREATE TABLE IF NOT EXISTS agrilens.field_observations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES agrilens.users(id),
      district_name VARCHAR(100),
      sector_name VARCHAR(100),
      crop_type VARCHAR(100),
      observation_type VARCHAR(100),
      notes TEXT,
      status VARCHAR(50) DEFAULT 'PENDING_VALIDATION',
      gps_lat NUMERIC(9,6),
      gps_lng NUMERIC(9,6),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE agrilens.field_observations ALTER COLUMN user_id DROP NOT NULL;
    ALTER TABLE agrilens.field_observations ALTER COLUMN admin_unit_id DROP NOT NULL;
    ALTER TABLE agrilens.field_observations ALTER COLUMN description DROP NOT NULL;
    ALTER TABLE agrilens.field_observations ADD COLUMN IF NOT EXISTS district_name VARCHAR(100);
    ALTER TABLE agrilens.field_observations ADD COLUMN IF NOT EXISTS sector_name VARCHAR(100);
    ALTER TABLE agrilens.field_observations ADD COLUMN IF NOT EXISTS crop_type VARCHAR(100);
    ALTER TABLE agrilens.field_observations ADD COLUMN IF NOT EXISTS observation_type VARCHAR(100);
    ALTER TABLE agrilens.field_observations ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE agrilens.field_observations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING_VALIDATION';
    ALTER TABLE agrilens.field_observations ADD COLUMN IF NOT EXISTS gps_lat NUMERIC(9,6);
    ALTER TABLE agrilens.field_observations ADD COLUMN IF NOT EXISTS gps_lng NUMERIC(9,6);
    ALTER TABLE agrilens.field_observations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
  `);

  // Get Rukomo sector officer user ID
  const rukomoUser = await client.query("SELECT id FROM agrilens.users WHERE email = 'sector.rukomo@minagri.gov.rw'");
  const rukomoUserId = rukomoUser.rows[0]?.id || null;

  await client.query(`
    INSERT INTO agrilens.field_observations (user_id, admin_unit_id, description, district_name, sector_name, crop_type, observation_type, notes, status, gps_lat, gps_lng)
    VALUES 
      ($1, $2, 'Solar river irrigation scheme', 'Nyagatare', 'Rukomo', 'Maize', 'IRRIGATION_VERIFICATION', 'Solar-powered river pumping system operational across 42 hectares. Soil moisture optimal.', 'VALIDATED', -1.4820, 30.3450),
      ($1, $2, 'Acidity alert in eastern terrace', 'Nyagatare', 'Rukomo', 'Beans', 'SOIL_ACIDITY_ALERT', 'Localized acidity identified in eastern terrace plots. Lime treatment recommended before 2026B.', 'PENDING_VALIDATION', -1.4910, 30.3520),
      ($1, $2, 'Cold storage utilization report', 'Musanze', 'Muhoza', 'Irish Potato', 'POST_HARVEST_STORAGE', 'Cold aggregation warehouse at 88% capacity utilization. Ventilated pallets required.', 'VALIDATED', -1.4980, 29.6340)
    ON CONFLICT DO NOTHING;
  `, [rukomoUserId, rukomoId]);

  // Seed Security Audit Logs
  await client.query(`
    CREATE TABLE IF NOT EXISTS agrilens.audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_email VARCHAR(255),
      actor_role VARCHAR(100),
      action VARCHAR(100),
      resource VARCHAR(100),
      details JSONB,
      ip_address VARCHAR(50) DEFAULT '127.0.0.1',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE agrilens.audit_logs ADD COLUMN IF NOT EXISTS actor_email VARCHAR(255);
    ALTER TABLE agrilens.audit_logs ADD COLUMN IF NOT EXISTS actor_role VARCHAR(100);
    ALTER TABLE agrilens.audit_logs ADD COLUMN IF NOT EXISTS action VARCHAR(100);
    ALTER TABLE agrilens.audit_logs ADD COLUMN IF NOT EXISTS resource VARCHAR(100);
    ALTER TABLE agrilens.audit_logs ADD COLUMN IF NOT EXISTS details JSONB;
    ALTER TABLE agrilens.audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50) DEFAULT '127.0.0.1';
    ALTER TABLE agrilens.audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
  `);

  await client.query(`
    INSERT INTO agrilens.audit_logs (actor_email, actor_role, action, resource, details)
    VALUES 
      ('admin@agrilens.gov.rw', 'PLATFORM_ADMIN', 'SECURITY_POLICY_UPDATE', 'RBAC_MATRIX', '{"version": "4.2", "updated_capabilities": 13}'),
      ('datamanager@nisr.gov.rw', 'DATA_MANAGER', 'DATASET_VALIDATE', 'SAS_2026A_SEASON', '{"passed_rows": 1140, "warning_count": 0}'),
      ('datamanager@nisr.gov.rw', 'DATA_MANAGER', 'APPROVE_PUBLICATION', 'SAS_2026A_SEASON', '{"signed_by": "Claudine Uwera", "status": "PUBLISHED"}'),
      ('planner@minagri.gov.rw', 'NATIONAL_PLANNER', 'EXPORT_REPORT', 'NATIONAL_IRRIGATION_DOSSIER', '{"format": "PDF", "scope": "RWANDA_WIDE"}'),
      ('district.nyagatare@minagri.gov.rw', 'DISTRICT_OFFICER', 'VIEW_SCOPED_DASHBOARD', 'NYAGATARE_DASHBOARD', '{"district": "Nyagatare", "sectors_loaded": 14}'),
      ('sector.rukomo@minagri.gov.rw', 'SECTOR_OFFICER', 'SUBMIT_OBSERVATION', 'FIELD_VERIFICATION', '{"sector": "Rukomo", "crop": "Maize"}')
    ON CONFLICT DO NOTHING;
  `);

  console.log('RBAC Database seeding completed successfully!');
  await client.end();
}

seedRBAC().catch(err => {
  console.error('Error seeding RBAC:', err);
  process.exit(1);
});
