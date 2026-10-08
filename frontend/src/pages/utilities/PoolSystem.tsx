import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Droplets, Activity, Plus, AlertCircle, Calendar, BatteryFull, Edit2, Trash2, Beaker, LogOut } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, LabelList } from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface PoolLog {
  id: string;
  date: string;
  cl: number;
  ph: number;
  salt: number;
  notes: string;
}

const CustomLabel = (props: any) => {
  const { x, y, value, color } = props;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-15} y={-22} width={30} height={18} fill={color} rx={4} stroke="white" strokeWidth={1.5} />
      <text x={0} y={-9} fill="white" fontSize={11} fontWeight="bold" textAnchor="middle">{value}</text>
    </g>
  );
};

const PoolSystem: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isViewer = !user || user.role === 'VIEWER';
  const [logs, setLogs] = useState<PoolLog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ cl: '', ph: '', salt: '', notes: '', date: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/api/pool-quality');
      setLogs(response.data);
    } catch (error) {
      toast.error('ไม่สามารถดึงข้อมูลสระว่ายน้ำได้');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/api/pool-quality/${editingId}`, formData);
        toast.success('แก้ไขข้อมูลสำเร็จ');
      } else {
        await api.post('/api/pool-quality', formData);
        toast.success('บันทึกข้อมูลสำเร็จ');
      }
      setIsModalOpen(false);
      setEditingId(null);
      fetchLogs();
      setFormData({ cl: '', ph: '', salt: '', notes: '', date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (log: PoolLog) => {
    setFormData({
      cl: log.cl.toString(),
      ph: log.ph.toString(),
      salt: log.salt.toString(),
      notes: log.notes || '',
      date: new Date(log.date).toISOString().split('T')[0]
    });
    setEditingId(log.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('คุณต้องการลบข้อมูลนี้ใช่หรือไม่?')) {
      try {
        await api.delete(`/api/pool-quality/${id}`);
        toast.success('ลบข้อมูลสำเร็จ');
        fetchLogs();
      } catch (error) {
        toast.error('เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    }
  };

  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;

  // Calculate generic score based on ideal ranges (pH 7.2-7.6, Cl 1.0-3.0, Salt 2.5-4.5 ppt)
  const calculateScore = (log: PoolLog | null) => {
    if (!log) return 0;
    let score = 100;
    if (log.ph < 7.0 || log.ph > 7.8) score -= 20;
    else if (log.ph < 7.2 || log.ph > 7.6) score -= 10;
    if (log.cl < 1.0 || log.cl > 4.0) score -= 20;
    else if (log.cl > 3.0) score -= 10;
    if (log.salt < 2.0 || log.salt > 4.5) score -= 20;
    return Math.max(0, score);
  };

  const currentScore = calculateScore(latestLog);

  // Formatting date for charts (Last 7 days only)
  const chartData = logs.slice(-7).map(log => ({
    ...log,
    displayDate: new Date(log.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  }));

  return (
    <div className="page-container" style={{ ...(isViewer ? { maxWidth: '800px', margin: '0 auto' } : {}), overflowX: 'hidden', boxSizing: 'border-box' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ paddingTop: '5px' }}>
          <h1 className="h1" style={{ margin: 0, lineHeight: 1 }}>สระว่ายน้ำส่วนกลาง หมู่บ้านจัดสรร รอยัลราชาวดี</h1>
        </div>
        {!isViewer && (
          <button className="btn btn-primary no-print" onClick={() => setIsModalOpen(true)}>
            <Plus size={20} /> บันทึกค่าน้ำวันนี้
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* Left Column: Cards */}
        <div style={{ display: 'grid', gridTemplateRows: 'auto auto auto 1fr', gap: '20px', height: '100%' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 className="h2 text-muted" style={{ margin: 0, lineHeight: 1 }}>บันทึกและติดตามคุณภาพน้ำรายวัน</h2>
            <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '4px 12px', borderRadius: '20px', margin: 0 }} className="h2">
              {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          
          <div style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', padding: '10px 15px', borderRadius: '8px', fontSize: '1.1rem', display: 'flex', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ flex: 1, minWidth: '200px' }}><strong>แจ้งวันเปิดปิดสระว่ายน้ำประจำสัปดาห์:</strong> ปิดทุกวันอาทิตย์ 19:00 น. ถึง วันอังคาร 16:00 น.</span>
          </div>

          {/* Small Data Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px 15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '160px' }}>
              <p style={{ color: '#6B7280', margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 'bold' }}>SALT (เกลือ)</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Droplets size={32} color="#10B981" style={{ flexShrink: 0 }} />
                <h2 style={{ margin: 0, fontSize: '2.6rem', color: '#1F2937', lineHeight: 1 }}>{latestLog?.salt || 0} <span style={{ fontSize: '1.2rem', color: '#6B7280', fontWeight: 'normal' }}>ppt</span></h2>
              </div>
              <p style={{ margin: '20px 0 0 0', fontSize: '0.9rem', color: '#6B7280', backgroundColor: '#F3F4F6', padding: '8px', borderRadius: '8px', textAlign: 'center', marginTop: 'auto' }}>ค่าปกติ: 2.5-4.5</p>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px 15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '160px' }}>
              <p style={{ color: '#6B7280', margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 'bold' }}>CHLORINE (คลอรีน)</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={32} color="#3B82F6" style={{ flexShrink: 0 }} />
                <h2 style={{ margin: 0, fontSize: '2.6rem', color: '#1F2937', lineHeight: 1 }}>{latestLog?.cl || 0} <span style={{ fontSize: '1.2rem', color: '#6B7280', fontWeight: 'normal' }}>ppm</span></h2>
              </div>
              <p style={{ margin: '20px 0 0 0', fontSize: '0.9rem', color: '#6B7280', backgroundColor: '#F3F4F6', padding: '8px', borderRadius: '8px', textAlign: 'center', marginTop: 'auto' }}>ค่าปกติ: 1.0-3.0</p>
            </div>

            <div style={{ backgroundColor: '#1E3A8A', color: 'white', borderRadius: '16px', padding: '20px 15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '160px' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 'bold', opacity: 0.8 }}>PH LEVEL</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Beaker size={32} color="#93C5FD" style={{ flexShrink: 0 }} />
                <h2 style={{ margin: 0, fontSize: '2.6rem', lineHeight: 1 }}>{latestLog?.ph || 0}</h2>
              </div>
              <p style={{ margin: '20px 0 0 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', backgroundColor: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '8px', textAlign: 'center', marginTop: 'auto' }}>ค่าปกติ: 7.2-7.6</p>
            </div>
          </div>

{/* Chart Section */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', margin: 0, flex: 1 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h2 className="h2" style={{ margin: 0 }}>แนวโน้มค่า pH และ คลอรีน</h2>
            <div style={{ display: 'flex', gap: '15px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}><div style={{ width: '10px', height: '10px', backgroundColor: '#3B82F6', borderRadius: '50%' }}></div> pH Level</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}><div style={{ width: '10px', height: '10px', backgroundColor: '#10B981', borderRadius: '50%' }}></div> Chlorine</span>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '280px' }}>
            {chartData.length > 0 ? (
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 25, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPh" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCl" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} domain={[0, 8]} ticks={[0, 2, 4, 6, 8]} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                      />
                      <Area type="monotone" dataKey="ph" name="pH Level" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorPh)" activeDot={{ r: 6 }} dot={false}>
                        <LabelList dataKey="ph" content={(props: any) => <CustomLabel {...props} color="#3B82F6" />} />
                      </Area>
                      <Area type="monotone" dataKey="cl" name="Chlorine" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorCl)" activeDot={{ r: 6 }} dot={false}>
                        <LabelList dataKey="cl" content={(props: any) => <CustomLabel {...props} color="#10B981" />} />
                      </Area>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#9CA3AF' }}>
                ยังไม่มีข้อมูล
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: History Table */}
      {!isViewer && (
        <div className="card no-print" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h2 className="h2" style={{ margin: 0 }}>ประวัติการบันทึกค่าน้ำ</h2>
          </div>
          <div className="card-body p-0" style={{ maxHeight: '450px', overflowY: 'auto' }}>
            <table className="table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#F9FAFB', zIndex: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <tr>
                  <th>วันที่</th>
                  <th>คลอรีน (Cl)</th>
                  <th>ความเป็นกรดด่าง (pH)</th>
                  <th>เกลือ (Salt)</th>
                  <th>หมายเหตุ</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#6B7280' }}>ยังไม่มีประวัติการบันทึก</td>
                  </tr>
                ) : (
                  [...logs].reverse().map(log => (
                    <tr key={log.id}>
                      <td>{new Date(log.date).toLocaleDateString('th-TH')}</td>
                      <td><span style={{ color: log.cl < 1 || log.cl > 3 ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>{log.cl}</span> ppm</td>
                      <td><span style={{ color: log.ph < 7.2 || log.ph > 7.8 ? '#EF4444' : '#3B82F6', fontWeight: 'bold' }}>{log.ph}</span></td>
                      <td>{log.salt} ppt</td>
                      <td>{log.notes || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                          <button 
                            className="btn-icon" 
                            title="แก้ไข" 
                            onClick={() => handleEdit(log)}
                            style={{ color: '#6B7280', padding: '4px' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn-icon" 
                            title="ลบ" 
                            onClick={() => handleDelete(log.id)}
                            style={{ color: '#EF4444', padding: '4px' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {isViewer && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', paddingBottom: '30px' }}>
          {user ? (
            <button 
              className="btn btn-secondary no-print" 
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', borderColor: '#EF4444', backgroundColor: 'white', padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold' }}
            >
              <LogOut size={20} /> ออกจากระบบ
            </button>
          ) : (
            <button 
              className="btn btn-primary no-print" 
              onClick={() => navigate('/login')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold' }}
            >
              เข้าสู่ระบบ (สำหรับนิติบุคคล)
            </button>
          )}
        </div>
      )}


      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '100%' }}>
            <div className="modal-header">
              <h2 className="h2" style={{ margin: 0 }}>{editingId ? 'แก้ไขข้อมูลค่าน้ำ' : 'บันทึกค่าน้ำประจำวัน'}</h2>
              <button className="btn-icon" onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ cl: '', ph: '', salt: '', notes: '', date: new Date().toISOString().split('T')[0] }); }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>วันที่บันทึก</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>ค่าคลอรีน (Chlorine - ppm)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="form-control" 
                  placeholder="เช่น 1.5"
                  value={formData.cl}
                  onChange={(e) => setFormData({...formData, cl: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>ค่าความเป็นกรดด่าง (pH)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="form-control" 
                  placeholder="เช่น 7.4"
                  value={formData.ph}
                  onChange={(e) => setFormData({...formData, ph: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>ค่าเกลือ (Salt - ppt)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="form-control" 
                  placeholder="เช่น 3.0"
                  value={formData.salt}
                  onChange={(e) => setFormData({...formData, salt: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>หมายเหตุ (ถ้ามี)</label>
                <textarea 
                  className="form-control" 
                  rows={3}
                  placeholder="เช่น เติมคลอรีนเพิ่ม 1 กก., ล้างสระ ฯลฯ"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ cl: '', ph: '', salt: '', notes: '', date: new Date().toISOString().split('T')[0] }); }}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoolSystem;
