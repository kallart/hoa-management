const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Phutthabucha_39@db.aitnaalqfpzbggbcsqqc.supabase.co:5432/postgres',
});

client.connect()
  .then(() => {
    console.log('Successfully connected to Supabase PostgreSQL!');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Current time from DB:', res.rows[0]);
    client.end();
  })
  .catch(err => {
    console.error('Connection error', err.stack);
    client.end();
  });
