const XLSX = require('xlsx');

const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

const pmWorkbook = XLSX.readFile(`${inputDir}/personnes_morales_06_2023_v2.xlsx`);
const pmRows = XLSX.utils.sheet_to_json(pmWorkbook.Sheets[pmWorkbook.SheetNames[0]]);
console.log('PM rows for 100002:', pmRows.filter(r => String(r.IDINTCLI || '').trim() === '100002'));

const ppWorkbook = XLSX.readFile(`${inputDir}/personnes_physiques_06_2023_v2.xlsx`);
const ppRows = XLSX.utils.sheet_to_json(ppWorkbook.Sheets[ppWorkbook.SheetNames[0]]);
console.log('PP rows for 210806:', ppRows.filter(r => String(r.IDINTCLI || '').trim() === '210806'));
