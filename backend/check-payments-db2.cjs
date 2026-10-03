const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPayment() {
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

    let payments = [];
    for (const invoice of property.invoices) {
      payments = payments.concat(invoice.payments);
    }
    console.log(JSON.stringify(payments, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}
checkPayment();
