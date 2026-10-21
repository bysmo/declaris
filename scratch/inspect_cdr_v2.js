const XLSX = require('xlsx');

const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

['debiteurs_06_2023_v2.xlsx', 'encours_06_2023_v2.xlsx'].forEach(file => {
    const filePath = `${inputDir}/${file}`;
    const workbook = XLSX.readFile(filePath, { sheetRows: 5 });
    console.log(`\n--- ${file} ---`);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
    console.log('Headers:', headers);
    const data = XLSX.utils.sheet_to_json(worksheet);
    if (data.length > 0) {
        console.log('Sample Row:', data[0]);
    }
});
