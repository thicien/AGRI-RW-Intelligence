-- ============================================================
-- AGRILENS RWANDA - PROFESSIONAL DATABASE DESIGN v2
-- PostgreSQL + PostGIS
-- ============================================================
-- Recommended PostgreSQL: 15+
-- Tested conceptually for PostgreSQL 18.x
-- SRID: 4326 (WGS 84)
--
-- Architecture:
--   Identity/RBAC -> Geography -> Source Data -> Agriculture /
--   Environment / Energy -> AI/GeoAI -> Priority Zones ->
--   Recommendations/Interventions -> Field Validation -> Audit
--
-- IMPORTANT:
--   1. Create the database first, e.g. agrilens_db.
--   2. Install PostGIS in that database.
--   3. Run this file while connected to agrilens_db.
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS agrilens;
SET search_path TO agrilens, public;

-- ============================================================
-- 01. IDENTITY AND RBAC
-- ============================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL UNIQUE,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone VARCHAR(30),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_user_status CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED'))
);

-- Supports users with more than one role.
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- ============================================================
-- 02. RWANDA ADMINISTRATIVE GEOGRAPHY
-- ============================================================

CREATE TABLE administrative_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES administrative_units(id),
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    unit_type VARCHAR(30) NOT NULL,
    geometry GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_admin_unit_type CHECK (
        unit_type IN ('COUNTRY','PROVINCE','DISTRICT','SECTOR','CELL','VILLAGE')
    )
);

CREATE TABLE user_locations (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, admin_unit_id)
);

-- ============================================================
-- 03. DATA GOVERNANCE / PROVENANCE
-- ============================================================

CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    provider VARCHAR(200),
    source_type VARCHAR(100) NOT NULL,
    url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES data_sources(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    dataset_type VARCHAR(100) NOT NULL,
    spatial BOOLEAN NOT NULL DEFAULT FALSE,
    temporal BOOLEAN NOT NULL DEFAULT FALSE,
    collection_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dataset_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES datasets(id),
    version VARCHAR(50) NOT NULL,
    file_path TEXT,
    storage_uri TEXT,
    checksum VARCHAR(255),
    imported_by UUID REFERENCES users(id),
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB,
    UNIQUE (dataset_id, version)
);

-- ============================================================
-- 04. AGRICULTURAL REFERENCE DATA
-- ============================================================

CREATE TABLE crops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    scientific_name VARCHAR(150),
    category VARCHAR(100),
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    start_date DATE,
    end_date DATE,
    UNIQUE (name, year)
);

-- ============================================================
-- 05. FARMERS AND FARMS
-- ============================================================

CREATE TABLE farmers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_unit_id UUID REFERENCES administrative_units(id),
    farmer_code VARCHAR(80) UNIQUE,
    full_name VARCHAR(200) NOT NULL,
    sex VARCHAR(20),
    phone VARCHAR(30),
    organization_name VARCHAR(200),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_farmer_sex CHECK (sex IS NULL OR sex IN ('MALE','FEMALE','OTHER','UNKNOWN')),
    CONSTRAINT chk_farmer_status CHECK (status IN ('ACTIVE','INACTIVE'))
);

CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES farmers(id) ON DELETE SET NULL,
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id),
    farm_code VARCHAR(80) UNIQUE,
    name VARCHAR(200),
    area_ha NUMERIC(14,4),
    location GEOMETRY(Point, 4326),
    boundary GEOMETRY(MultiPolygon, 4326),
    irrigation_available BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_farm_area CHECK (area_ha IS NULL OR area_ha >= 0)
);

CREATE TABLE farm_crops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    crop_id UUID NOT NULL REFERENCES crops(id),
    season_id UUID NOT NULL REFERENCES seasons(id),
    area_ha NUMERIC(14,4),
    yield_t_ha NUMERIC(14,4),
    production_tonnes NUMERIC(14,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (farm_id, crop_id, season_id),
    CONSTRAINT chk_farm_crop_values CHECK (
        (area_ha IS NULL OR area_ha >= 0) AND
        (yield_t_ha IS NULL OR yield_t_ha >= 0) AND
        (production_tonnes IS NULL OR production_tonnes >= 0)
    )
);

