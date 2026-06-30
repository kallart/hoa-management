import * as xlsx from 'xlsx';

const filePath = "C:\\Users\\royal\\OneDrive\\Desktop\\CAM 2026\\CAM ROYAL RACHAWADEE 2026.xlsx";
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
console.log("Sheet Name:", sheetName);
console.log("Headers (Row 1):", data[0]);
console.log("Row 2:", data[1]);
console.log("Row 3:", data[2]);
console.log("Row 4:", data[3]);
console.log("Row 5:", data[4]);
