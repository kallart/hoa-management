const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const payments = await prisma.payment.findMany({
    where: { receiptNumber: { not: null } },
    include: { invoice: { include: { property: true } } },
    orderBy: { createdAt: 'asc' }
  });
  
  console.log("All receipts:");
  payments.forEach(p => console.log(`${p.receiptNumber} - ${p.createdAt}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
