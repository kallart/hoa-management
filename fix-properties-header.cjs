const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/Properties.tsx', 'utf8').split('\n');

const newHeader = `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Search, Download, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { generateBackupExcel } from '../utils/backupUtils';

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
  };
  invoices?: Array<{
    amount: number;
    arrears: number;
    interest: number;
    commonFee: number;
    parkingFee: number;
    status: string;
  }>;
}

const Properties = () => {`;

const oldStart = content.findIndex(l => l.includes('const Properties = () => {'));
content = content.slice(oldStart + 1);

fs.writeFileSync('frontend/src/pages/Properties.tsx', newHeader + '\n' + content.join('\n'));
