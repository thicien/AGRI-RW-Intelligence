-- ============================================================
-- AGRILENS RWANDA DATABASE V3 - ADDITIVE MIGRATION
-- PostgreSQL 18 + PostGIS; designed to preserve existing v2 data.
-- Run against agrilens_db after taking a backup.
-- This migration ADDS structures and columns; it does not drop tables.
-- ============================================================

BEGIN;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SET search_path TO agrilens, public;

-- 1. Season identifiers: retain existing name/year rows, but add a canonical
-- label such as 2025A/2025B/2025C. Do not guess labels for existing rows.
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS season_code VARCHAR(10);
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS official_label VARCHAR(100);
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE seasons ADD CONSTRAINT seasons_season_code_format_chk
    CHECK (season_code IS NULL OR season_code ~ '^[0-9]{4}[ABC]$');
CREATE UNIQUE INDEX IF NOT EXISTS uq_seasons_season_code
    ON seasons(season_code) WHERE season_code IS NOT NULL;

-- 2. Standard product catalog. A product may be a raw crop or a processed
-- agricultural product; crop_id is nullable for products not represented in crops.
CREATE TABLE IF NOT EXISTS agricultural_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
    product_code VARCHAR(80) UNIQUE,
    name VARCHAR(200) NOT NULL UNIQUE,
    product_category VARCHAR(40) NOT NULL DEFAULT 'RAW_CROP',
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_agri_product_category CHECK
      (product_category IN ('RAW_CROP','PROCESSED_CROP','HORTICULTURE','LIVESTOCK','DAIRY','OTHER'))
);

-- Seed crop-linked products safely; names are canonical and can be extended.
INSERT INTO agricultural_products (crop_id, product_code, name, product_category)
SELECT c.id, 'CROP-' || upper(regexp_replace(c.name, '[^A-Za-z0-9]+', '-', 'g')), c.name, 'RAW_CROP'
FROM crops c
ON CONFLICT (name) DO NOTHING;

-- 3. Irrigation: enrich the existing physical-asset table and add season-level
-- performance observations. Keep asset facts separate from seasonal totals.
ALTER TABLE irrigation_assets ADD COLUMN IF NOT EXISTS name VARCHAR(200);
ALTER TABLE irrigation_assets ADD COLUMN IF NOT EXISTS water_source VARCHAR(100);
ALTER TABLE irrigation_assets ADD COLUMN IF NOT EXISTS irrigation_method VARCHAR(100);
ALTER TABLE irrigation_assets ADD COLUMN IF NOT EXISTS area_command_ha NUMERIC(14,3);
ALTER TABLE irrigation_assets ADD COLUMN IF NOT EXISTS area_irrigable_ha NUMERIC(14,3);
ALTER TABLE irrigation_assets ADD COLUMN IF NOT EXISTS beneficiaries_count INTEGER;
ALTER TABLE irrigation_assets ADD COLUMN IF NOT EXISTS commissioned_date DATE;
ALTER TABLE irrigation_assets ADD COLUMN IF NOT EXISTS last_verified_at DATE;
ALTER TABLE irrigation_assets ADD COLUMN IF NOT EXISTS operator_name VARCHAR(200);
ALTER TABLE irrigation_assets ADD CONSTRAINT chk_irrigation_areas_nonnegative CHECK (
  (area_command_ha IS NULL OR area_command_ha >= 0) AND
  (area_irrigable_ha IS NULL OR area_irrigable_ha >= 0) AND
  (beneficiaries_count IS NULL OR beneficiaries_count >= 0)
);

CREATE TABLE IF NOT EXISTS irrigation_season_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    irrigation_asset_id UUID REFERENCES irrigation_assets(id) ON DELETE CASCADE,
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id),
    crop_id UUID REFERENCES crops(id),
    season_id UUID NOT NULL REFERENCES seasons(id),
    dataset_version_id UUID REFERENCES dataset_versions(id),
    area_irrigated_ha NUMERIC(14,3),
    water_used_m3 NUMERIC(16,3),
    production_tonnes NUMERIC(14,3),
    operational_status VARCHAR(30),
    beneficiaries_count INTEGER,
    observation_date DATE,
    source_reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_irrigation_stats_nonnegative CHECK (
      (area_irrigated_ha IS NULL OR area_irrigated_ha >= 0) AND
      (water_used_m3 IS NULL OR water_used_m3 >= 0) AND
      (production_tonnes IS NULL OR production_tonnes >= 0) AND
      (beneficiaries_count IS NULL OR beneficiaries_count >= 0)
    ),
    CONSTRAINT chk_irrigation_operational_status CHECK (
      operational_status IS NULL OR operational_status IN ('OPERATIONAL','PARTIAL','NON_OPERATIONAL','PLANNED','UNKNOWN')
    )
);

