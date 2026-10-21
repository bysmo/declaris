const fs = require('fs');

let appJs = fs.readFileSync('app/app.js', 'utf8');

// 1. Update openAuditResultDialog
const oldDialogTarget = "        if (msgEl) {\n            if (auditResult.errorCount > 0) {";
const endDialogTarget = "            } else {\n                msgEl.innerHTML = `<strong>Parfait !</strong> Vos données sont <strong>100% conformes</strong> aux contrôles stricts de la BEAC (ENT, OBL, SYN, LOG). Votre fichier sera <strong>accepté sans rejet</strong> par la Banque Centrale.`;\n            }\n        }";

const idxDialogStart = appJs.indexOf(oldDialogTarget);
const idxDialogEnd = appJs.indexOf(endDialogTarget, idxDialogStart);
if (idxDialogStart === -1 || idxDialogEnd === -1) {
    throw new Error("Target dialog block not found");
}

const newDialogCode = `        if (msgEl) {
            const isPp = auditResult.type === 'frcb-pp';
            const isPm = auditResult.type === 'frcb-pm';
            const isFrcb = isPp || isPm;
            const targetCount = isFrcb 
                ? (auditResult.uniqueClientsBloquants || auditResult.uniqueContratsBloquants || []).length 
                : (auditResult.uniqueContratsBloquants || []).length;

            if (auditResult.errorCount > 0) {
                if (isPp) {
                    msgEl.innerHTML = \`<strong>Audit BEAC FRCB PP Achevé :</strong> L'analyse préalable des particuliers a identifié <strong>\${auditResult.errorCount.toLocaleString('fr-FR')} anomalie(s) bloquante(s)</strong> réparties sur <strong>\${targetCount.toLocaleString('fr-FR')} client(s) particulier(s)</strong>.<br><br>🛡️ <em>Vous pouvez générer directement la <strong>déclaration FRCB PP conforme</strong> contenant exclusivement les <strong>bons clients particuliers</strong>. Les clients en anomalie sont isolés dans un classeur Excel pour régularisation en agence.</em>\`;
                } else if (isPm) {
                    msgEl.innerHTML = \`<strong>Audit BEAC FRCB PM Achevé :</strong> L'analyse préalable des entreprises a identifié <strong>\${auditResult.errorCount.toLocaleString('fr-FR')} anomalie(s) bloquante(s)</strong> réparties sur <strong>\${targetCount.toLocaleString('fr-FR')} personne(s) morale(s)</strong>.<br><br>🛡️ <em>Vous pouvez générer directement la <strong>déclaration FRCB PM conforme</strong> contenant exclusivement les <strong>bonnes entreprises</strong>. Les personnes morales en anomalie sont isolées dans un classeur Excel pour régularisation.</em>\`;
                } else {
                    msgEl.innerHTML = \`<strong>Audit BEAC CDR Achevé :</strong> L'analyse préalable a identifié <strong>\${auditResult.errorCount.toLocaleString('fr-FR')} anomalie(s) bloquante(s)</strong> réparties sur <strong>\${targetCount.toLocaleString('fr-FR')} contrat(s)</strong>.<br><br>🛡️ <em>Vous pouvez générer directement la <strong>déclaration CDR conforme</strong> contenant exclusivement les <strong>bons prêts, encours et débiteurs</strong> (adossés aux clients déjà déclarés). Les contrats en anomalie sont isolés dans un classeur Excel pour régularisation.</em>\`;
                }
            } else if (auditResult.warningCount > 0) {
                msgEl.innerHTML = \`<strong>Résultat Favorable :</strong> Vos données \${isFrcb ? (isPp ? 'Particuliers' : 'Entreprises') : 'Crédits'} ne comportent aucune erreur bloquante. \${auditResult.warningCount.toLocaleString('fr-FR')} avertissement(s) de cohérence ont été relevés mais ne bloqueront pas le dépôt. Vous pouvez télécharger le rapport pour vérification ou générer la déclaration.\`;
            } else {
                msgEl.innerHTML = \`<strong>Parfait !</strong> Vos données \${isFrcb ? (isPp ? 'Particuliers' : 'Entreprises') : 'Crédits & Risques'} sont <strong>100% conformes</strong> aux contrôles stricts de la BEAC (ENT, OBL, SYN, LOG). Votre fichier sera <strong>accepté sans rejet</strong> par la Banque Centrale.\`;
            }
        }`;

appJs = appJs.substring(0, idxDialogStart) + newDialogCode + appJs.substring(idxDialogEnd + endDialogTarget.length);
console.log("1. openAuditResultDialog updated.");

