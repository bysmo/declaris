const XLSX = require('xlsx');

const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

['personnes_physiques_06_2023_v2.xlsx', 'personnes_morales_06_2023_v2.xlsx'].forEach(file => {
    const filePath = `${inputDir}/${file}`;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    const ids = data.map(row => String(row.IDINTCLI || '').trim());
    const uniqueIds = new Set(ids);
    console.log(`\n--- ${file} ---`);
    console.log(`Total rows: ${data.length}`);
    console.log(`Unique IDINTCLI count: ${uniqueIds.size}`);
    
    if (ids.length !== uniqueIds.size) {
        console.log(`Has duplicates!`);
        const idCounts = {};
        ids.forEach(id => idCounts[id] = (idCounts[id] || 0) + 1);
        const dupIds = Object.keys(idCounts).filter(id => idCounts[id] > 1);
        console.log(`Number of duplicate IDs: ${dupIds.length}`);
        console.log(`Sample duplicates:`, dupIds.slice(0, 3).map(id => ({ id, count: idCounts[id] })));
        
        // Let's print rows for one duplicate ID
        const targetId = dupIds[0];
        const dupRows = data.filter(row => String(row.IDINTCLI || '').trim() === targetId);
        console.log(`Duplicate rows for ID ${targetId}:`, dupRows);
    } else {
        console.log(`No duplicate IDINTCLI found.`);
    }
});
