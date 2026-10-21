const XLSX = require('xlsx');
const sourceDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source';
const prets = XLSX.readFile(`${sourceDir}/prets.xlsx`, { sheetRows: 5 });
const encours = XLSX.readFile(`${sourceDir}/encours.xlsx`, { sheetRows: 5 });
console.log('Prets Headers:', XLSX.utils.sheet_to_json(prets.Sheets[prets.SheetNames[0]], { header: 1 })[0]);
console.log('Prets Row 1:', XLSX.utils.sheet_to_json(prets.Sheets[prets.SheetNames[0]])[0]);
console.log('Encours Headers:', XLSX.utils.sheet_to_json(encours.Sheets[encours.SheetNames[0]], { header: 1 })[0]);
console.log('Encours Row 1:', XLSX.utils.sheet_to_json(encours.Sheets[encours.SheetNames[0]])[0]);
