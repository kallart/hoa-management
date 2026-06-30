import * as xlsx from 'xlsx';

const filePath = "C:\\Users\\royal\\OneDrive\\Desktop\\CAM 2026\\CAM ROYAL RACHAWADEE 2026.xlsx";
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rows: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

for (let i = 4; i < rows.length; i++) {
  const row = rows[i];
  if (!row || !row[1]) continue;
  const hNo = String(row[1]).trim();
  const oName = String(row[3] || '').trim();
  if (hNo.includes('สโมสร') || oName.includes('สโมสร')) {
    console.log('Found clubhouse at row', i + 1, ':', hNo, '|', oName);
  }
}
