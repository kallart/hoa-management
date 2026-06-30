const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const invs = await prisma.invoice.findMany({
    where: { status: 'รอตรวจสอบยอดเงิน' },
    include: { payments: true }
  });
  console.log(JSON.stringify(invs, null, 2));
}

main().finally(() => prisma.$disconnect());
