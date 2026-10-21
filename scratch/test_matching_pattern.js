const XLSX = require('xlsx');
const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

const engWb = XLSX.readFile(`${inputDir}/engagements_06_2023_v2.xlsx`);
const engRows = XLSX.utils.sheet_to_json(engWb.Sheets[engWb.SheetNames[0]]);

const encWb = XLSX.readFile(`${inputDir}/encours_06_2023_v2.xlsx`);
const encRows = XLSX.utils.sheet_to_json(encWb.Sheets[encWb.SheetNames[0]]);

// Map engagements by full REFCONTCMPT and by stripped/suffix
// Notice: in engagements, REFCONTCMPT is e.g. "0100013367268" or "CI000000003"
// In encours, REFCONTCMPT is e.g. "367268" OR "0100013367268" (if already formatted!)
// What if in encours, REFCONTCMPT matches the end of eng.REFCONTCMPT?
// Or what if we match:
// 1) exact match
// 2) eng.REFCONTCMPT endsWith enc.REFCONTCMPT
// 3) or enc.REFCONTCMPT endsWith eng.REFCONTCMPT

const engByFullRef = new Map();
const engByShortRef = new Map(); // e.g. last 6 digits or numeric part

engRows.forEach((r, idx) => {
    const fullRef = String(r.REFCONTCMPT || '').trim();
    if (!fullRef) return;
    engByFullRef.set(fullRef, r);
    
    // If fullRef has digits at the end
    const m = fullRef.match(/(\d+)$/);
    if (m) {
        const numPart = m[1]; // e.g. "367268" or "00001450864"
        // Also strip leading zeros:
        const unpadded = numPart.replace(/^0+/, '');
        if (unpadded) {
            engByShortRef.set(unpadded, fullRef);
        }
        engByShortRef.set(numPart, fullRef);
    }
});

let matched = 0;
let notMatched = 0;
const sampleMatches = [];
const sampleUnmatched = [];

encRows.forEach(encRow => {
    const encRef = String(encRow.REFCONTCMPT || '').trim();
    if (!encRef) return;

    if (engByFullRef.has(encRef)) {
        matched++;
        if (sampleMatches.length < 5) sampleMatches.push({ encRef, matchedWith: encRef, type: 'exact' });
    } else {
        const unpaddedEnc = encRef.replace(/^0+/, '');
        if (engByShortRef.has(encRef)) {
            matched++;
            if (sampleMatches.length < 5) sampleMatches.push({ encRef, matchedWith: engByShortRef.get(encRef), type: 'shortRef' });
        } else if (unpaddedEnc && engByShortRef.has(unpaddedEnc)) {
            matched++;
            if (sampleMatches.length < 5) sampleMatches.push({ encRef, matchedWith: engByShortRef.get(unpaddedEnc), type: 'unpadded' });
        } else {
            notMatched++;
            if (sampleUnmatched.length < 5) sampleUnmatched.push(encRef);
        }
    }
});

console.log(`Matched Encours: ${matched} / ${encRows.length} (${(matched/encRows.length*100).toFixed(1)}%)`);
console.log(`Unmatched Encours: ${notMatched}`);
console.log('Sample Matches:', sampleMatches);
console.log('Sample Unmatched:', sampleUnmatched);
