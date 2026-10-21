const XLSX = require('xlsx');
const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

const encWb = XLSX.readFile(`${inputDir}/encours_06_2023_v2.xlsx`);
const encRows = XLSX.utils.sheet_to_json(encWb.Sheets[encWb.SheetNames[0]]);

const lenCounts = {};
encRows.forEach(r => {
    const s = String(r.REFCONTCMPT || '').trim();
    lenCounts[s.length] = (lenCounts[s.length] || 0) + 1;
});
console.log('Encours ref lengths:', lenCounts);

const samplesByLen = {};
encRows.forEach(r => {
    const s = String(r.REFCONTCMPT || '').trim();
    if (!samplesByLen[s.length]) samplesByLen[s.length] = [];
    if (samplesByLen[s.length].length < 3) samplesByLen[s.length].push(s);
});
console.log('Samples by length:', samplesByLen);
