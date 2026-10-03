const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetAndSeed() {
  console.log('Deleting old data...');
  await prisma.poolWaterQuality.deleteMany({});
  
  console.log('Seeding pool data...');
  const today = new Date();
  for (let i = 30; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const cl = (Math.random() * (3.5 - 1.0) + 1.0).toFixed(1);
    const ph = (Math.random() * (7.8 - 7.0) + 7.0).toFixed(1);
    const salt = (Math.random() * (4.2 - 2.8) + 2.8).toFixed(1);
    const isNote = Math.random() > 0.8;
    const notes = isNote ? (Math.random() > 0.5 ? 'ล้างฟิลเตอร์' : 'เติมเกลือ 1 กระสอบ') : '';
    
    await prisma.poolWaterQuality.create({
      data: {
        cl: parseFloat(cl),
        ph: parseFloat(ph),
        salt: parseFloat(salt),
        notes: notes,
        date: d
      }
    });
  }
  console.log('Seeding done!');
}

resetAndSeed().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
