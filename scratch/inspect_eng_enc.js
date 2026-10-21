const XLSX = require('xlsx');
const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';
const engWb = XLSX.readFile(`${inputDir}/engagements_06_2023_v2.xlsx`, { sheetRows: 5 });
const encWb = XLSX.readFile(`${inputDir}/encours_06_2023_v2.xlsx`, { sheetRows: 5 });
console.log('ENG:', XLSX.utils.sheet_to_json(engWb.Sheets[engWb.SheetNames[0]])[0]);
console.log('ENC:', XLSX.utils.sheet_to_json(encWb.Sheets[encWb.SheetNames[0]])[0]);