// 2. Update openNewDeclarationModal default tab to frcb-pp
const oldOpenModal = `    function openNewDeclarationModal(targetTab = null) {
        if (!modalNewDec) return;
        initInputs();
        modalNewDec.classList.remove('hidden');
        document.body.classList.add('modal-open');
        if (targetTab) {
            const tabBtn = modalNewDec.querySelector(\`.dec-modal-tab-btn[data-dectab="\${targetTab}"]\`);
            if (tabBtn) tabBtn.click();
        }
        hideStatus();
        hideErrorCard();
        Logger.info("Ouverture de la fenêtre 'Nouvelle Déclaration'");
    }`;

const newOpenModal = `    function openNewDeclarationModal(targetTab = null) {
        if (!modalNewDec) return;
        initInputs();
        modalNewDec.classList.remove('hidden');
        document.body.classList.add('modal-open');
        const chosenTab = targetTab || 'frcb-pp';
        const tabBtn = modalNewDec.querySelector(\`.dec-modal-tab-btn[data-dectab="\${chosenTab}"]\`);
        if (tabBtn) tabBtn.click();
        hideStatus();
        hideErrorCard();
        Logger.info("Ouverture de la fenêtre 'Nouvelle Déclaration' (Onglet : " + chosenTab + ")");
    }`;

if (!appJs.includes(oldOpenModal)) throw new Error("oldOpenModal not found");
appJs = appJs.replace(oldOpenModal, newOpenModal);
console.log("2. openNewDeclarationModal updated.");

// 3. Update renderBeacAuditPanel
const oldSubtitleTarget = "        if (subtitle) {\n            subtitle.textContent = `Analyse BEAC CDR : ${auditResult.pretsCount.toLocaleString('fr-FR')} prêts, ${auditResult.encoursCount.toLocaleString('fr-FR')} encours, ${auditResult.debiteursCount.toLocaleString('fr-FR')} débiteurs. ${auditResult.uniqueContratsBloquants.length} contrat(s) en anomalie bloquante.`;\n        }";

const newSubtitleCode = `        const isPp = auditResult.type === 'frcb-pp';
        const isPm = auditResult.type === 'frcb-pm';
        const isFrcb = isPp || isPm;

        if (subtitle) {
            if (isPp) {
                const clientsBloquants = (auditResult.uniqueClientsBloquants || auditResult.uniqueContratsBloquants || []).length;
                subtitle.textContent = \`Analyse BEAC FRCB Particuliers (01) : \${auditResult.totalDeclaredRecords.toLocaleString('fr-FR')} particuliers analysés. \${clientsBloquants.toLocaleString('fr-FR')} client(s) en anomalie bloquante.\`;
            } else if (isPm) {
                const clientsBloquants = (auditResult.uniqueClientsBloquants || auditResult.uniqueContratsBloquants || []).length;
                subtitle.textContent = \`Analyse BEAC FRCB Entreprises (02) : \${auditResult.totalDeclaredRecords.toLocaleString('fr-FR')} personnes morales analysées. \${clientsBloquants.toLocaleString('fr-FR')} entreprise(s) en anomalie bloquante.\`;
            } else {
                const prets = auditResult.pretsCount || 0;
                const encours = auditResult.encoursCount || 0;
                const deb = auditResult.debiteursCount || 0;
                const cBloquants = (auditResult.uniqueContratsBloquants || []).length;
                subtitle.textContent = \`Analyse BEAC CDR : \${prets.toLocaleString('fr-FR')} prêts, \${encours.toLocaleString('fr-FR')} encours, \${deb.toLocaleString('fr-FR')} débiteurs. \${cBloquants.toLocaleString('fr-FR')} contrat(s) en anomalie bloquante.\`;
            }
        }

        const kpiTotalSub = document.getElementById('kpi-audit-total-sub');
        if (kpiTotalSub) {
            kpiTotalSub.textContent = isPp ? 'Particuliers Analysés' : (isPm ? 'Entreprises Analysées' : 'Prêts, Encours, Débiteurs');
        }

        const pillClients = document.getElementById('pill-audit-clients');
        if (pillClients) {
            pillClients.style.display = isFrcb ? 'none' : 'inline-flex';
        }

        const btnPanelClean = document.getElementById('btn-panel-generate-clean');
        if (btnPanelClean) {
            const btnSpan = btnPanelClean.querySelector('span');
            if (btnSpan) {
                btnSpan.textContent = isPp 
                    ? 'Générer FRCB PP Conforme' 
                    : (isPm ? 'Générer FRCB PM Conforme' : 'Générer Déclarations Conformes (Fichiers Sains)');
            }
        }

        const thAuditRef = document.querySelector('#table-audit thead th:nth-child(3)');
        if (thAuditRef) {
            thAuditRef.textContent = isPp ? 'IdInt Client (Particulier)' : (isPm ? 'IdInt Client (Entreprise)' : 'Réf. Contrat / Compte');
        }`;