-- ============================================================
-- 06. AGRICULTURAL STATISTICS AND PRACTICES
-- ============================================================

CREATE TABLE crop_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id),
    crop_id UUID NOT NULL REFERENCES crops(id),
    season_id UUID NOT NULL REFERENCES seasons(id),
    dataset_version_id UUID REFERENCES dataset_versions(id),
    area_ha NUMERIC(14,2),
    production_tonnes NUMERIC(14,2),
    yield_t_ha NUMERIC(14,4),
    irrigated_area_ha NUMERIC(14,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (area_ha IS NULL OR area_ha >= 0) AND
        (production_tonnes IS NULL OR production_tonnes >= 0) AND
        (yield_t_ha IS NULL OR yield_t_ha >= 0) AND
        (irrigated_area_ha IS NULL OR irrigated_area_ha >= 0)
    )
);

CREATE TABLE farm_practices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id),
    crop_id UUID REFERENCES crops(id),
    season_id UUID REFERENCES seasons(id),
    dataset_version_id UUID REFERENCES dataset_versions(id),
    practice_type VARCHAR(150) NOT NULL,
    adoption_rate NUMERIC(6,3),
    description TEXT,
    CHECK (adoption_rate IS NULL OR adoption_rate BETWEEN 0 AND 1)
);

CREATE TABLE agricultural_inputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id),
    crop_id UUID REFERENCES crops(id),
    season_id UUID REFERENCES seasons(id),
    dataset_version_id UUID REFERENCES dataset_versions(id),
    input_type VARCHAR(150) NOT NULL,
    usage_value NUMERIC(14,4),
    unit VARCHAR(50),
    description TEXT
);

-- ============================================================
-- 07. SOIL, CLIMATE, SATELLITE
-- ============================================================

CREATE TABLE soil_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id),
    dataset_version_id UUID REFERENCES dataset_versions(id),
    soil_type VARCHAR(100),
    ph NUMERIC(5,2),
    organic_carbon NUMERIC(10,4),
    nitrogen NUMERIC(10,4),
    phosphorus NUMERIC(10,4),
    potassium NUMERIC(10,4),
    moisture NUMERIC(10,4),
    geometry GEOMETRY(MultiPolygon, 4326),
    observed_at DATE
);

CREATE TABLE climate_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id),
    dataset_version_id UUID REFERENCES dataset_versions(id),
    observation_date DATE NOT NULL,
    rainfall_mm NUMERIC(10,2),
    temperature_c NUMERIC(6,2),
    drought_index NUMERIC(8,4),
    moisture_index NUMERIC(8,4),
    geometry GEOMETRY(Point, 4326)
);

CREATE TABLE satellite_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id),
    dataset_version_id UUID REFERENCES dataset_versions(id),
    observation_date DATE NOT NULL,
    ndvi NUMERIC(8,5),
    ndwi NUMERIC(8,5),
    evi NUMERIC(8,5),
    vegetation_health NUMERIC(8,5),
    geometry GEOMETRY(MultiPolygon, 4326)
);

-- ============================================================
-- 08. INFRASTRUCTURE AND PRODUCTIVE ENERGY MAPPING
-- ============================================================

CREATE TABLE infrastructure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id),
    dataset_version_id UUID REFERENCES dataset_versions(id),
    infrastructure_type VARCHAR(100) NOT NULL,
    name VARCHAR(200),
    status VARCHAR(50),
    location GEOMETRY(Point, 4326) NOT NULL,
    attributes JSONB
);

CREATE TABLE irrigation_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id),
    dataset_version_id UUID REFERENCES dataset_versions(id),
    irrigation_type VARCHAR(100),
    estimated_capacity NUMERIC(14,2),
    status VARCHAR(50),
    location GEOMETRY(Point, 4326) NOT NULL,
    attributes JSONB
);

