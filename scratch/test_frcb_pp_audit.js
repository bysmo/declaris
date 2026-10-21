const fs = require('fs');
const path = require('path');
const XLSX = require('./node_modules/xlsx');

// Load BeacValidator
const beacValidatorCode = fs.readFileSync(path.join(__dirname, '../app/beac-validator.js'), 'utf-8');

// Mock window and browser environment
const window = {
    beacRulesMeta: {},
    ClientsRegistryManager: {
        isClientHistoricallyDeclared: () => false
    }
};
const evalValidator = new Function('window', beacValidatorCode + '; return window.beacValidatorInstance;');
const validator = evalValidator(window);

// Test on v2 file
const v2Path = path.join(__dirname, '../source/input/personnes_physiques_06_2023_v2.xlsx');
console.log('Loading test file:', v2Path);
const wb = XLSX.readFile(v2Path);
const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
console.log('Total records loaded:', data.length);

const headerOptions = {
    codePays: 'TD',
    codeBanque: '60002',
    numDec: '0001',
    natDec: '01', // Header natDec is 01 Normale
    decDate: '2023-06-30'
};

const result = validator.auditFrcbDataset(data, 'frcb-pp', headerOptions);

console.log('--- RÉSULTATS AUDIT FRCB PP ---');
console.log('Conformité :', result.conformitePct, '%');
console.log('Statut :', result.statutLibelle);
console.log('Erreurs bloquantes :', result.errorCount);
console.log('Avertissements :', result.warningCount);
console.log('\n--- 5 INDICATEURS CLÉS DU RAPPORT ---');
console.log('1. Nombre de clients traités :', result.stats.totalClients);
console.log('2. Anciens clients (Code 02 MAJ) :', result.stats.anciensClients);
console.log('3. Nouveaux clients (Code 01 Création) :', result.stats.nouveauxClients);
console.log('4. Nombre de clients OK (Conformes) :', result.stats.clientsOk);
console.log('5. Nombre de clients erronés :', result.stats.clientsErrones);
console.log('   - Détail : Anciens OK =', result.stats.anciensOk, '| Anciens erronés =', result.stats.anciensErrones);
console.log('   - Détail : Nouveaux OK =', result.stats.nouveauxOk, '| Nouveaux erronés =', result.stats.nouveauxErrones);

// Verify that conformité is NOT 0%
if (result.conformitePct > 80 && result.stats.totalClients === 36744 && result.stats.clientsOk > 30000) {
    console.log('\n>>> VALIDATION RÉUSSIE AVEC SUCCÈS ! <<<');
} else {
    console.error('\n>>> ÉCHEC VALIDATION <<<');
    process.exit(1);
}