if (!appJs.includes(oldSubtitleTarget)) throw new Error("oldSubtitleTarget not found");
appJs = appJs.replace(oldSubtitleTarget, newSubtitleCode);
console.log("3. renderBeacAuditPanel updated.");

// 4. Insert DeclarisStorage before AntiDoublonManager and rewrite AntiDoublonManager
const declarisStorageCode = `    /**
     * =========================================================================
     * GESTIONNAIRE DE PERSISTANCE & D'INTÉGRATION AUTOMATIQUE DES ACQ (INDEXEDDB)
     * =========================================================================
     * Garantit qu'aucun rafraîchissement ne fait perdre de données,
     * et impacte directement les fichiers CSV (contrats et clients) sans doublons.
     */
    const DeclarisStorage = {
        DB_NAME: 'declaris_app_db_v2',
        DB_VERSION: 2,
        db: null,
        contratsCsvText: null,
        clientsCsvText: null,
        isInitialized: false,

        async init() {
            if (this.isInitialized) return;
            this.isInitialized = true;
            await this.openDb();
            await this.loadOrInitCsvStores();
            this.updateUiDownloadLinks();
        },

        openDb() {
            return new Promise((resolve) => {
                if (!window.indexedDB) {
                    console.warn('IndexedDB non supporté par ce navigateur.');
                    return resolve(null);
                }
                try {
                    const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
                    req.onupgradeneeded = (e) => {
                        const db = e.target.result;
                        if (!db.objectStoreNames.contains('csv_files')) {
                            db.createObjectStore('csv_files', { keyPath: 'key' });
                        }
                        if (!db.objectStoreNames.contains('declarations')) {
                            db.createObjectStore('declarations', { keyPath: 'id' });
                        }
                        if (!db.objectStoreNames.contains('summaries')) {
                            db.createObjectStore('summaries', { keyPath: 'key' });
                        }
                    };
                    req.onsuccess = (e) => {
                        this.db = e.target.result;
                        resolve(this.db);
                    };
                    req.onerror = (e) => {
                        console.warn('Erreur ouverture IndexedDB:', e);
                        resolve(null);
                    };
                } catch (err) {
                    console.warn('Exception IndexedDB open:', err);
                    resolve(null);
                }
            });
        },

        async getStoredItem(storeName, key) {
            if (!this.db) return null;
            return new Promise((resolve) => {
                try {
                    const tx = this.db.transaction(storeName, 'readonly');
                    const store = tx.objectStore(storeName);
                    const req = store.get(key);
                    req.onsuccess = () => resolve(req.result ? req.result.value : null);
                    req.onerror = () => resolve(null);
                } catch (e) {
                    resolve(null);
                }
            });
        },

        async setStoredItem(storeName, key, value) {
            if (!this.db) return;
            return new Promise((resolve) => {
                try {
                    const tx = this.db.transaction(storeName, 'readwrite');
                    const store = tx.objectStore(storeName);
                    store.put({ key, value, updatedAt: new Date().toISOString() });
                    tx.oncomplete = () => resolve(true);
                    tx.onerror = () => resolve(false);
                } catch (e) {
                    resolve(false);
                }
            });
        },

        async getContratsCsv() {
            if (this.contratsCsvText) return this.contratsCsvText;
            const stored = await this.getStoredItem('csv_files', 'contrats_csv');
            if (stored) {
                this.contratsCsvText = stored;
                return stored;
            }
            return null;
        },

        async getClientsCsv() {
            if (this.clientsCsvText) return this.clientsCsvText;
            const stored = await this.getStoredItem('csv_files', 'clients_csv');
            if (stored) {
                this.clientsCsvText = stored;
                return stored;
            }
            return null;
        },

        async loadOrInitCsvStores() {
            // 1. Contrats CSV
            let storedContrats = await this.getContratsCsv();
            if (!storedContrats) {
                try {
                    const resp = await fetch('contrats_et_id_declares.csv');
                    if (resp.ok) {
                        storedContrats = await resp.text();
                        await this.setStoredItem('csv_files', 'contrats_csv', storedContrats);
                    }
                } catch (err) {
                    console.warn('Impossible de charger le CSV initial de contrats:', err);
                }
            }
            this.contratsCsvText = storedContrats || '';

            // 2. Clients CSV
            let storedClients = await this.getClientsCsv();
            if (!storedClients) {
                try {
                    const resp = await fetch('clients_declares_referentiel.csv');
                    if (resp.ok) {
                        storedClients = await resp.text();
                        await this.setStoredItem('csv_files', 'clients_csv', storedClients);
                    }
                } catch (err) {
                    console.warn('Impossible de charger le CSV initial de clients:', err);
                }
            }
            this.clientsCsvText = storedClients || '';
        },

        updateUiDownloadLinks() {
            if (this.contratsCsvText) {
                const blob = new Blob(['\\uFEFF' + this.contratsCsvText], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const btnContracts = document.getElementById('btn-download-existing-csv');
                if (btnContracts) {
                    btnContracts.href = url;
                    btnContracts.download = 'contrats_et_id_declares.csv';
                }
                const btnUpdateReg = document.getElementById('btn-update-registry-csv');
                if (btnUpdateReg) {
                    btnUpdateReg.setAttribute('data-blob-url', url);
                }
            }

            if (this.clientsCsvText) {
                const blob = new Blob(['\\uFEFF' + this.clientsCsvText], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const btnClients = document.getElementById('btn-download-clients-csv');
                if (btnClients) {
                    btnClients.href = url;
                    btnClients.download = 'clients_declares_referentiel.csv';
                }
                const btnModalClients = document.getElementById('btn-modal-download-clients-csv');
                if (btnModalClients) {
                    btnModalClients.href = url;
                    btnModalClients.download = 'clients_declares_referentiel.csv';
                }
                const btnExportClients = document.getElementById('btn-export-clients-csv');
                if (btnExportClients) {
                    btnExportClients.setAttribute('data-blob-url', url);
                }
            }
        },

        async integrateAcqData(data, fileName = '') {
            if (!data || !data.meta) return { contractsAdded: 0, clientsAdded: 0 };

            const typDec = String(data.meta.typDec || '51').trim();
            const period = data.meta.moisAnnee || '2023-06';
            const datArr = data.meta.datArrFmt || '30/06/2023';
            const datAcq = data.meta.datAcqFmt || new Date().toLocaleDateString('fr-FR');
            const numDec = String(data.meta.numDec || '0001').padStart(4, '0');
            const codeBanque = data.meta.codeEtab || '60002';
            const codePays = data.meta.codPay || 'TD';
            const fn = fileName || data.meta.fileName || 'ACQ_BEAC.XML';

            let contractsAdded = 0;
            let clientsAdded = 0;

            // 1. Intégration pour CDR (Code 51)
            if (typDec === '51' || (!typDec.startsWith('01') && !typDec.startsWith('02'))) {
                const validList = Array.isArray(data.contratsOk) ? data.contratsOk : [];
                if (!this.contratsCsvText) {
                    await this.loadOrInitCsvStores();
                }

                const lines = this.contratsCsvText ? this.contratsCsvText.split(/\\r?\\n/) : [];
                const header = lines.length > 0 && lines[0].includes('IDENTIFIANT')
                    ? lines[0]
                    : 'IDENTIFIANT;TYPE_ELEMENT;TYPE_DECLARATION;STATUT_CONTROLE;STATUT_LIBELLE;PERIODE_ARRETE;MOIS_ANNEE;NUM_DECLARATION;DATE_ACQUITTEMENT;CODE_BANQUE;CODE_PAYS;NOMBRE_ANOMALIES;CODES_ERREURS;FICHIER_SOURCE';

                const existingKeySet = new Set();
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    const parts = line.split(';');
                    const id = parts[0]?.trim().toUpperCase();
                    const p = parts[6]?.trim() || '';
                    if (id) {
                        existingKeySet.add(\`\${id};\${p}\`);
                    }
                }

                const newLines = [];
                validList.forEach(rawId => {
                    if (!rawId) return;
                    const cleanId = String(rawId).trim();
                    const upperId = cleanId.toUpperCase();
                    const key = \`\${upperId};\${period}\`;

                    if (!existingKeySet.has(key)) {
                        existingKeySet.add(key);
                        contractsAdded++;
                        newLines.push([
                            cleanId,
                            'CONTRAT_ENGAGEMENT',
                            '51-CDR',
                            '01',
                            'VALIDE',
                            datArr,
                            period,
                            numDec,
                            datAcq,
                            codeBanque,
                            codePays,
                            '0',
                            '',
                            fn
                        ].join(';'));
                    }
                });

                if (newLines.length > 0) {
                    const validExistingLines = lines.filter((l, idx) => idx === 0 || l.trim().length > 0);
                    if (validExistingLines.length === 0) validExistingLines.push(header);
                    this.contratsCsvText = validExistingLines.join('\\r\\n') + '\\r\\n' + newLines.join('\\r\\n') + '\\r\\n';
                    await this.setStoredItem('csv_files', 'contrats_csv', this.contratsCsvText);
                    
                    if (AntiDoublonManager) {
                        AntiDoublonManager.addItems(period, validList);
                    }
                    Logger.success(\`Impact CSV Contrats : \${contractsAdded.toLocaleString('fr-FR')} contrat(s) validé(s) ajouté(s) sans doublon dans contrats_et_id_declares.csv pour \${period}.\`);
                    AppNotify.success("CSV Contrats Mis à Jour", \`\${contractsAdded.toLocaleString('fr-FR')} contrat(s) validé(s) ajouté(s) sans doublon pour \${period}.\`);
                }
            }

            // 2. Intégration pour FRCB (Code 01 = PP, Code 02 = PM)
            if (typDec === '01' || typDec === '02') {
                const clientType = typDec === '02' ? 'PM' : 'PP';
                const validClients = Array.isArray(data.contratsOk) ? data.contratsOk : [];

                if (!this.clientsCsvText) {
                    await this.loadOrInitCsvStores();
                }

                const lines = this.clientsCsvText ? this.clientsCsvText.split(/\\r?\\n/) : [];
                const header = lines.length > 0 && lines[0].includes('IDENTIFIANT')
                    ? lines[0]
                    : 'IDENTIFIANT;TYPE_CLIENT;NOM_RAISOC;STATUT_DECLARATION;PERIODE_ARRETE;CODE_BANQUE;CODE_PAYS;SOURCE';

                const existingClientsMap = new Map();
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    const parts = line.split(';');
                    const id = parts[0]?.trim().toUpperCase();
                    if (id) {
                        existingClientsMap.set(id, i);
                    }
                }

                const newLines = [];
                validClients.forEach(rawId => {
                    if (!rawId) return;
                    const cleanId = String(rawId).trim();
                    const upperId = cleanId.toUpperCase();

                    if (!existingClientsMap.has(upperId)) {
                        existingClientsMap.set(upperId, true);
                        clientsAdded++;
                        newLines.push([
                            cleanId,
                            clientType,
                            '',
                            'VALIDE',
                            period,
                            codeBanque,
                            codePays,
                            fn
                        ].join(';'));
                    }
                });

                if (newLines.length > 0) {
                    const validExistingLines = lines.filter((l, idx) => idx === 0 || l.trim().length > 0);
                    if (validExistingLines.length === 0) validExistingLines.push(header);
                    this.clientsCsvText = validExistingLines.join('\\r\\n') + '\\r\\n' + newLines.join('\\r\\n') + '\\r\\n';
                    await this.setStoredItem('csv_files', 'clients_csv', this.clientsCsvText);

                    if (ClientsRegistryManager) {
                        ClientsRegistryManager.registerFromAcq(validClients, typDec, fn, period);
                    }
                    Logger.success(\`Impact CSV Clients : \${clientsAdded.toLocaleString('fr-FR')} client(s) \${clientType} validé(s) ajouté(s) sans doublon dans clients_declares_referentiel.csv.\`);
                    AppNotify.success("CSV Clients Mis à Jour", \`\${clientsAdded.toLocaleString('fr-FR')} client(s) \${clientType} validé(s) ajouté(s) sans doublon.\`);
                }
            }

            this.updateUiDownloadLinks();
            return { contractsAdded, clientsAdded };
        }
    };
`;

