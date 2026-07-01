const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../src/server.ts');
let content = fs.readFileSync(serverPath, 'utf8');

const targetRegex = /\} else if \(timeframe === 'weekly'\) \{[\s\S]*?\} else \{[\s\S]*?intervals = \[[\s\S]*?\];\s*\}/;
const replacement = `} else if (timeframe === 'weekly') {
          const startDate = new Date('2026-06-29T00:00:00Z'); // Monday 29 June
          for (let i = 0; i < 8; i++) {
            const start = new Date(startDate);
            start.setDate(start.getDate() + (i * 7));
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            
            intervals.push({ name: \`\${start.getDate()}/\${start.getMonth() + 1}-\${end.getDate()}/\${end.getMonth() + 1}\`, start, end });
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
        }`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync(serverPath, content, 'utf8');
  console.log('Successfully updated weekly and monthly timeframe in server.ts');
} else {
  console.log('Regex did not match in server.ts');
}
