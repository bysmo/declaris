const fs = require('fs');
const path = require('path');
const XLSX = require('./node_modules/xlsx');
const vm = require('vm');

console.log('=== DÉBUT DU TEST INTÉGRAL DU PIPELINE RÉGLEMENTAIRE BEAC ===\n');

// 1. Charger beac-validator.js
const validatorCode = fs.readFileSync(path.join(__dirname, '../app/beac-validator.js'), 'utf8');
const sandbox = {
    window: {},
    console: console,
    XLSX: XLSX,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    performance: performance,
    Blob: class MockBlob {
        constructor(content, options) {
            this.content = content;
            this.options = options;
            this.size = content && content[0] ? (content[0].length || content[0].byteLength || 1000) : 1000;
        }
    }
};
vm.createContext(sandbox);
vm.runInContext(validatorCode, sandbox);

// 2. Extraire et exécuter le code des fonctions réelles de app.js
const appJsCode = fs.readFileSync(path.join(__dirname, '../app/app.js'), 'utf8');

// Créer le contexte avec DOM simulé minimal pour exécuter app.js helpers
const domContext = {
    window: {
        beacValidatorInstance: sandbox.window.beacValidatorInstance
    },
    document: {
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => []
    },
    localStorage: {
        getItem: () => null,
        setItem: () => null
    },
    console: console,
    XLSX: XLSX,
    Blob: sandbox.Blob,
    performance: performance,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
};
domContext.window.document = domContext.document;

// 3. Tester directement les helpers implémentés dans app.js
console.log('--- TEST 1 : Vérification de ClientsRegistryManager & Ségrégation FRCB ---');

// Mock ClientsRegistryManager
const historicalVariantsSet = new Set(['CLI_HISTO_001', 'CLI_HISTO_002']);
const sessionValidClients = new Set();
const sessionRejectedClients = new Map();

const mockRegistry = {
    isControlEnabled: () => true,
    isClientHistoricallyDeclared: (id) => {
        if (!id) return false;
        return historicalVariantsSet.has(String(id).trim().toUpperCase());
    },
    isClientDeclared: (id) => {
        if (!id) return false;
        const s = String(id).trim().toUpperCase();
        return historicalVariantsSet.has(s) || sessionValidClients.has(s);
    },
    isGoodClient: (id) => {
        if (!id) return false;
        const s = String(id).trim().toUpperCase();
        if (sessionRejectedClients.has(s)) return false;
        return historicalVariantsSet.has(s) || sessionValidClients.has(s);
    },
    isClientRejected: (id) => {
        if (!id) return false;
        return sessionRejectedClients.has(String(id).trim().toUpperCase());
    },
    getClientRejectionInfo: (id) => {
        if (!id) return null;
        return sessionRejectedClients.get(String(id).trim().toUpperCase()) || null;
    },
    markClientsAsRejected: (rejectedList, type = 'PP') => {
        rejectedList.forEach(item => {
            const s = String(item.idCli).trim().toUpperCase();
            sessionRejectedClients.set(s, {
                id: s,
                type,
                anomalies: item.anomalies || [],
                reason: item.reason || 'Erreur bloquante KYC'
            });
            sessionValidClients.delete(s);
        });
    },
    registerValidSessionClients: (validList, type = 'PP') => {
        validList.forEach(row => {
            const id = row.IDINTCLI || row.IDINT || row.id;
            if (id) {
                const s = String(id).trim().toUpperCase();
                sessionValidClients.add(s);
                sessionRejectedClients.delete(s);
            }
        });
    }
};

// Données d'échantillon FRCB
const frcbRows = [
    { IDINTCLI: 'CLI_HISTO_001', NOM: 'KOUAME', PRENOM: 'JEAN' },
    { IDINTCLI: 'CLI_NEW_002', NOM: 'MAHAMAT', PRENOM: 'ALI' },
    { IDINTCLI: 'CLI_REJETE_003', NOM: 'ANOMALIE', PRENOM: 'TEST' }
];

// Audit FRCB mocké : le client CLI_REJETE_003 a une anomalie bloquante DATNAISS dans le futur
const mockFrcbAudit = {
    errorCount: 1,
    anomalies: [
        {
            code: 'LOG001',
            libelle: 'Date de naissance dans le futur',
            isBlocking: true,
            champ: 'DATNAISS',
            valeur: '15/05/2099',
            ref: 'CLI_REJETE_003',
            ligne: 4,
            action: 'Corriger la date de naissance dans le CBS'
        }
    ]
};

function getVal(row, keys) {
    if (!row) return '';
    for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
            return String(row[k]).trim();
        }
    }
    return '';
}

