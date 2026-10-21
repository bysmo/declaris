const fs = require('fs');
const vm = require('vm');

console.log("=== TEST SUITE: LECTURE DES FICHIERS CSV (SÉPARATEURS ; ET |) ===");

// 1. Charger et extraire les fonctions de app.js dans un contexte d'émulation
const appJs = fs.readFileSync('app/app.js', 'utf8');
const validatorJs = fs.readFileSync('app/beac-validator.js', 'utf8');

const sandbox = {
    window: {},
    document: {
        getElementById: () => null,
        querySelectorAll: () => [],
        querySelector: () => null
    },
    console: console,
    Date: Date,
    Map: Map,
    Set: Set,
    Array: Array,
    String: String,
    Number: Number,
    Math: Math,
    RegExp: RegExp,
    performance: { now: () => Date.now() },
    Blob: class {},
    FileReader: class {},
    URL: { createObjectURL: () => 'blob:mock' }
};
vm.createContext(sandbox);
vm.runInContext(validatorJs, sandbox);

// Extraire parseCsvText depuis appJs
const fnMatch = appJs.match(/function parseCsvText\(text, fileName = ''\) \{([\s\S]*?)\n    \}/);
if (!fnMatch) throw new Error("parseCsvText not found in app.js");

const cleanValMatch = appJs.match(/function cleanCsvValue\(val\) \{([\s\S]*?)\n    \}/);
if (!cleanValMatch) throw new Error("cleanCsvValue not found in app.js");

vm.runInContext(`
    function cleanCsvValue(val) {${cleanValMatch[1]}}
    function parseCsvText(text, fileName = '') {
        const Logger = { info: () => {}, success: () => {}, warn: () => {}, error: () => {} };
        ${fnMatch[1]}
    }
`, sandbox);

const parseCsvText = sandbox.parseCsvText;
const beacValidator = sandbox.window.beacValidatorInstance;

// TEST 1: CSV avec séparateur point-virgule (;) - FRCB PP
console.log("\n1. Test CSV avec séparateur point-virgule (;) - FRCB PP :");
const csvPpSemi = `IDINTCLI;NOM;PRENOM;DATNAISS;DATENTRELPAR;PAYSRES;CODAGE
CLI_PP_001;OUEDRAOGO;IBRAHIM;12051985;01012020;TD;00001
CLI_PP_002;"DUPONT; DE L'ISLE";MARIE;20101990;15062021;TD;00001
CLI_PP_003;KOUAME;JEAN;05081978;10102019;TD;00001`;

const parsedPp = parseCsvText(csvPpSemi, "clients_pp.csv");
console.log("  -> Lignes lues :", parsedPp.length);
if (parsedPp.length !== 3) throw new Error("Attendu 3 lignes pour FRCB PP !");
if (parsedPp[0].IDINTCLI !== "CLI_PP_001" || parsedPp[0].NOM !== "OUEDRAOGO") {
    throw new Error("Ligne 1 invalide : " + JSON.stringify(parsedPp[0]));
}
if (parsedPp[1].NOM !== "DUPONT; DE L'ISLE") {
    throw new Error("Guillemets avec point-virgule non respectés : " + parsedPp[1].NOM);
}
console.log("  -> Ligne avec ';' interne sous guillemets gérée avec succès :", parsedPp[1].NOM);

// Valider avec l'audit FRCB PP
const auditPp = beacValidator.auditFrcbDataset(parsedPp, 'frcb-pp', {
    codePays: 'TD',
    codeBanque: '60002',
    numDec: '0001',
    typDec: '01',
    natDec: '01',
    decDate: '30/06/2023'
});
console.log("  -> Audit BEAC FRCB PP exécuté sur les données CSV :", {
    total: auditPp.totalDeclaredRecords,
    erreurs: auditPp.errorCount,
    statut: auditPp.statutLibelle
});
console.log("  -> SUCCESS : FRCB PP CSV (;) lu et audité sans accroc.");

// TEST 2: CSV avec séparateur barre verticale (|) - FRCB PM
console.log("\n2. Test CSV avec séparateur barre verticale (|) - FRCB PM :");
const csvPmPipe = `IDINTCLI|RAISOC|DATCRE|FORJUR|PAYSSIEGE|CODAGE
ENT_001|CORIS HOLDING TCHAD SA|01012015|01|TD|00001
ENT_002|"SOCIETE NOUVELLE | INDUSTRIELLE"|15032018|02|TD|00001
ENT_003|AGRO PASTORAL DU CHARI SARL|10102020|02|TD|00001`;