-- 4. Soil measurements: use a parameter catalog so units and methods are explicit.
-- Existing soil_conditions remains available for backward compatibility.
CREATE TABLE IF NOT EXISTS soil_indicator_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    default_unit VARCHAR(50),
    description TEXT,
    value_type VARCHAR(20) NOT NULL DEFAULT 'NUMERIC',
    CONSTRAINT chk_soil_indicator_value_type CHECK (value_type IN ('NUMERIC','TEXT','BOOLEAN'))
);

INSERT INTO soil_indicator_types (code, name, default_unit, description) VALUES
 ('SOIL_PH','Soil pH','pH','Soil acidity/alkalinity; measurement method and depth should be recorded.'),
 ('ORGANIC_CARBON','Soil organic carbon','%','Use the source-reported unit; do not assume a percentage if source uses another unit.'),
 ('TOTAL_NITROGEN','Soil nitrogen','% or mg/kg','Record the actual unit reported by the source.'),
 ('AVAILABLE_PHOSPHORUS','Available phosphorus','mg/kg','Record the extraction/measurement method when available.'),
 ('EXCHANGEABLE_POTASSIUM','Exchangeable potassium','cmol/kg or mg/kg','Record the actual unit reported by the source.'),
 ('SOIL_MOISTURE','Soil moisture','%','Specify whether gravimetric or volumetric if known.'),
 ('SOIL_DEPTH','Soil sampling depth','cm','Depth represented by the sample.')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS soil_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id),
    indicator_type_id UUID NOT NULL REFERENCES soil_indicator_types(id),
    season_id UUID REFERENCES seasons(id),
    dataset_version_id UUID REFERENCES dataset_versions(id),
    observed_at DATE,
    value_numeric NUMERIC(18,6),
    value_text TEXT,
    unit VARCHAR(50),
    soil_type VARCHAR(100),
    sampling_depth_cm NUMERIC(8,2),
    measurement_method VARCHAR(200),
    geometry GEOMETRY(Geometry, 4326),
    source_page INTEGER,
    source_sheet VARCHAR(200),
    source_row INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_soil_observation_value CHECK (value_numeric IS NOT NULL OR value_text IS NOT NULL),
    CONSTRAINT chk_soil_sampling_depth CHECK (sampling_depth_cm IS NULL OR sampling_depth_cm >= 0)
);

-- 5. Standardized practices: conservation and fertility observations can be
-- reported by district/sector, crop and season without inventing farmer records.
CREATE TABLE IF NOT EXISTS agricultural_practices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(180) NOT NULL,
    domain VARCHAR(40) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_agri_practice_domain CHECK
      (domain IN ('SOIL_CONSERVATION','SOIL_FERTILITY','IRRIGATION','GENERAL_AGRONOMY'))
);

INSERT INTO agricultural_practices (code, name, domain, description) VALUES
 ('TERRACING','Terracing','SOIL_CONSERVATION','Terraces or bench terraces, as defined by the source.'),
 ('CONTOUR_HEDGEROWS','Contour hedgerows','SOIL_CONSERVATION','Hedgerows or contour barriers used to reduce erosion.'),
 ('MULCHING','Mulching','SOIL_CONSERVATION','Soil cover using crop residues or other materials.'),
 ('AGROFORESTRY','Agroforestry','SOIL_CONSERVATION','Trees integrated into agricultural land.'),
 ('EROSION_CONTROL_OTHER','Other erosion-control practice','SOIL_CONSERVATION','Use source-specific description to identify the practice.'),
 ('ORGANIC_MANURE','Organic manure application','SOIL_FERTILITY','Organic manure use; record application rate/unit if available.'),
 ('COMPOSTING','Compost application','SOIL_FERTILITY','Compost use to improve soil fertility.'),
 ('MINERAL_FERTILIZER','Mineral fertilizer application','SOIL_FERTILITY','Record fertilizer product and quantity/unit where available.'),
 ('LIMING','Agricultural lime application','SOIL_FERTILITY','Record rate and soil context if available.'),
 ('CROP_ROTATION','Crop rotation','SOIL_FERTILITY','Rotation practice reported by the source.'),
 ('COVER_CROPS','Cover crops','SOIL_CONSERVATION','Cover crops used for soil protection and/or fertility.')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS practice_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID NOT NULL REFERENCES agricultural_practices(id),
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id),
    season_id UUID REFERENCES seasons(id),
    crop_id UUID REFERENCES crops(id),
    dataset_version_id UUID REFERENCES dataset_versions(id),
    adoption_rate NUMERIC(7,5),
    area_ha NUMERIC(14,3),
    households_count INTEGER,
    numerator_count NUMERIC(16,3),
    denominator_count NUMERIC(16,3),
    application_rate NUMERIC(16,5),
    application_unit VARCHAR(50),
    observed_at DATE,
    source_page INTEGER,
    source_sheet VARCHAR(200),
    source_row INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_practice_adoption_rate CHECK (adoption_rate IS NULL OR adoption_rate BETWEEN 0 AND 1),
    CONSTRAINT chk_practice_observation_nonnegative CHECK (
      (area_ha IS NULL OR area_ha >= 0) AND
      (households_count IS NULL OR households_count >= 0) AND
      (numerator_count IS NULL OR numerator_count >= 0) AND
      (denominator_count IS NULL OR denominator_count >= 0) AND
      (application_rate IS NULL OR application_rate >= 0)
    )
);

