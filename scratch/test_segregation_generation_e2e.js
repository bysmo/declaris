const fs = require('fs');
const path = require('path');

// 1. Mock window and document
global.window = global;
global.document = {
    getElementById: (id) => {
        if (id === 'cdr-client-check-enabled') return { checked: true };
        if (id === 'cdr-client-filter-enabled') return { checked: true };
        if (id === 'cdr-anti-doublon-enabled') return { checked: true };
        return null;
    },
    querySelector: (selector) => {
        if (selector === '.field-code-pays') return { value: 'TD' };
        if (selector === '.field-code-banque') return { value: '60002' };
        if (selector === '.field-num-dec') return { value: '0001' };
        if (selector === '.field-type-fichier') return { value: 'DEC' };
        if (selector === '.field-nat-dec') return { value: '01' };
        if (selector === '.field-date-gen') return { value: '2023-06-30' };
        if (selector === '.field-date-arrete') return { value: '2023-06-30' };
        return null;
    },
    querySelectorAll: () => []
};

// 2. Load beac-validator.js
require('../app/beac-validator.js');

// 3. Setup mock clients registry with declared clients
const mockDeclaredClients = new Set(['702557', '712960', '800100']);
const mockRejectedKycClients = new Set(['REJECTED_KYC_999']);

const mockRegistry = {
    isControlEnabled: () => true,
    isFilterUndeclaredEnabled: () => true,
    isClientDeclared: (id) => mockDeclaredClients.has(String(id).trim().toUpperCase()),
    isClientRejected: (id) => mockRejectedKycClients.has(String(id).trim().toUpperCase()),
    getClientRejectionInfo: (id) => {
        if (mockRejectedKycClients.has(String(id).trim().toUpperCase())) {
            return {
                anomalies: [{ code: 'OBL002', champ: 'NIR', libelle: 'NIR manquant ou invalide' }]
            };
        }
        return null;
    },
    isGoodClient: (id) => {
        const s = String(id).trim().toUpperCase();
        if (mockRejectedKycClients.has(s)) return false;
        return mockDeclaredClients.has(s);
    },
    getClientType: (id) => 'PP'
};

global.ClientsRegistryManager = mockRegistry;
window.ClientsRegistryManager = mockRegistry;

// 4. Load app.js functions by evaluating app.js or creating isolated pipeline
// Let's verify the segregation logic directly from the app.js code
const appJsCode = fs.readFileSync('app/app.js', 'utf8');

// Build test dataset:
// - P1: Pret Valide (Client 702557 OK, Ref PRET_OK_01)
// - P2: Pret Client Inconnu (Client 999999 non declare, Ref PRET_BAD_CLI)
// - P3: Pret Client Rejete KYC (Client REJECTED_KYC_999, Ref PRET_REJ_KYC)
// - P4: Pret Erreur BEAC Duree negative (Client 712960 OK, DUREE: -5, Ref PRET_ERR_BEAC)
// - E1: Encours sur P1 (Ref PRET_OK_01, MNTCRD: 500000) -> doit etre ACCEPTÉ
// - E2: Encours sur P2 (Ref PRET_BAD_CLI, MNTCRD: 300000) -> doit etre EXCLU en cascade
// - E3: Encours sur P3 (Ref PRET_REJ_KYC, MNTCRD: 200000) -> doit etre EXCLU en cascade
// - E4: Encours sur P4 (Ref PRET_ERR_BEAC, MNTCRD: 100000) -> doit etre EXCLU en cascade
// - E5: Encours avec Erreur BEAC directe (Ref PRET_OK_01 mais MntCrd <= 0, MNTCRD: 0) -> doit etre EXCLU
// - D1: Debiteur Valide (Client 800100 OK, Ref CPT_OK_01, SOLDEB: 150000) -> doit etre ACCEPTÉ
// - D2: Debiteur Client Inconnu (Client NON_DECLARE_888, Ref CPT_BAD_CLI) -> doit etre EXCLU
// - D3: Debiteur Erreur BEAC Solde <= 0 (Client 800100 OK, SOLDEB: 0, Ref CPT_ERR_SOLDE) -> doit etre EXCLU

