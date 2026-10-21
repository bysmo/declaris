const fs = require('fs');
const path = require('path');
const XLSX = require('./node_modules/xlsx');
const vm = require('vm');

console.log('=== TEST DE VALIDATION DES GÉNÉRATIONS XML CONFORMES (PP, PM, CDR) ===\n');

// 1. Charger beac-validator.js
const validatorCode = fs.readFileSync(path.join(__dirname, '../app/beac-validator.js'), 'utf8');
const appJsCode = fs.readFileSync(path.join(__dirname, '../app/app.js'), 'utf8');

const createMockElement = (id) => ({
    id: id || '',
    style: {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    textContent: '',
    value: '',
    appendChild: () => {},
    removeChild: () => {},
    addEventListener: () => {},
    querySelector: () => ({ addEventListener: () => {} }),
    querySelectorAll: () => [],
    scrollHeight: 100,
    scrollTop: 0
});

const mockElements = {
    'cdr-client-filter-enabled': { checked: false, addEventListener: () => {} },
    'cdr-anti-doublon-enabled': { checked: true, addEventListener: () => {} },
    'modal-cdr-dual-result': createMockElement('modal-cdr-dual-result'),
    'modal-frcb-dual-result': createMockElement('modal-frcb-dual-result'),
    'card-cdr-result-02': createMockElement('card-cdr-result-02'),
    'card-cdr-result-01': createMockElement('card-cdr-result-01'),
    'card-cdr-result-anomalies': createMockElement('card-cdr-result-anomalies'),
    'card-frcb-result-02': createMockElement('card-frcb-result-02'),
    'card-frcb-result-01': createMockElement('card-frcb-result-01'),
    'card-frcb-result-anomalies': createMockElement('card-frcb-result-anomalies'),
    'log-terminal': createMockElement('log-terminal')
};

const domDoc = {
    addEventListener: (event, fn) => {
        if (event === 'DOMContentLoaded') {
            try { fn(); } catch(e) { console.error('DOMContentLoaded error:', e); }
        }
    },
    removeEventListener: () => {},
    getElementById: (id) => mockElements[id] || createMockElement(id),
    querySelector: (sel) => {
        if (sel === '.field-num-dec') return { value: '0001', addEventListener: () => {} };
        if (sel === '.field-code-pays') return { value: 'TD', addEventListener: () => {} };
        if (sel === '.field-code-banque') return { value: '60002', addEventListener: () => {} };
        if (sel === '.field-periode') return { value: '2024-02', addEventListener: () => {} };
        if (sel === '.field-nat-dec') return { value: '01', addEventListener: () => {} };
        return { value: '', style: {}, classList: { add: () => {}, remove: () => {} }, addEventListener: () => {} };
    },
    querySelectorAll: () => [],
    body: { classList: { add: () => {}, remove: () => {} }, appendChild: () => {}, removeChild: () => {} },
    createElement: () => createMockElement('dyn-el')
};

const context = {
    window: {},
    document: domDoc,
    localStorage: {
        _store: {},
        getItem: function(k) { return this._store[k] || null; },
        setItem: function(k, v) { this._store[k] = v; }
    },
    console: console,
    XLSX: XLSX,
    Blob: class MockBlob {
        constructor(content, options) {
            this.content = Array.isArray(content) ? content.join('') : String(content);
            this.options = options;
            this.size = Buffer.byteLength(this.content, 'utf8');
        }
    },
    performance: performance,
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: clearTimeout
};
context.window.document = domDoc;
context.window.URL = {
    createObjectURL: () => 'blob:mock',
    revokeObjectURL: () => {}
};

vm.createContext(context);
vm.runInContext(validatorCode, context);
vm.runInContext(appJsCode, context);

const App = context.window.DeclarisApp;
if (!App) {
    console.error('CRITIQUE: window.DeclarisApp non disponible !');
    process.exit(1);
}

console.log('Environnement Déclaris et modules réglementaires initialisés avec succès.');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        console.log(`  ✓ ${message}`);
        passedTests++;
    } else {
        console.error(`  ✗ ÉCHEC: ${message}`);
    }
}

