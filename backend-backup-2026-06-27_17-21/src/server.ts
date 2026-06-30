import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// Expose uploads directory statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Configure Multer for Slip Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // The frontend must send houseNumber before the file in the FormData
    const houseNumber = req.body.houseNumber || 'unknown';
    const dir = path.join(__dirname, '../uploads/slips', houseNumber);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `slip-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Routes will be added here
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HOA Management API is running' });
});

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

    const housesWithParking = new Set(invoices.filter(inv => inv.parkingFee > 0).map(inv => inv.propertyId)).size;

    const months = [
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

    let cumulativePaid = payments
      .filter(p => new Date(p.paymentDate) < months[0].start)
      .reduce((sum, p) => sum + p.amount, 0);

    const now = new Date();
    
    let maxIndexToShow = 0;
    for (let i = 0; i < months.length; i++) {
      if (now >= months[i].start) {
        maxIndexToShow = i;
      }
    }

    const monthlyData = months.map((m, index) => {
      // If this month is beyond the max index to show, don't plot the line
      if (index > maxIndexToShow) {
        return {
          name: m.name,
          paid: null,
          unpaid: null
        };
      }

      const paidInMonth = payments
        .filter(p => new Date(p.paymentDate) >= m.start && new Date(p.paymentDate) <= m.end)
        .reduce((sum, p) => sum + p.amount, 0);
      
      cumulativePaid += paidInMonth;
      
      const unpaidInMonth = invoices
        .filter(inv => {
          const d = new Date(inv.dueDate);
          return d >= m.start && d <= m.end && inv.status !== 'ออกใบเสร็จแล้ว' && inv.status !== 'ชำระเต็มจำนวน' && inv.status !== 'ชำระแล้ว';
        })
        .reduce((sum, inv) => sum + inv.amount, 0);

      return {
        name: m.name,
        paid: cumulativePaid,
        unpaid: unpaidInMonth
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

app.put('/api/properties/:id', async (req, res) => {
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
          update: {
            name: ownerName
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

app.put('/api/invoices/:id/status', async (req, res) => {
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

app.delete('/api/payments/:id', async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id }
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

app.post('/api/payments', upload.single('slip'), async (req, res) => {
  try {
    const { invoiceId, amount, paymentMethod, paymentDate, referenceNumber, notes } = req.body;
    const slipUrl = req.file ? `/uploads/slips/${req.body.houseNumber}/${req.file.filename}` : null;

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

    res.json(payment);
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

app.post('/api/payments/:id/verify', async (req, res) => {
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
    
    // It's a partial payment if it doesn't cover the full amount or if it's a subsequent payment
    const isPartial = newTotalPaid < payment.invoice.amount || verifiedCount > 0;

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
    const newInvoiceStatus = newTotalPaid >= payment.invoice.amount ? 'ชำระเต็มจำนวน' : 'ชำระบางส่วน';
    await prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: newInvoiceStatus }
    });

    res.json(updatedPayment);
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
