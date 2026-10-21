const fs = require('fs');
const XLSX = require('xlsx');

const xmlPath = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/modeles-valides/TD-60002-0001-01042025-02-DEC.XML';
const xmlContent = fs.readFileSync(xmlPath, 'utf8');

const xlsxPath = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input/personnes_morales_06_2023_v2.xlsx';
const workbook = XLSX.readFile(xlsxPath);
const pmRows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

// Find all matches of <EntetePersonneMorale> and extract the IdIntCli and Adresses elements
const regex = /<EntetePersonneMorale IdIntCli="([^"]+)">([\s\S]+?)<\/EntetePersonneMorale>/g;
let match;
let count = 0;

while ((match = regex.exec(xmlContent)) !== null && count < 10) {
    const id = match[1].trim();
    const subXml = match[2];
    
    // Check if this ID has multiple Adresses or if CodPost is set in XML
    if (subXml.includes('CodPost="') && !subXml.includes('CodPost=""')) {
        count++;
        console.log(`\nXML Client ID: ${id}`);
        console.log(`XML Content:\n${subXml.trim()}`);
        
        const excelRow = pmRows.find(r => String(r.IDINTCLI || '').trim() === id);
        if (excelRow) {
            console.log(`Excel Row:`);
            console.log(`  ADRESSE :`, excelRow.ADRESSE);
            console.log(`  CODPOST :`, excelRow.CODPOST);
        }
    }
}