const parsedPm = parseCsvText(csvPmPipe, "entreprises_pm.csv");
console.log("  -> Lignes lues :", parsedPm.length);
if (parsedPm.length !== 3) throw new Error("Attendu 3 lignes pour FRCB PM !");
if (parsedPm[0].IDINTCLI !== "ENT_001" || parsedPm[0].RAISOC !== "CORIS HOLDING TCHAD SA") {
    throw new Error("Ligne 1 invalide : " + JSON.stringify(parsedPm[0]));
}
if (parsedPm[1].RAISOC !== "SOCIETE NOUVELLE | INDUSTRIELLE") {
    throw new Error("Guillemets avec barre verticale non respectés : " + parsedPm[1].RAISOC);
}
console.log("  -> Ligne avec '|' interne sous guillemets gérée avec succès :", parsedPm[1].RAISOC);

// Valider avec l'audit FRCB PM
const auditPm = beacValidator.auditFrcbDataset(parsedPm, 'frcb-pm', {
    codePays: 'TD',
    codeBanque: '60002',
    numDec: '0001',
    typDec: '02',
    natDec: '01',
    decDate: '30/06/2023'
});
console.log("  -> Audit BEAC FRCB PM exécuté sur les données CSV :", {
    total: auditPm.totalDeclaredRecords,
    erreurs: auditPm.errorCount,
    statut: auditPm.statutLibelle
});
console.log("  -> SUCCESS : FRCB PM CSV (|) lu et audité sans accroc.");

// TEST 3: CDR Prêts (;) et CDR Débiteurs (|)
console.log("\n3. Test CSV pour Consolidation CDR (Prêts ; et Débiteurs |) :");
const csvPrets = `IDINTCLI;REFCONTCMPT;TYPENG;MNTENG;DATMEP;DATDEB;DATFIN;NBRECH;PERIOD;CODAGE
CLI_PP_001;PRET_001;01;5000000;01012023;01012023;31122025;36;01;00001
CLI_PP_002;PRET_002;01;10000000;15062023;15062023;15062026;36;01;00001`;

const csvDebiteurs = `IDINTCLI|REFCONTCMPT|SOLDE|DATVAL|CODAGE
ENT_001|CPT_DEB_001|2500000|30062023|00001
ENT_002|CPT_DEB_002|4800000|30062023|00001`;

const parsedPrets = parseCsvText(csvPrets, "cdr_prets.csv");
const parsedDebiteurs = parseCsvText(csvDebiteurs, "cdr_debiteurs.csv");

console.log("  -> Prêts CSV (;) :", parsedPrets.length, "lignes");
console.log("  -> Débiteurs CSV (|) :", parsedDebiteurs.length, "lignes");

if (parsedPrets[0].REFCONTCMPT !== "PRET_001" || parsedPrets[0].MNTENG !== "5000000") {
    throw new Error("Données de prêt incorrectes");
}
if (parsedDebiteurs[0].REFCONTCMPT !== "CPT_DEB_001" || parsedDebiteurs[0].SOLDE !== "2500000") {
    throw new Error("Données de débiteur incorrectes");
}
console.log("  -> SUCCESS : Prêts et Débiteurs CSV lus avec exactitude.");

// TEST 4: Vérifier les zones d'upload dans index.html
console.log("\n4. Vérification des zones de chargement (index.html) :");
const html = fs.readFileSync('app/index.html', 'utf8');
const countAccept = (html.match(/accept="\.xlsx, \.xls, \.csv"/g) || []).length;
console.log("  -> Nombre d'inputs acceptant '.xlsx, .xls, .csv' :", countAccept);
if (countAccept < 5) {
    throw new Error("Il doit y avoir au moins 5 zones d'upload acceptant .csv (PP, PM, Prêts, Encours, Débiteurs) !");
}
console.log("  -> SUCCESS : Toutes les zones d'upload acceptent les fichiers CSV.");

console.log("\n=== TOUS LES TESTS DE LECTURE CSV SONT PASSÉS AVEC SUCCÈS (100% OK) ===");
