const XLSX = require('xlsx');
const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

const engWb = XLSX.readFile(`${inputDir}/engagements_06_2023_v2.xlsx`);
const engRows = XLSX.utils.sheet_to_json(engWb.Sheets[engWb.SheetNames[0]]);
const row = engRows.find(r => r.REFCONTCMPT === '0100013367268');
console.log('Eng row for 0100013367268:', row);

const encWb = XLSX.readFile(`${inputDir}/encours_06_2023_v2.xlsx`);
const encRows = XLSX.utils.sheet_to_json(encWb.Sheets[encWb.SheetNames[0]]);
const encRow = encRows.find(r => r.REFCONTCMPT === '367268');
console.log('Enc row for 367268:', encRow);
