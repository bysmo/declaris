const XLSX = require('./node_modules/xlsx');
const fs = require('fs');

console.log('Testing classifyAndSplitFrcbRecords and Excel generation...');

function getVal(row, keys) {
    if (!row) return '';
    for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
            return String(row[k]).trim();
        }
    }
    return '';
}

function buildFrcbBusinessRemediationExcelBlob(rejectedItems, type, context = {}) {
    const isPp = type === 'frcb-pp' || type === 'PP';
    const wb = XLSX.utils.book_new();

    const syntheseData = [
        ['PLAN DE REMÉDIATION MÉTIER - FRCB ' + (isPp ? 'PERSONNES PHYSIQUES' : 'PERSONNES MORALES'), ''],
        ['Généré le ' + new Date().toLocaleString('fr-FR'), ''],
        ['Nombre de clients en anomalie bloquante :', rejectedItems.length]
    ];
    const wsSynthese = XLSX.utils.aoa_to_sheet(syntheseData);
    XLSX.utils.book_append_sheet(wb, wsSynthese, 'Synthèse Remédiation');

    const clientsRows = rejectedItems.map(item => ({
        'N° Ligne': item.line,
        'Identifiant Client': item.idCli,
        'Raison Rejet': item.reason
    }));
    const wsClients = XLSX.utils.json_to_sheet(clientsRows);
    XLSX.utils.book_append_sheet(wb, wsClients, 'Clients à Corriger');

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    return buf;
}

const sampleRejected = [
    { line: 5, idCli: '12345', reason: '[DATNAISS] Date de naissance dans le futur' },
    { line: 8, idCli: '67890', reason: '[NIN0001] NIR invalide' }
];

const buf = buildFrcbBusinessRemediationExcelBlob(sampleRejected, 'frcb-pp');
console.log('Excel Buffer size:', buf.length);
console.log('Test successful!');
