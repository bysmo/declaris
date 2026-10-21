const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Helper functions matching our proposed JavaScript implementation
function getVal(row, keys) {
    if (!Array.isArray(keys)) keys = [keys];
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null) {
            const val = String(row[key]).trim();
            if (val !== '') return val;
        }
        const lowerKey = key.toLowerCase();
        for (const [rKey, rVal] of Object.entries(row)) {
            if (rKey.toLowerCase().trim() === lowerKey) {
                const val = String(rVal).trim();
                if (val !== '') return val;
            }
        }
    }
    return '';
}

function padNumDec(val) {
    return String(val || '0001').trim().padStart(4, '0');
}

function formatXsdDate(val) {
    if (!val) return "";
    let str = String(val).trim();
    if (str === "") return "";

    if (!isNaN(str) && typeof val === 'number' && val > 10000) {
        try {
            const date = XLSX.SSF.parse_date_code(val);
            return `${String(date.d).padStart(2, '0')}${String(date.m).padStart(2, '0')}${date.y}`;
        } catch (e) {}
    }

    let match = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (match) {
        return `${match[1].padStart(2, '0')}${match[2].padStart(2, '0')}${match[3]}`;
    }

    match = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (match) {
        return `${match[3].padStart(2, '0')}${match[2].padStart(2, '0')}${match[1]}`;
    }

    if (/^\d{8}$/.test(str)) {
        // Distinguer entre DDMMYYYY et YYYYMMDD
        // Dans DDMMYYYY:
        // - Jour (d2): 1er et 2e chiffres (01-31)
        // - Mois (m2): 3e et 4e chiffres (01-12)
        // - Année (y2): 5e à 8e chiffres (1900-2100)
        const d2 = parseInt(str.substring(0, 2), 10);
        const m2 = parseInt(str.substring(2, 4), 10);
        const y2 = parseInt(str.substring(4, 8), 10);

        if (y2 >= 1900 && y2 <= 2100 && m2 >= 1 && m2 <= 12 && d2 >= 1 && d2 <= 31) {
            return str;
        }

        // Dans YYYYMMDD:
        // - Année (y1): 1er à 4e chiffres (1900-2100)
        // - Mois (m1): 5e et 6e chiffres (01-12)
        // - Jour (d1): 7e et 8e chiffres (01-31)
        const y1 = parseInt(str.substring(0, 4), 10);
        const m1 = parseInt(str.substring(4, 6), 10);
        const d1 = parseInt(str.substring(6, 8), 10);

        if (y1 >= 1900 && y1 <= 2100 && m1 >= 1 && m1 <= 12 && d1 >= 1 && d1 <= 31) {
            return `${str.substring(6, 8)}${str.substring(4, 6)}${str.substring(0, 4)}`;
        }

        return str;
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        return `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
    }

    return str;
}

function escapeXml(unsafe) {
    return String(unsafe).replace(/[<>&"']/g, c => {
        switch (c) {
            case '<': return '&lt;'; case '>': return '&gt;';
            case '&': return '&amp;'; case '"': return '&quot;';
            case "'": return '&apos;';
        }
    });
}

function buildAttrs(mapping, row) {
    let attrs = "";
    for (const [xsdKey, excelKey] of Object.entries(mapping)) {
        let val = getVal(row, Array.isArray(excelKey) ? excelKey : [excelKey]);
        if (val !== "") {
            if (xsdKey.startsWith('Dat') || xsdKey === 'DatMep' || xsdKey === 'DatDeb' || xsdKey === 'DatFin' || xsdKey === 'DatPai' || xsdKey === 'DatEch' || xsdKey === 'DatCre' || xsdKey === 'DatEntRelPar') {
                val = formatXsdDate(val);
            }
            attrs += ` ${xsdKey}="${escapeXml(val)}"`;
        } else {
            attrs += ` ${xsdKey}=""`;
        }
    }
    return attrs;
}

function buildPieceIdentiteXml(row) {
    const typPiece = getVal(row, ['TYPPIECE', 'TYP_PIECE', 'TYPEPIECE']) || '01';
    const numPiece = getVal(row, ['NUMPIECE', 'NUM_PIECE', 'NUMEROPIECE', 'REF_PIECE']) || 'PND';
    const datEmPiece = formatXsdDate(getVal(row, ['DATEMPIECE', 'DATE_EMISSION', 'DAT_EM_PIECE']) || '01011999');
    const lieu = getVal(row, ['LIEU_PIECE', 'LIEU', 'VILLENAI']) || 'NDJAMENA';
    const pays = getVal(row, ['PAYS_PIECE', 'PAYSRES', 'PAYSNAI', 'PAYS']) || 'TD';
    const datFinPiece = formatXsdDate(getVal(row, ['DATFINPIECE', 'DATE_EXPIRATION', 'DAT_FIN_PIECE']) || '01012099');
    
    return `<PieceIdentite TypPiece="${escapeXml(typPiece)}" NumPiece="${escapeXml(numPiece)}" DatEmPiece="${escapeXml(datEmPiece)}" Lieu="${escapeXml(lieu)}" Pays="${escapeXml(pays)}" DatFinPiece="${escapeXml(datFinPiece)}"/>`;
}

function buildAdressesXml(row, defaultTypAdr) {
    const typAdr = getVal(row, ['TYPADR', 'TYP_ADR', 'TYPEADR']) || defaultTypAdr;
    
    let adresse = getVal(row, ['ADRESSE', 'ADR', 'RUE']);
    if (!adresse) {
        if (defaultTypAdr === '01') {
            const nom = getVal(row, ['NOM']) || '';
            const prenom = getVal(row, ['PRENOM']) || '';
            adresse = `${nom} ${prenom}`.trim() || 'PND';
        } else {
            adresse = getVal(row, ['RAISOC']) || 'PND';
        }
    }
    
    const pays = getVal(row, ['PAYSADR', 'PAYSRES', 'PAYSSIEGE', 'PAYS']) || 'TD';
    
    let region = getVal(row, ['REGION', 'REG']) || '201';
    region = String(region).trim().substring(0, 3);
    if (region.length < 3) region = region.padStart(3, '0');
    
    let ville = getVal(row, ['VILLE']) || '210';
    ville = String(ville).trim().substring(0, 3);
    if (ville.length < 3) ville = ville.padStart(3, '0');
    
    const codPost = getVal(row, ['CODPOST', 'CODEPOSTAL', 'BP', 'CP']) || '';
    
    return `<Adresses TypAdr="${escapeXml(typAdr)}" Adresse="${escapeXml(adresse)}" Pays="${escapeXml(pays)}" Region="${escapeXml(region)}" Ville="${escapeXml(ville)}" CodPost="${escapeXml(codPost)}"/>`;
}

function buildMandatairePPXml(row) {
    const idIntMand = getVal(row, ['IDINTMAND', 'ID_MAND']);
    const qualiteMand = getVal(row, ['QUALITEMAND', 'QUALITE_MAND']);
    if (!idIntMand && !qualiteMand) return '';
    return `<Mandataire IdIntMand="${escapeXml(idIntMand || '')}" QualiteMand="${escapeXml(qualiteMand || '')}"/>`;
}

function buildEmployeurXml(row) {
    const raiSocEmp = getVal(row, ['RAISOCEMP', 'EMPLOYEUR']);
    const rccmEmp = getVal(row, ['RCCMEMP']);
    const sectActEmp = getVal(row, ['SECTACTEMP']);
    const staEmp = getVal(row, ['STAEMP']);
    const datEntEmp = formatXsdDate(getVal(row, ['DATENTEMP']));
    const fonEmp = getVal(row, ['FONEMP']);
    
    if (!raiSocEmp && !rccmEmp && !sectActEmp && !staEmp && !datEntEmp && !fonEmp) return '';
    
    let attrs = '';
    if (raiSocEmp) attrs += ` RaiSocEmp="${escapeXml(raiSocEmp)}"`;
    if (rccmEmp) attrs += ` RccmEmp="${escapeXml(rccmEmp)}"`;
    if (sectActEmp) attrs += ` SectActEmp="${escapeXml(sectActEmp)}"`;
    if (staEmp) attrs += ` StaEmp="${escapeXml(staEmp)}"`;
    if (datEntEmp) attrs += ` DatEntEmp="${escapeXml(datEntEmp)}"`;
    if (fonEmp) attrs += ` FonEmp="${escapeXml(fonEmp)}"`;
    
    return `<Employeur${attrs}/>`;
}

function buildAutresRelationsXml(row) {
    const idIntRel = getVal(row, ['IDINTREL']);
    const nomRel = getVal(row, ['NOMREL']);
    const prenomRel = getVal(row, ['PRENOMREL']);
    const typRel = getVal(row, ['TYPREL']);
    
    if (!idIntRel && !nomRel && !prenomRel && !typRel) return '';
    return `<AutresRelations IdIntRel="${escapeXml(idIntRel || '')}" NomRel="${escapeXml(nomRel || '')}" PrenomRel="${escapeXml(prenomRel || '')}" TypRel="${escapeXml(typRel || '')}"/>`;
}

function buildInfosAdditionnellesXml(row) {
    const nbrPerCh = getVal(row, ['NBRPERCH']);
    const typLog = getVal(row, ['TYPLOG']);
    const revMenNet = getVal(row, ['REVMENNET']);
    const codDev = getVal(row, ['CODDEVADD', 'CODDEV']);
    
    if (nbrPerCh === '' && typLog === '' && revMenNet === '' && codDev === '') return '';
    
    let attrs = '';
    if (nbrPerCh !== '') attrs += ` NbrPerCh="${escapeXml(nbrPerCh)}"`;
    if (typLog !== '') attrs += ` TypLog="${escapeXml(typLog)}"`;
    if (revMenNet !== '') attrs += ` RevMenNet="${escapeXml(revMenNet)}"`;
    if (codDev !== '') attrs += ` CodDev="${escapeXml(codDev)}"`;
    
    return `<InformationsAdditionnelles${attrs}/>`;
}

function buildMandatairePMXml(row) {
    const idIntMand = getVal(row, ['IDINTMAND']);
    const typMand = getVal(row, ['TYPMAND']);
    const datDebMand = formatXsdDate(getVal(row, ['DATDEBMAND']));
    const datFinMand = formatXsdDate(getVal(row, ['DATFINMAND']));
    
    if (!idIntMand && !typMand && !datDebMand && !datFinMand) return '';
    return `<Mandataire IdIntMand="${escapeXml(idIntMand || '')}" TypMand="${escapeXml(typMand || '')}" DatDebMand="${escapeXml(datDebMand || '')}" DatFinMand="${escapeXml(datFinMand || '')}"/>`;
}

function buildActionnairesXml(row) {
    const idIntAct = getVal(row, ['IDINTACT']);
    const nomAct = getVal(row, ['NOMACT']);
    const pctAct = getVal(row, ['PCTACT']);
    const datDebAct = formatXsdDate(getVal(row, ['DATDEBACT']));
    const datFinAct = formatXsdDate(getVal(row, ['DATFINACT']));
    const datMajAct = formatXsdDate(getVal(row, ['DATMAJACT']));
    const telAct = getVal(row, ['TELACT']);
    
    if (!idIntAct && !nomAct && !pctAct && !datDebAct && !datFinAct && !datMajAct && !telAct) return '';
    
    let attrs = '';
    if (idIntAct) attrs += ` IdIntAct="${escapeXml(idIntAct)}"`;
    if (nomAct) attrs += ` NomAct="${escapeXml(nomAct)}"`;
    if (pctAct) attrs += ` PctAct="${escapeXml(pctAct)}"`;
    if (datDebAct) attrs += ` DatDebAct="${escapeXml(datDebAct)}"`;
    if (datFinAct) attrs += ` DatFinAct="${escapeXml(datFinAct)}"`;
    if (datMajAct) attrs += ` DatMajAct="${escapeXml(datMajAct)}"`;
    if (telAct) attrs += ` TelAct="${escapeXml(telAct)}"`;
    
    return `<Actionnaires${attrs}/>`;
}

function generateFRCB(data, type) {
    const first = data[0] || {};
    const typDec = type === 'frcb-pp' ? '01' : '02';
    const decDate = first.DATDEC || first.DATEVET || first.DATEVE || new Date();
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<Declaration NumDec="${padNumDec(first.NUMDEC || '0001')}" CodPay="${first.CODPAY || 'BF'}" CodDec="${first.CODE || first.CODDEC || ''}" TypDec="${typDec}" NatDec="${first.NATDEC || '00'}" NbrDec="${data.length}" DatDec="${formatXsdDate(decDate)}" comment="${escapeXml(first.COMMENTAIRE || first.COMMENT || '')}">\n`;
    
    data.forEach(row => {
        if (type === 'frcb-pp') {
            xml += `  <EntetePersonnePhysique IdIntCli="${String(row.IDINTCLI).trim()}">\n`;
            xml += `    <PersonnePhysique${buildAttrs({
                NIF_NIU: 'NIF_NIU', Sexe: 'SEXE', Nom: 'NOM', NomMar: 'NOMMAR',
                Prenom: 'PRENOM', NomComplet: 'NOMCOMPLET', PreNai: 'PRENAI',
                DatNai: 'DATNAI', VilleNai: 'VILLENAI', PaysNai: 'PAYSNAI',
                Statut: 'STATUT', Resident: 'RESIDENT', PaysRes: 'PAYSRES',
                NatCli: 'NATCLI', NomPere: 'NOMPERE', PrePere: 'PREPERE',
                NomMere: 'NOMMERE', PreMere: 'PREMERE', SitMat: 'SITMAT',
                AgeEco: 'AGEECO', RCCM: 'RCCM', SectAct: 'SECTACT',
                CA: 'CA', NombEmp: 'NOMBEMP', SitJud: 'SITJUD',
                DatDebInt: ['DATDEBLNT', 'DATDEBINT'], DatFinInt: ['DATFINLNT', 'DATFININT'],
                DatEntRelPar: 'DATENTRELPAR', Email: 'EMAIL', Mobile: 'MOBILE',
                DatEve: 'DATEVE'
            }, row)}>\n`;
            xml += `      ${buildPieceIdentiteXml(row)}\n`;
            xml += `      ${buildAdressesXml(row, '01')}\n`;
            
            const mandXml = buildMandatairePPXml(row);
            if (mandXml) xml += `      ${mandXml}\n`;
            
            const empXml = buildEmployeurXml(row);
            if (empXml) xml += `      ${empXml}\n`;
            
            const otherRelXml = buildAutresRelationsXml(row);
            if (otherRelXml) xml += `      ${otherRelXml}\n`;
            
            const addInfoXml = buildInfosAdditionnellesXml(row);
            if (addInfoXml) xml += `      ${addInfoXml}\n`;

            xml += `    </PersonnePhysique>\n`;
            xml += `  </EntetePersonnePhysique>\n`;
        } else {
            xml += `  <EntetePersonneMorale IdIntCli="${String(row.IDINTCLI).trim()}">\n`;
            xml += `    <PersonneMorale${buildAttrs({
                NIF_NIU: 'NIF_NIU', RaiSoc: 'RAISOC', DatCre: 'DATCRE',
                Sigle: 'SIGLE', Resident: 'RESIDENT', PaysSiege: 'PAYSSIEGE',
                Ville: 'VILLE', RCCM: 'RCCM', ForJurid: ['FORJURID', 'FJU'],
                SecAct: ['SECACT', 'SECTACT'], AgeEco: 'AGEECO', StaLeg: 'STALEG',
                DatEntRelPar: 'DATENTRELPAR', ChiAffaire: 'CHIAFFAIRE',
                TotBilan: 'TOTBILAN', Effectif: 'EFFECTIF', Email: 'EMAIL',
                Tel: ['TEL', 'MOBILE'], SitJud: 'SITJUD', 
                DatDebInt: ['DATDEBLNT', 'DATDEBINT'], DatFinInt: ['DATFINLNT', 'DATFININT'],
                DatEve: 'DATEVE'
            }, row)}>\n`;
            xml += `      ${buildAdressesXml(row, '03')}\n`;
            
            const mandXml = buildMandatairePMXml(row);
            if (mandXml) xml += `      ${mandXml}\n`;
            
            const actionnairesXml = buildActionnairesXml(row);
            if (actionnairesXml) xml += `      ${actionnairesXml}\n`;
            
            const otherRelXml = buildAutresRelationsXml(row);
            if (otherRelXml) xml += `      ${otherRelXml}\n`;

            xml += `    </PersonneMorale>\n`;
            xml += `  </EntetePersonneMorale>\n`;
        }
    });
    
    xml += `</Declaration>`;
    return xml;
}

function generateUnifiedCDRXml(allData) {
    const pretsMap = new Map();
    allData.prets.forEach(row => {
        const ref = getVal(row, ['REFCONTCMPT', 'REFCONTCMPT2']);
        if (ref) {
            if (!pretsMap.has(ref)) pretsMap.set(ref, []);
            pretsMap.get(ref).push(row);
        }
    });

    const encoursMap = new Map();
    allData.encours.forEach(row => {
        const ref = getVal(row, ['REFCONTCMPT2', 'REFCONTCMPT']);
        if (ref) {
            if (!encoursMap.has(ref)) encoursMap.set(ref, []);
            encoursMap.get(ref).push(row);
        }
    });

    const allRefs = new Set([...pretsMap.keys(), ...encoursMap.keys()]);

    const firstData = allData.prets[0] || allData.encours[0] || allData.debiteurs[0] || {};
    const totalRows = allData.prets.length + allData.encours.length + allData.debiteurs.length;
    const decDate = firstData.DATDEC || firstData.DATEVET || firstData.DATEVE || new Date();
    const arrDate = firstData.DATARR || firstData.DATEVET || firstData.DATEVE || new Date();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<Declaration NumDec="${padNumDec(firstData.NUMDEC || '0001')}" CodPay="${firstData.CODPAY || 'BF'}" CodDec="${firstData.CODDEC || ''}" TypDec="51" NatDec="${firstData.NATDEC || '01'}" NbrDec="${totalRows}" DatDec="${formatXsdDate(decDate)}" DatArr="${formatXsdDate(arrDate)}" comment="${escapeXml(firstData.COMMENTAIRE || firstData.COMMENT || '')}">\n`;

    allRefs.forEach(ref => {
        const pretsRows = pretsMap.get(ref) || [];
        const encoursRows = encoursMap.get(ref) || [];

        const maxLen = Math.max(pretsRows.length, encoursRows.length);
        for (let i = 0; i < maxLen; i++) {
            if (i < pretsRows.length) {
                const row = pretsRows[i];
                xml += `  <Engagement${buildAttrs({
                    RefContCmpt: ['REFCONTCMPT', 'REFCONTCMPT2'], CodAge: 'CODAGE', Statut: 'STATUT',
                    NatConso: 'NATCONSO', TypConso: 'TYPCONSO', Motif: 'MOTIF',
                    TypEng: 'TYPENG', NatEng: 'NATENG', CodDev: 'CODDEV',
                    MntEng: 'MNTENG', MntCrCedee: 'MNTCRCEDEE', MntEpargne: 'MNTEPARGNE',
                    ModRembEpargne: 'MODREMBEPARGNE', TauxRenum: 'TAUXRENUM', DatMep: 'DATMEP',
                    TxInt: 'TXINT', TxComm: 'TXCOMM', TxBonifie: 'TXBONIFIE',
                    TxEffGlob: 'TXEFFGLOB', TypTxInt: 'TYPTXINT', IndRef: 'INDREF',
                    Sprd: 'SPRD', DatDeb: 'DATDEB', DatFin: 'DATFIN',
                    Periodicite: 'PERIODICITE', UnitDur: 'UNITDUR', Duree: 'DUREE',
                    Maturite: 'MATURITE', DatPreEchCap: 'DATPREECHCAP', NbrEch: 'NBRECH',
                    MoyRem: 'MOYREM', TypEch: 'TYPECH', MntEch: 'MNTECH',
                    TypAmo: 'TYPAMO', TotInt: 'TOTINT', fraDos: 'FRADOS',
                    fraAnnexe: 'FRAANNEXE', MntPrm: 'MNTPRM', MntTax: 'MNTTAX',
                    DatEve: 'DATEVE'
                }, row)}>\n`;

                xml += `    <Consolidation RefInt="${getVal(row, ['REFINT']) || ''}"/>\n`;
                xml += `    <TitulaireEngagement IdInt="${String(getVal(row, ['IDINT'])).trim()}"/>\n`;

                const refIntGar = getVal(row, ['REFINTGAR']);
                if (refIntGar) {
                    xml += `    <GarantieAffectee${buildAttrs({
                        RefIntGar: 'REFINTGAR', NatGar: 'NATGAR', CodDevGar: 'CODDEVGAR',
                        MntGar: 'MNTGAR', MntAffGar: 'MNTAFFGAR', RefExtGar: 'REFEXTGAR',
                        TypRefGar: 'TYPREFGAR', IdIntGarant: 'IDINTGARANT', NomNaiGarant: 'NOMNAIGARANT',
                        StatutGar: 'STATUTGAR'
                    }, row)}/>\n`;
                }
                xml += `  </Engagement>\n`;
            }

            if (i < encoursRows.length) {
                const row = encoursRows[i];
                xml += `  <Encours${buildAttrs({
                    RefContCmpt: ['REFCONTCMPT2', 'REFCONTCMPT'], DatPai: 'DATPAI', DatEch: 'DATECH',
                    MntPay: 'MNTPAY', MntAgi: 'MNTAGI', MntCrd: 'MNTCRD',
                    estSensible: ['ESTSENSIBLE', 'EST_SENSIBLE'], MntTotUtil: 'MNTTOTUTIL', nbrEchPay: 'NBRECHPAY',
                    nbrEchImp: 'NBRECHIMP', nbrEchRes: 'NBRECHRES', MntCreSouf: 'MNTCRESOUF',
                    MntCapSouf: 'MNTCAPSOUF', MntIntSouf: 'MNTINTSOUF', MntTaxSouf: 'MNTTAXSOUF',
                    MntAgiosSouf: 'MNTAGIOSSOUF', MntCreRat: 'MNTCRERAT', MntPro: 'MNTPRO',
                    nbrJrsImp: 'NBRJRSIMP', ClaDeprec: 'CLADEPREC'
                }, row)}/>\n`;
            }
        }
    });

    allData.debiteurs.forEach(row => {
        xml += `  <CompteDebiteur${buildAttrs({
            RefContCmpt: 'REFCONTCMPT3', CodAge: 'CODAGE2', SolDeb: 'SOLDEB',
            NbrJrsDebNonAut: 'NBRJRSDEBNONAUT', MntAgi: 'MNTAGI2', MntProv: 'MNTPROV', ClassDeprec: 'CLASSDEPREC'
        }, row)}>\n`;
        xml += `    <TitulaireCompte IdInt="${String(getVal(row, ['IDINT2'])).trim()}" Role="${getVal(row, ['ROLE']) || '01'}"/>\n`;
        xml += `  </CompteDebiteur>\n`;
    });

    xml += `</Declaration>`;
    return xml;
}

// Test harness
function loadExcel(file) {
    const filePath = path.join('/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source', file);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet, { defval: "" });
}

console.log('Loading Excel files...');
const ppData = loadExcel('personnes_physiques_06_2023.xlsx');
const pmData = loadExcel('personnes_morales_06_2023.xlsx');
const pretsData = loadExcel('prets.xlsx');
const encoursData = loadExcel('encours.xlsx');
const debiteursData = loadExcel('debiteurs_06_2023.xlsx');

console.log('Generating FRCB PP XML...');
const ppXml = generateFRCB(ppData, 'frcb-pp');
fs.writeFileSync('scratch/test_pp.xml', ppXml);

console.log('Generating FRCB PM XML...');
const pmXml = generateFRCB(pmData, 'frcb-pm');
fs.writeFileSync('scratch/test_pm.xml', pmXml);

console.log('Generating CDR Unified XML...');
const cdrXml = generateUnifiedCDRXml({ prets: pretsData, encours: encoursData, debiteurs: debiteursData });
fs.writeFileSync('scratch/test_cdr.xml', cdrXml);

console.log('Done generating test XMLs! Checking first few lines...');
console.log('\n--- PP XML Header: ---');
console.log(ppXml.substring(0, 500));
console.log('\n--- PM XML Header: ---');
console.log(pmXml.substring(0, 500));
console.log('\n--- CDR XML Header: ---');
console.log(cdrXml.substring(0, 500));
