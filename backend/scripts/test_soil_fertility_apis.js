const http = require('http');

const endpoints = [
  '/api/v1/soil-fertility/summary?season=2026B',
  '/api/v1/soil-fertility/districts?season=2026B',
  '/api/v1/soil-fertility/seasons',
  '/api/v1/soil-fertility/priority-ranking?season=2026B',
  '/api/v1/soil-fertility/projects',
  '/api/v1/soil-fertility/site-dossier?district=Gicumbi&season=2026B',
  '/api/v1/soil-fertility/site-dossier?district=Nyaruguru&season=2026B',
  '/api/v1/soil-fertility/correlation?district=Gicumbi',
];

async function checkEndpoint(path) {
  return new Promise((resolve) => {
    http.get({ host: '127.0.0.1', port: 3000, path }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ path, status: res.statusCode, ok: res.statusCode === 200, preview: parsed });
        } catch (e) {
          resolve({ path, status: res.statusCode, ok: false, error: 'JSON parse error', raw: data.substring(0, 100) });
        }
      });
    }).on('error', err => {
      resolve({ path, ok: false, error: err.message });
    });
  });
}

async function run() {
  console.log('Testing Soil Fertility Intelligence Endpoints...\n');
  for (const ep of endpoints) {
    const result = await checkEndpoint(ep);
    if (result.ok) {
      console.log(`[PASS] ${result.status} ${result.path}`);
      if (Array.isArray(result.preview)) {
        console.log(`       Items returned: ${result.preview.length}`);
      } else if (result.preview && typeof result.preview === 'object') {
        console.log(`       Keys: ${Object.keys(result.preview).join(', ')}`);
      }
    } else {
      console.error(`[FAIL] ${result.status || 'ERR'} ${result.path} - ${result.error || result.raw}`);
    }
  }
}

run();
