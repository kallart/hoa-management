import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Search, Printer, X, Image as ImageIcon } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  receiptNumber: string | null;
  slipUrl?: string | null;
  createdAt?: string;
  invoice: {
    invoiceNumber: string;
    status: string;
    property: {
      houseNumber: string;
      owner?: { name: string };
    };
  };
}

const Receipts = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewReceiptId, setViewReceiptId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [showSlipsModal, setShowSlipsModal] = useState(false);
  const [viewSlipUrl, setViewSlipUrl] = useState<string | null>(null);

  const [printedReceipts, setPrintedReceipts] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('printedReceipts');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const togglePrinted = (receiptNumber: string) => {
    setPrintedReceipts(prev => {
      const next = new Set(prev);
      if (next.has(receiptNumber)) {
        next.delete(receiptNumber);
      } else {
        next.add(receiptNumber);
      }
      localStorage.setItem('printedReceipts', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const response = await api.get('/api/payments');
        setAllPayments(response.data);
        const receiptsOnly = response.data.filter((p: Payment) => p.receiptNumber !== null);
        setPayments(receiptsOnly);
      } catch (error) {
        console.error('Failed to fetch receipts', error);
      }
    };
    fetchReceipts();
  }, []);

  const getStatusBadge = (status: string) => {
    let bgColor = 'var(--color-success)';
    if (status === 'ชำระบางส่วน' || status === 'partial') bgColor = '#8B5CF6';
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }} title={status}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: bgColor }} />
      </div>
    );
  };

  const checkStatusMatch = (p: any, status: string) => {
    if (status === '') return true;
    if (p.invoice.status === status) return true;
    if (status === 'ชำระบางส่วน' && p.invoice.status === 'ชำระบางส่วน') return true;
    if (status === 'ชำระเต็มจำนวน' && (p.invoice.status === 'paid' || p.invoice.status === 'ชำระแล้ว' || p.invoice.status === 'ออกใบเสร็จแล้ว' || p.invoice.status === 'ชำระเต็มจำนวน')) return true;
    return false;
  };

  const filtered = payments.filter(p => 
    ((p.receiptNumber && p.receiptNumber.includes(searchTerm)) ||
    p.invoice.invoiceNumber.includes(searchTerm) || 
    p.invoice.property.houseNumber.includes(searchTerm) ||
    (p.invoice.property.owner?.name && p.invoice.property.owner.name.includes(searchTerm))) &&
    checkStatusMatch(p, statusFilter)
  );

  const getTabCount = (status: string) => {
    return payments.filter(p => 
      ((p.receiptNumber && p.receiptNumber.includes(searchTerm)) ||
      p.invoice.invoiceNumber.includes(searchTerm) || 
      p.invoice.property.houseNumber.includes(searchTerm) ||
      (p.invoice.property.owner?.name && p.invoice.property.owner.name.includes(searchTerm))) &&
      checkStatusMatch(p, status)
    ).length;
  };

  const handleBatchPrint = () => {
    const unprintedIds = filtered
      .filter(p => p.receiptNumber && !printedReceipts.has(p.receiptNumber))
      .map(p => p.id);
      
    if (unprintedIds.length === 0) {
      alert('ไม่มีใบเสร็จที่ยังไม่ได้ปริ้นท์ในรายการปัจจุบัน');
      return;
    }
    
    localStorage.setItem('batchPrintReceipts', JSON.stringify(unprintedIds));
    window.open('/receipts/batch-print', '_blank');
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
      <div className="flex-between" style={{ marginBottom: '20px', flexShrink: 0 }}>
        <h1 className="h1" style={{ marginBottom: 0 }}>พิมพ์ใบเสร็จ</h1>
        <button onClick={() => setShowSlipsModal(true)} style={{ backgroundColor: '#3B82F6', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}>
          <ImageIcon size={18} /> ดูสลิปทั้งหมด
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ marginBottom: '20px', flexShrink: 0, display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-main)' }} />
              <input 
                type="text" 
                placeholder="ค้นหาเลขที่ใบเสร็จ, บ้านเลขที่..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
              {['', 'ชำระบางส่วน', 'ชำระเต็มจำนวน'].map(status => {
                const isActive = statusFilter === status;
                let statusColor = 'var(--color-primary)';
                if (status === 'ชำระบางส่วน') statusColor = '#8B5CF6';
                if (status === 'ชำระเต็มจำนวน') statusColor = 'var(--color-success)';

                return (
                <button 
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{ 
                    padding: '4px 12px', fontSize: '0.85rem', 
                    borderRadius: '20px', 
                    border: `1px solid ${isActive ? statusColor : 'var(--color-border)'}`, 
                    backgroundColor: isActive ? statusColor : 'white', 
                    color: isActive ? 'white' : 'var(--color-text-main)',
                    fontWeight: isActive ? 'bold' : 'normal',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    
                  }}
                >
                  {status || 'ทั้งหมด'} ({getTabCount(status)})
                </button>
              )})}
            </div>
          </div>
          
          <button onClick={handleBatchPrint} style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}>
            <Printer size={18} /> ปริ้นท์ทุกใบ
          </button>
        </div>

        <div className="table-responsive" style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ color: 'var(--color-text-main)' }}>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600' }}>เลขที่ใบเสร็จ</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600' }}>เลขที่บิล</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600' }}>บ้านเลขที่</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600' }}>ชื่อลูกค้า</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600', textAlign: 'right' }}>ยอดเงิน</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600' }}>ชำระวันที่</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600' }}>สถานะ</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600' }}>จัดการ</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600', textAlign: 'center' }}>พิมพ์แล้ว</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{p.receiptNumber?.replace('REC_', '')}</td>
                  <td style={{ padding: '12px 10px' }}>{p.invoice.invoiceNumber.replace('INV-', '')}</td>
                  <td style={{ padding: '12px 10px' }}>{p.invoice.property.houseNumber}</td>
                  <td style={{ padding: '12px 10px' }}>{p.invoice.property.owner?.name || '-'}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                    {p.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    {new Date(p.paymentDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    {getStatusBadge(p.invoice.status)}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <button 
                      onClick={() => setViewReceiptId(p.id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', borderRadius: '6px', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.85rem' }}
                      title="พิมพ์ใบเสร็จ"
                    >
                      <Printer size={16} />
                    </button>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={p.receiptNumber ? printedReceipts.has(p.receiptNumber) : false}
                      onChange={() => p.receiptNumber && togglePrinted(p.receiptNumber)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      title="ทำเครื่องหมายว่าพิมพ์แล้ว"
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-main)' }}>
                    ไม่พบข้อมูลใบเสร็จ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {viewReceiptId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
          <button onClick={() => setViewReceiptId(null)} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginBottom: '10px', marginRight: '5%' }}>
            <X size={32} />
          </button>
          <iframe 
            src={`/receipts/${viewReceiptId}`} 
            style={{ width: '100%', maxWidth: '900px', flex: 1, backgroundColor: 'white', border: 'none', borderRadius: '8px' }} 
            title="Receipt Print View"
          />
        </div>
      )}

      {/* All Slips Modal */}
      {showSlipsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '1200px', backgroundColor: 'white', borderRadius: '12px', padding: '20px', position: 'relative', minHeight: '500px' }}>
            <button onClick={() => setShowSlipsModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}>
              <X size={24} />
            </button>
            <h2 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary-dark)' }}>
              <ImageIcon size={24} /> คลังสลิปโอนเงินทั้งหมด
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {allPayments
                .filter(p => p.slipUrl)
                .sort((a, b) => new Date(b.createdAt || b.paymentDate).getTime() - new Date(a.createdAt || a.paymentDate).getTime())
                .map(p => (
                  <div key={p.id} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
                    <div 
                      style={{ width: '100%', height: '300px', backgroundImage: `url(${p.slipUrl?.startsWith('http') ? p.slipUrl : (import.meta.env.VITE_API_URL || 'http://localhost:3001') + p.slipUrl})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', cursor: 'zoom-in', marginBottom: '15px', borderRadius: '4px', backgroundColor: 'white', border: '1px solid #E5E7EB' }}
                      onClick={() => setViewSlipUrl(`${p.slipUrl?.startsWith('http') ? p.slipUrl : (import.meta.env.VITE_API_URL || 'http://localhost:3001') + p.slipUrl}`)}
                    />
                    <div style={{ fontSize: '0.85rem', textAlign: 'center', color: '#4B5563', width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #D1D5DB', paddingBottom: '5px', marginBottom: '5px' }}>
                        <b>บ้านเลขที่:</b> <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{p.invoice?.property?.houseNumber}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #D1D5DB', paddingBottom: '5px', marginBottom: '5px' }}>
                        <b>ยอดเงิน:</b> <span style={{ color: 'var(--color-danger)' }}>{p.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <b>วันที่โอน:</b> <span>{new Date(p.paymentDate).toLocaleDateString('th-TH')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              {allPayments.filter(p => p.slipUrl).length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#6B7280', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
                  <ImageIcon size={48} style={{ opacity: 0.5, marginBottom: '10px' }} />
                  <div>ยังไม่มีสลิปในระบบ</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Slip Image Fullscreen Modal */}
      {viewSlipUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setViewSlipUrl(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            <X size={40} />
          </button>
          <img src={viewSlipUrl} alt="Slip Fullscreen" style={{ maxWidth: '95%', maxHeight: '95vh', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
};

export default Receipts;
