const { Client } = require('pg');

const uri = 'postgresql://postgres.aitnaalqfpzbggbcsqqc:Phutthabucha_39@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString: uri });

client.connect()
  .then(() => {
    console.log('Successfully connected using Pooler!');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Time:', res.rows[0]);
    client.end();
  })
  .catch(err => {
    console.error('Pooler Error:', err.message);
    client.end();
  });
