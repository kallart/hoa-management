const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixStatus() {
  try {
    const updated = await prisma.invoice.updateMany({
      where: { status: 'เธฃเธญเธ•เธฃเธงเธˆเธชเธญเธšเธขเธญเธ”เน€เธ‡เธดเธ™' },
      data: { status: 'รอตรวจสอบยอดเงิน' }
    });
    console.log(`Updated ${updated.count} invoices.`);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}
fixStatus();
