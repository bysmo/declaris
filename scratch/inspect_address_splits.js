const XLSX = require('xlsx');

const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';

['personnes_morales_06_2023_v2.xlsx', 'personnes_physiques_06_2023_v2.xlsx'].forEach(file => {
    const filePath = `${inputDir}/${file}`;
    const workbook = XLSX.readFile(filePath);
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    console.log(`\n================ ${file} ================`);
    
    // Find some rows where ADRESSE contains '/'
    const slashRows = rows.filter(r => String(r.ADRESSE || '').includes('/'));
    console.log(`Total rows with '/' in ADRESSE: ${slashRows.length}`);
    
    slashRows.slice(0, 3).forEach((row, idx) => {
        console.log(`\nSample ${idx + 1}:`);
        console.log(`  IDINTCLI:`, row.IDINTCLI);
        console.log(`  ADRESSE :`, row.ADRESSE);
        console.log(`  TYPADR  :`, row.TYPADR);
        console.log(`  PAYS    :`, row.PAYS || row.PAYS_ADRESSE);
        console.log(`  REGION  :`, row.REGION);
        console.log(`  VILLE   :`, row.VILLE_ADRESSE || row.VILLE);
        console.log(`  CODPOST :`, row.CODPOST);
    });
});
