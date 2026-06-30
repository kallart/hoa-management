import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Search, Printer, Filter, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: string;
  property: {
    houseNumber: string;
    landArea: number;
    owner?: {
      name: string;
    };
  };
}

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await api.get('/api/invoices');
        setInvoices(response.data);
      } catch (error) {
        console.error('Failed to fetch invoices', error);
      }
    };
    fetchInvoices();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put('/api/invoices/${id}/status', { status: newStatus });
      const response = await api.get('/api/invoices');
      setInvoices(response.data);
      toast.success('อัปเดตสถานะสำเร็จ');
    } catch (error) {
      console.error('Failed to update status', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const filtered = invoices.filter(inv => 
    (inv.invoiceNumber.includes(searchTerm) || 
    inv.property.houseNumber.includes(searchTerm) ||
    (inv.property.owner?.name && inv.property.owner.name.includes(searchTerm))) &&
    (statusFilter === '' || inv.status === statusFilter || (statusFilter === 'รอแจ้งค่าส่วนกลาง' && inv.status === 'unpaid') || (statusFilter === 'รอการชำระ' && inv.status === 'overdue') || (statusFilter === 'ชำระบางส่วน' && inv.status === 'ชำระบางส่วน') || (statusFilter === 'รอตรวจสอบยอดเงิน' && inv.status === 'partial') || (statusFilter === 'ชำระเต็มจำนวน' && (inv.status === 'paid' || inv.status === 'ออกใบเสร็จแล้ว' || inv.status === 'ชำระเต็มจำนวน')))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'รอแจ้งค่าส่วนกลาง':
      case 'unpaid': // fallback for old data
        return <span style={{ backgroundColor: '#9CA3AF', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>รอแจ้งค่าส่วนกลาง</span>;
      case 'รอการชำระ':
      case 'overdue': // fallback for old data
        return <span style={{ backgroundColor: 'var(--color-warning)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>รอการชำระ</span>;
      case 'ชำระบางส่วน':
        return <span style={{ backgroundColor: '#8B5CF6', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>ชำระบางส่วน</span>;
      case 'รอตรวจสอบยอดเงิน':
      case 'partial': // fallback for old data
        return <span style={{ backgroundColor: '#3B82F6', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>รอตรวจสอบยอดเงิน</span>;
      case 'ชำระแล้ว':
      case 'paid': // fallback for old data
      case 'ชำระเต็มจำนวน':
        return <span style={{ backgroundColor: 'var(--color-success)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{status}</span>;
      default:
        return <span style={{ backgroundColor: 'var(--color-text-main)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{status || 'รอแจ้งค่าส่วนกลาง'}</span>;
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
      <div className="flex-between" style={{ marginBottom: '20px', flexShrink: 0 }}>
        <h1 className="h1" style={{ marginBottom: 0 }}>ใบแจ้งค่าส่วนกลาง</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/invoices/batch-print" target="_blank" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', padding: '10px 15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <Printer size={18} /> พิมพ์ใบแจ้งทั้งหมด
          </Link>
          <button style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold' }}>
            + สร้างใบแจ้งหนี้ใหม่
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="flex-between" style={{ marginBottom: '20px', flexShrink: 0 }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-main)' }} />
            <input 
              type="text" 
              placeholder="ค้นหาเลขที่บิล, บ้านเลขที่..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
            {['', 'รอแจ้งค่าส่วนกลาง', 'รอการชำระ', 'ชำระบางส่วน', 'รอตรวจสอบยอดเงิน', 'ชำระเต็มจำนวน'].map(status => {
              const isActive = statusFilter === status;
              let statusColor = 'var(--color-primary)';
              if (status === 'รอแจ้งค่าส่วนกลาง') statusColor = '#9CA3AF';
              if (status === 'รอการชำระ') statusColor = 'var(--color-warning)';
              if (status === 'ชำระบางส่วน') statusColor = '#8B5CF6';
              if (status === 'รอตรวจสอบยอดเงิน') statusColor = '#3B82F6';
              if (status === 'ชำระเต็มจำนวน') statusColor = 'var(--color-success)';

              return (
              <button 
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: '20px', 
                  border: `1px solid ${isActive ? statusColor : 'var(--color-border)'}`, 
                  backgroundColor: isActive ? statusColor : 'white', 
                  color: isActive ? 'white' : 'var(--color-text-main)',
                  fontWeight: isActive ? 'bold' : 'normal',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
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
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600', width: '40px' }}></th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600' }}>เลขที่บิล</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600' }}>บ้านเลขที่</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600' }}>ชื่อลูกค้า</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600', textAlign: 'right' }}>ยอดเรียกเก็บ</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600' }}>กำหนดชำระ</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600' }}>สถานะ</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                    {(inv.status === 'รอแจ้งค่าส่วนกลาง' || inv.status === 'unpaid') && (
                      <button 
                        onClick={() => handleUpdateStatus(inv.id, 'รอการชำระ')}
                        style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="คลิกเพื่อเปลี่ยนเป็น รอการชำระ"
                      >
                        <CheckCircle2 size={20} />
                      </button>
                    )}
                    {(inv.status === 'รอการชำระ' || inv.status === 'overdue') && (
                      <button 
                        onClick={() => handleUpdateStatus(inv.id, 'รอแจ้งค่าส่วนกลาง')}
                        style={{ background: 'none', border: 'none', color: 'var(--color-success)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="คลิกเพื่อยกเลิก กลับเป็น รอแจ้งค่าส่วนกลาง"
                      >
                        <CheckCircle2 size={20} fill="currentColor" stroke="white" />
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '12px 10px', fontWeight: 'bold', color: 'var(--color-primary)' }}>{inv.invoiceNumber.replace('INV-', '')}</td>
                  <td style={{ padding: '12px 10px' }}>{inv.property.houseNumber}</td>
                  <td style={{ padding: '12px 10px' }}>{inv.property.owner?.name || '-'}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                    {inv.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    {new Date(inv.dueDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    {getStatusBadge(inv.status)}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <Link to={`/invoices/${inv.id}`} style={{ color: 'var(--color-secondary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Printer size={16} /> ดู/พิมพ์
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-main)' }}>
                    ไม่พบข้อมูลบิล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
