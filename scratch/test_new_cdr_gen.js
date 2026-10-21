const XLSX = require('xlsx');

function escapeXml(unsafe) {
    return String(unsafe).replace(/[<>&"']/g, c => {
        switch (c) {
            case '<': return '&lt;'; case '>': return '&gt;';
            case '&': return '&amp;'; case '"': return '&quot;';
            case "'": return '&apos;';
        }
    });
}

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
        const d2 = parseInt(str.substring(0, 2), 10);
        const m2 = parseInt(str.substring(2, 4), 10);
        const y2 = parseInt(str.substring(4, 8), 10);
        if (y2 >= 1900 && y2 <= 2100 && m2 >= 1 && m2 <= 12 && d2 >= 1 && d2 <= 31) {
            return str;
        }
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

function buildAttrs(mapping, row, overrides = {}) {
    let attrs = "";
    for (const [xsdKey, excelKey] of Object.entries(mapping)) {
        let val = overrides[xsdKey] !== undefined ? overrides[xsdKey] : getVal(row, Array.isArray(excelKey) ? excelKey : [excelKey]);
        if (val !== "") {
            if (xsdKey.startsWith('Dat')) {
                val = formatXsdDate(val);
            }
            attrs += ` ${xsdKey}="${escapeXml(val)}"`;
        } else {
            attrs += ` ${xsdKey}=""`;
        }
    }
    return attrs;
}

function getRefVariants(ref) {
    const variants = new Set();
    const s = String(ref || '').trim();
    if (!s) return variants;

    variants.add(s);

    const unp = s.replace(/^0+/, '');
    if (unp) variants.add(unp);

    if (/^\d+$/.test(s)) {
        variants.add(s.padStart(6, '0'));
        if (s.length === 13) {
            const loan6 = s.substring(7);
            variants.add(loan6);
            const loanUnp = loan6.replace(/^0+/, '');
            if (loanUnp) variants.add(loanUnp);
        }
    }

    const m = s.match(/^[A-Za-z]+0*(\d+)$/);
    if (m) {
        variants.add(m[1]);
        const mUnp = m[1].replace(/^0+/, '');
        if (mUnp) variants.add(mUnp);
    }

    return variants;
}

