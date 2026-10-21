const { getRefVariants } = require('./test_pairing_logic.js');

function test(engRef, encRef) {
    console.log(`Testing EngRef: "${engRef}" vs EncRef: "${encRef}"`);
    // Variants for engRef
    const engVariants = [engRef];
    const s = String(engRef).trim();
    if (s.length === 13 && /^\d+$/.test(s)) {
        engVariants.push(s.substring(7));
        engVariants.push(s.substring(7).replace(/^0+/, ''));
    }
    const m = s.match(/^[A-Za-z]+0*(\d+)$/);
    if (m) {
        engVariants.push(m[1]);
        engVariants.push(m[1].replace(/^0+/, ''));
    }
    
    const encS = String(encRef).trim();
    const encVariants = [encS, encS.replace(/^0+/, ''), encS.padStart(6, '0')];
    
    const match = engVariants.some(v => encVariants.includes(v));
    console.log(`- Eng variants:`, engVariants);
    console.log(`- Enc variants:`, encVariants);
    console.log(`- MATCH? ${match}\n`);
}

test('0100013367268', '367268');
test('0100001450864', '450864');
test('CDT0000130700200', 'CDT0000130700200');
test('CDT0000130700200', '130700200');
test('0100001000016', '000016');
test('0100001000016', '16');
test('CI000000392', 'CI000000392');
