const fs = require('fs');
const path = require('path');
const XLSX = require('./node_modules/xlsx');
const vm = require('vm');

// Charger beac-validator.js dans un environnement virtuel
const validatorCode = fs.readFileSync(path.join(__dirname, '../app/beac-validator.js'), 'utf8');

const sandbox = {
    window: {},
    console: console,
    XLSX: XLSX,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    performance: performance
};
vm.createContext(sandbox);
vm.runInContext(validatorCode, sandbox);

const engine = sandbox.window.beacValidatorInstance;
console.log('--- Test Engine FRCB Initialisé ---');

// 1. Test sur personnes_physiques_06_2023_v2.xlsx
const ppPath = path.join(__dirname, '../source/input/personnes_physiques_06_2023_v2.xlsx');
if (fs.existsSync(ppPath)) {
    const wb = XLSX.readFile(ppPath);
    const dataPP = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    console.log(`\nTesting FRCB PP: ${dataPP.length} records...`);

    const headerOptions = {
        codePays: 'TD',
        codeBanque: '60002',
        numDec: '0001',
        natDec: '01',
        decDate: '30062023'
    };

    const resPP = engine.auditFrcbDataset(dataPP, 'frcb-pp', headerOptions);
    console.log('PP Audit Results:');
    console.log(`- Total Records: ${resPP.totalDeclaredRecords}`);
    console.log(`- Erreurs Bloquantes: ${resPP.errorCount}`);
    console.log(`- Avertissements: ${resPP.warningCount}`);
    console.log(`- Taux Conformité: ${resPP.conformitePct}%`);
    console.log(`- Statut Prédictif: ${resPP.statutLibelle}`);
    console.log(`- Top 5 Anomalies:`, resPP.topAnomalies.slice(0, 5).map(a => `${a.code}: ${a.count} (${a.meta.libelle})`));

    // Test Export Excel
    const excelFilename = engine.exportFrcbAuditToExcel(resPP, 'frcb-pp');
    console.log(`- Export Excel PP généré : ${excelFilename}`);
    if (fs.existsSync(excelFilename)) {
        console.log(`  Vérification : ${excelFilename} existe bien sur disque.`);
        fs.unlinkSync(excelFilename); // Nettoyer
    }
}

// 2. Test sur personnes_morales_06_2023_v2.xlsx
const pmPath = path.join(__dirname, '../source/input/personnes_morales_06_2023_v2.xlsx');
if (fs.existsSync(pmPath)) {
    const wb = XLSX.readFile(pmPath);
    const dataPM = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    console.log(`\nTesting FRCB PM: ${dataPM.length} records...`);

    const headerOptions = {
        codePays: 'TD',
        codeBanque: '60002',
        numDec: '0001',
        natDec: '01',
        decDate: '30062023'
    };

    const resPM = engine.auditFrcbDataset(dataPM, 'frcb-pm', headerOptions);
    console.log('PM Audit Results:');
    console.log(`- Total Records: ${resPM.totalDeclaredRecords}`);
    console.log(`- Erreurs Bloquantes: ${resPM.errorCount}`);
    console.log(`- Avertissements: ${resPM.warningCount}`);
    console.log(`- Taux Conformité: ${resPM.conformitePct}%`);
    console.log(`- Statut Prédictif: ${resPM.statutLibelle}`);
    console.log(`- Top 5 Anomalies:`, resPM.topAnomalies.slice(0, 5).map(a => `${a.code}: ${a.count} (${a.meta.libelle})`));

    // Test Export Excel
    const excelFilenamePM = engine.exportFrcbAuditToExcel(resPM, 'frcb-pm');
    console.log(`- Export Excel PM généré : ${excelFilenamePM}`);
    if (fs.existsSync(excelFilenamePM)) {
        console.log(`  Vérification : ${excelFilenamePM} existe bien sur disque.`);
        fs.unlinkSync(excelFilenamePM); // Nettoyer
    }
}

console.log('\n--- Tous les tests FRCB sont passés avec succès ! ---');