function generateUnifiedCDRXmlTest(allData) {
    const encoursList = allData.encours || [];
    const encoursLookup = new Map();
    const usedEncoursIndices = new Set();

    encoursList.forEach((encRow, idx) => {
        const refKeys = [
            getVal(encRow, ['REFCONTCMPT', 'REFCONTCMPT2']),
            getVal(encRow, ['REFCONTCMPT2']),
            getVal(encRow, ['REFINT'])
        ].filter(Boolean);

        const variants = new Set();
        refKeys.forEach(k => {
            getRefVariants(k).forEach(v => variants.add(v));
        });

        variants.forEach(v => {
            if (!encoursLookup.has(v)) encoursLookup.set(v, []);
            encoursLookup.get(v).push({ encRow, idx });
        });
    });

    let itemsXml = "";
    let declaredCount = 0;

    const pretsList = allData.prets || [];
    pretsList.forEach(engRow => {
        const finalEngRef = getVal(engRow, ['REFCONTCMPT', 'REFCONTCMPT2']);
        
        let subXml = `<Consolidation RefInt="${getVal(engRow, ['REFINT']) || ''}"/>`;
        subXml += `<TitulaireEngagement IdInt="${String(getVal(engRow, ['IDINT'])).trim()}"/>`;

        const refIntGar = getVal(engRow, ['REFINTGAR']);
        if (refIntGar) {
            subXml += `<GarantieAffectee${buildAttrs({
                RefIntGar: 'REFINTGAR', NatGar: 'NATGAR', CodDevGar: 'CODDEVGAR',
                MntGar: 'MNTGAR', MntAffGar: 'MNTAFFGAR', RefExtGar: 'REFEXTGAR',
                TypRefGar: 'TYPREFGAR', IdIntGarant: 'IDINTGARANT', NomNaiGarant: 'NOMNAIGARANT',
                StatutGar: 'STATUTGAR'
            }, engRow)}/>`;
        }

        itemsXml += `<Engagement${buildAttrs({
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
        }, engRow)}>${subXml}</Engagement>\n`;
        declaredCount++;

        // Find matching encours
        const engRefKeys = [
            finalEngRef,
            getVal(engRow, ['REFCONTCMPT2']),
            getVal(engRow, ['REFINT'])
        ].filter(Boolean);

        const engVariants = new Set();
        engRefKeys.forEach(k => {
            getRefVariants(k).forEach(v => engVariants.add(v));
        });

        let matchedEncours = [];
        for (const v of engVariants) {
            const list = encoursLookup.get(v);
            if (list && list.length > 0) {
                list.forEach(item => {
                    if (!usedEncoursIndices.has(item.idx)) {
                        usedEncoursIndices.add(item.idx);
                        matchedEncours.push(item.encRow);
                    }
                });
                if (matchedEncours.length > 0) break;
            }
        }

        if (matchedEncours.length > 0) {
            matchedEncours.forEach(encRow => {
                itemsXml += `<Encours${buildAttrs({
                    RefContCmpt: ['REFCONTCMPT', 'REFCONTCMPT2'], DatPai: 'DATPAI', DatEch: 'DATECH',
                    MntPay: 'MNTPAY', MntAgi: 'MNTAGI', MntCrd: 'MNTCRD',
                    estSensible: ['ESTSENSIBLE', 'EST_SENSIBLE'], MntTotUtil: 'MNTTOTUTIL', nbrEchPay: 'NBRECHPAY',
                    nbrEchImp: 'NBRECHIMP', nbrEchRes: 'NBRECHRES', MntCreSouf: 'MNTCRESOUF',
                    MntCapSouf: 'MNTCAPSOUF', MntIntSouf: 'MNTINTSOUF', MntTaxSouf: 'MNTTAXSOUF',
                    MntAgiosSouf: 'MNTAGIOSSOUF', MntCreRat: 'MNTCRERAT', MntPro: 'MNTPRO',
                    nbrJrsImp: 'NBRJRSIMP', ClaDeprec: 'CLADEPREC'
                }, encRow, { RefContCmpt: finalEngRef })}/>\n`;
                declaredCount++;
            });
        } else {
            // Check if engRow itself has encours fields
            const hasSelfEncours = getVal(engRow, ['DATPAI', 'MNTTOTUTIL', 'DATECH', 'MNTPAY', 'MNTCRD', 'ESTSENSIBLE', 'NBRECHPAY', 'CLADEPREC']) !== '';
            if (hasSelfEncours) {
                itemsXml += `<Encours${buildAttrs({
                    RefContCmpt: ['REFCONTCMPT', 'REFCONTCMPT2'], DatPai: 'DATPAI', DatEch: 'DATECH',
                    MntPay: 'MNTPAY', MntAgi: 'MNTAGI', MntCrd: 'MNTCRD',
                    estSensible: ['ESTSENSIBLE', 'EST_SENSIBLE'], MntTotUtil: 'MNTTOTUTIL', nbrEchPay: 'NBRECHPAY',
                    nbrEchImp: 'NBRECHIMP', nbrEchRes: 'NBRECHRES', MntCreSouf: 'MNTCRESOUF',
                    MntCapSouf: 'MNTCAPSOUF', MntIntSouf: 'MNTINTSOUF', MntTaxSouf: 'MNTTAXSOUF',
                    MntAgiosSouf: 'MNTAGIOSSOUF', MntCreRat: 'MNTCRERAT', MntPro: 'MNTPRO',
                    nbrJrsImp: 'NBRJRSIMP', ClaDeprec: 'CLADEPREC'
                }, engRow, { RefContCmpt: finalEngRef })}/>\n`;
                declaredCount++;
            }
        }
    });

    // Standalone Encours (not matched with any Engagement)
    encoursList.forEach((encRow, idx) => {
        if (!usedEncoursIndices.has(idx)) {
            itemsXml += `<Encours${buildAttrs({
                RefContCmpt: ['REFCONTCMPT', 'REFCONTCMPT2'], DatPai: 'DATPAI', DatEch: 'DATECH',
                MntPay: 'MNTPAY', MntAgi: 'MNTAGI', MntCrd: 'MNTCRD',
                estSensible: ['ESTSENSIBLE', 'EST_SENSIBLE'], MntTotUtil: 'MNTTOTUTIL', nbrEchPay: 'NBRECHPAY',
                nbrEchImp: 'NBRECHIMP', nbrEchRes: 'NBRECHRES', MntCreSouf: 'MNTCRESOUF',
                MntCapSouf: 'MNTCAPSOUF', MntIntSouf: 'MNTINTSOUF', MntTaxSouf: 'MNTTAXSOUF',
                MntAgiosSouf: 'MNTAGIOSSOUF', MntCreRat: 'MNTCRERAT', MntPro: 'MNTPRO',
                nbrJrsImp: 'NBRJRSIMP', ClaDeprec: 'CLADEPREC'
            }, encRow)}/>\n`;
            declaredCount++;
        }
    });

    // Comptes Débiteurs
    const debiteursList = allData.debiteurs || [];
    debiteursList.forEach(row => {
        itemsXml += `<CompteDebiteur${buildAttrs({
            RefContCmpt: ['REFCONTCMPT', 'REFCONTCMPT3'], CodAge: ['CODAGE', 'CODAGE2'], SolDeb: 'SOLDEB',
            NbrJrsDebNonAut: 'NBRJRSDEBNONAUT', MntAgi: ['MNTAGI', 'MNTAGI2'], MntProv: 'MNTPROV', ClassDeprec: 'CLASSDEPREC'
        }, row)}><TitulaireCompte IdInt="${String(getVal(row, ['IDINT', 'IDINT2'])).trim()}" Role="${getVal(row, ['ROLE']) || '01'}"/></CompteDebiteur>\n`;
        declaredCount++;
    });

    const firstData = (allData.prets && allData.prets[0]) || (allData.encours && allData.encours[0]) || (allData.debiteurs && allData.debiteurs[0]) || {};
    let decDate = firstData.DATDEC || firstData.DATEVET || firstData.DATEVE || new Date();
    let arrDate = firstData.DATARR || firstData.DATEVET || firstData.DATEVE || new Date();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<Declaration NumDec="${getVal(firstData, 'NUMDEC') || '0001'}" CodPay="${getVal(firstData, 'CODPAY') || 'TD'}" CodDec="${getVal(firstData, 'CODDEC') || '60002'}" TypDec="51" NatDec="${getVal(firstData, 'NATDEC') || '01'}" NbrDec="${declaredCount}" DatDec="${formatXsdDate(decDate)}" DatArr="${formatXsdDate(arrDate)}" comment="${escapeXml(getVal(firstData, ['COMMENTAIRE', 'COMMENT']))}">\n`;
    xml += itemsXml;
    xml += `</Declaration>`;
    return { xml, declaredCount };
}

// Test with 5 rows of input
const inputDir = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input';
const engWb = XLSX.readFile(`${inputDir}/engagements_06_2023_v2.xlsx`, { sheetRows: 5 });
const encWb = XLSX.readFile(`${inputDir}/encours_06_2023_v2.xlsx`, { sheetRows: 5 });
const debWb = XLSX.readFile(`${inputDir}/debiteurs_06_2023_v2.xlsx`, { sheetRows: 5 });

const testData = {
    prets: XLSX.utils.sheet_to_json(engWb.Sheets[engWb.SheetNames[0]]),
    encours: XLSX.utils.sheet_to_json(encWb.Sheets[encWb.SheetNames[0]]),
    debiteurs: XLSX.utils.sheet_to_json(debWb.Sheets[debWb.SheetNames[0]])
};

const result = generateUnifiedCDRXmlTest(testData);
console.log('Generated XML snippet (first 15 lines):');
console.log(result.xml.split('\n').slice(0, 15).join('\n'));
module.exports = { generateUnifiedCDRXmlTest };
