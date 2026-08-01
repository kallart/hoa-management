const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/Properties.tsx', 'utf8');

const backupInterface = `import { generateBackupExcel } from '../utils/backupUtils';

interface Property {
  id: string;
  houseNumber: string;
  plot?: string;
  landArea: number;
  ratePerYear: number;
  chargeInterest?: boolean;
  status: string;
  owner?: {
    name: string;
    phone: string;
  };`;

content = content.replace(/import \{ useAuth \} from '\.\.\/contexts\/AuthContext';\n  invoices\?: Array<\{/, `import { useAuth } from '../contexts/AuthContext';\n${backupInterface}\n  invoices?: Array<{`);

fs.writeFileSync('frontend/src/pages/Properties.tsx', content);
