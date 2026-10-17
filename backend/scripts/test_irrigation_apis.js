async function testIrrigationEndpoints() {
  const base = 'http://localhost:3000/api/v1/irrigation';
  const tests = [
    `${base}/summary?season=2026B`,
    `${base}/districts?season=2026B`,
    `${base}/seasons`,
    `${base}/opportunity-screening?season=2026B`,
    `${base}/schemes`,
    `${base}/site-dossier?district=Bugesera&season=2026B`,
    `${base}/site-dossier?district=Nyagatare&season=2026B`,
  ];

  console.log('Testing Module 2 Irrigation APIs...');
  let passed = 0;

  for (const url of tests) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        console.log(`[PASS] (${res.status}) ${url.replace('http://localhost:3000', '')}`);
        passed++;
      } else {
        console.error(`[FAIL] (${res.status}) ${url}`);
      }
    } catch (e) {
      console.error(`[ERR] ${url}:`, e.message);
    }
  }

  console.log(`\nResult: ${passed}/${tests.length} tests passed.`);
}

testIrrigationEndpoints().catch(console.error);
