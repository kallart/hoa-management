import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import BatchPrintInvoices from './pages/BatchPrintInvoices';
import Payments from './pages/Payments';
import ReceiptDetail from './pages/ReceiptDetail';
import Receipts from './pages/Receipts';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="properties" element={<Properties />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="payments" element={<Payments />} />
          <Route path="receipts" element={<Receipts />} />
        </Route>
        {/* Standalone print pages */}
        <Route path="/invoices/batch-print" element={<BatchPrintInvoices />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/receipts/:id" element={<ReceiptDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
