const fs = require('fs');
const content = fs.readFileSync('backend/src/server.ts', 'utf8');
const lines = content.split('\n');
const startIndex = lines.findIndex(l => l.includes("app.post('/api/payments'"));
console.log(lines.slice(startIndex, startIndex + 50).join('\n'));
