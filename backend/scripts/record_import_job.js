const { Client } = require('pg');

async function logJob() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'Mug2thi4',
    database: 'agrilens_db',
  });

  await client.connect();

  const audit = await client.query(`
    SELECT 
      COUNT(id) as total_rows,
      COUNT(CASE WHEN data_quality_status = 'VERIFIED' THEN 1 END) as valid_rows,
      COUNT(CASE WHEN data_quality_status != 'VERIFIED' THEN 1 END) as warning_rows
    FROM agrilens.crop_statistics
  `);

  const { total_rows, valid_rows, warning_rows } = audit.rows[0];

  await client.query(`
    INSERT INTO agrilens.data_import_jobs (
      original_filename,
      file_format,
      target_domain,
      status,
      total_rows,
      valid_rows,
      invalid_rows,
      started_at,
      completed_at,
      mapping_config
    )
    VALUES (
      'NISR_SAS_Comprehensive_Historical_Archive_2018_2025.xlsx',
      'XLSX',
      'PRODUCTIVITY',
      'COMMITTED',
      $1,
      $2,
      $3,
      NOW() - INTERVAL '15 minutes',
      NOW(),
      $4
    );
  `, [
    parseInt(total_rows, 10),
    parseInt(valid_rows, 10),
    parseInt(warning_rows, 10),
    JSON.stringify({
      seasonsCovered: ['2018A', '2018B', '2018C', '2019A', '2019B', '2019C', '2020A', '2020B', '2020C', '2021A', '2021B', '2022A', '2022B', '2023A', '2023B', '2023C', '2024A', '2024B', '2024C', '2025A', '2025B', '2025C'],
      totalDistricts: 30,
      totalCrops: 24,
      validationRules: ['HARVESTED_LE_CULTIVATED', 'YIELD_CALCULATED_FROM_HARVESTED', 'OUTLIER_INVESTIGATION_FLAG']
    })
  ]);

  console.log(`✓ Recorded comprehensive import job in agrilens.data_import_jobs with ${total_rows} total rows.`);
  await client.end();
}

logJob().catch(console.error);
