const fs = require('fs');
const path = require('path');
const XLSX = require('./node_modules/xlsx');
const vm = require('vm');

console.log('--- Testing Complete Pipeline (Clients PP/PM + CDR Remediation & Split) ---');

// 1. Charger beac-validator.js dans sandbox
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

// 2. Mock ClientsRegistryManager
const historicalVariants = new Set(['702557', '702558', '367268', '489670']);
const sessionValid = new Set();
const sessionRejected = new Map();

const mockRegistry = {
    isControlEnabled: () => true,
    isClientHistoricallyDeclared: (id) => {
        if (!id) return false;
        return historicalVariants.has(String(id).trim().toUpperCase());
    },
    isClientDeclared: (id) => {
        if (!id) return false;
        const s = String(id).trim().toUpperCase();
        return historicalVariants.has(s) || sessionValid.has(s);
    },
    isGoodClient: (id) => {
        if (!id) return false;
        const s = String(id).trim().toUpperCase();
        if (sessionRejected.has(s)) return false;
        return historicalVariants.has(s) || sessionValid.has(s);
    },
    isClientRejected: (id) => {
        if (!id) return false;
        return sessionRejected.has(String(id).trim().toUpperCase());
    },
    markClientsAsRejected: (list) => {
        list.forEach(c => {
            const s = String(c.id).trim().toUpperCase();
            sessionRejected.set(s, c.anomalies);
            sessionValid.delete(s);
        });
    },
    registerValidSessionClients: (list) => {
        list.forEach(c => {
            const s = String(c.id).trim().toUpperCase();
            sessionValid.add(s);
            sessionRejected.delete(s);
        });
    }
};

sandbox.window.ClientsRegistryManager = mockRegistry;

// 3. Simuler le traitement de personnes morales
const samplePM = [
    // Client 1 : Ancien et valide
    {
        IDINTCLI: '702557',
        RAISOC: 'SOCIETE COMMERCIALE ALPHA',
        NIF_NIU: 'M019800012345Z',
        DATCRE: '12/01/2010',
        DATEVE: '30/06/2023',
        FORJURID: '01',
        SECACT: '0111',
        AGEECO: '01',
        STALEG: '01',
        DATENTRELPAR: '12/01/2010',
        ADR_VILLE: 'NDJAMENA',
        ADR_PAYS: 'TD'
    },
    // Client 2 : Nouveau et valide
    {
        IDINTCLI: 'PM_NEW_9999',
        RAISOC: 'NOUVELLE ENTREPRISE BETA',
        NIF_NIU: 'M022300099999X',
        DATCRE: '05/03/2023',
        DATEVE: '30/06/2023',
        FORJURID: '02',
        SECACT: '0112',
        AGEECO: '01',
        STALEG: '01',
        DATENTRELPAR: '15/03/2023',
        ADR_VILLE: 'NDJAMENA',
        ADR_PAYS: 'TD'
    },
    // Client 3 : Rejeté (Erreur bloquante : Date de création dans le futur)
    {
        IDINTCLI: 'PM_BAD_0001',
        RAISOC: 'ENTREPRISE ANOMALIE GAMMA',
        NIF_NIU: 'M022300088888Y',
        DATCRE: '30/12/2099', // Futur !
        DATEVE: '30/06/2023',
        FORJURID: '01',
        SECACT: '0111',
        AGEECO: '01',
        STALEG: '01',
        DATENTRELPAR: '12/01/2023',
        ADR_VILLE: 'NDJAMENA',
        ADR_PAYS: 'TD'
    }
];

const auditPM = engine.auditFrcbDataset(samplePM, 'frcb-pm', {
    codePays: 'TD',
    codeBanque: '60002',
    numDec: '0001',
    natDec: '01',
    decDate: '30062023'
});

console.log('PM Audit: Total =', auditPM.totalDeclaredRecords, ', Erreurs =', auditPM.errorCount);

// Identifier les clients bloquants
const blockingClientIds = new Set(auditPM.uniqueClientsBloquants.map(c => c.ref));
const pmAnomalies = [];
const pmOk = [];

samplePM.forEach((row, idx) => {
    const id = row.IDINTCLI;
    if (blockingClientIds.has(id)) {
        const clientAudit = auditPM.uniqueClientsBloquants.find(c => c.ref === id);
        pmAnomalies.push({ row, id, anomalies: clientAudit.anomalies });
    } else {
        pmOk.push(row);
    }
});

mockRegistry.markClientsAsRejected(pmAnomalies);
mockRegistry.registerValidSessionClients(pmOk.map(r => ({ id: r.IDINTCLI })));