CREATE TABLE productive_use_sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id),
    dataset_version_id UUID REFERENCES dataset_versions(id),
    site_type VARCHAR(100) NOT NULL,
    name VARCHAR(200),
    status VARCHAR(50),
    estimated_energy_demand_kwh_day NUMERIC(14,4),
    economic_activity VARCHAR(150),
    location GEOMETRY(Point, 4326) NOT NULL,
    attributes JSONB
);

CREATE TABLE energy_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id),
    dataset_version_id UUID REFERENCES dataset_versions(id),
    asset_type VARCHAR(100) NOT NULL,
    capacity_kw NUMERIC(14,4),
    status VARCHAR(50),
    location GEOMETRY(Point, 4326) NOT NULL,
    attributes JSONB
);

CREATE TABLE energy_opportunity_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id),
    opportunity_type VARCHAR(150) NOT NULL,
    demand_score NUMERIC(6,4),
    supply_score NUMERIC(6,4),
    opportunity_score NUMERIC(6,4),
    explanation TEXT,
    geometry GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (demand_score IS NULL OR demand_score BETWEEN 0 AND 1),
    CHECK (supply_score IS NULL OR supply_score BETWEEN 0 AND 1),
    CHECK (opportunity_score IS NULL OR opportunity_score BETWEEN 0 AND 1)
);

-- ============================================================
-- 09. AI / GEOAI MODELS AND PREDICTIONS
-- ============================================================

CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    version VARCHAR(100),
    model_type VARCHAR(100),
    description TEXT,
    artifact_uri TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE model_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES ai_models(id),
    started_by UUID REFERENCES users(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    parameters JSONB,
    metrics JSONB,
    CHECK (status IN ('PENDING','RUNNING','COMPLETED','FAILED'))
);

CREATE TABLE model_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_run_id UUID NOT NULL REFERENCES model_runs(id) ON DELETE CASCADE,
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id),
    crop_id UUID REFERENCES crops(id),
    prediction_type VARCHAR(150) NOT NULL,
    predicted_value NUMERIC(14,4),
    confidence_score NUMERIC(5,4),
    prediction_geometry GEOMETRY(Geometry, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (confidence_score IS NULL OR confidence_score BETWEEN 0 AND 1)
);

CREATE TABLE evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID NOT NULL REFERENCES model_predictions(id) ON DELETE CASCADE,
    dataset_version_id UUID REFERENCES dataset_versions(id),
    evidence_type VARCHAR(100) NOT NULL,
    description TEXT,
    contribution_score NUMERIC(8,4)
);

-- ============================================================
-- 10. DECISION SUPPORT / PRIORITY ZONES
-- ============================================================

CREATE TABLE priority_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id),
    prediction_id UUID REFERENCES model_predictions(id),
    energy_opportunity_zone_id UUID REFERENCES energy_opportunity_zones(id),
    problem_type VARCHAR(150) NOT NULL,
    priority_score NUMERIC(8,4),
    priority_level VARCHAR(30),
    explanation TEXT,
    recommended_action TEXT,
    geometry GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (priority_score IS NULL OR priority_score BETWEEN 0 AND 1),
    CHECK (priority_level IS NULL OR priority_level IN ('LOW','MEDIUM','HIGH','CRITICAL'))
);

CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    priority_zone_id UUID NOT NULL REFERENCES priority_zones(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    recommendation_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    expected_outcome TEXT,
    confidence_score NUMERIC(5,4),
    status VARCHAR(50) NOT NULL DEFAULT 'PROPOSED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (confidence_score IS NULL OR confidence_score BETWEEN 0 AND 1),
    CHECK (status IN ('PROPOSED','ACCEPTED','REJECTED','IMPLEMENTED'))
);

CREATE TABLE interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    priority_zone_id UUID NOT NULL REFERENCES priority_zones(id),
    recommendation_id UUID REFERENCES recommendations(id),
    created_by UUID NOT NULL REFERENCES users(id),
    intervention_type VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PROPOSED',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (status IN ('PROPOSED','PLANNED','IN_PROGRESS','COMPLETED','CANCELLED'))
);

-- ============================================================
-- 11. FIELD VALIDATION / FEEDBACK LOOP
-- ============================================================

