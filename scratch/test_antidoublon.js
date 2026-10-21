// Test script for AntiDoublonManager and ACQ update logic
const fs = require('fs');
const path = require('path');

// Mock browser globals
global.window = global;
global.document = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
};
global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
};
global.Logger = {
    info: console.log,
    step: console.log,
    warn: console.warn,
    success: console.log,
    error: console.error
};
global.AppNotify = {
    info: () => {},
    warn: () => {},
    success: () => {},
    error: () => {}
};

// Minimal contract helper
function addContractVariants(targetSet, rawId) {
    if (!rawId || !targetSet) return;
    const str = String(rawId).trim();
    if (!str) return;
    targetSet.add(str);
    targetSet.add(str.toUpperCase());
    const noSpaces = str.replace(/\s+/g, '');
    if (noSpaces !== str) {
        targetSet.add(noSpaces);
        targetSet.add(noSpaces.toUpperCase());
    }
    const noZeros = str.replace(/^0+/, '');
    if (noZeros && noZeros !== str) {
        targetSet.add(noZeros);
        targetSet.add(noZeros.toUpperCase());
    }
}

function removeContractVariants(targetSet, rawId) {
    if (!rawId || !targetSet) return;
    const str = String(rawId).trim();
    if (!str) return;
    targetSet.delete(str);
    targetSet.delete(str.toUpperCase());
    const noSpaces = str.replace(/\s+/g, '');
    targetSet.delete(noSpaces);
    targetSet.delete(noSpaces.toUpperCase());
    const noZeros = str.replace(/^0+/, '');
    if (noZeros) {
        targetSet.delete(noZeros);
        targetSet.delete(noZeros.toUpperCase());
    }
}

const CONTRACT_ID_KEYS = [
    'REFENG', 'REF_ENG', 'NUM_ENG', 'REF_ENGAGEMENT',
    'REFCONTCMPT', 'REFCONTCMPT2', 'REFCONTCMPT3',
    'NUMCONTRAT', 'NUM_CONTRAT', 'NUMCPT', 'NUM_CPT',
    'REFINT'
];

function getVal(row, keys) {
    if (!row) return '';
    for (let k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
            return String(row[k]).trim();
        }
    }
    return '';
}

// Read app.js and extract AntiDoublonManager and checkCdrDuplicates, filterCdrDuplicates
const appCode = fs.readFileSync(path.join(__dirname, '../app/app.js'), 'utf8');

// Test 1: Check syntax and eval AntiDoublonManager
console.log('--- Test 1: AntiDoublonManager lifecycle ---');
eval(`
    ${addContractVariants.toString()}
    ${removeContractVariants.toString()}
    function updatePlatformCounters() {}
    const DeclarisStorage = {
        init: async () => {},
        getContratsCsv: async () => null,
        setStoredItem: async () => {}
    };
`);

// Extract AntiDoublonManager block from appCode
const admMatch = appCode.match(/const AntiDoublonManager = \{[\s\S]*?\n    \};\n/);
if (!admMatch) {
    throw new Error('AntiDoublonManager definition not found in app.js');
}
eval(admMatch[0].replace('const AntiDoublonManager =', 'global.AntiDoublonManager ='));

console.log('AntiDoublonManager loaded successfully.');

// Test 2: Ingestion of ACQ for period 2023-08
console.log('\n--- Test 2: Ingest ACQ for 2023-08 ---');
const acqOk = ['0100001000012', '0100001000056', '0100001000076'];
const acqKo = ['CI000000009', 'PTI00000039'];
const acqAnomalies = [
    { ref: 'CI000000009', details: 'Erreur LOG0020' },
    { ref: 'DEJA_DEC_CONTRAT', details: 'Ce contrat est déjà déclaré dans la période' }
];

AntiDoublonManager.updateFromAcq('2023-08', acqOk, acqKo, acqAnomalies);

console.log('isContractDeclaredOkInPeriod 0100001000012:', AntiDoublonManager.isContractDeclaredOkInPeriod('2023-08', '0100001000012'));
console.log('isContractInErrorInPeriod CI000000009:', AntiDoublonManager.isContractInErrorInPeriod('2023-08', 'CI000000009'));
console.log('isContractDeclaredOkInPeriod CI000000009 (should be false):', AntiDoublonManager.isContractDeclaredOkInPeriod('2023-08', 'CI000000009'));
console.log('isContractDeclaredOkInPeriod DEJA_DEC_CONTRAT (should be true):', AntiDoublonManager.isContractDeclaredOkInPeriod('2023-08', 'DEJA_DEC_CONTRAT'));

