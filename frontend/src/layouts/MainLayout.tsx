import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, FileText, Receipt, Printer, Settings, LogOut, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MainLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header" style={{ fontSize: '1rem', padding: '15px' }}>
          <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--color-secondary)', borderRadius: '6px' }}></div>
          <span>ระบบเก็บค่าส่วนกลาง</span>
        </div>
        
        <ul className="nav-links">
          <li>
            <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Home size={20} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/properties" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Users size={20} />
              <span>บ้านและสมาชิก</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/invoices" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <FileText size={20} />
              <span>ใบแจ้งค่าส่วนกลาง</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/payments" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Receipt size={20} />
              <span>รับชำระเงิน</span>
            </NavLink>
            <NavLink to="/receipts" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Printer size={20} />
              <span>พิมพ์ใบเสร็จ</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/logs" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <History size={20} />
              <span>ประวัติการทำงาน</span>
            </NavLink>
          </li>
        </ul>

        <div className="nav-links" style={{ paddingBottom: '20px', flex: 'none' }}>
          {isAdmin && (
            <div className="nav-item" style={{ marginTop: '20px' }}>
              <Settings size={20} />
              <span>ตั้งค่าระบบ</span>
            </div>
          )}
          <div className="nav-item" style={{ color: 'var(--color-danger)', cursor: 'pointer' }} onClick={handleLogout}>
            <LogOut size={20} />
            <span>ออกจากระบบ</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div className="h2" style={{ marginBottom: 0 }}>นิติบุคคลหมู่บ้านจัดสรร รอยัล ราชาวดี</div>
          <div className="flex-center" style={{ gap: '15px' }}>
            <span className="text-muted">เข้าสู่ระบบโดย: {user?.username} ({user?.role})</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user?.role === 'ADMIN' ? 'AD' : 'VW'}
            </div>
            <button 
              onClick={handleLogout} 
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: '6px', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <LogOut size={16} /> ออกจากระบบ
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
