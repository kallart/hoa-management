const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../src/server.ts');
let content = fs.readFileSync(serverPath, 'utf8');

const replacement = `      const timeframe = (req.query.timeframe as string) || 'monthly';
      const now = new Date();
      let intervals: { name: string; start: Date; end: Date }[] = [];

      if (timeframe === 'daily') {
        for (let i = 13; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
          const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
          intervals.push({ name: \`\${d.getDate()}/\${d.getMonth() + 1}\`, start, end });
        }
      } else if (timeframe === 'weekly') {
        for (let i = 7; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - (i * 7));
          const start = new Date(d);
          start.setDate(start.getDate() - start.getDay() + 1); // Monday
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setDate(end.getDate() + 6); // Sunday
          end.setHours(23, 59, 59, 999);
          intervals.push({ name: \`\${start.getDate()}/\${start.getMonth() + 1}-\${end.getDate()}/\${end.getMonth() + 1}\`, start, end });
        }
      } else {
        intervals = [
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
          .filter(p => new Date(p.paymentDate) >= m.start && new Date(p.paymentDate) <= m.end)
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
      });`;

const targetRegex = /const months = \[\s*\{[\s\S]*?const monthlyData = [\s\S]*?\}\);/;
if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement.trim());
  fs.writeFileSync(serverPath, content, 'utf8');
  console.log('Successfully updated server.ts');
} else {
  console.log('Regex did not match in server.ts');
}
