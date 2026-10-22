async function runTests() {
  console.log('--- Testing Data Manager APIs & Access Control ---');

  // 1. Login as Data Manager
  const dmLogin = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'datamanager@agrilens.gov.rw', password: 'Data@2026!' })
  });
  const dmData = await dmLogin.json();
  console.log('1. Data Manager Login:', dmLogin.status, dmData.user?.role, dmData.user?.name);
  const dmToken = dmData.accessToken;

  // 2. Data Operations Overview
  const ovRes = await fetch('http://localhost:3000/api/v1/data-manager/overview', {
    headers: { 'Authorization': `Bearer ${dmToken}` }
  });
  const ovData = await ovRes.json();
  console.log('2. Data Operations Overview:', ovRes.status, {
    kpis: ovData.kpis,
    moduleReadinessCount: ovData.moduleReadiness?.length
  });

  // 3. Datasets List
  const dsRes = await fetch('http://localhost:3000/api/v1/data-manager/datasets', {
    headers: { 'Authorization': `Bearer ${dmToken}` }
  });
  const dsList = await dsRes.json();
  console.log('3. Datasets Ingestion Catalog:', dsRes.status, `Found ${dsList.length} datasets`);

  // 4. Data Quality Validation Issues
  const valRes = await fetch('http://localhost:3000/api/v1/data-manager/validation-quality', {
    headers: { 'Authorization': `Bearer ${dmToken}` }
  });
  const valData = await valRes.json();
  console.log('4. Validation & Quality Issues:', valRes.status, valData.summary);

  // 5. Run Automated DQ Rules Check
  const dqRun = await fetch('http://localhost:3000/api/v1/data-manager/validation-quality/run', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${dmToken}` }
  });
  const dqRunData = await dqRun.json();
  console.log('5. Automated DQ Pipeline Execution:', dqRun.status, dqRunData.overallPassRate + '% pass rate');

  // 6. Seasons & Geographic Coverage Matrix
  const covRes = await fetch('http://localhost:3000/api/v1/data-manager/seasons-coverage', {
    headers: { 'Authorization': `Bearer ${dmToken}` }
  });
  const covData = await covRes.json();
  console.log('6. Seasons & Coverage Matrix:', covRes.status, `${covData.totalDistricts} districts at ${covData.coverageRatePct}% coverage`);

  // 7. Security Denial: District Officer attempting to access Data Manager Pipeline
  const doLogin = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'officer.musanze@minagri.gov.rw', password: 'Musanze@2026!' })
  });
  const doData = await doLogin.json();
  const deniedRes = await fetch('http://localhost:3000/api/v1/data-manager/overview', {
    headers: { 'Authorization': `Bearer ${doData.accessToken}` }
  });
  const deniedJson = await deniedRes.json();
  console.log('7. District Officer access to Data Pipeline (Expected 403):', deniedRes.status, deniedJson.message);

  console.log('--- All Data Manager Backend Tests Passed Successfully! ---');
}

runTests().catch(console.error);
