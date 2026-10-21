const XLSX = require('xlsx');
const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

const engWb = XLSX.readFile(`${inputDir}/engagements_06_2023_v2.xlsx`);
const engRows = XLSX.utils.sheet_to_json(engWb.Sheets[engWb.SheetNames[0]]);

const encWb = XLSX.readFile(`${inputDir}/encours_06_2023_v2.xlsx`);
const encRows = XLSX.utils.sheet_to_json(encWb.Sheets[encWb.SheetNames[0]]);

console.log('Total Engagements rows:', engRows.length);
console.log('Total Encours rows:', encRows.length);

const engRefMap = new Map();
engRows.forEach((r, idx) => {
    const ref = String(r.REFCONTCMPT || '').trim();
    if (ref) engRefMap.set(ref, idx);
});

let directMatches = 0;
let suffixMatches = 0;
encRows.forEach(r => {
    const ref = String(r.REFCONTCMPT || '').trim();
    if (engRefMap.has(ref)) {
        directMatches++;
    } else {
        // check if any engRef ends with ref or contains ref
        // e.g. ref padded or substring
    }
});

console.log('Direct matches (REFCONTCMPT === REFCONTCMPT):', directMatches);

// Let's see some samples of encRefs and find if they exist in engRows
const sampleEncRefs = encRows.slice(0, 10).map(r => String(r.REFCONTCMPT).trim());
console.log('Sample Enc refs:', sampleEncRefs);

sampleEncRefs.forEach(encRef => {
    const found = engRows.find(r => {
        return Object.values(r).some(v => String(v).trim() === encRef || String(v).includes(encRef));
    });
    if (found) {
        console.log(`Found encRef ${encRef} in eng row:`, {
            REFCONTCMPT: found.REFCONTCMPT,
            REFINT: found.REFINT,
            IDINT: found.IDINT
        });
    } else {
        console.log(`encRef ${encRef} NOT found in any field of engagements`);
    }
});
