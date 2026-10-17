const http = require('http');

function fetchJson(path) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: 'localhost',
      port: 3000,
      path: path,
      headers: { 'Accept': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Testing newly enriched endpoints...');
  
  const cropsRes = await fetchJson('/api/v1/crop-statistics/crops');
  console.log(`\n1. /crops status: ${cropsRes.status}`);
  console.log(`   Found ${cropsRes.json?.length} crops!`);
  console.log('   Top crops:', cropsRes.json?.slice(0, 8).map(c => `${c.name} (${c.category}, ${c.total_records} records)`));

  const seasonsRes = await fetchJson('/api/v1/crop-statistics/seasons');
  console.log(`\n2. /seasons status: ${seasonsRes.status}`);
  console.log(`   Found ${seasonsRes.json?.length} seasons!`);
  console.log('   Seasons sample:', seasonsRes.json?.slice(0, 8).map(s => `${s.season_code} (${s.total_records} records)`));

  const dqRes = await fetchJson('/api/v1/crop-statistics/data-quality');
  console.log(`\n3. /data-quality status: ${dqRes.status}`);
  console.log('   Overview:', dqRes.json?.foundationOverview);
  console.log('   Quality Status Breakdown:', dqRes.json?.qualityStatusBreakdown);
  console.log('   Rules Enforced:', dqRes.json?.rulesEnforced?.map(r => r.name));
}

run().catch(console.error);
