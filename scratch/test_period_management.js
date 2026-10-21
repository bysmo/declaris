const fs = require('fs');
const path = require('path');

// Mock browser environment
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
    info: console.log,
    warn: console.warn,
    success: console.log,
    error: console.error
};
global.updatePlatformCounters = () => {};

// Minimal contract helpers
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

// DeclarisStorage mock
global.DeclarisStorage = {
    contratsCsvText: 'IDENTIFIANT;TYPE_ELEMENT;TYPE_DECLARATION;STATUT_CONTROLE;STATUT_LIBELLE;PERIODE_ARRETE;MOIS_ANNEE;NUM_DECLARATION;DATE_ACQUITTEMENT;CODE_BANQUE;CODE_PAYS;NOMBRE_ANOMALIES;CODES_ERREURS;FICHIER_SOURCE\n',
    clientsCsvText: 'IDENTIFIANT;TYPE_CLIENT;NOM_RAISOC;STATUT_DECLARATION;PERIODE_ARRETE;CODE_BANQUE;CODE_PAYS;SOURCE\n',
    loadOrInitCsvStores: async () => {},
    setStoredItem: async (store, key, val) => {},
    updateUiDownloadLinks: () => {},
    async deleteContratsFromPeriod(period, idList = null) {
        const normP = period;
        const targetIdsSet = (Array.isArray(idList) && idList.length > 0)
            ? new Set(idList.map(id => String(id).trim().toUpperCase()))
            : null;
        const lines = this.contratsCsvText.split(/\r?\n/);
        const remaining = [lines[0]];
        let removed = 0;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split(';');
            const id = parts[0]?.trim().toUpperCase();
            const p = parts[6]?.trim() || parts[5]?.trim();
            if (p === normP) {
                if (!targetIdsSet || targetIdsSet.has(id)) {
                    removed++;
                    continue;
                }
            }
            remaining.push(line);
        }
        this.contratsCsvText = remaining.join('\n');
        return removed;
    },
    async deleteClientsFromPeriod(period, idList = null) {
        const normP = period;
        const targetIdsSet = (Array.isArray(idList) && idList.length > 0)
            ? new Set(idList.map(id => String(id).trim().toUpperCase()))
            : null;
        const lines = this.clientsCsvText.split(/\r?\n/);
        const remaining = [lines[0]];
        let removed = 0;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split(';');
            const id = parts[0]?.trim().toUpperCase();
            const p = parts[4]?.trim();
            if (p === normP) {
                if (!targetIdsSet || targetIdsSet.has(id)) {
                    removed++;
                    continue;
                }
            }
            remaining.push(line);
        }
        this.clientsCsvText = remaining.join('\n');
        return removed;
    }
};

const appCode = fs.readFileSync(path.join(__dirname, '../app/app.js'), 'utf8');

// Load AntiDoublonManager
const admMatch = appCode.match(/const AntiDoublonManager = \{[\s\S]*?\n    \};\n/);
eval(admMatch[0].replace('const AntiDoublonManager =', 'global.AntiDoublonManager ='));

// Load ClientsRegistryManager
const crmMatch = appCode.match(/const ClientsRegistryManager = \{[\s\S]*?\n    \};\n/);
eval(crmMatch[0].replace('const ClientsRegistryManager =', 'global.ClientsRegistryManager ='));

