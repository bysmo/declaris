const fs = require('fs');
const xmlPath = '/Users/modestemariebegninesomda/Documents/Coris Holding/declaris/source/modeles-valides/TD-60002-0001-31032025-01-DEC.xml';
const xmlContent = fs.readFileSync(xmlPath, 'utf8');

const ids = ['102053', '114328', '106752', '106948', '100594'];

ids.forEach(id => {
    const regex = new RegExp(`<EntetePersonnePhysique IdIntCli="${id}">[\\s\\S]*?<\\/EntetePersonnePhysique>`);
    const match = xmlContent.match(regex);
    if (match) {
        console.log(`XML Block for ${id}:\n`, match[0]);
    } else {
        console.log(`No match for ${id}`);
    }
});
