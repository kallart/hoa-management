import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Printer, ArrowLeft } from 'lucide-react';
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

const BatchPrintInvoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceDetailType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllInvoices = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/invoices');
        // Sort by house number
        const sorted = response.data.sort((a: any, b: any) => 
          a.property.houseNumber.localeCompare(b.property.houseNumber, undefined, {numeric: true})
        );
        setInvoices(sorted);
      } catch (error) {
        console.error('Failed to fetch invoices', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllInvoices();
  }, []);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Batch_Invoices_Print`;
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

  if (loading) return <div className="page-container" style={{ padding: '40px', textAlign: 'center' }}>กำลังโหลดข้อมูลใบแจ้งหนี้ทั้งหมด...</div>;

  return (
    <div className="page-container invoice-page-container" style={{ backgroundColor: '#F3F4F6', position: 'relative', overflowY: 'auto', minHeight: '100vh', padding: '20px 0' }}>
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
          .page-break {
            page-break-after: always;
          }
          .page-break:last-child {
            page-break-after: auto;
          }
        }
      `}</style>
      
      {/* Floating Action Buttons */}
      <div className="print-hide" style={{
        position: 'fixed',
        right: '25px',
        top: '25px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 100
      }}>
        <button onClick={() => navigate('/invoices')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '70px', height: '70px', backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', color: '#4B5563' }}>
          <ArrowLeft size={22} />
          <span style={{ fontSize: '0.75rem', marginTop: '6px', fontWeight: 'bold' }}>หน้าหลัก</span>
        </button>
        
        <button onClick={handlePrint} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '70px', height: '70px', backgroundColor: 'var(--color-primary)', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', color: 'white' }}>
          <Printer size={22} />
          <span style={{ fontSize: '0.75rem', marginTop: '6px', fontWeight: 'bold' }}>สั่งพิมพ์ทั้งหมด</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div className="print-hide" style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: 'bold', color: '#374151' }}>
          แสดงใบแจ้งค่าส่วนกลางทั้งหมด {invoices.length} รายการ (พิมพ์ 1 หน้าต่อ 1 บ้าน)
        </div>

        {invoices.map((invoice: any, idx: number) => {
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
            <div key={invoice.id} className="page-break" style={{
              width: '794px',
              minHeight: '1123px',
              backgroundColor: 'white',
              padding: '70px 50px 40px 50px',
              color: 'black',
              boxSizing: 'border-box',
              fontFamily: '"Noto Sans Thai", "Kanit", sans-serif',
              marginBottom: '40px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}>
              {/* Header Section */}
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid black', padding: '0 20px', borderRadius: '4px', marginBottom: '6px', height: '40px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.35rem', whiteSpace: 'nowrap', fontFamily: '"Noto Sans Thai", sans-serif', fontStretch: '68%', fontVariationSettings: '"wdth" 68, "wght" 700' }}>ใบแจ้งค่าส่วนกลาง</div>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '20px' }}>
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
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0px', fontSize: '1.05rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#E5E7EB', borderBottom: '1px solid black' }}>
                    <th style={{ padding: '8px', textAlign: 'center', width: '35px' }}>ลำดับ</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>รายการ</th>
                    <th style={{ padding: '8px', textAlign: 'center', width: '100px', whiteSpace: 'nowrap' }}>พื้นที่ (ตร.ว.)</th>
                    <th style={{ padding: '8px', textAlign: 'center', width: '140px' }}>ราคาต่อหน่วย</th>
                    <th style={{ padding: '8px', textAlign: 'right', width: '120px' }}>จำนวนเงิน</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItemsFixed.map((item, index) => (
                    <tr key={index} style={{ height: index === invoiceItemsFixed.length - 1 ? '20px' : '40px', borderBottom: index < 3 ? '1px dashed #E5E7EB' : 'none' }}>
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
                  ({bahttext(Math.round(invoice.amount * 100) / 100)})
                </AutoShrinkText>
                <div style={{ width: '146px', padding: '10px 15px', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem', borderLeft: '1px solid #D1D5DB' }}>
                  รวมเป็นเงิน
                </div>
                <div style={{ width: '140px', padding: '10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: 'bold', fontSize: '1.2rem', borderLeft: '1px solid #D1D5DB' }}>
                  {(Math.round(invoice.amount * 100) / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              </div>

              {/* Footer: Bank Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Top Row: Bank Info */}
                <div style={{ border: '2px solid #D1D5DB', borderRadius: '12px', padding: '10px 15px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: '"Noto Sans Thai", sans-serif', fontStretch: '68%' }}>
                  <div style={{ textAlign: 'center', fontSize: '1.3rem', lineHeight: '1.3', fontVariationSettings: '"wdth" 68, "wght" 400' }}>
                    กรุณาโอนเงินเข้าบัญชี <span style={{ fontVariationSettings: '"wdth" 68, "wght" 700' }}>ธนาคาร กสิกรไทย</span> สาขาเดอะมอลล์บางแค ชื่อบัญชี
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '1.56rem', lineHeight: '1.3', marginTop: '10px', whiteSpace: 'nowrap', fontVariationSettings: '"wdth" 68, "wght" 700' }}>
                    “นิติบุคคลหมู่บ้านจัดสรร รอยัลราชาวดี” <span style={{ fontVariationSettings: '"wdth" 68, "wght" 400' }}>&nbsp;&nbsp;เลขที่ </span>751-2-02222-3
                  </div>
                </div>
                
                {/* Bottom Row: Notes & QR Code */}
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  {/* Notes */}
                  <div style={{ padding: '0 15px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', left: '-20px', top: '-10px', zIndex: 10, overflow: 'visible', marginRight: '-90px' }}>
                    <ul style={{ listStyleType: 'disc', padding: 0, paddingLeft: '20px', margin: 0, lineHeight: '1.4', fontSize: '1.05rem', whiteSpace: 'nowrap', fontFamily: '"Noto Sans Thai", sans-serif', fontStretch: '68%', fontVariationSettings: '"wdth" 68, "wght" 450' }}>
                      <li style={{ marginBottom: '3px' }}>กรุณาชำระเงินเต็มจำนวน ภายในวันที่กำหนด หากชำระเกินจากกำหนดนี้ <b style={{ fontVariationSettings: '"wdth" 68, "wght" 700' }}>จะมีค่าปรับล่าช้า 2 % ต่อเดือน</b></li>
                      <li style={{ marginBottom: '3px' }}>โปรดส่ง สลิปการโอนเงิน และแจ้งเลขที่บ้าน มาที่ <b style={{ fontVariationSettings: '"wdth" 68, "wght" 700' }}>Line ID: niti_rachawadee</b> หรือส่งที่ไลน์กลุ่มข่าวสาร</li>
                      <li>นิติบุคคลฯ จะจัดส่งใบเสร็จรับเงินให้ ณ วันสิ้นเดือน ของเดือนที่ท่านโอนชำระเงินเข้ามา</li>
                    </ul>
                  </div>
                  
                  {/* Line QR Code */}
                  <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', left: '20px' }}>
                    <img src="/niti_rachawadee.jpg" alt="Line QR" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
                    <div style={{ fontSize: '0.85rem', textAlign: 'center', marginTop: '3px', lineHeight: '1.2', fontFamily: '"Noto Sans Thai", sans-serif', fontStretch: '68%', fontVariationSettings: '"wdth" 68, "wght" 600', position: 'relative', zIndex: 1 }}>แจ้งการโอนเงิน/ส่งสลิป</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BatchPrintInvoices;
