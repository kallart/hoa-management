const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/Payments.tsx', 'utf8');
content = content.replace(/{status === '' \? 'ทั้งหมด' : status} \({count}\)/g, "{status === '' ? 'ทั้งหมด' : status}");
fs.writeFileSync('frontend/src/pages/Payments.tsx', content);
