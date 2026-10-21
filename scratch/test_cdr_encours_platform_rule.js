const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 1. Mock browser globals
const sandbox = {
    console,
    Set,
    Map,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Date,
    RegExp,
    Math,
    parseInt,
    parseFloat,
    isNaN,
    setTimeout,
    clearTimeout
};

sandbox.window = sandbox;
sandbox.global = sandbox;
sandbox.document = {
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
        if (selector === '.field-date-gen') return { value: '2023-08-31' };
        if (selector === '.field-date-arrete') return { value: '2023-08-31' };
        return null;
    },
    querySelectorAll: () => [],
    addEventListener: () => {}
};

sandbox.Logger = {
    info: console.log,
    step: console.log,
    warn: console.warn,
    success: console.log,
    error: console.error
};

sandbox.AppNotify = {
    info: () => {},
    warn: () => {},
    success: () => {},
    error: () => {}
};

sandbox.ClientsRegistryManager = {
    isControlEnabled: () => true,
    isFilterUndeclaredEnabled: () => true,
    isClientDeclared: (id) => true,
    isClientRejected: (id) => false,
    getClientRejectionInfo: () => null,
    isGoodClient: (id) => true,
    getClientType: () => 'PP'
};

// 2. Load beac-validator.js into sandbox
const beacCode = fs.readFileSync(path.join(__dirname, '../app/beac-validator.js'), 'utf8');
vm.createContext(sandbox);
vm.runInContext(beacCode, sandbox);

// 3. Extract AntiDoublonManager and CDR functions from app/app.js
const appJsCode = fs.readFileSync(path.join(__dirname, '../app/app.js'), 'utf8');

const snipXml = `
${appJsCode.substring(appJsCode.indexOf('function getRefVariants('), appJsCode.indexOf('function initInputs() {'))}
window.generateUnifiedCDRXml = generateUnifiedCDRXml;
`;
vm.runInContext(snipXml, sandbox);

const snipVariants = `
${appJsCode.substring(appJsCode.indexOf('function addContractVariants('), appJsCode.indexOf('const DeclarisStorage ='))}
window.addContractVariants = addContractVariants;
`;
vm.runInContext(snipVariants, sandbox);

const snipAdm = `
${appJsCode.substring(appJsCode.indexOf('const AntiDoublonManager = {'), appJsCode.indexOf('const ClientsRegistryManager = {'))}
window.AntiDoublonManager = AntiDoublonManager;
`;
vm.runInContext(snipAdm, sandbox);

const snipSeg = `
${appJsCode.substring(appJsCode.indexOf('function filterAndSegregateEligibleCdrRecords('), appJsCode.indexOf('function buildCdrBusinessRemediationExcelBlob'))}
window.filterAndSegregateEligibleCdrRecords = filterAndSegregateEligibleCdrRecords;
`;
vm.runInContext(snipSeg, sandbox);

const snipClassify = `
${appJsCode.substring(appJsCode.indexOf('const CREATION_DATE_KEYS = ['), appJsCode.indexOf('function promptCdrDualResultModal('))}
window.checkIsAncienEngagement = checkIsAncienEngagement;
window.classifyAndSplitCdrResults = classifyAndSplitCdrResults;
`;
vm.runInContext(snipClassify, sandbox);

const snipDup = `
${appJsCode.substring(appJsCode.indexOf('function checkCdrDuplicates('), appJsCode.indexOf('function promptDoublonsModal('))}
window.checkCdrDuplicates = checkCdrDuplicates;
window.filterCdrDuplicates = filterCdrDuplicates;
`;
vm.runInContext(snipDup, sandbox);

