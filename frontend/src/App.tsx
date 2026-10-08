import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import BatchPrintInvoices from './pages/BatchPrintInvoices';
import BatchPrintReceipts from './pages/BatchPrintReceipts';
import Payments from './pages/Payments';
import ReceiptDetail from './pages/ReceiptDetail';
import Receipts from './pages/Receipts';
import ActivityLogs from './pages/ActivityLogs';
import Login from './pages/Login';
import Home from './pages/Home';
import UtilitiesLayout from './layouts/UtilitiesLayout';
import UtilitiesDashboard from './pages/utilities/UtilitiesDashboard';
import PoolSystem from './pages/utilities/PoolSystem';
import CctvSystem from './pages/utilities/CctvSystem';
import DummyPage from './pages/utilities/DummyPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>กำลังตรวจสอบสิทธิ์...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>กำลังตรวจสอบสิทธิ์...</div>;
  }
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/utilities/pool" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<AdminRoute><Home /></AdminRoute>} />
          
          {/* Common Fee System */}
          <Route path="/" element={<AdminRoute><MainLayout /></AdminRoute>}>
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="properties" element={<Properties />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="payments" element={<Payments />} />
            <Route path="receipts" element={<Receipts />} />
            <Route path="logs" element={<ActivityLogs />} />
          </Route>
          
          {/* Utilities System */}
          <Route path="/utilities" element={<UtilitiesLayout />}>
            <Route index element={<Navigate to="/utilities/dashboard" replace />} />
            <Route path="dashboard" element={<AdminRoute><UtilitiesDashboard /></AdminRoute>} />
            <Route path="pool" element={<PoolSystem />} />
            <Route path="cctv" element={<AdminRoute><CctvSystem /></AdminRoute>} />
            <Route path="maintenance" element={<AdminRoute><DummyPage /></AdminRoute>} />
            <Route path="settings" element={<AdminRoute><DummyPage /></AdminRoute>} />
          </Route>
          
          {/* Standalone print pages */}
          <Route path="/invoices/batch-print" element={<AdminRoute><BatchPrintInvoices /></AdminRoute>} />
          <Route path="/receipts/batch-print" element={<AdminRoute><BatchPrintReceipts /></AdminRoute>} />
          <Route path="/invoices/:id" element={<AdminRoute><InvoiceDetail /></AdminRoute>} />
          <Route path="/receipts/:id" element={<AdminRoute><ReceiptDetail /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