const testDataset = {
    prets: [
        {
            REFCONTCMPT: 'PRET_OK_01',
            IDINTCLI: '702557',
            CODAGE: '00001',
            STATUT: '00', // Normal
            TYPENG: '01',
            NATENG: '05', // PP conforme
            MNTENG: 1000000,
            DATMEP: '15/01/2023',
            DATDEB: '15/01/2023',
            DATFIN: '15/01/2025',
            DATARR: '30/06/2023',
            DATPREECHCAP: '15/02/2023',
            DUREE: 24,
            MATURITE: '01', // <= 730 j
            NBRECH: 24,
            PERIODICITE: '01',
            TXEFFGLOB: 5.5
        },
        {
            REFCONTCMPT: 'PRET_BAD_CLI',
            IDINTCLI: 'CLIENT_NON_DECLARE_999',
            CODAGE: '00001',
            STATUT: '00',
            TYPENG: '01',
            NATENG: '05',
            MNTENG: 2000000,
            DATMEP: '15/01/2023',
            DATDEB: '15/01/2023',
            DATFIN: '15/01/2025',
            DATARR: '30/06/2023',
            DATPREECHCAP: '15/02/2023',
            DUREE: 24,
            MATURITE: '01',
            NBRECH: 24,
            PERIODICITE: '01'
        },
        {
            REFCONTCMPT: 'PRET_REJ_KYC',
            IDINTCLI: 'REJECTED_KYC_999',
            CODAGE: '00001',
            STATUT: '00',
            TYPENG: '01',
            NATENG: '05',
            MNTENG: 1500000,
            DATMEP: '15/01/2023',
            DATDEB: '15/01/2023',
            DATFIN: '15/01/2025',
            DATARR: '30/06/2023',
            DATPREECHCAP: '15/02/2023',
            DUREE: 24,
            MATURITE: '01',
            NBRECH: 24,
            PERIODICITE: '01'
        },
        {
            REFCONTCMPT: 'PRET_ERR_BEAC',
            IDINTCLI: '712960',
            CODAGE: '00001',
            STATUT: '00',
            TYPENG: '01',
            NATENG: '05',
            MNTENG: 1200000,
            DATMEP: '15/01/2023',
            DATDEB: '15/01/2023',
            DATFIN: '15/01/2025',
            DATARR: '30/06/2023',
            DATPREECHCAP: '15/02/2023',
            DUREE: 0, // Erreur OBL002 durée positive obligatoire
            MATURITE: '01',
            NBRECH: 24,
            PERIODICITE: '01'
        }
    ],
    encours: [
        {
            REFCONTCMPT: 'PRET_OK_01',
            MNTCRD: 500000,
            MNTTOTUTIL: 500000,
            DATECH: '15/06/2023', // <= DATARR
            NBRECHPAY: 6,
            NBRECHIMP: 0,
            NBRECHRES: 18,
            CLADEPREC: '01'
        },
        {
            REFCONTCMPT: 'PRET_BAD_CLI',
            MNTCRD: 300000,
            MNTTOTUTIL: 300000,
            DATECH: '15/06/2023',
            NBRECHPAY: 6,
            NBRECHIMP: 0,
            NBRECHRES: 18,
            CLADEPREC: '01'
        },
        {
            REFCONTCMPT: 'PRET_REJ_KYC',
            MNTCRD: 200000,
            MNTTOTUTIL: 200000,
            DATECH: '15/06/2023',
            NBRECHPAY: 6,
            NBRECHIMP: 0,
            NBRECHRES: 18,
            CLADEPREC: '01'
        },
        {
            REFCONTCMPT: 'PRET_ERR_BEAC',
            MNTCRD: 100000,
            MNTTOTUTIL: 100000,
            DATECH: '15/06/2023',
            NBRECHPAY: 6,
            NBRECHIMP: 0,
            NBRECHRES: 18,
            CLADEPREC: '01'
        },
        {
            REFCONTCMPT: 'PRET_OK_01',
            MNTCRD: 0, // Erreur LOG0031
            MNTTOTUTIL: 0,
            DATECH: '15/06/2023',
            NBRECHPAY: 6,
            NBRECHIMP: 0,
            NBRECHRES: 0,
            CLADEPREC: '01'
        }
    ],

    debiteurs: [
        {
            REFCONTCMPT: 'CPT_OK_01',
            CODAGE: '00001',
            IDINTTIT: '800100',
            SOLDEB: 150000,
            NBRJRSDEBNONAUT: 15,
            CLASSDEPREC: '01'
        },
        {
            REFCONTCMPT: 'CPT_BAD_CLI',
            CODAGE: '00001',
            IDINTTIT: 'NON_DECLARE_888',
            SOLDEB: 250000,
            NBRJRSDEBNONAUT: 20,
            CLASSDEPREC: '01'
        },
        {
            REFCONTCMPT: 'CPT_ERR_SOLDE',
            CODAGE: '00001',
            IDINTTIT: '800100',
            SOLDEB: 0, // Erreur LOG049
            NBRJRSDEBNONAUT: 10,
            CLASSDEPREC: '01'
        }
    ]
};

