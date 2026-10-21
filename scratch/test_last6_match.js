const XLSX = require('xlsx');
const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

const engWb = XLSX.readFile(`${inputDir}/engagements_06_2023_v2.xlsx`);
const engRows = XLSX.utils.sheet_to_json(engWb.Sheets[engWb.SheetNames[0]]);

const encWb = XLSX.readFile(`${inputDir}/encours_06_2023_v2.xlsx`);
const encRows = XLSX.utils.sheet_to_json(encWb.Sheets[encWb.SheetNames[0]]);

function getRefVariants(ref) {
    const variants = new Set();
    const s = String(ref || '').trim();
    if (!s) return variants;

    variants.add(s);

    const unp = s.replace(/^0+/, '');
    if (unp) variants.add(unp);

    if (/^\d+$/.test(s)) {
        variants.add(s.padStart(6, '0'));
        if (s.length >= 6) {
            const last6 = s.substring(s.length - 6);
            variants.add(last6);
            const last6Unp = last6.replace(/^0+/, '');
            if (last6Unp) variants.add(last6Unp);
        }
        if (s.length === 13) {
            const loan6 = s.substring(7);
            variants.add(loan6);
            const loanUnp = loan6.replace(/^0+/, '');
            if (loanUnp) variants.add(loanUnp);
        }
    }

    const m = s.match(/^[A-Za-z]+0*(\d+)$/);
    if (m) {
        variants.add(m[1]);
        const mUnp = m[1].replace(/^0+/, '');
        if (mUnp) variants.add(mUnp);
    }

    return variants;
}

const engLookup = new Map();
engRows.forEach((r, idx) => {
    const refKeys = [r.REFCONTCMPT, r.REFCONTCMPT2, r.REFINT].filter(Boolean);
    refKeys.forEach(k => {
        getRefVariants(k).forEach(v => {
            if (!engLookup.has(v)) engLookup.set(v, idx);
        });
    });
});

let matched = 0;
let unmatched = 0;
encRows.forEach(encRow => {
    const refKeys = [encRow.REFCONTCMPT, encRow.REFCONTCMPT2, encRow.REFINT].filter(Boolean);
    let found = false;
    for (const k of refKeys) {
        for (const v of getRefVariants(k)) {
            if (engLookup.has(v)) {
                found = true;
                break;
            }
        }
        if (found) break;
    }
    if (found) matched++;
    else unmatched++;
});

console.log(`With last-6 digits matching:`);
console.log(`Matched encours: ${matched} / ${encRows.length} (${(matched/encRows.length*100).toFixed(1)}%)`);
console.log(`Unmatched encours: ${unmatched}`);
