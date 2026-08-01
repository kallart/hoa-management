const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInvoice() {
  try {
    const property = await prisma.property.findUnique({
      where: { houseNumber: '405/18' },
      include: {
        invoices: true
      }
    });

    console.log(JSON.stringify(property.invoices, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}
checkInvoice();
