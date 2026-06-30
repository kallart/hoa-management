const { Client } = require('pg');

const uri1 = 'postgresql://postgres:Phutthabucha_39@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';
const uri2 = 'postgresql://postgres.aitnaalqfpzbggbcsqqc:Phutthabucha_39@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

const test = async () => {
  try {
    const c1 = new Client({ connectionString: uri1 });
    await c1.connect();
    console.log('Success URI 1');
    c1.end();
  } catch(e) {
    console.log('Failed URI 1', e.message);
  }
  
  try {
    const c2 = new Client({ connectionString: uri2 });
    await c2.connect();
    console.log('Success URI 2');
    c2.end();
  } catch(e) {
    console.log('Failed URI 2', e.message);
  }
}
test();