if (!AntiDoublonManager.isContractDeclaredOkInPeriod('2023-08', '0100001000012')) throw new Error('Assertion failed: 0100001000012 should be OK');
if (!AntiDoublonManager.isContractInErrorInPeriod('2023-08', 'CI000000009')) throw new Error('Assertion failed: CI000000009 should be in error');
if (AntiDoublonManager.isContractDeclaredOkInPeriod('2023-08', 'CI000000009')) throw new Error('Assertion failed: CI000000009 should NOT be OK');
if (!AntiDoublonManager.isContractDeclaredOkInPeriod('2023-08', 'DEJA_DEC_CONTRAT')) throw new Error('Assertion failed: DEJA_DEC_CONTRAT should be OK');

// Test 3: Status remediation / In-place update (CI000000009 is fixed in subsequent ACQ)
console.log('\n--- Test 3: In-place status remediation ---');
AntiDoublonManager.updateFromAcq('2023-08', ['CI000000009'], [], []);
console.log('After fix, isContractDeclaredOkInPeriod CI000000009:', AntiDoublonManager.isContractDeclaredOkInPeriod('2023-08', 'CI000000009'));
console.log('After fix, isContractInErrorInPeriod CI000000009:', AntiDoublonManager.isContractInErrorInPeriod('2023-08', 'CI000000009'));
if (!AntiDoublonManager.isContractDeclaredOkInPeriod('2023-08', 'CI000000009')) throw new Error('Assertion failed: CI000000009 should now be OK');
if (AntiDoublonManager.isContractInErrorInPeriod('2023-08', 'CI000000009')) throw new Error('Assertion failed: CI000000009 should no longer be KO');

// Test 4: Re-declaration filtering
console.log('\n--- Test 4: Re-declaration duplicate check & filtering ---');
const ccdMatch = appCode.match(/function checkCdrDuplicates[\s\S]*?\n    \}/);
const fcdMatch = appCode.match(/function filterCdrDuplicates[\s\S]*?\n    \}/);
eval(ccdMatch[0].replace('function checkCdrDuplicates', 'global.checkCdrDuplicates = function'));
eval(fcdMatch[0].replace('function filterCdrDuplicates', 'global.filterCdrDuplicates = function'));

const dataset = {
    prets: [
        { REFCONTCMPT: '0100001000012', MONTANT: 1000 }, // OK in 2023-08
        { REFCONTCMPT: 'PTI00000039', MONTANT: 2000 },    // KO in 2023-08 (not OK!)
        { REFCONTCMPT: 'NEW_UNSEEN_001', MONTANT: 3000 }  // Never declared
    ],
    encours: [
        { REFCONTCMPT: '0100001000012', SOLDE: 500 },
        { REFCONTCMPT: 'PTI00000039', SOLDE: 1000 },
        { REFCONTCMPT: 'NEW_UNSEEN_001', SOLDE: 1500 }
    ],
    debiteurs: []
};

const dups = checkCdrDuplicates(dataset, '2023-08');
console.log('Duplicates detected for 2023-08:', dups);
if (dups.length !== 1 || dups[0] !== '0100001000012') {
    throw new Error('Assertion failed: Only 0100001000012 should be identified as duplicate for 2023-08');
}

const filtered = filterCdrDuplicates(dataset, dups);
console.log('Filtered prets count:', filtered.prets.length, '(expected 2: PTI00000039 and NEW_UNSEEN_001)');
console.log('Filtered prets refs:', filtered.prets.map(p => p.REFCONTCMPT));
if (filtered.prets.length !== 2) throw new Error('Assertion failed: remaining prets should be 2');
if (filtered.encours.length !== 2) throw new Error('Assertion failed: remaining encours should be 2');

// Test 5: checkIsAncienEngagement
console.log('\n--- Test 5: checkIsAncienEngagement classification ---');
// Populate a past period 2023-06
AntiDoublonManager.updateFromAcq('2023-06', ['PAST_OK_001'], [], []);

