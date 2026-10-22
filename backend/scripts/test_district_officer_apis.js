const http = require('http');

function postJson(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1${path}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getJson(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1${path}`,
      method: 'GET',
      headers
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('Testing District Officer & Registration APIs...');

  // 1. Test Register District Officer for Musanze
  const regRes = await postJson('/auth/register-district-officer', {
    fullName: 'Damascene Nkundabagenzi',
    email: 'officer.musanze@minagri.gov.rw',
    phone: '+250 788 567 890',
    password: 'Musanze@2026!',
    districtName: 'Musanze',
    notes: 'District Agricultural Officer for Musanze District'
  });
  console.log('1. Registration Response:', regRes.status, regRes.data?.message || regRes.data);

  // 2. Test Login with newly registered officer credentials
  const loginRes = await postJson('/auth/login', {
    email: 'officer.musanze@minagri.gov.rw',
    password: 'Musanze@2026!'
  });
  console.log('2. Login Response:', loginRes.status, loginRes.data?.user);
  const token = loginRes.data?.accessToken;

  // 3. Test District Overview with Token (Authorized for Musanze)
  const overviewRes = await getJson('/district/overview', token);
  console.log('3. District Overview Response:', overviewRes.status, {
    district: overviewRes.data?.district,
    kpis: overviewRes.data?.kpis,
    sectorsCount: overviewRes.data?.sectors?.length,
    interventionsCount: overviewRes.data?.interventions?.length
  });

  // 4. Test Cross-District Access Denial: Try to access Nyagatare while token is for Musanze
  const crossDistrictRes = await getJson('/district/overview?district=Nyagatare', token);
  console.log('4. Cross-District Access Attempt (should be 403 Forbidden):', crossDistrictRes.status, crossDistrictRes.data?.message);

  // 5. Test Productivity Endpoint
  const prodRes = await getJson('/district/productivity', token);
  console.log('5. Productivity Response:', prodRes.status, {
    cropsCount: prodRes.data?.cropBreakdown?.length
  });

  // 6. Test Reports Endpoint
  const repRes = await getJson('/district/reports', token);
  console.log('6. Reports Response:', repRes.status, repRes.data?.reportTitle);
}

run().catch(console.error);
