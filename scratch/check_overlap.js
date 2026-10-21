const fs = require('fs');
const XLSX = require('xlsx');

const xmlPath = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/modeles-valides/TD-60002-0001-31032025-01-DEC.xml';
const xlsxPath = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/personnes_physiques_06_2023.xlsx';

const xmlContent = fs.readFileSync(xmlPath, 'utf8');

const workbook = XLSX.readFile(xlsxPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);

console.log(`Total rows in Excel: ${rows.length}`);

let matchCount = 0;
for (const row of rows) {
    const id = String(row.IDINTCLI).trim();
    if (xmlContent.includes(`IdIntCli="${id}"`)) {
        matchCount++;
        if (matchCount <= 5) {
            console.log(`Found matching ID in XML: ${id}`);
            // Extract the XML block for this ID
            const regex = new RegExp(`<EntetePersonnePhysique IdIntCli="${id}">[\\s\\S]*?<\\/EntetePersonnePhysique>`);
            const match = xmlContent.match(regex);
            if (match) {
                console.log(`XML Block for ${id}:\n`, match[0]);
                console.log(`Excel data for ${id}:\n`, row);
            }
        }
    }
}
console.log(`Total matching IDs: ${matchCount}`);
