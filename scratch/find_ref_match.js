const fs = require('fs');
const XLSX = require('xlsx');

const xmlPath = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/modeles-valides/TD-60002-0004-31012023-51-DEC.xml';
const xmlContent = fs.readFileSync(xmlPath, 'utf8');

const sourceDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source';
const oldPrets = XLSX.readFile(`${sourceDir}/prets.xlsx`);
const oldPretsRows = XLSX.utils.sheet_to_json(oldPrets.Sheets[oldPrets.SheetNames[0]]);

console.log('Searching for old prets references in valid XML...');
let matchCount = 0;
for (const row of oldPretsRows) {
    const ref = String(row.REFCONTCMPT || '').trim();
    if (ref && xmlContent.includes(ref)) {
        matchCount++;
        console.log(`Found exact match: ${ref}`);
        if (matchCount >= 5) break;
    }
}
console.log(`Total exact matches: ${matchCount}`);
