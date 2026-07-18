const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/BatchPrintReceipts.tsx', 'utf8');

const anchor = 'const today = new Date(payment.updatedAt || new Date()).toLocaleDateString(\'th-TH\', {';

const replacement = `
  const invoice = payment.invoice;
  const isFullPayment = !payment.receiptNumber?.includes('-PM');
  let remainingBalance = invoice.amount - payment.amount;
  if (!isFullPayment && allPayments.length > 0) {
    const invoicePayments = allPayments
      .filter(p => p.invoice?.invoiceNumber === invoice.invoiceNumber)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let totalPaidUpToThis = 0;
    for (const p of invoicePayments) {
      if (p.receiptNumber && new Date(p.createdAt).getTime() <= new Date(payment.createdAt).getTime()) {
        totalPaidUpToThis += p.amount;
      }
    }
    remainingBalance = invoice.amount - totalPaidUpToThis;
  }

  const previousPayments = allPayments
    .filter(p => p.invoice?.invoiceNumber === invoice.invoiceNumber && new Date(p.createdAt).getTime() < new Date(payment.createdAt).getTime())
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  ${anchor}
`;

content = content.replace(anchor, replacement);
fs.writeFileSync('frontend/src/pages/BatchPrintReceipts.tsx', content);
