
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Printer, ArrowLeft, ChevronLeft, ChevronRight, Download, ZoomIn, X, Copy } from 'lucide-react';
import { bahttext } from 'bahttext';
import { LogoSVG } from '../components/LogoSVG';
import { AutoShrinkText } from '../components/AutoShrinkText';


interface PaymentDetailType {
  id: string;
  amount: number;
  paymentDate: string;
  createdAt: string; updatedAt: string;
  paymentMethod: string;
  receiptNumber: string | null; slipUrl?: string | null;
  invoice: {
    invoiceNumber: string;
    amount: number;
    arrears: number;
    interest: number;
    commonFee: number;
    parkingFee: number;
    dueDate: string;
    status: string;
    fiscalYear?: number;
    property: {
      houseNumber: string;
      plot: string | null;
      landArea: number;
      owner?: {
        name: string;
      };
    };
  };
}



const BatchPrintReceipts = () => {
  const [payments, setPayments] = useState<PaymentDetailType[]>([]);
  const [allPayments, setAllPayments] = useState<PaymentDetailType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCopy, setIsCopy] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        const savedIds = localStorage.getItem('batchPrintReceipts');
        if (savedIds) {
          const idsToPrint = JSON.parse(savedIds);
          const response = await api.get('/api/payments');
          setAllPayments(response.data);
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
      <style>{`
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
      `}</style>
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
          try {
  

  
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

  const today = new Date(payment.updatedAt || new Date()).toLocaleDateString('th-TH', {
 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const paymentDateStr = new Date(payment.paymentDate).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const paymentTimeStr = new Date(payment.paymentDate).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const fy = invoice.fiscalYear || 2026;
  const thYear = fy + 543;
  const shortYear = thYear.toString().slice(-2);
  const nextShortYear = (thYear + 1).toString().slice(-2);

  const validItems = [];
  if (invoice.commonFee > 0) validItems.push({ name: `ค่าส่วนกลาง ก.ค.${shortYear} - มิ.ย.${nextShortYear}`, amount: invoice.commonFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) });
  if (invoice.arrears > 0) validItems.push({ name: 'ค้างชำระจากปีก่อน', amount: invoice.arrears.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) });
  if (invoice.interest > 0) validItems.push({ name: 'ดอกเบี้ยค้างชำระ', amount: invoice.interest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) });
  if (invoice.parkingFee > 0) validItems.push({ name: 'ค่าที่จอดรถ', amount: invoice.parkingFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) });

  const invoiceItemsFixed: any[] = [
    {
      name: `ยอดรวมตามใบแจ้งค่าส่วนกลาง ${invoice.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท`,
      amount: payment.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
      isSummary: true
    },
    ...validItems
  ];

  const emptyItemsNeeded = Math.max(0, 5 - invoiceItemsFixed.length);
  for (let i = 0; i < emptyItemsNeeded; i++) {
    invoiceItemsFixed.push({ name: '', amount: '' });
  }

  const displayReceiptNumber = payment.receiptNumber?.replace('REC_', '') || '-';
  const displayInvoiceNumber = invoice.invoiceNumber.replace('INV-', '');
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
                        <div id="receipt-print-area" onClick={() => setIsFullscreen(!isFullscreen)} style={{
            width: '794px',
            minHeight: '1123px',
            height: isCopy ? '1123px' : 'auto',
            display: isCopy ? 'flex' : 'block',
            flexDirection: 'column',
            margin: isFullscreen ? '0 auto' : '0',
            backgroundColor: 'white',
            padding: '70px 50px 40px 50px',
            color: 'black',
            boxSizing: 'border-box',
            fontFamily: '"Noto Sans Thai", "Kanit", sans-serif',
            cursor: isFullscreen ? 'zoom-out' : 'zoom-in',
          }}>
            {/* Header Section */}
            <div style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                  <LogoSVG style={{ height: '40px', marginTop: '-20px' }} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: '25px' }}>
                    <h1 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: '0 0 2px 0', color: 'black', whiteSpace: 'nowrap' }}>นิติบุคคลหมู่บ้านจัดสรร รอยัลราชาวดี</h1>
                    <p style={{ fontSize: '0.8rem', color: '#4B5563', margin: 0, lineHeight: '1.4' }}>
                      หมู่บ้านรอยัลราชาวดี ถนนพุทธบูชา แขวงบางมด<br/>เขตจอมทอง จ.กรุงเทพฯ 10150
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start' }}>
                  <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '4px', fontWeight: 'bold' }}>
                    {isCopy ? '(สำเนา / Copy)' : '(ต้นฉบับ / Original)'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid black', padding: '0 20px', borderRadius: '4px', marginBottom: '6px', height: '40px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.35rem', whiteSpace: 'nowrap', fontFamily: '"Noto Sans Thai", sans-serif', fontStretch: '68%', fontVariationSettings: '"wdth" 68, "wght" 700' }}>
                      ใบเสร็จรับเงิน
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Invoice Ref and Receipt Number */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '3px' }}>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#6B7280' }}>
                  อ้างอิงใบแจ้งค่าส่วนกลางเลขที่: <span>{displayInvoiceNumber}</span>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  เลขที่ใบเสร็จ: <span style={{ color: 'red' }}>{displayReceiptNumber}</span>
                </div>
              </div>
            </div>

            {/* Customer Info Section */}
            <div style={{ display: 'flex', borderBottom: '2px solid black', paddingBottom: '8px', marginBottom: '0', borderTop: '2px solid black', paddingTop: '8px' }}>
              <div style={{ flex: 1.1, paddingRight: '15px' }}>
                <table style={{ width: '100%', fontSize: '0.95rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50px', verticalAlign: 'top', fontWeight: 'bold', paddingTop: '4px' }}>ชื่อ</td>
                      <td style={{ verticalAlign: 'top', paddingTop: '4px', fontSize: '1.1rem' }}>{invoice.property.owner?.name || 'ไม่ระบุชื่อ'}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: 'top', fontWeight: 'bold', paddingTop: '4px' }}>ที่อยู่</td>
                      <td style={{ verticalAlign: 'top', paddingTop: '4px' }}>
                        {invoice.property.houseNumber} หมู่บ้านรอยัลราชาวดี ถนนพุทธบูชา แขวง<br/>บางมด เขตจอมทอง จ.กรุงเทพฯ 10150
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ flex: 0.9, borderLeft: '1px solid #D1D5DB', paddingLeft: '20px', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', paddingBottom: '6px', paddingTop: '4px' }}>
                  <div style={{ fontWeight: 'bold', marginRight: '8px' }}>วันที่</div>
                  <div>{today}</div>
                </div>
                <div style={{ display: 'flex', paddingBottom: '6px' }}>
                  <div style={{ fontWeight: 'bold', marginRight: '8px' }}>รหัส</div>
                  <div style={{ width: '80px' }}>แปลง {invoice.property.plot || '-'}</div>
                  <div style={{ fontWeight: 'bold', marginRight: '8px' }}>พื้นที่</div>
                  <div style={{ whiteSpace: 'nowrap' }}>{invoice.property.landArea} ตร.ว.</div>
                </div>
                <div style={{ display: 'flex', paddingBottom: '6px' }}>
                  <div style={{ fontWeight: 'bold', marginRight: '8px' }}>วันที่รับเงิน</div>
                  <div>{paymentDateStr} {paymentTimeStr} น.</div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '1.05rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#E5E7EB', borderBottom: '1px solid black' }}>
                  <th style={{ padding: '8px', textAlign: 'center', width: '60px' }}>ลำดับ</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>รายการ</th>
                  <th style={{ padding: '8px', textAlign: 'right', width: '160px' }}>จำนวนเงินที่ชำระ</th>
                </tr>
              </thead>
              <tbody>
                {invoiceItemsFixed.map((item, index) => (
                  <tr key={index} style={{ height: '40px', borderBottom: item.isSummary ? '1px solid #D1D5DB' : '1px dashed #E5E7EB', backgroundColor: item.isSummary ? '#F3F4F6' : 'transparent' }}>
                    {item.isSummary ? (
                      <>
                        <td style={{ padding: '6px 8px' }}></td>
                        <td style={{ padding: '6px 8px', verticalAlign: 'top', fontWeight: 'bold', color: '#4B5563' }}>
                          {item.name}
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '6px 8px', textAlign: 'center', verticalAlign: 'top' }}>{item.name ? index : ''}</td>
                        <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                          {item.name && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', color: 'black' }}>
                              <span>{item.name}</span>
                              {item.amount && (
                                <span style={{ fontSize: '0.85em', color: '#9CA3AF', marginLeft: '8px', marginRight: '150px', fontWeight: 'normal', textAlign: 'right' }}>
                                  ({item.amount})
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </>
                    )}
                    <td style={{ padding: '6px 8px', textAlign: 'right', verticalAlign: 'top', fontWeight: item.isSummary ? 'bold' : 'normal' }}>
                      {item.isSummary ? item.amount : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Summary */}
            <div style={{ display: 'flex', borderTop: '2px solid black', borderBottom: '2px solid black', marginBottom: '15px' }}>
              <AutoShrinkText style={{ flex: 1, padding: '10px 15px', fontWeight: 450, fontFamily: '"Noto Sans Thai", sans-serif', fontStretch: '68%', fontVariationSettings: '"wdth" 68, "wght" 450', fontSize: '1.26rem' }}>
                ({bahttext(payment.amount)})
              </AutoShrinkText>
              <div style={{ width: '140px', padding: '10px 5px', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.05rem', whiteSpace: 'nowrap', borderLeft: '1px solid #D1D5DB' }}>
                รวมเงินรับสุทธิ
              </div>
              <div style={{ width: '160px', padding: '10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: 'bold', fontSize: '1.2rem', borderLeft: '1px solid #D1D5DB' }}>
                {payment.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>

            {/* Payment Details Footer */}
            <div style={{ marginTop: '20px', marginBottom: '10px', fontSize: '0.95rem' }}>
              <div style={{ marginBottom: '15px' }}>
                <b>รับชำระโดย</b> {
                  payment.paymentMethod === 'transfer' ? 'โอนเงินเข้าบัญชี' :
                  payment.paymentMethod === 'cash' ? 'เงินสด' :
                  payment.paymentMethod === 'cheque' ? 'เช็ค' :
                  payment.paymentMethod
                }
              </div>
              {!isFullPayment && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      ☐ ชำระเต็มจำนวน
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      ☑ ชำระบางส่วน
                    </span>
                  </div>
                  <div style={{ paddingLeft: '0', color: '#4B5563' }}>
                    ยอดเงินที่ชำระ <b style={{ color: 'black' }}>{payment.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</b> บาท 
                    {' '}(คงค้างอีก <b style={{ color: 'black' }}>{remainingBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</b> บาท)
                  </div>
                </div>
              )}
            </div>

            {previousPayments.length > 0 && (
              <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed #D1D5DB', borderBottom: '1px dashed #D1D5DB', paddingBottom: '15px', fontSize: '0.95rem' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#1F2937' }}>ประวัติการชำระเงินที่ผ่านการตรวจสอบ:</div>
                {previousPayments.map((prevPayment, index) => (
                  <div key={prevPayment.id} style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', marginBottom: '5px' }}>
                    <span>- {new Date(prevPayment.paymentDate).toLocaleDateString('th-TH')} {new Date(prevPayment.paymentDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} ใบเสร็จ {prevPayment.receiptNumber}</span>
                    <span>ชำระแล้ว {prevPayment.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</span>
                  </div>
                ))}
              </div>
            )}

            {/* Footer: Signatures instead of QR Code */}
            {!isCopy && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', padding: '0 40px', marginBottom: '40px' }}>
                <div style={{ flex: 1 }}>
                  {/* Removed Payer Signature */}
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ margin: '0 0 9px 0', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>ลงชื่อ ....................................................... ผู้ออกใบเสร็จ</p>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>(คุณนงพงา เลิศธรรมจินดา)</p>
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>ฝ่ายการเงิน</p>
                </div>
              </div>
            )}

            {/* Attached Slip Image */}
            {payment.slipUrl && (
              <div className={isCopy ? "" : "no-print"} style={{ flex: isCopy ? 1 : 'none', minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', borderTop: '1px dashed #D1D5DB', paddingTop: '15px' }}>
                <div 
                  className="slip-image-container"
                  style={{ position: 'relative', cursor: 'pointer', display: 'flex', justifyContent: 'center', height: isCopy ? '100%' : 'auto', width: '100%' }}
                  onClick={() => window.open(`${payment.slipUrl.startsWith('http') ? payment.slipUrl : (import.meta.env.VITE_API_URL || 'http://localhost:3001') + payment.slipUrl}`, '_blank')}
                  title="คลิกเพื่อดูรูปภาพขนาดเต็ม"
                >
                  <img 
                    src={`${payment.slipUrl.startsWith('http') ? payment.slipUrl : (import.meta.env.VITE_API_URL || 'http://localhost:3001') + payment.slipUrl}`} 
                    alt="Payment Slip" 
                    style={{ maxWidth: '100%', maxHeight: isCopy ? '100%' : '400px', height: isCopy ? '100%' : 'auto', objectFit: 'contain', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'block', boxSizing: 'border-box' }} 
                  />
                  <div className="slip-image-overlay" style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s ease'
                  }}>
                    <ZoomIn size={48} color="white" />
                  </div>
                </div>
              </div>
            )}

          </div>
            </div>
          );

          } catch (e) {
            return (
              <div key={payment.id} className="page-break" style={{ padding: '20px', color: 'red', backgroundColor: '#fee2e2', border: '1px solid #ef4444', margin: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>Error rendering payment {payment.id}</h3>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '14px', margin: 0 }}>
                  {e instanceof Error ? e.message + '\n' + e.stack : String(e)}
                </pre>
              </div>
            );
          }
        })}
      </div>
    </>
  );
};
export default BatchPrintReceipts;
