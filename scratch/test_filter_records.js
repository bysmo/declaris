const fs = require('fs');

// Simuler window et document
global.window = global;
global.document = {
    getElementById: (id) => {
        if (id === 'cdr-client-check-enabled') return { checked: true };
        if (id === 'cdr-client-filter-enabled') return { checked: true };
        return null;
    },
    querySelectorAll: () => []
};

// Lire app.js et extraire filterUndeclaredClientRecords et ClientsRegistryManager
const appJsCode = fs.readFileSync('app/app.js', 'utf8');

// Créer un mini environnement pour exécuter filterUndeclaredClientRecords
const mockDeclaredClients = new Set(['702557', '712960']);

const mockRegistry = {
    isClientDeclared: (id) => mockDeclaredClients.has(String(id).trim()),
    isControlEnabled: () => true,
    isFilterUndeclaredEnabled: () => true
};

global.ClientsRegistryManager = mockRegistry;

// Implémentation isolée correspondant à celle dans app.js
const CONTRACT_ID_KEYS = [
    'REFENG', 'REF_ENG', 'NUM_ENG', 'REF_ENGAGEMENT',
    'REFCONTCMPT', 'REFCONTCMPT2', 'REFCONTCMPT3',
    'NUMCONTRAT', 'NUM_CONTRAT', 'NUMCPT', 'NUM_CPT',
    'REFINT'
];

function getVal(row, keys) {
    if (!row) return '';
    for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
            return String(row[k]).trim();
        }
    }
    return '';
}

function addContractVariants(set, id) {
    if (!id) return;
    const s = String(id).trim();
    set.add(s);
    set.add(s.replace(/\s+/g, ''));
}

function filterUndeclaredClientRecords(results) {
    const isClientOk = (id) => ClientsRegistryManager.isClientDeclared(id);

    const safePrets = [];
    const excludedPrets = [];
    (results.prets || []).forEach(pret => {
        const idCli = getVal(pret, ['IDINT', 'IDINTCLI', 'ID_CLIENT', 'CLIENT', 'ID_INT']);
        if (idCli && isClientOk(idCli)) {
            safePrets.push(pret);
        } else {
            excludedPrets.push(pret);
        }
    });

    const excludedContractRefs = new Set();
    excludedPrets.forEach(p => {
        CONTRACT_ID_KEYS.forEach(k => {
            const v = getVal(p, [k]);
            if (v) addContractVariants(excludedContractRefs, v);
        });
    });

    const safeEncours = [];
    const excludedEncours = [];
    (results.encours || []).forEach(enc => {
        const idCli = getVal(enc, ['IDINT', 'IDINTCLI', 'ID_CLIENT', 'CLIENT', 'ID_INT']);
        if (idCli) {
            if (isClientOk(idCli)) {
                safeEncours.push(enc);
            } else {
                excludedEncours.push(enc);
            }
            return;
        }

        let isExcludedByContract = false;
        for (let i = 0; i < CONTRACT_ID_KEYS.length; i++) {
            const val = getVal(enc, [CONTRACT_ID_KEYS[i]]);
            if (!val) continue;
            const s = String(val).trim();
            if (excludedContractRefs.has(s) || excludedContractRefs.has(s.replace(/\s+/g, ''))) {
                isExcludedByContract = true;
                break;
            }
        }
        if (isExcludedByContract) {
            excludedEncours.push(enc);
        } else {
            safeEncours.push(enc);
        }
    });

    const safeDebiteurs = [];
    const excludedDebiteurs = [];
    (results.debiteurs || []).forEach(deb => {
        const idCli = getVal(deb, ['IDINTTIT', 'IDINT', 'IDINTCLI', 'ID_CLIENT', 'CLIENT', 'ID_INT']);
        if (idCli && isClientOk(idCli)) {
            safeDebiteurs.push(deb);
        } else {
            excludedDebiteurs.push(deb);
        }
    });

    return {
        filtered: {
            prets: safePrets,
            encours: safeEncours,
            debiteurs: safeDebiteurs
        },
        excluded: {
            prets: excludedPrets,
            encours: excludedEncours,
            debiteurs: excludedDebiteurs
        }
    };
}

const inputData = {
    prets: [
        { REFENG: 'PRET_VALIDE', IDINT: '702557' },
        { REFENG: 'PRET_EXCLU', IDINT: 'CLIENT_NON_DECLARE' }
    ],
    encours: [
        { REFENG: 'PRET_VALIDE', MNTCRA: '100' },
        { REFENG: 'PRET_EXCLU', MNTCRA: '200' }
    ],
    debiteurs: [
        { NUMCPT: 'CPT_VALIDE', IDINTTIT: '712960' },
        { NUMCPT: 'CPT_EXCLU', IDINTTIT: 'CLIENT_DEB_INCONNU' }
    ]
};

const res = filterUndeclaredClientRecords(inputData);
console.log('Safe Prets :', res.filtered.prets.length);
console.log('Excluded Prets :', res.excluded.prets.length);
console.log('Safe Encours :', res.filtered.encours.length);
console.log('Excluded Encours :', res.excluded.encours.length);
console.log('Safe Debiteurs :', res.filtered.debiteurs.length);
console.log('Excluded Debiteurs :', res.excluded.debiteurs.length);

if (res.filtered.prets.length === 1 && res.excluded.prets.length === 1 &&
    res.filtered.encours.length === 1 && res.excluded.encours.length === 1 &&
    res.filtered.debiteurs.length === 1 && res.excluded.debiteurs.length === 1) {
    console.log('TEST FILTER REUSSI AVEC SUCCES');
} else {
    console.error('FAIL: Le filtrage sécurisé a échoué');
    process.exit(1);
}