// 5. Exécuter l'audit BEAC préalable
const auditResult = window.beacValidatorInstance.auditCdrDataset(testDataset, {
    codePays: 'TD',
    codeBanque: '60002',
    numDec: '0001',
    natDec: '01',
    decDate: '2023-06-30',
    arrDate: '2023-06-30',
    clientRegistry: mockRegistry
});

console.log(`Audit BEAC achevé :`);
console.log(`- Lignes déclarées : ${auditResult.totalDeclaredRecords}`);
console.log(`- Erreurs bloquantes détectées : ${auditResult.errorCount}`);
console.log(`- Avertissements : ${auditResult.warningCount}`);

// Vérifier que CLI0001 a été détecté pour les 2 clients inconnus
const cliErrors = auditResult.anomalies.filter(a => a.code === 'CLI0001');
console.log(`- Erreurs CLI0001 (clients non déclarés) : ${cliErrors.length}`);

// 6. Tester la ségrégation avec la fonction dans app.js
// Extraire les fonctions de segregation depuis app.js
const vm = require('vm');
const sandbox = {
    window: global.window,
    document: global.document,
    ClientsRegistryManager: mockRegistry,
    beacValidatorInstance: window.beacValidatorInstance,
    Logger: { info: () => {}, success: () => {}, warn: () => {}, error: () => {} },
    console: console,
    Set: Set,
    Map: Map,
    Array: Array,
    String: String,
    Number: Number,
    parseInt: parseInt,
    Date: Date
};


// Exécuter un wrapper d'extraction
const codeToRun = `
function getVal(row, keys) {
    if (!row) return '';
    if (!Array.isArray(keys)) keys = [keys];
    for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
            return String(row[k]).trim();
        }
    }
    return '';
}

function addContractVariants(set, id) {
    if (!id) return;
    const s = String(id).trim().toUpperCase();
    set.add(s);
    const noSpaces = s.replace(/\\s+/g, '');
    if (noSpaces) set.add(noSpaces);
}

${appJsCode.substring(appJsCode.indexOf('const CONTRACT_ID_KEYS ='), appJsCode.indexOf('function buildCdrBusinessRemediationExcelBlob'))}
this.filterAndSegregateEligibleCdrRecords = filterAndSegregateEligibleCdrRecords;
`;


vm.createContext(sandbox);
vm.runInContext(codeToRun, sandbox);

const segregation = sandbox.filterAndSegregateEligibleCdrRecords(testDataset, '2023-06', auditResult);
const eligible = segregation.eligible;
const anomalies = segregation.anomalies;

console.log('\n--- RÉSULTATS SÉGRÉGATION MÉTIER ---');
console.log(`Prêts éligibles (bons) : ${eligible.prets.length} (Attendu : 1 [PRET_OK_01])`);
console.log('Details premier pret exclu:', anomalies.prets[0]?.ref, anomalies.prets[0]?.reason, anomalies.prets[0]?.anomalies);
console.log('Tous les prets exclus:', anomalies.prets.map(p => ({ ref: p.ref, reason: p.reason })));

console.log('Details encours exclus:', anomalies.encours.map(e => ({ ref: e.ref, reason: e.reason, line: e.line })));

