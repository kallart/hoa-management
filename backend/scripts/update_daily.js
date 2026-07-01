const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../src/server.ts');
let content = fs.readFileSync(serverPath, 'utf8');

const targetRegex = /if \(timeframe === 'daily'\) \{[\s\S]*?\} else if \(timeframe === 'weekly'\)/;
const replacement = `if (timeframe === 'daily') {
        const startDate = new Date('2026-06-30T00:00:00Z');
        for (let i = 0; i < 14; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
          const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
          intervals.push({ name: \`\${d.getDate()}/\${d.getMonth() + 1}\`, start, end });
        }
      } else if (timeframe === 'weekly')`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync(serverPath, content, 'utf8');
  console.log('Successfully updated daily timeframe in server.ts');
} else {
  console.log('Regex did not match in server.ts');
}
