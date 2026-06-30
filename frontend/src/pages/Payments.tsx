import toast from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { Search, Upload, CheckCircle, X, Image as ImageIcon, Trash2 } from 'lucide-react';
import { applyWatermark } from '../utils/watermark';
import { useAuth } from '../contexts/AuthContext';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: string;
  property: {
    houseNumber: string;
    owner?: { name: string };
  };
  payments?: { id: string; slipUrl: string | null; amount: number; receiptNumber: string | null; paymentDate: string; paymentMethod: string; }[];
}

const getRemainingAmount = (invoice: Invoice | null) => {
  if (!invoice) return 0;
  if (!invoice.payments) return Number(invoice.amount.toFixed(2));
  // We only subtract payments that have been verified (have a receiptNumber)
  const verifiedPayments = invoice.payments.filter(p => p.receiptNumber !== null);
  const totalPaid = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);
  return Number(Math.max(0, invoice.amount - totalPaid).toFixed(2));
};

const Payments = () => {
  const { isAdmin } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Payment Form State
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTime, setPaymentTime] = useState(new Date().toTimeString().split(' ')[0].substring(0, 5));
  const [amount, setAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewSlipUrl, setViewSlipUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/api/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Failed to fetch invoices', error);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleOpenPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentType('full');
    setAmount(getRemainingAmount(invoice).toString());
    setPaymentMethod('transfer');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentTime(new Date().toTimeString().split(' ')[0].substring(0, 5));
    setReferenceNumber('');
    setNotes('');
    setSlipFile(null);
  };

  const handleSubmitPayment = async () => {
    if (!selectedInvoice) return;
    if (!amount) return toast.error('กรุณาระบุยอดเงินที่รับชำระ');
    if (!slipFile) return toast.error('กรุณาแนบรูปภาพหลักฐานการชำระเงินก่อนบันทึก');
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('invoiceId', selectedInvoice.id);
      formData.append('houseNumber', selectedInvoice.property.houseNumber);
      formData.append('amount', amount);
      formData.append('paymentMethod', paymentMethod);
      formData.append('paymentDate', new Date(`${paymentDate}T${paymentTime}:00`).toISOString());
      formData.append('referenceNumber', referenceNumber);
      formData.append('notes', notes);
      
      if (slipFile) {
        formData.append('slip', slipFile);
      }

      await api.post('/api/payments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('บันทึกการชำระเงินเรียบร้อยแล้ว สถานะบิลถูกเปลี่ยนเป็น "รอตรวจสอบยอดเงิน"');
      setSelectedInvoice(null);
      fetchInvoices(); // Refresh list
    } catch (error) {
      console.error('Failed to submit payment', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPayment = async (inv: Invoice, paymentIdToVerify?: string) => {
    if (!inv.payments || inv.payments.length === 0) return toast.error('ไม่พบข้อมูลการชำระเงิน');
    let paymentId = paymentIdToVerify;
    if (!paymentId) {
      const unverified = inv.payments.find(p => !p.receiptNumber);
      if (!unverified) return toast.error('ทุกยอดชำระถูกตรวจสอบแล้ว');
      paymentId = unverified.id;
    }
    if (confirm('ตรวจสอบสลิปและยืนยันการรับเงินใช่หรือไม่? ระบบจะออกใบเสร็จให้อัตโนมัติ')) {
      try {
        await api.post(`/api/payments/${paymentId}/verify`);
        toast.success('ตรวจสอบยอดเงินและออกใบเสร็จเรียบร้อยแล้ว');
        fetchInvoices();
      } catch (error: any) {
        console.error(error);
        toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาดในการออกใบเสร็จ');
      }
    }
  };

  const handleCancelPayment = async (inv: Invoice) => {
    if (!inv.payments || inv.payments.length === 0) return toast.error('ไม่พบข้อมูลการชำระเงิน');
    const sortedPayments = [...inv.payments].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    const paymentId = sortedPayments[0].id;
    if (confirm('คุณต้องการยกเลิกและลบข้อมูลนี้ใช่หรือไม่? ข้อมูลสลิปและใบเสร็จ (ถ้ามี) จะถูกลบออกทั้งหมด')) {
      try {
        await api.delete(`/api/payments/${paymentId}`);
        toast.success('ยกเลิกการแจ้งชำระเรียบร้อยแล้ว');
        fetchInvoices();
      } catch (error: any) {
        console.error(error);
        toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาดในการยกเลิก');
      }
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    (inv.invoiceNumber.includes(searchTerm) || 
    inv.property.houseNumber.includes(searchTerm) ||
    (inv.property.owner?.name && inv.property.owner.name.includes(searchTerm))) &&
    (statusFilter === '' || inv.status === statusFilter || 
      (statusFilter === 'รอแจ้งค่าส่วนกลาง' && inv.status === 'unpaid') ||
      (statusFilter === 'รอการชำระ' && inv.status === 'overdue') ||
      (statusFilter === 'ชำระบางส่วน' && inv.status === 'ชำระบางส่วน') ||
      (statusFilter === 'รอตรวจสอบยอดเงิน' && inv.status === 'partial') ||
      (statusFilter === 'ชำระเต็มจำนวน' && (inv.status === 'paid' || inv.status === 'ชำระแล้ว' || inv.status === 'ออกใบเสร็จแล้ว' || inv.status === 'ชำระเต็มจำนวน')))
  );

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
      <div className="flex-between" style={{ marginBottom: '20px', flexShrink: 0 }}>
        <h1 className="h1" style={{ marginBottom: 0 }}>รับชำระเงิน</h1>
      </div>

      <div style={{ backgroundColor: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ marginBottom: '20px', flexShrink: 0, display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600' }}>เลขที่บิล</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600' }}>บ้านเลขที่</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600' }}>ชื่อลูกค้า</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600', textAlign: 'right' }}>ยอดเรียกเก็บ</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600', textAlign: 'right' }}>ชำระแล้ว</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600', textAlign: 'center' }}>สถานะ</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 1, borderBottom: '2px solid var(--color-border)', padding: '10px', fontWeight: '600', textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 10px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    {inv.invoiceNumber.replace('INV-', '')}
                  </td>
                  <td style={{ padding: '12px 10px' }}>{inv.property.houseNumber}</td>
                  <td style={{ padding: '12px 10px' }}>{inv.property.owner?.name || '-'}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-danger)' }}>
                    {inv.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-success)' }}>
                    {inv.payments ? inv.payments.filter(p => p.receiptNumber !== null).reduce((sum, p) => sum + p.amount, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                    {(() => {
                      let color = 'var(--color-text-main)';
                      let title = inv.status || 'รอแจ้งค่าส่วนกลาง';
                      switch (inv.status) {
                        case 'รอแจ้งค่าส่วนกลาง': case 'unpaid': color = '#9CA3AF'; title = 'รอแจ้งค่าส่วนกลาง'; break;
                        case 'รอการชำระ': case 'overdue': color = 'var(--color-warning)'; title = 'รอการชำระ'; break;
                        case 'ชำระบางส่วน': color = '#8B5CF6'; title = 'ชำระบางส่วน'; break;
                        case 'รอตรวจสอบยอดเงิน': case 'partial': color = '#3B82F6'; title = 'รอตรวจสอบยอดเงิน'; break;
                        case 'ชำระแล้ว': case 'paid': case 'ออกใบเสร็จแล้ว': case 'ชำระเต็มจำนวน': color = 'var(--color-success)'; title = inv.status; break;
                      }
                      return <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} title={title} />;
                    })()}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {(inv.status === 'รอตรวจสอบยอดเงิน' || inv.status === 'ชำระแล้ว' || inv.status === 'ออกใบเสร็จแล้ว' || inv.status === 'ชำระเต็มจำนวน') ? (
                      <>
                        {inv.status === 'รอตรวจสอบยอดเงิน' && (() => {
                          const unverifiedPayment = inv.payments?.find(p => !p.receiptNumber);
                          return unverifiedPayment && isAdmin ? (
                            <button 
                              onClick={() => handleVerifyPayment(inv, unverifiedPayment.id)}
                              style={{ backgroundColor: 'var(--color-success)', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                            >
                              ตรวจสอบยอด & ออกใบเสร็จ
                            </button>
                          ) : null;
                        })()}
                        {(() => {
                          const latestSlipPayment = inv.payments ? [...inv.payments].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).find(p => p.slipUrl) : null;
                          return latestSlipPayment ? (
                            <button 
                              onClick={() => setViewSlipUrl(`${(latestSlipPayment.slipUrl || "").startsWith('http') ? (latestSlipPayment.slipUrl || "") : (import.meta.env.VITE_API_URL || 'http://localhost:3001') + (latestSlipPayment.slipUrl || "")}`)}
                              style={{ backgroundColor: '#3B82F6', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
                              title="ดูสลิปการโอนเงินล่าสุด"
                            >
                              ดูสลิป
                            </button>
                          ) : null;
                        })()}
                        {inv.payments && inv.payments.some(p => p.receiptNumber !== null) && (
                          <button 
                            onClick={() => {
                              const verifiedPayments = [...inv.payments!].filter(p => p.receiptNumber !== null).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
                              window.open(`/receipts/${verifiedPayments[0].id}`, '_blank');
                            }}
                            style={{ backgroundColor: '#8B5CF6', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                          >
                            พิมพ์ใบเสร็จ
                          </button>
                        )}
                        {isAdmin && (inv.status === 'รอตรวจสอบยอดเงิน' || inv.status === 'ชำระเต็มจำนวน' || inv.status === 'ชำระแล้ว') && (
                          <button 
                            onClick={() => handleCancelPayment(inv)}
                            style={{ backgroundColor: '#FEE2E2', color: '#EF4444', padding: '6px 12px', borderRadius: '6px', border: '1px solid #FECACA', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
                            title="ลบข้อมูลการแจ้งชำระ/สลิป/ใบเสร็จ"
                          >
                            <Trash2 size={16} /> ลบ
                          </button>
                        )}
                      </>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {isAdmin && (
                          <button 
                            onClick={() => handleOpenPaymentModal(inv)}
                            style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                          >
                            รับชำระเงิน
                          </button>
                        )}
                        {(() => {
                          const latestSlipPayment = inv.payments ? [...inv.payments].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).find(p => p.slipUrl) : null;
                          return latestSlipPayment ? (
                            <button 
                              onClick={() => setViewSlipUrl(`${(latestSlipPayment.slipUrl || "").startsWith('http') ? (latestSlipPayment.slipUrl || "") : (import.meta.env.VITE_API_URL || 'http://localhost:3001') + (latestSlipPayment.slipUrl || "")}`)}
                              style={{ backgroundColor: '#3B82F6', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
                              title="ดูสลิปการโอนเงินล่าสุด"
                            >
                              ดูสลิป
                            </button>
                          ) : null;
                        })()}
                        {inv.payments && inv.payments.some(p => p.receiptNumber !== null) && (
                          <button 
                            onClick={() => {
                              const verifiedPayments = [...inv.payments!].filter(p => p.receiptNumber !== null).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
                              window.open(`/receipts/${verifiedPayments[0].id}`, '_blank');
                            }}
                            style={{ backgroundColor: '#8B5CF6', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                          >
                            พิมพ์ใบเสร็จ
                          </button>
                        )}
                        {isAdmin && inv.status === 'ชำระบางส่วน' && (
                          <button 
                            onClick={() => handleCancelPayment(inv)}
                            style={{ backgroundColor: '#FEE2E2', color: '#EF4444', padding: '6px 12px', borderRadius: '6px', border: '1px solid #FECACA', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
                            title="ลบข้อมูลการชำระเงินล่าสุด"
                          >
                            <Trash2 size={16} /> ลบ
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-main)' }}>
                    ไม่พบบิล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedInvoice && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-primary-dark)' }}>บันทึกรับชำระเงิน</h2>
              <button onClick={() => setSelectedInvoice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#6B7280" /></button>
            </div>

            <div style={{ backgroundColor: '#F3F4F6', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ color: '#4B5563' }}>บ้านเลขที่:</span>
                <span style={{ fontWeight: 'bold' }}>{selectedInvoice.property.houseNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ color: '#4B5563' }}>บิลอ้างอิง:</span>
                <span style={{ fontWeight: 'bold' }}>{selectedInvoice.invoiceNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #D1D5DB', paddingTop: '10px', marginTop: '5px' }}>
                <span style={{ color: '#4B5563' }}>ยอดที่ต้องชำระทั้งหมด:</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {selectedInvoice.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท
                </span>
              </div>
              
              {selectedInvoice.payments && selectedInvoice.payments.some(p => p.receiptNumber !== null) && (
                <div style={{ borderTop: '1px dashed #D1D5DB', paddingTop: '10px', marginTop: '10px' }}>
                  <span style={{ color: '#4B5563', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ประวัติการชำระเงินที่ผ่านการตรวจสอบ:</span>
                  {selectedInvoice.payments.filter(p => p.receiptNumber !== null).sort((a,b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()).map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)', marginBottom: '3px' }}>
                      <span>- ใบเสร็จ {p.receiptNumber}</span>
                      <span>ชำระไป {p.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #D1D5DB', paddingTop: '10px', marginTop: '10px' }}>
                <span style={{ color: '#4B5563' }}>ยอดคงค้าง:</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-danger)' }}>
                  {getRemainingAmount(selectedInvoice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>ยอดเงินที่รับชำระ (บาท) *</label>
                
                <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="paymentType" 
                      checked={paymentType === 'full'} 
                      onChange={() => {
                        setPaymentType('full');
                        if (selectedInvoice) setAmount(getRemainingAmount(selectedInvoice).toString());
                      }} 
                    />
                    ชำระเต็มจำนวน
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="paymentType" 
                      checked={paymentType === 'partial'} 
                      onChange={() => {
                        setPaymentType('partial');
                        setAmount('');
                      }} 
                    />
                    ชำระบางส่วน
                  </label>
                </div>

                <input 
                  type="number" 
                  step="0.01"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={paymentType === 'full'}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--color-border)', 
                    outline: 'none', 
                    boxSizing: 'border-box',
                    backgroundColor: paymentType === 'full' ? '#F3F4F6' : 'white',
                    color: paymentType === 'full' ? '#6B7280' : 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>วันที่โอน *</label>
                  <input 
                    type="date" 
                    value={paymentDate} 
                    onChange={(e) => setPaymentDate(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>เวลาที่โอน *</label>
                  <input 
                    type="time" 
                    value={paymentTime} 
                    onChange={(e) => setPaymentTime(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ช่องทางการชำระ *</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white' }}
                >
                  <option value="transfer">โอนเงินเข้าบัญชี</option>
                  <option value="cash">เงินสด</option>
                </select>
              </div>

              {paymentMethod === 'transfer' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>แนบสลิปโอนเงิน</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      style={{ border: '2px dashed var(--color-primary-light)', padding: '20px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', backgroundColor: slipFile ? '#EFF6FF' : 'transparent' }}
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            if (selectedInvoice && selectedInvoice.property) {
                              try {
                                const watermarked = await applyWatermark(file, selectedInvoice.property.houseNumber);
                                setSlipFile(watermarked);
                              } catch (err) {
                                console.error('Watermark failed', err);
                                setSlipFile(file);
                              }
                            } else {
                              setSlipFile(file);
                            }
                          }
                        }}
                      />
                      {slipFile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                          <CheckCircle color="var(--color-success)" size={32} />
                          <span style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>เลือกไฟล์แล้ว: {slipFile.name}</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--color-primary)' }}>
                          <Upload size={32} />
                          <span>คลิกเพื่ออัปโหลดสลิป</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>รหัสอ้างอิง / เลขที่สลิป (ถ้ามี)</label>
                    <input 
                      type="text" 
                      value={referenceNumber} 
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>หมายเหตุ</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '25px' }}>
              <button 
                onClick={() => setSelectedInvoice(null)}
                style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#E5E7EB', color: '#4B5563', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleSubmitPayment}
                disabled={isSubmitting}
                style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: 'var(--color-primary)', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการรับชำระ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Slip Modal */}
      {viewSlipUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button 
              onClick={() => setViewSlipUrl(null)} 
              style={{ position: 'absolute', top: '-40px', right: '0', background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}
            >
              <X size={32} />
            </button>
            <img 
              src={viewSlipUrl} 
              alt="Slip" 
              style={{ maxWidth: '100%', maxHeight: 'calc(90vh - 50px)', objectFit: 'contain', borderRadius: '8px' }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
