// Simple scratch script to test date formatting fixes
function formatXsdDate(val) {
    if (val === null || val === undefined) return "";

    let str = String(val).trim();
    if (str === "") return "";

    // Format DD/MM/YYYY ou DD-MM-YYYY
    let match = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (match) {
        return `${match[1].padStart(2, '0')}${match[2].padStart(2, '0')}${match[3]}`;
    }

    // Format YYYY/MM/DD ou YYYY-MM-DD
    match = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (match) {
        return `${match[3].padStart(2, '0')}${match[2].padStart(2, '0')}${match[1]}`;
    }

    // Cas : déjà au format DDMMYYYY ou YYYYMMDD (8 chiffres)
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
            return str; // C'est déjà au format DDMMYYYY, on le renvoie tel quel
        }

        // Dans YYYYMMDD:
        // - Année (y1): 1er à 4e chiffres (1900-2100)
        // - Mois (m1): 5e et 6e chiffres (01-12)
        // - Jour (d1): 7e et 8e chiffres (01-31)
        const y1 = parseInt(str.substring(0, 4), 10);
        const m1 = parseInt(str.substring(4, 6), 10);
        const d1 = parseInt(str.substring(6, 8), 10);

        if (y1 >= 1900 && y1 <= 2100 && m1 >= 1 && m1 <= 12 && d1 >= 1 && d1 <= 31) {
            // C'est YYYYMMDD, on le transforme en DDMMYYYY
            return `${str.substring(6, 8)}${str.substring(4, 6)}${str.substring(0, 4)}`;
        }

        // Si ce n'est pas un format valide reconnu, on renvoie la chaîne d'origine
        return str;
    }

    // Fallback JS Date
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        return `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
    }

    return str;
}

// Test cases
const testCases = [
    { input: "20012006", expected: "20012006", desc: "DDMMYYYY (20 Jan 2006) should not be altered" },
    { input: "20060120", expected: "20012006", desc: "YYYYMMDD (20 Jan 2006) should be converted to DDMMYYYY" },
    { input: "31122020", expected: "31122020", desc: "DDMMYYYY (31 Dec 2020) should not be altered" },
    { input: "20201231", expected: "31122020", desc: "YYYYMMDD (31 Dec 2020) should be converted to DDMMYYYY" },
    { input: "01012025", expected: "01012025", desc: "DDMMYYYY (01 Jan 2025) should not be altered" },
    { input: "20250101", expected: "01012025", desc: "YYYYMMDD (01 Jan 2025) should be converted to DDMMYYYY" },
    { input: "20/01/2006", expected: "20012006", desc: "DD/MM/YYYY should be formatted" },
    { input: "2006-01-20", expected: "20012006", desc: "YYYY-MM-DD should be formatted" },
    { input: "2025-05-29", expected: "29052025", desc: "YYYY-MM-DD should be formatted" }
];

let failed = 0;
for (const tc of testCases) {
    const result = formatXsdDate(tc.input);
    if (result !== tc.expected) {
        console.error(`FAIL: ${tc.desc} (input: "${tc.input}")`);
        console.error(`  Got:      "${result}"`);
        console.error(`  Expected: "${tc.expected}"`);
        failed++;
    } else {
        console.log(`PASS: ${tc.desc} -> "${result}"`);
    }
}

if (failed === 0) {
    console.log("All tests passed!");
} else {
    console.error(`${failed} tests failed!`);
}