// ==========================================
// TEST 1 : GÉNÉRATION PP (Personnes Physiques)
// ==========================================
console.log('\n--- 1. TEST GÉNÉRATION PP (avec données incomplètes) ---');
const rawPpRecords = [
    {
        IDINTCLI: 'CLI_PP_001',
        NOM: 'MAHAMAT',
        PRENOM: 'AHMAT',
        // Pas de DATNAI, pas de PRENAI, pas de AGEECO, pas de SEXE
        ADRESSE: 'RUE DE 40M NDJAMENA',
        TYPPIECE: '01',
        NUMPIECE: 'NN12345678'
    },
    {
        IDINTCLI: 'CLI_PP_002',
        NOM: 'KOUAM',
        PRENOM: 'JEAN',
        SEXE: 'F',
        DATNAI: '15/06/1985',
        AGEECO: '1100',
        STATUT: '00'
    }
];

const ppSanitized = rawPpRecords.map((r, i) => App.autoSanitizeFrcbSingleRecord(r, 'frcb-pp', i, { decDate: '15022024', codePays: 'TD' }));

assert(ppSanitized[0].SEXE === 'M', 'PP001 Sexe auto-complété avec "M"');
assert(ppSanitized[0].DATNAI === '01011980', 'PP001 DatNai auto-complétée au format JJMMAAAA ("01011980")');
assert(ppSanitized[0].PRENAI === '01', 'PP001 PreNai auto-complétée ("01")');
assert(ppSanitized[0].AGEECO === '1100', 'PP001 AgeEco auto-complétée ("1100")');

const ppXml = App.generateFRCB(ppSanitized, 'frcb-pp', {
    natDec: '01',
    numDec: '0001',
    codePays: 'TD',
    codeBanque: '60002',
    decDate: '15022024'
});

assert(ppXml.includes('NumDec="0001" CodPay="TD" CodDec="60002" TypDec="01" NatDec="01"'), 'Entête XML PP conforme BEAC');
assert(ppXml.includes('<PersonnePhysique'), 'Présence de balise <PersonnePhysique>');
assert(ppXml.includes('IdIntCli="CLI_PP_001"'), 'IdIntCli préservé pour PP001');
assert(ppXml.includes('DatNai="01011980"'), 'Attribut DatNai présent et 8 chiffres');
assert(ppXml.includes('Sexe="M"'), 'Attribut Sexe="M" présent');
assert(ppXml.includes('PreNai="01"'), 'Attribut PreNai="01" présent');
assert(ppXml.includes('AgeEco="1100"'), 'Attribut AgeEco="1100" présent');
assert(!ppXml.includes('undefined'), 'Aucun "undefined" dans le XML PP');

// ==========================================
// TEST 2 : GÉNÉRATION PM (Personnes Morales)
// ==========================================
console.log('\n--- 2. TEST GÉNÉRATION PM (avec données incomplètes) ---');
const rawPmRecords = [
    {
        IDINTCLI: 'CLI_PM_100',
        RAISOC: 'SOCIETE COMMERCIALE DU TCHAD SARL',
        SIGLE: 'SCT',
        // Pas de FORJURID, pas de AGEECO, pas de STATUT, pas de DATCRE
        RCCM: 'RC/NDJ/2018/B/1234',
        ADRESSE: 'AVENUE CHARLES DE GAULLE'
    }
];

const pmSanitized = rawPmRecords.map((r, i) => App.autoSanitizeFrcbSingleRecord(r, 'frcb-pm', i, { decDate: '15022024', codePays: 'TD' }));

assert(pmSanitized[0].FORJURID === '01', 'PM100 FormJur auto-complétée avec "01"');
assert(pmSanitized[0].AGEECO === '1061', 'PM100 AgeEco auto-complétée avec "1061"');
assert(pmSanitized[0].DATCRE === '01012010', 'PM100 DatCre auto-complétée avec "01012010"');

const pmXml = App.generateFRCB(pmSanitized, 'frcb-pm', {
    natDec: '01',
    numDec: '0002',
    codePays: 'TD',
    codeBanque: '60002',
    decDate: '15022024'
});

assert(pmXml.includes('NumDec="0002" CodPay="TD" CodDec="60002" TypDec="02" NatDec="01"'), 'Entête XML PM conforme BEAC');
assert(pmXml.includes('<PersonneMorale'), 'Présence de balise <PersonneMorale>');
assert(pmXml.includes('IdIntCli="CLI_PM_100"'), 'IdIntCli préservé pour PM100');
assert(pmXml.includes('ForJurid="01"'), 'ForJurid="01" présente');
assert(pmXml.includes('AgeEco="1061"'), 'AgeEco="1061" présente');
assert(!pmXml.includes('undefined'), 'Aucun "undefined" dans le XML PM');

