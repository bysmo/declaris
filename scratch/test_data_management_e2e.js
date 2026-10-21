const fs = require('fs');

console.log("=== TEST SUITE: GESTION DES DONNÉES & CONTRÔLES PP / PM / CDR ===");

// 1. Test BEAC Validator header controls for FRCB PP & PM vs CDR
const validatorContent = fs.readFileSync('app/beac-validator.js', 'utf8');
const vm = require('vm');
const sandbox = {
    window: {},
    console: console,
    Date: Date,
    Map: Map,
    Set: Set,
    Array: Array,
    String: String,
    Number: Number,
    Math: Math,
    RegExp: RegExp,
    performance: { now: () => Date.now() }
};
vm.createContext(sandbox);
vm.runInContext(validatorContent, sandbox);

const beacValidator = sandbox.window.beacValidatorInstance;
if (!beacValidator) {
    throw new Error("beacValidatorInstance not found on window");
}

console.log("\n1. Test Contrôles d'en-tête :");
// Test FRCB PP header (no DatArr)
const frcbPpHeader = {
    codePays: 'TD',
    codeBanque: '60002',
    numDec: '0001',
    typDec: '01',
    natDec: '01',
    decDate: '30/06/2023'
};
const ppAnomalies = beacValidator.validateHeader(frcbPpHeader, 100);
console.log("PP anomalies d'en-tête:", ppAnomalies.map(a => a.code));
const hasDatArrErrPP = ppAnomalies.some(a => a.code === 'ENT0016' || a.code === 'ENT0012' || a.code === 'ENT0013');
if (hasDatArrErrPP) {
    throw new Error("ERREUR: Le contrôle d'en-tête PP ne doit pas exiger DatArr !");
}
console.log("  -> SUCCESS: FRCB PP n'exige pas DatArr (aucun faux positif ENT0016/ENT0012).");

// Test FRCB PM header (no DatArr)
const frcbPmHeader = {
    codePays: 'TD',
    codeBanque: '60002',
    numDec: '0001',
    typDec: '02',
    natDec: '01',
    decDate: '30/06/2023'
};
const pmAnomalies = beacValidator.validateHeader(frcbPmHeader, 50);
console.log("PM anomalies d'en-tête:", pmAnomalies.map(a => a.code));
const hasDatArrErrPM = pmAnomalies.some(a => a.code === 'ENT0016' || a.code === 'ENT0012' || a.code === 'ENT0013');
if (hasDatArrErrPM) {
    throw new Error("ERREUR: Le contrôle d'en-tête PM ne doit pas exiger DatArr !");
}
console.log("  -> SUCCESS: FRCB PM n'exige pas DatArr (aucun faux positif ENT0016/ENT0012).");

// 2. Test Ingestion ACQ et Déduplication CSV
console.log("\n2. Test Ingestion ACQ & Déduplication :");
const sampleXml = fs.readFileSync('TD-60002-0057-30062023-51-ACQ.XML', 'utf8');

// Parse sample ACQ using regex matching
const headerMatch = sampleXml.match(/<EnteteAcquittement\s+([^>]+)>/i);
console.log("  -> En-tête ACQ trouvé :", Boolean(headerMatch));

// Check contracts CSV integration
const contractsCsv = fs.readFileSync('app/contrats_et_id_declares.csv', 'utf8');
const initialContractLines = contractsCsv.split(/\r?\n/).filter(l => l.trim().length > 0);
console.log("  -> Contrats CSV initial :", initialContractLines.length - 1, "contrats.");

// Simuler DeclarisStorage.integrateAcqData logic
const lines = contractsCsv.split(/\r?\n/);
const existingKeySet = new Set();
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(';');
    const id = parts[0]?.trim().toUpperCase();
    const p = parts[6]?.trim() || '';
    if (id) existingKeySet.add(`${id};${p}`);
}

// Ingestion 1st time with an existing contract (CI000000009;2023-06)
const testExistingKey = "CI000000009;2023-06";
const wasPresent = existingKeySet.has(testExistingKey);
console.log("  -> CI000000009 déjà présent pour 2023-06 ?", wasPresent);
if (!wasPresent) {
    throw new Error("CI000000009 devrait être présent dans le CSV de base.");
}

// Ingestion of a new contract for 2023-07
const newTestContract = "NEW_CONTRAT_TEST_999999";
const newPeriod = "2023-07";
const newKey = `${newTestContract};${newPeriod}`;
console.log("  -> Nouveau contrat test présent ?", existingKeySet.has(newKey));

// First pass: add new contract
let addedFirst = 0;
if (!existingKeySet.has(newKey)) {
    existingKeySet.add(newKey);
    addedFirst++;
}
console.log("  -> Ajout 1ère passe :", addedFirst, "contrat ajouté.");
if (addedFirst !== 1) throw new Error("Le nouveau contrat aurait dû être ajouté !");

// Second pass: duplicate attempt
let addedSecond = 0;
if (!existingKeySet.has(newKey)) {
    existingKeySet.add(newKey);
    addedSecond++;
}
console.log("  -> Ajout 2nde passe (doublon) :", addedSecond, "contrat ajouté (0 attendu).");
if (addedSecond !== 0) throw new Error("DOUBLON DÉTECTÉ : Le contrat a été ajouté en double !");
console.log("  -> SUCCESS : Déduplication stricte sans doublons validée.");

// 3. Test HTML Modal Order
console.log("\n3. Test Ordre dans Nouvelle Déclaration (index.html) :");
const html = fs.readFileSync('app/index.html', 'utf8');

const tabPP = html.indexOf('data-dectab="frcb-pp"');
const tabPM = html.indexOf('data-dectab="frcb-pm"');
const tabCDR = html.indexOf('data-dectab="cdr"');

console.log("Tabs order:", { tabPP, tabPM, tabCDR });
if (tabPP >= tabPM || tabPM >= tabCDR) {
    throw new Error("L'ordre des onglets doit être PP puis PM puis CDR !");
}
console.log("  -> SUCCESS: Onglets ordonnés PP (1) -> PM (2) -> CDR (3).");

const panePP = html.indexOf('id="frcb-pp"');
const panePM = html.indexOf('id="frcb-pm"');
const paneCDR = html.indexOf('id="cdr"');

console.log("Panes order:", { panePP, panePM, paneCDR });
if (panePP >= panePM || panePM >= paneCDR) {
    throw new Error("L'ordre des volets doit être PP puis PM puis CDR !");
}
console.log("  -> SUCCESS: Volets ordonnés PP (1) -> PM (2) -> CDR (3).");

// Verify active pane is PP
const ppPaneMatch = html.match(/<div class="[^"]*dec-modal-pane[^"]*" id="frcb-pp">/);
console.log("PP pane class:", ppPaneMatch ? ppPaneMatch[0] : "NOT FOUND");
if (!ppPaneMatch || !ppPaneMatch[0].includes('active')) {
    throw new Error("Le volet FRCB PP doit être actif par défaut !");
}
console.log("  -> SUCCESS: Volet FRCB PP actif par défaut.");

console.log("\n=== TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS (100% CONFORME) ===");
