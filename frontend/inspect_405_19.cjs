const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres.aitnaalqfpzbggbcsqqc:Phutthabucha_39@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' } } });

async function inspectHouse() {
  try {
    const prop = await prisma.property.findFirst({
      where: { houseNumber: '405/19' },
      include: { invoices: true, owner: true }
    });
    console.log('Property 405/19:', JSON.stringify(prop, null, 2));

    const setting = await prisma.setting.findFirst();
    console.log('Global Setting:', setting);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

inspectHouse();
