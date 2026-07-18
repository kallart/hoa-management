const fs = require('fs');

const content = fs.readFileSync('src/pages/ReceiptDetail.tsx', 'utf8');

// Find the start of the A4 page div
const a4StartIndex = content.indexOf('<div id="receipt-print-area"');
if (a4StartIndex === -1) {
  console.error("Could not find <div id=\"receipt-print-area\"");
  process.exit(1);
}

// Extract everything from a4StartIndex to the end of that div
let a4Content = content.substring(a4StartIndex);
// Find the end of this div manually since it's hard with regex. 
// It ends at:
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };
const endMarker = '          </div>\n        </div>\n      </div>\n    </>\n  );\n};';
const endIdx = a4Content.indexOf(endMarker);
if (endIdx !== -1) {
    a4Content = a4Content.substring(0, endIdx);
    // There are 3 closing divs we need to keep from the end of a4Content
    // Let's just find the last </div> in what we extracted
    const lastDivIdx = a4Content.lastIndexOf('</div>');
    if (lastDivIdx !== -1) {
        // We only want the closing div for the receipt-print-area
        // In ReceiptDetail.tsx, the structure is:
        // <div id="receipt-print-area">
        //   ...
        //   <div className="no-print"> ... </div>
        // </div> // <- this is the one we want
        // Let's just split by '</div>\n          </div>\n        </div>'
    }
}

// Let's do a much safer extraction:
const lines = content.split('\n');
let insideA4 = false;
let a4Lines = [];
let divDepth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('<div id="receipt-print-area"')) {
    insideA4 = true;
  }
  
  if (insideA4) {
    a4Lines.push(line);
    const openDivs = (line.match(/<div/g) || []).length;
    const closeDivs = (line.match(/<\/div>/g) || []).length;
    divDepth += openDivs - closeDivs;
    
    if (divDepth === 0 && a4Lines.length > 0) {
      break;
    }
  }
}

const finalA4Html = a4Lines.join('\n');

const imports = content.substring(0, content.indexOf('interface PaymentDetailType'));
const iface = content.substring(content.indexOf('interface PaymentDetailType'), content.indexOf('const ReceiptDetail = () => {'));

const startOfLogic = '  const invoice = payment.invoice;';
const endOfLogic = '  const displayInvoiceNumber = invoice.invoiceNumber.replace(\'INV-\', \'\');';

let logicBlock = content.substring(content.indexOf(startOfLogic), content.indexOf(endOfLogic) + endOfLogic.length);
logicBlock = logicBlock.replace(/const isFullPayment = [\s\S]*?remainingBalance = invoice\.amount - totalPaidUpToThis;\n  }/m, '');
logicBlock = logicBlock.replace(/const previousPayments = [\s\S]*?getTime\(\) - new Date\(b\.createdAt\)\.getTime\(\)\);/m, '');
logicBlock = logicBlock.replace(/const handlePrint = [\s\S]*?};/m, '');
logicBlock = logicBlock.replace(/const handleSavePdf = [\s\S]*?};/m, '');


const newComponent = `
${imports}
${iface}

const BatchPrintReceipts = () => {
  const [payments, setPayments] = useState<PaymentDetailType[]>([]);
  const [loading, setLoading] = useState(true);

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
    document.title = 'Batch_Receipts_Print';
    window.print();
    document.title = originalTitle;
  };

  if (loading) return <div className="page-container">กำลังโหลดข้อมูล...</div>;
  if (payments.length === 0) return <div className="page-container">ไม่พบข้อมูลใบเสร็จที่เลือก</div>;

  return (
    <>
      <style>{\`
        .slip-image-container:hover .slip-image-overlay {
          opacity: 1 !important;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
        }
      \`}</style>
      <div className="page-container invoice-page-container" style={{ backgroundColor: '#F3F4F6', position: 'relative', overflowY: 'auto', minHeight: '100vh' }}>
        <div className="no-print" style={{
          position: 'fixed',
          right: '25px',
          bottom: '25px',
          display: 'flex',
          gap: '12px',
          zIndex: 100
        }}>
          <button onClick={() => window.close()} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px 20px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', color: '#4B5563', fontWeight: 'bold' }}>
            <ArrowLeft size={20} /> ปิดหน้าต่าง
          </button>
          <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-primary)', border: 'none', borderRadius: '12px', padding: '12px 20px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', color: 'white', fontWeight: 'bold' }}>
            <Printer size={20} /> สั่งพิมพ์ทั้งหมด
          </button>
        </div>

        {payments.map((payment, index) => {
          ${logicBlock}
          return (
            <div key={payment.id} className="page-break" style={{
              width: '794px',
              minHeight: '1123px',
              backgroundColor: 'white',
              margin: '0 auto 40px auto',
              position: 'relative',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              pageBreakAfter: 'always'
            }}>
              ${finalA4Html.replace(/scale\)/g, '1)')}
            </div>
          );
        })}
      </div>
    </>
  );
};
export default BatchPrintReceipts;
`;

fs.writeFileSync('src/pages/BatchPrintReceipts.tsx', newComponent);
console.log('Successfully generated BatchPrintReceipts.tsx');
