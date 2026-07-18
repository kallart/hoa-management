const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const payments = await prisma.payment.findMany({
    where: { receiptNumber: { not: null } },
    orderBy: { createdAt: 'asc' }, // The user said "เรียงลำดับตามเดิม" (keep the original order) which is likely createdAt or paymentDate
  });
  console.log(payments.map(p => ({ date: p.paymentDate, created: p.createdAt, num: p.receiptNumber, id: p.id })));
}
main().finally(() => prisma.$disconnect());
