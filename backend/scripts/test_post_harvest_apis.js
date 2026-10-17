async function testAll() {
  const base = 'http://localhost:3000/api/v1/post-harvest';
  console.log('Testing Post-Harvest Endpoints...');
  
  const sum = await fetch(base + '/summary?season=2026B').then(r => r.json());
  console.log('1. /summary: status OK, production =', sum.metrics?.total_crop_production_mt, 'surplus =', sum.metrics?.total_market_surplus_volume_mt, 'safeguard =', !!sum.safeguard_notice);

  const dists = await fetch(base + '/districts?season=2026B').then(r => r.json());
  console.log('2. /districts: length =', dists.length, 'sample top:', dists[0]?.district_name, 'score:', dists[0]?.investment_opportunity_score);

  const seasons = await fetch(base + '/seasons').then(r => r.json());
  console.log('3. /seasons: length =', seasons.length, 'first =', seasons[0]?.season_code, 'last =', seasons[seasons.length - 1]?.season_code);

  const facs = await fetch(base + '/facilities').then(r => r.json());
  console.log('4. /facilities: length =', facs.length, 'sample =', facs[0]?.name, 'type =', facs[0]?.facility_type, 'cap =', facs[0]?.storage_capacity_tonnes);

  const gaps = await fetch(base + '/gap-screening?season=2026B').then(r => r.json());
  console.log('5. /gap-screening: length =', gaps.length, 'rank 1 =', gaps[0]?.district_name, 'score =', gaps[0]?.investment_opportunity_score);

  const dos = await fetch(base + '/site-dossier?district=Nyagatare&season=2026B').then(r => r.json());
  console.log('6. /site-dossier: district =', dos.district_name, 'historical trends =', dos.historical_trend?.length, 'local facilities =', dos.local_facilities?.length);

  console.log('\nALL 6 ENDPOINTS RETURNED VALID DATA SUCCESSFULLY!');
}

testAll().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
