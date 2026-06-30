import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || ''; // Changed from SUPABASE_ANON_KEY to SUPABASE_KEY to match .env
const supabase = createClient(supabaseUrl, supabaseKey);

async function resetData() {
  try {
    console.log("Starting system reset...");

    // 1. Delete all payments
    console.log("1. Deleting all payments...");
    const deletePayments = await prisma.payment.deleteMany({});
    console.log(`-> Deleted ${deletePayments.count} payments.`);
    
    // 2. Reset Invoice status
    console.log("2. Resetting all invoices to default status...");
    const updateInvoices = await prisma.invoice.updateMany({
      data: {
        status: "รอแจ้งค่าส่วนกลาง"
      }
    });
    console.log(`-> Reset ${updateInvoices.count} invoices.`);

    // 3. Delete files from Supabase bucket
    console.log("3. Deleting all files in Supabase 'slips' bucket...");
    const { data: files, error: listError } = await supabase.storage.from('slips').list();
    
    if (listError) {
      console.error("Error listing files:", listError.message);
    } else if (files && files.length > 0) {
      // Supabase list() returns an array of FileObject, but we need to remove the placeholder (.emptyFolderPlaceholder) if it exists, 
      // or we can just delete everything.
      const fileNames = files.filter(f => f.name !== '.emptyFolderPlaceholder').map(x => x.name);
      
      if (fileNames.length > 0) {
        const { error: deleteError } = await supabase.storage.from('slips').remove(fileNames);
        if (deleteError) {
          console.error("Error deleting files:", deleteError.message);
        } else {
          console.log(`-> Deleted ${fileNames.length} files from Supabase.`);
        }
      } else {
        console.log("-> No actual files to delete in Supabase bucket.");
      }
    } else {
      console.log("-> No files found in Supabase bucket.");
    }
    
    console.log("Database reset completed successfully!");
    
  } catch (error) {
    console.error("Reset failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetData();