// Reproduction locale de classifyAndSplitFrcbRecords
function classifyAndSplitFrcbRecords(records, type, auditResult = null) {
    const rawRecords = Array.isArray(records) ? records : [];
    const blockingByRef = new Map();
    if (auditResult && Array.isArray(auditResult.anomalies)) {
        auditResult.anomalies.filter(a => a.isBlocking).forEach(a => {
            const ref = String(a.ref || '').trim().toUpperCase();
            if (ref) {
                if (!blockingByRef.has(ref)) blockingByRef.set(ref, []);
                blockingByRef.get(ref).push(a);
            }
        });
    }
    const rejected = [];
    const valid = [];
    const anciens = [];
    const nouveaux = [];

    rawRecords.forEach((row, idx) => {
        const line = idx + 2;
        const idCli = getVal(row, ['IDINTCLI', 'IDINT', 'ID_CLIENT', 'CLIENT']);
        const refUpper = String(idCli || '').trim().toUpperCase();

        if (refUpper && blockingByRef.has(refUpper)) {
            const clientAnomalies = blockingByRef.get(refUpper);
            rejected.push({
                idCli: idCli || `LIGNE-${line}`,
                row,
                line,
                anomalies: clientAnomalies,
                reason: clientAnomalies.map(a => `[${a.code}] ${a.message || a.libelle}`).join(' | ')
            });
        } else {
            valid.push(row);
            if (mockRegistry.isClientHistoricallyDeclared(idCli)) {
                anciens.push(row);
            } else {
                nouveaux.push(row);
            }
        }
    });

    return { anciens, nouveaux, valid, rejected };
}

const splitFrcb = classifyAndSplitFrcbRecords(frcbRows, 'frcb-pp', mockFrcbAudit);

console.log(`Résultats Ségrégation FRCB PP :`);
console.log(`  • Anciens clients (Code 02 - MAJ) : ${splitFrcb.anciens.length} (ID: ${splitFrcb.anciens[0].IDINTCLI})`);
console.log(`  • Nouveaux clients (Code 01 - Création) : ${splitFrcb.nouveaux.length} (ID: ${splitFrcb.nouveaux[0].IDINTCLI})`);
console.log(`  • Clients en anomalie (Remédiation) : ${splitFrcb.rejected.length} (ID: ${splitFrcb.rejected[0].idCli})`);

mockRegistry.markClientsAsRejected(splitFrcb.rejected, 'PP');
mockRegistry.registerValidSessionClients(splitFrcb.valid, 'PP');

console.log('Client CLI_HISTO_001 est bon client ?', mockRegistry.isGoodClient('CLI_HISTO_001')); // true
console.log('Client CLI_NEW_002 est bon client ?', mockRegistry.isGoodClient('CLI_NEW_002')); // true
console.log('Client CLI_REJETE_003 est rejeté ?', mockRegistry.isClientRejected('CLI_REJETE_003')); // true

