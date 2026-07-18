const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting receipt number fix...');
  
  // Find the target receipt
  const targetReceiptNum = 'REC_2026_0014'; // We will search for prefix
  
  const targetReceipt = await prisma.payment.findFirst({
    where: {
      receiptNumber: {
        contains: targetReceiptNum
      }
    },
    include: {
      invoice: {
        include: { property: true }
      }
    }
  });

  if (!targetReceipt) {
    console.error('Could not find receipt starting with', targetReceiptNum);
    return;
  }

  console.log(`Found target receipt: ${targetReceipt.receiptNumber} created at ${targetReceipt.createdAt}`);

  // Fetch all receipts created AFTER the target receipt
  const subsequentReceipts = await prisma.payment.findMany({
    where: {
      receiptNumber: { not: null },
      createdAt: {
        gt: targetReceipt.createdAt
      }
    },
    include: {
      invoice: {
        include: { property: true }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  console.log(`Found ${subsequentReceipts.length} receipts to renumber.`);

  let nextNumInt = 15; // Start from 0015
  const year = 2026;

  for (const payment of subsequentReceipts) {
    const nextNum = String(nextNumInt).padStart(4, '0');
    let houseNumberStr = 'unknown';
    if (payment.invoice && payment.invoice.property) {
      houseNumberStr = payment.invoice.property.houseNumber.replace(/\//g, '-');
    }

    let newReceiptNumber = `REC_${year}_${nextNum}_(${houseNumberStr})`;
    
    // Check if it was a partial payment (has -PM suffix)
    if (payment.receiptNumber.includes('-PM')) {
      const match = payment.receiptNumber.match(/-PM\d+/);
      if (match) {
        newReceiptNumber += match[0];
      }
    }

    console.log(`Updating ${payment.receiptNumber} -> ${newReceiptNumber}`);

    await prisma.payment.update({
      where: { id: payment.id },
      data: { receiptNumber: newReceiptNumber }
    });

    nextNumInt++;
  }

  console.log('Done renumbering!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
