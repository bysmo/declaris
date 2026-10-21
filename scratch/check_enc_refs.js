const XLSX = require('xlsx');
const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

const encWb = XLSX.readFile(`${inputDir}/encours_06_2023_v2.xlsx`, { sheetRows: 50 });
const encRows = XLSX.utils.sheet_to_json(encWb.Sheets[encWb.SheetNames[0]]);

console.log('First 20 encours rows refs:');
encRows.slice(0, 20).forEach((r, i) => console.log(i, r.REFCONTCMPT, r.MNTTOTUTIL));
