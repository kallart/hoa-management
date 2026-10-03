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
import DummyPage from './pages/utilities/DummyPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>กำลังตรวจสอบสิทธิ์...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
          
          {/* Common Fee System */}
          <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="properties" element={<Properties />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="payments" element={<Payments />} />
            <Route path="receipts" element={<Receipts />} />
            <Route path="logs" element={<ActivityLogs />} />
          </Route>
          
          {/* Utilities System */}
          <Route path="/utilities" element={<PrivateRoute><UtilitiesLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="/utilities/dashboard" replace />} />
            <Route path="dashboard" element={<UtilitiesDashboard />} />
            <Route path="pool" element={<DummyPage />} />
            <Route path="cctv" element={<DummyPage />} />
            <Route path="maintenance" element={<DummyPage />} />
            <Route path="settings" element={<DummyPage />} />
          </Route>
          
          {/* Standalone print pages */}
          <Route path="/invoices/batch-print" element={<PrivateRoute><BatchPrintInvoices /></PrivateRoute>} />
          <Route path="/receipts/batch-print" element={<PrivateRoute><BatchPrintReceipts /></PrivateRoute>} />
          <Route path="/invoices/:id" element={<PrivateRoute><InvoiceDetail /></PrivateRoute>} />
          <Route path="/receipts/:id" element={<PrivateRoute><ReceiptDetail /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
