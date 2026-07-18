const fs = require('fs');
const content = fs.readFileSync('src/pages/ReceiptDetail.tsx', 'utf8');

let newContent = content.replace('const ReceiptDetail = () => {', 'const BatchPrintReceipts = () => {');
newContent = newContent.replace('const { id } = useParams<{ id: string }>();', '');
newContent = newContent.replace('const [payment, setPayment] = useState<PaymentDetailType | null>(null);', 'const [payments, setPayments] = useState<PaymentDetailType[]>([]);');
newContent = newContent.replace('const [allPayments, setAllPayments] = useState<PaymentDetailType[]>([]);', 'const [loading, setLoading] = useState(true);');
newContent = newContent.replace('const [scale, setScale] = useState(1);', '');
newContent = newContent.replace(/const \[isFullscreen, setIsFullscreen\] = useState\(false\);\n?/g, '');
newContent = newContent.replace(/const isEmbedded = window\.self !== window\.top;\n?/g, '');

// Remove handleResize logic
newContent = newContent.replace(/useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);\s*useEffect\(\(\) => \{/m, 'useEffect(() => {');

// Fetch payments from IDs in localStorage
const fetchLogic = `
  useEffect(() => {
    const fetchBatch = async () => {
      try {
        const savedIds = localStorage.getItem('batchPrintReceipts');
        if (savedIds) {
          const idsToPrint = JSON.parse(savedIds);
          const response = await api.get('/api/payments');
          const receiptsOnly = response.data.filter((p: PaymentDetailType) => idsToPrint.includes(p.id));
          setPayments(receiptsOnly);
        }
      } catch (error) {
        console.error('Failed to fetch batch payments', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBatch();
  }, []);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = \`Batch_Receipts_Print\`;
    window.print();
    document.title = originalTitle;
  };
`;

newContent = newContent.replace(/useEffect\(\(\) => \{[\s\S]*?if \(!payment\) return.*?กำลังโหลดข้อมูล...<\/div>;/m, fetchLogic + '\n  if (loading) return <div className="page-container">กำลังโหลดข้อมูล...</div>;\n  if (payments.length === 0) return <div className="page-container">ไม่พบข้อมูลใบเสร็จที่เลือก</div>;\n\n  return (\n    <>\n      <style>{`\n        .slip-image-container:hover .slip-image-overlay {\n          opacity: 1 !important;\n        }\n        @media print {\n          @page {\n            size: A4 portrait;\n            margin: 0;\n          }\n          * {\n            -webkit-print-color-adjust: exact !important;\n            print-color-adjust: exact !important;\n          }\n          .no-print { display: none !important; }\n        }\n      `}</style>\n      <div className="page-container invoice-page-container" style={{ backgroundColor: \'#F3F4F6\', position: \'relative\', overflowY: \'auto\', minHeight: \'100vh\' }}>\n        {/* Floating Print Button */}\n        <div className="no-print" style={{\n          position: \'fixed\',\n          right: \'25px\',\n          bottom: \'25px\',\n          display: \'flex\',\n          gap: \'12px\',\n          zIndex: 100\n        }}>\n          <button onClick={() => window.close()} style={{ display: \'flex\', alignItems: \'center\', gap: \'8px\', backgroundColor: \'white\', border: \'1px solid #E5E7EB\', borderRadius: \'12px\', padding: \'12px 20px\', cursor: \'pointer\', boxShadow: \'0 4px 6px rgba(0,0,0,0.05)\', color: \'#4B5563\', fontWeight: \'bold\' }}>\n            <ArrowLeft size={20} /> ปิดหน้าต่าง\n          </button>\n          <button onClick={handlePrint} style={{ display: \'flex\', alignItems: \'center\', gap: \'8px\', backgroundColor: \'var(--color-primary)\', border: \'none\', borderRadius: \'12px\', padding: \'12px 20px\', cursor: \'pointer\', boxShadow: \'0 4px 6px rgba(0,0,0,0.1)\', color: \'white\', fontWeight: \'bold\' }}>\n            <Printer size={20} /> สั่งพิมพ์ทั้งหมด\n          </button>\n        </div>\n\n        {payments.map((payment, index) => {\n          const invoice = payment.invoice;\n          const rawItems = [\n            {\n              name: invoice.commonFee > 0 ? \'ค่าส่วนกลาง\' : \'\',\n              subtext: invoice.commonFee > 0 ? `${invoice.fiscalYear ? (invoice.fiscalYear+543) : \'\'}` : \'\',\n              area: invoice.commonFee > 0 ? invoice.property.landArea.toString() : \'\',\n              rate: invoice.commonFee > 0 ? (invoice.commonFee / invoice.property.landArea).toFixed(0) : \'\',\n              amount: invoice.commonFee > 0 ? invoice.commonFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : \'\'\n            },\n            {\n              name: invoice.arrears > 0 ? \'ยอดยกมา\' : \'\',\n              subtext: \'\',\n              area: \'\',\n              rate: \'\',\n              amount: invoice.arrears > 0 ? invoice.arrears.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : \'\'\n            },\n            {\n              name: invoice.interest > 0 ? \'ค่าปรับล่าช้า\' : \'\',\n              subtext: \'\',\n              area: \'\',\n              rate: \'\',\n              amount: invoice.interest > 0 ? invoice.interest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : \'\'\n            },\n            {\n              name: invoice.parkingFee > 0 ? \'ค่าที่จอดรถส่วนกลาง\' : \'\',\n              subtext: \'\',\n              area: \'\',\n              rate: \'\',\n              amount: invoice.parkingFee > 0 ? invoice.parkingFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : \'\'\n            }\n          ];\n\n          const validItems = rawItems.filter(item => item.name);\n          const invoiceItemsFixed = [\n            {\n              name: \'ยอดชำระตามใบแจ้งหนี้\',\n              subtext: invoice.invoiceNumber,\n              area: \'\',\n              rate: \'\',\n              amount: payment.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),\n              isSummary: true\n            },\n            ...validItems\n          ];\n\n          const emptyItemsNeeded = Math.max(0, 5 - invoiceItemsFixed.length);\n          for (let i = 0; i < emptyItemsNeeded; i++) {\n            invoiceItemsFixed.push({ name: \'\', amount: \'\' });\n          }\n\n          const displayReceiptNumber = payment.receiptNumber?.replace(\'REC_\', \'\') || \'-\';\n          const displayInvoiceNumber = invoice.invoiceNumber.replace(\'INV-\', \'\');\n\n          return (\n            <div key={payment.id} className="page-break" style={{\n              width: \'794px\',\n              minHeight: \'1123px\',\n              backgroundColor: \'white\',\n              margin: \'0 auto 40px auto\',\n              position: \'relative\',\n              boxShadow: \'0 4px 10px rgba(0,0,0,0.1)\',\n              pageBreakAfter: \'always\'\n            }}>\n              <div style={{\n                width: \'100%\',\n                height: \'100%\',\n                padding: \'70px 50px 40px 50px\',\n                color: \'black\',\n                boxSizing: \'border-box\',\n                fontFamily: \'"Noto Sans Thai", "Kanit", sans-serif\'\n              }}>\n');

newContent = newContent.replace(/export default ReceiptDetail;/g, 'export default BatchPrintReceipts;');

// Remove the end of the return statement from ReceiptDetail
newContent = newContent.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/>\s*\);\s*}\s*export default BatchPrintReceipts;/, '</div></div></div>)\n        })}\n      </div>\n    </>\n  );\n};\nexport default BatchPrintReceipts;');

fs.writeFileSync('src/pages/BatchPrintReceipts.tsx', newContent);
console.log('BatchPrintReceipts.tsx generated!');
