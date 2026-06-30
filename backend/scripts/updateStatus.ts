import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });
const prisma = new PrismaClient();

async function updateStatus() {
  try {
    const updateInvoices = await prisma.invoice.updateMany({
      data: {
        status: "รอการชำระ"
      }
    });
    console.log(`Updated ${updateInvoices.count} invoices to 'รอการชำระ'.`);
  } catch (error) {
    console.error("Update failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateStatus();
