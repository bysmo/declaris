const XLSX = require('xlsx');

const sourceDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source';

const oldPrets = XLSX.readFile(`${sourceDir}/prets.xlsx`, { sheetRows: 50 });
const oldPretsRows = XLSX.utils.sheet_to_json(oldPrets.Sheets[oldPrets.SheetNames[0]]);

const oldEncours = XLSX.readFile(`${sourceDir}/encours.xlsx`, { sheetRows: 50 });
const oldEncoursRows = XLSX.utils.sheet_to_json(oldEncours.Sheets[oldEncours.SheetNames[0]]);

console.log('Old prets references:', oldPretsRows.slice(0, 10).map(r => r.REFCONTCMPT));
console.log('Old encours references:', oldEncoursRows.slice(0, 10).map(r => r.REFCONTCMPT || r.REFCONTCMPT2));
