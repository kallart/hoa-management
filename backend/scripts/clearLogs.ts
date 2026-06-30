import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });
const prisma = new PrismaClient();

async function clearLogs() {
  try {
    const deletedActivityLogs = await prisma.activityLog.deleteMany({});
    console.log(`Deleted ${deletedActivityLogs.count} activity logs.`);
    
    const deletedAuditLogs = await prisma.auditLog.deleteMany({});
    console.log(`Deleted ${deletedAuditLogs.count} audit logs.`);
  } catch (error) {
    console.error("Delete failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearLogs();
