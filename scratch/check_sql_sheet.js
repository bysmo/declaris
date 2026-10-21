const XLSX = require('xlsx');
const filePath = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/personnes_physiques_06_2023.xlsx';
const workbook = XLSX.readFile(filePath, { sheetRows: 5 });
const sqlSheet = workbook.Sheets['SQL'];
if (sqlSheet) {
    console.log('SQL sheet headers:', XLSX.utils.sheet_to_json(sqlSheet, { header: 1 })[0]);
    console.log('SQL sheet row 1:', XLSX.utils.sheet_to_json(sqlSheet)[0]);
} else {
    console.log('No SQL sheet found');
}
