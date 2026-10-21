const fs = require('fs');

// --- 1. MISE À JOUR DE APP/INDEX.HTML ---
let html = fs.readFileSync('app/index.html', 'utf8');

// Remplacer les accept=".xlsx, .xls" par accept=".xlsx, .xls, .csv"
html = html.replace(/<input type="file" class="file-input" accept="\.xlsx, \.xls" hidden>/g, '<input type="file" class="file-input" accept=".xlsx, .xls, .csv" hidden>');

// Remplacer les libellés de bouton
html = html.replace(/<button type="button" class="btn-outline">Choisir un fichier Excel<\/button>/g, '<button type="button" class="btn-outline">Choisir un fichier Excel ou CSV</button>');

// Remplacer la description CDR
html = html.replace(
    '<p>Importez vos extractions (Prêts, Encours, Débiteurs) pour générer le fichier XML\n                                        réglementaire unique.</p>',
    '<p>Importez vos extractions (Prêts, Encours, Débiteurs au format Excel ou CSV délimité par ; ou |) pour générer le fichier XML réglementaire unique.</p>'
);

fs.writeFileSync('app/index.html', html, 'utf8');
console.log("app/index.html updated successfully with CSV support.");

// --- 2. MISE À JOUR DE APP/APP.JS ---
let appJs = fs.readFileSync('app/app.js', 'utf8');

// A. Mettre à jour handleFileSelect pour accepter .csv
const oldExtCheck = "const fileNameLower = file.name.toLowerCase();\n        if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')) {";
const newExtCheck = `const fileNameLower = file.name.toLowerCase();
        if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls') || fileNameLower.endsWith('.csv')) {`;

if (!appJs.includes(oldExtCheck)) throw new Error("oldExtCheck not found in app.js");
appJs = appJs.replace(oldExtCheck, newExtCheck);

// Mettre à jour les messages de notification et d'erreur dans handleFileSelect
const oldFileNotif = `            const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
            Logger.info(\`Fichier sélectionné pour [\${getZoneLabel(type)}] : \${file.name} (\${sizeMb} Mo)\`);
            AppNotify.info("Fichier Excel sélectionné", \`\${getZoneLabel(type)} : \${file.name} (\${sizeMb} Mo)\`);`;

const newFileNotif = `            const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
            const isCsv = fileNameLower.endsWith('.csv');
            const typeFmt = isCsv ? 'CSV' : 'Excel';
            Logger.info(\`Fichier sélectionné pour [\${getZoneLabel(type)}] : \${file.name} (\${sizeMb} Mo, format \${typeFmt})\`);
            AppNotify.info(\`Fichier \${typeFmt} sélectionné\`, \`\${getZoneLabel(type)} : \${file.name} (\${sizeMb} Mo)\`);`;

if (!appJs.includes(oldFileNotif)) throw new Error("oldFileNotif not found in app.js");
appJs = appJs.replace(oldFileNotif, newFileNotif);

const oldErrorBlock = `        } else {
            const msg = 'Format non supporté. Veuillez sélectionner un fichier Excel (.xlsx ou .xls)';
            Logger.warn(\`Sélection rejetée pour [\${getZoneLabel(type)}] : \${file.name} (type incorrect)\`);
            showStatus(msg, true);
            showErrorCard(msg, '', 'Sélection de fichier');
            AppNotify.error("Format de fichier non supporté", \`\${file.name} n'est pas un fichier Excel (.xlsx ou .xls)\`);
            AppDialog.show({
                type: 'error',
                title: 'Format Excel Invalide',
                message: \`Le fichier sélectionné "\${file.name}" n'a pas un format Excel supporté.\`,
                bodyHtml: '<p style="color:#64748b; font-size:0.9rem; margin-top:8px;">Seuls les classeurs Microsoft Excel (<strong>.xlsx</strong> ou <strong>.xls</strong>) sont acceptés pour cette zone de chargement.</p>',
                confirmText: 'Compris',
                confirmIcon: 'fa-solid fa-check',
                cancelText: null
            });
        }`;

