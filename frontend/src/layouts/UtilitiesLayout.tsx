import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Droplets, Camera, Settings, LogOut, Menu, ArrowLeft, LayoutDashboard, Wrench } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UtilitiesLayout = () => {
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
          <div style={{ width: '24px', height: '24px', backgroundColor: '#F59E0B', borderRadius: '6px' }}></div>
          <span>ระบบสาธารณูปโภค</span>
        </div>
        
        <ul className="nav-links">
          <li style={{ marginBottom: '15px' }}>
            <NavLink to="/home" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"} style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>
              <ArrowLeft size={20} />
              <span>กลับหน้าหลัก (Home)</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/utilities/dashboard" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <LayoutDashboard size={20} />
              <span>ภาพรวมสาธารณูปโภค</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/utilities/pool" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Droplets size={20} />
              <span>ระบบสระว่ายน้ำ</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/utilities/cctv" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Camera size={20} />
              <span>ระบบกล้องวงจรปิด</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/utilities/maintenance" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Wrench size={20} />
              <span>ระบบอื่นๆ 1</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/utilities/settings" onClick={closeMenu} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Settings size={20} />
              <span>ระบบอื่นๆ 2</span>
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
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#F59E0B', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
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

export default UtilitiesLayout;