-- 6. Collection, storage and processing facilities in one shared facility registry.
-- Capacity facts live on the facility; actual seasonal throughput lives in a
-- separate table. This prevents treating capacity as actual production.
CREATE TABLE IF NOT EXISTS agri_facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_unit_id UUID NOT NULL REFERENCES administrative_units(id),
    infrastructure_id UUID REFERENCES infrastructure(id) ON DELETE SET NULL,
    dataset_version_id UUID REFERENCES dataset_versions(id),
    facility_code VARCHAR(100) UNIQUE,
    name VARCHAR(220) NOT NULL,
    facility_type VARCHAR(40) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'UNKNOWN',
    owner_type VARCHAR(40),
    operator_name VARCHAR(200),
    storage_capacity_tonnes NUMERIC(16,3),
    processing_capacity_tonnes_day NUMERIC(16,3),
    drying_capacity_tonnes_day NUMERIC(16,3),
    cold_storage_capacity_tonnes NUMERIC(16,3),
    year_established INTEGER,
    location GEOMETRY(Point, 4326),
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_verified_at DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_agri_facility_type CHECK (facility_type IN
      ('COLLECTION_CENTER','AGGREGATION_CENTER','WAREHOUSE','SILO','GRAIN_DRYER','DRYING_GROUND','COLD_STORAGE','PROCESSING_PLANT','PACKING_FACILITY','OTHER')),
    CONSTRAINT chk_agri_facility_status CHECK (status IN ('OPERATIONAL','PARTIAL','NON_OPERATIONAL','PLANNED','CLOSED','UNKNOWN')),
    CONSTRAINT chk_agri_facility_capacity CHECK (
      (storage_capacity_tonnes IS NULL OR storage_capacity_tonnes >= 0) AND
      (processing_capacity_tonnes_day IS NULL OR processing_capacity_tonnes_day >= 0) AND
      (drying_capacity_tonnes_day IS NULL OR drying_capacity_tonnes_day >= 0) AND
      (cold_storage_capacity_tonnes IS NULL OR cold_storage_capacity_tonnes >= 0)
    ),
    CONSTRAINT chk_agri_facility_year CHECK (year_established IS NULL OR year_established BETWEEN 1800 AND 2200)
);

