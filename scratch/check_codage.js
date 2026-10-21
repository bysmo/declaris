const XLSX = require('xlsx');
const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

const engWb = XLSX.readFile(`${inputDir}/engagements_06_2023_v2.xlsx`, { sheetRows: 50000 });
const engRows = XLSX.utils.sheet_to_json(engWb.Sheets[engWb.SheetNames[0]]);
const row = engRows.find(r => String(r.REFCONTCMPT).includes('450864'));
console.log('Row with 450864:', row ? { REFCONTCMPT: row.REFCONTCMPT, CODAGE: row.CODAGE, typeofCodage: typeof row.CODAGE } : 'NOT FOUND in first 50000');
