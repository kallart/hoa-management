import React from 'react';
import { useLocation } from 'react-router-dom';
import { Wrench } from 'lucide-react';

const DummyPage: React.FC = () => {
  const location = useLocation();
  
  // Map route path to page title for display
  const getPageTitle = () => {
    if (location.pathname.includes('/pool')) return 'ระบบสระว่ายน้ำ';
    if (location.pathname.includes('/cctv')) return 'ระบบกล้องวงจรปิด';
    if (location.pathname.includes('/maintenance')) return 'ระบบอื่นๆ 1';
    if (location.pathname.includes('/settings')) return 'ระบบอื่นๆ 2';
    return 'ระบบสาธารณูปโภค';
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 150px)' }}>
      <div style={{ backgroundColor: '#FEF3C7', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '30px' }}>
        <Wrench size={50} color="#D97706" />
      </div>
      <h1 className="h1" style={{ fontSize: '2.5rem', color: '#1F2937', marginBottom: '15px' }}>
        {getPageTitle()}
      </h1>
      <div style={{ backgroundColor: '#F3F4F6', padding: '10px 25px', borderRadius: '30px', border: '1px solid #E5E7EB', marginBottom: '20px' }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4B5563', letterSpacing: '2px' }}>COMING SOON</span>
      </div>
      <p style={{ color: '#6B7280', fontSize: '1.1rem', textAlign: 'center', maxWidth: '500px', lineHeight: '1.6' }}>
        ระบบนี้กำลังอยู่ระหว่างการพัฒนาและออกแบบ เพื่อให้คุณสามารถจัดการ {getPageTitle()} ได้อย่างมีประสิทธิภาพในอนาคตอันใกล้นี้
      </p>
    </div>
  );
};

export default DummyPage;
