import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Search, Download, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Property {
  id: string;
  houseNumber: string;
  plot?: string;
  landArea: number;
  ratePerYear: number;
  status: string;
  owner?: {
    name: string;
    phone: string;
  };
  invoices?: Array<{
    amount: number;
    arrears: number;
    interest: number;
    commonFee: number;
    parkingFee: number;
    status: string;
  }>;
}

const Properties = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editForm, setEditForm] = useState({ ownerName: '', plot: '', landArea: '', parkingFee: '', arrears: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/api/properties');
        const sortedProperties = response.data.sort((a: any, b: any) => {
          const numA = parseInt(a.houseNumber.split('/')[1] || '0', 10);
          const numB = parseInt(b.houseNumber.split('/')[1] || '0', 10);
          return numA - numB;
        });
        setProperties(sortedProperties);
    } catch (error) {
      console.error('Failed to fetch properties', error);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleEditClick = (property: Property) => {
    setEditingProperty(property);
    const invoice = property.invoices && property.invoices.length > 0 ? property.invoices[0] : null;
    setEditForm({
      ownerName: property.owner?.name || '',
      plot: property.plot || '',
      landArea: property.landArea.toString(),
      parkingFee: invoice ? invoice.parkingFee.toString() : '0',
      arrears: invoice ? invoice.arrears.toString() : '0'
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProperty) return;
    setIsSaving(true);
    try {
      await api.put(`/api/properties/${editingProperty.id}`, editForm);
      setEditingProperty(null);
      fetchProperties();
      toast.success('บันทึกข้อมูลสำเร็จ');
    } catch (error) {
      console.error('Failed to save property', error);
      toast.error('บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    let color = 'var(--color-text-main)';
    let title = status || 'รอแจ้งค่าส่วนกลาง';
    
    switch (status) {
      case 'รอแจ้งค่าส่วนกลาง':
      case 'unpaid':
        color = '#9CA3AF';
        title = 'รอแจ้งค่าส่วนกลาง';
        break;
      case 'รอการชำระ':
      case 'overdue':
        color = 'var(--color-warning)';
        title = 'รอการชำระ';
        break;
      case 'ชำระบางส่วน':
        color = '#8B5CF6';
        title = 'ชำระบางส่วน';
        break;
      case 'รอตรวจสอบยอดเงิน':
      case 'partial':
        color = '#3B82F6';
        title = 'รอตรวจสอบยอดเงิน';
        break;
      case 'ชำระแล้ว':
      case 'paid':
      case 'ชำระเต็มจำนวน':
        color = 'var(--color-success)';
        title = status;
        break;
    }
    
    return (
      <div 
        style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} 
        title={title}
      />
    );
  };

  const filtered = properties.filter(p => {
    const invStatus = p.invoices && p.invoices.length > 0 ? p.invoices[0].status : 'รอแจ้งค่าส่วนกลาง';
    const matchesSearch = p.houseNumber.includes(searchTerm) || (p.owner?.name && p.owner.name.includes(searchTerm));
    const matchesStatus = statusFilter === '' || invStatus === statusFilter || 
      (statusFilter === 'รอแจ้งค่าส่วนกลาง' && invStatus === 'unpaid') ||
      (statusFilter === 'รอการชำระ' && invStatus === 'overdue') ||
      (statusFilter === 'ชำระบางส่วน' && invStatus === 'ชำระบางส่วน') ||
      (statusFilter === 'รอตรวจสอบยอดเงิน' && invStatus === 'partial') ||
      (statusFilter === 'ชำระเต็มจำนวน' && (invStatus === 'paid' || invStatus === 'ชำระเต็มจำนวน' || invStatus === 'ออกใบเสร็จแล้ว'));
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
      <div className="flex-between" style={{ marginBottom: '20px', flexShrink: 0 }}>
        <h1 className="h1" style={{ marginBottom: 0 }}>ข้อมูลบ้านและสมาชิก</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', padding: '10px 15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Export Excel
          </button>
          {isAdmin && (
            <button style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold' }}>
              + เพิ่มข้อมูลบ้าน
            </button>
          )}
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="flex-between" style={{ marginBottom: '20px', flexShrink: 0 }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-main)' }} />
            <input 
              type="text" 
              placeholder="ค้นหาบ้านเลขที่, ชื่อเจ้าของ..." 
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
                  padding: '4px 12px', fontSize: '0.85rem', 
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
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ color: 'var(--color-text-main)' }}>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '8px 10px', fontWeight: '600', whiteSpace: 'nowrap' }}>บ้านเลขที่</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '8px 10px', fontWeight: '600', whiteSpace: 'nowrap' }}>แปลงที่</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '8px 10px', fontWeight: '600', width: '25%' }}>ชื่อเจ้าของบ้าน</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '8px 10px', fontWeight: '600', whiteSpace: 'nowrap' }}>เนื้อที่</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '8px 10px', fontWeight: '600', whiteSpace: 'nowrap', textAlign: 'right' }}>ค้างชำระ</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '8px 10px', fontWeight: '600', whiteSpace: 'nowrap', textAlign: 'right' }}>ดอกเบี้ย</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '8px 10px', fontWeight: '600', whiteSpace: 'nowrap', textAlign: 'right' }}>ค่าส่วนกลาง</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '8px 10px', fontWeight: '600', whiteSpace: 'nowrap', textAlign: 'right' }}>ค่าที่จอดรถ</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '8px 10px', fontWeight: '600', whiteSpace: 'nowrap', textAlign: 'right', color: 'var(--color-primary-dark)' }}>ยอดรวมเรียกเก็บ</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '8px 10px', fontWeight: '600', whiteSpace: 'nowrap' }}>สถานะ</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '8px 10px', fontWeight: '600', whiteSpace: 'nowrap' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((property) => {
                const inv = property.invoices && property.invoices.length > 0 ? property.invoices[0] : null;
                return (
                <tr key={property.id} className="hover-row" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{property.houseNumber}</td>
                  <td style={{ padding: '10px 8px' }}>{property.plot || '-'}</td>
                  <td style={{ padding: '10px 8px' }}>{property.owner?.name || '-'}</td>
                  <td style={{ padding: '10px 8px' }}>{property.landArea.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>{inv && inv.arrears > 0 ? inv.arrears.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>{inv && inv.interest > 0 ? inv.interest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>{inv && inv.commonFee > 0 ? inv.commonFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>{inv && inv.parkingFee > 0 ? inv.parkingFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                    {(inv ? inv.amount : property.ratePerYear) > 0 
                      ? (inv ? inv.amount : property.ratePerYear).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) 
                      : '-'}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    {getStatusBadge(inv ? inv.status : 'รอแจ้งค่าส่วนกลาง')}
                  </td>
                  <td style={{ padding: '10px 8px', display: 'flex', alignItems: 'center' }}>
                    {isAdmin && (
                      <button 
                        onClick={() => handleEditClick(property)}
                        style={{ color: 'var(--color-secondary)', fontWeight: 'bold', marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        แก้ไข
                      </button>
                    )}
                    {inv && (
                      <button 
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                        style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="ดูใบแจ้งค่าส่วนกลาง"
                      >
                        <Search size={16} />
                      </button>
                    )}
                  </td>
                </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-main)' }}>
                    ไม่พบข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingProperty && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginBottom: '20px', color: 'var(--color-primary)' }}>แก้ไขข้อมูลบ้านเลขที่ {editingProperty.houseNumber}</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ชื่อเจ้าของบ้าน</label>
              <input 
                type="text" 
                value={editForm.ownerName} 
                onChange={(e) => setEditForm({...editForm, ownerName: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>แปลงที่</label>
              <input 
                type="text" 
                value={editForm.plot} 
                onChange={(e) => setEditForm({...editForm, plot: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>เนื้อที่ (ตร.ว.)</label>
              <input 
                type="number" 
                step="0.01"
                value={editForm.landArea} 
                onChange={(e) => setEditForm({...editForm, landArea: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ค่าที่จอดรถส่วนกลาง (บาท)</label>
              <input 
                type="number" 
                step="0.01"
                value={editForm.parkingFee} 
                onChange={(e) => setEditForm({...editForm, parkingFee: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ยอดค้างชำระ (บาท)</label>
              <input 
                type="number" 
                step="0.01"
                value={editForm.arrears} 
                onChange={(e) => setEditForm({...editForm, arrears: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '25px', backgroundColor: '#F3F4F6', padding: '10px', borderRadius: '8px', border: '1px dashed #D1D5DB' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#4B5563' }}>ดอกเบี้ยคำนวณอัตโนมัติ (บาท)</label>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>
                {((Number(editForm.arrears) || 0) * 0.02 * 12).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} 
                <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#6B7280', marginLeft: '5px' }}>(= ยอดค้างชำระ x 2% x 12)</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => setEditingProperty(null)}
                style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#E5E7EB', color: '#4B5563', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isSaving}
                style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: 'var(--color-primary)', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', opacity: isSaving ? 0.7 : 1 }}
              >
                {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Properties;
