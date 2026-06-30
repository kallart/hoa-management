import * as xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const filePath = "C:\\Users\\royal\\OneDrive\\Desktop\\CAM 2026\\CAM ROYAL RACHAWADEE 2026.xlsx";

async function importData() {
  console.log('Starting data import from Excel...');
  
  // Clear existing data
  console.log('Clearing existing records...');
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.owner.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.setting.deleteMany({});

  // Setup basic settings
  await prisma.setting.create({
    data: {
      villageName: 'หมู่บ้านรอยัลราชาวดี',
      commonAreaRate: 42.0, // 42 Baht/Sq.w/Month
    }
  });

  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // 2026
  const worksheet = workbook.Sheets[sheetName];
  const rows: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  let count = 0;
  let billedTotal = 0;
  let paidTotal = 0;

  // Data starts at row 5 (index 4)
  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    
    // Stop if we hit an empty row or no house number
    if (!row || row.length === 0 || !row[1]) continue;

    const houseNumber = String(row[1]).trim();
    const ownerName = row[3] ? String(row[3]).trim() : 'ไม่ระบุชื่อ';

    if (houseNumber === 'รวม' || houseNumber === 'Total' || ownerName.includes('สโมสร') || houseNumber === '405') continue;
    const landArea = parseFloat(row[4]) || 0;
    
    // Column 9 is the total billed amount
    const invoiceAmount = parseFloat(row[9]) || 0;
    // Column 10 is the paid amount
    const paidAmount = parseFloat(row[10]) || 0;
    // Column 11 is the payment date (could be empty or a string)
    // Column 12 is Invoice No
    const invoiceNoStr = row[12] ? String(row[12]) : `INV-2026-${String(count+1).padStart(4, '0')}`;

    // Breakdown columns
    const arrears = parseFloat(row[5]) || 0;
    const interest = parseFloat(row[6]) || 0;
    const commonFee = parseFloat(row[7]) || 0;
    const parkingFee = parseFloat(row[8]) || 0;

    const plot = row[2] ? String(row[2]).trim() : null;

    // 1. Create Property
    const property = await prisma.property.create({
      data: {
        houseNumber,
        plot,
        landArea,
        ratePerYear: invoiceAmount,
        status: 'active'
      }
    });

    // 2. Create Owner
    await prisma.owner.create({
      data: {
        propertyId: property.id,
        name: ownerName,
      }
    });

    // 3. Create Invoice if amount > 0
    if (invoiceAmount > 0) {
      let status = 'unpaid';
      if (paidAmount >= invoiceAmount) status = 'paid';
      else if (paidAmount > 0) status = 'partial';

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: invoiceNoStr,
          fiscalYear: 2026,
          propertyId: property.id,
          amount: invoiceAmount,
          arrears: arrears,
          interest: interest,
          commonFee: commonFee,
          parkingFee: parkingFee,
          dueDate: new Date('2026-07-31T23:59:59Z'), // Assuming July end
          status: status
        }
      });
      billedTotal += invoiceAmount;

      // 4. Create Payment if paidAmount > 0
      if (paidAmount > 0) {
        let paymentDate = new Date();
        // Try parsing row[11] if possible, else use today
        
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: paidAmount,
            paymentMethod: 'transfer',
            paymentDate: paymentDate,
            notes: row[14] ? String(row[14]) : 'Imported from Excel',
          }
        });
        paidTotal += paidAmount;
      }
    }
    
    count++;
  }

  console.log(`Import completed successfully!`);
  console.log(`Total properties imported: ${count}`);
  console.log(`Total Billed: ${billedTotal.toLocaleString()}`);
  console.log(`Total Paid: ${paidTotal.toLocaleString()}`);
}

importData()
  .catch((e) => {
    console.error('Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
