const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';
const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.xlsx'));

files.forEach(file => {
    const filePath = path.join(inputDir, file);
    console.log(`\n========================================`);
    console.log(`Inspecting file: ${file}`);
    console.log(`========================================`);
    
    const workbook = XLSX.readFile(filePath, { sheetRows: 5 });
    console.log('Sheet Names:', workbook.SheetNames);
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
    console.log('Headers:', headers);
    
    const data = XLSX.utils.sheet_to_json(worksheet);
    if (data.length > 0) {
        console.log('Sample Row 1 keys:', Object.keys(data[0]));
        console.log('Sample Row 1 values:', data[0]);
    }
});