const oldAntiDoublonStart = "    const AntiDoublonManager = {";
const oldAntiDoublonEnd = "        normalizePeriod(p) {";

const idxAdStart = appJs.indexOf(oldAntiDoublonStart);
const idxAdEnd = appJs.indexOf(oldAntiDoublonEnd, idxAdStart);

if (idxAdStart === -1 || idxAdEnd === -1) throw new Error("AntiDoublonManager block not found");

const newAntiDoublonHead = declarisStorageCode + `\n    const AntiDoublonManager = {
        STORAGE_KEY: 'declaris_antidoublon_registry',
        registry: new Map(), // Periode (YYYY-MM) -> Set(Identifiants)
        allDeclaredVariantsSet: new Set(), // Set global unifié de tous les contrats et variantes déjà déclarés

        async init() {
            await DeclarisStorage.init();
            await this.loadDefaultRegistry();
        },

        async loadDefaultRegistry() {
            try {
                let text = await DeclarisStorage.getContratsCsv();
                if (!text) {
                    const response = await fetch('contrats_et_id_declares.csv');
                    if (response.ok) {
                        text = await response.text();
                        await DeclarisStorage.setStoredItem('csv_files', 'contrats_csv', text);
                    }
                }
                if (text) {
                    const lines = text.split(/\\r?\\n/);
                    let totalCount = 0;
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        const parts = line.split(';');
                        // IDENTIFIANT;TYPE_ELEMENT;TYPE_DECLARATION;STATUT_CONTROLE;STATUT_LIBELLE;PERIODE_ARRETE;MOIS_ANNEE...
                        if (parts.length >= 7) {
                            const id = parts[0]?.trim();
                            const statut = parts[3]?.trim();
                            const mAnnee = parts[6]?.trim() || '2023-06';
                            if (id) {
                                addContractVariants(this.allDeclaredVariantsSet, id);
                                totalCount++;
                                if (!this.registry.has(mAnnee)) {
                                    this.registry.set(mAnnee, new Set());
                                }
                                if (statut === '01') {
                                    this.registry.get(mAnnee).add(id);
                                }
                            }
                        }
                    }
                    Logger.info(\`Référentiel BEAC des contrats passés chargé : \${totalCount.toLocaleString('fr-FR')} identifiants indexés (\${this.allDeclaredVariantsSet.size.toLocaleString('fr-FR')} variantes).\`);
                }
            } catch (err) {
                console.info('Chargement du registre CSV:', err);
            }
            this.updateUiBadges();
        },

        save() {
            this.updateUiBadges();
        },
`;

