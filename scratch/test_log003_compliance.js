const assert = require('assert');
const fs = require('fs');

// Charger beac-validator.js dans un environnement simulant window
const validatorCode = fs.readFileSync('app/beac-validator.js', 'utf8');
const fakeWindow = {
    document: { getElementById: () => null },
    localStorage: { getItem: () => null, setItem: () => {} }
};
const evalValidator = new Function('window', 'global', validatorCode);
evalValidator(fakeWindow, fakeWindow);

const engine = fakeWindow.beacValidatorInstance;
console.log('--- 1. TEST DIRECT DE checkNatureClientCompatibility ---');

// Test PP
const ppConsom = engine.checkNatureClientCompatibility('05', 'PP');
assert.strictEqual(ppConsom.isCompatible, true, 'Nature 05 doit être compatible PP');

const ppHabitat = engine.checkNatureClientCompatibility('09', 'PP');
assert.strictEqual(ppHabitat.isCompatible, true, 'Nature 09 doit être compatible PP');

const ppInvest = engine.checkNatureClientCompatibility('01', 'PP');
assert.strictEqual(ppInvest.isCompatible, false, 'Nature 01 doit être INCOMPATIBLE PP');
assert.strictEqual(ppInvest.expectedType, 'PM');
assert.strictEqual(ppInvest.actualType, 'PP');
console.log('PP + Nature 01 -> Rejeté avec message:', ppInvest.message);

const ppEquip = engine.checkNatureClientCompatibility('03', 'PP');
assert.strictEqual(ppEquip.isCompatible, false, 'Nature 03 doit être INCOMPATIBLE PP');

const ppDecouvert = engine.checkNatureClientCompatibility('26', 'PP');
assert.strictEqual(ppDecouvert.isCompatible, true, 'Nature 26 doit être compatible PP');

// Test PM
const pmInvest = engine.checkNatureClientCompatibility('01', 'PM');
assert.strictEqual(pmInvest.isCompatible, true, 'Nature 01 doit être compatible PM');

const pmEquip = engine.checkNatureClientCompatibility('03', 'PM');
assert.strictEqual(pmEquip.isCompatible, true, 'Nature 03 doit être compatible PM');

const pmConsom = engine.checkNatureClientCompatibility('05', 'PM');
assert.strictEqual(pmConsom.isCompatible, false, 'Nature 05 doit être INCOMPATIBLE PM');
assert.strictEqual(pmConsom.expectedType, 'PP');
assert.strictEqual(pmConsom.actualType, 'PM');
console.log('PM + Nature 05 -> Rejeté avec message:', pmConsom.message);

const pmHabitat = engine.checkNatureClientCompatibility('09', 'PM');
assert.strictEqual(pmHabitat.isCompatible, false, 'Nature 09 doit être INCOMPATIBLE PM');

const pmDecouvert = engine.checkNatureClientCompatibility('26', 'PM');
assert.strictEqual(pmDecouvert.isCompatible, true, 'Nature 26 doit être compatible PM');

console.log('-> Tous les tests directs checkNatureClientCompatibility sont validés avec succès !');

console.log('\n--- 2. TEST D\'INTÉGRATION VALIDATEENGAGEMENT AVEC REGISTRE CLIENTS ---');

const mockRegistry = {
    clients: new Map([
        ['CLI_PP_1', { type: 'PP' }],
        ['CLI_PM_1', { type: 'PM' }]
    ]),
    getClientType(id) {
        return this.clients.get(id)?.type || null;
    },
    isGoodClient(id) { return this.clients.has(id); },
    isClientDeclared(id) { return this.clients.has(id); },
    isClientRejected(id) { return false; },
    isControlEnabled() { return true; }
};

const headerContext = {
    clientRegistry: mockRegistry,
    datDecStr: '30062023',
    arrDateStr: '30062023'
};

