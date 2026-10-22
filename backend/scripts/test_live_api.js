async function main() {
  const ovRes = await fetch('http://localhost:3000/api/v1/dashboard/overview');
  const ov = await ovRes.json();
  console.log('allCrops count:', ov.allCrops?.length);
  if (ov.allCrops) {
    console.log('Sample crops:', ov.allCrops.slice(0, 8).map(c => `${c.crop_name} (${c.category}) - ${c.total_prod_tonnes.toLocaleString()} MT @ ${c.avg_yield_t_ha} t/ha [${c.seasons_count} seasons]`));
  }

  const facRes = await fetch('http://localhost:3000/api/v1/infrastructure/facilities');
  const fac = await facRes.json();
  console.log('Total facilities:', fac.facilities?.length);
  console.log('Summary:', fac.summary);
  if (fac.facilities && fac.facilities.length > 0) {
    console.log('First 3 facilities:', fac.facilities.slice(0, 3).map(f => `${f.name} | ${f.type} | ${f.district} (${f.province}) | ${f.storageCapacity} MT | ${f.longitude}, ${f.latitude}`));
  }
}

main().catch(console.error);
