const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/Properties.tsx', 'utf8');

content = content.replace(/arrears: invoice \? invoice\.arrears\.toString\(\) : '0'/g, "arrears: invoice ? invoice.arrears.toString() : '0',\n      chargeInterest: property.chargeInterest !== undefined ? property.chargeInterest : true");

content = content.replace(/<div style=\{\{ marginBottom: '25px', backgroundColor: '#F3F4F6', padding: '10px', borderRadius: '8px', border: '1px dashed #D1D5DB' \}\}>/, `<div style={{ marginBottom: '25px', backgroundColor: '#F3F4F6', padding: '10px', borderRadius: '8px', border: '1px dashed #D1D5DB' }}>
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
              </div>`);

fs.writeFileSync('frontend/src/pages/Properties.tsx', content);
