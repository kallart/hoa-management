import React, { useState, useEffect } from 'react';
import { Camera, AlertCircle, CheckCircle, Search, Edit2, Zap } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function CctvSystem() {
  const [cameras, setCameras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<any>(null);
  const [updateStatus, setUpdateStatus] = useState('normal');
  const [updatePower, setUpdatePower] = useState('solar');
  const [updateNotes, setUpdateNotes] = useState('');
  const [logDescription, setLogDescription] = useState('');
  const [imageError, setImageError] = useState(false);

  const fetchCameras = async () => {
    try {
      const response = await api.get('/api/cctv');
      setCameras(response.data);
    } catch (error) {
      toast.error('ไม่สามารถดึงข้อมูลกล้องวงจรปิดได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  const handleSeed = async () => {
    try {
      await api.post('/api/cctv/seed');
      toast.success('สร้างข้อมูลเริ่มต้นเรียบร้อยแล้ว');
      fetchCameras();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด หรือมีการสร้างข้อมูลไปแล้ว');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/api/cctv/${selectedCamera.id}`, {
        status: updateStatus,
        powerSource: updatePower,
        notes: updateNotes,
        logDescription: logDescription
      });
      toast.success('อัปเดตข้อมูลกล้องเรียบร้อยแล้ว');
      setIsModalOpen(false);
      fetchCameras();
    } catch (error) {
      toast.error('ไม่สามารถอัปเดตข้อมูลได้');
    }
  };

  const openModal = (camera: any) => {
    setSelectedCamera(camera);
    setUpdateStatus(camera.status);
    setUpdatePower(camera.powerSource);
    setUpdateNotes(camera.notes || '');
    setLogDescription('');
    setIsModalOpen(true);
  };

  const filteredCameras = cameras.filter(c => 
    c.cameraNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: cameras.length,
    normal: cameras.filter(c => c.status === 'normal').length,
    warning: cameras.filter(c => c.status === 'warning').length,
    offline: cameras.filter(c => c.status === 'offline').length,
    solar: cameras.filter(c => c.powerSource === 'solar').length,
    grid: cameras.filter(c => c.powerSource === 'grid').length,
  };

  if (loading) return <div className="page-container"><div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>กำลังโหลดข้อมูล...</div></div>;

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="h1">ระบบบำรุงรักษากล้องวงจรปิด</h1>
          <p className="text-muted">จัดการและติดตามสถานะการทำงานของกล้องวงจรปิดภายในหมู่บ้าน</p>
        </div>
        {cameras.length === 0 && (
          <button className="btn btn-primary" onClick={handleSeed}>สร้างข้อมูลเริ่มต้น 18 ตัว</button>
        )}
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#DBEAFE', color: '#3B82F6' }}><Camera size={24} /></div>
          <div className="stat-content">
            <p className="stat-label">กล้องทั้งหมด</p>
            <h3 className="stat-value">{stats.total} ตัว</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#D1FAE5', color: '#10B981' }}><CheckCircle size={24} /></div>
          <div className="stat-content">
            <p className="stat-label">ใช้งานได้ปกติ</p>
            <h3 className="stat-value" style={{ color: '#10B981' }}>{stats.normal} ตัว</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#FEF3C7', color: '#F59E0B' }}><AlertCircle size={24} /></div>
          <div className="stat-content">
            <p className="stat-label">มีปัญหา/ขัดข้อง</p>
            <h3 className="stat-value" style={{ color: '#F59E0B' }}>{stats.warning + stats.offline} ตัว</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#E0E7FF', color: '#6366F1' }}><Zap size={24} /></div>
          <div className="stat-content">
            <p className="stat-label">ระบบไฟ</p>
            <h3 className="stat-value" style={{ fontSize: '1.2rem' }}>โซล่าร์: {stats.solar} / ไฟบ้าน: {stats.grid}</h3>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {/* Map Section */}
        <div className="card">
          <div className="card-header">
            <h2 className="h2" style={{ margin: 0 }}>แผนผังกล้องวงจรปิด (CCTV Map)</h2>
          </div>
          <div className="card-body" style={{ padding: 0, backgroundColor: '#F3F4F6', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '100%', overflow: 'auto', maxHeight: '600px' }}>
              {!imageError ? (
                <img 
                  src="/map-cctv.png" 
                  alt="Village Map with CCTV Locations" 
                  style={{ width: '100%', minWidth: '800px', display: 'block' }}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div style={{ height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#6B7280', border: '2px dashed #D1D5DB', margin: '20px', borderRadius: '12px', backgroundColor: 'white' }}>
                  <AlertCircle size={48} style={{ marginBottom: '15px', color: '#9CA3AF' }} />
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#374151' }}>ยังไม่มีรูปแผนผังกล้องวงจรปิด</h3>
                  <p style={{ margin: 0 }}>กรุณานำรูปแผนผังที่คุณ KONG แคปไว้ มาเซฟชื่อว่า <strong>map-cctv.png</strong></p>
                  <p style={{ margin: '5px 0 0 0' }}>แล้วนำไปวางในโฟลเดอร์ <code>frontend/public/</code> ครับ</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h2 className="h2" style={{ margin: 0 }}>รายการกล้องวงจรปิด</h2>
            <div className="search-box" style={{ maxWidth: '300px' }}>
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                className="form-input" 
                placeholder="ค้นหาหมายเลขหรือจุดติดตั้ง..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>หมายเลข</th>
                    <th>จุดติดตั้ง</th>
                    <th>สถานะ</th>
                    <th>แหล่งจ่ายไฟ</th>
                    <th>หมายเหตุล่าสุด</th>
                    <th style={{ width: '100px' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCameras.map((camera) => (
                    <tr key={camera.id}>
                      <td style={{ fontWeight: 'bold' }}>{camera.cameraNumber}</td>
                      <td>{camera.location}</td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold',
                          backgroundColor: camera.status === 'normal' ? '#D1FAE5' : camera.status === 'warning' ? '#FEF3C7' : '#FEE2E2',
                          color: camera.status === 'normal' ? '#065F46' : camera.status === 'warning' ? '#92400E' : '#991B1B'
                        }}>
                          {camera.status === 'normal' ? 'ปกติ' : camera.status === 'warning' ? 'ขัดข้องบางส่วน' : 'ออฟไลน์'}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: '#4B5563' }}>
                          <Zap size={14} color={camera.powerSource === 'solar' ? '#F59E0B' : '#6366F1'} />
                          {camera.powerSource === 'solar' ? 'โซล่าร์เซลล์' : 'ไฟบ้าน (Grid)'}
                        </span>
                      </td>
                      <td style={{ color: camera.notes ? '#EF4444' : '#6B7280' }}>
                        {camera.notes || '-'}
                      </td>
                      <td>
                        <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => openModal(camera)}>
                          <Edit2 size={16} /> แก้ไข
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredCameras.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#6B7280' }}>
                        ไม่พบข้อมูลกล้องวงจรปิด
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && selectedCamera && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="h2" style={{ margin: 0 }}>อัปเดตสถานะ {selectedCamera.cameraNumber}</h2>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div style={{ marginBottom: '15px' }}>
                  <label className="form-label">จุดติดตั้ง</label>
                  <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>{selectedCamera.location}</p>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label className="form-label">สถานะกล้อง</label>
                  <select className="form-input" value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)}>
                    <option value="normal">✅ ทำงานปกติ</option>
                    <option value="warning">⚠️ ขัดข้องบางส่วน (เช่น ภาพติดแต่โซล่าร์ไม่ชาร์จ)</option>
                    <option value="offline">❌ ออฟไลน์ / เปิดไม่ติด</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label className="form-label">ระบบจ่ายไฟ</label>
                  <select className="form-input" value={updatePower} onChange={(e) => setUpdatePower(e.target.value)}>
                    <option value="solar">☀️ โซล่าร์เซลล์</option>
                    <option value="grid">⚡ ไฟบ้าน (Grid)</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label className="form-label">อาการเสีย / หมายเหตุกำกับกล้อง</label>
                  <textarea 
                    className="form-input" 
                    rows={2} 
                    value={updateNotes} 
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    placeholder="เช่น เปิดติด แต่ใช้ไฟจากโซล่าร์ไม่ได้"
                  />
                </div>
                
                <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '20px 0' }} />
                
                <div style={{ marginBottom: '15px' }}>
                  <label className="form-label" style={{ color: '#4F46E5' }}>เพิ่มประวัติการซ่อมบำรุง (Log)</label>
                  <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: '0 0 8px 0' }}>หากมีการเข้าไปซ่อมแซม สามารถบันทึกรายละเอียดไว้เป็นประวัติได้</p>
                  <textarea 
                    className="form-input" 
                    rows={3} 
                    value={logDescription} 
                    onChange={(e) => setLogDescription(e.target.value)}
                    placeholder="รายละเอียดสิ่งที่ดำเนินการแก้ไข (เช่น เปลี่ยนแบตเตอรี่, ย้ายจุดรับแสง)"
                  />
                </div>
                
                {selectedCamera.maintenanceLogs?.length > 0 && (
                  <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>ประวัติล่าสุด</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#4B5563' }}>
                      {selectedCamera.maintenanceLogs.slice(0, 3).map((log: any) => (
                        <li key={log.id} style={{ marginBottom: '5px' }}>
                          <strong>{new Date(log.createdAt).toLocaleDateString('th-TH')}:</strong> {log.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