appJs = appJs.substring(0, idxAdStart) + newAntiDoublonHead + appJs.substring(idxAdEnd);
console.log("4. DeclarisStorage inserted & AntiDoublonManager updated.");

// 5. Update ClientsRegistryManager init and loadDefaultRegistry
const oldClientInitTarget = `        init() {
            if (this.isInitialized) return;
            this.isInitialized = true;

            // 1. Charger les clients personnalisés sauvegardés dans localStorage
            try {
                const raw = localStorage.getItem(this.STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        parsed.forEach(c => this.addClientToRegistry(c, false, true));
                    }
                }
            } catch (e) {
                console.warn('Erreur lecture stockage custom clients:', e);
            }

            // 2. Charger le référentiel de base officiel (clients_declares_referentiel.csv)
            this.loadDefaultRegistry();

            // 3. Attacher les écouteurs d'événements UI
            this.attachUiListeners();
        },`;

const newClientInit = `        async init() {
            if (this.isInitialized) return;
            this.isInitialized = true;

            await DeclarisStorage.init();
            await this.loadDefaultRegistry();
            this.attachUiListeners();
        },`;

if (!appJs.includes(oldClientInitTarget)) throw new Error("oldClientInitTarget not found");
appJs = appJs.replace(oldClientInitTarget, newClientInit);

