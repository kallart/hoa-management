import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Wrench, Users, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--color-primary)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>RH</span>
          </div>
          นิติบุคคลหมู่บ้านจัดสรร รอยัล ราชาวดี
        </h1>
        <button 
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <LogOut size={20} /> ออกจากระบบ
        </button>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}>
        <h2 style={{ fontSize: '2rem', color: '#1F2937', marginBottom: '10px' }}>ยินดีต้อนรับสู่ระบบจัดการ</h2>
        <p style={{ fontSize: '1.1rem', color: '#6B7280', marginBottom: '50px' }}>กรุณาเลือกระบบที่คุณต้องการใช้งาน</p>

        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1200px' }}>
          
          {/* Option 1: Common Fee System */}
          <div 
            onClick={() => navigate('/dashboard')}
            style={{ width: '320px', backgroundColor: 'white', padding: '40px 30px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.2s, boxShadow 0.2s', borderTop: '5px solid var(--color-primary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.05)'; }}
          >
            <div style={{ width: '80px', height: '80px', backgroundColor: '#ECFDF5', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '25px', color: 'var(--color-primary)' }}>
              <Calculator size={40} />
            </div>
            <h3 style={{ fontSize: '1.4rem', color: '#1F2937', margin: '0 0 15px 0', textAlign: 'center' }}>งานระบบจัดเก็บค่าส่วนกลาง</h3>
            <p style={{ color: '#6B7280', textAlign: 'center', margin: 0, lineHeight: '1.5' }}>จัดการค่าส่วนกลาง, พิมพ์ใบเสร็จ, รับชำระเงิน และตรวจสอบลูกหนี้</p>
          </div>

          {/* Option 2: Public Utilities System */}
          <div 
            onClick={() => alert('ระบบกำลังอยู่ระหว่างการพัฒนา (Coming Soon)')}
            style={{ width: '320px', backgroundColor: 'white', padding: '40px 30px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.2s, boxShadow 0.2s', borderTop: '5px solid #F59E0B' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.05)'; }}
          >
            <div style={{ width: '80px', height: '80px', backgroundColor: '#FEF3C7', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '25px', color: '#F59E0B' }}>
              <Wrench size={40} />
            </div>
            <h3 style={{ fontSize: '1.4rem', color: '#1F2937', margin: '0 0 15px 0', textAlign: 'center' }}>งานระบบสาธารณูปโภค</h3>
            <p style={{ color: '#6B7280', textAlign: 'center', margin: 0, lineHeight: '1.5' }}>จัดการแจ้งซ่อมบำรุง, ดูแลพื้นที่ส่วนกลาง และระบบสาธารณูปโภค</p>
            <span style={{ marginTop: '20px', padding: '5px 15px', backgroundColor: '#F3F4F6', color: '#4B5563', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>Coming Soon</span>
          </div>

          {/* Option 3: Committee Meeting System */}
          <div 
            onClick={() => alert('ระบบกำลังอยู่ระหว่างการพัฒนา (Coming Soon)')}
            style={{ width: '320px', backgroundColor: 'white', padding: '40px 30px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.2s, boxShadow 0.2s', borderTop: '5px solid #8B5CF6' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.05)'; }}
          >
            <div style={{ width: '80px', height: '80px', backgroundColor: '#EDE9FE', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '25px', color: '#8B5CF6' }}>
              <Users size={40} />
            </div>
            <h3 style={{ fontSize: '1.4rem', color: '#1F2937', margin: '0 0 15px 0', textAlign: 'center' }}>งานประชุมคณะกรรมการ</h3>
            <p style={{ color: '#6B7280', textAlign: 'center', margin: 0, lineHeight: '1.5' }}>ระบบวาระการประชุม, บันทึกการประชุม และลงมติคณะกรรมการ</p>
            <span style={{ marginTop: '20px', padding: '5px 15px', backgroundColor: '#F3F4F6', color: '#4B5563', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>Coming Soon</span>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Home;
