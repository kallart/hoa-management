const fs = require('fs');
const content = fs.readFileSync('backend/src/server.ts', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes("app.get('/api/payments'"));
console.log(lines.slice(start, start + 30).join('\n'));
