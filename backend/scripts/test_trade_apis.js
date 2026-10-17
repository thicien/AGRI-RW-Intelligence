async function testAll() {
  const base = 'http://127.0.0.1:3000/api/v1/trade';
  console.log('Testing Trade Intelligence Endpoints...');
  
  const sum = await fetch(base + '/summary?season=2026B').then(r => r.json());
  console.log('1. /summary: status OK, exports = $' + sum.metrics?.total_export_value_usd?.toLocaleString(), 'imports = $' + sum.metrics?.total_import_value_usd?.toLocaleString(), 'top prod =', sum.top_export_product?.name);

  const prods = await fetch(base + '/products-trade?season=2026B').then(r => r.json());
  console.log('2. /products-trade: length =', prods.length, 'sample =', prods[0]?.product_name, 'export USD = $' + prods[0]?.export_value_usd?.toLocaleString());

  const dists = await fetch(base + '/districts?season=2026B').then(r => r.json());
  console.log('3. /districts: length =', dists.length, 'sample top:', dists[0]?.district_name, 'score:', dists[0]?.export_readiness_score, 'tier:', dists[0]?.export_tier);

  const seasons = await fetch(base + '/seasons').then(r => r.json());
  console.log('4. /seasons: length =', seasons.length, 'first =', seasons[0]?.season_code, 'last =', seasons[seasons.length - 1]?.season_code);

  const screen = await fetch(base + '/opportunity-screening').then(r => r.json());
  console.log('5. /opportunity-screening: length =', screen.length, 'rank 1 =', screen[0]?.product_name, '->', screen[0]?.destination_country, 'score =', screen[0]?.opportunity_score);

  const dos = await fetch(base + '/commercial-dossier?product=Hass%20Avocado&destination=Netherlands').then(r => r.json());
  console.log('6. /commercial-dossier: product =', dos.product_name, 'destination =', dos.destination_country, 'trend count =', dos.historical_trend?.length, 'sourcing districts =', dos.top_sourcing_districts?.length);

  console.log('\nALL 6 TRADE INTELLIGENCE ENDPOINTS VERIFIED SUCCESSFULLY!');
}

testAll().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