// ==========================================
// TEST 3 : SÉGRÉGATION & GÉNÉRATION CDR (avec clients inconnus)
// ==========================================
console.log('\n--- 3. TEST CDR (avec clients non répertoriés dans la base historique) ---');
const rawCdrRecords = {
    prets: [
        {
            REFINT: 'PRET_001',
            REFCONTCMPT: 'CDT0000100',
            IDINT: 'CLI_NEW_999', // Client non déclaré
            TYPENG: '01',
            NATENG: '09',
            MNTENG: '50000000',
            MNTCRD: '40000000',
            DATDEB: '01012023',
            DATFIN: '31122025'
        }
    ],
    encours: [
        {
            REFINT: 'PRET_001',
            REFCONTCMPT: 'CDT0000100',
            MNTCRD: '10000000',
            DATPAI: '25012024',
            DATECH: '25012024'
        }
    ],
    debiteurs: [
        {
            REFINT: 'DEB_001',
            REFCONTCMPT: 'CPT0000200',
            IDINTTIT: 'CLI_NEW_999',
            SOLDEB: '2500000'
        }
    ]
};

// Tester filterAndSegregateEligibleCdrRecords
const segResult = App.filterAndSegregateEligibleCdrRecords(rawCdrRecords, '2024-02');
assert(segResult.eligible.prets.length === 1, 'Pret conservé dans les éligibles (filtre client inactif par défaut)');
assert(segResult.eligible.encours.length === 1, 'Encours conservé dans les éligibles');
assert(segResult.eligible.debiteurs.length === 1, 'Débiteur conservé dans les éligibles');

// Tester génération XML CDR Blob
const cdrBlob = App.generateUnifiedCDRXmlBlob(segResult.eligible, {
    natDec: '01',
    numDec: '0001',
    codePays: 'TD',
    codeBanque: '60002',
    decDate: new Date(2024, 1, 15),
    arrDate: new Date(2024, 1, 29)
});

assert(cdrBlob && cdrBlob.size > 0, `CDR XML Blob généré avec succès (${cdrBlob.size} octets)`);
assert(cdrBlob.content.includes('NumDec="0001" CodPay="TD" CodDec="60002" TypDec="51" NatDec="01"'), 'Entête XML CDR conforme');
assert(cdrBlob.content.includes('<Engagement'), 'Balise <Engagement> présente');
assert(cdrBlob.content.includes('RefContCmpt="CDT0000100"'), 'RefContCmpt présente');
assert(cdrBlob.content.includes('<TitulaireEngagement IdInt="CLI_NEW_999"/>'), 'TitulaireEngagement valide');
assert(cdrBlob.content.includes('<Encours'), 'Balise <Encours> présente');
assert(cdrBlob.content.includes('<CompteDebiteur'), 'Balise <CompteDebiteur> présente');
assert(cdrBlob.content.includes('<TitulaireCompte IdInt="CLI_NEW_999"'), 'TitulaireCompte valide');
assert(!cdrBlob.content.includes('undefined'), 'Aucun "undefined" dans le XML CDR');

// ==========================================
// TEST 4 : COMPORTEMENT MODALE DE RÉSULTAT
// ==========================================
console.log('\n--- 4. TEST DES MODALES DE RÉSULTAT (Affichage des cartes XML garanti) ---');
const dummyFiles = [
    {
        code: '01',
        filename: 'TD-60002-0001-15022024-51-DEC.xml',
        numDec: '0001',
        blob: cdrBlob,
        pretsCount: 1,
        encoursCount: 1,
        debiteursCount: 1,
        sizeMb: '0.01'
    }
];

App.promptCdrDualResultModal(dummyFiles, '2024-02', { totalCount: 10, filename: 'ANOMALIES.xlsx' });
assert(mockElements['card-cdr-result-01'].style.display === 'block', 'Carte Fichier 01 affichée dans la modale CDR');
assert(mockElements['card-cdr-result-anomalies'].style.display === 'block', 'Carte Fichier Anomalies affichée conjointement');

console.log(`\nRÉSULTAT DES TESTS : ${passedTests} / ${totalTests} réussis.`);
if (passedTests === totalTests) {
    console.log('\n=============================================');
    console.log('✓ TOUS LES TESTS SONT VALIDES À 100% !');
    console.log('=============================================\n');
    process.exit(0);
} else {
    process.exit(1);
}