CREATE TABLE field_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id),
    priority_zone_id UUID REFERENCES priority_zones(id),
    observation_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(30),
    location GEOMETRY(Point, 4326),
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (severity IS NULL OR severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    CHECK (verification_status IN ('PENDING','CONFIRMED','REJECTED','NEEDS_REVIEW'))
);

CREATE TABLE intervention_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intervention_id UUID NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES users(id),
    outcome VARCHAR(100),
    description TEXT,
    success_score NUMERIC(5,4),
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (success_score IS NULL OR success_score BETWEEN 0 AND 1)
);

-- ============================================================
-- 12. AUDIT / ACCOUNTABILITY
-- ============================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 13. SPATIAL / PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX idx_admin_parent ON administrative_units(parent_id);
CREATE INDEX idx_admin_type ON administrative_units(unit_type);
CREATE INDEX idx_admin_geom ON administrative_units USING GIST(geometry);

CREATE INDEX idx_user_locations_admin ON user_locations(admin_unit_id);
CREATE INDEX idx_farmers_admin ON farmers(admin_unit_id);
CREATE INDEX idx_farms_admin ON farms(admin_unit_id);
CREATE INDEX idx_farms_farmer ON farms(farmer_id);
CREATE INDEX idx_farms_location ON farms USING GIST(location);
CREATE INDEX idx_farms_boundary ON farms USING GIST(boundary);
CREATE INDEX idx_farm_crops_farm ON farm_crops(farm_id);
CREATE INDEX idx_crop_stats_admin ON crop_statistics(admin_unit_id);
CREATE INDEX idx_crop_stats_crop_season ON crop_statistics(crop_id, season_id);

CREATE INDEX idx_soil_admin ON soil_conditions(admin_unit_id);
CREATE INDEX idx_soil_geom ON soil_conditions USING GIST(geometry);
CREATE INDEX idx_climate_admin_date ON climate_indicators(admin_unit_id, observation_date);
CREATE INDEX idx_climate_geom ON climate_indicators USING GIST(geometry);
CREATE INDEX idx_satellite_admin_date ON satellite_indicators(admin_unit_id, observation_date);
CREATE INDEX idx_satellite_geom ON satellite_indicators USING GIST(geometry);

CREATE INDEX idx_infra_admin ON infrastructure(admin_unit_id);
CREATE INDEX idx_infra_geom ON infrastructure USING GIST(location);
CREATE INDEX idx_irrigation_admin ON irrigation_assets(admin_unit_id);
CREATE INDEX idx_irrigation_geom ON irrigation_assets USING GIST(location);
CREATE INDEX idx_pus_admin ON productive_use_sites(admin_unit_id);
CREATE INDEX idx_pus_geom ON productive_use_sites USING GIST(location);
CREATE INDEX idx_energy_assets_admin ON energy_assets(admin_unit_id);
CREATE INDEX idx_energy_assets_geom ON energy_assets USING GIST(location);
CREATE INDEX idx_energy_zones_admin ON energy_opportunity_zones(admin_unit_id);
CREATE INDEX idx_energy_zones_geom ON energy_opportunity_zones USING GIST(geometry);

CREATE INDEX idx_predictions_admin ON model_predictions(admin_unit_id);
CREATE INDEX idx_predictions_geom ON model_predictions USING GIST(prediction_geometry);
CREATE INDEX idx_priority_admin ON priority_zones(admin_unit_id);
CREATE INDEX idx_priority_geom ON priority_zones USING GIST(geometry);
CREATE INDEX idx_field_obs_admin ON field_observations(admin_unit_id);
CREATE INDEX idx_field_obs_geom ON field_observations USING GIST(location);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================================
-- 14. SEED ROLES
-- ============================================================

INSERT INTO roles (name, description) VALUES
('SYSTEM_ADMIN','Full system administrator'),
('DATA_MANAGER','Manages datasets, imports and data quality'),
('NATIONAL_PLANNER','National agricultural planning and policy user'),
('DISTRICT_OFFICER','District agricultural officer'),
('SECTOR_OFFICER','Sector agricultural officer'),
('RESEARCHER','Agricultural/GIS/data researcher'),
('DEVELOPMENT_PARTNER','Approved development partner or NGO'),
('VIEWER','Read-only viewer')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 15. SEED PERMISSIONS
-- ============================================================

