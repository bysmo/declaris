const XLSX = require('xlsx');

const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

const engWb = XLSX.readFile(`${inputDir}/engagements_06_2023_v2.xlsx`);
const engRows = XLSX.utils.sheet_to_json(engWb.Sheets[engWb.SheetNames[0]]);

const encWb = XLSX.readFile(`${inputDir}/encours_06_2023_v2.xlsx`);
const encRows = XLSX.utils.sheet_to_json(encWb.Sheets[encWb.SheetNames[0]]);

const engRefs = new Set(engRows.map(r => String(r.REFCONTCMPT || '').trim()));
const encRefs = new Set(encRows.map(r => String(r.REFCONTCMPT || '').trim()));

console.log(`Engagements unique references: ${engRefs.size}`);
console.log(`Encours unique references: ${encRefs.size}`);

let intersectionCount = 0;
for (const ref of engRefs) {
    if (encRefs.has(ref)) {
        intersectionCount++;
    }
}

console.log(`Intersection (matching references): ${intersectionCount}`);
if (intersectionCount === 0) {
    console.log('Sample Engagements references:', Array.from(engRefs).slice(0, 5));
    console.log('Sample Encours references:', Array.from(encRefs).slice(0, 5));
}
