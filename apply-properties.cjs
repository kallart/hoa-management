const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/Properties.tsx', 'utf8');

const oldInterface = `interface Property {
  id: string;
  houseNumber: string;
  plot?: string;
  landArea: number;
  ratePerYear: number;
  status: string;
  owner?: {
    name: string;
    phone: string;
  };
  invoices?: Array<{`;

const newInterface = `interface Property {
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
  invoices?: Array<{`;

content = content.replace(oldInterface, newInterface);

content = content.replace(`const [editForm, setEditForm] = useState({ ownerName: '', plot: '', landArea: '', parkingFee: '', arrears: '' });`, `const [editForm, setEditForm] = useState({ ownerName: '', plot: '', landArea: '', parkingFee: '', arrears: '', chargeInterest: true });`);

content = content.replace(`arrears: invoice ? invoice.arrears.toString() : '0'`, `arrears: invoice ? invoice.arrears.toString() : '0',
      chargeInterest: property.chargeInterest !== undefined ? property.chargeInterest : true`);

const oldCheckboxArea = `<div style={{ marginBottom: '25px', backgroundColor: '#F3F4F6', padding: '10px', borderRadius: '8px', border: '1px dashed #D1D5DB' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#4B5563' }}>ดอกเบี้ยคำนวณอัตโนมัติ (บาท)</label>`;

const newCheckboxArea = `<div style={{ marginBottom: '25px', backgroundColor: '#F3F4F6', padding: '10px', borderRadius: '8px', border: '1px dashed #D1D5DB' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <input 
                  type="checkbox" 
                  id="chargeInterestCheckbox"
                  checked={editForm.chargeInterest !== false}
                  onChange={(e) => setEditForm({...editForm, chargeInterest: e.target.checked})}
                  style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="chargeInterestCheckbox" style={{ fontWeight: 'bold', color: '#4B5563', cursor: 'pointer' }}>
                  คิดดอกเบี้ยล่าช้า
                </label>
              </div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#4B5563' }}>ดอกเบี้ยคำนวณอัตโนมัติ (บาท)</label>`;

content = content.replace(oldCheckboxArea, newCheckboxArea);

fs.writeFileSync('frontend/src/pages/Properties.tsx', content);
