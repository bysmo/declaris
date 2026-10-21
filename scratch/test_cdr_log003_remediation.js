const assert = require('assert');
const fs = require('fs');

// Charger les scripts
const validatorCode = fs.readFileSync('app/beac-validator.js', 'utf8');
const fakeWindow = {
    document: {
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => []
    },
    localStorage: { getItem: () => null, setItem: () => {} }
};
const evalValidator = new Function('window', 'global', validatorCode);
evalValidator(fakeWindow, fakeWindow);

console.log('=== TEST DE SÉGRÉGATION CDR AVEC ANOMALIE LOG003 ===');

const engine = fakeWindow.beacValidatorInstance;

// Configurer le registre client avec 1 PP et 1 PM
const clientRegistry = {
    clients: new Map([
        ['CLI_PP_100', { type: 'PP', nom: 'M. KOUAME YVES' }],
        ['CLI_PM_200', { type: 'PM', nom: 'SOCIETE IVOIRIENNE SARL' }]
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
    codePays: 'TD',
    codeBanque: '60002',
    numDec: '0001',
    typDec: '51',
    natDec: '01',
    datDecStr: '30062023',
    arrDateStr: '30062023',
    clientRegistry
};

// Dataset CDR contenant :
// 1. Prêt OK : PP avec Crédit Consommation (05)
// 2. Prêt KO LOG003 : PP avec Crédit Investissement Immobilier (01) réservé PM
// 3. Prêt KO LOG003 : PM avec Crédit Habitat (09) réservé PP
// 4. Prêt OK : PM avec Crédit Investissement Immobilier (01)
const prets = [
    {
        REFCONTCMPT: 'PRT-OK-PP',
        CODAGE: '00001',
        STATUT: '00',
        TYPENG: '01',
        NATENG: '05', // PP OK
        MNTENG: '5000000',
        DATMEP: '15/01/2023',
        DATDEB: '15/01/2023',
        DATFIN: '15/01/2025',
        DUREE: '24',
        MATURITE: '01',
        IDINTCLI: 'CLI_PP_100'
    },
    {
        REFCONTCMPT: 'PRT-KO-LOG003-PP',
        CODAGE: '00001',
        STATUT: '00',
        TYPENG: '01',
        NATENG: '01', // PM only! -> Incohérence LOG003
        MNTENG: '20000000',
        DATMEP: '15/01/2023',
        DATDEB: '15/01/2023',
        DATFIN: '15/01/2028',
        DUREE: '60',
        MATURITE: '02',
        IDINTCLI: 'CLI_PP_100'
    },
    {
        REFCONTCMPT: 'PRT-KO-LOG003-PM',
        CODAGE: '00001',
        STATUT: '00',
        TYPENG: '01',
        NATENG: '09', // PP only! -> Incohérence LOG003
        MNTENG: '50000000',
        DATMEP: '15/01/2023',
        DATDEB: '15/01/2023',
        DATFIN: '15/01/2033',
        DUREE: '120',
        MATURITE: '03',
        IDINTCLI: 'CLI_PM_200'
    },
    {
        REFCONTCMPT: 'PRT-OK-PM',
        CODAGE: '00001',
        STATUT: '00',
        TYPENG: '01',
        NATENG: '01', // PM OK
        MNTENG: '80000000',
        DATMEP: '15/01/2023',
        DATDEB: '15/01/2023',
        DATFIN: '15/01/2028',
        DUREE: '60',
        MATURITE: '02',
        IDINTCLI: 'CLI_PM_200'
    }
];

const encours = [
    { REFCONTCMPT: 'PRT-OK-PP', CODAGE: '00001', MNTENG: '4000000', SOLIMP: '0', CLASSCRED: '01', DATECH: '15/01/2025' },
    { REFCONTCMPT: 'PRT-KO-LOG003-PP', CODAGE: '00001', MNTENG: '18000000', SOLIMP: '0', CLASSCRED: '01', DATECH: '15/01/2028' },
    { REFCONTCMPT: 'PRT-KO-LOG003-PM', CODAGE: '00001', MNTENG: '45000000', SOLIMP: '0', CLASSCRED: '01', DATECH: '15/01/2033' },
    { REFCONTCMPT: 'PRT-OK-PM', CODAGE: '00001', MNTENG: '70000000', SOLIMP: '0', CLASSCRED: '01', DATECH: '15/01/2028' }
];

// 1. Audit complet du dataset CDR
const auditResult = engine.auditCdrDataset({ prets, encours, debiteurs: [] }, headerContext);

console.log('Anomalies détectées par l\'audit BEAC :', auditResult.anomalies.length);
const log003Anomalies = auditResult.anomalies.filter(a => a.code === 'LOG003');
console.log('Anomalies LOG003 détectées :', log003Anomalies.length);
assert.strictEqual(log003Anomalies.length, 2, 'Doit détecter exactement 2 anomalies LOG003');

log003Anomalies.forEach(a => {
    console.log(`  -> Contrat: ${a.ref} | Champ: ${a.champ} | Bloquant: ${a.isBlocking} | Message: ${a.message}`);
    assert.strictEqual(a.isBlocking, true, 'LOG003 doit être bloquante');
});

console.log('\n=== TEST LOG003 TERMINÉ AVEC SUCCÈS ! ===');