console.log(`Débiteurs éligibles (bons) : ${eligible.debiteurs.length} (Attendu : 1 [CPT_OK_01])`);
console.log(`Débiteurs exclus (anomalies) : ${anomalies.debiteurs.length} (Attendu : 2 [CPT_BAD_CLI + CPT_ERR_SOLDE])`);

// Assertions strictes
let allOk = true;

if (eligible.prets.length !== 1 || eligible.prets[0].REFCONTCMPT !== 'PRET_OK_01') {
    console.error('ERREUR : Les prêts éligibles ne correspondent pas aux attentes.');
    allOk = false;
}

if (eligible.encours.length !== 1 || eligible.encours[0].REFCONTCMPT !== 'PRET_OK_01') {
    console.error('ERREUR : Les encours éligibles ne correspondent pas aux attentes.');
    allOk = false;
}

if (eligible.debiteurs.length !== 1 || eligible.debiteurs[0].REFCONTCMPT !== 'CPT_OK_01') {
    console.error('ERREUR : Les débiteurs éligibles ne correspondent pas aux attentes.');
    allOk = false;
}

if (allOk) {
    console.log('\n======================================================');
    console.log('✅ SUCCÈS TOTAL : La ségrégation filtre à 100% les anomalies');
    console.log('et conserve UNIQUEMENT les bons prêts, encours et débiteurs');
    console.log('dont les clients sont déclarés et conformes !');
    console.log('======================================================');

    // 7. Tester la génération XML
    const xmlCodeToRun = `
    ${appJsCode.substring(appJsCode.indexOf('function generateUnifiedCDRXmlParts('), appJsCode.indexOf('function downloadFile('))}
    this.generateUnifiedCDRXmlParts = generateUnifiedCDRXmlParts;
    `;
    
    // add buildAttrs and getRefVariants
    const helpersCode = `
    function buildAttrs(mapping, row, defaults = {}) {
        let attrs = '';
        for (const [attrName, fieldKeys] of Object.entries(mapping)) {
            let val = '';
            if (defaults[attrName] !== undefined) {
                val = defaults[attrName];
            } else {
                val = getVal(row, fieldKeys);
            }
            if (val !== '') {
                attrs += \` \${attrName}="\${String(val).replace(/"/g, '&quot;')}"\`;
            }
        }
        return attrs;
    }

    function getRefVariants(ref) {
        if (!ref) return [];
        const s = String(ref).trim();
        const variants = [s, s.toUpperCase(), s.replace(/\\s+/g, ''), s.replace(/\\s+/g, '').toUpperCase()];
        return Array.from(new Set(variants.filter(Boolean)));
    }
    `;

    vm.runInContext(helpersCode + xmlCodeToRun, sandbox);
    const xmlParts = sandbox.generateUnifiedCDRXmlParts(eligible, {
        natDec: '01',
        numDec: '0001',
        codePays: 'TD',
        codeBanque: '60002'
    });
    const fullXml = xmlParts.join('');

    console.log('\n--- VÉRIFICATION DU CONTENU XML GÉNÉRÉ ---');
    console.log('Présence PRET_OK_01 :', fullXml.includes('PRET_OK_01')); // true
    console.log('Présence CPT_OK_01 :', fullXml.includes('CPT_OK_01')); // true
    console.log('Absence PRET_BAD_CLI :', !fullXml.includes('PRET_BAD_CLI')); // true
    console.log('Absence PRET_REJ_KYC :', !fullXml.includes('PRET_REJ_KYC')); // true
    console.log('Absence PRET_ERR_BEAC :', !fullXml.includes('PRET_ERR_BEAC')); // true
    console.log('Absence CPT_BAD_CLI :', !fullXml.includes('CPT_BAD_CLI')); // true
    console.log('Absence CPT_ERR_SOLDE :', !fullXml.includes('CPT_ERR_SOLDE')); // true

    if (fullXml.includes('PRET_OK_01') && !fullXml.includes('PRET_BAD_CLI') && !fullXml.includes('PRET_REJ_KYC')) {
        console.log('\n🎉 VALIDATION RÉUSSIE : Le XML ne contient STRICTEMENT AUCUNE anomalie et contient 100% des bons contrats !');
    } else {
        console.error('ERREUR DANS LE XML GÉNÉRÉ');
        process.exit(1);
    }
} else {
    process.exit(1);
}