INSERT INTO permissions (name,resource,action,description) VALUES
('VIEW_DASHBOARD','dashboard','read','View dashboards'),
('VIEW_MAP','map','read','View GIS maps'),
('VIEW_AGRICULTURE','agriculture','read','View agricultural intelligence'),
('VIEW_SOIL','soil','read','View soil data'),
('VIEW_CLIMATE','climate','read','View climate data'),
('VIEW_SATELLITE','satellite','read','View satellite indicators'),
('VIEW_ENERGY','energy','read','View productive energy intelligence'),
('VIEW_PRIORITY_ZONES','priority_zones','read','View identified priority zones'),
('VIEW_RECOMMENDATIONS','recommendations','read','View recommendations'),
('ANALYZE_DATA','analytics','execute','Run approved analysis'),
('EXPORT_REPORT','reports','export','Export reports'),
('UPLOAD_DATASET','datasets','create','Upload/import datasets'),
('UPDATE_DATASET','datasets','update','Update dataset metadata'),
('VALIDATE_DATASET','datasets','validate','Validate imported data'),
('CREATE_FIELD_OBSERVATION','field_observations','create','Submit field observations'),
('UPDATE_FIELD_OBSERVATION','field_observations','update','Update observations'),
('MANAGE_INTERVENTIONS','interventions','manage','Create/update interventions'),
('MANAGE_USERS','users','manage','Manage users'),
('MANAGE_ROLES','roles','manage','Manage roles and permissions'),
('VIEW_AUDIT_LOGS','audit_logs','read','View audit history')
ON CONFLICT (name) DO NOTHING;

-- Admin gets everything.
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.name='SYSTEM_ADMIN' ON CONFLICT DO NOTHING;

-- Helper seed for operational roles.
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN (
 'VIEW_DASHBOARD','VIEW_MAP','VIEW_AGRICULTURE','VIEW_SOIL','VIEW_CLIMATE',
 'VIEW_SATELLITE','VIEW_ENERGY','VIEW_PRIORITY_ZONES','VIEW_RECOMMENDATIONS',
 'ANALYZE_DATA','EXPORT_REPORT','CREATE_FIELD_OBSERVATION','UPDATE_FIELD_OBSERVATION'
) WHERE r.name='NATIONAL_PLANNER' ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN (
 'VIEW_DASHBOARD','VIEW_MAP','VIEW_AGRICULTURE','VIEW_SOIL','VIEW_CLIMATE',
 'VIEW_SATELLITE','VIEW_ENERGY','VIEW_PRIORITY_ZONES','VIEW_RECOMMENDATIONS',
 'ANALYZE_DATA','EXPORT_REPORT','CREATE_FIELD_OBSERVATION','UPDATE_FIELD_OBSERVATION',
 'MANAGE_INTERVENTIONS'
) WHERE r.name='DISTRICT_OFFICER' ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN (
 'VIEW_DASHBOARD','VIEW_MAP','VIEW_AGRICULTURE','VIEW_SOIL','VIEW_CLIMATE',
 'VIEW_SATELLITE','VIEW_ENERGY','VIEW_PRIORITY_ZONES','VIEW_RECOMMENDATIONS',
 'CREATE_FIELD_OBSERVATION','UPDATE_FIELD_OBSERVATION'
) WHERE r.name='SECTOR_OFFICER' ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN (
 'VIEW_DASHBOARD','VIEW_MAP','VIEW_AGRICULTURE','VIEW_SOIL','VIEW_CLIMATE',
 'VIEW_SATELLITE','VIEW_ENERGY','VIEW_PRIORITY_ZONES','VIEW_RECOMMENDATIONS',
 'ANALYZE_DATA','EXPORT_REPORT'
) WHERE r.name='RESEARCHER' ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN (
 'VIEW_DASHBOARD','VIEW_MAP','VIEW_AGRICULTURE','VIEW_SOIL','VIEW_CLIMATE',
 'VIEW_SATELLITE','VIEW_ENERGY','VIEW_PRIORITY_ZONES','VIEW_RECOMMENDATIONS',
 'EXPORT_REPORT','CREATE_FIELD_OBSERVATION'
) WHERE r.name='DEVELOPMENT_PARTNER' ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN (
 'VIEW_DASHBOARD','VIEW_MAP','VIEW_AGRICULTURE','VIEW_PRIORITY_ZONES'
) WHERE r.name='VIEWER' ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.name IN (
 'VIEW_DASHBOARD','VIEW_MAP','VIEW_AGRICULTURE','VIEW_SOIL','VIEW_CLIMATE',
 'VIEW_SATELLITE','VIEW_ENERGY','VIEW_PRIORITY_ZONES','VIEW_RECOMMENDATIONS',
 'UPLOAD_DATASET','UPDATE_DATASET','VALIDATE_DATASET','VIEW_AUDIT_LOGS','ANALYZE_DATA'
) WHERE r.name='DATA_MANAGER' ON CONFLICT DO NOTHING;

