const XLSX = require('xlsx');

const sourceDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source';
const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

const searchVal = '130700200';

function searchInFile(dir, file) {
    console.log(`\nSearching in ${file}...`);
    const workbook = XLSX.readFile(`${dir}/${file}`);
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    const matches = rows.filter(row => {
        return Object.values(row).some(val => String(val).includes(searchVal));
    });
    console.log(`Found ${matches.length} matches.`);
    if (matches.length > 0) {
        console.log('Sample Match:', matches[0]);
    }
}

searchInFile(sourceDir, 'prets.xlsx');
searchInFile(sourceDir, 'encours.xlsx');
searchInFile(inputDir, 'engagements_06_2023_v2.xlsx');
searchInFile(inputDir, 'encours_06_2023_v2.xlsx');
