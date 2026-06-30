const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const unverified = await prisma.payment.findFirst({ where: { receiptNumber: null } });
  console.log('Unverified Payment:', unverified);
  if(unverified) {
    try {
      const res = await fetch('http://localhost:3001/api/payments/' + unverified.id + '/verify', { method: 'POST' });
      if(!res.ok) {
        const text = await res.text();
        console.error('Error:', text);
      } else {
        const data = await res.json();
        console.log('Success:', data);
      }
    } catch(e) {
      console.error('Exception:', e.message);
    }
  }
}

main().finally(() => prisma.$disconnect());
