const XLSX = require('xlsx');
const path = require('path');

const filePath = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/personnes_physiques_06_2023.xlsx';
const workbook = XLSX.readFile(filePath, { bookSheets: true });
console.log('Sheets in personnes_physiques_06_2023.xlsx:', workbook.SheetNames);
