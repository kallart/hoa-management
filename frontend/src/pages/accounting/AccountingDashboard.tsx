import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit2, Trash2, Eye, ExternalLink, RefreshCw, 
  Wallet, ShieldAlert, ReceiptText, ArrowUpRight, ArrowDownLeft,
  Calendar, CheckCircle2, Clock, Upload, X, AlertCircle, FileText
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AccountingDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL path
  const getTabFromPath = () => {
    if (location.pathname.includes('/transactions')) return 'transactions';
    if (location.pathname.includes('/petty-cash')) return 'petty-cash';
    if (location.pathname.includes('/deposits')) return 'deposits';
    if (location.pathname.includes('/settings')) return 'settings';
    return 'overview';
  };

  const activeTab = getTabFromPath();

  // State
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Filters
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubType, setFilterSubType] = useState('');

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pettyCashData, setPettyCashData] = useState<any>(null);

  // Topup Form State
  const [topupForm, setTopupForm] = useState({
    amount: '5000',
    date: new Date().toISOString().split('T')[0],
    slipUrl: '',
    transferFrom: 'บัญชีนิติบุคคล (KBIZ) / กรรมการ',
    notes: 'กรรมการโอนเงินเติมวงเงินสดย่อย 5,000 บาท'
  });

  // Transaction Form State
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [txForm, setTxForm] = useState({
    type: 'EXPENSE',
    subType: 'MONTHLY',
    paymentMethod: 'TRANSFER_MAIN',
    date: new Date().toISOString().split('T')[0],
    docNumber: '',
    manualRefNo: '',
    title: '',
    category: 'ค่าใช้จ่ายทั่วไป',
    payee: '',
    payeePromptpay: '',
    amount: '',
    notes: '',
    slipUrl: '',
    idCardUrl: '',
    receiptUrl: '',
    workPhotos: [] as string[],
    driveUrl: ''
  });

  // Deposit Form State
  const [depositForm, setDepositForm] = useState({
    houseNumber: '',
    ownerName: '',
    phone: '',
    amount: '10000',
    depositDate: new Date().toISOString().split('T')[0],
    description: 'มัดจำงานต่อเติมบ้าน',
    manualRefNo: '',
    slipUrl: '',
    driveUrl: ''
  });

  // Refund Form State
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);
  const [refundForm, setRefundForm] = useState({
    status: 'REFUNDED',
    deductedAmount: '0',
    refundedAmount: '10000',
    refundDate: new Date().toISOString().split('T')[0],
    inspectionNotes: 'ตรวจงานผ่าน ไม่พบความเสียหายต่อทรัพย์สินส่วนกลาง',
    refundSlipUrl: ''
  });

  // Replenish Form State
  const [replenishForm, setReplenishForm] = useState({
    slipUrl: '',
    notes: ''
  });

  // Uploading state
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, txRes, depRes, setRes, pcRes] = await Promise.all([
        api.get(`/api/accounting/summary?month=${selectedMonth}&year=${selectedYear}`),
        api.get(`/api/accounting/transactions?month=${selectedMonth}&year=${selectedYear}`),
        api.get('/api/accounting/deposits'),
        api.get('/api/accounting/settings'),
        api.get(`/api/accounting/petty-cash?month=${selectedMonth}&year=${selectedYear}`)
      ]);

      setSummary(sumRes.data);
      setTransactions(txRes.data);
      setDeposits(depRes.data);
      setSettings(setRes.data);
      setPettyCashData(pcRes.data);
    } catch (error) {
      console.error(error);
      toast.error('ไม่สามารถโหลดข้อมูลบัญชีได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  // Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', fieldName);

    try {
      setUploadingField(fieldName);
      const res = await api.post('/api/accounting/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data.url;

      if (fieldName === 'workPhoto') {
        setTxForm(prev => ({ ...prev, workPhotos: [...prev.workPhotos, url] }));
      } else if (fieldName === 'refundSlip') {
        setRefundForm(prev => ({ ...prev, refundSlipUrl: url }));
      } else if (fieldName === 'depositSlip') {
        setDepositForm(prev => ({ ...prev, slipUrl: url }));
      } else if (fieldName === 'topupSlip') {
        setTopupForm(prev => ({ ...prev, slipUrl: url }));
      } else if (fieldName === 'replenishSlip') {
        setReplenishForm(prev => ({ ...prev, slipUrl: url }));
      } else {
        setTxForm(prev => ({ ...prev, [fieldName]: url }));
      }
      toast.success('อัปโหลดรูปภาพสำเร็จ');
    } catch (error) {
      toast.error('อัปโหลดไฟล์ล้มเหลว');
    } finally {
      setUploadingField(null);
    }
  };

  // Transaction Modal Openers
  const openNewTxModal = (type: string, subType: string = 'MONTHLY') => {
    setEditingTxId(null);
    const thaiYear = currentYear + 543;
    const nextNum = (subType === 'PETTY_CASH') ? settings?.nextPcNumber || 286 : settings?.nextPvNumber || 16;
    const docNum = (subType === 'PETTY_CASH')
      ? `PC-${thaiYear}-${String(nextNum).padStart(4, '0')}`
      : `PV-${thaiYear}-${String(nextNum).padStart(4, '0')}`;
    const defaultRef = `#${nextNum}`;

    setTxForm({
      type,
      subType,
      paymentMethod: subType === 'PETTY_CASH' ? 'PETTY_CASH' : 'TRANSFER_MAIN',
      date: new Date().toISOString().split('T')[0],
      docNumber: docNum,
      manualRefNo: defaultRef,
      title: '',
      category: subType === 'REPAIR' ? 'ซ่อมแซมระบบไฟฟ้า/ประปา' : subType === 'PETTY_CASH' ? 'อาหารว่างและเครื่องดื่ม' : 'ค่าบริการประจำเดือน',
      payee: '',
      payeePromptpay: '',
      amount: '',
      notes: '',
      slipUrl: '',
      idCardUrl: '',
      receiptUrl: '',
      workPhotos: [],
      driveUrl: settings?.googleDriveUrl || ''
    });
    setIsTxModalOpen(true);
  };

  const openEditTxModal = (tx: any) => {
    setEditingTxId(tx.id);
    let photos: string[] = [];
    if (tx.workPhotos) {
      try {
        photos = JSON.parse(tx.workPhotos);
      } catch (e) {
        photos = [tx.workPhotos];
      }
    }
    setTxForm({
      type: tx.type,
      subType: tx.subType,
      paymentMethod: tx.paymentMethod,
      date: tx.date ? new Date(tx.date).toISOString().split('T')[0] : '',
      docNumber: tx.docNumber,
      manualRefNo: tx.manualRefNo || '',
      title: tx.title,
      category: tx.category || '',
      payee: tx.payee || '',
      payeePromptpay: tx.payeePromptpay || '',
      amount: String(tx.amount),
      notes: tx.notes || '',
      slipUrl: tx.slipUrl || '',
      idCardUrl: tx.idCardUrl || '',
      receiptUrl: tx.receiptUrl || '',
      workPhotos: photos,
      driveUrl: tx.driveUrl || ''
    });
    setIsTxModalOpen(true);
  };

  // Submit Transaction
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!txForm.title || !txForm.amount) {
        toast.error('กรุณากรอกรายการและจำนวนเงิน');
        return;
      }
      if (editingTxId) {
        await api.put(`/api/accounting/transactions/${editingTxId}`, txForm);
        toast.success('อัปเดตรายการบัญชีเรียบร้อยแล้ว');
      } else {
        await api.post('/api/accounting/transactions', txForm);
        toast.success('บันทึกรายการบัญชีสำเร็จ');
      }
      setIsTxModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  // Delete Transaction
  const handleDeleteTx = async (id: string, title: string) => {
    if (!window.confirm(`ยืนยันการลบรายการ "${title}" ใช่หรือไม่?`)) return;
    try {
      await api.delete(`/api/accounting/transactions/${id}`);
      toast.success('ลบรายการเรียบร้อยแล้ว');
      fetchData();
    } catch (error) {
      toast.error('ไม่สามารถลบรายการได้');
    }
  };

  // Submit Construction Deposit
  const handleSaveDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!depositForm.houseNumber || !depositForm.amount) {
        toast.error('กรุณาระบุบ้านเลขที่และยอดเงินมัดจำ');
        return;
      }
      await api.post('/api/accounting/deposits', depositForm);
      toast.success('บันทึกรับเงินมัดจำต่อเติมเรียบร้อยแล้ว');
      setIsDepositModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('ไม่สามารถบันทึกเงินมัดจำได้');
    }
  };

  // Open Refund Modal
  const openRefundModal = (dep: any) => {
    setSelectedDeposit(dep);
    setRefundForm({
      status: 'REFUNDED',
      deductedAmount: '0',
      refundedAmount: String(dep.amount),
      refundDate: new Date().toISOString().split('T')[0],
      inspectionNotes: 'ตรวจงานเรียบร้อย ไม่พบความเสียหายต่อทรัพย์สินส่วนกลาง',
      refundSlipUrl: ''
    });
    setIsRefundModalOpen(true);
  };

  // Submit Refund
  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedDeposit) return;
      await api.put(`/api/accounting/deposits/${selectedDeposit.id}`, refundForm);
      toast.success('บันทึกการตรวจงานและคืนเงินมัดจำเรียบร้อยแล้ว');
      setIsRefundModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('ไม่สามารถทำรายการคืนเงินได้');
    }
  };

  // Submit Topup from Committee
  const handleSaveTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/accounting/petty-cash/topup', topupForm);
      toast.success('บันทึกการเติมเงินสดย่อยเรียบร้อยแล้ว');
      setIsTopupModalOpen(false);
      setTopupForm({
        amount: '5000',
        date: new Date().toISOString().split('T')[0],
        slipUrl: '',
        transferFrom: 'บัญชีนิติบุคคล (KBIZ) / กรรมการ',
        notes: 'กรรมการโอนเงินเติมวงเงินสดย่อย 5,000 บาท'
      });
      fetchData();
    } catch (error) {
      toast.error('ไม่สามารถบันทึกการเติมเงินได้');
    }
  };

  // Delete Topup
  const handleDeleteTopup = async (id: string, topupNumber: string) => {
    if (!window.confirm(`ยืนยันการลบรายการเติมเงิน ${topupNumber} ใช่หรือไม่?`)) return;
    try {
      await api.delete(`/api/accounting/petty-cash/topup/${id}`);
      toast.success('ลบรายการเติมเงินเรียบร้อยแล้ว');
      fetchData();
    } catch (error) {
      toast.error('ไม่สามารถลบรายการได้');
    }
  };

  // Replenish Petty Cash
  const handleProcessReplenish = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/accounting/petty-cash/replenish', replenishForm);
      toast.success('ทำเรื่องเบิกชดเชยเงินสดย่อยเรียบร้อยแล้ว ยอดเงินกลับมาเต็ม 5,000 บ.');
      setIsReplenishModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถเบิกชดเชยได้');
    }
  };

  // Update Settings
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/api/accounting/settings', settings);
      toast.success('บันทึกการตั้งค่าเรียบร้อยแล้ว');
      fetchData();
    } catch (error) {
      toast.error('ไม่สามารถบันทึกการตั้งค่าได้');
    }
  };

  // Filtered Transactions
  const filteredTxs = transactions.filter(tx => {
    const matchesSearch = 
      (tx.title && tx.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.docNumber && tx.docNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.manualRefNo && tx.manualRefNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.payee && tx.payee.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = !filterSubType || tx.subType === filterSubType;
    return matchesSearch && matchesType;
  });

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  if (loading && !summary) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        กำลังโหลดข้อมูลบัญชีและการเงิน...
      </div>
    );
  }

  return (
    <div className="page-container" style={{ paddingBottom: '80px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        <div>
          <h1 className="h1" style={{ margin: '0 0 5px 0', fontSize: '1.6rem', color: '#1F2937' }}>
            ระบบบันทึกบัญชี รายรับ-รายจ่าย
          </h1>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.95rem' }}>
            จัดการค่าใช้จ่ายประจำเดือน, ค่าซ่อมแซม, วงเงินสดย่อย 5,000 บ. และเงินมัดจำต่อเติม
          </p>
        </div>

        {/* Date Filter & Google Drive Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '4px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', gap: '8px' }}>
            <Calendar size={18} color="#6B7280" />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={{ border: 'none', background: 'none', fontWeight: 600, color: '#374151', cursor: 'pointer', outline: 'none' }}
            >
              {monthNames.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ border: 'none', background: 'none', fontWeight: 600, color: '#374151', cursor: 'pointer', outline: 'none' }}
            >
              <option value={2026}>2569 (2026)</option>
              <option value={2025}>2568 (2025)</option>
            </select>
          </div>

          {settings?.googleDriveUrl && (
            <a 
              href={settings.googleDriveUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="btn" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#EDE9FE', color: '#7C3AED', border: '1px solid #DDD6FE', padding: '8px 14px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}
            >
              <ExternalLink size={16} /> Google Drive
            </a>
          )}

          <button 
            onClick={() => openNewTxModal('EXPENSE', 'MONTHLY')}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px' }}
          >
            <Plus size={18} /> บันทึกรายจ่าย
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #E5E7EB', marginBottom: '24px', overflowX: 'auto' }}>
        <button 
          onClick={() => navigate('/accounting')}
          style={{ 
            padding: '10px 18px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'overview' ? '3px solid #8B5CF6' : '3px solid transparent',
            color: activeTab === 'overview' ? '#8B5CF6' : '#6B7280',
            fontWeight: activeTab === 'overview' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px'
          }}
        >
          <ReceiptText size={18} /> ภาพรวมงบการเงิน
        </button>

        <button 
          onClick={() => navigate('/accounting/transactions')}
          style={{ 
            padding: '10px 18px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'transactions' ? '3px solid #8B5CF6' : '3px solid transparent',
            color: activeTab === 'transactions' ? '#8B5CF6' : '#6B7280',
            fontWeight: activeTab === 'transactions' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px'
          }}
        >
          <FileText size={18} /> รายการรายจ่าย & รายรับ ({transactions.length})
        </button>

        <button 
          onClick={() => navigate('/accounting/petty-cash')}
          style={{ 
            padding: '10px 18px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'petty-cash' ? '3px solid #8B5CF6' : '3px solid transparent',
            color: activeTab === 'petty-cash' ? '#8B5CF6' : '#6B7280',
            fontWeight: activeTab === 'petty-cash' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px'
          }}
        >
          <Wallet size={18} /> วงเงินสดย่อย ({summary?.pettyCashBalance?.toLocaleString() || 5000} ฿)
        </button>

        <button 
          onClick={() => navigate('/accounting/deposits')}
          style={{ 
            padding: '10px 18px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'deposits' ? '3px solid #8B5CF6' : '3px solid transparent',
            color: activeTab === 'deposits' ? '#8B5CF6' : '#6B7280',
            fontWeight: activeTab === 'deposits' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px'
          }}
        >
          <ShieldAlert size={18} /> เงินมัดจำต่อเติม ({deposits.filter(d => d.status === 'HELD').length})
        </button>

        <button 
          onClick={() => navigate('/accounting/settings')}
          style={{ 
            padding: '10px 18px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'settings' ? '3px solid #8B5CF6' : '3px solid transparent',
            color: activeTab === 'settings' ? '#8B5CF6' : '#6B7280',
            fontWeight: activeTab === 'settings' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px'
          }}
        >
          ตั้งค่าระบบ
        </button>
      </div>

      {/* 4 Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Card 1: รายรับรวม */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '18px 20px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.88rem', color: '#6B7280', fontWeight: 500 }}>รายรับรวมเดือนนี้</span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669' }}>
              <ArrowDownLeft size={20} />
            </div>
          </div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.6rem', fontWeight: 'bold', color: '#059669' }}>
            +{(summary?.totalIncome || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
          </h2>
          <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
            ค่าส่วนกลาง: {(summary?.commonFeeIncome || 0).toLocaleString()} ฿ | อื่นๆ: {(summary?.directIncome || 0).toLocaleString()} ฿
          </span>
        </div>

        {/* Card 2: รายจ่ายรวม */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '18px 20px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.88rem', color: '#6B7280', fontWeight: 500 }}>รายจ่ายรวมเดือนนี้</span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
              <ArrowUpRight size={20} />
            </div>
          </div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.6rem', fontWeight: 'bold', color: '#DC2626' }}>
            -{(summary?.totalExpense || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
          </h2>
          <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
            ประจำ: {(summary?.totalMonthlyExpense || 0).toLocaleString()} ฿ | ซ่อม: {(summary?.totalRepairExpense || 0).toLocaleString()} ฿
          </span>
        </div>

        {/* Card 3: ยอดสุทธิ */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '18px 20px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.88rem', color: '#6B7280', fontWeight: 500 }}>ยอดคงเหลือสุทธิ (Net)</span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: (summary?.netSurplus >= 0) ? '#EFF6FF' : '#FEF2F2', color: (summary?.netSurplus >= 0) ? '#2563EB' : '#DC2626' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.6rem', fontWeight: 'bold', color: (summary?.netSurplus >= 0) ? '#2563EB' : '#DC2626' }}>
            {(summary?.netSurplus || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
          </h2>
          <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
            {summary?.netSurplus >= 0 ? 'งบการเงินเป็นบวก (มีเงินเก็บสะสม)' : 'รายจ่ายมากกว่ารายรับในเดือนนี้'}
          </span>
        </div>

        {/* Card 4: วงเงินสดย่อย */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '18px 20px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.88rem', color: '#6B7280', fontWeight: 500 }}>เงินสดย่อยคงเหลือ</span>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#F3E8FF', color: '#7C3AED' }}>
              <Wallet size={20} />
            </div>
          </div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.6rem', fontWeight: 'bold', color: '#7C3AED' }}>
            {(summary?.pettyCashBalance || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
              วงเงินเต็ม: {(summary?.pettyCashLimit || 5000).toLocaleString()} ฿ (รอชดเชย {summary?.unreplenishedCount || 0} รายการ)
            </span>
          </div>
        </div>
      </div>

      {/* --- TAB 1: OVERVIEW (ภาพรวมงบการเงิน) --- */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          {/* Breakdown Expense Card */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', border: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', color: '#1F2937', fontWeight: 600 }}>
              📊 สัดส่วนค่าใช้จ่ายเดือน {monthNames[selectedMonth - 1]} {selectedYear + 543}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9rem' }}>
                  <span style={{ color: '#374151' }}>1. ค่าใช้จ่ายประจำเดือน (รปภ., ไฟฟ้า, ขยะ, สวน)</span>
                  <strong style={{ color: '#1F2937' }}>{(summary?.totalMonthlyExpense || 0).toLocaleString()} ฿</strong>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${summary?.totalExpense > 0 ? (summary.totalMonthlyExpense / summary.totalExpense) * 100 : 0}%`, height: '100%', backgroundColor: '#3B82F6' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9rem' }}>
                  <span style={{ color: '#374151' }}>2. ค่าปรับปรุงซ่อมแซม (ช่าง, อะไหล่, หน้างาน)</span>
                  <strong style={{ color: '#1F2937' }}>{(summary?.totalRepairExpense || 0).toLocaleString()} ฿</strong>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${summary?.totalExpense > 0 ? (summary.totalRepairExpense / summary.totalExpense) * 100 : 0}%`, height: '100%', backgroundColor: '#F59E0B' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9rem' }}>
                  <span style={{ color: '#374151' }}>3. ค่าใช้จ่ายผ่านวงเงินสดย่อย (อาหารว่าง, เครื่องดื่ม, ฉุกเฉิน)</span>
                  <strong style={{ color: '#1F2937' }}>{(summary?.totalPettyCashExpense || 0).toLocaleString()} ฿</strong>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${summary?.totalExpense > 0 ? (summary.totalPettyCashExpense / summary.totalExpense) * 100 : 0}%`, height: '100%', backgroundColor: '#8B5CF6' }}></div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, color: '#4B5563' }}>รวมรายจ่ายทั้งสิ้น</span>
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#DC2626' }}>
                {(summary?.totalExpense || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
              </span>
            </div>
          </div>

          {/* Quick Actions & Deposit Status Card */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', color: '#1F2937', fontWeight: 600 }}>
                🛡️ สถานะเงินมัดจำต่อเติมบ้าน (หนี้สินรอคืน)
              </h3>
              
              <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#64748B' }}>มัดจำที่ถือครองอยู่ขณะนี้</span>
                    <h4 style={{ margin: '4px 0 0 0', fontSize: '1.4rem', color: '#0F172A', fontWeight: 'bold' }}>
                      {(summary?.totalHeldDeposits || 0).toLocaleString()} ฿
                    </h4>
                  </div>
                  <span style={{ padding: '6px 12px', borderRadius: '20px', backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 600, fontSize: '0.85rem' }}>
                    รอตรวจงาน {summary?.heldDepositsCount || 0} หลัง
                  </span>
                </div>
              </div>
              
              <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                💡 เงินมัดจำต่อเติมจะถูกบันทึกแยกเป็นหนี้สินรอคืน ไม่นำมารวมเป็นรายได้ของหมู่บ้าน เมื่อตรวจงานผ่านจะทำการคืนให้ลูกบ้านเต็มจำนวน
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                onClick={() => openNewTxModal('EXPENSE', 'REPAIR')}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px', fontSize: '0.9rem' }}
              >
                + บันทึกค่าซ่อมแซม (#15)
              </button>
              <button 
                onClick={() => openNewTxModal('EXPENSE', 'PETTY_CASH')}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px', fontSize: '0.9rem', color: '#7C3AED', borderColor: '#DDD6FE' }}
              >
                + บันทึกสดย่อย (#285)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: TRANSACTIONS (รายการรายจ่าย & รายรับ) --- */}
      {(activeTab === 'transactions' || activeTab === 'overview') && (
        <div style={{ marginTop: activeTab === 'overview' ? '30px' : '0' }}>
          {/* Action & Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ position: 'relative', width: '260px' }}>
                <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="ค้นหารายการ, เลขที่, ผู้รับเงิน..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '32px', height: '36px', fontSize: '0.85rem' }}
                />
              </div>

              {/* SubType Filter */}
              <select 
                className="form-control" 
                value={filterSubType} 
                onChange={(e) => setFilterSubType(e.target.value)}
                style={{ height: '36px', fontSize: '0.85rem', width: '180px' }}
              >
                <option value="">ทุกประเภทรายการ</option>
                <option value="MONTHLY">ค่าใช้จ่ายประจำเดือน</option>
                <option value="REPAIR">ค่าปรับปรุงซ่อมแซม</option>
                <option value="PETTY_CASH">วงเงินสดย่อย</option>
                <option value="COMMON_FEE">รายรับค่าส่วนกลาง</option>
                <option value="OTHER">อื่นๆ</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => openNewTxModal('EXPENSE', 'MONTHLY')}
                className="btn btn-primary"
                style={{ height: '36px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> บันทึกรายจ่าย
              </button>
              <button 
                onClick={() => openNewTxModal('INCOME', 'OTHER')}
                className="btn btn-secondary"
                style={{ height: '36px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> บันทึกรายรับอื่นๆ
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <div className="table-responsive" style={{ margin: 0 }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FAFBFD', borderBottom: '1px solid #F1F5F9' }}>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontWeight: 600, fontSize: '0.82rem' }}>วันที่</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontWeight: 600, fontSize: '0.82rem' }}>เลขที่เอกสาร</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontWeight: 600, fontSize: '0.82rem' }}>เลขเดิม</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontWeight: 600, fontSize: '0.82rem' }}>หมวดหมู่ / รายการ</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontWeight: 600, fontSize: '0.82rem' }}>ผู้รับเงิน / พร้อมเพย์</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontWeight: 600, fontSize: '0.82rem' }}>วิธีจ่ายเงิน</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontWeight: 600, fontSize: '0.82rem', textAlign: 'right' }}>จำนวนเงิน</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontWeight: 600, fontSize: '0.82rem', textAlign: 'center' }}>หลักฐานแนบ</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontWeight: 600, fontSize: '0.82rem', textAlign: 'center' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTxs.map((tx) => {
                    let photos: string[] = [];
                    if (tx.workPhotos) {
                      try { photos = JSON.parse(tx.workPhotos); } catch (e) { photos = [tx.workPhotos]; }
                    }

                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#334155' }}>
                          {new Date(tx.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>
                          {tx.docNumber}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                          {tx.manualRefNo ? (
                            <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#EDE9FE', color: '#7C3AED', fontWeight: 'bold' }}>
                              {tx.manualRefNo}
                            </span>
                          ) : '-'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0F172A' }}>{tx.title}</span>
                            <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                              [{tx.subType === 'REPAIR' ? 'งานซ่อม' : tx.subType === 'PETTY_CASH' ? 'สดย่อย' : 'ประจำเดือน'}] {tx.category || ''}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#334155' }}>
                          <div>{tx.payee || '-'}</div>
                          {tx.payeePromptpay && (
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>พร้อมเพย์: {tx.payeePromptpay}</div>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                          <span style={{ 
                            padding: '3px 8px', 
                            borderRadius: '4px', 
                            fontSize: '0.78rem', 
                            fontWeight: 600,
                            backgroundColor: tx.paymentMethod === 'PETTY_CASH' ? '#F3E8FF' : '#E0F2FE',
                            color: tx.paymentMethod === 'PETTY_CASH' ? '#7C3AED' : '#0284C7'
                          }}>
                            {tx.paymentMethod === 'PETTY_CASH' ? 'วงเงินสดย่อย' : 'โอนเงิน (KBIZ)'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 'bold', fontSize: '0.95rem', color: tx.type === 'INCOME' ? '#059669' : '#DC2626' }}>
                          {tx.type === 'INCOME' ? '+' : '-'}{tx.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '4px' }}>
                            {tx.slipUrl && (
                              <button 
                                onClick={() => setPreviewImage(tx.slipUrl)} 
                                title="ดูสลิปโอนเงิน"
                                style={{ border: 'none', background: '#ECFDF5', color: '#059669', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                              >
                                สลิป
                              </button>
                            )}
                            {tx.idCardUrl && (
                              <button 
                                onClick={() => setPreviewImage(tx.idCardUrl)} 
                                title="ดูสำเนาบัตร ปชช."
                                style={{ border: 'none', background: '#EFF6FF', color: '#2563EB', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                              >
                                บัตร
                              </button>
                            )}
                            {tx.receiptUrl && (
                              <button 
                                onClick={() => setPreviewImage(tx.receiptUrl)} 
                                title="ดูใบเสร็จ"
                                style={{ border: 'none', background: '#FEF3C7', color: '#D97706', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                              >
                                ใบเสร็จ
                              </button>
                            )}
                            {photos.length > 0 && (
                              <button 
                                onClick={() => setPreviewImage(photos[0])} 
                                title={`ดูรูปหน้างาน (${photos.length} รูป)`}
                                style={{ border: 'none', background: '#F3E8FF', color: '#7C3AED', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                              >
                                รูป ({photos.length})
                              </button>
                            )}
                            {!tx.slipUrl && !tx.idCardUrl && !tx.receiptUrl && photos.length === 0 && (
                              <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>ไม่มี</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button 
                              onClick={() => openEditTxModal(tx)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}
                              title="แก้ไข"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteTx(tx.id, tx.title)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                              title="ลบ"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTxs.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#9CA3AF' }}>
                        ไม่พบรายการบันทึกบัญชีในเดือนนี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: PETTY CASH (วงเงินสดย่อย) --- */}
      {activeTab === 'petty-cash' && (
        <div>
          {/* Petty Cash Monthly Rollover Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {/* 1. Opening Balance */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>1. ยอดยกมาจากเดือนก่อน</span>
              <h3 style={{ margin: '6px 0 0 0', fontSize: '1.4rem', color: '#334155', fontWeight: 'bold' }}>
                {(pettyCashData?.openingBalance ?? 5000).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>วงเงินตั้งต้นระบบ 5,000 บ.</span>
            </div>

            {/* 2. Top-ups */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>2. กรรมการโอนเติมเดือนนี้</span>
              <h3 style={{ margin: '6px 0 0 0', fontSize: '1.4rem', color: '#059669', fontWeight: 'bold' }}>
                +{(pettyCashData?.totalMonthTopups || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#059669' }}>
                โอนเข้ามา {pettyCashData?.topupCount || 0} ครั้ง (ครั้งละ 5,000 บ.)
              </span>
            </div>

            {/* 3. Expenses */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>3. จ่ายย่อยจริงเดือนนี้</span>
              <h3 style={{ margin: '6px 0 0 0', fontSize: '1.4rem', color: '#DC2626', fontWeight: 'bold' }}>
                -{(pettyCashData?.totalMonthExpenses || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#DC2626' }}>
                จ่ายไป {pettyCashData?.expenseCount || 0} รายการ (ไม่เกิน 2,000 บ.)
              </span>
            </div>

            {/* 4. Closing Balance */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '2px solid #8B5CF6' }}>
              <span style={{ fontSize: '0.82rem', color: '#7C3AED', fontWeight: 'bold' }}>4. เงินคงเหลือยกไปเดือนหน้า</span>
              <h3 style={{ margin: '6px 0 0 0', fontSize: '1.4rem', color: '#7C3AED', fontWeight: 'bold' }}>
                ={(pettyCashData?.closingBalance ?? 5000).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#6D28D9' }}>ยกยอดเป็นเงินตั้งต้นเดือนถัดไป</span>
            </div>
          </div>

          {/* Action Header Card */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '18px 24px', border: '1px solid #E5E7EB', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', color: '#1F2937' }}>
                💼 บันทึกและตรวจสอบวงเงินสดย่อย ({monthNames[selectedMonth - 1]} {selectedYear + 543})
              </h3>
              <p style={{ margin: 0, color: '#6B7280', fontSize: '0.85rem' }}>
                รายการซื้อของย่อยไม่เกิน 2,000 บ. พร้อมสลิปโอน + หลักฐานสั่งซื้อ + รูปสินค้า เมื่อใกล้หมดแจ้งกรรมการโอนเติมครั้งละ 5,000 บ.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setIsTopupModalOpen(true)}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#059669', borderColor: '#059669' }}
              >
                <Plus size={16} /> บันทึกกรรมการโอนเติม (+5,000 บ.)
              </button>
              <button 
                onClick={() => openNewTxModal('EXPENSE', 'PETTY_CASH')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7C3AED', borderColor: '#DDD6FE' }}
              >
                <Plus size={16} /> บันทึกจ่ายสดย่อย (#285)
              </button>
            </div>
          </div>

          {/* Section 1: Top-ups from committee */}
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#1F2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📥 รายการเงินที่กรรมการโอนเติมเข้ามาในเดือนนี้ ({pettyCashData?.topupCount || 0} ครั้ง)
            </h4>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FAFBFD', borderBottom: '1px solid #F1F5F9' }}>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem' }}>วันที่โอน</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem' }}>เลขที่รายการ</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem' }}>โอนมาจาก</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem' }}>หมายเหตุ</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem', textAlign: 'right' }}>จำนวนเงินที่โอน</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem', textAlign: 'center' }}>สลิปโอนเงิน</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem', textAlign: 'center' }}>ลบ</th>
                  </tr>
                </thead>
                <tbody>
                  {pettyCashData?.topups?.map((topup: any) => (
                    <tr key={topup.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#334155' }}>
                        {new Date(topup.date).toLocaleDateString('th-TH')}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#059669' }}>
                        {topup.topupNumber}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#334155' }}>
                        {topup.transferFrom || 'บัญชีนิติบุคคล / กรรมการ'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#64748B' }}>
                        {topup.notes || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.95rem', fontWeight: 'bold', color: '#059669', textAlign: 'right' }}>
                        +{topup.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {topup.slipUrl ? (
                          <button 
                            onClick={() => setPreviewImage(topup.slipUrl)} 
                            style={{ border: 'none', background: '#ECFDF5', color: '#059669', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            ดูสลิป
                          </button>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleDeleteTopup(topup.id, topup.topupNumber)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                          title="ลบ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!pettyCashData?.topups || pettyCashData.topups.length === 0) && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF' }}>
                        ยังไม่มีรายการที่กรรมการโอนเติมเข้ามาในเดือนนี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Petty cash expenditures */}
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#1F2937', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📤 รายการจ่ายเงินสดย่อยในเดือนนี้ (ไม่เกิน 2,000 บ./รายการ) ({pettyCashData?.expenseCount || 0} รายการ)
            </h4>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FAFBFD', borderBottom: '1px solid #F1F5F9' }}>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem' }}>วันที่</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem' }}>เลขที่ (#)</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem' }}>รายการ</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem' }}>ผู้รับเงิน / ร้านค้า</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem', textAlign: 'right' }}>จำนวนเงิน</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem', textAlign: 'center' }}>หลักฐาน (สลิป/สั่งซื้อ/สินค้า)</th>
                    <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem', textAlign: 'center' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {pettyCashData?.expenses?.map((tx: any) => {
                    let photos: string[] = [];
                    if (tx.workPhotos) {
                      try { photos = JSON.parse(tx.workPhotos); } catch (e) { photos = [tx.workPhotos]; }
                    }

                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{new Date(tx.date).toLocaleDateString('th-TH')}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 'bold', color: '#7C3AED' }}>
                          {tx.manualRefNo || tx.docNumber}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600, color: '#1F2937' }}>{tx.title}</span>
                          {tx.notes && <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{tx.notes}</div>}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{tx.payee || '-'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', textAlign: 'right', fontWeight: 'bold', color: '#DC2626' }}>
                          -{tx.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '4px' }}>
                            {tx.slipUrl && (
                              <button onClick={() => setPreviewImage(tx.slipUrl)} style={{ border: 'none', background: '#ECFDF5', color: '#059669', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>สลิป</button>
                            )}
                            {tx.receiptUrl && (
                              <button onClick={() => setPreviewImage(tx.receiptUrl)} style={{ border: 'none', background: '#FEF3C7', color: '#D97706', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>สั่งซื้อ/ใบเสร็จ</button>
                            )}
                            {photos.length > 0 && (
                              <button onClick={() => setPreviewImage(photos[0])} style={{ border: 'none', background: '#F3E8FF', color: '#7C3AED', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>รูปสินค้า ({photos.length})</button>
                            )}
                            {!tx.slipUrl && !tx.receiptUrl && photos.length === 0 && (
                              <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>ไม่มี</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button onClick={() => openEditTxModal(tx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteTx(tx.id, tx.title)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {(!pettyCashData?.expenses || pettyCashData.expenses.length === 0) && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#9CA3AF' }}>
                        ยังไม่มีรายการจ่ายเงินสดย่อยในเดือนนี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: DEPOSITS (เงินมัดจำต่อเติมบ้าน) --- */}
      {activeTab === 'deposits' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', color: '#1F2937' }}>
                🏗️ ทะเบียนเงินมัดจำค่าก่อสร้าง / ต่อเติมบ้าน
              </h3>
              <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>
                บันทึกเงินรับมัดจำเพื่อป้องกันความเสียหายต่อทรัพย์สินส่วนกลาง ตรวจงานเสร็จสิ้นแล้วจึงคืนมัดจำ
              </p>
            </div>
            <button 
              onClick={() => setIsDepositModalOpen(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> บันทึกรับเงินมัดจำใหม่
            </button>
          </div>

          {/* Deposits Table */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#FAFBFD', borderBottom: '1px solid #F1F5F9' }}>
                  <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem' }}>เลขที่มัดจำ</th>
                  <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem' }}>บ้านเลขที่</th>
                  <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem' }}>เจ้าของบ้าน / รายละเอียด</th>
                  <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem' }}>วันที่รับเงิน</th>
                  <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem', textAlign: 'right' }}>ยอดมัดจำ</th>
                  <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem', textAlign: 'center' }}>สถานะ</th>
                  <th style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.82rem', textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((dep) => (
                  <tr key={dep.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 600, color: '#1F2937' }}>
                      {dep.depositNumber}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.95rem', fontWeight: 'bold', color: '#2563EB' }}>
                      {dep.houseNumber}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 600, color: '#1E293B' }}>{dep.ownerName} {dep.phone ? `(${dep.phone})` : ''}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{dep.description || 'ต่อเติมบ้าน'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569' }}>
                      {new Date(dep.depositDate).toLocaleDateString('th-TH')}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 'bold', fontSize: '0.95rem', color: '#0F172A' }}>
                      {dep.amount.toLocaleString()} ฿
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.8rem', 
                        fontWeight: 600,
                        backgroundColor: dep.status === 'HELD' ? '#FEF3C7' : dep.status === 'REFUNDED' ? '#D1FAE5' : '#FEE2E2',
                        color: dep.status === 'HELD' ? '#B45309' : dep.status === 'REFUNDED' ? '#065F46' : '#991B1B'
                      }}>
                        {dep.status === 'HELD' ? '⏳ ถือมัดจำรอตรวจ' : dep.status === 'REFUNDED' ? '✅ คืนเงินแล้ว' : '⚠️ มีการหักค่าชดใช้'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {dep.status === 'HELD' ? (
                        <button 
                          onClick={() => openRefundModal(dep)}
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.8rem', backgroundColor: '#059669', borderColor: '#059669' }}
                        >
                          ตรวจงาน & คืนเงิน
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          {dep.refundDate ? `คืนเมื่อ ${new Date(dep.refundDate).toLocaleDateString('th-TH')}` : 'เสร็จสิ้น'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {deposits.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#9CA3AF' }}>
                      ไม่พบประวัติเงินมัดจำต่อเติม
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 5: SETTINGS (ตั้งค่า) --- */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: '600px', backgroundColor: '#FFFFFF', padding: '30px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', color: '#1F2937' }}>
            ⚙️ ตั้งค่าระบบบัญชีและ Google Drive
          </h3>

          <form onSubmit={handleUpdateSettings}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                วงเงินสดย่อยคงที่ (Petty Cash Limit) - บาท
              </label>
              <input 
                type="number" 
                className="form-control" 
                value={settings?.pettyCashLimit || 5000}
                onChange={(e) => setSettings({ ...settings, pettyCashLimit: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  เลขที่ PV ถัดไป (จ่ายบัญชีหลัก)
                </label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={settings?.nextPvNumber || 16}
                  onChange={(e) => setSettings({ ...settings, nextPvNumber: e.target.value })}
                  placeholder="เช่น 16"
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  เลขที่ PC ถัดไป (วงเงินสดย่อย)
                </label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={settings?.nextPcNumber || 286}
                  onChange={(e) => setSettings({ ...settings, nextPcNumber: e.target.value })}
                  placeholder="เช่น 286"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                ลิงก์โฟลเดอร์ Google Drive รวมเอกสารบัญชี
              </label>
              <input 
                type="url" 
                className="form-control" 
                placeholder="https://drive.google.com/drive/folders/..."
                value={settings?.googleDriveUrl || ''}
                onChange={(e) => setSettings({ ...settings, googleDriveUrl: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
              บันทึกการตั้งค่า
            </button>
          </form>
        </div>
      )}

      {/* --- MODAL 1: ADD / EDIT TRANSACTION --- */}
      {isTxModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }} onClick={() => setIsTxModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '95%' }}>
            <div className="modal-header">
              <h2 className="h2" style={{ margin: 0, fontSize: '1.25rem' }}>
                {editingTxId ? 'แก้ไขรายการบัญชี' : (txForm.type === 'EXPENSE' ? 'บันทึกรายจ่ายใหม่' : 'บันทึกรายรับใหม่')}
              </h2>
              <button className="btn-icon" onClick={() => setIsTxModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveTransaction} className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              {/* Type and Payment Method */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>ประเภทรายการ</label>
                  <select 
                    className="form-control"
                    value={txForm.subType}
                    onChange={(e) => {
                      const st = e.target.value;
                      const pm = (st === 'PETTY_CASH') ? 'PETTY_CASH' : 'TRANSFER_MAIN';
                      setTxForm(prev => ({ ...prev, subType: st, paymentMethod: pm }));
                    }}
                  >
                    <option value="MONTHLY">ค่าใช้จ่ายประจำเดือน (รปภ./ขยะ/ไฟ)</option>
                    <option value="REPAIR">ค่าปรับปรุงซ่อมแซม (ช่าง/อะไหล่)</option>
                    <option value="PETTY_CASH">วงเงินสดย่อย</option>
                    <option value="OTHER">อื่นๆ</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>วิธีจ่ายเงิน</label>
                  <select 
                    className="form-control"
                    value={txForm.paymentMethod}
                    onChange={(e) => setTxForm({ ...txForm, paymentMethod: e.target.value })}
                  >
                    <option value="TRANSFER_MAIN">โอนผ่านบัญชีนิติบุคคล (KBIZ)</option>
                    <option value="PETTY_CASH">จ่ายจากวงเงินสดย่อย (K+ / เงินสด)</option>
                    <option value="CASH">เงินสด</option>
                  </select>
                </div>
              </div>

              {/* Document Number and Reference */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>เลขที่เอกสารระบบ</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={txForm.docNumber} 
                    onChange={(e) => setTxForm({ ...txForm, docNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>เลขเดิม (อ้างอิง)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="เช่น #15, #285"
                    value={txForm.manualRefNo} 
                    onChange={(e) => setTxForm({ ...txForm, manualRefNo: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>วันที่</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={txForm.date} 
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Title & Category */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>รายการ / รายละเอียดค่าใช้จ่าย</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="เช่น ค่าซ่อมแซมสายไฟ ระบบแสงสว่าง หรือ ค่าเครื่องดื่มของว่างกรรมการ"
                  value={txForm.title} 
                  onChange={(e) => setTxForm({ ...txForm, title: e.target.value })}
                  required
                />
              </div>

              {/* Payee and Amount */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>ผู้รับเงิน / ร้านค้า</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="เช่น ช่างศักดิ์ดา, Cafe Amazon"
                    value={txForm.payee} 
                    onChange={(e) => setTxForm({ ...txForm, payee: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>พร้อมเพย์ / เลขบัญชี</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="เช่น 08x-xxx-xxxx"
                    value={txForm.payeePromptpay} 
                    onChange={(e) => setTxForm({ ...txForm, payeePromptpay: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>จำนวนเงิน (บาท)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-control" 
                    placeholder="เช่น 3000.00"
                    value={txForm.amount} 
                    onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Attachments Section */}
              <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
                  📎 อัปโหลดหลักฐานประกอบ (สลิป / บัตร ปชช. / ใบเสร็จ / รูปงาน)
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* 1. Slip */}
                  <div style={{ backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>1. สลิปโอนเงิน</span>
                      {txForm.slipUrl && <span style={{ color: '#059669', fontSize: '0.75rem' }}>✓ แนบแล้ว</span>}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileUpload(e, 'slipUrl')}
                      style={{ fontSize: '0.78rem' }}
                    />
                  </div>

                  {/* 2. ID Card */}
                  <div style={{ backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>2. บัตร ปชช.+ลายเซ็น</span>
                      {txForm.idCardUrl && <span style={{ color: '#059669', fontSize: '0.75rem' }}>✓ แนบแล้ว</span>}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileUpload(e, 'idCardUrl')}
                      style={{ fontSize: '0.78rem' }}
                    />
                  </div>

                  {/* 3. Receipt */}
                  <div style={{ backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>3. ใบเสร็จ / ใบกำกับภาษี</span>
                      {txForm.receiptUrl && <span style={{ color: '#059669', fontSize: '0.75rem' }}>✓ แนบแล้ว</span>}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileUpload(e, 'receiptUrl')}
                      style={{ fontSize: '0.78rem' }}
                    />
                  </div>

                  {/* 4. Work Photo */}
                  <div style={{ backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>4. รูปถ่ายหน้างาน ({txForm.workPhotos.length})</span>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileUpload(e, 'workPhoto')}
                      style={{ fontSize: '0.78rem' }}
                    />
                  </div>
                </div>
                {uploadingField && (
                  <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#2563EB' }}>กำลังอัปโหลดไฟล์...</div>
                )}
              </div>

              {/* Note */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>หมายเหตุเพิ่มเติม</label>
                <textarea 
                  className="form-control" 
                  rows={2} 
                  placeholder="เช่น ช่างคิดค่าแรง รวมค่าของ 3,000 บาท"
                  value={txForm.notes} 
                  onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsTxModalOpen(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD DEPOSIT --- */}
      {isDepositModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }} onClick={() => setIsDepositModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '95%' }}>
            <div className="modal-header">
              <h2 className="h2" style={{ margin: 0, fontSize: '1.25rem' }}>บันทึกรับเงินมัดจำต่อเติมบ้าน</h2>
              <button className="btn-icon" onClick={() => setIsDepositModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveDeposit} className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>บ้านเลขที่</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="เช่น 405/12"
                    value={depositForm.houseNumber} 
                    onChange={(e) => setDepositForm({ ...depositForm, houseNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>จำนวนเงินมัดจำ (บาท)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={depositForm.amount} 
                    onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>ชื่อเจ้าของบ้าน / ผู้ขอต่อเติม</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={depositForm.ownerName} 
                    onChange={(e) => setDepositForm({ ...depositForm, ownerName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>เบอร์โทรศัพท์</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={depositForm.phone} 
                    onChange={(e) => setDepositForm({ ...depositForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>รายละเอียดงานต่อเติม</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="เช่น ต่อเติมโรงจอดรถหน้าบ้าน, ขยายครัวหลังบ้าน"
                  value={depositForm.description} 
                  onChange={(e) => setDepositForm({ ...depositForm, description: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>สลิปการชำระเงินมัดจำ</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileUpload(e, 'depositSlip')}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsDepositModalOpen(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  บันทึกรับเงินมัดจำ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: REFUND DEPOSIT --- */}
      {isRefundModalOpen && selectedDeposit && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }} onClick={() => setIsRefundModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', width: '95%' }}>
            <div className="modal-header">
              <h2 className="h2" style={{ margin: 0, fontSize: '1.25rem' }}>
                ตรวจงาน & คืนเงินมัดจำ (บ้าน {selectedDeposit.houseNumber})
              </h2>
              <button className="btn-icon" onClick={() => setIsRefundModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleProcessRefund} className="modal-body">
              <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748B' }}>เจ้าของบ้าน:</span>
                  <strong style={{ color: '#1E293B' }}>{selectedDeposit.ownerName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748B' }}>เงินมัดจำที่ถือครอง:</span>
                  <strong style={{ color: '#059669', fontSize: '1.1rem' }}>{selectedDeposit.amount.toLocaleString()} ฿</strong>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>ผลการตรวจหน้างาน</label>
                <select 
                  className="form-control"
                  value={refundForm.status}
                  onChange={(e) => {
                    const st = e.target.value;
                    if (st === 'REFUNDED') {
                      setRefundForm(prev => ({
                        ...prev,
                        status: st,
                        deductedAmount: '0',
                        refundedAmount: String(selectedDeposit.amount),
                        inspectionNotes: 'ตรวจงานผ่าน ไม่พบความเสียหายต่อทรัพย์สินส่วนกลาง'
                      }));
                    } else {
                      setRefundForm(prev => ({
                        ...prev,
                        status: st,
                        inspectionNotes: 'พบความเสียหายต่อทรัพย์สินส่วนกลาง ต้องหักเงินมัดจำชดใช้'
                      }));
                    }
                  }}
                >
                  <option value="REFUNDED">✅ ตรวจงานผ่าน - คืนเงินเต็มจำนวน</option>
                  <option value="DEDUCTED">⚠️ พบความเสียหาย - หักค่าชดใช้และคืนส่วนที่เหลือ</option>
                </select>
              </div>

              {refundForm.status === 'DEDUCTED' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>หักค่าเสียหาย (บาท)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={refundForm.deductedAmount}
                      onChange={(e) => {
                        const ded = parseFloat(e.target.value) || 0;
                        const rem = Math.max(0, selectedDeposit.amount - ded);
                        setRefundForm(prev => ({ ...prev, deductedAmount: e.target.value, refundedAmount: String(rem) }));
                      }}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>ยอดเงินโอนคืน (บาท)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={refundForm.refundedAmount}
                      readOnly
                    />
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>บันทึกผลการตรวจสอบ</label>
                <textarea 
                  className="form-control" 
                  rows={2} 
                  value={refundForm.inspectionNotes}
                  onChange={(e) => setRefundForm({ ...refundForm, inspectionNotes: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>สลิปการโอนเงินคืนลูกบ้าน</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileUpload(e, 'refundSlip')}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsRefundModalOpen(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#059669', borderColor: '#059669' }}>
                  ยืนยันการคืนเงิน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: TOPUP PETTY CASH (กรรมการโอนเติมเงินสดย่อย 5,000 บ.) --- */}
      {isTopupModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }} onClick={() => setIsTopupModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', width: '95%' }}>
            <div className="modal-header">
              <h2 className="h2" style={{ margin: 0, fontSize: '1.25rem' }}>
                บันทึกรับเงินเติมสดย่อย (จากกรรมการ)
              </h2>
              <button className="btn-icon" onClick={() => setIsTopupModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveTopup} className="modal-body">
              <div style={{ backgroundColor: '#ECFDF5', padding: '14px', borderRadius: '10px', border: '1px solid #A7F3D0', marginBottom: '16px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#065F46', lineHeight: 1.5 }}>
                  💡 เมื่อเงินสดย่อยใกล้หมด กรรมการจะโอนเติมเข้ามาครั้งละ <strong>5,000 บาท</strong> กรุณากรอกวันที่และแนบสลิปโอนเงินเพื่อใช้เป็นหลักฐานสรุปสิ้นเดือน
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>จำนวนเงินที่โอนเติม (บาท)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-control" 
                    value={topupForm.amount}
                    onChange={(e) => setTopupForm({ ...topupForm, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>วันที่โอนเงิน</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={topupForm.date}
                    onChange={(e) => setTopupForm({ ...topupForm, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>โอนมาจาก (บัญชี / กรรมการ)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="เช่น บัญชีนิติบุคคล กสิกรไทย หรือ นาย..."
                  value={topupForm.transferFrom}
                  onChange={(e) => setTopupForm({ ...topupForm, transferFrom: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>สลิปการโอนเงินของกรรมการ</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileUpload(e, 'topupSlip')}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>หมายเหตุ</label>
                <textarea 
                  className="form-control" 
                  rows={2} 
                  placeholder="เช่น เติมครั้งที่ 1 เดือน ต.ค. 69"
                  value={topupForm.notes}
                  onChange={(e) => setTopupForm({ ...topupForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsTopupModalOpen(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#059669', borderColor: '#059669' }}>
                  บันทึกการเติมเงิน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PREVIEW IMAGE MODAL --- */}
      {previewImage && (
        <div 
          className="modal-overlay" 
          style={{ display: 'flex', zIndex: 1100, backgroundColor: 'rgba(0,0,0,0.85)' }} 
          onClick={() => setPreviewImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button 
              onClick={() => setPreviewImage(null)}
              style={{ 
                position: 'absolute', 
                top: '-40px', 
                right: '0', 
                backgroundColor: 'transparent', 
                border: 'none', 
                color: 'white', 
                cursor: 'pointer',
                fontSize: '1.5rem'
              }}
            >
              ✕ ปิด
            </button>
            <img 
              src={previewImage} 
              alt="หลักฐานประกอบ" 
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
