const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src/pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let modified = false;

  // Add import api from '../utils/api' if not present and axios is present
  if (content.includes('axios') && !content.includes('../utils/api')) {
    content = content.replace(/import axios from 'axios';/g, "import api from '../utils/api';");
    modified = true;
  }

  // Replace axios.method('http://localhost:3001/api/...') with api.method('/api/...')
  // or axios.method(`http://localhost:3001/api/...`)
  if (content.includes('http://localhost:3001')) {
    content = content.replace(/axios\.(get|post|put|delete)\(['`"]http:\/\/localhost:3001(\/api\/[^'`"]+)['`"]/g, "api.$1('$2'");
    content = content.replace(/axios\.(get|post|put|delete)\(`http:\/\/localhost:3001(\/api\/[^`]+)`/g, "api.$1(`$2`");
    
    // For slip URL fixes: src={`http://localhost:3001${payment.slipUrl}`}
    // We should make a helper or just check if slipUrl starts with http
    content = content.replace(/http:\/\/localhost:3001\$\{([^}]+)\}/g, "${$1.startsWith('http') ? $1 : 'http://localhost:3001' + $1}");
    
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