CREATE TABLE IF NOT EXISTS facility_products (
    facility_id UUID NOT NULL REFERENCES agri_facilities(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES agricultural_products(id),
    PRIMARY KEY (facility_id, product_id)
);

CREATE TABLE IF NOT EXISTS facility_seasonal_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES agri_facilities(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES seasons(id),
    product_id UUID REFERENCES agricultural_products(id),
    dataset_version_id UUID REFERENCES dataset_versions(id),
    quantity_received_tonnes NUMERIC(16,3),
    quantity_stored_tonnes NUMERIC(16,3),
    quantity_processed_tonnes NUMERIC(16,3),
    quantity_dispatched_tonnes NUMERIC(16,3),
    quantity_lost_tonnes NUMERIC(16,3),
    operating_days INTEGER,
    source_page INTEGER,
    source_sheet VARCHAR(200),
    source_row INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_facility_stats_nonnegative CHECK (
      (quantity_received_tonnes IS NULL OR quantity_received_tonnes >= 0) AND
      (quantity_stored_tonnes IS NULL OR quantity_stored_tonnes >= 0) AND
      (quantity_processed_tonnes IS NULL OR quantity_processed_tonnes >= 0) AND
      (quantity_dispatched_tonnes IS NULL OR quantity_dispatched_tonnes >= 0) AND
      (quantity_lost_tonnes IS NULL OR quantity_lost_tonnes >= 0) AND
      (operating_days IS NULL OR operating_days >= 0)
    )
);

-- 7. Export and market intelligence. Store observed trade facts separately from
-- calculated opportunity assessments. Never infer export demand from production alone.
CREATE TABLE IF NOT EXISTS export_destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_name VARCHAR(150) NOT NULL UNIQUE,
    iso2 CHAR(2),
    iso3 CHAR(3),
    region VARCHAR(150),
    active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_export_destinations_iso3
  ON export_destinations(iso3) WHERE iso3 IS NOT NULL;

CREATE TABLE IF NOT EXISTS export_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES agricultural_products(id),
    destination_id UUID REFERENCES export_destinations(id),
    season_id UUID REFERENCES seasons(id),
    dataset_version_id UUID REFERENCES dataset_versions(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    export_quantity_tonnes NUMERIC(18,4),
    export_value_usd NUMERIC(20,2),
    unit_value_usd_per_tonne NUMERIC(18,4),
    hs_code VARCHAR(30),
    source_page INTEGER,
    source_sheet VARCHAR(200),
    source_row INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_export_period CHECK (period_end >= period_start),
    CONSTRAINT chk_export_values_nonnegative CHECK (
      (export_quantity_tonnes IS NULL OR export_quantity_tonnes >= 0) AND
      (export_value_usd IS NULL OR export_value_usd >= 0) AND
      (unit_value_usd_per_tonne IS NULL OR unit_value_usd_per_tonne >= 0)
    )
);

CREATE TABLE IF NOT EXISTS market_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES agricultural_products(id),
    destination_id UUID REFERENCES export_destinations(id),
    dataset_version_id UUID REFERENCES dataset_versions(id),
    indicator_code VARCHAR(100) NOT NULL,
    indicator_name VARCHAR(200) NOT NULL,
    value_numeric NUMERIC(20,6),
    unit VARCHAR(80),
    period_start DATE,
    period_end DATE,
    observed_at DATE,
    source_page INTEGER,
    source_sheet VARCHAR(200),
    source_row INTEGER,
    notes TEXT,
    CONSTRAINT chk_market_indicator_period CHECK
      (period_start IS NULL OR period_end IS NULL OR period_end >= period_start)
);

CREATE TABLE IF NOT EXISTS export_opportunity_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES agricultural_products(id),
    destination_id UUID REFERENCES export_destinations(id),
    admin_unit_id UUID REFERENCES administrative_units(id),
    season_id UUID REFERENCES seasons(id),
    model_run_id UUID REFERENCES model_runs(id),
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    opportunity_score NUMERIC(7,5),
    opportunity_level VARCHAR(20),
    production_availability_score NUMERIC(7,5),
    market_demand_score NUMERIC(7,5),
    logistics_score NUMERIC(7,5),
    standards_readiness_score NUMERIC(7,5),
    risk_score NUMERIC(7,5),
    explanation TEXT NOT NULL,
    limitations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_export_opportunity_scores CHECK (
      (opportunity_score IS NULL OR opportunity_score BETWEEN 0 AND 1) AND
      (production_availability_score IS NULL OR production_availability_score BETWEEN 0 AND 1) AND
      (market_demand_score IS NULL OR market_demand_score BETWEEN 0 AND 1) AND
      (logistics_score IS NULL OR logistics_score BETWEEN 0 AND 1) AND
      (standards_readiness_score IS NULL OR standards_readiness_score BETWEEN 0 AND 1) AND
      (risk_score IS NULL OR risk_score BETWEEN 0 AND 1)
    ),
    CONSTRAINT chk_export_opportunity_level CHECK
      (opportunity_level IS NULL OR opportunity_level IN ('LOW','MEDIUM','HIGH','VERY_HIGH','INSUFFICIENT_DATA'))
);

CREATE TABLE IF NOT EXISTS export_opportunity_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES export_opportunity_assessments(id) ON DELETE CASCADE,
    dataset_version_id UUID REFERENCES dataset_versions(id),
    export_statistic_id UUID REFERENCES export_statistics(id) ON DELETE SET NULL,
    market_indicator_id UUID REFERENCES market_indicators(id) ON DELETE SET NULL,
    evidence_type VARCHAR(100) NOT NULL,
    evidence_summary TEXT NOT NULL,
    contribution_direction VARCHAR(20),
    source_page INTEGER,
    source_sheet VARCHAR(200),
    source_row INTEGER,
    CONSTRAINT chk_export_evidence_direction CHECK
      (contribution_direction IS NULL OR contribution_direction IN ('SUPPORTS','CONTRADICTS','CONTEXT_ONLY','UNKNOWN'))
);