async function run() {
    console.log('=== TEST REGLES METIER BEAC : ENCOURS SUR CONTRATS EXISTANTS PLATEFORME ===\n');

    // Charger le CSV des contrats déclarés
    const csvContent = fs.readFileSync(path.join(__dirname, '../contrats_et_id_declares.csv'), 'utf8');
    const lines = csvContent.split(/\r?\n/);
    console.log(`Chargement de ${lines.length.toLocaleString('fr-FR')} lignes de contrats déclarés historiques...`);

    const adm = sandbox.AntiDoublonManager;
    adm.registry = adm.registryOk;
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(';');
        if (parts.length >= 7) {
            const id = parts[0]?.trim();
            const statut = parts[3]?.trim();
            const statutLib = parts[4]?.trim().toUpperCase();
            const mAnnee = adm.normalizePeriod(parts[6]?.trim() || parts[5]?.trim()) || '2023-06';
            if (id) {
                sandbox.addContractVariants(adm.allDeclaredVariantsSet, id);
                if (statut === '01' || statutLib === 'VALIDE') {
                    const okSet = adm.getPeriodOkSet(mAnnee);
                    sandbox.addContractVariants(okSet, id);
                    sandbox.addContractVariants(adm.allOkVariantsSet, id);
                    adm.getPeriodBaseOkSet(mAnnee).add(id.toUpperCase());
                } else if (statut === '02' || statutLib === 'ANOMALIE') {
                    const koSet = adm.getPeriodKoSet(mAnnee);
                    sandbox.addContractVariants(koSet, id);
                }
            }
        }
    }
    console.log(`Variantes OK indexées dans AntiDoublonManager : ${adm.allOkVariantsSet.size.toLocaleString('fr-FR')}\n`);

    // 1. Tests unitaires de reconnaissance des statuts de contrats sur la plateforme
    console.log('1. Tests unitaires AntiDoublonManager :');
    const knownOkRef = '0100001000012'; // Statut 01 dans contrats_et_id_declares.csv (période 2023-06)
    const knownKoRef = 'CI000000009';   // Statut 02 dans contrats_et_id_declares.csv
    const unknownRef = 'CONTRAT_INCONNU_99999';

    console.log(`   - Contrat validé OK historique "${knownOkRef}" (période courante 2023-06) : isContractOkOnPlatform = ${adm.isContractOkOnPlatform(knownOkRef, '2023-06')}`);
    console.log(`   - Contrat validé OK historique "${knownOkRef}" (période ultérieure 2023-08) : isContractOkOnPlatform = ${adm.isContractOkOnPlatform(knownOkRef, '2023-08')}`);
    console.log(`   - Contrat rejeté historique "${knownKoRef}" : isContractOkOnPlatform = ${adm.isContractOkOnPlatform(knownKoRef, '2023-06')}`);
    console.log(`   - Contrat inconnu "${unknownRef}" : isContractOkOnPlatform = ${adm.isContractOkOnPlatform(unknownRef, '2023-06')}`);

    if (!adm.isContractOkOnPlatform(knownOkRef, '2023-06')) throw new Error('Échec: Contrat OK non reconnu en 2023-06');
    if (!adm.isContractOkOnPlatform(knownOkRef, '2023-08')) throw new Error('Échec: Contrat OK non reconnu en 2023-08');
    if (adm.isContractOkOnPlatform(knownKoRef, '2023-06')) throw new Error('Échec: Contrat rejeté reconnu à tort comme OK');
    if (adm.isContractOkOnPlatform(unknownRef, '2023-06')) throw new Error('Échec: Contrat inconnu reconnu à tort comme OK');

    // 1b. Test Anti-doublon et préservation stricte des encours
    console.log('\n1b. Test Anti-Doublon : exclusion des prêts déjà validés mais conservation des encours :');
    const dupTestDataset = {
        prets: [{ REFCONTCMPT: knownOkRef, IDINT: 'CLI1' }],
        encours: [{ REFCONTCMPT: knownOkRef, IDINT: 'CLI1', MNTTOTUTIL: 1000000 }]
    };
    const dupIds = sandbox.checkCdrDuplicates(dupTestDataset, '2023-06');
    console.log(`   - Doublons de contrats d'engagement détectés : ${dupIds.length} (Attendu : 1 [${knownOkRef}])`);
    const afterDupFilter = sandbox.filterCdrDuplicates(dupTestDataset, dupIds);
    console.log(`   - Prêts restants après filtre doublon : ${afterDupFilter.prets.length} (Attendu : 0, prêt exclu car déjà validé)`);
    console.log(`   - Encours restants après filtre doublon : ${afterDupFilter.encours.length} (Attendu : 1, encours impérativement conservé)`);

    if (afterDupFilter.prets.length !== 0) throw new Error('Le prêt déjà validé aurait dû être exclu');
    if (afterDupFilter.encours.length !== 1) throw new Error('L\'encours du prêt validé ne doit JAMAIS être exclu');

    // 2. Audit BEAC et Détection de l'anomalie ENC0001
    console.log('\n2. Test de l\'Audit BEAC (validateEncours et auditCdrDataset) :');
    const testDataset = {
        prets: [
            // Prêt nouveau créé dans la période 2023-08 (DATMEP: 15/08/2023)
            {
                REFCONTCMPT: 'NOUV_PRET_2023_08',
                IDINT: 'CLI_NOUV',
                CODAGE: '60002',
                STATUT: '00',
                TYPENG: '01',
                NATENG: '05',
                MNTENG: 15000000,
                DATMEP: '15/08/2023',
                DATDEB: '15/08/2023',
                DATFIN: '15/08/2026',
                DATPREECHCAP: '15/09/2023',
                DUREE: 36,
                MATURITE: '02',
                CODDEV: 'XAF',
                TXINT: 8.5,
                TXEFFGLOB: 8.5,
                NBRECH: 36,
                MNTECH: 450000,
                TOTINT: 1200000
            }
        ],
        encours: [
            // E1 : Encours sur nouveau prêt de la période (NOUV_PRET_2023_08) -> DOIT PASSER
            {
                REFCONTCMPT: 'NOUV_PRET_2023_08',
                IDINT: 'CLI_NOUV',
                MNTTOTUTIL: 15000000,
                CLADEPREC: '01',
                MNTCRD: 15000000,
                DATECH: '15/08/2023',
                NBRECHPAY: 0,
                NBRECHIMP: 0,
                NBRECHRES: 36,
                NBRJRSIMP: 0
            },
            // E2 : Encours sur contrat ancien validé OK sur BEAC (0100001000012) -> DOIT PASSER (Code 02)
            {
                REFCONTCMPT: '0100001000012',
                IDINT: 'CLI_HIST_OK',
                MNTTOTUTIL: 5000000,
                CLADEPREC: '01',
                MNTCRD: 3500000,
                DATECH: '15/08/2023',
                NBRECHPAY: 6,
                NBRECHIMP: 0,
                NBRECHRES: 18,
                NBRJRSIMP: 0
            },
            // E3 : Encours sur contrat ancien rejeté lors de la déclaration précédente (CI000000009) -> DOIT ÊTRE EN ANOMALIE
            {
                REFCONTCMPT: 'CI000000009',
                IDINT: 'CLI_HIST_KO',
                MNTTOTUTIL: 8000000,
                CLADEPREC: '01',
                MNTCRD: 6000000,
                DATECH: '15/08/2023',
                NBRECHPAY: 2,
                NBRECHIMP: 0,
                NBRECHRES: 10,
                NBRJRSIMP: 0
            },
            // E4 : Encours sur contrat absent du référentiel et non créé dans la période -> DOIT ÊTRE EN ANOMALIE
            {
                REFCONTCMPT: 'CONTRAT_INCONNU_99999',
                IDINT: 'CLI_INCONNU',
                MNTTOTUTIL: 2000000,
                CLADEPREC: '01',
                MNTCRD: 2000000,
                DATECH: '15/08/2023',
                NBRECHPAY: 0,
                NBRECHIMP: 0,
                NBRECHRES: 12,
                NBRJRSIMP: 0
            }
        ],
        debiteurs: []
    };

    const auditHeader = {
        codePays: 'TD',
        codeBanque: '60002',
        numDec: '0001',
        natDec: '01',
        decDate: '31/08/2023',
        arrDate: '31/08/2023',
        period: '2023-08',
        clientRegistry: sandbox.ClientsRegistryManager,
        contratsRegistry: adm
    };

    const auditRes = sandbox.beacValidatorInstance.auditCdrDataset(testDataset, auditHeader);
    const enc0001Anomalies = auditRes.anomalies.filter(a => a.code === 'ENC0001');

    console.log(`   - Anomalies ENC0001 détectées : ${enc0001Anomalies.length} (Attendu : 2)`);
    enc0001Anomalies.forEach(a => {
        console.log(`     * Ligne ${a.ligne} - Ref: ${a.ref} - ${a.libelle}`);
    });

    console.log(`   - Total anomalies détectées : ${auditRes.anomalies.length}`);
    auditRes.anomalies.forEach(a => {
        console.log(`     * Source: ${a.source} | Code: ${a.code} | Champ: ${a.champ} | Val: ${a.valeur} | ${a.libelle} - ${a.message || ''}`);
    });

    // 3. Test de ségrégation
    console.log('\n3. Test de Ségrégation (filterAndSegregateEligibleCdrRecords) :');
    const seg = sandbox.filterAndSegregateEligibleCdrRecords(testDataset, '2023-08', auditRes);
    console.log(`   - Prêts éligibles : ${seg.eligible.prets.length}`);
    console.log(`   - Encours éligibles : ${seg.eligible.encours.length} (Attendu : 2 [NOUV_PRET_2023_08, 0100001000012])`);
    console.log(`   - Encours exclus (anomalies) : ${seg.anomalies.encours.length} (Attendu : 2 [CI000000009, CONTRAT_INCONNU_99999])`);

    seg.eligible.encours.forEach(e => {
        console.log(`     [ÉLIGIBLE] Encours Ref: ${e.REFCONTCMPT}`);
    });
    seg.anomalies.encours.forEach(e => {
        console.log(`     [EXCLU] Encours Ref: ${e.ref} - Motif: ${e.reason}`);
    });

    if (seg.eligible.encours.length !== 2) {
        throw new Error(`Échec ségrégation: ${seg.eligible.encours.length} encours éligibles au lieu de 2`);
    }
    if (seg.anomalies.encours.length !== 2) {
        throw new Error(`Échec ségrégation: ${seg.anomalies.encours.length} encours exclus au lieu de 2`);
    }

    // 4. Test de classification et scission (Code 01 vs Code 02)
    console.log('\n4. Test de Scission Réglementaire (classifyAndSplitCdrResults) :');
    const split = sandbox.classifyAndSplitCdrResults(seg.eligible, '2023-08');
    console.log(`   - Nouveaux (Code 01) : ${split.nouveaux.prets.length} prêt(s), ${split.nouveaux.encours.length} encours`);
    console.log(`   - Anciens  (Code 02) : ${split.anciens.prets.length} prêt(s), ${split.anciens.encours.length} encours`);

    if (split.nouveaux.encours.length !== 1 || split.nouveaux.encours[0].REFCONTCMPT !== 'NOUV_PRET_2023_08') {
        throw new Error('NOUV_PRET_2023_08 doit être dans nouveaux.encours');
    }
    if (split.anciens.encours.length !== 1 || split.anciens.encours[0].REFCONTCMPT !== '0100001000012') {
        throw new Error('0100001000012 doit être dans anciens.encours');
    }

    // 5. Test de génération XML
    console.log('\n5. Test de Génération XML :');
    const xmlNouveaux = sandbox.generateUnifiedCDRXml(split.nouveaux, {
        codePays: 'TD', codeBanque: '60002', numDec: '0001', natDec: '01',
        decDate: '2023-08-31', arrDate: '2023-08-31', period: '2023-08'
    });
    const xmlAnciens = sandbox.generateUnifiedCDRXml(split.anciens, {
        codePays: 'TD', codeBanque: '60002', numDec: '0002', natDec: '02',
        decDate: '2023-08-31', arrDate: '2023-08-31', period: '2023-08'
    });

    console.log('   - XML Nouveaux (Code 01) contient <Engagement RefContCmpt="NOUV_PRET_2023_08"> ?', xmlNouveaux.includes('RefContCmpt="NOUV_PRET_2023_08"'));
    console.log('   - XML Nouveaux (Code 01) contient <Encours RefContCmpt="NOUV_PRET_2023_08"> ?', xmlNouveaux.includes('<Encours RefContCmpt="NOUV_PRET_2023_08"'));
    console.log('   - XML Anciens (Code 02) contient <Encours RefContCmpt="0100001000012"> ?', xmlAnciens.includes('RefContCmpt="0100001000012"'));

    console.log('   - Aucun contrat inconnu dans XML 01 ?', !xmlNouveaux.includes('CONTRAT_INCONNU_99999'));
    console.log('   - Aucun contrat rejeté dans XML 02 ?', !xmlAnciens.includes('CI000000009'));

    if (xmlNouveaux.includes('CONTRAT_INCONNU_99999') || xmlAnciens.includes('CI000000009')) {
        throw new Error('Un contrat en anomalie s\'est retrouvé dans le XML !');
    }

    console.log('\n>>> SUCCÈS : TOUTES LES RÈGLES SONT VALIDÉES ET CONFORMES À 100% ! <<<');
}

run().catch(err => {
    console.error('ERREUR TEST:', err);
    process.exit(1);
});
