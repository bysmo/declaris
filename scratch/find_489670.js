const XLSX = require('xlsx');
const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

const engWb = XLSX.readFile(`${inputDir}/engagements_06_2023_v2.xlsx`);
const engRows = XLSX.utils.sheet_to_json(engWb.Sheets[engWb.SheetNames[0]]);

const val = '489670';
const matches = engRows.filter(r => Object.values(r).some(v => String(v).includes(val)));
console.log(`Found ${matches.length} matches for ${val}:`, matches);
