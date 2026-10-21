const XLSX = require('xlsx');

function getVal(row, keys) {
    if (!Array.isArray(keys)) keys = [keys];
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null) {
            const val = String(row[key]).trim();
            if (val !== '') return val;
        }
        const lowerKey = key.toLowerCase();
        for (const [rKey, rVal] of Object.entries(row)) {
            if (rKey.toLowerCase().trim() === lowerKey) {
                const val = String(rVal).trim();
                if (val !== '') return val;
            }
        }
    }
    return '';
}

function normalizeRef(ref) {
    if (!ref) return '';
    return String(ref).trim();
}

function getRefVariants(ref, codAge) {
    const variants = new Set();
    const s = normalizeRef(ref);
    if (!s) return variants;
    
    variants.add(s);
    
    // Unpadded numeric
    const unp = s.replace(/^0+/, '');
    if (unp) variants.add(unp);
    
    // If numeric
    if (/^\d+$/.test(s)) {
        // pad6 e.g. "367268" or "022496"
        variants.add(s.padStart(6, '0'));
        // If s has length 13 (2 country + 5 agency + 6 loan)
        if (s.length === 13) {
            const loan6 = s.substring(7);
            variants.add(loan6);
            const loanUnp = loan6.replace(/^0+/, '');
            if (loanUnp) variants.add(loanUnp);
        }
    }
    
    // If prefix like CDT0000130700200
    const m = s.match(/^[A-Za-z]+0*(\d+)$/);
    if (m) {
        variants.add(m[1]);
        variants.add(m[1].replace(/^0+/, ''));
    }
    
    return variants;
}

// Let's test on source/input first 100 rows
const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';
const engWb = XLSX.readFile(`${inputDir}/engagements_06_2023_v2.xlsx`, { sheetRows: 500 });
const encWb = XLSX.readFile(`${inputDir}/encours_06_2023_v2.xlsx`, { sheetRows: 500 });

const engRows = XLSX.utils.sheet_to_json(engWb.Sheets[engWb.SheetNames[0]]);
const encRows = XLSX.utils.sheet_to_json(encWb.Sheets[encWb.SheetNames[0]]);

console.log(`Read ${engRows.length} engRows and ${encRows.length} encRows`);

// Build encours lookup index
const encoursIndex = new Map();
encRows.forEach((encRow, idx) => {
    const ref = getVal(encRow, ['REFCONTCMPT', 'REFCONTCMPT2', 'REFINT']);
    const variants = getRefVariants(ref);
    variants.forEach(v => {
        if (!encoursIndex.has(v)) encoursIndex.set(v, []);
        encoursIndex.get(v).push(encRow);
    });
});

let pairedCount = 0;
let selfEncoursCount = 0;
let noEncoursCount = 0;

engRows.forEach(engRow => {
    const ref = getVal(engRow, ['REFCONTCMPT', 'REFCONTCMPT2', 'REFINT']);
    const variants = getRefVariants(ref, engRow.CODAGE);
    
    let matchedEncRows = null;
    for (const v of variants) {
        if (encoursIndex.has(v)) {
            matchedEncRows = encoursIndex.get(v);
            break;
        }
    }
    
    if (matchedEncRows && matchedEncRows.length > 0) {
        pairedCount++;
    } else {
        // check if engRow has encours fields
        const hasEnc = getVal(engRow, ['DATPAI', 'MNTTOTUTIL', 'DATECH', 'MNTPAY']) !== '';
        if (hasEnc) {
            selfEncoursCount++;
        } else {
            noEncoursCount++;
        }
    }
});

console.log(`Engagements pairing results:`);
console.log(`- Paired with separate Encours file: ${pairedCount}`);
console.log(`- Used self-contained Encours columns: ${selfEncoursCount}`);
console.log(`- Engagements without Encours: ${noEncoursCount}`);
