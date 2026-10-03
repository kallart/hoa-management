import React from 'react';
import { Activity, Droplets, Camera, AlertTriangle } from 'lucide-react';

const UtilitiesDashboard: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="h1">ภาพรวมระบบสาธารณูปโภค</h1>
        <p className="text-muted">ระบบติดตามสถานะและการซ่อมบำรุงสาธารณูปโภคในโครงการ</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#DBEAFE', color: '#3B82F6' }}>
            <Droplets size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">สถานะสระว่ายน้ำ</p>
            <h3 className="stat-value" style={{ fontSize: '1.2rem', color: '#10B981' }}>ปกติ (เปิดให้บริการ)</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>
            <Camera size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">กล้องวงจรปิด (ออฟไลน์)</p>
            <h3 className="stat-value" style={{ color: '#EF4444' }}>2 จุด</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#FEF3C7', color: '#F59E0B' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">รายการแจ้งซ่อม</p>
            <h3 className="stat-value">5 รายการ</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">สถานะระบบโดยรวม</p>
            <h3 className="stat-value">98%</h3>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="h2" style={{ margin: 0 }}>อยู่ระหว่างการพัฒนา (Coming Soon)</h2>
        </div>
        <div className="card-body" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <WrenchIcon style={{ width: '80px', height: '80px', color: '#D1D5DB', marginBottom: '20px' }} />
          <h3 style={{ color: '#4B5563', fontSize: '1.5rem', marginBottom: '10px' }}>ระบบภาพรวมเชิงลึกกำลังถูกสร้างขึ้น</h3>
          <p style={{ color: '#9CA3AF', fontSize: '1.1rem' }}>
            หน้านี้จะแสดงกราฟสถานะระบบแบบ Real-time, ตารางสรุปการซ่อมบำรุง, และบันทึกการทำงานของอุปกรณ์ต่างๆ ในอนาคต
          </p>
        </div>
      </div>
    </div>
  );
};

// Simple inline WrenchIcon for the placeholder
const WrenchIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
  </svg>
);

export default UtilitiesDashboard;
