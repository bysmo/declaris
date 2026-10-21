const XLSX = require('xlsx');
const filePath = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/personnes_morales_06_2023.xlsx';
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);
const row = rows.find(r => String(r.IDINTCLI).trim() === '748557');
console.log('Row for 748557:', row);
