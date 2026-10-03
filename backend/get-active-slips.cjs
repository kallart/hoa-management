const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getActiveSlips() {
  try {
    const property = await prisma.property.findUnique({
      where: { houseNumber: '405/18' },
      include: {
        invoices: {
          include: {
            payments: true
          }
        }
      }
    });

    let activeSlips = [];
    for (const invoice of property.invoices) {
      for (const payment of invoice.payments) {
        if (payment.slipUrl) {
          activeSlips.push(payment.slipUrl);
        }
      }
    }
    console.log(JSON.stringify(activeSlips, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}
getActiveSlips();