-- 8. Import-job audit/staging. raw_record stores source values as JSON; the
-- final domain tables remain strongly typed and validated.
CREATE TABLE IF NOT EXISTS data_import_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_version_id UUID REFERENCES dataset_versions(id),
    uploaded_by UUID REFERENCES users(id),
    original_filename VARCHAR(500) NOT NULL,
    file_sha256 CHAR(64),
    file_format VARCHAR(20) NOT NULL,
    target_domain VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'UPLOADED',
    total_rows INTEGER NOT NULL DEFAULT 0,
    valid_rows INTEGER NOT NULL DEFAULT 0,
    invalid_rows INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_summary TEXT,
    mapping_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_import_file_format CHECK (file_format IN ('XLSX','XLS','CSV','PDF','DOCX','OTHER')),
    CONSTRAINT chk_import_domain CHECK (target_domain IN ('PRODUCTIVITY','IRRIGATION','SOIL','PRACTICES','POST_HARVEST','PROCESSING','EXPORTS','MIXED','OTHER')),
    CONSTRAINT chk_import_status CHECK (status IN ('UPLOADED','EXTRACTING','EXTRACTED','VALIDATING','READY_FOR_REVIEW','APPROVED','REJECTED','COMMITTED','FAILED')),
    CONSTRAINT chk_import_counts CHECK (total_rows >= 0 AND valid_rows >= 0 AND invalid_rows >= 0)
);

CREATE TABLE IF NOT EXISTS data_import_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_job_id UUID NOT NULL REFERENCES data_import_jobs(id) ON DELETE CASCADE,
    source_location VARCHAR(300), -- e.g. sheet:Production,row:17 or page:4,table:2,row:8
    raw_record JSONB NOT NULL,
    normalized_record JSONB,
    validation_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
    committed_table VARCHAR(100),
    committed_record_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_import_row_validation CHECK (validation_status IN ('PENDING','VALID','INVALID','COMMITTED','SKIPPED'))
);

-- 9. Indexes for common filters, joins and map rendering.
CREATE INDEX IF NOT EXISTS idx_irrigation_stats_admin_season
  ON irrigation_season_statistics(admin_unit_id, season_id);
CREATE INDEX IF NOT EXISTS idx_irrigation_stats_crop_season
  ON irrigation_season_statistics(crop_id, season_id);
CREATE INDEX IF NOT EXISTS idx_soil_obs_admin_date
  ON soil_observations(admin_unit_id, observed_at);
CREATE INDEX IF NOT EXISTS idx_soil_obs_type_season
  ON soil_observations(indicator_type_id, season_id);
CREATE INDEX IF NOT EXISTS idx_soil_obs_geom
  ON soil_observations USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_practice_obs_admin_season
  ON practice_observations(admin_unit_id, season_id);
CREATE INDEX IF NOT EXISTS idx_practice_obs_practice_season
  ON practice_observations(practice_id, season_id);
CREATE INDEX IF NOT EXISTS idx_agri_facilities_admin_type
  ON agri_facilities(admin_unit_id, facility_type);
CREATE INDEX IF NOT EXISTS idx_agri_facilities_location
  ON agri_facilities USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_facility_stats_season_product
  ON facility_seasonal_statistics(season_id, product_id);
CREATE INDEX IF NOT EXISTS idx_export_stats_product_period
  ON export_statistics(product_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_export_stats_destination_period
  ON export_statistics(destination_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_market_indicators_product_code_date
  ON market_indicators(product_id, indicator_code, observed_at);
CREATE INDEX IF NOT EXISTS idx_export_assessments_product_date
  ON export_opportunity_assessments(product_id, assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status_created
  ON data_import_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_rows_job_status
  ON data_import_rows(import_job_id, validation_status);

-- 10. Helpful view for facility capacities; NULL capacity remains unknown,
-- not silently treated as zero.
CREATE OR REPLACE VIEW v_agri_facility_capacity AS
SELECT f.id, f.name, f.facility_type, f.status, f.admin_unit_id,
       au.name AS administrative_unit_name,
       f.storage_capacity_tonnes, f.processing_capacity_tonnes_day,
       f.drying_capacity_tonnes_day, f.cold_storage_capacity_tonnes,
       f.location, f.last_verified_at
FROM agri_facilities f
JOIN administrative_units au ON au.id = f.admin_unit_id;

COMMIT;

-- AFTER MIGRATION:
-- 1. Populate season_code only when the source confirms the official season.
-- 2. Map incoming product names to agricultural_products IDs.
-- 3. Do not infer district-level exports from national-level trade totals.
-- 4. Check data quality and duplicate records before enforcing domain-specific
--    uniqueness constraints on imported statistics.