const newErrorBlock = `        } else {
            const msg = 'Format non supporté. Veuillez sélectionner un fichier Excel (.xlsx, .xls) ou CSV (.csv avec séparateur ; ou |)';
            Logger.warn(\`Sélection rejetée pour [\${getZoneLabel(type)}] : \${file.name} (type incorrect)\`);
            showStatus(msg, true);
            showErrorCard(msg, '', 'Sélection de fichier');
            AppNotify.error("Format non supporté", \`\${file.name} n'est ni un fichier Excel (.xlsx, .xls) ni un fichier CSV (.csv)\`);
            AppDialog.show({
                type: 'error',
                title: 'Format Invalide',
                message: \`Le fichier sélectionné "\${file.name}" n'a pas un format supporté.\`,
                bodyHtml: '<p style="color:#64748b; font-size:0.9rem; margin-top:8px;">Seuls les classeurs Microsoft Excel (<strong>.xlsx</strong>, <strong>.xls</strong>) et fichiers texte délimités (<strong>.csv</strong> avec séparateur <strong>;</strong> ou <strong>|</strong>) sont acceptés.</p>',
                confirmText: 'Compris',
                confirmIcon: 'fa-solid fa-check',
                cancelText: null
            });
        }`;

if (!appJs.includes(oldErrorBlock)) throw new Error("oldErrorBlock not found in app.js");
appJs = appJs.replace(oldErrorBlock, newErrorBlock);

