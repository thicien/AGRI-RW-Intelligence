async function run() {
  console.log('--- 1. Testing GET /api/v1/auth/roles ---');
  const rolesRes = await fetch('http://localhost:3000/api/v1/auth/roles');
  const roles = await rolesRes.json();
  console.log('Roles Count:', roles.length);
  roles.forEach(r => console.log(`  - [${r.code}] ${r.name} (Scope: ${r.details?.geographicScope})`));

  console.log('\n--- 2. Testing GET /api/v1/auth/permissions-matrix ---');
  const matrixRes = await fetch('http://localhost:3000/api/v1/auth/permissions-matrix');
  const matrixData = await matrixRes.json();
  console.log('Capabilities count:', matrixData.capabilities.length);
  console.log('Matrix keys count:', Object.keys(matrixData.matrix).length);
  console.log('Sample Capability Matrix (VIEW_PUBLISHED_DASHBOARDS):', matrixData.matrix['VIEW_PUBLISHED_DASHBOARDS']);
  console.log('Sample Capability Matrix (EXPORT_RAW_DATA):', matrixData.matrix['EXPORT_RAW_DATA']);

  console.log('\n--- 3. Testing GET /api/v1/auth/users ---');
  const usersRes = await fetch('http://localhost:3000/api/v1/auth/users');
  const users = await usersRes.json();
  console.log('Users Count:', users.length);
  users.forEach(u => console.log(`  - ${u.full_name} (${u.email}) -> Role: ${u.role_name}, Scope: ${u.scope_level} ${u.district_name || ''}`));

  console.log('\n--- 4. Testing POST /api/v1/auth/export-check (Security Enforcement) ---');
  // Test A: Admin allowed
  const adminExport = await fetch('http://localhost:3000/api/v1/auth/export-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userEmail: 'admin@agrilens.gov.rw',
      roleCode: 'PLATFORM_ADMIN',
      exportType: 'RAW_DATA',
      datasetName: 'SAS_2026A_NATIONAL_CROP_YIELDS'
    })
  });
  console.log('Admin Raw Export Status:', adminExport.status, await adminExport.json());

  // Test B: Farmer trying raw export (Should be 403 Forbidden)
  const farmerExport = await fetch('http://localhost:3000/api/v1/auth/export-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userEmail: 'farmer.coop@agrilens.rw',
      roleCode: 'COOPERATIVE_FARMER',
      exportType: 'RAW_DATA',
      datasetName: 'CONFIDENTIAL_STRATA_RAW'
    })
  });
  console.log('Farmer Raw Export Status (Expected 403):', farmerExport.status, await farmerExport.json());

  // Test C: District Officer Nyagatare trying to export Musanze (Geographic violation, Expected 403)
  const daoViolation = await fetch('http://localhost:3000/api/v1/auth/export-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userEmail: 'district.nyagatare@minagri.gov.rw',
      roleCode: 'DISTRICT_OFFICER',
      exportType: 'REPORT',
      requestedDistrict: 'Musanze',
      datasetName: 'MUSANZE_DISTRICT_HARVEST_REPORT'
    })
  });
  console.log('DAO Geographic Violation Status (Expected 403):', daoViolation.status, await daoViolation.json());

  console.log('\n--- 5. Testing GET /api/v1/auth/audit-logs ---');
  const auditRes = await fetch('http://localhost:3000/api/v1/auth/audit-logs?limit=5');
  const auditLogs = await auditRes.json();
  console.log('Recent Audit Logs Count:', auditLogs.length);
  auditLogs.slice(0, 3).forEach(l => console.log(`  - [${l.created_at}] Actor: ${l.actor_email} (${l.actor_role}) -> ${l.action} on ${l.resource}`));
}

run().catch(console.error);
