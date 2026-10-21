const XLSX = require('xlsx');

const oldPmFile = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/personnes_morales_06_2023.xlsx';
const workbook = XLSX.readFile(oldPmFile);
const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
console.log('Old PM rows for 748681:', rows.filter(r => String(r.IDINTCLI || '').trim() === '748681'));