const ciaMatch = appCode.match(/function checkIsAncienEngagement[\s\S]*?\n    \}/);
const CREATION_DATE_KEYS = ['DATCRE', 'DAT_CRE', 'DATMEP', 'DAT_MEP', 'DATOUV', 'DAT_OUV'];
function extractPeriodFromDate(d) {
    if (!d) return '';
    const m = String(d).match(/(\d{4})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}`;
    const m2 = String(d).match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (m2) return `${m2[3]}-${m2[2]}`;
    return '';
}
eval(ciaMatch[0].replace('function checkIsAncienEngagement', 'global.checkIsAncienEngagement = function'));

const resPast = checkIsAncienEngagement({ REFCONTCMPT: 'PAST_OK_001' }, '2023-08');
console.log('Past contract PAST_OK_001 in 2023-08:', resPast);
if (!resPast.isAncien) throw new Error('Assertion failed: PAST_OK_001 should be classified as ancien');

const resNew = checkIsAncienEngagement({ REFCONTCMPT: 'PTI00000039' }, '2023-08');
console.log('New/rejected contract PTI00000039 in 2023-08:', resNew);
// Test 6: Non-reversibility of Status OK (a contract that is OK CANNOT revert to rejection)
console.log('\n--- Test 6: Non-reversibility of Status OK ---');
console.log('Before rejection test, isContractDeclaredOkInPeriod 0100001000012:', AntiDoublonManager.isContractDeclaredOkInPeriod('2023-08', '0100001000012'));
// Subsequent ACQ receives 0100001000012 in error list
AntiDoublonManager.updateFromAcq('2023-08', [], ['0100001000012'], []);
console.log('After rejection attempt, isContractDeclaredOkInPeriod 0100001000012:', AntiDoublonManager.isContractDeclaredOkInPeriod('2023-08', '0100001000012'));
console.log('After rejection attempt, isContractInErrorInPeriod 0100001000012:', AntiDoublonManager.isContractInErrorInPeriod('2023-08', '0100001000012'));
if (!AntiDoublonManager.isContractDeclaredOkInPeriod('2023-08', '0100001000012')) {
    throw new Error('CRITICAL FAILURE: Contract 0100001000012 was erroneously reverted to rejection!');
}
if (AntiDoublonManager.isContractInErrorInPeriod('2023-08', '0100001000012')) {
    throw new Error('CRITICAL FAILURE: Contract 0100001000012 was added to error list despite being already OK!');
}
console.log('Non-reversibility verified: Contract remained OK and was never downgraded to rejection.');

// Test 7: ClientsRegistryManager period tracking
console.log('\n--- Test 7: ClientsRegistryManager period tracking ---');
const crmMatch = appCode.match(/const ClientsRegistryManager = \{[\s\S]*?\n    \};\n/);
if (!crmMatch) {
    throw new Error('ClientsRegistryManager definition not found in app.js');
}
eval(crmMatch[0].replace('const ClientsRegistryManager =', 'global.ClientsRegistryManager ='));

ClientsRegistryManager.registerFromAcq(['CLI_TEST_001', 'CLI_TEST_002'], '01', 'ACQ_TEST', '2023-08');
console.log('Client CLI_TEST_001 in 2023-08 (expected true):', ClientsRegistryManager.isClientDeclaredOkInPeriod('2023-08', 'CLI_TEST_001'));
console.log('Client CLI_TEST_001 in 2023-09 (expected false):', ClientsRegistryManager.isClientDeclaredOkInPeriod('2023-09', 'CLI_TEST_001'));
console.log('Period 2023-08 clients OK count:', ClientsRegistryManager.getPeriodOkCount('2023-08'));

if (!ClientsRegistryManager.isClientDeclaredOkInPeriod('2023-08', 'CLI_TEST_001')) {
    throw new Error('Assertion failed: CLI_TEST_001 should be OK in 2023-08');
}
if (ClientsRegistryManager.isClientDeclaredOkInPeriod('2023-09', 'CLI_TEST_001')) {
    throw new Error('Assertion failed: CLI_TEST_001 should NOT be OK in 2023-09');
}
if (ClientsRegistryManager.getPeriodOkCount('2023-08') < 2) {
    throw new Error('Assertion failed: Period 2023-08 should have at least 2 OK clients');
}

console.log('\n>>> ALL 7 TESTS PASSED SUCCESSFULLY! <<<');