// B. Ajouter les fonctions de parsing CSV robustes et universelles
const csvParserFunctions = `    /**
     * Nettoyage d'une valeur issue d'un champ CSV (suppression des guillemets d'encadrement et espaces)
     */
    function cleanCsvValue(val) {
        if (!val && val !== 0) return '';
        let s = String(val).trim();
        if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
            s = s.slice(1, -1);
        }
        return s.trim();
    }

    /**
     * Analyseur universel de flux CSV conforme aux spécifications (séparateurs ';' et '|')
     * Détecte automatiquement le séparateur prépondérant sur la ligne d'en-tête,
     * gère les champs entre guillemets contenant le séparateur et les retours à la ligne.
     */
    function parseCsvText(text, fileName = '') {
        if (!text || !text.trim()) return [];

        // 1. Détection automatique du séparateur (; ou |) sur la première ligne
        const firstLineMatch = text.match(/^[^\\r\\n]+/);
        const firstLine = firstLineMatch ? firstLineMatch[0] : '';
        
        let delimiter = ';';
        const countSemi = (firstLine.match(/;/g) || []).length;
        const countPipe = (firstLine.match(/\\|/g) || []).length;

        if (countPipe > countSemi && countPipe > 0) {
            delimiter = '|';
        } else if (countSemi > 0) {
            delimiter = ';';
        } else {
            const countComma = (firstLine.match(/,/g) || []).length;
            const countTab = (firstLine.match(/\\t/g) || []).length;
            if (countTab > countComma && countTab > 0) delimiter = '\\t';
            else if (countComma > 0) delimiter = ',';
        }

        Logger.info(\`Analyse CSV [\${fileName || 'fichier'}] : Séparateur détecté = "\${delimiter === '\\t' ? 'TAB' : delimiter}"\`);

        // 2. Découpage avec gestion robuste des guillemets et sauts de ligne
        const rows = [];
        let currentRow = [];
        let currentField = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    currentField += '"';
                    i++; // sauter le guillemet échappé ("")
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === delimiter && !inQuotes) {
                currentRow.push(cleanCsvValue(currentField));
                currentField = '';
            } else if ((char === '\\r' || char === '\\n') && !inQuotes) {
                if (char === '\\r' && nextChar === '\\n') {
                    i++;
                }
                currentRow.push(cleanCsvValue(currentField));
                currentField = '';
                if (currentRow.some(c => c !== '')) {
                    rows.push(currentRow);
                }
                currentRow = [];
            } else {
                currentField += char;
            }
        }
        if (currentField.length > 0 || currentRow.length > 0) {
            currentRow.push(cleanCsvValue(currentField));
            if (currentRow.some(c => c !== '')) {
                rows.push(currentRow);
            }
        }

        if (rows.length < 2) {
            if (rows.length === 1) return [];
            throw new Error(\`Le fichier CSV "\${fileName}" ne contient aucune ligne de données exploitable.\`);
        }

        // 3. Normalisation des en-têtes
        const rawHeaders = rows[0];
        const headers = rawHeaders.map(h => String(h || '').trim());

        // 4. Conversion en tableau d'objets compatibles avec sheet_to_json
        const result = [];
        for (let r = 1; r < rows.length; r++) {
            const rowValues = rows[r];
            const obj = {};
            for (let c = 0; c < headers.length; c++) {
                const header = headers[c];
                if (!header) continue;
                const val = rowValues[c] !== undefined ? rowValues[c] : '';
                obj[header] = val;
                const upperHeader = header.toUpperCase();
                if (upperHeader !== header && obj[upperHeader] === undefined) {
                    obj[upperHeader] = val;
                }
            }
            result.push(obj);
        }

        return result;
    }

    /**
     * Lecture asynchrone d'un fichier CSV (UTF-8 avec suppression de BOM)
     */
    function parseCsvFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) return reject(new Error('Aucun fichier CSV fourni.'));

            const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
            Logger.info(\`Début de la lecture du fichier CSV "\${file.name}" (\${sizeMb} Mo)...\`);

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const t0 = performance.now();
                    let text = e.target.result;
                    if (!text || typeof text !== 'string') {
                        throw new Error(\`Le fichier CSV "\${file.name}" est vide.\`);
                    }

                    // Nettoyage éventuel du BOM UTF-8
                    if (text.charCodeAt(0) === 0xFEFF) {
                        text = text.slice(1);
                    }

                    const json = parseCsvText(text, file.name);
                    const duration = ((performance.now() - t0) / 1000).toFixed(2);

                    Logger.success(\`Fichier CSV "\${file.name}" lu avec succès : \${json.length.toLocaleString('fr-FR')} lignes chargées en \${duration}s.\`);
                    AppNotify.success("Données CSV chargées", \`\${file.name} : \${json.length.toLocaleString('fr-FR')} lignes chargées (\${duration}s).\`);
                    if (json.length > 0) {
                        const cols = Object.keys(json[0]);
                        Logger.info(\`Colonnes CSV détectées (\${cols.length}) : \${cols.slice(0, 8).join(', ')}\${cols.length > 8 ? '...' : ''}\`);
                    }
                    resolve(json);
                } catch (err) {
                    const parsed = parseError(err, \`Décodage CSV du fichier \${file.name}\`);
                    Logger.error(\`Échec du décodage CSV (\${file.name}): \${parsed.message}\`, parsed.stack, 'Décodage CSV');
                    AppNotify.error("Erreur de décodage CSV", \`Fichier "\${file.name}": \${parsed.message}\`);
                    reject(new Error(\`Erreur lors du décodage du fichier "\${file.name}": \${parsed.message}\`));
                }
            };

            reader.onerror = (e) => {
                const parsed = parseError(e, \`Lecture du fichier CSV \${file.name}\`);
                const detail = reader.error ? (reader.error.message || reader.error.name) : parsed.message;
                Logger.error(\`Erreur lecture sur le fichier CSV "\${file.name}": \${detail}\`, null, 'FileReader CSV');
                AppNotify.error("Erreur lecture fichier", detail);
                reject(new Error(\`Erreur lors de la lecture du fichier CSV "\${file.name}": \${detail}\`));
            };

            reader.readAsText(file, 'utf-8');
        });
    }
`;

