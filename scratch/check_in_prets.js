const XLSX = require('xlsx');

const sourceDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source';
const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

const pWb = XLSX.readFile(`${sourceDir}/prets.xlsx`);
const pRows = XLSX.utils.sheet_to_json(pWb.Sheets[pWb.SheetNames[0]]);

const sampleUnmatched = ['489670', '483540', '487669', '476377', '200960'];
sampleUnmatched.forEach(u => {
    const found = pRows.find(r => Object.values(r).some(v => String(v).includes(u)));
    console.log(`Checking ${u} in source/prets.xlsx:`, found ? { REFCONTCMPT: found.REFCONTCMPT, REFCONTCMPT2: found.REFCONTCMPT2 } : 'NOT FOUND');
});
