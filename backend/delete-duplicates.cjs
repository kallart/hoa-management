const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteDuplicates() {
  try {
    const property = await prisma.property.findUnique({
      where: { houseNumber: '405/18' },
      include: {
        invoices: {
          include: {
            payments: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!property) {
      console.log('Property not found');
      return;
    }

    let deletedCount = 0;
    for (const invoice of property.invoices) {
      if (invoice.payments.length > 1) {
        // Keep the first one (most recent due to desc order), delete the rest
        const toDelete = invoice.payments.slice(1);
        for (const payment of toDelete) {
          await prisma.payment.delete({
            where: { id: payment.id }
          });
          deletedCount++;
          console.log(`Deleted duplicate payment ${payment.id}`);
        }
      }
    }
    console.log(`Successfully deleted ${deletedCount} duplicate payments for 405/18.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteDuplicates();
