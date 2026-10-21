const XLSX = require('xlsx');
const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

const engWb = XLSX.readFile(`${inputDir}/engagements_06_2023_v2.xlsx`);
const engRows = XLSX.utils.sheet_to_json(engWb.Sheets[engWb.SheetNames[0]]);

const lenCounts = {};
engRows.forEach(r => {
    const s = String(r.REFCONTCMPT || '').trim();
    lenCounts[s.length] = (lenCounts[s.length] || 0) + 1;
});
console.log('Engagements ref lengths:', lenCounts);

const samplesByLen = {};
engRows.forEach(r => {
    const s = String(r.REFCONTCMPT || '').trim();
    if (!samplesByLen[s.length]) samplesByLen[s.length] = [];
    if (samplesByLen[s.length].length < 3) samplesByLen[s.length].push(s);
});
console.log('Samples by length:', samplesByLen);
