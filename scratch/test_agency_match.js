const XLSX = require('xlsx');
const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

const engWb = XLSX.readFile(`${inputDir}/engagements_06_2023_v2.xlsx`);
const engRows = XLSX.utils.sheet_to_json(engWb.Sheets[engWb.SheetNames[0]]);

const encWb = XLSX.readFile(`${inputDir}/encours_06_2023_v2.xlsx`);
const encRows = XLSX.utils.sheet_to_json(encWb.Sheets[encWb.SheetNames[0]]);

// Build index of engagements
// 1) By exact REFCONTCMPT
// 2) By suffix (the numeric loan part)
// In engRows: REFCONTCMPT is e.g. "0100013367268" (where CODAGE is "00013")
// If we remove prefix "01" + CODAGE (length 2 + 5 = 7), what is left? "367268"!
// Let's check!

const engByExactRef = new Map();
const engByAgencyAndLoan = new Map(); // key: agency + "_" + loanNum
const engByLoanNum = new Map(); // key: loanNum -> engRow

engRows.forEach(r => {
    const fullRef = String(r.REFCONTCMPT || '').trim();
    if (!fullRef) return;
    engByExactRef.set(fullRef, r);

    const codAge = String(r.CODAGE || '').trim().padStart(5, '0');
    // If fullRef starts with 2 digits + codAge (7 digits)
    if (fullRef.length > 7 && /^\d+$/.test(fullRef)) {
        const loanNum = fullRef.substring(7); // "367268"
        const unpadded = loanNum.replace(/^0+/, '');
        engByAgencyAndLoan.set(`${codAge}_${loanNum}`, r);
        engByAgencyAndLoan.set(`${codAge}_${unpadded}`, r);
        if (!engByLoanNum.has(loanNum)) engByLoanNum.set(loanNum, r);
        if (unpadded && !engByLoanNum.has(unpadded)) engByLoanNum.set(unpadded, r);
    } else {
        // e.g. CI000000003 or other
        const m = fullRef.match(/(\d+)$/);
        if (m) {
            const num = m[1];
            const unpadded = num.replace(/^0+/, '');
            if (!engByLoanNum.has(num)) engByLoanNum.set(num, r);
            if (unpadded && !engByLoanNum.has(unpadded)) engByLoanNum.set(unpadded, r);
        }
    }
});

let exactMatches = 0;
let agencyMatches = 0;
let loanNumMatches = 0;
let noMatch = 0;

encRows.forEach(r => {
    const ref = String(r.REFCONTCMPT || '').trim();
    const unpadded = ref.replace(/^0+/, '');
    if (engByExactRef.has(ref)) {
        exactMatches++;
    } else if (engByLoanNum.has(ref)) {
        loanNumMatches++;
    } else if (unpadded && engByLoanNum.has(unpadded)) {
        loanNumMatches++;
    } else {
        noMatch++;
    }
});

console.log(`Results on ${encRows.length} Encours rows:`);
console.log(`- Exact matches: ${exactMatches}`);
console.log(`- Loan number matches: ${loanNumMatches}`);
console.log(`- Total matched: ${exactMatches + loanNumMatches} (${((exactMatches + loanNumMatches)/encRows.length*100).toFixed(2)}%)`);
console.log(`- No match: ${noMatch}`);