// C. Mettre à jour readExcel pour router automatiquement les .csv vers parseCsvFile
const oldReadExcelHead = "    function readExcel(file) {\n        return new Promise((resolve, reject) => {\n            if (!file) {\n                return reject(new Error('Aucun fichier fourni pour la lecture.'));\n            }";

const newReadExcelHead = csvParserFunctions + `\n    function readExcel(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                return reject(new Error('Aucun fichier fourni pour la lecture.'));
            }

            const fileNameLower = (file.name || '').toLowerCase();
            if (fileNameLower.endsWith('.csv')) {
                return parseCsvFile(file).then(resolve).catch(reject);
            }`;

if (!appJs.includes(oldReadExcelHead)) throw new Error("oldReadExcelHead not found in app.js");
appJs = appJs.replace(oldReadExcelHead, newReadExcelHead);

// D. Mettre à jour importFromCsvOrExcel dans ClientsRegistryManager pour utiliser parseCsvText
const oldImportCsvBranch = `                if (fileNameLower.endsWith('.csv')) {
                    const text = await file.text();
                    const lines = text.split(/\\r?\\n/);
                    if (lines.length > 0) {
                        const header = lines[0].split(/[;,]/).map(h => h.trim().toUpperCase());
                        const idIdx = header.findIndex(h => h.includes('ID') || h.includes('CLIENT') || h.includes('IDENTIFIANT'));
                        const typeIdx = header.findIndex(h => h.includes('TYP') || h.includes('CAT'));
                        const nomIdx = header.findIndex(h => h.includes('NOM') || h.includes('RAISOC'));
                        for (let i = 1; i < lines.length; i++) {
                            const line = lines[i].trim();
                            if (!line) continue;
                            const parts = line.split(/[;,]/);
                            if (idIdx !== -1 && parts[idIdx]) {
                                rows.push({
                                    id: parts[idIdx].trim(),
                                    type: (typeIdx !== -1 && parts[typeIdx]?.trim().toUpperCase().includes('PM')) ? 'PM' : 'PP',
                                    nom: nomIdx !== -1 ? parts[nomIdx]?.trim() : '',
                                    source: file.name
                                });
                            }
                        }
                    }
                }`;

const newImportCsvBranch = `                if (fileNameLower.endsWith('.csv')) {
                    const text = await file.text();
                    const cleanText = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
                    const parsedRows = parseCsvText(cleanText, file.name);
                    parsedRows.forEach(r => {
                        const id = getVal(r, ['IDINT', 'IDINTCLI', 'ID_CLIENT', 'CLIENT', 'ID', 'IDENTIFIANT']);
                        if (id) {
                            const rawType = String(getVal(r, ['TYPE', 'TYPE_CLIENT', 'TYPDEC', 'NATURE']) || '').toUpperCase();
                            const isPm = rawType.includes('PM') || rawType.includes('02') || rawType.includes('MORALE') || Boolean(getVal(r, ['RAISOC', 'RAISON_SOCIALE']));
                            const nom = isPm
                                ? (getVal(r, ['RAISOC', 'RAISON_SOCIALE', 'NOM', 'NOMCOMPLET']) || '')
                                : [getVal(r, ['NOM', 'NOMMAR']), getVal(r, ['PRENOM', 'PRENAI'])].filter(Boolean).join(' ') || getVal(r, ['NOMCOMPLET']) || '';
                            rows.push({
                                id: String(id).trim(),
                                type: isPm ? 'PM' : 'PP',
                                nom,
                                source: file.name
                            });
                        }
                    });
                }`;

if (!appJs.includes(oldImportCsvBranch)) throw new Error("oldImportCsvBranch not found in app.js");
appJs = appJs.replace(oldImportCsvBranch, newImportCsvBranch);

fs.writeFileSync('app/app.js', appJs, 'utf8');
console.log("app/app.js updated successfully with CSV parsing and routing!");
