const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const files = [
    'personnes_physiques_06_2023.xlsx',
    'personnes_morales_06_2023.xlsx'
];

files.forEach(file => {
    const filePath = path.join('/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source', file);
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${file}`);
        return;
    }
    console.log(`\n--- Inspecting ${file} ---`);
    const workbook = XLSX.readFile(filePath, { sheetRows: 5 });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
    console.log('Headers:', headers);
    
    const data = XLSX.utils.sheet_to_json(worksheet);
    if (data.length > 0) {
        console.log('Sample Row 1:', data[0]);
    }
});
