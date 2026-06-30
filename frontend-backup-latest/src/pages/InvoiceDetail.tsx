import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Printer, ArrowLeft, ChevronLeft, ChevronRight, Download, ZoomIn, X } from 'lucide-react';
// Removed html-to-image to rely on native print
import { bahttext } from 'bahttext';
import { LogoSVG } from '../components/LogoSVG';
import { AutoShrinkText } from '../components/AutoShrinkText';

interface InvoiceDetailType {
  id: string;
  invoiceNumber: string;
  amount: number;
  arrears: number;
  interest: number;
  commonFee: number;
  parkingFee: number;
  dueDate: string;
  status: string;
  property: {
    houseNumber: string;
    plot: string | null;
    landArea: number;
    owner?: {
      name: string;
    };
  };
}

const InvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceDetailType | null>(null);
  const [allInvoices, setAllInvoices] = useState<InvoiceDetailType[]>([]);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isEmbedded = false;

  useEffect(() => {
    const handleResize = () => {
      const availableWidth = window.innerWidth - (isEmbedded ? 40 : 120); 
      const scaleWidth = availableWidth / 794; // A4 Portrait width
      
      // Scale by width to fill the screen horizontally, allowing vertical scroll
      setScale(Math.min(scaleWidth, 1.5));
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isEmbedded]);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/invoices/${id}`);
        setInvoice(response.data);
      } catch (error) {
        console.error('Failed to fetch invoice', error);
      }
    };
    fetchInvoice();
  }, [id]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/invoices');
        setAllInvoices(response.data);
      } catch (error) {
        console.error('Failed to fetch all invoices', error);
      }
    };
    fetchAll();
  }, []);

  const currentIndex = allInvoices.findIndex(inv => String(inv.id) === String(id));
  const prevInvoice = currentIndex > 0 ? allInvoices[currentIndex - 1] : null;
  const nextInvoice = currentIndex >= 0 && currentIndex < allInvoices.length - 1 ? allInvoices[currentIndex + 1] : null;

  if (!invoice) return <div className="page-container">กำลังโหลดข้อมูล...</div>;

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Invoice_${invoice.invoiceNumber}`;
    window.print();
    document.title = originalTitle;
  };

  const handleSavePdf = () => {
    const originalTitle = document.title;
    document.title = `Invoice_${invoice.invoiceNumber}`;
    window.print();
    document.title = originalTitle;
  };
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  const today = new Date().toLocaleDateString('th-TH', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const fy = invoice.fiscalYear || 2026;
  const thYear = fy + 543;
  const shortYear = thYear.toString().slice(-2);
  const nextShortYear = (thYear + 1).toString().slice(-2);

  const rawItems = [
    {
      name: `ค่าส่วนกลาง ปี ${thYear}`,
      subtext: `ก.ค.${shortYear} - มิ.ย.${nextShortYear} = (${invoice.property.landArea.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} x 42 x 12)`,
      area: invoice.property.landArea.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
      rate: '42.00',
      amount: invoice.commonFee > 0 ? invoice.commonFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''
    },
    {
      name: invoice.arrears > 0 ? 'ค้างชำระจากปีก่อน' : '',
      subtext: '',
      area: '',
      rate: '',
      amount: invoice.arrears > 0 ? invoice.arrears.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''
    },
    {
      name: invoice.interest > 0 ? 'ดอกเบี้ยยอดค้างชำระ' : '',
      subtext: invoice.interest > 0 ? `${invoice.arrears.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} x 2% x 12` : '',
      area: '',
      rate: '',
      amount: invoice.interest > 0 ? invoice.interest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''
    },
    {
      name: invoice.parkingFee > 0 ? 'ค่าที่จอดรถส่วนกลาง' : '',
      subtext: invoice.parkingFee > 0 ? `ก.ค. ${shortYear} - มิ.ย. ${nextShortYear}` : '',
      area: '',
      rate: invoice.parkingFee > 0 ? '200.00' : '',
      amount: invoice.parkingFee > 0 ? invoice.parkingFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''
    }
  ];
  
  const validItems = rawItems.filter(item => item.name);
  const emptyItemsNeeded = Math.max(0, 4 - validItems.length);
  const invoiceItemsFixed = [
    ...validItems,
    ...Array(emptyItemsNeeded).fill({ name: '', subtext: '', area: '', rate: '', amount: '' })
  ];

  return (
    <div className="page-container invoice-page-container" style={{ backgroundColor: '#F3F4F6', position: 'relative' }}>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      <div className="print-hide" style={{
        position: 'fixed',
        right: '25px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 100
      }}>
        <button onClick={() => navigate('/invoices')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '70px', height: '70px', backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', color: '#4B5563' }}>
          <ArrowLeft size={22} />
          <span style={{ fontSize: '0.75rem', marginTop: '6px', fontWeight: 'bold' }}>หน้าหลัก</span>
        </button>


        
        {prevInvoice && (
          <button onClick={() => navigate(`/invoices/${prevInvoice.id}`)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '70px', height: '70px', backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', color: '#4B5563' }}>
            <ChevronLeft size={22} />
            <span style={{ fontSize: '0.75rem', marginTop: '6px', fontWeight: 'bold' }}>ก่อนหน้า</span>
          </button>
        )}
        
        {nextInvoice && (
          <button onClick={() => navigate(`/invoices/${nextInvoice.id}`)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '70px', height: '70px', backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', color: '#4B5563' }}>
            <ChevronRight size={22} />
            <span style={{ fontSize: '0.75rem', marginTop: '6px', fontWeight: 'bold' }}>ถัดไป</span>
          </button>
        )}
        
        <button onClick={handleSavePdf} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '70px', height: '70px', backgroundColor: '#10B981', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)', color: 'white' }}>
          <Download size={22} />
          <span style={{ fontSize: '0.75rem', marginTop: '6px', fontWeight: 'bold' }}>เซฟ PDF</span>
        </button>
        
        <button onClick={handlePrint} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '70px', height: '70px', backgroundColor: 'var(--color-primary)', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', color: 'white' }}>
          <Printer size={22} />
          <span style={{ fontSize: '0.75rem', marginTop: '6px', fontWeight: 'bold' }}>สั่งพิมพ์</span>
        </button>
      </div>

      {isFullscreen && (
        <>
          <button className="print-hide" onClick={() => setIsFullscreen(false)} style={{ position: 'fixed', top: '25px', right: '35px', zIndex: 10001, backgroundColor: 'white', border: 'none', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
            <X size={28} color="#EF4444" />
          </button>
          
          {prevInvoice && (
            <button className="print-hide" onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${prevInvoice.id}`); }} style={{ position: 'fixed', left: '30px', top: '50%', transform: 'translateY(-50%)', zIndex: 10001, backgroundColor: 'white', border: 'none', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
              <ChevronLeft size={36} color="#4B5563" style={{ marginLeft: '-4px' }} />
            </button>
          )}

          {nextInvoice && (
            <button className="print-hide" onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${nextInvoice.id}`); }} style={{ position: 'fixed', right: '30px', top: '50%', transform: 'translateY(-50%)', zIndex: 10001, backgroundColor: 'white', border: 'none', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
              <ChevronRight size={36} color="#4B5563" style={{ marginRight: '-4px' }} />
            </button>
          )}
        </>
      )}

      <div className={`print-scale-wrapper ${isFullscreen ? 'fullscreen-active' : ''}`} style={
        isFullscreen ? {
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 10000,
          overflowY: 'auto',
          padding: '40px 20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start'
        } : { 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'flex-start',
          width: '100%',
          height: `${1123 * scale}px`,
          marginTop: isEmbedded ? '40px' : '20px',
          marginBottom: '40px'
        }
      }>
        <div className="scale-transform-wrapper" style={isFullscreen ? { display: 'flex', justifyContent: 'center', width: '100%' } : { transform: `scale(${scale})`, transformOrigin: 'top center' }}>
          <div id="invoice-print-area" onClick={() => setIsFullscreen(!isFullscreen)} style={{
            width: '794px',
            minHeight: '1123px',
            height: 'auto',
            margin: isFullscreen ? '0 auto' : '0',
            backgroundColor: 'white',
            padding: '40px 50px',
            color: 'black',
            boxSizing: 'border-box',
            fontFamily: '"Noto Sans Thai", "Kanit", sans-serif',
            cursor: isFullscreen ? 'zoom-out' : 'zoom-in',
          }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <LogoSVG style={{ height: '40px', marginTop: '-20px' }} />
                
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: '25px' }}>
                  <h1 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: '0 0 2px 0', color: 'black', whiteSpace: 'nowrap' }}>นิติบุคคลหมู่บ้านจัดสรร รอยัลราชาวดี</h1>
                  <p style={{ fontSize: '0.72rem', color: '#4B5563', margin: 0, lineHeight: '1.4' }}>
                    หมู่บ้านรอยัลราชาวดี ถนนพุทธบูชา แขวงบางมด<br/>เขตจอมทอง จ.กรุงเทพฯ 10150
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid black', padding: '0 20px', borderRadius: '4px', marginBottom: '6px', height: '40px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>ใบแจ้งค่าส่วนกลาง</div>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '30px' }}>
                  เลขที่บิล: <span style={{ color: 'red' }}>{invoice.invoiceNumber}</span>
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
              <div style={{ flex: 0.9, borderLeft: '1px solid #D1D5DB', paddingLeft: '20px' }}>
                <table style={{ width: '100%', fontSize: '0.95rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '60px', fontWeight: 'bold', paddingBottom: '6px', verticalAlign: 'top', paddingTop: '4px' }}>วันที่</td>
                      <td style={{ paddingBottom: '6px', verticalAlign: 'top', paddingTop: '4px' }} colSpan={3}>{today}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '60px', fontWeight: 'bold', paddingBottom: '6px' }}>รหัส</td>
                      <td style={{ width: '100px', paddingBottom: '6px' }}>แปลง {invoice.property.plot || '-'}</td>
                      <td style={{ width: '50px', fontWeight: 'bold', paddingBottom: '6px' }}>พื้นที่</td>
                      <td style={{ paddingBottom: '6px' }}>{invoice.property.landArea} ตร.ว.</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold' }} colSpan={2}>กรุณาชำระภายในวันที่</td>
                      <td colSpan={2}>31 กรกฏาคม 2569</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '1.05rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#E5E7EB', borderBottom: '1px solid black' }}>
                  <th style={{ padding: '8px', textAlign: 'center', width: '35px' }}>ลำดับ</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>รายการ</th>
                  <th style={{ padding: '8px', textAlign: 'center', width: '100px' }}>พื้นที่ (ตร.ว.)</th>
                  <th style={{ padding: '8px', textAlign: 'center', width: '140px' }}>ราคาต่อหน่วย</th>
                  <th style={{ padding: '8px', textAlign: 'right', width: '140px' }}>จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody>
                {invoiceItemsFixed.map((item, index) => (
                  <tr key={index} style={{ height: '40px', borderBottom: index < 3 ? '1px dashed #E5E7EB' : 'none' }}>
                    <td style={{ padding: '4px 8px', textAlign: 'center', verticalAlign: 'top' }}>{item.name ? index + 1 : ''}</td>
                    <td style={{ padding: '4px 8px', verticalAlign: 'top' }}>
                      {item.name && <div style={{ fontWeight: 'bold' }}>{item.name}</div>}
                      {item.subtext && <div style={{ fontSize: '0.95rem', color: '#4B5563', marginTop: '2px' }}>{item.subtext}</div>}
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'center', verticalAlign: 'top' }}>{item.area}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center', verticalAlign: 'top', fontWeight: item.rate ? 'bold' : 'normal' }}>{item.rate}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', verticalAlign: 'top' }}>{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Summary */}
            <div style={{ display: 'flex', borderTop: '2px solid black', borderBottom: '2px solid black', marginBottom: '15px' }}>
              <AutoShrinkText style={{ flex: 1, padding: '10px 15px', fontWeight: 450, fontFamily: '"Noto Sans Thai", sans-serif', fontStretch: '68%', fontVariationSettings: '"wdth" 68, "wght" 450', fontSize: '1.26rem' }}>
                ({bahttext(invoice.amount)})
              </AutoShrinkText>
              <div style={{ width: '146px', padding: '10px 15px', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem', borderLeft: '1px solid #D1D5DB' }}>
                รวมเป็นเงิน
              </div>
              <div style={{ width: '140px', padding: '10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: 'bold', fontSize: '1.2rem', borderLeft: '1px solid #D1D5DB' }}>
                {invoice.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>

            {/* Footer: Bank Info & QR Code */}
            <div style={{ display: 'flex', gap: '15px' }}>
              {/* Bank Info */}
              <div style={{ flex: 1, border: '2px solid #D1D5DB', borderRadius: '12px', padding: '12px 15px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '8px' }}>
                  กรุณาโอนเงินเข้าบัญชี ธ.กสิกรไทย สาขาเดอะมอลล์บางแค ชื่อบัญชี <br /> “นิติบุคคลหมู่บ้านจัดสรร รอยัลราชาวดี” เลขที่บัญชี 751-2-02222-3
                </div>
                <ul style={{ listStyleType: 'none', padding: 0, margin: 0, lineHeight: '1.4', fontSize: '0.75rem' }}>
                  <li style={{ display: 'flex' }}><span style={{ marginRight: '6px' }}>-</span><span>กรุณาชำระเงินเต็มจำนวน ภายในวันที่กำหนด หากชำระเกินจากกำหนดนี้ <b>จะมีค่าปรับล่าช้า 2 % ต่อเดือน</b></span></li>
                  <li style={{ display: 'flex' }}><span style={{ marginRight: '6px' }}>-</span><span>โปรดส่ง SMS แจ้งเลขที่บ้าน ยอดเงิน และวันที่โอน มาที่ <b>โทร. 087 675 3680</b><br/> หรือ <b>Line ID: niti_rachawadee</b> หรือส่งที่ไลน์กลุ่มข่าวสาร</span></li>
                  <li style={{ display: 'flex' }}><span style={{ marginRight: '6px' }}>-</span><span>นิติบุคคลฯ จะจัดส่งใบเสร็จรับเงินให้ ณ วันสิ้นเดือน ของเดือนที่ท่านโอนชำระเงินเข้ามา</span></li>
                </ul>
              </div>
              
              {/* QR Code */}
              <div style={{ width: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '120px', height: '120px', border: '2px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '5px' }}>
                  qr code
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                  QR code ชำระเงิน
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
