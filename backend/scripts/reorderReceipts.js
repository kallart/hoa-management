const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const payments = await prisma.payment.findMany({
    where: { receiptNumber: { not: null } },
    include: { invoice: { include: { property: true } } },
    orderBy: { createdAt: 'asc' }
  });
  
  let targetIndex = payments.findIndex(p => p.receiptNumber.includes('REC_2026_0014'));
  if (targetIndex === -1) {
    console.log("Could not find REC_2026_0014");
    return;
  }
  
  let currentNum = 15;
  for (let i = targetIndex + 1; i < payments.length; i++) {
    const payment = payments[i];
    const houseNum = payment.invoice.property.houseNumber.replace(/\//g, '-');
    const newReceiptNum = `REC_2026_${currentNum.toString().padStart(4, '0')}_(${houseNum})`;
    
    console.log(`Updating ${payment.receiptNumber} -> ${newReceiptNum}`);
    
    await prisma.payment.update({
      where: { id: payment.id },
      data: { receiptNumber: newReceiptNum }
    });
    
    currentNum++;
  }
  console.log("Done updating!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
