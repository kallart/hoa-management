import * as XLSX from 'xlsx';
import api from './api';

export const generateBackupExcel = async () => {
  try {
    const [propertiesRes, invoicesRes, paymentsRes] = await Promise.all([
      api.get('/api/properties'),
      api.get('/api/invoices'),
      api.get('/api/payments')
    ]);

    const properties = propertiesRes.data;
    const invoices = invoicesRes.data;
    const payments = paymentsRes.data;

    const wb = XLSX.utils.book_new();

    // 1. Properties Sheet
    const wsProperties = XLSX.utils.json_to_sheet(properties.map((p: any) => ({
      'บ้านเลขที่': p.houseNumber,
      'พื้นที่ (ตร.ว.)': p.landArea,
      'ค่าส่วนกลางต่อปี': p.ratePerYear,
      'ชื่อเจ้าของบ้าน': p.owner?.name || '',
      'เบอร์โทรศัพท์': p.owner?.phone || '',
      'ยอดค้างชำระสะสม': p.balance || 0,
      'สร้างเมื่อ': new Date(p.createdAt).toLocaleDateString('th-TH')
    })));
    XLSX.utils.book_append_sheet(wb, wsProperties, "ข้อมูลบ้าน");

    // 2. Invoices Sheet
    const wsInvoices = XLSX.utils.json_to_sheet(invoices.map((i: any) => ({
      'เลขที่บิล': i.invoiceNumber,
      'บ้านเลขที่': i.property?.houseNumber,
      'ค่าส่วนกลาง': i.commonFee,
      'ค่าปรับ/ดอกเบี้ย': i.interest,
      'หนี้ค้างชำระ': i.arrears,
      'ค่าที่จอดรถ': i.parkingFee,
      'ยอดรวมทั้งหมด': i.amount,
      'สถานะ': i.status,
      'วันที่ออกบิล': new Date(i.issueDate).toLocaleDateString('th-TH'),
      'วันที่ครบกำหนด': new Date(i.dueDate).toLocaleDateString('th-TH')
    })));
    XLSX.utils.book_append_sheet(wb, wsInvoices, "บิลแจ้งหนี้");

    // 3. Payments Sheet
    const wsPayments = XLSX.utils.json_to_sheet(payments.map((p: any) => ({
      'เลขที่ใบเสร็จ': p.receiptNumber || 'ยังไม่ออกใบเสร็จ',
      'อ้างอิงบิล': p.invoice?.invoiceNumber,
      'บ้านเลขที่': p.invoice?.property?.houseNumber,
      'ยอดเงิน': p.amount,
      'วันที่โอน': new Date(p.paymentDate).toLocaleDateString('th-TH'),
      'ช่องทาง': p.paymentMethod,
      'เวลาแจ้งชำระ': new Date(p.createdAt).toLocaleString('th-TH')
    })));
    XLSX.utils.book_append_sheet(wb, wsPayments, "ประวัติรับชำระ");

    // Download
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `HOA_Backup_${dateStr}.xlsx`);
    
    return true;
  } catch (error) {
    console.error("Backup failed", error);
    return false;
  }
};
