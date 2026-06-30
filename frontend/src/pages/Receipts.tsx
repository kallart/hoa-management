import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Search, Printer, X } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  receiptNumber: string | null;
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

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const response = await api.get('/api/payments');
        const receiptsOnly = response.data.filter((p: Payment) => p.receiptNumber !== null);
        setPayments(receiptsOnly);
      } catch (error) {
        console.error('Failed to fetch receipts', error);
      }
    };
    fetchReceipts();
  }, []);

  const getStatusBadge = (status: string) => {
    return <span style={{ backgroundColor: 'var(--color-success)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{status}</span>;
  };

  const filtered = payments.filter(p => 
    ((p.receiptNumber && p.receiptNumber.includes(searchTerm)) ||
    p.invoice.invoiceNumber.includes(searchTerm) || 
    p.invoice.property.houseNumber.includes(searchTerm) ||
    (p.invoice.property.owner?.name && p.invoice.property.owner.name.includes(searchTerm))) &&
    (statusFilter === '' || p.invoice.status === statusFilter || 
      (statusFilter === 'ชำระบางส่วน' && p.invoice.status === 'ชำระบางส่วน') ||
      (statusFilter === 'ชำระเต็มจำนวน' && (p.invoice.status === 'paid' || p.invoice.status === 'ชำระแล้ว' || p.invoice.status === 'ออกใบเสร็จแล้ว' || p.invoice.status === 'ชำระเต็มจำนวน')))
  );

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
      <div className="flex-between" style={{ marginBottom: '20px', flexShrink: 0 }}>
        <h1 className="h1" style={{ marginBottom: 0 }}>พิมพ์ใบเสร็จ</h1>
      </div>

      <div style={{ backgroundColor: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ marginBottom: '20px', flexShrink: 0, display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                {status || 'ทั้งหมด'}
              </button>
            )})}
          </div>
        </div>

        <div style={{ overflow: 'auto', flex: 1 }}>
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
                    <button onClick={() => setViewReceiptId(p.id)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <Printer size={16} /> ดู/พิมพ์ใบเสร็จ
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-main)' }}>
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
    </div>
  );
};

export default Receipts;