console.log(`PM Séparation : ${pmOk.length} clients OK, ${pmAnomalies.length} clients en anomalie.`);
console.log('Client PM_NEW_9999 est bon client ?', mockRegistry.isGoodClient('PM_NEW_9999')); // true
console.log('Client PM_BAD_0001 est rejeté ?', mockRegistry.isClientRejected('PM_BAD_0001')); // true

// Scission PM OK
const pmAnciens = pmOk.filter(r => mockRegistry.isClientHistoricallyDeclared(r.IDINTCLI));
const pmNouveaux = pmOk.filter(r => !mockRegistry.isClientHistoricallyDeclared(r.IDINTCLI));
console.log(`PM Déclaration : ${pmAnciens.length} anciens (Code 02), ${pmNouveaux.length} nouveaux (Code 01).`);

// 4. Tester l'impact sur les contrats CDR
const samplePrets = [
    // Prêt 1 lié à Client Ancien Valide -> ÉLIGIBLE
    {
        REFCONTCMPT: 'PRT-OK-001',
        IDINTCLI: '702557',
        CODAGE: '00001',
        TYPENG: '01',
        DATMEP: '10/01/2022',
        DATDEB: '10/01/2022',
        DATFIN: '10/01/2024',
        DATARR: '30/06/2023',
        MNTINI: 10000000
    },
    // Prêt 2 lié à Nouveau Client Valide de la période -> ÉLIGIBLE
    {
        REFCONTCMPT: 'PRT-OK-002',
        IDINTCLI: 'PM_NEW_9999',
        CODAGE: '00001',
        TYPENG: '01',
        DATMEP: '15/06/2023',
        DATDEB: '15/06/2023',
        DATFIN: '15/06/2025',
        DATARR: '30/06/2023',
        MNTINI: 5000000
    },
    // Prêt 3 lié à Client Rejeté -> EN ANOMALIE
    {
        REFCONTCMPT: 'PRT-KO-CLIENT-REJETE',
        IDINTCLI: 'PM_BAD_0001',
        CODAGE: '00001',
        TYPENG: '01',
        DATMEP: '15/06/2023',
        DATDEB: '15/06/2023',
        DATFIN: '15/06/2025',
        DATARR: '30/06/2023',
        MNTINI: 5000000
    },
    // Prêt 4 lié à Client Inconnu / Non Déclaré -> EN ANOMALIE
    {
        REFCONTCMPT: 'PRT-KO-CLIENT-INCONNU',
        IDINTCLI: 'CLIENT_JAMAIS_VU_777',
        CODAGE: '00001',
        TYPENG: '01',
        DATMEP: '15/06/2023',
        DATDEB: '15/06/2023',
        DATFIN: '15/06/2025',
        DATARR: '30/06/2023',
        MNTINI: 5000000
    }
];

const sampleEncours = [
    {
        REFCONTCMPT: 'PRT-OK-001',
        CODAGE: '00001',
        DATARR: '30/06/2023',
        DATECH: '10/01/2024',
        MNTTOTUTIL: 8000000,
        MNTPAY: 8000000,
        MNTCRD: 8000000,
        CLADEPREC: '0'
    },
    {
        REFCONTCMPT: 'PRT-KO-CLIENT-REJETE',
        CODAGE: '00001',
        DATARR: '30/06/2023',
        DATECH: '10/01/2024',
        MNTTOTUTIL: 4000000,
        MNTPAY: 4000000,
        MNTCRD: 4000000,
        CLADEPREC: '0'
    }
];

const auditCDR = engine.auditCdrDataset({ prets: samplePrets, encours: sampleEncours, debiteurs: [] }, {
    codePays: 'TD',
    codeBanque: '60002',
    clientRegistry: mockRegistry
});

console.log('CDR Audit Anomalies count =', auditCDR.anomalies.length);
console.log('CDR Top codes =', auditCDR.topAnomalies.map(a => `${a.code}: ${a.count}`));

const eligiblePrets = samplePrets.filter(p => mockRegistry.isGoodClient(p.IDINTCLI));
const nonEligiblePrets = samplePrets.filter(p => !mockRegistry.isGoodClient(p.IDINTCLI));

console.log(`CDR Filtrage : ${eligiblePrets.length} prêts éligibles, ${nonEligiblePrets.length} prêts en anomalie.`);
console.log('Prêts non éligibles :', nonEligiblePrets.map(p => `${p.REFCONTCMPT} (Client: ${p.IDINTCLI})`));

console.log('--- TEST PIPELINE TERMINÉ AVEC SUCCÈS ! ---');
