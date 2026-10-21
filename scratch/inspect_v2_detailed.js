const XLSX = require('xlsx');
const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

const engWb = XLSX.readFile(`${inputDir}/engagements_06_2023_v2.xlsx`, { sheetRows: 20 });
const encWb = XLSX.readFile(`${inputDir}/encours_06_2023_v2.xlsx`, { sheetRows: 20 });

const engRows = XLSX.utils.sheet_to_json(engWb.Sheets[engWb.SheetNames[0]]);
const encRows = XLSX.utils.sheet_to_json(encWb.Sheets[encWb.SheetNames[0]]);

console.log('--- ENGAGEMENTS HEADERS ---');
console.log(Object.keys(engRows[0]));
console.log('--- ENCOURS HEADERS ---');
console.log(Object.keys(encRows[0]));

console.log('\n--- ENGAGEMENTS SAMPLES (REFCONTCMPT, REFINT, IDINT, MNTENG) ---');
engRows.slice(0, 10).forEach(r => {
    console.log({ REFCONTCMPT: r.REFCONTCMPT, REFINT: r.REFINT, IDINT: r.IDINT, MNTENG: r.MNTENG, TYPENG: r.TYPENG });
});

console.log('\n--- ENCOURS SAMPLES (REFCONTCMPT, MNTPAY, MNTCRD, MNTTOTUTIL) ---');
encRows.slice(0, 10).forEach(r => {
    console.log({ REFCONTCMPT: r.REFCONTCMPT, MNTPAY: r.MNTPAY, MNTCRD: r.MNTCRD, MNTTOTUTIL: r.MNTTOTUTIL });
});
