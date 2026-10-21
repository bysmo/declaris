const XLSX = require('xlsx');

const newPmFile = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input/personnes_morales_06_2023_v2.xlsx';
const workbook = XLSX.readFile(newPmFile);
const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
console.log('New PM rows for 748681:', rows.filter(r => String(r.IDINTCLI || '').trim() === '748681'));
