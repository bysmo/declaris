const XLSX = require('xlsx');
const filePath = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/personnes_morales_06_2023.xlsx';
const workbook = XLSX.readFile(filePath, { bookSheets: true });
console.log('Sheets in personnes_morales_06_2023.xlsx:', workbook.SheetNames);
