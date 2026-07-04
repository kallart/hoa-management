import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, FileText, Receipt, Printer, Settings, LogOut, History, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MainLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="app-container">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={closeMenu}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header" style={{ fontSize: '1rem', padding: '15px' }}>
          <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--color-secondary)', borderRadius: '6px' }}></div>
          <span>ระบบเก็บค่าส่วนกลาง</span>
        </div>
        
        <ul className="nav-links">
          <li>
            <NavLink to="/dashboard" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Home size={20} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/properties" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Users size={20} />
              <span>บ้านและสมาชิก</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/invoices" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <FileText size={20} />
              <span>ใบแจ้งค่าส่วนกลาง</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/payments" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Receipt size={20} />
              <span>รับชำระเงิน</span>
            </NavLink>
            <NavLink to="/receipts" onClick={closeMenu} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Printer size={20} />
              <span>พิมพ์ใบเสร็จ</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/logs" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <History size={20} />
              <span>Activity Logs</span>
            </NavLink>
          </li>
        </ul>

        <div className="nav-links" style={{ paddingBottom: '20px', flex: 'none' }}>
          {isAdmin && (
            <div className="nav-item" style={{ marginTop: '20px' }} onClick={closeMenu}>
              <Settings size={20} />
              <span>ตั้งค่าระบบ</span>
            </div>
          )}
          <div className="nav-item" style={{ color: 'var(--color-danger)', cursor: 'pointer', justifyContent: 'center' }} onClick={handleLogout} title="ออกจากระบบ">
            <LogOut size={20} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="h2" style={{ marginBottom: 0 }}>นิติบุคคลหมู่บ้านจัดสรร รอยัล ราชาวดี</div>
          </div>
          <div className="flex-center topbar-right-content" style={{ gap: '15px' }}>
            <span className="text-muted">เข้าสู่ระบบโดย: {user?.username} ({user?.role})</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user?.role === 'ADMIN' ? 'AD' : 'VW'}
            </div>
            <button 
              onClick={handleLogout} 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: '6px', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}
              title="ออกจากระบบ"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
