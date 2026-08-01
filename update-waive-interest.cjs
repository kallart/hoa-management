const fs = require('fs');

const filesToUpdate = [
  'frontend/src/pages/InvoiceDetail.tsx',
  'frontend/src/pages/BatchPrintInvoices.tsx',
  'frontend/src/pages/ReceiptDetail.tsx',
  'frontend/src/pages/BatchPrintReceipts.tsx',
  'frontend/src/pages/BatchPrintReceipts_backup.tsx',
  'frontend/src/pages/InvoiceDetail.backup.tsx'
];

filesToUpdate.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Add isInterestWaived to Invoice interface if it exists
  content = content.replace(/interest: number;/g, 'interest: number;\n  isInterestWaived?: boolean;');

  // Handle invoice.interest > 0 logic in Receipt and Invoice detail
  // Specifically look for `name: invoice.interest > 0 ? 'ดอกเบี้ยยอดค้างชำระ' : ''`
  content = content.replace(/name: invoice.interest > 0 \? 'ดอกเบี้ยยอดค้างชำระ' : ''/g, "name: invoice.interest > 0 ? (invoice.isInterestWaived ? 'ดอกเบี้ยยอดค้างชำระ (ได้รับการยกเว้น)' : 'ดอกเบี้ยยอดค้างชำระ') : ''");
  content = content.replace(/name: invoice.interest > 0 \? 'ดอกเบี้ยค้างชำระ' : ''/g, "name: invoice.interest > 0 ? (invoice.isInterestWaived ? 'ดอกเบี้ยค้างชำระ (ได้รับการยกเว้น)' : 'ดอกเบี้ยค้างชำระ') : ''");

  // Handle amount
  content = content.replace(/amount: invoice.interest > 0 \? invoice.interest.toLocaleString\([^)]+\) : ''/g, "amount: invoice.interest > 0 ? (invoice.isInterestWaived ? '0.00' : invoice.interest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})) : ''");

  // Handle BatchPrintReceipts array push
  // if (invoice.interest > 0) validItems.push({ name: 'ดอกเบี้ยค้างชำระ', amount: invoice.interest.toLocaleString(...) });
  content = content.replace(/if \(invoice.interest > 0\) validItems.push\(\{ name: 'ดอกเบี้ยค้างชำระ', amount: invoice.interest.toLocaleString\([^)]+\) \}\);/g, "if (invoice.interest > 0) validItems.push({ name: invoice.isInterestWaived ? 'ดอกเบี้ยค้างชำระ (ได้รับการยกเว้น)' : 'ดอกเบี้ยค้างชำระ', amount: invoice.isInterestWaived ? '0.00' : invoice.interest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) });");
  content = content.replace(/if \(invoice.interest > 0\) validItems.push\(\{ name: 'ดอกเบี้ยยอดค้างชำระ', amount: invoice.interest.toLocaleString\([^)]+\) \}\);/g, "if (invoice.interest > 0) validItems.push({ name: invoice.isInterestWaived ? 'ดอกเบี้ยยอดค้างชำระ (ได้รับการยกเว้น)' : 'ดอกเบี้ยยอดค้างชำระ', amount: invoice.isInterestWaived ? '0.00' : invoice.interest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) });");


  fs.writeFileSync(file, content);
});