// Prêt 1 : PP avec Crédit Consommation (05) -> OK
const rowPpOk = {
    REFCONTCMPT: 'PRT-PP-01',
    CODAGE: '00001',
    STATUT: '00',
    TYPENG: '01',
    NATENG: '05',
    MNTENG: '5000000',
    DATMEP: '15/01/2023',
    DATDEB: '15/01/2023',
    DATFIN: '15/01/2025',
    DUREE: '24',
    MATURITE: '01',
    IDINTCLI: 'CLI_PP_1'
};
const anomaliesPpOk = engine.validateEngagement(rowPpOk, 0, headerContext);
const log003PpOk = anomaliesPpOk.filter(a => a.code === 'LOG003');
assert.strictEqual(log003PpOk.length, 0, 'Aucune anomalie LOG003 attendue pour PP + Nature 05');
console.log('PRT-PP-01 (PP + Nature 05) -> LOG003 anomalies:', log003PpOk.length);

// Prêt 2 : PP avec Crédit Equipement (03, PM uniquement) -> LOG003
const rowPpKo = {
    REFCONTCMPT: 'PRT-PP-02',
    CODAGE: '00001',
    STATUT: '00',
    TYPENG: '01',
    NATENG: '03', // PM only
    MNTENG: '10000000',
    DATMEP: '15/01/2023',
    DATDEB: '15/01/2023',
    DATFIN: '15/01/2025',
    DUREE: '24',
    MATURITE: '01',
    IDINTCLI: 'CLI_PP_1'
};
const anomaliesPpKo = engine.validateEngagement(rowPpKo, 1, headerContext);
const log003PpKo = anomaliesPpKo.filter(a => a.code === 'LOG003');
assert.strictEqual(log003PpKo.length, 1, 'Une anomalie bloquante LOG003 est attendue pour PP + Nature 03');
assert.strictEqual(log003PpKo[0].isBlocking, true, 'LOG003 doit être bloquante');
console.log('PRT-PP-02 (PP + Nature 03) -> Détecté avec succès :', log003PpKo[0].message);

// Prêt 3 : PM avec Crédit Habitat (09, PP uniquement) -> LOG003
const rowPmKo = {
    REFCONTCMPT: 'PRT-PM-03',
    CODAGE: '00001',
    STATUT: '00',
    TYPENG: '01',
    NATENG: '09', // PP only
    MNTENG: '50000000',
    DATMEP: '15/01/2023',
    DATDEB: '15/01/2023',
    DATFIN: '15/01/2030',
    DUREE: '84',
    MATURITE: '02',
    IDINTCLI: 'CLI_PM_1'
};
const anomaliesPmKo = engine.validateEngagement(rowPmKo, 2, headerContext);
const log003PmKo = anomaliesPmKo.filter(a => a.code === 'LOG003');
assert.strictEqual(log003PmKo.length, 1, 'Une anomalie bloquante LOG003 est attendue pour PM + Nature 09');
assert.strictEqual(log003PmKo[0].isBlocking, true, 'LOG003 doit être bloquante');
console.log('PRT-PM-03 (PM + Nature 09) -> Détecté avec succès :', log003PmKo[0].message);

// Prêt 4 : PM avec Investissement Immobilier (01, PM) -> OK
const rowPmOk = {
    REFCONTCMPT: 'PRT-PM-04',
    CODAGE: '00001',
    STATUT: '00',
    TYPENG: '01',
    NATENG: '01', // PM
    MNTENG: '50000000',
    DATMEP: '15/01/2023',
    DATDEB: '15/01/2023',
    DATFIN: '15/01/2030',
    DUREE: '84',
    MATURITE: '02',
    IDINTCLI: 'CLI_PM_1'
};
const anomaliesPmOk = engine.validateEngagement(rowPmOk, 3, headerContext);
const log003PmOk = anomaliesPmOk.filter(a => a.code === 'LOG003');
assert.strictEqual(log003PmOk.length, 0, 'Aucune anomalie LOG003 attendue pour PM + Nature 01');
console.log('PRT-PM-04 (PM + Nature 01) -> LOG003 anomalies:', log003PmOk.length);

console.log('\n-> Tous les tests d\'intégration validateEngagement LOG003 sont validés avec succès !');