const oldClientLoadTarget = `        async loadDefaultRegistry() {
            try {
                const response = await fetch('clients_declares_referentiel.csv');
                if (response.ok) {
                    const text = await response.text();
                    const lines = text.split(/\\r?\\n/);
                    let loadedCount = 0;

                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        const parts = line.split(';');
                        // IDENTIFIANT;TYPE_CLIENT;NOM_RAISOC;STATUT_DECLARATION;PERIODE_ARRETE;CODE_BANQUE;CODE_PAYS;SOURCE
                        if (parts.length >= 3) {
                            const id = parts[0]?.trim();
                            const type = parts[1]?.trim() || 'PP';
                            const nom = parts[2]?.trim() || '';
                            const statut = parts[3]?.trim() || 'VALIDE';
                            const periode = parts[4]?.trim() || '2023-06';
                            const source = parts[7]?.trim() || 'FRCB';
                            if (id) {
                                this.addClientToRegistry({ id, type, nom, statut, periode, source }, false, true);
                                loadedCount++;
                            }
                        }
                    }
                    Logger.info(\`Référentiel FRCB des clients déclarés chargé : \${loadedCount.toLocaleString('fr-FR')} clients indexés (\${this.variantsSet.size.toLocaleString('fr-FR')} variantes rapides).\`);
                }
            } catch (err) {
                console.info('Chargement différé du référentiel clients CSV:', err);
            }
            this.updateUiBadges();
        },`;