-- ============================================================
-- 16. REFERENCE DATA
-- ============================================================

INSERT INTO crops(name,scientific_name,category) VALUES
('Maize','Zea mays','Cereal'),
('Beans','Phaseolus vulgaris','Legume'),
('Rice','Oryza sativa','Cereal'),
('Cassava','Manihot esculenta','Root crop'),
('Irish Potato','Solanum tuberosum','Root crop'),
('Sweet Potato','Ipomoea batatas','Root crop'),
('Wheat','Triticum aestivum','Cereal'),
('Banana','Musa spp.','Fruit'),
('Coffee','Coffea spp.','Cash crop'),
('Tea','Camellia sinensis','Cash crop')
ON CONFLICT(name) DO NOTHING;

-- ============================================================
-- 17. DASHBOARD VIEWS
-- ============================================================

CREATE OR REPLACE VIEW v_user_roles AS
SELECT u.id AS user_id,u.full_name,u.email,u.status,
       r.name AS role,r.description AS role_description
FROM users u
JOIN user_roles ur ON ur.user_id=u.id
JOIN roles r ON r.id=ur.role_id;

CREATE OR REPLACE VIEW v_crop_productivity AS
SELECT cs.id,au.name AS administrative_unit,au.unit_type,
       c.name AS crop,s.name AS season,s.year,
       cs.area_ha,cs.production_tonnes,cs.yield_t_ha,cs.irrigated_area_ha
FROM crop_statistics cs
JOIN administrative_units au ON au.id=cs.admin_unit_id
JOIN crops c ON c.id=cs.crop_id
JOIN seasons s ON s.id=cs.season_id;

CREATE OR REPLACE VIEW v_priority_zones AS
SELECT pz.id,au.name AS administrative_unit,au.unit_type,
       pz.problem_type,pz.priority_score,pz.priority_level,
       pz.explanation,pz.recommended_action,pz.geometry
FROM priority_zones pz
JOIN administrative_units au ON au.id=pz.admin_unit_id;

CREATE OR REPLACE VIEW v_energy_opportunities AS
SELECT eoz.id,au.name AS administrative_unit,au.unit_type,
       eoz.opportunity_type,eoz.demand_score,eoz.supply_score,
       eoz.opportunity_score,eoz.explanation,eoz.geometry
FROM energy_opportunity_zones eoz
JOIN administrative_units au ON au.id=eoz.admin_unit_id;

COMMIT;

-- ============================================================
-- VERIFICATION COMMANDS
-- ============================================================
-- SELECT PostGIS_Version();
-- SELECT current_database();
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='agrilens';
-- SELECT table_name FROM information_schema.tables WHERE table_schema='agrilens' ORDER BY table_name;
-- SELECT r.name, COUNT(rp.permission_id) AS permission_count
-- FROM agrilens.roles r LEFT JOIN agrilens.role_permissions rp ON rp.role_id=r.id
-- GROUP BY r.name ORDER BY r.name;
-- ============================================================
