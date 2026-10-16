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
  const [updateLocation, setUpdateLocation] = useState('');
  const [updateStatus, setUpdateStatus] = useState('normal');
  const [updatePower, setUpdatePower] = useState('solar');
  const [updateWarranty, setUpdateWarranty] = useState('อยู่ในประกัน');
  const [updateIssue, setUpdateIssue] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [imageError, setImageError] = useState(false);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [uploadingMap, setUploadingMap] = useState(false);

  const fetchCameras = async () => {
    try {
      const response = await api.get('/api/cctv');
      setCameras(response.data);
      
      const settingsRes = await api.get('/api/settings');
      if (settingsRes.data && settingsRes.data.cctvMapUrl) {
        setMapUrl(settingsRes.data.cctvMapUrl);
        setImageError(false);
      }
    } catch (error) {
      toast.error('ไม่สามารถดึงข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  const handleMapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('map', file);

    try {
      setUploadingMap(true);
      const res = await api.post('/api/settings/upload-map', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMapUrl(res.data.url);
      setImageError(false);
      toast.success('อัปโหลดแผนผังเรียบร้อยแล้ว');
    } catch (error) {
      console.error(error);
      toast.error('ไม่สามารถอัปโหลดแผนผังได้');
    } finally {
      setUploadingMap(false);
    }
  };

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
        location: updateLocation,
        status: updateStatus,
        powerSource: updatePower,
        warrantyStatus: updateWarranty,
        issue: updateIssue,
        notes: updateNotes
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
    setUpdateLocation(camera.location || '');
    setUpdateStatus(camera.status);
    setUpdatePower(camera.powerSource);
    setUpdateWarranty(camera.warrantyStatus || 'อยู่ในประกัน');
    setUpdateIssue(camera.issue || '');
    setUpdateNotes(camera.notes || '');
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
      {/* Top Header / Description */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <p className="text-muted" style={{ margin: 0, fontSize: '0.95rem' }}>
          จัดการและติดตามสถานะการทำงานของกล้องวงจรปิดภายในหมู่บ้าน
        </p>
        {cameras.length === 0 && (
          <button className="btn btn-primary" onClick={handleSeed} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
            สร้างข้อมูลเริ่มต้น 18 ตัว
          </button>
        )}
      </div>

      {/* Top 2-Column Section: Left Stats Cards, Right CCTV Map */}
      <div className="cctv-top-grid" style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        gap: '20px',
        alignItems: 'stretch',
        marginBottom: '24px'
      }}>
        {/* Left: 4 Stat Cards Stacked Vertically */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Card 1: กล้องทั้งหมด */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #E5E7EB',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: '#DBEAFE',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Camera size={20} color="#2563EB" />
            </div>
            <div style={{ padding: '12px 16px' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#4B5563', fontWeight: 500 }}>
                กล้องทั้งหมด
              </p>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold', color: '#111827', lineHeight: 1.2 }}>
                {stats.total} ตัว
              </h3>
            </div>
          </div>

          {/* Card 2: ใช้งานได้ปกติ */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #E5E7EB',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: '#D1FAE5',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <CheckCircle size={20} color="#059669" />
            </div>
            <div style={{ padding: '12px 16px' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#4B5563', fontWeight: 500 }}>
                ใช้งานได้ปกติ
              </p>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold', color: '#059669', lineHeight: 1.2 }}>
                {stats.normal} ตัว
              </h3>
            </div>
          </div>

          {/* Card 3: มีปัญหา/ขัดข้อง */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #E5E7EB',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: '#FEF3C7',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <AlertCircle size={20} color="#D97706" />
            </div>
            <div style={{ padding: '12px 16px' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#4B5563', fontWeight: 500 }}>
                มีปัญหา/ขัดข้อง
              </p>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold', color: '#D97706', lineHeight: 1.2 }}>
                {stats.warning + stats.offline} ตัว
              </h3>
            </div>
          </div>

          {/* Card 4: ระบบไฟ */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #E5E7EB',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: '#E0E7FF',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Zap size={20} color="#4F46E5" />
            </div>
            <div style={{ padding: '12px 16px' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#4B5563', fontWeight: 500 }}>
                ระบบไฟ
              </p>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold', color: '#111827', lineHeight: 1.2 }}>
                โซล่าร์: {stats.solar} / ไฟบ้าน: {stats.grid}
              </h3>
            </div>
          </div>
        </div>

        {/* Right: CCTV Map Card (No header, no scrollbar, fits frame) */}
        <div 
          style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            padding: '8px'
          }}
          onDoubleClick={() => document.getElementById('mapUpload')?.click()}
          title="ดับเบิ้ลคลิกเพื่ออัปโหลดรูปแผนผังใหม่"
        >
          <input 
            type="file" 
            id="mapUpload" 
            accept="image/*" 
            style={{ display: 'none' }} 
            onChange={handleMapUpload}
          />
          {!imageError ? (
            <img 
              src={mapUrl || "/map-cctv.png"} 
              alt="Village Map with CCTV Locations" 
              style={{ 
                width: '100%', 
                height: '100%', 
                maxHeight: '365px', 
                objectFit: 'contain', 
                display: 'block' 
              }}
              onError={() => setImageError(true)}
            />
          ) : (
            <div 
              style={{
                height: '100%',
                minHeight: '260px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#6B7280',
                border: '2px dashed #D1D5DB',
                margin: '10px',
                width: '100%',
                borderRadius: '8px',
                backgroundColor: '#F9FAFB',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('mapUpload')?.click()}
            >
              <AlertCircle size={40} style={{ marginBottom: '10px', color: '#9CA3AF' }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: '#374151' }}>ยังไม่มีรูปแผนผังกล้องวงจรปิด</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>คลิกเพื่ออัปโหลดรูปแผนผัง</p>
            </div>
          )}
        </div>
      </div>

      {/* Table Section: รายการกล้องวงจรปิด */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #E5E7EB',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid #F1F5F9'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1E293B' }}>
            รายการกล้องวงจรปิด
          </h2>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="ค้นหาหมายเลขหรือจุดติดตั้ง..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '36px',
                paddingTop: '7px',
                paddingBottom: '7px',
                fontSize: '0.85rem',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <div className="table-responsive" style={{ margin: 0 }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAFBFD', borderBottom: '1px solid #F1F5F9' }}>
                <th style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: 500, fontSize: '0.85rem' }}>หมายเลข</th>
                <th style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: 500, fontSize: '0.85rem' }}>จุดติดตั้ง</th>
                <th style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: 500, fontSize: '0.85rem' }}>สถานะ</th>
                <th style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: 500, fontSize: '0.85rem' }}>แหล่งจ่ายไฟ</th>
                <th style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: 500, fontSize: '0.85rem' }}>สถานะประกัน</th>
                <th style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: 500, fontSize: '0.85rem' }}>ตรวจสอบล่าสุด</th>
                <th style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: 500, fontSize: '0.85rem' }}>อาการเสีย</th>
                <th style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: 500, fontSize: '0.85rem' }}>หมายเหตุ</th>
                <th style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: 500, fontSize: '0.85rem', textAlign: 'center', width: '80px' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredCameras.map((camera) => (
                <tr key={camera.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 'bold', color: '#0F172A' }}>{camera.cameraNumber}</td>
                  <td style={{ padding: '16px 20px', color: '#334155' }}>{camera.location}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '6px', 
                      fontSize: '0.85rem', 
                      fontWeight: 600,
                      backgroundColor: camera.status === 'normal' ? '#D1FAE5' : camera.status === 'warning' ? '#FEF3C7' : '#FEE2E2',
                      color: camera.status === 'normal' ? '#065F46' : camera.status === 'warning' ? '#92400E' : '#991B1B',
                      display: 'inline-block'
                    }}>
                      {camera.status === 'normal' ? 'ปกติ' : camera.status === 'warning' ? 'ขัดข้องบางส่วน' : 'ออฟไลน์'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#475569' }}>
                      <Zap size={15} color={camera.powerSource === 'solar' ? '#F59E0B' : '#6366F1'} fill={camera.powerSource === 'solar' ? '#F59E0B' : 'none'} />
                      {camera.powerSource === 'solar' ? 'โซล่าร์เซลล์' : 'ไฟบ้าน (Grid)'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '6px', 
                      fontSize: '0.85rem', 
                      fontWeight: 600,
                      backgroundColor: (camera.warrantyStatus === 'อยู่ในประกัน' || !camera.warrantyStatus) ? '#E0F2FE' : '#F1F5F9',
                      color: (camera.warrantyStatus === 'อยู่ในประกัน' || !camera.warrantyStatus) ? '#0284C7' : '#64748B',
                      display: 'inline-block'
                    }}>
                      {camera.warrantyStatus || 'อยู่ในประกัน'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>
                        {camera.updatedAt 
                          ? new Date(camera.updatedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) 
                          : '-'}
                      </span>
                      {camera.updatedAt && (
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          {new Date(camera.updatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: camera.issue ? '#DC2626' : '#94A3B8', fontWeight: camera.issue ? 500 : 400 }}>
                    {camera.issue || '-'}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#475569' }}>
                    {camera.notes || '-'}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <button 
                      onClick={() => openModal(camera)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        display: 'inline-flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: '2px',
                        color: '#334155',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}
                      title="แก้ไขข้อมูลกล้อง"
                    >
                      <Edit2 size={16} color="#334155" />
                      <span style={{ fontSize: '0.75rem', color: '#334155' }}>แก้ไข</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCameras.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: '#6B7280' }}>
                    ไม่พบข้อมูลกล้องวงจรปิด
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && selectedCamera && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }} onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', width: '92%' }}>
            <div className="modal-header">
              <div>
                <h2 className="h2" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
                  แก้ไขข้อมูล {selectedCamera.cameraNumber}
                </h2>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                  อัปเดตจุดติดตั้ง สถานะ และบันทึกประวัติการดูแล
                </p>
              </div>
              <button 
                type="button" 
                className="btn-icon" 
                onClick={() => setIsModalOpen(false)}
                title="ปิด"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="modal-body" style={{ padding: '20px 24px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  จุดติดตั้ง
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={updateLocation} 
                  onChange={(e) => setUpdateLocation(e.target.value)}
                  placeholder="เช่น หน้าป้อม รปภ (ซ้าย)"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    สถานะการทำงาน
                  </label>
                  <select 
                    className="form-control" 
                    value={updateStatus} 
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="normal">✅ ปกติ</option>
                    <option value="warning">⚠️ ขัดข้องบางส่วน</option>
                    <option value="offline">❌ ออฟไลน์</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    ระบบจ่ายไฟ
                  </label>
                  <select 
                    className="form-control" 
                    value={updatePower} 
                    onChange={(e) => setUpdatePower(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="solar">☀️ โซล่าร์เซลล์</option>
                    <option value="grid">⚡ ไฟบ้าน (Grid)</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  สถานะประกัน
                </label>
                <select 
                  className="form-control" 
                  value={updateWarranty} 
                  onChange={(e) => setUpdateWarranty(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="อยู่ในประกัน">🛡️ อยู่ในประกัน</option>
                  <option value="หมดประกัน">⏳ หมดประกัน</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  อาการเสีย (ถ้ามี)
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={updateIssue} 
                  onChange={(e) => setUpdateIssue(e.target.value)}
                  placeholder="เช่น เปิดติด แต่ใช้ไฟจากโซล่าร์ไม่ได้, เปิดไม่ติด ชาร์จไม่เข้า"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  หมายเหตุ
                </label>
                <textarea 
                  className="form-control" 
                  rows={2} 
                  value={updateNotes} 
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="เช่น ทำความสะอาดแผงโซล่าร์แล้ว, เปลี่ยนแบตเตอรี่ใหม่, รอนัดช่างเข้าดู..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Log History */}
              {selectedCamera.maintenanceLogs && selectedCamera.maintenanceLogs.length > 0 && (
                <div style={{ 
                  marginTop: '12px',
                  padding: '12px 14px', 
                  backgroundColor: '#F8FAFC', 
                  borderRadius: '8px', 
                  border: '1px solid #E2E8F0' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
                      📋 ประวัติหมายเหตุ / การบันทึกย้อนหลัง
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      {selectedCamera.maintenanceLogs.length} รายการ
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                    {selectedCamera.maintenanceLogs.map((log: any) => (
                      <div key={log.id} style={{ 
                        fontSize: '0.8rem', 
                        padding: '6px 10px', 
                        backgroundColor: '#FFFFFF', 
                        borderRadius: '6px',
                        border: '1px solid #F1F5F9',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: '#334155' }}>
                            {new Date(log.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} {new Date(log.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                          </span>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            padding: '1px 6px', 
                            borderRadius: '4px',
                            backgroundColor: log.status === 'normal' ? '#D1FAE5' : log.status === 'warning' ? '#FEF3C7' : '#FEE2E2',
                            color: log.status === 'normal' ? '#065F46' : log.status === 'warning' ? '#92400E' : '#991B1B'
                          }}>
                            {log.status === 'normal' ? 'ปกติ' : log.status === 'warning' ? 'ขัดข้อง' : 'ออฟไลน์'}
                          </span>
                        </div>
                        <span style={{ color: '#64748B' }}>{log.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
