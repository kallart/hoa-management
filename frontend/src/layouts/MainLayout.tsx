import { Outlet, NavLink } from 'react-router-dom';
import { Home, Users, FileText, Receipt, Printer, Settings, LogOut, History } from 'lucide-react';

const MainLayout = () => {
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
          <div className="nav-item" style={{ marginTop: '20px' }}>
            <Settings size={20} />
            <span>ตั้งค่าระบบ</span>
          </div>
          <div className="nav-item" style={{ color: 'var(--color-danger)' }}>
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
            <span className="text-muted">ปีงบประมาณ: กรกฏาคม 2026 - มิถุนายน 2027</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>AD</div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
