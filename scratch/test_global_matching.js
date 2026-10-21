const XLSX = require('xlsx');

// Let's test matching strategies
function testMatching(engFile, encFile) {
    console.log(`\n========================================`);
    console.log(`Testing: ${engFile} vs ${encFile}`);
    console.log(`========================================`);
    
    const engWb = XLSX.readFile(engFile);
    const engRows = XLSX.utils.sheet_to_json(engWb.Sheets[engWb.SheetNames[0]]);
    
    const encWb = XLSX.readFile(encFile);
    const encRows = XLSX.utils.sheet_to_json(encWb.Sheets[encWb.SheetNames[0]]);
    
    console.log(`Engagements count: ${engRows.length}`);
    console.log(`Encours count: ${encRows.length}`);
    
    // Check if engRows already has encours columns
    const hasEncoursColumnsInEng = engRows.length > 0 && ('DATPAI' in engRows[0] || 'MNTTOTUTIL' in engRows[0]);
    console.log(`Eng file has encours columns directly: ${hasEncoursColumnsInEng}`);
    
    // Strategy for building an index of engagements:
    // A loan reference can be:
    // - Exact string (e.g. "0100013367268" or "CDT0000130700200" or "CI000000003")
    // - Suffix / loan number (e.g. "367268", or "130700200", or "3")
    // - With / without agency code: fullRef might be [Country 2d][Agency 5d][LoanNumber]
    //   e.g. "01" + "00013" + "367268"
    
    // Let's build index:
    const engIndex = new Map(); // normalized key -> engRow
    
    function addKey(key, row) {
        if (!key) return;
        const s = String(key).trim();
        if (!s) return;
        if (!engIndex.has(s)) engIndex.set(s, row);
        
        // Also add unpadded (leading zeros removed) if numeric
        const unpadded = s.replace(/^0+/, '');
        if (unpadded && !engIndex.has(unpadded)) engIndex.set(unpadded, row);
    }
    
    engRows.forEach(r => {
        const ref1 = r.REFCONTCMPT;
        const ref2 = r.REFCONTCMPT2;
        const refInt = r.REFINT;
        
        addKey(ref1, r);
        addKey(ref2, r);
        addKey(refInt, r);
        
        const s1 = String(ref1 || '').trim();
        // If s1 is digits and > 7 chars (e.g. "0100013367268")
        if (s1.length > 7 && /^\d+$/.test(s1)) {
            // Suffix after 7 chars (2-digit country/bank + 5-digit agency)
            addKey(s1.substring(7), r);
        }
        // If s1 has letter prefix like CDT0000130700200
        const m = s1.match(/^[A-Za-z]+0*(\d+)$/);
        if (m) {
            addKey(m[1], r);
        }
    });
    
    let matchedEncours = 0;
    let unmatchedEncours = 0;
    
    encRows.forEach(r => {
        const ref1 = String(r.REFCONTCMPT || '').trim();
        const ref2 = String(r.REFCONTCMPT2 || '').trim();
        const refInt = String(r.REFINT || '').trim();
        
        const unpadded1 = ref1.replace(/^0+/, '');
        const unpadded2 = ref2.replace(/^0+/, '');
        
        let found = engIndex.get(ref1) || 
                    (unpadded1 && engIndex.get(unpadded1)) ||
                    (ref2 && engIndex.get(ref2)) ||
                    (unpadded2 && engIndex.get(unpadded2)) ||
                    (refInt && engIndex.get(refInt));
                    
        if (found) {
            matchedEncours++;
        } else {
            unmatchedEncours++;
        }
    });
    
    console.log(`Matched encours: ${matchedEncours} / ${encRows.length} (${(matchedEncours/encRows.length*100).toFixed(1)}%)`);
    console.log(`Unmatched encours: ${unmatchedEncours}`);
}

testMatching(
    '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input/engagements_06_2023_v2.xlsx',
    '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/input/encours_06_2023_v2.xlsx'
);

testMatching(
    '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/prets.xlsx',
    '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/encours.xlsx'
);
