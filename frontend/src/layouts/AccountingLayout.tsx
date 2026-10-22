import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, ArrowLeft, LayoutDashboard, ReceiptText, Wallet, ShieldAlert, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AccountingLayout = () => {
  const { user, logout } = useAuth();
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
          <div style={{ width: '24px', height: '24px', backgroundColor: '#8B5CF6', borderRadius: '6px' }}></div>
          <span>ระบบบัญชีและการเงิน</span>
        </div>
        
        <ul className="nav-links">
          <li style={{ marginBottom: '15px' }}>
            <NavLink to="/home" onClick={closeMenu} className="nav-item" style={{ backgroundColor: '#EDE9FE', color: '#6D28D9' }}>
              <ArrowLeft size={20} />
              <span>กลับหน้าหลัก (Home)</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/accounting" end onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <LayoutDashboard size={20} />
              <span>ภาพรวมการเงิน</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/accounting/transactions" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <ReceiptText size={20} />
              <span>บันทึกรายจ่าย & รายรับ</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/accounting/petty-cash" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Wallet size={20} />
              <span>วงเงินสดย่อย</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/accounting/deposits" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <ShieldAlert size={20} />
              <span>เงินมัดจำต่อเติมบ้าน</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/accounting/settings" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Settings size={20} />
              <span>ตั้งค่า & Google Drive</span>
            </NavLink>
          </li>
        </ul>
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
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#8B5CF6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
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

export default AccountingLayout;