async function runTests() {
    console.log('--- Test 1: Ingest OK data for 2023-08 ---');
    AntiDoublonManager.updateFromAcq('2023-08', ['CTR_A', 'CTR_B', 'CTR_C', 'CTR_D'], [], []);
    ClientsRegistryManager.registerFromAcq(['CLI_1', 'CLI_2', 'CLI_3'], '01', 'ACQ_TEST', '2023-08');

    console.log('2023-08 Contrats OK count:', AntiDoublonManager.getPeriodOkCount('2023-08'));
    console.log('2023-08 Clients OK count:', ClientsRegistryManager.getPeriodOkCount('2023-08'));
    if (AntiDoublonManager.getPeriodOkCount('2023-08') !== 4) throw new Error('Expected 4 contracts in 2023-08');
    if (ClientsRegistryManager.getPeriodOkCount('2023-08') !== 3) throw new Error('Expected 3 clients in 2023-08');

    console.log('\n--- Test 2: Ingest OK data for 2023-06 ---');
    AntiDoublonManager.updateFromAcq('2023-06', ['CTR_A', 'CTR_PAST'], [], []);
    ClientsRegistryManager.registerFromAcq(['CLI_1', 'CLI_PAST'], '01', 'ACQ_TEST', '2023-06');
    console.log('2023-06 Contrats OK count:', AntiDoublonManager.getPeriodOkCount('2023-06'));
    console.log('2023-06 Clients OK count:', ClientsRegistryManager.getPeriodOkCount('2023-06'));

    console.log('\n--- Test 3: List items by period ---');
    const cList08 = AntiDoublonManager.getPeriodContractsList('2023-08');
    const clList08 = ClientsRegistryManager.getPeriodClientsList('2023-08');
    console.log('Contracts listed for 2023-08:', cList08.map(c => c.id));
    console.log('Clients listed for 2023-08:', clList08.map(c => c.id));
    if (cList08.length !== 4) throw new Error('Expected 4 contracts listed for 2023-08');
    if (clList08.length !== 3) throw new Error('Expected 3 clients listed for 2023-08');

    console.log('\n--- Test 4: Manually delete single item CTR_B from 2023-08 ---');
    await AntiDoublonManager.deleteFromPeriod('2023-08', ['CTR_B']);
    console.log('isContractDeclaredOkInPeriod CTR_B in 2023-08 (expected false):', AntiDoublonManager.isContractDeclaredOkInPeriod('2023-08', 'CTR_B'));
    console.log('isContractDeclaredOkInPeriod CTR_A in 2023-08 (expected true):', AntiDoublonManager.isContractDeclaredOkInPeriod('2023-08', 'CTR_A'));
    console.log('New 2023-08 count:', AntiDoublonManager.getPeriodOkCount('2023-08'));
    if (AntiDoublonManager.isContractDeclaredOkInPeriod('2023-08', 'CTR_B')) throw new Error('CTR_B should no longer be OK in 2023-08');
    if (!AntiDoublonManager.isContractDeclaredOkInPeriod('2023-08', 'CTR_A')) throw new Error('CTR_A should still be OK in 2023-08');
    if (AntiDoublonManager.getPeriodOkCount('2023-08') !== 3) throw new Error('Expected 3 contracts remaining');

    console.log('\n--- Test 5: Manually delete single client CLI_2 from 2023-08 ---');
    await ClientsRegistryManager.deleteFromPeriod('2023-08', ['CLI_2']);
    console.log('isClientDeclaredOkInPeriod CLI_2 in 2023-08 (expected false):', ClientsRegistryManager.isClientDeclaredOkInPeriod('2023-08', 'CLI_2'));
    console.log('isClientDeclaredOkInPeriod CLI_1 in 2023-08 (expected true):', ClientsRegistryManager.isClientDeclaredOkInPeriod('2023-08', 'CLI_1'));
    console.log('New 2023-08 clients count:', ClientsRegistryManager.getPeriodOkCount('2023-08'));
    if (ClientsRegistryManager.isClientDeclaredOkInPeriod('2023-08', 'CLI_2')) throw new Error('CLI_2 should no longer be OK in 2023-08');
    if (ClientsRegistryManager.getPeriodOkCount('2023-08') !== 2) throw new Error('Expected 2 clients remaining');

    console.log('\n--- Test 6: Purge all contracts of 2023-08 ---');
    await AntiDoublonManager.deleteFromPeriod('2023-08', null);
    console.log('After purge, 2023-08 contracts count:', AntiDoublonManager.getPeriodOkCount('2023-08'));
    console.log('2023-06 contracts count (should be intact):', AntiDoublonManager.getPeriodOkCount('2023-06'));
    if (AntiDoublonManager.getPeriodOkCount('2023-08') !== 0) throw new Error('Expected 0 contracts for 2023-08 after purge');
    if (AntiDoublonManager.getPeriodOkCount('2023-06') !== 2) throw new Error('Expected 2 contracts for 2023-06 to remain intact');

    console.log('\n--- Test 7: Purge all clients of 2023-08 ---');
    await ClientsRegistryManager.deleteFromPeriod('2023-08', null);
    console.log('After purge, 2023-08 clients count:', ClientsRegistryManager.getPeriodOkCount('2023-08'));
    console.log('2023-06 clients count (should be intact):', ClientsRegistryManager.getPeriodOkCount('2023-06'));
    if (ClientsRegistryManager.getPeriodOkCount('2023-08') !== 0) throw new Error('Expected 0 clients for 2023-08 after purge');
    if (ClientsRegistryManager.getPeriodOkCount('2023-06') !== 2) throw new Error('Expected 2 clients for 2023-06 to remain intact');

    console.log('\n>>> ALL PERIOD DATA MANAGEMENT TESTS PASSED! <<<');
}

runTests().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
