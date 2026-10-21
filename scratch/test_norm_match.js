const XLSX = require('xlsx');
const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

const engWb = XLSX.readFile(`${inputDir}/engagements_06_2023_v2.xlsx`);
const engRows = XLSX.utils.sheet_to_json(engWb.Sheets[engWb.SheetNames[0]]);

const encWb = XLSX.readFile(`${inputDir}/encours_06_2023_v2.xlsx`);
const encRows = XLSX.utils.sheet_to_json(encWb.Sheets[encWb.SheetNames[0]]);

// Map engagements by several keys:
// 1) Full REFCONTCMPT
// 2) Suffix of 13-char numeric refs:
//    - substring(7) e.g. "367268" or "022496"
//    - unpadded suffix: "367268" or "22496"
// 3) Any other digits suffix

const engMap = new Map();

function register(key, r) {
    if (!key) return;
    const s = String(key).trim();
    if (!s) return;
    if (!engMap.has(s)) engMap.set(s, r);
    const unp = s.replace(/^0+/, '');
    if (unp && !engMap.has(unp)) engMap.set(unp, r);
}

engRows.forEach(r => {
    const full = String(r.REFCONTCMPT || '').trim();
    register(full, r);
    register(r.REFCONTCMPT2, r);
    register(r.REFINT, r);
    
    if (full.length === 13 && /^\d+$/.test(full)) {
        const loan6 = full.substring(7); // 6 digits
        register(loan6, r);
    }
    const m = full.match(/(\d+)$/);
    if (m) {
        register(m[1], r);
    }
});

let matched = 0;
let unmatched = 0;

encRows.forEach(r => {
    const ref = String(r.REFCONTCMPT || '').trim();
    const unp = ref.replace(/^0+/, '');
    const pad6 = /^\d+$/.test(ref) ? ref.padStart(6, '0') : ref;
    
    const found = engMap.get(ref) || (unp && engMap.get(unp)) || engMap.get(pad6);
    if (found) {
        matched++;
    } else {
        unmatched++;
    }
});

console.log(`Matched with pad6 & unpadded: ${matched} / ${encRows.length} (${(matched/encRows.length*100).toFixed(1)}%)`);
console.log(`Unmatched: ${unmatched}`);
