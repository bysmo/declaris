const { generateUnifiedCDRXmlTest } = require('./test_new_cdr_gen.js');

const engRow = {
    REFCONTCMPT: '0100013367268',
    CODAGE: '00013',
    STATUT: '00',
    TYPENG: '01',
    MNTENG: '840000',
    IDINT: '600989'
};

const encRow = {
    REFCONTCMPT: '367268',
    DATPAI: '25032016',
    DATECH: '25042016',
    MNTPAY: '104871',
    MNTTOTUTIL: '840000'
};

const testData = {
    prets: [engRow],
    encours: [encRow],
    debiteurs: []
};

const result = generateUnifiedCDRXmlTest(testData);
console.log(result.xml);