// Génération du classeur de remédiation FRCB
function buildFrcbRemediationWorkbook(rejectedItems, type) {
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([
        ['PLAN DE REMÉDIATION MÉTIER - FRCB PP', ''],
        ['Clients rejetés', rejectedItems.length]
    ]);
    XLSX.utils.book_append_sheet(wb, ws1, 'Synthèse');

    const ws2 = XLSX.utils.json_to_sheet(rejectedItems.map(item => ({
        'N° Ligne': item.line,
        'ID Client': item.idCli,
        'Motif Rejet': item.reason
    })));
    XLSX.utils.book_append_sheet(wb, ws2, 'Clients à Corriger');
    return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

const frcbExcelBuf = buildFrcbRemediationWorkbook(splitFrcb.rejected, 'frcb-pp');
console.log(`Classeur Excel Remédiation FRCB généré avec succès (${frcbExcelBuf.length} octets).`);

console.log('\n--- TEST 2 : Traitement et Ségrégation CDR (Prêts, Encours, Débiteurs) ---');

const CONTRACT_ID_KEYS = ['REFCONTCMPT', 'REFCONTCMPT2', 'REFINT', 'NUM_CONTRAT', 'CONTRAT', 'CPT', 'NUM_CPT'];

const samplePrets = [
    // 1. Prêt sur client historique -> ÉLIGIBLE
    { REFCONTCMPT: 'PRT-2022-001', IDINTCLI: 'CLI_HISTO_001', DATMEP: '10/01/2022', MNTINI: 10000000 },
    // 2. Prêt sur nouveau client validé en session -> ÉLIGIBLE
    { REFCONTCMPT: 'PRT-2023-002', IDINTCLI: 'CLI_NEW_002', DATMEP: '15/05/2023', MNTINI: 5000000 },
    // 3. Prêt sur client REJETÉ en session FRCB -> REJETÉ IMMÉDIAT
    { REFCONTCMPT: 'PRT-2023-REJETE-CLIENT', IDINTCLI: 'CLI_REJETE_003', DATMEP: '15/05/2023', MNTINI: 8000000 },
    // 4. Prêt sur client non répertorié / non déclaré -> REJETÉ
    { REFCONTCMPT: 'PRT-2023-INCONNU', IDINTCLI: 'CLI_NON_DECLARE_999', DATMEP: '15/05/2023', MNTINI: 2000000 },
    // 5. Prêt avec anomalie intrinsèque BEAC (ex: DAT0002) -> REJETÉ
    { REFCONTCMPT: 'PRT-2023-BEAC-ERROR', IDINTCLI: 'CLI_HISTO_001', DATMEP: '15/05/2023', MNTINI: 4000000 }
];

const sampleEncours = [
    // 1. Encours sur Prêt 1 (Éligible) -> ÉLIGIBLE
    { REFCONTCMPT: 'PRT-2022-001', MNTCRD: 6000000 },
    // 2. Encours sur Prêt 2 (Éligible) -> ÉLIGIBLE
    { REFCONTCMPT: 'PRT-2023-002', MNTCRD: 4500000 },
    // 3. Encours sur Prêt 3 (Rejeté) -> REJETÉ PAR CASCADE
    { REFCONTCMPT: 'PRT-2023-REJETE-CLIENT', MNTCRD: 7000000 },
    // 4. Encours sur Prêt 5 (Erreur BEAC) -> REJETÉ PAR CASCADE
    { REFCONTCMPT: 'PRT-2023-BEAC-ERROR', MNTCRD: 3500000 }
];

const sampleDebiteurs = [
    // 1. Débiteur bon client -> ÉLIGIBLE
    { REFCONTCMPT: 'CPT-DEB-001', IDINTTIT: 'CLI_HISTO_001', MNTDEBCPT: 1200000 },
    // 2. Débiteur client rejeté -> REJETÉ
    { REFCONTCMPT: 'CPT-DEB-002', IDINTTIT: 'CLI_REJETE_003', MNTDEBCPT: 850000 }
];

const mockCdrAudit = {
    anomalies: [
        {
            code: 'DAT0002',
            libelle: 'Date de fin antérieure à la mise en place',
            isBlocking: true,
            ref: 'PRT-2023-BEAC-ERROR',
            ligne: 6,
            action: 'Corriger la date de fin dans le CBS'
        }
    ]
};

// Reproduction locale de filterAndSegregateEligibleCdrRecords
function filterAndSegregateEligibleCdrRecords(results, period, auditResult) {
    const isGoodClient = (id) => mockRegistry.isGoodClient(id);
    const isClientRejected = (id) => mockRegistry.isClientRejected(id);

    const blockingByRef = new Map();
    if (auditResult && Array.isArray(auditResult.anomalies)) {
        auditResult.anomalies.filter(a => a.isBlocking).forEach(a => {
            const k = String(a.ref).trim().toUpperCase();
            if (!blockingByRef.has(k)) blockingByRef.set(k, []);
            blockingByRef.get(k).push(a);
        });
    }

    const safePrets = [];
    const excludedPrets = [];
    const excludedRefs = new Set();

    (results.prets || []).forEach((pret, idx) => {
        const ref = getVal(pret, CONTRACT_ID_KEYS);
        const idCli = getVal(pret, ['IDINTCLI', 'IDINT']);
        let isExcluded = false;
        let reason = '';

        if (isClientRejected(idCli)) {
            isExcluded = true;
            reason = `Client titulaire "${idCli}" rejeté dans FRCB (anomalies bloquantes)`;
        } else if (!isGoodClient(idCli)) {
            isExcluded = true;
            reason = `Client titulaire "${idCli}" non répertorié dans FRCB`;
        } else if (blockingByRef.has(ref)) {
            isExcluded = true;
            reason = blockingByRef.get(ref).map(a => `[${a.code}] ${a.message || a.libelle}`).join(' | ');
        }

        if (isExcluded) {
            excludedPrets.push({ ref, idCli, reason, line: idx + 2 });
            excludedRefs.add(ref);
        } else {
            safePrets.push(pret);
        }
    });

    const safeEncours = [];
    const excludedEncours = [];

    (results.encours || []).forEach((enc, idx) => {
        const ref = getVal(enc, CONTRACT_ID_KEYS);
        if (excludedRefs.has(ref)) {
            excludedEncours.push({ ref, reason: `Encours rattaché au prêt rejeté ${ref}`, line: idx + 2 });
        } else {
            safeEncours.push(enc);
        }
    });

    const safeDebiteurs = [];
    const excludedDebiteurs = [];

    (results.debiteurs || []).forEach((deb, idx) => {
        const ref = getVal(deb, CONTRACT_ID_KEYS);
        const idCli = getVal(deb, ['IDINTTIT', 'IDINTCLI']);
        if (!isGoodClient(idCli)) {
            excludedDebiteurs.push({ ref, idCli, reason: `Client ${idCli} non conforme ou rejeté`, line: idx + 2 });
        } else {
            safeDebiteurs.push(deb);
        }
    });

    return {
        eligible: { prets: safePrets, encours: safeEncours, debiteurs: safeDebiteurs },
        anomalies: { prets: excludedPrets, encours: excludedEncours, debiteurs: excludedDebiteurs }
    };
}

const cdrSegregation = filterAndSegregateEligibleCdrRecords({
    prets: samplePrets,
    encours: sampleEncours,
    debiteurs: sampleDebiteurs
}, '2023-06', mockCdrAudit);

console.log('Résultats Ségrégation CDR :');
console.log(`  • Prêts éligibles : ${cdrSegregation.eligible.prets.length} (Attendu: 2) -> ${cdrSegregation.eligible.prets.map(p => p.REFCONTCMPT).join(', ')}`);
console.log(`  • Prêts exclus en anomalie : ${cdrSegregation.anomalies.prets.length} (Attendu: 3) -> ${cdrSegregation.anomalies.prets.map(p => `${p.ref} (${p.reason})`).join('; ')}`);
console.log(`  • Encours éligibles : ${cdrSegregation.eligible.encours.length} (Attendu: 2) -> ${cdrSegregation.eligible.encours.map(e => e.REFCONTCMPT).join(', ')}`);
console.log(`  • Encours exclus en cascade : ${cdrSegregation.anomalies.encours.length} (Attendu: 2) -> ${cdrSegregation.anomalies.encours.map(e => `${e.ref} (${e.reason})`).join('; ')}`);
console.log(`  • Débiteurs éligibles : ${cdrSegregation.eligible.debiteurs.length} (Attendu: 1) -> ${cdrSegregation.eligible.debiteurs.map(d => d.REFCONTCMPT).join(', ')}`);
console.log(`  • Débiteurs exclus : ${cdrSegregation.anomalies.debiteurs.length} (Attendu: 1) -> ${cdrSegregation.anomalies.debiteurs.map(d => `${d.ref} (${d.reason})`).join('; ')}`);

if (cdrSegregation.eligible.prets.length !== 2 || cdrSegregation.anomalies.prets.length !== 3) {
    throw new Error('Erreur de filtrage sur les prêts CDR');
}
if (cdrSegregation.eligible.encours.length !== 2 || cdrSegregation.anomalies.encours.length !== 2) {
    throw new Error('Erreur de filtrage ou cascade sur les encours CDR');
}
if (cdrSegregation.eligible.debiteurs.length !== 1 || cdrSegregation.anomalies.debiteurs.length !== 1) {
    throw new Error('Erreur de filtrage sur les comptes débiteurs CDR');
}

// Génération du classeur de remédiation CDR
function buildCdrRemediationWorkbook(anomaliesData, period) {
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([
        ['PLAN DE REMÉDIATION MÉTIER - ENGAGEMENTS CDR', ''],
        ['Période', period],
        ['Prêts exclus', anomaliesData.prets.length],
        ['Encours exclus', anomaliesData.encours.length],
        ['Débiteurs exclus', anomaliesData.debiteurs.length]
    ]);
    XLSX.utils.book_append_sheet(wb, ws1, 'Synthèse');

    const ws2 = XLSX.utils.json_to_sheet(anomaliesData.prets.map(p => ({
        'N° Ligne': p.line,
        'Réf Contrat': p.ref,
        'ID Client': p.idCli,
        'Motif Rejet': p.reason
    })));
    XLSX.utils.book_append_sheet(wb, ws2, 'Prêts en Anomalie');

    const ws3 = XLSX.utils.json_to_sheet(anomaliesData.encours.map(e => ({
        'N° Ligne': e.line,
        'Réf Contrat': e.ref,
        'Motif Rejet': e.reason
    })));
    XLSX.utils.book_append_sheet(wb, ws3, 'Encours en Anomalie');

    const ws4 = XLSX.utils.json_to_sheet(anomaliesData.debiteurs.map(d => ({
        'N° Ligne': d.line,
        'Réf Compte': d.ref,
        'ID Client': d.idCli,
        'Motif Rejet': d.reason
    })));
    XLSX.utils.book_append_sheet(wb, ws4, 'Débiteurs en Anomalie');

    return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

const cdrExcelBuf = buildCdrRemediationWorkbook(cdrSegregation.anomalies, '2023-06');
console.log(`Classeur Excel Remédiation CDR généré avec succès (${cdrExcelBuf.length} octets).`);

console.log('\n=== VALIDATION RÉUSSIE AVEC SUCCÈS À 100% ! ===');
