const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:Mug2thi4@localhost:5433/agrilens_db' });

async function seedRichAuditLogs() {
  await client.connect();

  const extraLogs = [
    {
      actor_email: 'admin@agrilens.gov.rw',
      actor_role: 'PLATFORM_ADMIN',
      action: 'ADMIN_PASSWORD_RESET',
      resource: 'USER_CREDENTIALS',
      details: { target_email: 'district.musanze@minagri.gov.rw', reset_by: 'admin@agrilens.gov.rw', reason: 'User requested password recovery after phone change', channel: 'SMS_OTP' },
      ip_address: '197.243.22.45'
    },
    {
      actor_email: 'admin@agrilens.gov.rw',
      actor_role: 'PLATFORM_ADMIN',
      action: 'USER_PASSWORD_RESET',
      resource: 'USER_CREDENTIALS',
      details: { target_email: 'district.gatsibo@minagri.gov.rw', reset_by: 'admin@agrilens.gov.rw', reason: 'Bi-annual mandatory security credential rotation' },
      ip_address: '197.243.22.45'
    },
    {
      actor_email: 'admin@agrilens.gov.rw',
      actor_role: 'PLATFORM_ADMIN',
      action: 'USER_SCOPE_ASSIGNMENT',
      resource: 'GEOGRAPHIC_SCOPE',
      details: { target_user: 'Jean Pierre Hakizimana', assigned_district: 'Kayonza', previous_scope: 'UNASSIGNED', granted_at: new Date().toISOString() },
      ip_address: '197.243.22.45'
    },
    {
      actor_email: 'admin@agrilens.gov.rw',
      actor_role: 'PLATFORM_ADMIN',
      action: 'USER_SCOPE_ASSIGNMENT',
      resource: 'GEOGRAPHIC_SCOPE',
      details: { target_user: 'Eric Maniraguha', assigned_district: 'Musanze', previous_scope: 'UNASSIGNED', granted_at: new Date().toISOString() },
      ip_address: '197.243.22.45'
    },
    {
      actor_email: 'district.musanze@minagri.gov.rw',
      actor_role: 'DISTRICT_OFFICER',
      action: 'EXPORT_ATTEMPT_DENIED',
      resource: 'NATIONAL_CONSOLIDATED_ARCHIVE',
      details: { reason: 'District role cannot export nationwide data without elevated authorization', policy: 'BOUNDARY_ENFORCEMENT' },
      ip_address: '105.178.43.12'
    },
    {
      actor_email: 'district.gatsibo@minagri.gov.rw',
      actor_role: 'DISTRICT_OFFICER',
      action: 'ACCESS_DENIED_UNAUTHORIZED_RESOURCE',
      resource: 'PLATFORM_SECURITY_KEYS',
      details: { reason: 'Unauthorized access attempt to platform cryptographic keystore', policy: 'DENY_ALL_NON_ADMIN' },
      ip_address: '105.178.43.99'
    },
    {
      actor_email: 'planner@minagri.gov.rw',
      actor_role: 'NATIONAL_PLANNER',
      action: 'EXPORT_REPORT',
      resource: 'ANNUAL_CROP_YIELD_SYNTHESIS_2026',
      details: { format: 'CSV', record_count: 1845, season: '2026B', ministry_dossier: 'MINAGRI-PLAN-2026' },
      ip_address: '197.243.18.11'
    },
    {
      actor_email: 'admin@agrilens.gov.rw',
      actor_role: 'PLATFORM_ADMIN',
      action: 'EXPORT_REPORT',
      resource: 'PLATFORM_ADMINISTRATIVE_AUDIT_REPORT',
      details: { format: 'CSV', exported_by: 'admin@agrilens.gov.rw', records: 57, purpose: 'Quarterly oversight brief' },
      ip_address: '127.0.0.1'
    },
    {
      actor_email: 'datamanager@nisr.gov.rw',
      actor_role: 'DATA_MANAGER',
      action: 'EXPORT_AUTHORIZED',
      resource: 'SAS_2026B_VALIDATED_DISTRICT_TABLES',
      details: { format: 'XLSX', districts_included: 30, verified_by_checksum: true },
      ip_address: '197.243.20.50'
    }
  ];

  for (const log of extraLogs) {
    await client.query(`
      INSERT INTO agrilens.audit_logs (actor_email, actor_role, action, resource, details, ip_address, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW() - (random() * interval '7 days'));
    `, [log.actor_email, log.actor_role, log.action, log.resource, JSON.stringify(log.details), log.ip_address]);
  }

  console.log(`Seeded ${extraLogs.length} extra rich audit logs.`);
  await client.end();
}

seedRichAuditLogs().catch(console.error);
