const http = require('http');

const endpoints = [
  '/api/v1/crop-statistics/summary?season=2025A',
  '/api/v1/crop-statistics/summary?season=2023A',
  '/api/v1/crop-statistics/summary?season=2020A',
  '/api/v1/crop-statistics/district-comparison?crop=Maize&season=2025A',
  '/api/v1/crop-statistics/district-comparison?crop=Sorghum&season=2024A',
  '/api/v1/crop-statistics/district-comparison?crop=Vegetables&season=2023A',
  '/api/v1/crop-statistics/seasonal-comparison?crop=Beans&year=2024',
  '/api/v1/crop-statistics/historical-trends?crop=Cassava',
  '/api/v1/crop-statistics/underperforming-areas?season=2025A&crop=Sweet%20Potato',
  '/api/v1/crop-statistics/district-dossier?district=Bugesera&crop=Maize&season=2025A',
  '/api/v1/crop-statistics/crops',
  '/api/v1/crop-statistics/seasons',
  '/api/v1/crop-statistics/data-quality',
];

function fetchEndpoint(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({
      hostname: 'localhost',
      port: 3000,
      path: path,
      headers: { 'Accept': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data.substring(0, 100) });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function run() {
  console.log('Testing Enhanced Seasonal Agricultural Foundation APIs on http://localhost:3000...');
  let failed = 0;
  for (const path of endpoints) {
    try {
      const res = await fetchEndpoint(path);
      if (res.status === 200) {
        console.log(`[PASS] (200) ${path}`);
      } else {
        console.error(`[FAIL] (${res.status}) ${path}`);
        failed++;
      }
    } catch (err) {
      console.error(`[ERROR] ${path} -> ${err.message}`);
      failed++;
    }
  }
  console.log(`\nCompleted: ${endpoints.length - failed}/${endpoints.length} passed.`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
