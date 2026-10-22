const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'Mug2thi4',
  database: 'agrilens_db'
});

async function main() {
  await client.connect();

  const irr = await client.query("SELECT season_code, sum(reported_irrigated_area_ha) as irr_area, avg(irrigation_access_pct) as access_pct FROM agrilens.irrigation_season_statistics GROUP BY season_code ORDER BY season_code DESC LIMIT 5");
  console.log('Irrigation totals:', irr.rows);

  const soil = await client.query("SELECT season_code, avg(avg_ph) as ph, avg(avg_organic_carbon_pct) as oc, avg(soil_health_index) as soil_health FROM agrilens.soil_fertility_season_statistics GROUP BY season_code ORDER BY season_code DESC LIMIT 5");
  console.log('Soil totals:', soil.rows);

  const ph = await client.query("SELECT season_code, sum(documented_storage_capacity_mt) as storage, avg(pct_harvest_lost) as loss_pct FROM agrilens.post_harvest_season_statistics GROUP BY season_code ORDER BY season_code DESC LIMIT 5");
  console.log('Post harvest totals:', ph.rows);

  const trade = await client.query("SELECT season_code, sum(export_volume_mt) as exp_vol, sum(export_value_usd) as exp_usd FROM agrilens.trade_season_statistics GROUP BY season_code ORDER BY season_code DESC LIMIT 5");
  console.log('Trade totals:', trade.rows);

  await client.end();
}

main().catch(console.error);
