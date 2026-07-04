import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

async function addLog(action: string, description: string, houseNumber?: string) {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        description,
        houseNumber
      }
    });
  } catch (error) {
    console.error('Failed to save log:', error);
  }
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);
const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'hoa_super_secret_key_2026';

async function initializeUsers() {
  const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!adminExists) {
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({ data: { username: 'admin', password: hashedAdminPassword, role: 'ADMIN' } });
  }

  const viewerExists = await prisma.user.findUnique({ where: { username: 'viewer' } });
  if (!viewerExists) {
    const hashedViewerPassword = await bcrypt.hash('viewer123', 10);
    await prisma.user.create({ data: { username: 'viewer', password: hashedViewerPassword, role: 'VIEWER' } });
  }
}
initializeUsers();

app.use(cors());
app.use(express.json());

// Expose uploads directory statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Configure Multer for Slip Uploads (Memory Storage for Supabase)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes will be added here
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HOA Management API is running' });
});

// Authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    
    if (!user) {
      return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

app.use('/api', authenticateToken);

// Settings
app.get('/api/settings', async (req, res) => {
  try {
    const setting = await prisma.setting.findFirst();
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Dashboard Stats
app.get('/api/dashboard', async (req, res) => {
  try {
    const totalHouses = await prisma.property.count();
    
    const invoices = await prisma.invoice.findMany();
    const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    
    const payments = await prisma.payment.findMany();
    const totalCollected = payments.reduce((sum, pay) => sum + pay.amount, 0);
    
    const totalOutstanding = totalBilled - totalCollected;
    const collectionRate = totalBilled === 0 ? 0 : Math.round((totalCollected / totalBilled) * 100);

    const housesWithParking = new Set(invoices.filter(inv => inv.parkingFee > 0).map(inv => inv.propertyId)).size + 2;

    const timeframe = (req.query.timeframe as string) || 'monthly';
      const now = new Date();
      let intervals: { name: string; start: Date; end: Date }[] = [];

      if (timeframe === 'daily') {
        const startDate = new Date('2026-06-30T00:00:00Z');
        for (let i = 0; i < 14; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
          const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
          intervals.push({ name: `${d.getDate()}/${d.getMonth() + 1}`, start, end });
        }
      } else if (timeframe === 'weekly') {
          const startDate = new Date('2026-06-29T00:00:00Z'); // Monday 29 June
          for (let i = 0; i < 8; i++) {
            const start = new Date(startDate);
            start.setDate(start.getDate() + (i * 7));
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            
            intervals.push({ name: `${start.getDate()}/${start.getMonth() + 1}-${end.getDate()}/${end.getMonth() + 1}`, start, end });
          }
        } else {
          intervals = [
            { name: '06/2026', start: new Date('2026-06-01T00:00:00Z'), end: new Date('2026-06-30T23:59:59Z') },
            { name: '07/2026', start: new Date('2026-07-01T00:00:00Z'), end: new Date('2026-07-31T23:59:59Z') },
            { name: '08/2026', start: new Date('2026-08-01T00:00:00Z'), end: new Date('2026-08-31T23:59:59Z') },
            { name: '09/2026', start: new Date('2026-09-01T00:00:00Z'), end: new Date('2026-09-30T23:59:59Z') },
            { name: '10/2026', start: new Date('2026-10-01T00:00:00Z'), end: new Date('2026-10-31T23:59:59Z') },
            { name: '11/2026', start: new Date('2026-11-01T00:00:00Z'), end: new Date('2026-11-30T23:59:59Z') },
            { name: '12/2026', start: new Date('2026-12-01T00:00:00Z'), end: new Date('2026-12-31T23:59:59Z') },
            { name: '01/2027', start: new Date('2027-01-01T00:00:00Z'), end: new Date('2027-01-31T23:59:59Z') },
            { name: '02/2027', start: new Date('2027-02-01T00:00:00Z'), end: new Date('2027-02-28T23:59:59Z') },
            { name: '03/2027', start: new Date('2027-03-01T00:00:00Z'), end: new Date('2027-03-31T23:59:59Z') },
            { name: '04/2027', start: new Date('2027-04-01T00:00:00Z'), end: new Date('2027-04-30T23:59:59Z') },
            { name: '05/2027', start: new Date('2027-05-01T00:00:00Z'), end: new Date('2027-05-31T23:59:59Z') },
            { name: '06/2027', start: new Date('2027-06-01T00:00:00Z'), end: new Date('2027-06-30T23:59:59Z') }
          ];
        }
  
      let maxIndexToShow = intervals.length - 1;
      if (timeframe === 'monthly') {
        maxIndexToShow = 0;
        for (let i = 0; i < intervals.length; i++) {
          if (now >= intervals[i].start) {
            maxIndexToShow = i;
          }
        }
      }
  
      const monthlyData = intervals.map((m, index) => {
        if (timeframe === 'monthly' && index > maxIndexToShow) {
          return { name: m.name, paid: null, unpaid: null };
        }
  
        const paidInPeriod = payments
          .filter(p => new Date(p.paymentDate) <= m.end)
          .reduce((sum, p) => sum + p.amount, 0);
        
        const unpaidInPeriod = invoices
          .filter(inv => {
            const d = new Date(inv.dueDate);
            return d >= m.start && d <= m.end && inv.status !== 'ออกใบเสร็จแล้ว' && inv.status !== 'ชำระเต็มจำนวน' && inv.status !== 'ชำระแล้ว';
          })
          .reduce((sum, inv) => sum + inv.amount, 0);
  
        return {
          name: m.name,
          paid: paidInPeriod,
          unpaid: unpaidInPeriod
        };
      });

    const calcStatus = (statuses: string[]) => {
      const filtered = invoices.filter(i => statuses.includes(i.status));
      return {
        count: filtered.length,
        amount: filtered.reduce((sum, i) => sum + i.amount, 0)
      };
    };

    const statusCounts = {
      'รอแจ้งค่าส่วนกลาง': calcStatus(['รอแจ้งค่าส่วนกลาง', 'unpaid']),
      'รอการชำระ': calcStatus(['รอการชำระ', 'overdue']),
      'ชำระบางส่วน': calcStatus(['ชำระบางส่วน']),
      'รอตรวจสอบยอดเงิน': calcStatus(['รอตรวจสอบยอดเงิน', 'partial']),
      'ชำระเต็มจำนวน': calcStatus(['ชำระเต็มจำนวน', 'ออกใบเสร็จแล้ว', 'paid', 'ชำระแล้ว']),
    };

    res.json({
      totalHouses,
      collectionRate,
      housesWithParking,
      totalCollected,
      totalOutstanding,
      monthlyData,
      statusCounts
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Properties
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      include: { 
        owner: true,
        invoices: true 
      }
    });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

app.put('/api/properties/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { plot, ownerName, landArea, parkingFee, arrears } = req.body;
  try {
    const updatedLandArea = Number(landArea);
    const updatedParkingFee = Number(parkingFee) || 0;
    const updatedArrears = Number(arrears) || 0;
    const calculatedInterest = updatedArrears * 0.02 * 12;

    const property = await prisma.property.update({
      where: { id },
      data: {
        plot,
        landArea: updatedLandArea,
        ratePerYear: updatedLandArea * 42 * 12,
        owner: {
          upsert: {
            create: { name: ownerName },
            update: { name: ownerName }
          }
        }
      },
      include: { invoices: true, owner: true }
    });

    if (property.invoices && property.invoices.length > 0) {
      const invoice = property.invoices[0];
      const newCommonFee = updatedLandArea * 42 * 12;
      const newAmount = updatedArrears + calculatedInterest + newCommonFee + updatedParkingFee;
      
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          commonFee: newCommonFee,
          parkingFee: updatedParkingFee,
          arrears: updatedArrears,
          interest: calculatedInterest,
          amount: newAmount
        }
      });
    }

    await addLog('แก้ไขข้อมูลบ้าน', `อัปเดตข้อมูลและลดยอด/เพิ่มยอดสำหรับบ้านเลขที่ ${property.houseNumber}`, property.houseNumber);

    res.json(property);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// Invoices
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { 
        property: { include: { owner: true } },
        payments: true
      },
      orderBy: { invoiceNumber: 'asc' }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

app.get('/api/invoices/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { property: { include: { owner: true } } }
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

app.put('/api/invoices/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(invoice);
  } catch (error) {
    console.error('Failed to update invoice status:', error);
    res.status(500).json({ error: 'Failed to update invoice status' });
  }
});

// Payments
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: { invoice: { include: { property: { include: { owner: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

app.get('/api/payments/:id', async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { invoice: { include: { property: { include: { owner: true } } } } }
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

app.delete('/api/payments/:id', requireAdmin, async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { invoice: { include: { property: true } } }
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    // Delete slip file if exists
    if (payment.slipUrl) {
      const filePath = path.join(__dirname, '..', payment.slipUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete payment record
    await prisma.payment.delete({
      where: { id: req.params.id }
    });

    await addLog('ยกเลิกรายการ', `ยกเลิกรายการชำระเงินยอด ${Number(payment.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท`, payment.invoice?.property?.houseNumber);

    // Check remaining payments and update status
    const remainingPayments = await prisma.payment.findMany({
      where: { invoiceId: payment.invoiceId, receiptNumber: { not: null } }
    });

    if (remainingPayments.length > 0) {
      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: 'ชำระบางส่วน' }
      });
    } else {
      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: 'รอการชำระ' }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to cancel payment:', error);
    res.status(500).json({ error: 'Failed to cancel payment' });
  }
});

app.post('/api/payments', upload.single('slip'), requireAdmin, async (req, res) => {
  try {
    const { invoiceId, amount, paymentMethod, paymentDate, referenceNumber, notes, houseNumber } = req.body;
    let slipUrl = null;
    
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const hNum = houseNumber || 'unknown';
      const filename = `${hNum}/slip-${Date.now()}${ext}`;
      
      const { data, error } = await supabase.storage
        .from('slips')
        .upload(filename, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });
        
      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(500).json({ error: 'Failed to upload slip' });
      }
      
      const { data: publicUrlData } = supabase.storage.from('slips').getPublicUrl(filename);
      slipUrl = publicUrlData.publicUrl;
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount: Number(amount),
        paymentMethod,
        paymentDate: new Date(paymentDate),
        referenceNumber,
        notes,
        slipUrl
      }
    });

    // Update invoice status
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'รอตรวจสอบยอดเงิน' }
    });

    await addLog('แจ้งชำระเงิน', `แนบสลิปยอด ${Number(amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท`, houseNumber);

    res.json(payment);
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

app.post('/api/payments/:id/verify', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find payment with related invoice and property
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { invoice: { include: { property: true } } }
    });

    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.receiptNumber) return res.status(400).json({ error: 'Receipt already issued' });

    // Find previous verified payments to determine partial payment status
    const previousVerifiedPayments = await prisma.payment.findMany({
      where: { invoiceId: payment.invoiceId, receiptNumber: { not: null } },
      orderBy: { paymentDate: 'asc' }
    });

    const verifiedCount = previousVerifiedPayments.length;
    const totalPreviouslyPaid = previousVerifiedPayments.reduce((sum, p) => sum + p.amount, 0);
    const newTotalPaid = totalPreviouslyPaid + payment.amount;
    
    const roundedTotalPaid = Math.round(newTotalPaid * 100);
    const roundedInvoiceAmount = Math.round(payment.invoice.amount * 100);

    // It's a partial payment if it doesn't cover the full amount or if it's a subsequent payment
    const isPartial = roundedTotalPaid < roundedInvoiceAmount || verifiedCount > 0;

    // Generate Receipt Number: REC_YYYY_XXXX_(houseNumber)[-PMx]
    const year = new Date().getFullYear();
    const lastPayment = await prisma.payment.findFirst({
      where: { receiptNumber: { startsWith: `REC_${year}_` } },
      orderBy: { receiptNumber: 'desc' }
    });
    
    let nextNumInt = 1;
    if (lastPayment && lastPayment.receiptNumber) {
      const parts = lastPayment.receiptNumber.split('_');
      if (parts.length >= 3) {
        nextNumInt = parseInt(parts[2], 10) + 1;
      }
    }
    const nextNum = String(nextNumInt).padStart(4, '0');
    const houseNumberStr = payment.invoice.property.houseNumber.replace(/\//g, '-');
    
    let receiptNumber = `REC_${year}_${nextNum}_(${houseNumberStr})`;
    if (isPartial) {
      receiptNumber += `-PM${verifiedCount + 1}`;
    }

    // Update Payment
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: { receiptNumber }
    });

    // Update Invoice Status based on total paid amount
    const newInvoiceStatus = roundedTotalPaid >= roundedInvoiceAmount ? 'ชำระเต็มจำนวน' : 'ชำระบางส่วน';
    await prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: newInvoiceStatus }
    });

    await addLog('ออกใบเสร็จ', `ตรวจสอบยอดและออกใบเสร็จ ${receiptNumber} ยอด ${Number(payment.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} บาท`, payment.invoice?.property?.houseNumber);

    res.json(updatedPayment);
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100 // limit to last 100 logs
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
