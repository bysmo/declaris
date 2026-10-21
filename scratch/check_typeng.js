const XLSX = require('xlsx');
const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

const engWb = XLSX.readFile(`${inputDir}/engagements_06_2023_v2.xlsx`, { sheetRows: 5000 });
const engRows = XLSX.utils.sheet_to_json(engWb.Sheets[engWb.SheetNames[0]]);

const typEngCounts = {};
engRows.forEach(r => {
    typEngCounts[r.TYPENG] = (typEngCounts[r.TYPENG] || 0) + 1;
});
console.log('TypEng counts (first 5000):', typEngCounts);

const typEng1 = engRows.filter(r => String(r.TYPENG).trim() === '01');
console.log('Sample TYPENG 01:', typEng1.slice(0, 5).map(r => ({ REFCONTCMPT: r.REFCONTCMPT, IDINT: r.IDINT, MNTENG: r.MNTENG })));
