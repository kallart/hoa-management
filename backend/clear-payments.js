const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const property = await prisma.property.findUnique({
    where: { houseNumber: '405/18' }
  });

  if (!property) {
    console.log('Property not found');
    return;
  }

  const invoices = await prisma.invoice.findMany({
    where: { propertyId: property.id }
  });

  for (const inv of invoices) {
    // Delete payments
    const deletedPayments = await prisma.payment.deleteMany({
      where: { invoiceId: inv.id }
    });
    console.log(`Deleted ${deletedPayments.count} payments for invoice ${inv.invoiceNumber}`);

    // Reset invoice status
    await prisma.invoice.update({
      where: { id: inv.id },
      data: { status: 'รอการชำระ' }
    });
    console.log(`Reset status for invoice ${inv.invoiceNumber} to 'รอการชำระ'`);
  }
}

main().finally(() => prisma.$disconnect());
