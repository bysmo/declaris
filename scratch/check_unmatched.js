const XLSX = require('xlsx');
const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

const engWb = XLSX.readFile(`${inputDir}/engagements_06_2023_v2.xlsx`);
const engRows = XLSX.utils.sheet_to_json(engWb.Sheets[engWb.SheetNames[0]]);

const encWb = XLSX.readFile(`${inputDir}/encours_06_2023_v2.xlsx`);
const encRows = XLSX.utils.sheet_to_json(encWb.Sheets[encWb.SheetNames[0]]);

const engByLoanNum = new Set();
engRows.forEach(r => {
    const fullRef = String(r.REFCONTCMPT || '').trim();
    if (fullRef) {
        engByLoanNum.add(fullRef);
        if (fullRef.length > 7 && /^\d+$/.test(fullRef)) {
            engByLoanNum.add(fullRef.substring(7));
            engByLoanNum.add(fullRef.substring(7).replace(/^0+/, ''));
        }
    }
});

const unmatched = [];
encRows.forEach(r => {
    const ref = String(r.REFCONTCMPT || '').trim();
    const unpadded = ref.replace(/^0+/, '');
    if (!engByLoanNum.has(ref) && !engByLoanNum.has(unpadded)) {
        if (unmatched.length < 15) unmatched.push(r);
    }
});

console.log('Unmatched sample:', unmatched);
