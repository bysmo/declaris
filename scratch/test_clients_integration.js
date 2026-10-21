const fs = require('fs');
const path = require('path');

// 1. Simuler l'environnement browser minimal
global.window = global;
global.document = {
    getElementById: (id) => {
        if (id === 'cdr-client-check-enabled') return { checked: true };
        if (id === 'cdr-client-filter-enabled') return { checked: true };
        return null;
    },
    querySelectorAll: () => []
};

// 2. Charger beac-validator.js
require('../app/beac-validator.js');

// 3. Charger et vérifier le CSV de référence
const csvPath = path.join(__dirname, '../app/clients_declares_referentiel.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.split(/\r?\n/);
console.log(`Lignes CSV référentiel : ${lines.length}`);

// 4. Construire un ClientsRegistryManager mock fidèle
const variantsSet = new Set();
const clientsMap = new Map();

function addVariants(id) {
    if (!id && id !== 0) return;
    const s = String(id).trim().toUpperCase();
    if (!s) return;
    variantsSet.add(s);
    const noSpaces = s.replace(/\s+/g, '');
    if (noSpaces) {
        variantsSet.add(noSpaces);
        const noZeros = noSpaces.replace(/^0+/, '');
        if (noZeros) {
            variantsSet.add(noZeros);
            variantsSet.add(noZeros.padStart(6, '0'));
            variantsSet.add(noZeros.padStart(7, '0'));
            variantsSet.add(noZeros.padStart(8, '0'));
        }
    }
}

for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(';');
    const id = parts[0]?.trim();
    if (id) {
        clientsMap.set(id.toUpperCase(), { id, type: parts[1], nom: parts[2] });
        addVariants(id);
    }
}

console.log(`Clients chargés : ${clientsMap.size}, Variantes indexées : ${variantsSet.size}`);

const registryMock = {
    isControlEnabled: () => true,
    isFilterUndeclaredEnabled: () => true,
    isClientDeclared: (id) => {
        if (!id && id !== 0) return false;
        const s = String(id).trim().toUpperCase();
        if (!s) return false;
        if (variantsSet.has(s)) return true;
        const noSpaces = s.replace(/\s+/g, '');
        if (variantsSet.has(noSpaces)) return true;
        const noZeros = noSpaces.replace(/^0+/, '');
        if (noZeros && variantsSet.has(noZeros)) return true;
        return false;
    }
};

window.ClientsRegistryManager = registryMock;

// 5. Tester la normalisation des variantes
// Le premier client du CSV est 702557
console.log('Test 702557 (exact) :', registryMock.isClientDeclared('702557')); // true
console.log('Test 00702557 (zeros) :', registryMock.isClientDeclared('00702557')); // true
console.log('Test " 702557 " (espaces) :', registryMock.isClientDeclared(' 702557 ')); // true
console.log('Test client inexistant "CLIENT_INCONNU_9999" :', registryMock.isClientDeclared('CLIENT_INCONNU_9999')); // false

if (!registryMock.isClientDeclared('702557') || !registryMock.isClientDeclared('00702557') || registryMock.isClientDeclared('CLIENT_INCONNU_9999')) {
    console.error('FAIL: Normalisation des variantes invalide');
    process.exit(1);
}

// 6. Tester beacValidatorInstance.auditCdrDataset avec CLI0001
const validator = window.beacValidatorInstance;
const testDataset = {
    prets: [
        {
            REFENG: 'PRET_001',
            IDINT: '702557', // Connu
            TYPENG: '01',
            DATMEP: '15/06/2023',
            DATDEB: '15/06/2023',
            DATFIN: '15/06/2025',
            DATARR: '30/06/2023',
            MNTINI: '10000000',
            CODPAY: 'TD',
            CODEBANQUE: '60002'
        },
        {
            REFENG: 'PRET_002',
            IDINT: 'CLIENT_INCONNU_123', // Inconnu -> Doit déclencher CLI0001
            TYPENG: '01',
            DATMEP: '15/06/2023',
            DATDEB: '15/06/2023',
            DATFIN: '15/06/2025',
            DATARR: '30/06/2023',
            MNTINI: '5000000',
            CODPAY: 'TD',
            CODEBANQUE: '60002'
        }
    ],
    encours: [
        {
            REFENG: 'PRET_001',
            IDINT: '702557',
            MNTCRA: '9500000',
            DATARR: '30/06/2023'
        },
        {
            REFENG: 'PRET_002',
            IDINT: 'CLIENT_INCONNU_123', // Inconnu -> Doit déclencher CLI0001
            MNTCRA: '4800000',
            DATARR: '30/06/2023'
        }
    ],
    debiteurs: [
        {
            NUMCPT: 'CPT_DEB_001',
            IDINTTIT: '702557', // Connu
            SOLDE: '-250000',
            DATARR: '30/06/2023'
        },
        {
            NUMCPT: 'CPT_DEB_002',
            IDINTTIT: 'CLIENT_DEB_INCONNU_456', // Inconnu -> Doit déclencher CLI0001
            SOLDE: '-500000',
            DATARR: '30/06/2023'
        }
    ]
};

const auditResult = validator.auditCdrDataset(testDataset, {
    codePays: 'TD',
    codeBanque: '60002',
    numDec: '0001',
    natDec: '01',
    typDec: '51',
    decDate: new Date('2023-07-15'),
    arrDate: new Date('2023-06-30'),
    clientRegistry: registryMock
});

console.log('--- RÉSULTATS AUDIT ---');
console.log('Total anomalies :', auditResult.totalAnomalies);
console.log('Anomalies CLI0001 (clients non déclarés) :', auditResult.clientAnomaliesCount);
console.log('Clients manquants uniques :', JSON.stringify(auditResult.uniqueMissingClients, null, 2));

const cli0001Anomalies = auditResult.anomalies.filter(a => a.code === 'CLI0001');
console.log('Détail CLI0001 :');
cli0001Anomalies.forEach(a => {
    console.log(`- [${a.source}] Ligne ${a.ligne} / Réf ${a.ref} / Champ ${a.champ} = "${a.valeur}" : ${a.libelle}`);
});

if (auditResult.clientAnomaliesCount !== 3) {
    console.error(`FAIL: Attendu 3 anomalies CLI0001, obtenu ${auditResult.clientAnomaliesCount}`);
    process.exit(1);
}

if (auditResult.uniqueMissingClients.length !== 2) {
    console.error(`FAIL: Attendu 2 clients manquants uniques, obtenu ${auditResult.uniqueMissingClients.length}`);
    process.exit(1);
}

console.log('=== TEST REUSSI AVEC SUCCES ===');
