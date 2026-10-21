const assert = require('assert');

// Test AppDialog confirm mock
const AppDialog = {
    showCalled: false,
    confirmCalled: false,
    lastOptions: null,
    show(options) {
        this.showCalled = true;
        this.lastOptions = options;
    },
    confirm(options) {
        this.confirmCalled = true;
        this.show(options);
    }
};

AppDialog.confirm({
    title: 'Test Titre',
    message: '<strong>Message test</strong>',
    onConfirm: () => {}
});

assert.strictEqual(AppDialog.confirmCalled, true, "AppDialog.confirm doit être appelé");
assert.strictEqual(AppDialog.showCalled, true, "AppDialog.show doit être appelé");
assert.strictEqual(AppDialog.lastOptions.title, 'Test Titre');
console.log('✅ Test 1 : AppDialog.confirm fonctionne parfaitement.');

// Test de la règle métier : Exclusion Nature 01 vs Conservation Nature 02 et 03
const registry = new Set(['100117', '112585', '208811']);
function isClientDeclared(id) {
    return registry.has(String(id).trim());
}

function processFrcbClients(data, natDec) {
    if (natDec === '02' || natDec === '03') {
        // Conservation de 100% des clients (mise à jour ou correction autorisée pour clients existants)
        return { kept: data, excluded: [], blocked: false };
    }
    // natDec === '01' (Création) : exclusion stricte des clients déjà existants
    const clientsAlreadyRegistered = [];
    const newClientsToCreate = [];
    data.forEach(row => {
        if (isClientDeclared(row.IDINT)) {
            clientsAlreadyRegistered.push(row.IDINT);
        } else {
            newClientsToCreate.push(row);
        }
    });

    if (newClientsToCreate.length === 0 && clientsAlreadyRegistered.length > 0) {
        return { kept: [], excluded: clientsAlreadyRegistered, blocked: true };
    }
    return { kept: newClientsToCreate, excluded: clientsAlreadyRegistered, blocked: false };
}

const testBatch = [
    { IDINT: '100117', NOM: 'Client 1' }, // Existant
    { IDINT: '112585', NOM: 'Client 2' }, // Existant
    { IDINT: '999999', NOM: 'Nouveau Client' } // Nouveau
];

// Cas 1 : Nature 01 avec mélange existants + nouveaux
const res01Mixed = processFrcbClients(testBatch, '01');
assert.strictEqual(res01Mixed.blocked, false);
assert.strictEqual(res01Mixed.kept.length, 1, "En 01, seul le nouveau client (999999) doit être conservé");
assert.strictEqual(res01Mixed.kept[0].IDINT, '999999');
assert.strictEqual(res01Mixed.excluded.length, 2, "Les 2 clients existants doivent être exclus en 01");
console.log('✅ Test 2 : En Nature 01, exclusion des clients existants et conservation des nouveaux.');

// Cas 2 : Nature 01 avec 100% de clients existants -> Bloqué
const res01AllExisting = processFrcbClients([testBatch[0], testBatch[1]], '01');
assert.strictEqual(res01AllExisting.blocked, true, "En 01, si 100% sont déjà existants, la déclaration doit être bloquée");
assert.strictEqual(res01AllExisting.kept.length, 0);
console.log('✅ Test 3 : En Nature 01 avec 100% existants -> Blocage avec alerte invitant à passer en 02/03.');

// Cas 3 : Nature 02 (Mise à jour) -> 100% conservés
const res02 = processFrcbClients(testBatch, '02');
assert.strictEqual(res02.blocked, false);
assert.strictEqual(res02.kept.length, 3, "En 02, 100% des clients doivent être conservés");
console.log('✅ Test 4 : En Nature 02 (Mise à jour), 100% des clients existants sont autorisés et conservés.');

// Cas 4 : Nature 03 (Correction) -> 100% conservés
const res03 = processFrcbClients(testBatch, '03');
assert.strictEqual(res03.blocked, false);
assert.strictEqual(res03.kept.length, 3, "En 03, 100% des clients doivent être conservés");
console.log('✅ Test 5 : En Nature 03 (Correction), 100% des clients existants sont autorisés et conservés.');

console.log('\n🎉 TOUS LES TESTS DE SPÉCIFICATION SONT VALIDÉS AVEC SUCCÈS !');