const newClientLoad = `        async loadDefaultRegistry() {
            try {
                let text = await DeclarisStorage.getClientsCsv();
                if (!text) {
                    const response = await fetch('clients_declares_referentiel.csv');
                    if (response.ok) {
                        text = await response.text();
                        await DeclarisStorage.setStoredItem('csv_files', 'clients_csv', text);
                    }
                }
                if (text) {
                    const lines = text.split(/\\r?\\n/);
                    let loadedCount = 0;

                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        const parts = line.split(';');
                        // IDENTIFIANT;TYPE_CLIENT;NOM_RAISOC;STATUT_DECLARATION;PERIODE_ARRETE;CODE_BANQUE;CODE_PAYS;SOURCE
                        if (parts.length >= 3) {
                            const id = parts[0]?.trim();
                            const type = parts[1]?.trim() || 'PP';
                            const nom = parts[2]?.trim() || '';
                            const statut = parts[3]?.trim() || 'VALIDE';
                            const periode = parts[4]?.trim() || '2023-06';
                            const source = parts[7]?.trim() || 'FRCB';
                            if (id) {
                                this.addClientToRegistry({ id, type, nom, statut, periode, source }, false, true);
                                loadedCount++;
                            }
                        }
                    }
                    Logger.info(\`Référentiel FRCB des clients déclarés chargé : \${loadedCount.toLocaleString('fr-FR')} clients indexés (\${this.variantsSet.size.toLocaleString('fr-FR')} variantes rapides).\`);
                }
            } catch (err) {
                console.info('Chargement du référentiel clients CSV:', err);
            }
            this.updateUiBadges();
        },`;

if (!appJs.includes(oldClientLoadTarget)) throw new Error("oldClientLoadTarget not found");
appJs = appJs.replace(oldClientLoadTarget, newClientLoad);
console.log("5. ClientsRegistryManager updated.");

// 6. Update AcqHistoryManager init to remove fake demo purge and read from DeclarisStorage / IndexedDB
const oldAcqHistInitTarget = `        async init() {
            this.initIndexedDb();
            try {
                const raw = localStorage.getItem(this.STORAGE_KEY);
                if (raw) {
                    const list = JSON.parse(raw);
                    const seen = new Set();
                    // Nettoyage impératif : purge de toute déclaration de test factice (Mai, Juil, Août 2023 démo)
                    this.declarationsSummary = (Array.isArray(list) ? list : []).filter(d => {
                        if (!d || !d.id || !d.meta) return false;
                        const id = String(d.id);
                        const isDemoId = id.includes('_0056_') || id.includes('_0058_') || id.includes('_0059_');
                        const p = getDeclarationPeriod(d);
                        const isDemoPeriod = p === '2023-05' || p === '2023-07' || p === '2023-08';
                        const fn = String(d.fileName || d.meta?.fileName || '');
                        const isDemoFile = fn.includes('-0056-') || fn.includes('-0058-') || fn.includes('-0059-') || fn.includes('31052023') || fn.includes('31072023') || fn.includes('31082023');
                        if (isDemoId || isDemoPeriod || isDemoFile || !p) {
                            if (this.db) this.deleteFromIndexedDb(id);
                            return false;
                        }
                        // Déduplication par identifiant canonique
                        if (seen.has(id)) {
                            return false;
                        }
                        seen.add(id);
                        return true;
                    });
                    this.saveSummary();
                }
            } catch (e) {
                console.warn('Erreur lecture historique summary:', e);
                this.declarationsSummary = [];
            }`;

const newAcqHistInit = `        async init() {
            this.initIndexedDb();
            try {
                let list = null;
                if (DeclarisStorage) {
                    list = await DeclarisStorage.getStoredItem('summaries', 'acq_list');
                }
                if (!list) {
                    const raw = localStorage.getItem(this.STORAGE_KEY);
                    if (raw) list = JSON.parse(raw);
                }

                if (list && Array.isArray(list)) {
                    const seen = new Set();
                    this.declarationsSummary = list.filter(d => {
                        if (!d || !d.id || !d.meta) return false;
                        const id = String(d.id);
                        if (seen.has(id)) return false;
                        seen.add(id);
                        return true;
                    });
                    this.saveSummary();
                }
            } catch (e) {
                console.warn('Erreur lecture historique summary:', e);
                this.declarationsSummary = [];
            }`;

if (!appJs.includes(oldAcqHistInitTarget)) throw new Error("oldAcqHistInitTarget not found");
appJs = appJs.replace(oldAcqHistInitTarget, newAcqHistInit);

// Also in AcqHistoryManager.saveSummary
const oldSaveSummaryTarget = `        saveSummary() {
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.declarationsSummary));
            } catch (e) {
                console.warn('Erreur sauvegarde localStorage summary:', e);
            }
        },`;

const newSaveSummary = `        saveSummary() {
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.declarationsSummary));
            } catch (e) {}
            if (DeclarisStorage) {
                DeclarisStorage.setStoredItem('summaries', 'acq_list', this.declarationsSummary);
            }
            this.updateDashboardCounters();
        },`;

