const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.aitnaalqfpzbggbcsqqc:Phutthabucha_39@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
    }
  }
});

async function exportBackup() {
  try {
    console.log('Exporting all data from Supabase...');
    const properties = await prisma.property.findMany({ include: { owner: true } });
    const invoices = await prisma.invoice.findMany({ include: { payments: true } });
    const payments = await prisma.payment.findMany();
    const settings = await prisma.setting.findMany();
    const logs = await prisma.activityLog.findMany();

    const backupData = {
      exportedAt: new Date().toISOString(),
      counts: {
        properties: properties.length,
        invoices: invoices.length,
        payments: payments.length,
        settings: settings.length,
        logs: logs.length
      },
      data: {
        properties,
        invoices,
        payments,
        settings,
        logs
      }
    };

    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const timestampedFile = path.join(backupDir, `database_backup_${todayStr}.json`);
    const latestFile = path.join(backupDir, 'latest_backup.json');

    fs.writeFileSync(timestampedFile, JSON.stringify(backupData, null, 2), 'utf8');
    fs.writeFileSync(latestFile, JSON.stringify(backupData, null, 2), 'utf8');

    console.log(`Successfully exported backup to:`);
    console.log(`- ${timestampedFile}`);
    console.log(`- ${latestFile}`);
    console.log(`Data summary: ${properties.length} properties, ${invoices.length} invoices, ${payments.length} payments.`);
  } catch (err) {
    console.error('Export failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

exportBackup();
