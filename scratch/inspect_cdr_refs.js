const XLSX = require('xlsx');

const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

const engWb = XLSX.readFile(`${inputDir}/engagements_06_2023_v2.xlsx`, { sheetRows: 50 });
const engRows = XLSX.utils.sheet_to_json(engWb.Sheets[engWb.SheetNames[0]]);

const encWb = XLSX.readFile(`${inputDir}/encours_06_2023_v2.xlsx`, { sheetRows: 50 });
const encRows = XLSX.utils.sheet_to_json(encWb.Sheets[encWb.SheetNames[0]]);

console.log('Engagements references (first 10):', engRows.slice(0, 10).map(r => r.REFCONTCMPT));
console.log('Encours references (first 10):', encRows.slice(0, 10).map(r => r.REFCONTCMPT));