if (!appJs.includes(oldSaveSummaryTarget)) throw new Error("oldSaveSummaryTarget not found");
appJs = appJs.replace(oldSaveSummaryTarget, newSaveSummary);

// Also in AcqHistoryManager.addDeclaration
const oldAddDecTarget = `            this.saveSummary();
            this.cache.set(id, data);
            this.saveToIndexedDb(id, data);`;

const newAddDec = `            this.saveSummary();
            this.cache.set(id, data);
            this.saveToIndexedDb(id, data);
            if (DeclarisStorage) {
                await DeclarisStorage.integrateAcqData(data, fileObj ? fileObj.name : '');
            }`;

if (!appJs.includes(oldAddDecTarget)) throw new Error("oldAddDecTarget not found");
appJs = appJs.replace(oldAddDecTarget, newAddDec);
console.log("6. AcqHistoryManager updated.");

// 7. Update analyzeAcqFilesBatch to log impact
const oldBatchTry = `                const text = await readFileAsText(file);
                const data = parseAcqXml(text, file.name);
                await AcqHistoryManager.addDeclaration(data, file);
                lastData = data;
                successCount++;`;

const newBatchTry = `                const text = await readFileAsText(file);
                const data = parseAcqXml(text, file.name);
                await AcqHistoryManager.addDeclaration(data, file);
                if (DeclarisStorage) {
                    const impact = await DeclarisStorage.integrateAcqData(data, file.name);
                    if (impact.contractsAdded > 0) {
                        Logger.info(\`Mise à jour automatique : \${impact.contractsAdded.toLocaleString('fr-FR')} nouveaux contrats intégrés dans contrats_et_id_declares.csv sans doublons.\`);
                    }
                    if (impact.clientsAdded > 0) {
                        Logger.info(\`Mise à jour automatique : \${impact.clientsAdded.toLocaleString('fr-FR')} nouveaux clients intégrés dans clients_declares_referentiel.csv sans doublons.\`);
                    }
                }
                lastData = data;
                successCount++;`;

if (!appJs.includes(oldBatchTry)) throw new Error("oldBatchTry not found");
appJs = appJs.replace(oldBatchTry, newBatchTry);
console.log("7. analyzeAcqFilesBatch updated.");

// 8. Update btnUpdateRegistryCsv to download from DeclarisStorage
const oldBtnUpdateReg = `    const btnUpdateRegistryCsv = document.getElementById('btn-update-registry-csv');
    if (btnUpdateRegistryCsv) {
        btnUpdateRegistryCsv.addEventListener('click', () => exportRegistryCsv(false));
    }`;

const newBtnUpdateReg = `    const btnUpdateRegistryCsv = document.getElementById('btn-update-registry-csv');
    if (btnUpdateRegistryCsv) {
        btnUpdateRegistryCsv.addEventListener('click', () => {
            if (DeclarisStorage && DeclarisStorage.contratsCsvText) {
                const blob = new Blob(['\\uFEFF' + DeclarisStorage.contratsCsvText], { type: 'text/csv;charset=utf-8;' });
                downloadFile(blob, 'contrats_et_id_declares.csv');
                AppNotify.success("CSV Contrats Téléchargé", "Fichier contrats_et_id_declares.csv complet et à jour téléchargé.");
            } else {
                exportRegistryCsv(false);
            }
        });
    }`;

if (!appJs.includes(oldBtnUpdateReg)) throw new Error("oldBtnUpdateReg not found");
appJs = appJs.replace(oldBtnUpdateReg, newBtnUpdateReg);
console.log("8. btnUpdateRegistryCsv updated.");

// 9. Update initializations at end of file
const oldEndInits = `    // Initialisation des registres réglementaires au démarrage
    AntiDoublonManager.init();
    AcqHistoryManager.init();
    ClientsRegistryManager.init();
});`;

const newEndInits = `    // Initialisation des registres réglementaires au démarrage
    (async () => {
        try {
            await DeclarisStorage.init();
            await AntiDoublonManager.init();
            await AcqHistoryManager.init();
            await ClientsRegistryManager.init();
        } catch (initErr) {
            console.error('Erreur initialisation DeclarisStorage / Registres:', initErr);
        }
    })();
});`;

if (!appJs.includes(oldEndInits)) throw new Error("oldEndInits not found");
appJs = appJs.replace(oldEndInits, newEndInits);
console.log("9. End initializations updated.");

fs.writeFileSync('app/app.js', appJs, 'utf8');
console.log("ALL UPDATES APPLIED TO app/app.js SUCCESSFULLY!");
