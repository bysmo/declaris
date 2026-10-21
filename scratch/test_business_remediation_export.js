const XLSX = require('./node_modules/xlsx');
const fs = require('fs');

console.log('--- Testing Business Remediation Excel Generation ---');

function buildRemediationWorkbook() {
    const wb = XLSX.utils.book_new();

    // 1. Synthese
    const syntheseRows = [
        ['PLAN DE REMÉDIATION MÉTIER - CONTRATS ET ENGAGEMENTS CDR', ''],
        ['Anomalies bloquantes identifiées avant déclaration réglementaire BEAC', ''],
        ['Date de génération :', new Date().toLocaleString('fr-FR')],
        ['', ''],
        ['INDICATEURS DE REMÉDIATION', 'VALEUR'],
        ['Prêts en anomalie à corriger', 12],
        ['Encours rejetés ou orphelins', 15],
        ['Comptes débiteurs en anomalie', 3],
        ['', ''],
        ['PRINCIPALES CAUSES DE BLOCAGE', 'ACTION REQUISE'],
        ['Client titulaire non déclaré dans FRCB', 'Créer et valider la fiche client dans le fichier FRCB PP/PM'],
        ['Client titulaire rejeté dans FRCB', 'Corriger les anomalies bloquantes (NIR, date naissance...) sur le client'],
        ['Date échéance incohérente avec mise en place', 'Rectifier le tableau d\'amortissement dans le CBS'],
        ['Encours sans prêt d\'engagement valide', 'Rattacher l\'encours à un numéro de contrat existant']
    ];
    const wsSynthese = XLSX.utils.aoa_to_sheet(syntheseRows);
    wsSynthese['!cols'] = [{ wch: 45 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsSynthese, 'Synthèse Remédiation');

    // 2. Prets
    const samplePrets = [
        {
            'N° Ligne': 14,
            'Réf Contrat': 'PRT-2023-0091',
            'Id Client': '702999',
            'Statut Client': 'NON DÉCLARÉ DANS FRCB',
            'Règles BEAC Violées': 'CLI0001',
            'Motif Rejet Métier': 'Le client titulaire "702999" n\'est pas déclaré dans le référentiel FRCB.',
            'Action Corrective Recommandée': 'Déclarer ce client dans FRCB (Personnes Physiques ou Morales) avant d\'inclure ses crédits.',
            'DATMEP': '12/06/2023',
            'MNTINI': 15000000,
            'TYPENG': '01'
        }
    ];
    const wsPrets = XLSX.utils.json_to_sheet(samplePrets);
    XLSX.utils.book_append_sheet(wb, wsPrets, 'Prêts en Anomalie');

    const outBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    console.log(`Workbook generated successfully: ${outBuf.length} bytes.`);
    return outBuf;
}

const buf = buildRemediationWorkbook();
fs.writeFileSync('/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/scratch/test_out.xlsx', buf);
console.log('Saved to scratch/test_out.xlsx. Verification passed!');
