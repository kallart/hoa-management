// @ts-nocheck
import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';

const sqliteDb = new Database('prisma/dev.db');
const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log("Clearing Postgres DB...");
    await prisma.payment.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.owner.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.setting.deleteMany({});

    console.log("Migrating Setting...");
    const settings = sqliteDb.prepare('SELECT * FROM Setting').all();
    for (const s of settings) {
      await prisma.setting.create({
        data: {
          id: s.id,
          villageName: s.villageName,
          commonAreaRate: s.commonAreaRate,
          promptPay: s.promptPay,
          updatedAt: new Date(s.updatedAt)
        }
      });
    }

    console.log("Migrating Property...");
    const properties = sqliteDb.prepare('SELECT * FROM Property').all();
    for (const p of properties) {
      await prisma.property.create({
        data: {
          id: p.id,
          houseNumber: p.houseNumber,
          plot: p.plot,
          landArea: p.landArea,
          ratePerYear: p.ratePerYear,
          status: p.status,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }
      });
    }

    console.log("Migrating Owner...");
    const owners = sqliteDb.prepare('SELECT * FROM Owner').all();
    for (const o of owners) {
      await prisma.owner.create({
        data: {
          id: o.id,
          propertyId: o.propertyId,
          name: o.name,
          phone: o.phone,
          email: o.email,
          address: o.address,
          createdAt: new Date(o.createdAt),
          updatedAt: new Date(o.updatedAt)
        }
      });
    }

    console.log("Migrating Invoice...");
    const invoices = sqliteDb.prepare('SELECT * FROM Invoice').all();
    for (const i of invoices) {
      await prisma.invoice.create({
        data: {
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          fiscalYear: i.fiscalYear,
          propertyId: i.propertyId,
          amount: i.amount,
          arrears: i.arrears,
          interest: i.interest,
          commonFee: i.commonFee,
          parkingFee: i.parkingFee,
          dueDate: new Date(i.dueDate),
          status: i.status,
          createdAt: new Date(i.createdAt),
          updatedAt: new Date(i.updatedAt)
        }
      });
    }

    console.log("Migrating Payment...");
    const payments = sqliteDb.prepare('SELECT * FROM Payment').all();
    for (const p of payments) {
      await prisma.payment.create({
        data: {
          id: p.id,
          invoiceId: p.invoiceId,
          amount: p.amount,
          paymentMethod: p.paymentMethod,
          referenceNumber: p.referenceNumber,
          slipUrl: p.slipUrl,
          receiptNumber: p.receiptNumber,
          paymentDate: new Date(p.paymentDate),
          notes: p.notes,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }
      });
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
    sqliteDb.close();
  }
}

migrate();
