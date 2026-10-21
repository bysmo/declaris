/**
 * MOTEUR DE CONTRÔLES RÉGLEMENTAIRES BEAC - CENTRALE DES RISQUES (CDR)
 * Conforme au Kit d'Interfaçage CDR (Version officielle BEAC/COBAC 18/11/2025)
 * 
 * Permet l'exécution en amont de l'intégralité des contrôles BEAC :
 * - Contrôles En-tête (ENT0001 à ENT0021)
 * - Contrôles Contenu - Obligatoires (OBL001 à OBL004)
 * - Contrôles Contenu - Syntaxiques (SYN001 à SYN005)
 * - Contrôles Contenu - Logiques & Métier (LOG0001 à LOG060)
 * - Restitution détaillée des anomalies et instructions correctives
 * - Export Excel multi-onglets pour correction rapide avant transmission
 */

(function (window) {
    'use strict';

    // =========================================================================
    // 1. RÉFÉRENTIELS OFFICIELS DU KIT D'INTERFAÇAGE BEAC (ANNEXES)
    // =========================================================================

    // Annexe 1 : Codes Pays
    const PAYS_CEMAC = new Set(['CM', 'CF', 'CG', 'GA', 'GQ', 'TD']);
    const PAYS_REFERENTIEL = new Map([
        ['AD', 'Andorre'], ['AE', 'Emirats Arabes Unis'], ['AF', 'Afghanistan'], ['AG', 'Antigua-Et-Barbuda'],
        ['AI', 'Anguilla'], ['AL', 'Albanie'], ['AM', 'Arménie'], ['AO', 'Angola'], ['AQ', 'Antarctique'],
        ['AR', 'Argentine'], ['AS', 'Samoa Américaines'], ['AT', 'Autriche'], ['AU', 'Australie'],
        ['AW', 'Aruba'], ['AX', 'Iles Åland'], ['AZ', 'Azerbaïdjan'], ['BA', 'Bosnie Herzégovine'],
        ['BB', 'Barbade'], ['BD', 'Bangladesh'], ['BE', 'Belgique'], ['BF', 'Burkina Faso'],
        ['BG', 'Bulgarie'], ['BH', 'Bahreïn'], ['BI', 'Burundi'], ['BJ', 'Bénin'],
        ['BL', 'Saint Barthelemy'], ['BM', 'Bermudes'], ['BN', 'Brunei Darussalam'], ['BO', 'Etat Plurinational De Bolivie'],
        ['BQ', 'Bonaire Saint Eustache Et Saba'], ['BR', 'Brésil'], ['BS', 'Bahamas'], ['BT', 'Bhoutan'],
        ['BW', 'Botswana'], ['BY', 'Belarus'], ['BZ', 'Belize'], ['CA', 'Canada'],
        ['CD', 'République Démocratique Du Congo'], ['CF', 'République Centrafricaine'], ['CG', 'Congo'],
        ['CH', 'Suisse'], ['CI', 'Cote D\'ivoire'], ['CK', 'Iles Cook'], ['CL', 'Chili'],
        ['CM', 'Cameroun'], ['CN', 'Chine'], ['CO', 'Colombie'], ['CR', 'Costa Rica'],
        ['CU', 'Cuba'], ['CV', 'Cap Vert'], ['CW', 'Curaçao'], ['CY', 'Chypre'],
        ['CZ', 'République Tchèque'], ['DE', 'Allemagne'], ['DJ', 'Djibouti'], ['DK', 'Danemark'],
        ['DM', 'Dominique'], ['DO', 'République Dominicaine'], ['DZ', 'Algérie'], ['EC', 'Equateur'],
        ['EE', 'Estonie'], ['EG', 'Egypte'], ['EH', 'Sahara Occidental'], ['ER', 'Erythrée'],
        ['ES', 'Espagne'], ['ET', 'Ethiopie'], ['FI', 'Finlande'], ['FJ', 'Fidji'],
        ['FK', 'Iles Falkland'], ['FM', 'Etats Fédères De Micronésie'], ['FO', 'Iles Féroé'], ['FR', 'France'],
        ['GA', 'Gabon'], ['GB', 'Royaume-Uni'], ['GD', 'Grenade'], ['GE', 'Géorgie'],
        ['GF', 'Guyane Française'], ['GG', 'Guernesey'], ['GH', 'Ghana'], ['GI', 'Gibraltar'],
        ['GL', 'Groenland'], ['GM', 'Gambie'], ['GN', 'Guinée'], ['GP', 'Guadeloupe'],
        ['GQ', 'Guinée Equatoriale'], ['GR', 'Grèce'], ['GT', 'Guatemala'], ['GU', 'Guam'],
        ['GW', 'Guinée Bissau'], ['GY', 'Guyana'], ['HK', 'Hong Kong'], ['HN', 'Honduras'],
        ['HR', 'Croatie'], ['HT', 'Haïti'], ['HU', 'Hongrie'], ['ID', 'Indonésie'],
        ['IE', 'Irlande'], ['IL', 'Israël'], ['IM', 'Ile De Man'], ['IN', 'Inde'],
        ['IQ', 'Iraq'], ['IR', 'République Islamique D’Iran'], ['IS', 'Islande'], ['IT', 'Italie'],
        ['JE', 'Jersey'], ['JM', 'Jamaïque'], ['JO', 'Jordanie'], ['JP', 'Japon'],
        ['KE', 'Kenya'], ['KG', 'Kirghizistan'], ['KH', 'Cambodge'], ['KI', 'Kiribati'],
        ['KM', 'Comores'], ['KN', 'Saint Kits Et Nevis'], ['KP', 'République Populaire Démocratique De Corée'],
        ['KR', 'République De Corée'], ['KW', 'Koweït'], ['KY', 'Iles Caïmans'], ['KZ', 'Kazakhstan'],
        ['LA', 'République Démocratique Populaire Lao'], ['LB', 'Liban'], ['LC', 'Sainte Lucie'],
        ['LI', 'Liechtenstein'], ['LK', 'Sri Lanka'], ['LR', 'Liberia'], ['LS', 'Lesotho'],
        ['LT', 'Lituanie'], ['LU', 'Luxembourg'], ['LV', 'Lettonie'], ['LY', 'Libye'],
        ['MA', 'Maroc'], ['MC', 'Monaco'], ['MD', 'Moldova'], ['ME', 'Monténégro'],
        ['MF', 'Saint Martin'], ['MG', 'Madagascar'], ['MH', 'Iles Marshall'],
        ['MK', 'L\'ex République Yougoslave De Macédoine'], ['ML', 'Mali'], ['MM', 'Myanmar'],
        ['MN', 'Mongolie'], ['MO', 'Macao'], ['MP', 'Iles Mariannes Du Nord'], ['MQ', 'Martinique'],
        ['MR', 'Mauritanie'], ['MS', 'Montserrat'], ['MT', 'Malte'], ['MU', 'Maurice'],
        ['MV', 'Maldives'], ['MW', 'Malawi'], ['MX', 'Mexique'], ['MY', 'Malaisie'],
        ['MZ', 'Mozambique'], ['NA', 'Namibie'], ['NC', 'Nouvelle Calédonie'], ['NE', 'Niger'],
        ['NF', 'Ile Norfolk'], ['NG', 'Nigeria'], ['NI', 'Nicaragua'], ['NL', 'Pays Bas'],
        ['NO', 'Norvège'], ['NP', 'Népal'], ['NR', 'Nauru'], ['NU', 'Niue'],
        ['NZ', 'Nouvelle Zélande'], ['OM', 'Oman'], ['PA', 'Panama'], ['PE', 'Pérou'],
        ['PF', 'Polynésie Française'], ['PG', 'Papouasie Nouvelle Guinée'], ['PH', 'Philippines'],
        ['PK', 'Pakistan'], ['PL', 'Pologne'], ['PM', 'Saint Pierre Et Miquelon'], ['PN', 'Pitcairn'],
        ['PR', 'Porto Rico'], ['PS', 'Etat De Palestine'], ['PT', 'Portugal'], ['PW', 'Palaos'],
        ['PY', 'Paraguay'], ['QA', 'Qatar'], ['RE', 'Réunion'], ['RO', 'Roumanie'],
        ['RS', 'Serbie'], ['RU', 'Fédération De Russie'], ['RW', 'Rwanda'], ['SA', 'Arabie Saoudite'],
        ['SB', 'Iles Salomon'], ['SC', 'Seychelles'], ['SD', 'Soudan'], ['SE', 'Suède'],
        ['SG', 'Singapour'], ['SH', 'Sainte Helene'], ['SI', 'Slovénie'], ['SJ', 'Svalbard'],
        ['SK', 'Slovaquie'], ['SL', 'Sierra Leone'], ['SM', 'Saint Marin'], ['SN', 'Sénégal'],
        ['SO', 'Somalie'], ['SR', 'Suriname'], ['SS', 'Soudan Du Sud'], ['ST', 'Sao Tome Et Principe'],
        ['SV', 'El Salvador'], ['SX', 'Saint Martin'], ['SY', 'République Arabe Syrienne'],
        ['SZ', 'Swaziland'], ['TC', 'Iles Turks Et Caïques'], ['TD', 'Tchad'], ['TG', 'Togo'],
        ['TH', 'Thaïlande'], ['TJ', 'Tadjikistan'], ['TK', 'Tokelau'], ['TL', 'Timor Leste'],
        ['TM', 'Turkménistan'], ['TN', 'Tunisie'], ['TO', 'Tonga'], ['TR', 'Turquie'],
        ['TT', 'Trinite Et Tobago'], ['TV', 'Tuvalu'], ['TZ', 'Tanzanie'], ['UA', 'Ukraine'],
        ['UG', 'Ouganda'], ['US', 'Etats Unis'], ['UY', 'Uruguay'], ['UZ', 'Ouzbékistan'],
        ['VA', 'Saint Siege'], ['VC', 'Saint Vincent'], ['VE', 'Venezuela'], ['VG', 'Iles Vierges Brit.'],
        ['VI', 'Iles Vierges US'], ['VN', 'Vietnam'], ['VU', 'Vanuatu'], ['WF', 'Wallis Et Futuna'],
        ['WS', 'Samoa'], ['YE', 'Yémen'], ['YT', 'Mayotte'], ['ZA', 'Afrique Du Sud'],
        ['ZM', 'Zambie'], ['ZW', 'Zimbabwe']
    ]);

    // Annexe 2 : Devises (extraits complets de la norme)
    const DEVISES_REFERENTIEL = new Set([
        'XAF', 'EUR', 'USD', 'CAD', 'CHF', 'CNY', 'GBP', 'JPY', 'XOF', 'AED', 'AOA', 'ATS',
        'AUD', 'BEC', 'BEF', 'BEL', 'BHD', 'BRL', 'CDF', 'DEM', 'DKK', 'DZD', 'ESP', 'FIM',
        'FRF', 'GNF', 'GRD', 'IEP', 'ITL', 'KWD', 'LUF', 'LYD', 'MAD', 'MGA', 'MRO', 'MTP',
        'MUR', 'NLG', 'NOK', 'PTE', 'QAR', 'SAR', 'SEK', 'SGD', 'SNP', 'STD', 'STN', 'TND',
        'XER', 'YER', 'ZAR'
    ]);

    // Annexe 3 : Nature d'engagements COBAC (01 à 31)
    const NATURES_ENGAGEMENT = new Map([
        ['01', { libelle: 'Crédits à l\'investissement immobilier', typEng: '01', parent: 'Crédit d\'investissement', emp: 'PM' }],
        ['02', { libelle: 'Avances sur stocks', typEng: '01', parent: 'Crédits de campagne', emp: 'PP_ET_PM' }],
        ['03', { libelle: 'Crédits à l\'équipement', typEng: '01', parent: 'Crédit d\'investissement', emp: 'PM' }],
        ['04', { libelle: 'Crédits de campagne moratoriés', typEng: '01', parent: 'Facilité de fonds de roulement', emp: 'PP_ET_PM' }],
        ['05', { libelle: 'Crédits à la consommation', typEng: '01', parent: 'Crédits à la consommation', emp: 'PP' }],
        ['06', { libelle: 'Crédits moratoriés ou consolidés sur l\'Etat', typEng: '01', parent: 'Consolidation', emp: 'PP_ET_PM' }],
        ['07', { libelle: 'Crédits de campagne consolidés', typEng: '01', parent: 'Crédits de campagne', emp: 'PP_ET_PM' }],
        ['08', { libelle: 'Crédits à l\'exportation', typEng: '01', parent: 'Crédits de campagne', emp: 'PP_ET_PM' }],
        ['09', { libelle: 'Crédits à l\'habitat', typEng: '01', parent: 'Crédit immobilier', emp: 'PP' }],
        ['12', { libelle: 'Crédit-bail', typEng: '01', parent: 'Crédit bail', emp: 'PP_ET_PM' }],
        ['13', { libelle: 'Acceptations à payer', typEng: '02', parent: 'EPS', emp: 'PM' }],
        ['14', { libelle: 'Ouvertures de crédits documentaires confirmés', typEng: '02', parent: 'EPS', emp: 'PM' }],
        ['15', { libelle: 'Autres ouvertures de crédits confirmés', typEng: '02', parent: 'EPS', emp: 'PM' }],
        ['16', { libelle: 'Cautions, avals', typEng: '02', parent: 'EPS', emp: 'PM' }],
        ['17', { libelle: 'Garanties de remboursement de crédit', typEng: '02', parent: 'EPS', emp: 'PM' }],
        ['18', { libelle: 'Autres garanties', typEng: '02', parent: 'EPS', emp: 'PM' }],
        ['19', { libelle: 'Carte de crédit', typEng: '03', parent: 'Carte de crédit', emp: 'PP_ET_PM' }],
        ['20', { libelle: 'Crédits rééchelonnés', typEng: '01', parent: 'Crédits non ventilables', emp: 'PP_ET_PM' }],
        ['21', { libelle: 'Crédits restructurés', typEng: '01', parent: 'Crédits non ventilables', emp: 'PP_ET_PM' }],
        ['22', { libelle: 'Autres crédits consolidés', typEng: '01', parent: 'Crédits non ventilables', emp: 'PP_ET_PM' }],
        ['23', { libelle: 'Escompte commercial', typEng: '02', parent: 'Effets commerciaux', emp: 'PM' }],
        ['24', { libelle: 'Affacturage', typEng: '02', parent: 'Effets commerciaux', emp: 'PM' }],
        ['25', { libelle: 'Escompte documentaire', typEng: '02', parent: 'Effets commerciaux', emp: 'PM' }],
        ['26', { libelle: 'Découvert', typEng: '02', parent: 'Découvert', emp: 'PP_ET_PM' }],
        ['27', { libelle: 'Avances sur marchés publics nantis', typEng: '02', parent: 'Marchés publics', emp: 'PM' }],
        ['28', { libelle: 'Crédits de trésorerie autre que découvert', typEng: '02', parent: 'Trésorerie', emp: 'PP_ET_PM' }],
        ['29', { libelle: 'Autres crédits d\'accompagnement', typEng: '02', parent: 'Marchés publics', emp: 'PM' }],
        ['30', { libelle: 'Crédits de productivité et de préfinancement', typEng: '01', parent: 'Crédits de campagne', emp: 'PM' }],
        ['31', { libelle: 'Avances en blanc', typEng: '01', parent: 'Crédits de campagne', emp: 'PP_ET_PM' }]
    ]);

    // Annexe 4.1 & 4.2 & 4.3 : Classes Réglementaires COBAC
    const CLASSES_REGLEMENTAIRES = new Map([
        ['01', { libelle: 'Créances Saines', code: '01' }],
        ['02', { libelle: 'Créances Sensibles', code: '02' }],
        ['03', { libelle: 'Créances En Souffrance (Parent)', code: '03' }],
        ['04', { libelle: 'Créances Impayées', code: '04' }],
        ['05', { libelle: 'Créances Immobilisées', code: '05' }],
        ['06', { libelle: 'Créances Douteuses (Parent)', code: '06' }],
        ['07', { libelle: 'Créances Douteuses au plus 1 an', code: '07' }],
        ['08', { libelle: 'Créances Douteuses de 1 à 2 ans', code: '08' }],
        ['09', { libelle: 'Créances Douteuses de 2 à 3 ans', code: '09' }],
        ['10', { libelle: 'Créances Douteuses de 3 à 5 ans', code: '10' }],
        ['11', { libelle: 'Créances Irrécouvrables (+ de 5 ans)', code: '11' }]
    ]);

    // Annexe 5 : Nature de garantie
    const NATURES_GARANTIE = new Map([
        ['100', 'Caution Personnelle Solidaire'], ['101', 'Caution Personnelle Simple'], ['102', 'Aval'],
        ['103', 'Caution Bancaire'], ['104', 'Aval Bancaire'], ['201', 'Hypothèque sur Bien Immobilier'],
        ['202', 'Hypothèque Maritime'], ['203', 'Nantissement sur Fonds de Commerce'],
        ['204', 'Nantissement Matériels Roulants'], ['205', 'Nantissement Outillage / Matériel Pro'],
        ['206', 'Nantissement sur Stocks'], ['207', 'Nantissement de Marché'],
        ['208', 'Nantissement sur Cheptel'], ['209', 'Nantissement sur Créance'],
        ['210', 'Nantissement sur Titres (Parts, Actions)'], ['211', 'Nantissement sur Dépôts (CAT, Epargne)'],
        ['212', 'Nantissement Propriété Intellectuelle'], ['213', 'Hypothèque d\'un aéronef'],
        ['214', 'Nantissement sur Œuvres d\'Art'], ['230', 'Gage sur Métaux/Pierres Précieuses'],
        ['250', 'Dépôt de Garantie'], ['300', 'Autre garantie']
    ]);

    // Annexe 6 : Types de références externes de garanties
    const TYPES_REF_GARANTIE = new Set(['01', '02', '03', '04', '05', '06', '07', '08']);

    // =========================================================================
    // 1.BIS RÉFÉRENTIELS ET SPÉCIFICATIONS FRCB (PP & PM - BEAC 18/11/2025)
    // =========================================================================

    // Section 9.1 : Mots et tokens interdits pour les noms propres PP (Annexe 1)
    const FRCB_FORBIDDEN_NAME_TOKENS = new Set([
        'NSP', 'NE SAIS PAS', 'NA', 'ND', 'INCO', 'INCONU', 'INCONNU',
        'M', 'MME', 'MLLE', 'MR', 'SENOR', 'SENIOR', 'SENORA', 'SENIORA',
        'DR', 'HN', 'MAITRE', 'DOCTEUR', 'MISTER', 'MS', 'EXCELLENCE', 'HE', 'SE',
        'MISS', 'MRS', 'MX', 'VVE', 'VEUF', 'VEUVE', 'FEU', 'FEUE',
        'EP', 'EPS', 'EPOUS', 'EPOUSE', 'EPES', 'NEE', 'DIT', 'ALIAS', 'ET', 'OU',
        'PC', 'P/C', 'REP', 'REPRESENTANT', 'REPRESENTE',
        'COMPANY', 'CO', 'COM', 'COMP', 'ASSOCIES', 'ET FILS',
        '2000', '3000', 'ABACERIA'
    ]);

    // Section 9.1 : Mots et sigles interdits seuls pour les raisons sociales PM
    const FRCB_FORBIDDEN_RAISOC_TOKENS = new Set([
        'NSP', 'NE SAIS PAS', 'ND', 'NA', 'INCO', 'INCONU', 'INCONNU',
        'PC', 'REP', 'REPRESENTANT', 'REPRESENTE', 'GE',
        'S.A', 'S.A.', 'SA', 'S.L', 'S.L.', 'SL', 'S.A.R.L', 'S.A.R.L.', 'SARL',
        'CIE', 'LTD', 'LIMITED', 'LIMITADA', 'STE', 'SOCIETE', 'ST',
        'COMPANY', 'COMPANIE', 'ETABLISSEMENT', 'ETS', 'PERE', 'ET FILS',
        'FRERES', 'SOEURS', 'ASSOCIES', 'SUR', 'SURL'
    ]);

    // Section 9.1 : Mots interdits pour les villes et lieux
    const FRCB_FORBIDDEN_VILLE_TOKENS = new Set([
        'NSP', 'NE SAIS PAS', 'ND', 'INCO', 'INCONU', 'INCONNU', 'NA'
    ]);

    // Section 9.2 : Spécifications exactes des longueurs nettes (alphanumériques) par pays
    const FRCB_ID_SPECS = {
        'GA': {
            pieces: { '01': [15], '02': [8, 9], '03': [9], '04': [14, 17], '05': [11], '06': [9] },
            niu: [7, 13],
            rccm: [10, 12, 15, 19]
        },
        'CM': {
            pieces: { '01': [9, 17, 19], '02': [7, 8, 9], '03': [17, 18], '04': [20], '05': [7], '06': [9, 20] },
            niu: [14],
            rccm: [16, 17, 18]
        },
        'TD': {
            pieces: { '01': [10], '02': [9], '03': [9], '05': [8], '06': [10] },
            niu: [10],
            rccm: [11]
        },
        'CG': {
            pieces: { '01': [13, 14, 15], '02': [9], '03': [9], '05': [11] },
            niu: [16, 17],
            rccm: [11]
        },
        'CF': {
            pieces: { '01': [16], '02': [8, 9], '03': [10], '05': [9], '06': [14] },
            niu: [11],
            rccm: [12]
        },
        'GQ': {
            pieces: { '01': [7, 9], '02': [9], '03': [9], '04': [9], '05': [9], '06': [9] },
            niu: [9],
            rccm: [8]
        }
    };

    // Agents économiques FRCB PP & PM (Annexe 5)
    const FRCB_AGENTS_PP = new Set(['1080', '1100', '1110']);
    const FRCB_AGENTS_PM = new Set([
        '1010', '1020', '1030', '1040', '1050', '1061', '1062', '1063', '1070',
        '1120', '1130', '1140', '1210', '1150', '1160', '1170', '1180', '1190', '1200'
    ]);
    const FRCB_AGENTS_PM_NIU_OBLIGATOIRE = new Set([
        '1050', '1061', '1062', '1063', '1070', '1120', '1130', '1140', '1210'
    ]);

    // Formes Juridiques (Annexe 12)
    const FRCB_FORMES_JURIDIQUES = new Set([
        '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
        '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
        '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'
    ]);

    // Types de pièces d'identité FRCB (Annexe 7)
    const FRCB_TYPES_PIECES = new Set(['01', '02', '03', '04', '05', '06', '07']);

    // Types d'adresses (Annexe 10)
    const FRCB_TYPES_ADRESSES_PP = new Set(['01', '02', '05', '06', '07']);
    const FRCB_TYPES_ADRESSES_PM = new Set(['03', '04', '06', '07']);

    // Situation matrimoniale (Annexe 6)
    const FRCB_SIT_MAT = new Set(['01', '02', '03', '04']);

    // Qualités Mandataires PP (Annexe 8)
    const FRCB_QUALITES_MAND_PP = new Set(['01', '02', '03']);

    // Types de Mandataires PM (Annexe 13 : 01 à 35)
    const FRCB_TYPES_MAND_PM = new Set(Array.from({ length: 35 }, (_, i) => String(i + 1).padStart(2, '0')));

    // Types de relations (Annexe 9)
    const FRCB_RELATIONS_PP = new Set(['01', '02', '03', '04', '05']);
    const FRCB_RELATIONS_PM = new Set(['04', '05', '06', '07', '08', '09']);


    // =========================================================================
    // 2. DICTIONNAIRE D'ACTIONS CORRECTIVES PAR CODE D'ERREUR BEAC
    // =========================================================================

    const BEAC_RULES_META = {
        // En-tête (ENT)
        'ENT0001': {
            libelle: 'Numéro de déclaration invalide',
            categorie: 'En-tête',
            type: 'Erreur',
            action: 'Le numéro de déclaration doit comporter exactement 4 chiffres (ex: 0001, 0002). Modifier la saisie dans l\'en-tête.'
        },
        'ENT0002': {
            libelle: 'Code pays inexistant',
            categorie: 'En-tête',
            type: 'Erreur',
            action: 'Saisir un code pays conforme à la norme ISO / Annexe 1 BEAC (ex: TD pour le Tchad, CM pour le Cameroun, GA pour le Gabon).'
        },
        'ENT0003': {
            libelle: 'Code déclarant inexistant ou format invalide',
            categorie: 'En-tête',
            type: 'Erreur',
            action: 'Renseigner le code banque officiel sur 5 chiffres (ex: 60002) ou le code SESAME sur 7 chiffres pour un EMF.'
        },
        'ENT0006': {
            libelle: 'Type déclaration inexistant',
            categorie: 'En-tête',
            type: 'Erreur',
            action: 'Le type de déclaration doit être "51" pour la Centrale des Risques CDR.'
        },
        'ENT0007': {
            libelle: 'Nature de déclaration invalide',
            categorie: 'En-tête',
            type: 'Erreur',
            action: 'Indiquer une nature valide : "00" (Reprise), "01" (Création / Nouveaux contrats), "02" (Mise à jour / Anciens contrats) ou "03" (Corrective).'
        },
        'ENT0008': {
            libelle: 'Nombre de lignes déclarées invalide',
            categorie: 'En-tête',
            type: 'Erreur',
            action: 'L\'attribut NbrDec de l\'en-tête doit correspondre exactement au nombre total d\'éléments déclarés dans le fichier.'
        },
        'ENT0009': {
            libelle: 'Le format de date doit être JJMMAAAA',
            categorie: 'Syntaxique',
            type: 'Erreur',
            action: 'Formater la date sur 8 chiffres au format JJMMAAAA sans aucun séparateur "/" ou "-".'
        },
        'ENT0010': {
            libelle: 'La date est invalide (dépassement calendaire)',
            categorie: 'Syntaxique',
            type: 'Erreur',
            action: 'Vérifier la validité calendaire : le jour ne peut pas dépasser le nombre de jours effectifs du mois (ex: 30 pour avril/juin/septembre/novembre, 28/29 pour février).'
        },
        'ENT0012': {
            libelle: 'Date d\'arrêté invalide (doit être le dernier jour du mois)',
            categorie: 'En-tête',
            type: 'Erreur',
            action: 'La date d\'arrêté comptable (DATARR) DOIT obligatoirement être le dernier jour calendaire du mois (ex: 30/06/2023, 31/07/2023, 31/12/2023).'
        },
        'ENT0013': {
            libelle: 'La date de déclaration doit être supérieure ou égale à la date d\'arrêté',
            categorie: 'En-tête',
            type: 'Erreur',
            action: 'Ajuster la date de génération (DATDEC) : elle ne peut pas être antérieure à la date de situation des encours (DATARR).'
        },
        'ENT0014': {
            libelle: 'Les données de l\'entête non conformes au nom du fichier',
            categorie: 'En-tête',
            type: 'Erreur',
            action: 'Aligner le nom de fichier sur la nomenclature BEAC : PAYS-CODEBANQUE-NUMDEC-DATDEC-TYPDEC-TYPEFICHIER.xml.'
        },
        'ENT0016': {
            libelle: 'Champ obligatoire non fourni dans l\'en-tête',
            categorie: 'En-tête',
            type: 'Erreur',
            action: 'Renseigner tous les paramètres obligatoires d\'en-tête (Code Pays, Code Déclarant, N° Déclaration, Date Arrêté, Date Déclaration).'
        },
        'ENT0018': {
            libelle: 'Pays hors périmètre de la déclaration',
            categorie: 'En-tête',
            type: 'Erreur',
            action: 'Le déclarant doit faire partie de la zone CEMAC (CM, CF, CG, GA, GQ, TD).'
        },

        // Obligatoires / Syntaxiques (OBL & SYN)
        'OBL001': {
            libelle: 'Balise obligatoire non fournie',
            categorie: 'Structure',
            type: 'Erreur',
            action: 'Vérifier la présence des balises requises (<TitulaireEngagement> sous <Engagement>, <TitulaireCompte> sous <CompteDebiteur>).'
        },
        'OBL002': {
            libelle: 'Champ obligatoire ou conditionné non fourni',
            categorie: 'Obligatoire',
            type: 'Erreur',
            action: 'Renseigner la valeur du champ obligatoire ou conditionné dans le fichier source ou la base bancaire.'
        },
        'OBL003': {
            libelle: 'Valeur référentielle invalide (non répertoriée BEAC)',
            categorie: 'Référentiel',
            type: 'Erreur',
            action: 'Remplacer la valeur actuelle par un code reconnu dans les annexes officielles de la BEAC (Annexe 1 à 7).'
        },
        'OBL004': {
            libelle: 'Valeur référentielle facultative non conforme',
            categorie: 'Référentiel',
            type: 'Avertissement',
            action: 'Vérifier la conformité de la valeur avec le référentiel BEAC ou laisser vide si non applicable.'
        },
        'SYN001': {
            libelle: 'La taille du champ doit être conforme à la longueur définie',
            categorie: 'Syntaxique',
            type: 'Erreur',
            action: 'Ajuster la longueur du champ pour qu\'elle respecte strictement la taille fixe prescrite par la BEAC (ex: Code Agence = 5 car., Statut = 2 car.).'
        },
        'SYN002': {
            libelle: 'Le champ de type numérique doit contenir uniquement des chiffres',
            categorie: 'Syntaxique',
            type: 'Erreur',
            action: 'Supprimer les lettres, espaces ou caractères spéciaux. Seuls les chiffres sont admis.'
        },
        'SYN003': {
            libelle: 'Le format de date doit être JJMMAAAA',
            categorie: 'Syntaxique',
            type: 'Erreur',
            action: 'Corriger le format de la date pour avoir exactement 8 chiffres au format JJMMAAAA (ex: 30062023).'
        },
        'SYN004': {
            libelle: 'Le champ de type décimal ne doit pas contenir de virgule',
            categorie: 'Syntaxique',
            type: 'Erreur',
            action: 'Remplacer la virgule "," par un point "." comme séparateur décimal.'
        },
        'SYN005': {
            libelle: 'Syntaxe XML erronée',
            categorie: 'Syntaxique',
            type: 'Erreur',
            action: 'Vérifier la validité de la structure XML (balises correctement fermées, attributs entre guillemets).'
        },
        'SYN006': {
            libelle: 'Champ ne doit pas contenir de caractères spéciaux',
            categorie: 'Syntaxique',
            type: 'Erreur',
            action: 'Pour les noms propres des personnes physiques, seuls les caractères (-), (_) et (\') sont autorisés. Supprimer tout autre caractère spécial.'
        },
        'SYN007': {
            libelle: 'Le champ ne doit pas contenir plus que 2 chiffres',
            categorie: 'Syntaxique',
            type: 'Erreur',
            action: 'Les champs noms propres des personnes physiques ne doivent pas contenir plus de deux chiffres.'
        },
        'SYN008': {
            libelle: 'Valeur du champ non conforme (tokens d\'un seul caractère interdits)',
            categorie: 'Syntaxique',
            type: 'Erreur',
            action: 'Le champ ne peut pas contenir de mots d\'un seul caractère (ex: "A B", "JACK B"). Indiquer le nom ou prénom complet.'
        },
        'SYN009': {
            libelle: 'Valeur du champ non acceptée (terme générique ou civilité interdite)',
            categorie: 'Syntaxique',
            type: 'Erreur',
            action: 'Les mentions génériques (NSP, NA, ND, INCONNU, PND...) et les titres de civilité (MR, MME, DR, MAITRE...) sont formellement rejetés par la BEAC (Annexe 1 Section 9.1). Renseigner l\'identité réelle.'
        },
        'SYN010': {
            libelle: 'Le champ ne doit pas contenir un caractère en série',
            categorie: 'Syntaxique',
            type: 'Erreur',
            action: 'Les séquences de caractères identiques consécutifs (ex: XXXXX, AAAAA, 00000) sont rejetées par la BEAC.'
        },
        'SYN011': {
            libelle: 'Format invalide de pièce d\'identité, RCCM ou NIF/NIU',
            categorie: 'Syntaxique',
            type: 'Erreur',
            action: 'La longueur alphanumérique (hors ponctuation et espaces) doit respecter la grille stricte du pays émetteur (Annexe 2 Section 9.2).'
        },
        'SYN012': {
            libelle: 'Numéro de téléphone invalide',
            categorie: 'Syntaxique',
            type: 'Avertissement',
            action: 'Le numéro de téléphone doit contenir de 9 à 16 chiffres, commencer obligatoirement par "00" suivi de l\'indicatif international pays sur 3 chiffres (ex: 00235...), sans aucun espace, tiret ni séparateur.'
        },
        'SYN013': {
            libelle: 'Adresse mail non valide',
            categorie: 'Syntaxique',
            type: 'Avertissement',
            action: 'L\'adresse électronique doit respecter la syntaxe standard (utilisateur@domaine.ext).'
        },
        'SYN014': {
            libelle: 'Format de pièce ou identifiant facultatif non conforme',
            categorie: 'Syntaxique',
            type: 'Avertissement',
            action: 'Vérifier la longueur de l\'identifiant par rapport au référentiel du pays d\'émission.'
        },

        // Logiques (LOG)
        'LOG001': {
            libelle: 'La date d\'événement doit être inférieure ou égale à la date de déclaration',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Corriger DATEVE : la date de l\'événement ne peut pas être postérieure à la date du jour de la déclaration.'
        },
        'LOG002': {
            libelle: 'La date de fin doit être strictement supérieure à la date de début',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Vérifier DATFIN et DATDEB (ou DatFinPiece > DatEmPiece, DatFinMand > DatDebMand) : la date de fin doit être postérieure à la date de début.'
        },
        'LOG003': {
            libelle: 'Incohérence entre la nature d\'engagement et le type de client (PP / PM)',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'La nature d\'engagement renseignée n\'est pas autorisée pour cette catégorie de client (Annexe 3 COBAC). Les natures 05 et 09 sont réservées aux Personnes Physiques (PP). Les natures 01, 03, 13 à 18, 23 à 25, 27, 29, 30 sont réservées aux Personnes Morales (PM). Modifier la nature de l\'engagement ou vérifier le type du client.'
        },
        'LOG005': {
            libelle: 'Identifiant interne et Nom/Raison sociale non concordants',
            categorie: 'Logique',
            type: 'Avertissement',
            action: 'Vérifier la concordance entre l\'identifiant interne et le nom enregistré au niveau de la Centrale des Risques.'
        },
        'LOG006': {
            libelle: 'Déclaré existe déjà au niveau de la CDR (doublon en création)',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Un client ne peut pas être déclaré en nature "01 : Création" s\'il est déjà enregistré chez le même déclarant. Utiliser le code "02 : Mise à jour".'
        },
        'LOG007': {
            libelle: 'La date de naissance doit être inférieure à la date de déclaration',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Pour une personne physique, DATNAI doit être strictement antérieure à la date de déclaration.'
        },
        'LOG008': {
            libelle: 'Incohérence dans les données relatives à la résidence',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Si le client est déclaré "01 : Résident", le pays de résidence (PaysRes pour PP, PaysSiege pour PM) doit être identique au pays du déclarant.'
        },
        'LOG010': {
            libelle: 'L\'agent économique et le type de déclaration ne concordent pas',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Pour une personne physique, l\'agent économique doit être 1080 (Professions libérales), 1100 (Particuliers nationaux) ou 1110 (Particuliers étrangers). Pour une personne morale, il doit être entre 1010 et 1210.'
        },
        'LOG011': {
            libelle: 'Le champ RCCM ne doit pas être renseigné pour les particuliers',
            categorie: 'Logique',
            type: 'Avertissement',
            action: 'Le RCCM n\'est applicable aux personnes physiques que pour les agents économiques 1080 ou 1090.'
        },
        'LOG012': {
            libelle: 'Le champ chiffre d\'affaires ne doit pas être renseigné pour les particuliers',
            categorie: 'Logique',
            type: 'Avertissement',
            action: 'Le chiffre d\'affaires ne s\'applique aux personnes physiques que pour les agents économiques 1080 ou 1090.'
        },
        'LOG013': {
            libelle: 'Le champ nombre d\'employés ne doit pas être renseigné pour les particuliers',
            categorie: 'Logique',
            type: 'Avertissement',
            action: 'Le nombre d\'employés ne s\'applique aux personnes physiques que pour les agents économiques 1080 ou 1090.'
        },
        'LOG014': {
            libelle: 'La date d\'entrée en relation doit être inférieure ou égale à la date de session',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'La date d\'entrée en relation (DATENTRELPAR) ne peut pas être postérieure à la date de déclaration.'
        },
        'LOG015': {
            libelle: 'La date de début ne doit pas être supérieure à la date de session',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'La date d\'émission de pièce (DATEMPIECE) ou de début de mandat ne peut pas être postérieure à la date de déclaration.'
        },
        'LOG017': {
            libelle: 'La ville et la région de l\'adresse ne sont pas concordantes',
            categorie: 'Logique',
            type: 'Avertissement',
            action: 'Vérifier la cohérence entre le code ville et le code région selon l\'Annexe 3 de la zone CEMAC.'
        },
        'LOG018': {
            libelle: 'La région et le pays de l\'adresse ne sont pas concordants',
            categorie: 'Logique',
            type: 'Avertissement',
            action: 'Vérifier la concordance entre le code région et le pays de l\'adresse.'
        },
        'LOG019': {
            libelle: 'Le pays de résidence et le pays de l\'adresse principale ne sont pas concordants',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Pour une personne physique, le pays de l\'adresse de résidence principale doit correspondre à PaysRes.'
        },
        'LOG020': {
            libelle: 'Le pays du siège social et le pays de l\'adresse de siège ne concordent pas',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Pour une personne morale, le pays de l\'adresse du siège social doit correspondre à PaysSiege.'
        },
        'LOG021': {
            libelle: 'Type d\'adresse et type de client non concordants',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Une personne morale ne peut pas avoir d\'adresse de résidence principale (01) ou secondaire (02) ; utiliser siège social (03), fiscale (04), professionnelle (06) ou correspondance (07).'
        },
        'LOG022': {
            libelle: 'Le mandataire doit être déjà déclaré par le participant',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Le mandataire (IdIntMand) doit avoir été préalablement déclaré en tant que personne physique.'
        },
        'LOG023': {
            libelle: 'L\'identifiant interne du mandataire ne doit pas être l\'identifiant du déclaré',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Un déclaré ne peut pas être son propre mandataire (IdIntMand != IdIntCli).'
        },
        'LOG024': {
            libelle: 'Le mandataire doit être une personne physique dans la base FRCB',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Le mandataire d\'une entreprise ou d\'un particulier doit impérativement être une personne physique.'
        },
        'LOG025': {
            libelle: 'Le mandataire ne doit pas être sous Tutelle / Curatelle',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Une personne sous tutelle ou curatelle ne peut pas exercer la fonction de mandataire.'
        },
        'LOG026': {
            libelle: 'L\'identifiant interne de la relation ne doit pas être l\'identifiant du client',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'IdIntRel doit être différent de IdIntCli.'
        },
        'LOG027': {
            libelle: 'Type de relation non concordant avec le type de client',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Une personne morale ne peut pas avoir de relation familiale (conjoint 01 ou enfant 03).'
        },
        'LOG028': {
            libelle: 'La date de création de l\'entreprise doit être inférieure à la date de session',
            categorie: 'Logique',
            type: 'Avertissement',
            action: 'Pour une personne morale, DATCRE doit être antérieure à la date de déclaration.'
        },
        'LOG029': {
            libelle: 'L\'identifiant de l\'actionnaire ne doit pas être l\'identifiant du client',
            categorie: 'Logique',
            type: 'Avertissement',
            action: 'IdIntAct doit être différent de IdIntCli.'
        },
        'LOG030': {
            libelle: 'Date fin d\'interdiction ne doit pas être renseignée sans interdiction',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Si SitJud = 0 (Pas d\'interdiction), DatFinInt doit être vide.'
        },
        'LOG031': {
            libelle: 'Date début d\'interdiction ne doit pas être renseignée sans interdiction',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Si SitJud = 0 (Pas d\'interdiction), DatDebInt doit être vide.'
        },
        'LOG032': {
            libelle: 'Date fin d\'interdiction ne doit pas être inférieure à la date de session',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Pour un client interdit actif, la date de fin d\'interdiction doit être supérieure à la date de session.'
        },
        'LOG034': {
            libelle: 'Identifiant de l\'employeur ne doit pas être l\'identifiant du déclaré',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'IdIntEmp doit être différent de IdIntCli.'
        },
        'LOG035': {
            libelle: 'Identifiant de l\'employeur ne doit pas être l\'identifiant du mandataire',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'IdIntEmp doit être différent de IdIntMand.'
        },
        'LOG037': {
            libelle: 'Balise employeur non cohérente avec l\'agent économique',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'La balise employeur ne s\'applique pas aux professions libérales (1080).'
        },
        'LOG038': {
            libelle: 'Le nom marital ne doit pas être déclaré pour le sexe masculin',
            categorie: 'Logique',
            type: 'Avertissement',
            action: 'Le champ NomMar ne doit pas être renseigné pour les déclarés de sexe masculin (Sexe = M).'
        },
        'LOG041': {
            libelle: 'Date d\'entrée en relation doit être supérieure à la date de création de l\'entreprise',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Pour une personne morale, DatEntRelPar doit être supérieure ou égale à DatCre.'
        },
        'LOG042': {
            libelle: 'Date d\'évènement doit être supérieure ou égale à la date de création',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Pour une personne morale, DatEve doit être supérieure ou égale à DatCre.'
        },
        'LOG046': {
            libelle: 'Date fin mandat doit être supérieure à la date de session',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Pour un mandat actif, DatFinMand doit être postérieure à la date de déclaration.'
        },
        'LOG054': {
            libelle: 'Date d\'événement doit être inférieure ou égale à la date de session',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'DatEve ne peut pas être postérieure à la date de déclaration.'
        },
        'LOG057': {
            libelle: 'Statut matrimonial non concordant avec le type d\'autre relation',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Vérifier la concordance entre SitMat et la relation conjoint déclarée.'
        },
        'LOG058': {
            libelle: 'Doublon d\'identifiant client dans le même fichier',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Un même identifiant client (IdIntCli) ne peut pas apparaître plusieurs fois dans le même fichier de déclaration FRCB.'
        },
        'LOG063': {
            libelle: 'Nom marital non concordant avec le sexe ou la situation matrimoniale',
            categorie: 'Logique',
            type: 'Avertissement',
            action: 'NomMar ne doit être renseigné que pour une femme (Sexe = F) mariée (SitMat = 02).'
        },
        'LOG065': {
            libelle: 'Le champ SectAct ne doit pas être renseigné',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Le secteur d\'activité ne doit pas être renseigné pour les particuliers nationaux ou étrangers (1100, 1110).'
        },
        'LOG069': {
            libelle: 'Le nom complet ne doit être déclaré que si le nom et prénom ne sont pas déclarés',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Si les champs Nom et Prénom sont séparément renseignés, le champ NomComplet doit rester vide.'
        },
        'LOG070': {
            libelle: 'Même pièce d\'identité déjà déclarée pour une autre personne physique',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Le couple (TypPiece, NumPiece) doit être unique par personne physique dans la déclaration.'
        },
        'LOG073': {
            libelle: 'Le pays d\'émission et le type de pièce ne concordent pas',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Les CNI, permis et récépissés doivent être émis par le pays du déclarant ; seul le passeport (02) admet tous pays d\'émission.'
        },
        'LOG0002': {
            libelle: 'Référence contrat inexistante ou vide',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Attribuer une référence unique et non vide au contrat ou compte (REFCONTCMPT).'
        },
        'LOG0003': {
            libelle: 'La nature d\'engagement et le type d\'engagement ne sont pas concordants',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Corriger TYPENG selon la nature COBAC (Annexe 3) : Type 01 (Avec échéancier) pour prêts amortissables (01..09, 12, 20..22, 30..31) ; Type 02 (Sans échéancier) pour découverts, cautions, avals et effets (13..18, 23..29) ; Type 03 pour Cartes (19).'
        },
        'LOG0004': {
            libelle: 'Le montant initial du crédit doit être supérieur à 0',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Le montant nominal du prêt ou le montant de l\'autorisation (MNTENG) doit être strictement positif (> 0 XAF).'
        },
        'LOG0005': {
            libelle: 'La date de mise en place doit être inférieure ou égale à la date de déclaration',
            categorie: 'Logique',
            type: 'Avertissement',
            action: 'Vérifier la date de mise en place (DATMEP) : elle est généralement antérieure ou égale à la date de déclaration.'
        },
        'LOG0006': {
            libelle: 'La date de mise en place doit être inférieure ou égale à la date début du contrat',
            categorie: 'Logique',
            type: 'Avertissement',
            action: 'Vérifier DATMEP et DATDEB : la signature/déblocage intervient normalement avant ou le jour de prise d\'effet.'
        },
        'LOG0007': {
            libelle: 'La date de mise en place doit être inférieure à la date fin du contrat',
            categorie: 'Logique',
            type: 'Avertissement',
            action: 'Vérifier DATMEP et DATFIN : la date de mise en place ne peut pas dépasser la maturité finale du contrat.'
        },
        'LOG0008': {
            libelle: 'Le taux effectif global (TEG) doit être supérieur ou égal au taux d\'intérêt nominal',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Le TEG (TXEFFGLOB) intègre tous les frais et doit être supérieur ou égal au taux nominal (TXINT). Corriger le TEG ou le taux nominal.'
        },
        'LOG0009': {
            libelle: 'Durée de l\'engagement, date début et date fin non concordants',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'La durée déclarée (DUREE) en jours, mois ou années (UNITDUR) doit correspondre à l\'écart entre DATDEB et DATFIN.'
        },
        'LOG0010': {
            libelle: 'La durée de l\'engagement ne concorde pas avec la maturité déclarée',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Ajuster MATURITE selon les règles du KIT-CDR BEAC : Court Terme "01" (eng <= 730 jours), Moyen Terme "02" (eng entre 731 et 3650 jours), Long Terme "03" (eng >= 3651 jours).'
        },
        'LOG0011': {
            libelle: 'La date de première échéance doit être supérieure ou égale à la date de MEP',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'La date du premier remboursement en capital (DATPREECHCAP) doit être postérieure ou égale à la mise en place (DATMEP).'
        },
        'LOG0012': {
            libelle: 'La date de la première échéance doit être supérieure ou égale à la date début',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'La date de la première échéance (DATPREECHCAP) doit être postérieure ou égale à la date début du crédit (DATDEB).'
        },
        'LOG0013': {
            libelle: 'Nombre total des échéances incorrect',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Pour un crédit amortissable (Type 01), le nombre d\'échéances (NBRECH) doit être un entier positif non nul.'
        },
        'LOG0014': {
            libelle: 'Le montant moyen de l\'échéance doit être supérieur à 0',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Pour un crédit avec échéancier, le montant de l\'échéance (MNTECH) doit être supérieur à 0 XAF.'
        },
        'LOG0015': {
            libelle: 'Le montant total des intérêts doit être supérieur à 0 pour les crédits avec échéanciers',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Renseigner le cumul des intérêts prévisionnels du contrat (TOTINT > 0 XAF).'
        },
        'LOG0016': {
            libelle: 'Le type de consolidation ne doit pas être renseigné si le contrat n\'est pas consolidé',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Ne pas renseigner TYPCONSO si le statut du contrat n\'est pas "01" (Consolidé).'
        },
        'LOG0017': {
            libelle: 'Motif de clôture invalide ou incohérent avec le statut',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Si STATUT = "02" (Clôturé), renseigner un motif valide parmi : 01 (Fin à terme), 02 (Remb. anticipé), 03 (Consolidation), 04 (Cession), 05 (Perte), 06 (Leasing), 07 (Autre). Si le contrat est actif, laisser ce champ vide.'
        },
        'LOG0018': {
            libelle: 'L\'indice de référence ne concorde pas avec le type de taux déclaré',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Si TYPTXINT = "01" (Taux Variable), INDREF est obligatoire (01: TBB, 02: LIBOR, 03: EURIBOR, 04: TIAO BEAC). Si taux fixe, laisser INDREF vide.'
        },
        'LOG0019': {
            libelle: 'Le spread ne concorde pas avec le type de taux déclaré',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Si TYPTXINT = "01" (Variable), renseigner la marge SPRD. Pour un taux fixe, laisser SPRD vide.'
        },
        'LOG0020': {
            libelle: 'Valeur du champ non applicable pour ce type d\'engagement',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Les champs d\'échéancier (PERIODICITE, DATPREECHCAP, NBRECH, TYPECH, MNTECH, TYPAMO, TOTINT) sont réservés aux crédits amortissables (TYPENG="01"). Les laisser vides pour les découverts et engagements par signature.'
        },
        'LOG0021': {
            libelle: 'Balise consolidation obligatoire si le statut est "01 : Consolidé"',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Pour un contrat consolidé (STATUT="01"), déclarer la balise <Consolidation RefInt="..."/> pointant vers l\'ancien contrat clôturé.'
        },
        'LOG053': {
            libelle: 'Montant créance cédée est obligatoire pour l\'affacturage',
            categorie: 'Logique',
            type: 'Erreur',
            action: 'Renseigner obligatoirement MNTCRCEDEE pour les engagements de nature Affacturage (NATENG="24").'
        },
        'LOG0026': {
            libelle: 'La valeur de la garantie doit être supérieure à 0',
            categorie: 'Garanties',
            type: 'Erreur',
            action: 'La valeur de la garantie affectée (MNTGAR) doit être strictement supérieure à 0.'
        },
        'LOG0027': {
            libelle: 'Le montant affecté de la garantie doit être supérieur à 0',
            categorie: 'Garanties',
            type: 'Erreur',
            action: 'Le montant affecté au crédit (MNTAFFGAR) doit être strictement supérieur à 0.'
        },
        'LOG0028': {
            libelle: 'Le montant affecté de la garantie doit être inférieur ou égal à la valeur de la garantie',
            categorie: 'Garanties',
            type: 'Avertissement',
            action: 'Le montant affecté (MNTAFFGAR) ne peut théoriquement pas dépasser la valeur de la sûreté (MNTGAR).'
        },
        'LOG0029': {
            libelle: 'Le montant affecté de la garantie doit couvrir le nominal du crédit',
            categorie: 'Garanties',
            type: 'Avertissement',
            action: 'Vérifier la quotité de couverture de la garantie par rapport au montant nominal du crédit (MNTENG).'
        },
        'LOG0033': {
            libelle: 'La date d\'échéance doit être inférieure ou égale à la date d\'arrêté',
            categorie: 'Encours',
            type: 'Erreur',
            action: 'La date de la dernière échéance échue constatée (DATECH) doit être antérieure ou égale à la date d\'arrêté comptable.'
        },
        'LOG0034': {
            libelle: 'Valeur du champ non applicable pour ce type d\'engagement',
            categorie: 'Encours',
            type: 'Avertissement',
            action: 'DATECH n\'est applicable que pour les crédits avec échéancier (TYPENG="01").'
        },
        'LOG0036': {
            libelle: 'Le montant utilisé doit être inférieur ou égal au montant de l\'autorisation',
            categorie: 'Encours',
            type: 'Erreur',
            action: 'Le montant total utilisé (MNTTOTUTIL) ne peut pas excéder le montant nominal ou l\'autorisation accordée (MNTENG).'
        },
        'LOG0001': {
            libelle: 'Contrat clôturé',
            categorie: 'Encours',
            type: 'Erreur',
            action: 'Le contrat d\'engagement support est clôturé (STATUT="02"). Aucun encours ne doit être déclaré pour un contrat clôturé.'
        },
        'LOG0037': {
            libelle: 'La somme des échéances (payés, impayés et restantes) est différente du nombre total d’échéances déclaré au niveau du contrat.',
            categorie: 'Encours',
            type: 'Erreur',
            action: 'Pour un crédit amortissable (TYPENG="01"), la somme des échéances payées (NBRECHPAY), impayées (NBRECHIMP) et restantes (NBRECHRES) déclarées dans l\'encours DOIT être strictement égale au nombre total d\'échéances (NBRECH) déclaré dans l\'engagement (NBRECH = NBRECHPAY + NBRECHIMP + NBRECHRES).'
        },
        'LOG0039': {
            libelle: 'Le nombre d\'échéances payées et impayées doit être cohérent',
            categorie: 'Encours',
            type: 'Erreur',
            action: 'La somme des échéances payées (NBRECHPAY) et impayées (NBRECHIMP) ne peut en aucun cas excéder le nombre total d\'échéances contractuel (NBRECH).'
        },
        'LOG0040': {
            libelle: 'Le montant encours en souffrance et le nombre des échéances impayées ne sont pas concordants',
            categorie: 'Encours',
            type: 'Avertissement',
            action: 'Si des échéances impayées existent (NBRECHIMP > 0), un montant en souffrance (MNTCRESOUF > 0) doit être déclaré, et inversement.'
        },
        'LOG0041': {
            libelle: 'La classe de dépréciation et la situation de l\'encours ne concordent pas',
            categorie: 'Encours',
            type: 'Avertissement',
            action: 'Un encours classé en "01 : Saines" ne peut comporter aucun arriéré (NBRJRSIMP=0, MNTCRESOUF=0). S\'il y a du retard, reclasser l\'encours (04, 07..11) conformément à la grille COBAC (Annexe 4.3).'
        },
        'LOG0042': {
            libelle: 'Le nombre d\'échéances impayées et le nombre de jours en souffrance ne concordent pas',
            categorie: 'Encours',
            type: 'Erreur',
            action: 'Si NBRECHIMP > 0, le nombre de jours de retard (NBRJRSIMP) doit être strictement supérieur à 0.'
        },
        'LOG060': {
            libelle: 'Contrôle portant sur le capital restant dû (CRDU)',
            categorie: 'Encours',
            type: 'Erreur',
            action: 'Si le crédit n\'a pas été décaissé (MNTTOTUTIL=0), le CRDU (MNTCRD) doit être nul. Si décaissé, MNTCRD <= MNTTOTUTIL. De plus, MNTCRD > 0 requiert un nombre d\'échéances restantes > 0 (NBRECHRES > 0).'
        },
        'LOG0045': {
            libelle: 'Le nombre de jours de débit non autorisé doit être supérieur à 0',
            categorie: 'Compte Débiteur',
            type: 'Erreur',
            action: 'Pour un compte en débit non autorisé, NBRJRSDEBNONAUT doit être strictement supérieur à 0.'
        },
        'LOG049': {
            libelle: 'Le solde débiteur doit être supérieur à 0',
            categorie: 'Compte Débiteur',
            type: 'Erreur',
            action: 'Le solde débiteur en anomalie (SOLDEB) doit être strictement supérieur à 0 XAF.'
        },
        'LOG051': {
            libelle: 'La classe de dépréciation et la situation du compte débiteur ne concordent pas',
            categorie: 'Compte Débiteur',
            type: 'Avertissement',
            action: 'Vérifier la concordance entre la durée du débit non autorisé (NBRJRSDEBNONAUT) et la classe réglementaire déclarée (CLASSDEPREC) selon l\'annexe 4.3 COBAC.'
        },
        'CLI0001': {
            libelle: 'Client titulaire non répertorié dans les déclarations FRCB (PP/PM)',
            categorie: 'Clients / FRCB',
            type: 'Erreur',
            action: 'Le client titulaire (IdInt) n\'a pas été identifié dans le référentiel des clients déclarés à la BEAC. Déclarer impérativement ce client dans le flux FRCB Personnes Physiques (TypDec="01") ou Personnes Morales (TypDec="02") avant de transmettre ses engagements, encours et comptes dans le CDR.'
        },
        'ENC0001': {
            libelle: 'Contrat non existant sur la plateforme',
            categorie: 'Encours',
            type: 'Erreur',
            action: 'L\'encours ne peut être déclaré que si son contrat a déjà été validé OK lors d\'une précédente déclaration BEAC ou s\'il correspond à un nouvel engagement créé dans la période d\'arrêté.'
        }
    };

    // =========================================================================
    // 3. UTILITAIRES ET FONCTIONS DE VÉRIFICATION SYNTAXIQUE ET LOGIQUE
    // =========================================================================

    /**
     * Retourne le nombre de jours dans un mois d'une année donnée (gère bissextiles)
     */
    function getDaysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
    }

    /**
     * Formate n'importe quelle date en format JJMMAAAA strict (norme BEAC / CEMAC)
     * Priorité absolue au format JJMMAAAA sur les fichiers de données bancaires.
     */
    function normalizeDateToJJMMAAAA(val) {
        if (val === undefined || val === null || val === '') return '';

        // 1. Instance JavaScript Date
        if (val instanceof Date) {
            if (isNaN(val.getTime())) return '';
            const jj = String(val.getDate()).padStart(2, '0');
            const mm = String(val.getMonth() + 1).padStart(2, '0');
            const aaaa = String(val.getFullYear());
            return `${jj}${mm}${aaaa}`;
        }

        // 2. Numéro de série Excel (ex: 45107 pour 30/06/2023)
        let numVal = null;
        if (typeof val === 'number' && !isNaN(val)) {
            numVal = val;
        } else if (typeof val === 'string' && /^\d{5}$/.test(val.trim())) {
            numVal = parseInt(val.trim(), 10);
        }

        if (numVal !== null && numVal >= 1000 && numVal <= 99999) {
            if (typeof XLSX !== 'undefined' && XLSX.SSF && XLSX.SSF.parse_date_code) {
                try {
                    const parsed = XLSX.SSF.parse_date_code(numVal);
                    if (parsed && parsed.y && parsed.m && parsed.d) {
                        const jj = String(parsed.d).padStart(2, '0');
                        const mm = String(parsed.m).padStart(2, '0');
                        const aaaa = String(parsed.y);
                        return `${jj}${mm}${aaaa}`;
                    }
                } catch (e) {}
            }
            // Fallback calcul Excel UTC
            try {
                const utcMs = Math.round((numVal - 25569) * 86400 * 1000);
                const dObj = new Date(utcMs);
                if (!isNaN(dObj.getTime())) {
                    const jj = String(dObj.getUTCDate()).padStart(2, '0');
                    const mm = String(dObj.getUTCMonth() + 1).padStart(2, '0');
                    const aaaa = String(dObj.getUTCFullYear());
                    return `${jj}${mm}${aaaa}`;
                }
            } catch (e) {}
        }

        const s = String(val).trim();
        if (!s) return '';

        // 3. Format standard avec séparateurs : JJ/MM/AAAA ou J/M/AAAA (slash, tiret, point)
        const sepMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
        if (sepMatch) {
            const jj = sepMatch[1].padStart(2, '0');
            const mm = sepMatch[2].padStart(2, '0');
            const aaaa = sepMatch[3];
            return `${jj}${mm}${aaaa}`;
        }

        // 4. Format ISO avec séparateurs : AAAA-MM-JJ
        const isoMatch = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
        if (isoMatch) {
            const aaaa = isoMatch[1];
            const mm = isoMatch[2].padStart(2, '0');
            const jj = isoMatch[3].padStart(2, '0');
            return `${jj}${mm}${aaaa}`;
        }

        // 5. Nettoyage des chiffres uniquement
        const digits = s.replace(/\D/g, '');

        // 6. Cas 8 chiffres : PRIORITÉ ABSOLUE AU FORMAT JJMMAAAA (norme bancaire BEAC)
        if (digits.length === 8) {
            const d = parseInt(digits.substring(0, 2), 10);
            const m = parseInt(digits.substring(2, 4), 10);
            const y = parseInt(digits.substring(4, 8), 10);

            // Si c'est un format JJMMAAAA valide (jour 01-31, mois 01-12, année 1900-2099)
            if (y >= 1900 && y <= 2099 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
                // C'est strictement JJMMAAAA ! NE PAS INVERSER !
                return digits;
            }

            // Si ce n'est PAS un JJMMAAAA valide, tester si c'est un format AAAAMMJJ accidentel (ex: 20230630)
            const yA = parseInt(digits.substring(0, 4), 10);
            const mA = parseInt(digits.substring(4, 6), 10);
            const dA = parseInt(digits.substring(6, 8), 10);

            if (yA >= 1900 && yA <= 2099 && mA >= 1 && mA <= 12 && dA >= 1 && dA <= 31) {
                // C'est AAAAMMJJ -> convertir en JJMMAAAA
                return `${digits.substring(6, 8)}${digits.substring(4, 6)}${digits.substring(0, 4)}`;
            }

            // Si ni l'un ni l'autre n'est un calendrier plausible, retourner les 8 chiffres bruts
            return digits;
        }

        // 7. Cas 7 chiffres (zéro omis en début pour jours 01 à 09 : ex 1062023 -> 01062023)
        if (digits.length === 7) {
            const d1 = parseInt(digits.substring(0, 1), 10);
            const m1 = parseInt(digits.substring(1, 3), 10);
            const y1 = parseInt(digits.substring(3, 7), 10);
            if (y1 >= 1900 && y1 <= 2099 && m1 >= 1 && m1 <= 12 && d1 >= 1 && d1 <= 9) {
                return `0${digits}`;
            }
        }

        // 8. Dernier recours Date() natif
        const dObj = new Date(s);
        if (!isNaN(dObj.getTime()) && dObj.getFullYear() >= 1900 && dObj.getFullYear() <= 2099) {
            const jj = String(dObj.getDate()).padStart(2, '0');
            const mm = String(dObj.getMonth() + 1).padStart(2, '0');
            const aaaa = String(dObj.getFullYear());
            return `${jj}${mm}${aaaa}`;
        }

        return s;
    }

    /**
     * Parse une date au format JJMMAAAA ou renvoie null si invalide
     */
    function parseJJMMAAAADate(str) {
        if (!str && str !== 0) return null;
        const s = normalizeDateToJJMMAAAA(str);
        if (!s || s.length !== 8) return null;

        const day = parseInt(s.substring(0, 2), 10);
        const month = parseInt(s.substring(2, 4), 10);
        const year = parseInt(s.substring(4, 8), 10);

        if (month < 1 || month > 12) return null;
        if (year < 1900 || year > 2100) return null;

        const maxDays = getDaysInMonth(year, month);
        if (day < 1 || day > maxDays) return null;

        return { 
            day, 
            month, 
            year, 
            rawStr: s, 
            dateObj: new Date(year, month - 1, day) 
        };
    }

    /**
     * Vérifie si une date correspond exactement au dernier jour calendaire de son mois
     */
    function isLastDayOfMonth(parsedDate) {
        if (!parsedDate) return false;
        const maxDays = getDaysInMonth(parsedDate.year, parsedDate.month);
        return parsedDate.day === maxDays;
    }

    /**
     * Compare deux dates JJMMAAAA. Retourne -1 si d1 < d2, 0 si d1 == d2, 1 si d1 > d2
     */
    function compareDates(parsed1, parsed2) {
        if (!parsed1 || !parsed2) return 0;
        const t1 = parsed1.dateObj.getTime();
        const t2 = parsed2.dateObj.getTime();
        if (t1 < t2) return -1;
        if (t1 > t2) return 1;
        return 0;
    }

    /**
     * Calcule la différence entre deux dates selon l'unité de durée
     */
    function calculateDuration(parsedDeb, parsedFin, unitDur) {
        if (!parsedDeb || !parsedFin) return 0;
        const diffMs = parsedFin.dateObj.getTime() - parsedDeb.dateObj.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (unitDur === '01') return diffDays; // Jours
        if (unitDur === '02') {
            // Mois
            return ((parsedFin.year - parsedDeb.year) * 12) + (parsedFin.month - parsedDeb.month);
        }
        if (unitDur === '03') {
            // Années
            return parsedFin.year - parsedDeb.year;
        }
        return diffDays;
    }

    /**
     * Extrait une valeur textuelle normalisée
     */
    function getRawValue(row, keys) {
        if (!row) return '';
        if (!Array.isArray(keys)) keys = [keys];
        for (const key of keys) {
            if (row[key] !== undefined && row[key] !== null) {
                const val = String(row[key]).trim();
                if (val !== '') return val;
            }
            const lower = key.toLowerCase();
            for (const [k, v] of Object.entries(row)) {
                if (k.toLowerCase().trim() === lower && v !== undefined && v !== null) {
                    const val = String(v).trim();
                    if (val !== '') return val;
                }
            }
        }
        return '';
    }

    /**
     * Parse un nombre décimal ou entier
     */
    function parseNumericValue(val) {
        if (val === undefined || val === null || val === '') return null;
        if (typeof val === 'number') return isNaN(val) ? null : val;
        const clean = String(val).replace(/\s/g, '').replace(',', '.');
        const num = parseFloat(clean);
        return isNaN(num) ? null : num;
    }

    /**
     * Calcule la longueur alphanumérique nette d'une chaîne (norme FRCB Annexe 9.2)
     * Compte uniquement les caractères [A-Za-z0-9]
     */
    function getAlphaNumLength(str) {
        if (!str && str !== 0) return 0;
        const clean = String(str).replace(/[^a-zA-Z0-9]/g, '');
        return clean.length;
    }

    /**
     * Nettoie les espaces multiples et normalise en majuscules
     */
    function cleanUpper(str) {
        if (!str && str !== 0) return '';
        return String(str).trim().toUpperCase().replace(/\s+/g, ' ');
    }


    // =========================================================================
    // 4. CLASSE PRINCIPALE DU MOTEUR DE CONTRÔLE BEAC
    // =========================================================================

    class BEACValidationEngine {
        constructor() {
            this.rulesMeta = BEAC_RULES_META;
        }

        /**
         * Crée un objet anomalie standardisé
         */
        createAnomaly(code, champ, valeur, ref, ligne, source, customDetail = null, customAction = null, overrideType = null) {
            const meta = this.rulesMeta[code] || {
                libelle: `Contrôle réglementaire ${code}`,
                categorie: 'Réglementaire',
                type: 'Erreur',
                action: 'Vérifier la donnée saisie selon la norme BEAC.'
            };

            const actualType = overrideType || meta.type;
            const detailMsg = (customDetail && typeof customDetail === 'string') ? customDetail : null;
            const actionMsg = (customAction && typeof customAction === 'string') ? customAction : (detailMsg && detailMsg.toLowerCase().startsWith('corriger') ? detailMsg : meta.action);

            return {
                code,
                libelle: meta.libelle,
                message: detailMsg || meta.libelle,
                type: actualType, // 'Erreur' ou 'Avertissement'
                isBlocking: actualType === 'Erreur',
                categorie: meta.categorie,
                champ: champ || 'N/A',
                valeur: valeur !== undefined && valeur !== null ? String(valeur) : '',
                ref: ref || 'SANS_REF',
                ligne: ligne !== undefined ? ligne : 1,
                source: source || 'Déclaration',
                action: actionMsg
            };
        }

        /**
         * Récupère les métadonnées réglementaires d'une nature d'engagement (Annexe 3 COBAC)
         */
        getNatureEngagement(code) {
            if (!code && code !== 0) return null;
            const s = String(code).trim();
            return NATURES_ENGAGEMENT.get(s) || NATURES_ENGAGEMENT.get(s.padStart(2, '0')) || null;
        }

        /**
         * Vérifie la cohérence réglementaire entre la nature d'engagement et le type de client (Règle LOG003)
         * - PP : réservé aux personnes physiques (ex: 05, 09)
         * - PM : réservé aux personnes morales (ex: 01, 03, 13..18, 23..25, 27, 29, 30)
         * - PP_ET_PM : ouvert à tout type de client
         */
        checkNatureClientCompatibility(natEng, clientType) {
            const info = this.getNatureEngagement(natEng);
            if (!info || !info.emp || info.emp === 'PP_ET_PM' || !clientType) {
                return { isCompatible: true, info };
            }
            const normType = String(clientType).trim().toUpperCase();
            const isPp = normType === 'PP' || normType.startsWith('PHYS') || normType === '1';
            const isPm = normType === 'PM' || normType.startsWith('MORAL') || normType === '2';

            if (info.emp === 'PM' && isPp) {
                return {
                    isCompatible: false,
                    info,
                    expectedType: 'PM',
                    actualType: 'PP',
                    message: `La nature d'engagement "${natEng}" (${info.libelle}) est réservée exclusivement aux Personnes Morales (PM). Or le client titulaire est une Personne Physique (PP).`
                };
            }
            if (info.emp === 'PP' && isPm) {
                return {
                    isCompatible: false,
                    info,
                    expectedType: 'PP',
                    actualType: 'PM',
                    message: `La nature d'engagement "${natEng}" (${info.libelle}) est réservée exclusivement aux Personnes Physiques (PP). Or le client titulaire est une Personne Morale (PM).`
                };
            }
            return { isCompatible: true, info };
        }

        /**
         * Validation complète de l'en-tête de déclaration (Adaptée FRCB PP/PM et CDR 51)
         */
        validateHeader(headerData, totalRecords) {
            const anomalies = [];
            const h = headerData || {};

            const codPay = (h.codePays || h.CodPay || '').trim().toUpperCase();
            const codDec = (h.codeBanque || h.CodDec || '').trim();
            const numDec = (h.numDec || h.NumDec || '').trim();
            const typDec = (h.typDec || h.TypDec || '51').trim();
            const natDec = (h.natDec || h.NatDec || '01').trim();
            const datDecStr = normalizeDateToJJMMAAAA(h.decDate || h.DatDec || '');
            const datArrStr = normalizeDateToJJMMAAAA(h.arrDate || h.DatArr || '');
            const isFrcb = (typDec === '01' || typDec === '02' || h.type === 'frcb-pp' || h.type === 'frcb-pm');
            const sourceLabel = isFrcb ? (typDec === '02' ? 'En-tête FRCB PM' : 'En-tête FRCB PP') : 'En-tête CDR';

            // ENT0016 : Champs obligatoires fournis
            if (!codPay) anomalies.push(this.createAnomaly('ENT0016', 'CodPay', '', 'EN-TETE', 1, sourceLabel));
            if (!codDec) anomalies.push(this.createAnomaly('ENT0016', 'CodDec', '', 'EN-TETE', 1, sourceLabel));
            if (!numDec) anomalies.push(this.createAnomaly('ENT0016', 'NumDec', '', 'EN-TETE', 1, sourceLabel));
            if (!datDecStr) anomalies.push(this.createAnomaly('ENT0016', 'DatDec', '', 'EN-TETE', 1, sourceLabel));
            if (!isFrcb && !datArrStr) anomalies.push(this.createAnomaly('ENT0016', 'DatArr', '', 'EN-TETE', 1, sourceLabel));

            // ENT0001 : Numéro de déclaration valide sur 4 chiffres
            if (numDec && (!/^\d{4}$/.test(numDec) || numDec === '0000')) {
                anomalies.push(this.createAnomaly('ENT0001', 'NumDec', numDec, 'EN-TETE', 1, sourceLabel,
                    `Le numéro de déclaration "${numDec}" doit être composé de 4 chiffres distincts de 0000 (ex: 0001).`));
            }

            // ENT0002 : Code pays référentiel
            if (codPay && !PAYS_REFERENTIEL.has(codPay)) {
                anomalies.push(this.createAnomaly('ENT0002', 'CodPay', codPay, 'EN-TETE', 1, sourceLabel,
                    `Le code pays "${codPay}" n'existe pas dans le référentiel international de la BEAC (Annexe 1).`));
            }

            // ENT0018 : Périmètre CEMAC
            if (codPay && !PAYS_CEMAC.has(codPay)) {
                anomalies.push(this.createAnomaly('ENT0018', 'CodPay', codPay, 'EN-TETE', 1, sourceLabel,
                    `Le code pays "${codPay}" est hors du périmètre CEMAC (Pays autorisés : CM, CF, CG, GA, GQ, TD).`));
            }

            // ENT0003 : Code déclarant (5 chiffres pour Banque, 7 pour EMF)
            if (codDec && !/^\d{5}$/.test(codDec) && !/^\d{7}$/.test(codDec)) {
                anomalies.push(this.createAnomaly('ENT0003', 'CodDec', codDec, 'EN-TETE', 1, sourceLabel,
                    `Le code déclarant "${codDec}" doit comporter 5 chiffres pour une banque (ex: 60002) ou 7 pour un EMF.`));
            }

            // ENT0006 : Type déclaration
            if (isFrcb) {
                if (typDec !== '01' && typDec !== '02') {
                    anomalies.push(this.createAnomaly('ENT0006', 'TypDec', typDec, 'EN-TETE', 1, sourceLabel,
                        `Le type de déclaration "${typDec}" est invalide pour FRCB. Attendu "01" (Personnes Physiques) ou "02" (Personnes Morales).`));
                }
            } else {
                if (typDec && typDec !== '51') {
                    anomalies.push(this.createAnomaly('ENT0006', 'TypDec', typDec, 'EN-TETE', 1, sourceLabel,
                        `Le type de déclaration "${typDec}" est invalide. Attendu "51" pour la Centrale des Risques (CDR).`));
                }
            }

            // ENT0007 : Nature de déclaration
            if (natDec && !['00', '01', '02', '03'].includes(natDec)) {
                anomalies.push(this.createAnomaly('ENT0007', 'NatDec', natDec, 'EN-TETE', 1, sourceLabel,
                    `La nature de déclaration "${natDec}" est invalide (Valeurs admises : 00, 01, 02, 03).`));
            }

            // ENT0009 & ENT0010 : Format et calendrier des dates
            const pDec = parseJJMMAAAADate(datDecStr);
            const pArr = isFrcb ? null : parseJJMMAAAADate(datArrStr);

            if (datDecStr && !pDec) {
                const is8 = /^\d{8}$/.test(datDecStr);
                const code = is8 ? 'ENT0010' : 'ENT0009';
                const msg = is8
                    ? `La date de déclaration "${datDecStr}" présente un dépassement calendaire (jour ou mois invalide).`
                    : `La date de déclaration "${datDecStr}" ne respecte pas le format strict JJMMAAAA sur 8 chiffres.`;
                anomalies.push(this.createAnomaly(code, 'DatDec', datDecStr, 'EN-TETE', 1, sourceLabel, msg));
            }

            if (!isFrcb && datArrStr && !pArr) {
                const is8 = /^\d{8}$/.test(datArrStr);
                const code = is8 ? 'ENT0010' : 'ENT0009';
                const msg = is8
                    ? `La date d'arrêté "${datArrStr}" présente un dépassement calendaire (jour ou mois invalide).`
                    : `La date d'arrêté "${datArrStr}" ne respecte pas le format strict JJMMAAAA sur 8 chiffres.`;
                anomalies.push(this.createAnomaly(code, 'DatArr', datArrStr, 'EN-TETE', 1, sourceLabel, msg));
            }

            // Contrôles spécifiques CDR sur DatArr et comparaison avec DatDec
            if (!isFrcb && pDec && pArr) {
                // ENT0011 : Date de déclaration ne doit pas être antérieure au début de l'exercice (01/01 de l'année d'arrêté)
                const pDebutExercice = { day: 1, month: 1, year: pArr.year, dateObj: new Date(pArr.year, 0, 1) };
                if (compareDates(pDec, pDebutExercice) < 0) {
                    anomalies.push(this.createAnomaly('ENT0011', 'DatDec', datDecStr, 'EN-TETE', 1, sourceLabel,
                        `La date de déclaration (${datDecStr}) ne doit pas être antérieure au début de l'exercice (0101${pArr.year}).`));
                }

                // ENT0012 : Date d'arrêté = DERNIER JOUR DU MOIS (Contrôle critique BEAC CDR)
                if (!isLastDayOfMonth(pArr)) {
                    const maxDays = getDaysInMonth(pArr.year, pArr.month);
                    const expected = `${String(maxDays).padStart(2, '0')}${String(pArr.month).padStart(2, '0')}${pArr.year}`;
                    anomalies.push(this.createAnomaly('ENT0012', 'DatArr', datArrStr, 'EN-TETE', 1, sourceLabel,
                        `La date d'arrêté "${datArrStr}" n'est pas le dernier jour du mois. Elle doit impérativement être fixée au ${maxDays}/${String(pArr.month).padStart(2, '0')}/${pArr.year} (${expected}).`));
                }

                // ENT0013 : DatDec >= DatArr
                if (compareDates(pDec, pArr) < 0) {
                    anomalies.push(this.createAnomaly('ENT0013', 'DatDec', datDecStr, 'EN-TETE', 1, sourceLabel,
                        `La date de déclaration (${datDecStr}) ne peut pas être antérieure à la date d'arrêté comptable (${datArrStr}).`));
                }
            }

            // ENT0008 : Cohérence NbrDec
            const nbrDecVal = parseInt(h.nbrDec || h.NbrDec || totalRecords, 10);
            if (totalRecords !== undefined && nbrDecVal !== totalRecords) {
                anomalies.push(this.createAnomaly('ENT0008', 'NbrDec', nbrDecVal, 'EN-TETE', 1, sourceLabel,
                    `Le nombre de lignes déclaré (${nbrDecVal}) diffère du nombre réel d'enregistrements (${totalRecords}).`));
            }

            return anomalies;
        }

        /**
         * Détermine si un contrat de prêt/engagement est un ancien engagement déjà déclaré ou antérieur
         * @param {Object} row Données brutes du prêt
         * @param {string} ref Référence du contrat
         * @param {Object} headerContext Contexte d'en-tête (arrêté, déclaration...)
         * @param {Object} contratsReg Référentiel des contrats déclarés
         * @returns {boolean} true si ancien engagement (Code 02 - Mise à jour), false si nouvelle création (Code 01)
         */
        isAncienEngagement(row, ref, headerContext = {}, contratsReg = null) {
            if (!row) return false;
            const cleanRef = String(ref || '').trim();

            // 1. Référencé dans le registre des contrats déjà déclarés BEAC
            if (contratsReg) {
                if (typeof contratsReg.isContractDeclared === 'function' && contratsReg.isContractDeclared(cleanRef)) {
                    return true;
                }
                if (typeof contratsReg.getAllDeclaredVariantsSet === 'function') {
                    const set = contratsReg.getAllDeclaredVariantsSet();
                    if (set) {
                        const u = cleanRef.toUpperCase();
                        if (set.has(u)) return true;
                        const ns = u.replace(/\s+/g, '');
                        if (set.has(ns)) return true;
                        const nz = ns.replace(/^0+/, '');
                        if (nz && set.has(nz)) return true;
                    }
                }
            }

            // 2. Nature de déclaration explicite (02 = Mise à jour, 00 = Reprise)
            const rowCode = String(getRawValue(row, ['CODE', 'NATDEC', 'NAT_DEC', 'NATURE_DECLARATION', 'TYP_DEC', 'TYPDEC']) || '').trim();
            if (rowCode === '02' || rowCode === '00') return true;
            if (headerContext && (headerContext.natDec === '02' || headerContext.NatDec === '02')) return true;

            // 3. Date de mise en place antérieure à la période d'arrêté
            const datMepStr = normalizeDateToJJMMAAAA(getRawValue(row, ['DATMEP', 'DATE_MEP', 'DATE_MISE_EN_PLACE', 'DATDEB', 'DATE_DEBUT']));
            if (datMepStr && headerContext && headerContext.datArrStr) {
                const pMep = parseJJMMAAAADate(datMepStr);
                const pArr = parseJJMMAAAADate(headerContext.datArrStr);
                if (pMep && pArr) {
                    const mepYM = `${pMep.annee}-${String(pMep.mois).padStart(2, '0')}`;
                    const arrYM = `${pArr.annee}-${String(pArr.mois).padStart(2, '0')}`;
                    if (mepYM < arrYM) {
                        return true;
                    }
                }
            }

            return false;
        }

        /**
         * Validation d'une ligne d'engagement (Prêt)
         * @param {Object} row Données du prêt
         * @param {number} index Index de ligne (0-based)
         * @param {Object} headerContext Contexte d'en-tête
         * @param {boolean} isAncien Prêt qualifié d'ancien engagement (Code 02 - MAJ)
         */
        validateEngagement(row, index, headerContext = {}, isAncien = false) {
            const anomalies = [];
            const lineNum = index + 2; // En tenant compte de l'en-tête Excel
            const ref = getRawValue(row, ['REFCONTCMPT', 'REFCONTCMPT2', 'REF_CONTRAT', 'NUM_CONTRAT', 'NUMCONTRAT', 'REFENG', 'REF_ENG', 'NUM_ENG', 'REF_ENGAGEMENT', 'CONTRAT', 'COMPTE', 'REFINT']) || `LIGNE_${lineNum}`;

            // LOG0002 : Référence contrat
            if (!ref || ref.startsWith('LIGNE_')) {
                anomalies.push(this.createAnomaly('LOG0002', 'RefContCmpt', '', ref, lineNum, 'Prêts',
                    'La référence du contrat (REFCONTCMPT) est obligatoire et ne peut pas être vide.'));
            }

            // OBL002 : Champs obligatoires inconditionnels de la balise <Engagement>
            const codAge = getRawValue(row, ['CODAGE', 'CODE_AGENCE', 'AGENCE']);
            const statut = getRawValue(row, ['STATUT', 'STATUT_CONTRAT']);
            const typEng = getRawValue(row, ['TYPENG', 'TYPE_ENG', 'TYPE_ENGAGEMENT']);
            const natEng = getRawValue(row, ['NATENG', 'NATURE_ENG', 'NATURE']);
            const codDev = getRawValue(row, ['CODDEV', 'DEVISE']) || 'XAF';
            const mntEngRaw = getRawValue(row, ['MNTENG', 'MONTANT', 'MNT_INITIAL', 'MONTANT_INITIAL']);
            const mntEng = parseNumericValue(mntEngRaw);
            const datMepStr = normalizeDateToJJMMAAAA(getRawValue(row, ['DATMEP', 'DATE_MEP', 'DATE_MISE_EN_PLACE']));
            const datDebStr = normalizeDateToJJMMAAAA(getRawValue(row, ['DATDEB', 'DATE_DEBUT', 'DATE_EFFET']));
            const datFinStr = normalizeDateToJJMMAAAA(getRawValue(row, ['DATFIN', 'DATE_FIN', 'DATE_ECHEANCE']));
            const unitDur = getRawValue(row, ['UNITDUR', 'UNITE_DUREE']) || '02';
            const dureeRaw = getRawValue(row, ['DUREE', 'DUREE_CONTRAT']);
            const duree = parseInt(dureeRaw, 10);
            const maturite = getRawValue(row, ['MATURITE', 'MATURITE_COBAC']);
            const datEveStr = normalizeDateToJJMMAAAA(getRawValue(row, ['DATEVE', 'DATEVET', 'DATE_EVENEMENT']));
            const txBonifie = getRawValue(row, ['TXBONIFIE', 'BONIFIE']) || '2';
            const txInt = parseNumericValue(getRawValue(row, ['TXINT', 'TAUX_NOMINAL', 'TAUX_INTERET']));
            const txEffGlob = parseNumericValue(getRawValue(row, ['TXEFFGLOB', 'TEG']));

            // Vérifications d'obligation OBL002
            if (!codAge) anomalies.push(this.createAnomaly('OBL002', 'CodAge', '', ref, lineNum, 'Prêts', 'Le code agence (CODAGE) est obligatoire.'));
            if (!statut) anomalies.push(this.createAnomaly('OBL002', 'Statut', '', ref, lineNum, 'Prêts', 'Le statut du contrat (STATUT) est obligatoire.'));
            if (!typEng) anomalies.push(this.createAnomaly('OBL002', 'TypEng', '', ref, lineNum, 'Prêts', 'Le type d\'engagement (TYPENG) est obligatoire.'));
            if (!natEng) anomalies.push(this.createAnomaly('OBL002', 'NatEng', '', ref, lineNum, 'Prêts', 'La nature d\'engagement (NATENG) est obligatoire.'));
            if (mntEngRaw === '') anomalies.push(this.createAnomaly('OBL002', 'MntEng', '', ref, lineNum, 'Prêts', 'Le montant initial du crédit (MNTENG) est obligatoire.'));
            if (!datMepStr) anomalies.push(this.createAnomaly('OBL002', 'DatMep', '', ref, lineNum, 'Prêts', 'La date de mise en place (DATMEP) est obligatoire.'));
            if (!datDebStr) anomalies.push(this.createAnomaly('OBL002', 'DatDeb', '', ref, lineNum, 'Prêts', 'La date d\'effet/début (DATDEB) est obligatoire.'));
            if (!datFinStr) anomalies.push(this.createAnomaly('OBL002', 'DatFin', '', ref, lineNum, 'Prêts', 'La date fin prévisionnelle (DATFIN) est obligatoire.'));
            if (isNaN(duree) || duree <= 0) anomalies.push(this.createAnomaly('OBL002', 'Duree', dureeRaw, ref, lineNum, 'Prêts', 'La durée du crédit (DUREE) est obligatoire et doit être strictement positive (> 0).'));
            if (!maturite) {
                anomalies.push(this.createAnomaly('OBL002', 'Maturite', '', ref, lineNum, 'Prêts', 'La maturité réglementaire COBAC (MATURITE) est obligatoire.'));
            } else if (!['01', '02', '03'].includes(maturite)) {
                anomalies.push(this.createAnomaly('OBL003', 'Maturite', maturite, ref, lineNum, 'Prêts',
                    `La maturité "${maturite}" est invalide (Valeurs autorisées KIT-CDR : 01=Court Terme <= 730 j, 02=Moyen Terme 731-3650 j, 03=Long Terme >= 3651 j).`));
            }

            // SYN001 : Longueurs fixes
            if (codAge && codAge.length !== 5) {
                anomalies.push(this.createAnomaly('SYN001', 'CodAge', codAge, ref, lineNum, 'Prêts',
                    `Le code agence "${codAge}" doit comporter exactement 5 caractères (ex: 00001).`));
            }
            if (statut && !['00', '01', '02'].includes(statut)) {
                anomalies.push(this.createAnomaly('OBL003', 'Statut', statut, ref, lineNum, 'Prêts',
                    `Le statut "${statut}" est invalide (Valeurs attendues : 00=Actif, 01=Consolidé, 02=Clôturé).`));
            }
            if (typEng && !['01', '02', '03'].includes(typEng)) {
                anomalies.push(this.createAnomaly('OBL003', 'TypEng', typEng, ref, lineNum, 'Prêts',
                    `Le type d'engagement "${typEng}" est invalide (01=Crédits avec échéancier, 02=Sans échéancier, 03=Cartes).`));
            }
            if (codDev && !DEVISES_REFERENTIEL.has(codDev)) {
                anomalies.push(this.createAnomaly('OBL003', 'CodDev', codDev, ref, lineNum, 'Prêts',
                    `La devise "${codDev}" n'est pas reconnue par la BEAC (Annexe 2). Utiliser XAF.`));
            }

            // OBL003 & LOG0003 : Nature d'engagement COBAC & Concordance TypEng
            const natEngPadded = natEng ? String(natEng).trim().padStart(2, '0') : '';
            const natEngInfo = NATURES_ENGAGEMENT.get(natEng) || NATURES_ENGAGEMENT.get(natEngPadded);
            if (!natEngInfo) {
                anomalies.push(this.createAnomaly('OBL003', 'NatEng', natEng, ref, lineNum, 'Prêts',
                    `La nature d'engagement "${natEng}" n'existe pas dans le référentiel COBAC (Codes valides de 01 à 31, Annexe 3).`));
            } else if (typEng && natEngInfo.typEng !== typEng) {
                // Incohérence LOG0003
                anomalies.push(this.createAnomaly('LOG0003', 'TypEng', typEng, ref, lineNum, 'Prêts',
                    `La nature ${natEng} ("${natEngInfo.libelle}") exige le type d'engagement "${natEngInfo.typEng}", or "${typEng}" est renseigné.`));
            }

            // LOG0004 : MntEng > 0
            if (mntEng !== null && mntEng <= 0) {
                anomalies.push(this.createAnomaly('LOG0004', 'MntEng', mntEng, ref, lineNum, 'Prêts',
                    `Le montant initial du crédit (${mntEng}) doit être strictement supérieur à 0.`));
            }

            // Dates & Chronologie (LOG002, LOG0005..07)
            const pMep = parseJJMMAAAADate(datMepStr);
            const pDeb = parseJJMMAAAADate(datDebStr);
            const pFin = parseJJMMAAAADate(datFinStr);
            const pEve = parseJJMMAAAADate(datEveStr);
            const pDec = parseJJMMAAAADate(headerContext.datDecStr);

            if (datMepStr && !pMep) anomalies.push(this.createAnomaly('SYN003', 'DatMep', datMepStr, ref, lineNum, 'Prêts'));
            if (datDebStr && !pDeb) anomalies.push(this.createAnomaly('SYN003', 'DatDeb', datDebStr, ref, lineNum, 'Prêts'));
            if (datFinStr && !pFin) anomalies.push(this.createAnomaly('SYN003', 'DatFin', datFinStr, ref, lineNum, 'Prêts'));

            // LOG002 : DatFin > DatDeb
            if (pDeb && pFin && compareDates(pFin, pDeb) <= 0) {
                anomalies.push(this.createAnomaly('LOG002', 'DatFin', datFinStr, ref, lineNum, 'Prêts',
                    `La date de fin (${datFinStr}) doit être strictement postérieure à la date de début (${datDebStr}).`));
            }

            // LOG0005 : DatMep <= DatDec (Avertissement)
            if (!isAncien && pMep && pDec && compareDates(pMep, pDec) > 0) {
                anomalies.push(this.createAnomaly('LOG0005', 'DatMep', datMepStr, ref, lineNum, 'Prêts',
                    `La date de mise en place (${datMepStr}) est postérieure à la date de déclaration (${headerContext.datDecStr}).`));
            }

            // LOG0006 : DatMep <= DatDeb (Avertissement)
            if (pMep && pDeb && compareDates(pMep, pDeb) > 0) {
                anomalies.push(this.createAnomaly('LOG0006', 'DatMep', datMepStr, ref, lineNum, 'Prêts',
                    `La date de mise en place (${datMepStr}) est postérieure à la date de début (${datDebStr}).`));
            }

            // LOG0007 : DatMep < DatFin (Avertissement)
            if (pMep && pFin && compareDates(pMep, pFin) >= 0) {
                anomalies.push(this.createAnomaly('LOG0007', 'DatMep', datMepStr, ref, lineNum, 'Prêts',
                    `La date de mise en place (${datMepStr}) doit être antérieure à la date d'échéance finale (${datFinStr}).`));
            }

            // LOG001 : DatEve <= DatDec
            if (pEve && pDec && compareDates(pEve, pDec) > 0) {
                anomalies.push(this.createAnomaly('LOG001', 'DatEve', datEveStr, ref, lineNum, 'Prêts',
                    `La date d'événement (${datEveStr}) est postérieure à la date de déclaration.`));
            }

            // LOG0008 : TEG >= TxInt
            if (txInt !== null && txEffGlob !== null) {
                if (txEffGlob < txInt) {
                    anomalies.push(this.createAnomaly('LOG0008', 'TxEffGlob', txEffGlob, ref, lineNum, 'Prêts',
                        `Le TEG (${txEffGlob}%) ne peut pas être inférieur au taux d'intérêt nominal (${txInt}%).`));
                }
            }

            // LOG0009 : Durée concordante avec dates
            if (pDeb && pFin && !isNaN(duree) && duree > 0) {
                const calcDur = calculateDuration(pDeb, pFin, unitDur);
                // Tolérance de 15% ou 2 unités
                const tolerance = Math.max(2, Math.round(calcDur * 0.15));
                if (Math.abs(calcDur - duree) > tolerance && calcDur > 0) {
                    anomalies.push(this.createAnomaly('LOG0009', 'Duree', duree, ref, lineNum, 'Prêts',
                        `La durée déclarée (${duree} ${unitDur === '01' ? 'jours' : unitDur === '02' ? 'mois' : 'années'}) ne concorde pas avec l'intervalle entre DatDeb (${datDebStr}) et DatFin (${datFinStr}) calculé à ${calcDur}.`));
                }
            }

            // LOG0010 : Concordance Durée et Maturité selon KIT-CDR BEAC
            // Règle KIT-CDR : 01 si eng <= 730 jours, 02 si eng entre 731 et 3650 jours, 03 si eng >= 3651 jours
            if (!isNaN(duree) && duree > 0 && maturite) {
                let dureeEnJours = duree;
                if (unitDur === '01') {
                    // Durée déclarée en jours
                    dureeEnJours = duree;
                } else if (unitDur === '02') {
                    // Durée déclarée en mois (24 mois = 730 jours, 120 mois = 3650 jours)
                    dureeEnJours = Math.round(duree * (365 / 12));
                } else if (unitDur === '03') {
                    // Durée déclarée en années (2 ans = 730 jours, 10 ans = 3650 jours)
                    dureeEnJours = duree * 365;
                }

                let maturiteAttendue = '01'; // CT (<= 730 jours)
                if (dureeEnJours >= 3651) {
                    maturiteAttendue = '03'; // LT (>= 3651 jours)
                } else if (dureeEnJours >= 731) {
                    maturiteAttendue = '02'; // MT (731 à 3650 jours)
                } else {
                    maturiteAttendue = '01'; // CT (<= 730 jours)
                }

                if (maturite !== maturiteAttendue) {
                    const libAtt = maturiteAttendue === '01'
                        ? '01 : Court Terme (<= 730 jours)'
                        : maturiteAttendue === '02'
                            ? '02 : Moyen Terme (731 à 3650 jours)'
                            : '03 : Long Terme (>= 3651 jours)';
                    const unitLib = unitDur === '01' ? 'jours' : unitDur === '02' ? 'mois' : 'années';
                    anomalies.push(this.createAnomaly('LOG0010', 'Maturite', maturite, ref, lineNum, 'Prêts',
                        `Pour une durée d'engagement de ${dureeEnJours} jours (${duree} ${unitLib}), la maturité réglementaire doit être "${libAtt}" au lieu de "${maturite}".`));
                }
            }

            // Règles spécifiques Crédits avec Échéancier (TYPENG == '01')
            if (typEng === '01') {
                const datPreEchCapStr = normalizeDateToJJMMAAAA(getRawValue(row, ['DATPREECHCAP', 'DATE_PREMIERE_ECHEANCE']));
                const nbrEch = parseNumericValue(getRawValue(row, ['NBRECH', 'NB_ECHEANCES']));
                const mntEch = parseNumericValue(getRawValue(row, ['MNTECH', 'MONTANT_ECHEANCE']));
                const totInt = parseNumericValue(getRawValue(row, ['TOTINT', 'TOTAL_INTERETS']));

                // OBL002 sur les champs d'échéancier
                if (!datPreEchCapStr) {
                    anomalies.push(this.createAnomaly('OBL002', 'DatPreEchCap', '', ref, lineNum, 'Prêts',
                        'La date de première échéance en capital (DATPREECHCAP) est obligatoire pour les crédits avec échéancier.'));
                } else {
                    const pPre = parseJJMMAAAADate(datPreEchCapStr);
                    if (pPre && pMep && compareDates(pPre, pMep) < 0) {
                        anomalies.push(this.createAnomaly('LOG0011', 'DatPreEchCap', datPreEchCapStr, ref, lineNum, 'Prêts',
                            `La date de première échéance (${datPreEchCapStr}) ne peut pas être antérieure à la mise en place (${datMepStr}).`));
                    }
                    if (pPre && pDeb && compareDates(pPre, pDeb) < 0) {
                        anomalies.push(this.createAnomaly('LOG0012', 'DatPreEchCap', datPreEchCapStr, ref, lineNum, 'Prêts',
                            `La date de première échéance (${datPreEchCapStr}) ne peut pas être antérieure à la date début (${datDebStr}).`));
                    }
                }

                // LOG0013 : NbrEch > 0
                if (nbrEch !== null && nbrEch <= 0) {
                    anomalies.push(this.createAnomaly('LOG0013', 'NbrEch', nbrEch, ref, lineNum, 'Prêts',
                        'Le nombre total d\'échéances (NBRECH) doit être strictement supérieur à 0 pour un crédit avec échéancier.'));
                }

                // LOG0014 : MntEch > 0
                if (mntEch !== null && mntEch <= 0) {
                    anomalies.push(this.createAnomaly('LOG0014', 'MntEch', mntEch, ref, lineNum, 'Prêts',
                        'Le montant de l\'échéance (MNTECH) doit être supérieur à 0 XAF.'));
                }

                // LOG0015 : TotInt > 0
                if (totInt !== null && totInt < 0) {
                    anomalies.push(this.createAnomaly('LOG0015', 'TotInt', totInt, ref, lineNum, 'Prêts',
                        'Le montant total des intérêts (TOTINT) ne peut pas être négatif.'));
                }
            } else if (typEng === '02' || typEng === '03') {
                // LOG0020 : Champs non applicables pour les crédits sans échéancier
                const fieldsEch = ['PERIODICITE', 'DATPREECHCAP', 'NBRECH', 'TYPECH', 'MNTECH', 'TYPAMO', 'TOTINT'];
                fieldsEch.forEach(f => {
                    const v = getRawValue(row, [f]);
                    if (v && v !== '0' && v !== '00') {
                        anomalies.push(this.createAnomaly('LOG0020', f, v, ref, lineNum, 'Prêts',
                            `L'attribut ${f} est réservé aux crédits avec échéancier (TYPENG="01"). Il doit être vide pour un crédit sans échéancier.`));
                    }
                });
            }

            // LOG0016 & LOG0021 : Consolidation
            const typConso = getRawValue(row, ['TYPCONSO']);
            if (statut !== '01' && typConso && typConso !== '') {
                anomalies.push(this.createAnomaly('LOG0016', 'TypConso', typConso, ref, lineNum, 'Prêts',
                    'Le type de consolidation ne doit pas être renseigné si le contrat n\'est pas au statut "01 : Consolidé".'));
            }
            if (statut === '01') {
                const refInt = getRawValue(row, ['REFINT', 'REF_CONSOLIDATION']);
                if (!refInt) {
                    anomalies.push(this.createAnomaly('LOG0021', 'RefInt', '', ref, lineNum, 'Prêts',
                        'Pour un contrat consolidé (STATUT="01"), la référence interne du contrat clôturé (REFINT) est obligatoire.'));
                }
            }

            // LOG0017 : Motif de clôture
            const motif = getRawValue(row, ['MOTIF', 'MOTIF_CLOTURE']);
            if (statut === '02' && (!motif || !['01', '02', '03', '04', '05', '06', '07'].includes(motif))) {
                anomalies.push(this.createAnomaly('LOG0017', 'Motif', motif, ref, lineNum, 'Prêts',
                    'Pour un contrat clôturé (STATUT="02"), renseigner un motif valide (01 à 07).'));
            } else if (statut !== '02' && motif && motif !== '') {
                anomalies.push(this.createAnomaly('LOG0017', 'Motif', motif, ref, lineNum, 'Prêts',
                    'Le motif de clôture ne doit être renseigné que si le contrat est clôturé (STATUT="02").'));
            }

            // LOG053 : Affacturage
            if (natEng === '24') {
                const mntCrCedee = parseNumericValue(getRawValue(row, ['MNTCRCEDEE', 'CREANCE_CEDEE']));
                if (mntCrCedee === null || mntCrCedee <= 0) {
                    anomalies.push(this.createAnomaly('LOG053', 'MntCrCedee', mntCrCedee, ref, lineNum, 'Prêts',
                        'Le montant de la créance cédée (MNTCRCEDEE) est obligatoire pour l\'affacturage (NATENG="24").'));
                }
            }

            // OBL001 : Titulaire obligatoire
            const idIntCli = getRawValue(row, ['IDINT', 'IDINTCLI', 'ID_CLIENT', 'CLIENT', 'ID_INT']);
            if (!idIntCli) {
                anomalies.push(this.createAnomaly('OBL001', 'TitulaireEngagement', '', ref, lineNum, 'Prêts',
                    'Chaque contrat d\'engagement doit obligatoirement avoir un titulaire identifié (balise <TitulaireEngagement IdInt="..."/>).'));
            } else {
                // CLI0001 : Titulaire obligatoirement répertorié et conforme dans les déclarations FRCB (PP/PM)
                const clientReg = headerContext.clientRegistry || (typeof window !== 'undefined' ? window.ClientsRegistryManager : null);
                if (clientReg && (typeof clientReg.isControlEnabled !== 'function' || clientReg.isControlEnabled())) {
                    if (typeof clientReg.isClientRejected === 'function' && clientReg.isClientRejected(idIntCli)) {
                        anomalies.push(this.createAnomaly('CLI0001', 'IdInt', idIntCli, ref, lineNum, 'Prêts',
                            `Le client titulaire "${String(idIntCli).trim()}" a été rejeté dans les déclarations FRCB (PP/PM) de la période courante en raison d'anomalies bloquantes sur sa fiche client. Régularisez sa fiche client dans FRCB avant de pouvoir déclarer ce prêt.`));
                    } else {
                        const isGood = typeof clientReg.isGoodClient === 'function' ? clientReg.isGoodClient(idIntCli) : clientReg.isClientDeclared(idIntCli);
                        // Vérifier si le contrat est déjà répertorié dans le registre BEAC ou si le client est historique
                        const contratsReg = headerContext.contratsRegistry || (typeof window !== 'undefined' ? window.AntiDoublonManager : null);
                        const isContractDeclaredInBeac = contratsReg && typeof contratsReg.isContractDeclared === 'function' && contratsReg.isContractDeclared(ref);
                        const isHistoricalClient = clientReg && typeof clientReg.isClientHistorical === 'function' && clientReg.isClientHistorical(idIntCli);

                        if (!isGood && !isContractDeclaredInBeac && !isHistoricalClient) {
                            anomalies.push(this.createAnomaly('CLI0001', 'IdInt', idIntCli, ref, lineNum, 'Prêts',
                                `Le client titulaire "${String(idIntCli).trim()}" n'est pas répertorié dans les déclarations FRCB (Personnes Physiques ou Morales). Déclarez-le d'abord dans FRCB avant d'inclure ses prêts dans le CDR.`));
                        }
                    }
                }
            }

            // LOG003 : Cohérence entre la nature d'engagement et le type de client (PP / PM)
            if (natEngInfo && natEngInfo.emp && natEngInfo.emp !== 'PP_ET_PM') {
                let clientType = null;
                const rawTypeCli = getRawValue(row, ['TYPCLI', 'TYPE_CLIENT', 'TYPECLI', 'TYP_CLI', 'CATCLI', 'STATUT_JURIDIQUE', 'CATEGORIE_CLIENT', 'QUALITE_JURIDIQUE', 'PERSONNE']);
                if (rawTypeCli) {
                    const upperType = rawTypeCli.toUpperCase().trim();
                    if (/^PP\b|^PHYS|^PARTICULIER|^INDIV/i.test(upperType) || upperType === '1') {
                        clientType = 'PP';
                    } else if (/^PM\b|^MORAL|^ENTREPRISE|^SOCIETE/i.test(upperType) || upperType === '2') {
                        clientType = 'PM';
                    }
                }

                if (!clientType && idIntCli) {
                    const clientReg = headerContext.clientRegistry || (typeof window !== 'undefined' ? window.ClientsRegistryManager : null);
                    if (clientReg) {
                        if (typeof clientReg.getClientType === 'function') {
                            clientType = clientReg.getClientType(idIntCli);
                        } else if (clientReg.clientsMap && typeof clientReg.clientsMap.get === 'function') {
                            const found = clientReg.clientsMap.get(String(idIntCli).trim().toUpperCase());
                            if (found && found.type) clientType = found.type;
                        }
                    }
                }

                if (clientType) {
                    const compat = this.checkNatureClientCompatibility(natEng, clientType);
                    if (!compat.isCompatible) {
                        anomalies.push(this.createAnomaly('LOG003', 'NatEng', natEng, ref, lineNum, 'Prêts',
                            `Incohérence entre la nature de l'engagement et le type de client (LOG003) : ${compat.message}`,
                            `Modifier la nature d'engagement (Annexe 3 COBAC) ou vérifier la qualité juridique du client titulaire (${idIntCli || 'N/A'}).`));
                    }
                }
            }

            return anomalies;
        }

        /**
         * Validation d'une ligne d'encours
         */
        validateEncours(row, index, headerContext = {}, engLookup = null) {
            const anomalies = [];
            const lineNum = index + 2;
            const ref = getRawValue(row, ['REFCONTCMPT', 'REFCONTCMPT2', 'REF_CONTRAT', 'NUM_CONTRAT', 'NUMCONTRAT', 'REFENG', 'REF_ENG', 'NUM_ENG', 'REF_ENGAGEMENT', 'CONTRAT', 'COMPTE', 'REFINT']) || `LIGNE_${lineNum}`;

            if (!ref || ref.startsWith('LIGNE_')) {
                anomalies.push(this.createAnomaly('LOG0002', 'RefContCmpt', '', ref, lineNum, 'Encours',
                    'La référence du contrat (REFCONTCMPT) est obligatoire dans l\'encours.'));
            }

            // OBL002 : Champs obligatoires encours
            const mntTotUtilRaw = getRawValue(row, ['MNTTOTUTIL', 'MNT_UTILISE', 'DECAISSE', 'UTILISATION']);
            const mntTotUtil = parseNumericValue(mntTotUtilRaw);
            const claDeprec = getRawValue(row, ['CLADEPREC', 'CLASSE', 'CLASSE_DEPREC', 'CLASSE_REG']);
            const mntCrd = parseNumericValue(getRawValue(row, ['MNTCRD', 'CRDU', 'CAPITAL_RESTANT_DU']));
            const datEchStr = normalizeDateToJJMMAAAA(getRawValue(row, ['DATECH', 'DATE_ECHEANCE']));
            const nbrEchPay = parseNumericValue(getRawValue(row, ['NBRECHPAY', 'ECH_PAYEES']));
            const nbrEchImp = parseNumericValue(getRawValue(row, ['NBRECHIMP', 'ECH_IMPAYEES', 'IMPAYEES']));
            const nbrEchRes = parseNumericValue(getRawValue(row, ['NBRECHRES', 'ECH_RESTANTES', 'RESTANTES']));
            const mntCreSouf = parseNumericValue(getRawValue(row, ['MNTCRESOUF', 'ENCOURS_SOUFFRANCE', 'SOUFFRANCE']));
            const nbrJrsImp = parseNumericValue(getRawValue(row, ['NBRJRSIMP', 'JOURS_IMPAYES', 'RETARD_JOURS']));

            if (mntTotUtilRaw === '') {
                anomalies.push(this.createAnomaly('OBL002', 'MntTotUtil', '', ref, lineNum, 'Encours',
                    'Le montant décaissé / utilisé (MNTTOTUTIL) est obligatoire dans l\'encours.'));
            }

            if (!claDeprec) {
                anomalies.push(this.createAnomaly('OBL002', 'ClaDeprec', '', ref, lineNum, 'Encours',
                    'La classe de dépréciation réglementaire (CLADEPREC) est obligatoire.'));
            } else if (!CLASSES_REGLEMENTAIRES.has(claDeprec)) {
                anomalies.push(this.createAnomaly('OBL003', 'ClaDeprec', claDeprec, ref, lineNum, 'Encours',
                    `La classe de dépréciation "${claDeprec}" est inconnue (Classes valides : 01, 02, 04, 05, 07, 08, 09, 10, 11).`));
            }

            // SYN002 : Contrôles syntaxiques stricts sur les champs numériques (chiffres uniquement, valeurs positives ou nulles)
            const numericFields = [
                { key: 'MntCrd', name: 'MNTCRD', raw: getRawValue(row, ['MNTCRD', 'CRDU', 'CAPITAL_RESTANT_DU']), val: mntCrd },
                { key: 'MntTotUtil', name: 'MNTTOTUTIL', raw: mntTotUtilRaw, val: mntTotUtil },
                { key: 'MntPay', name: 'MNTPAY', raw: getRawValue(row, ['MNTPAY', 'MNT_PAYE']), val: parseNumericValue(getRawValue(row, ['MNTPAY', 'MNT_PAYE'])) },
                { key: 'nbrEchPay', name: 'NBRECHPAY', raw: getRawValue(row, ['NBRECHPAY', 'ECH_PAYEES']), val: nbrEchPay },
                { key: 'nbrEchImp', name: 'NBRECHIMP', raw: getRawValue(row, ['NBRECHIMP', 'ECH_IMPAYEES']), val: nbrEchImp },
                { key: 'nbrEchRes', name: 'NBRECHRES', raw: getRawValue(row, ['NBRECHRES', 'ECH_RESTANTES']), val: nbrEchRes },
                { key: 'MntCreSouf', name: 'MNTCRESOUF', raw: getRawValue(row, ['MNTCRESOUF', 'SOUFFRANCE']), val: mntCreSouf },
                { key: 'nbrJrsImp', name: 'NBRJRSIMP', raw: getRawValue(row, ['NBRJRSIMP', 'JOURS_IMPAYES']), val: nbrJrsImp }
            ];

            numericFields.forEach(f => {
                if (f.raw !== '' && f.raw !== undefined && f.raw !== null) {
                    const rawStr = String(f.raw).trim();
                    if (rawStr.includes('-') || (f.val !== null && f.val < 0) || !/^\d+([.,]\d+)?$/.test(rawStr.replace(/\s/g, ''))) {
                        anomalies.push(this.createAnomaly('SYN002', f.key, rawStr, ref, lineNum, 'Encours',
                            `Le champ de type numérique doit contenir uniquement des chiffres : La valeur "${rawStr}" pour le champ "${f.name}" est invalide ou négative.`));
                    }
                }
            });

            // LOG0033 : DatEch <= DatArr
            const pArr = parseJJMMAAAADate(headerContext.datArrStr);
            if (datEchStr) {
                const pEch = parseJJMMAAAADate(datEchStr);
                if (pEch && pArr && compareDates(pEch, pArr) > 0) {
                    anomalies.push(this.createAnomaly('LOG0033', 'DatEch', datEchStr, ref, lineNum, 'Encours',
                        `La date de dernière échéance (${datEchStr}) ne peut pas être postérieure à la date d'arrêté (${headerContext.datArrStr}).`));
                }
            }

            // LOG060 : Contrôle CRDU
            if (mntTotUtil !== null && mntCrd !== null) {
                if (mntTotUtil === 0 && mntCrd > 0) {
                    anomalies.push(this.createAnomaly('LOG060', 'MntCrd', mntCrd, ref, lineNum, 'Encours',
                        `Le contrat n'étant pas utilisé (MNTTOTUTIL=0), le capital restant dû doit être égal à 0.`));
                } else if (mntTotUtil > 0 && mntCrd > mntTotUtil) {
                    anomalies.push(this.createAnomaly('LOG060', 'MntCrd', mntCrd, ref, lineNum, 'Encours',
                        `Le CRDU (${mntCrd} XAF) ne peut pas être supérieur au montant utilisé (${mntTotUtil} XAF).`));
                }
            }

            // LOG060 suite : MntCrd > 0 ssi NbrEchRes > 0 (applicable aux créances saines sans retard / souffrance)
            const hasImpayesOuSouffrance = (nbrEchImp && nbrEchImp > 0) || (nbrJrsImp && nbrJrsImp > 0) || (mntCreSouf && mntCreSouf > 0) || (claDeprec && claDeprec !== '01');
            if (mntCrd !== null && nbrEchRes !== null) {
                if (!hasImpayesOuSouffrance && mntCrd > 0 && nbrEchRes === 0) {
                    anomalies.push(this.createAnomaly('LOG060', 'NbrEchRes', nbrEchRes, ref, lineNum, 'Encours',
                        `Le CRDU est strictement positif (${mntCrd} XAF), or le nombre d'échéances restantes est égal à 0 pour une créance saine sans impayé.`));
                } else if (mntCrd === 0 && nbrEchRes > 0) {
                    anomalies.push(this.createAnomaly('LOG060', 'MntCrd', mntCrd, ref, lineNum, 'Encours',
                        `Le nombre d'échéances restantes est de ${nbrEchRes}, mais le CRDU est à 0.`));
                }
            }

            // LOG0042 : Concordance impayés et jours en souffrance
            if (nbrEchImp !== null && nbrJrsImp !== null) {
                if (nbrEchImp > 0 && nbrJrsImp === 0) {
                    anomalies.push(this.createAnomaly('LOG0042', 'NbrJrsImp', nbrJrsImp, ref, lineNum, 'Encours',
                        `Il y a ${nbrEchImp} échéance(s) impayée(s), or le nombre de jours en souffrance (NBRJRSIMP) est à 0.`));
                }
            }

            // LOG0040 : Concordance MntCreSouf et nbrEchImp (Avertissement)
            if (nbrEchImp !== null && mntCreSouf !== null) {
                if (nbrEchImp > 0 && mntCreSouf === 0) {
                    anomalies.push(this.createAnomaly('LOG0040', 'MntCreSouf', mntCreSouf, ref, lineNum, 'Encours',
                        `Des échéances impayées existent (${nbrEchImp}), mais le montant de la créance en souffrance est à 0.`));
                } else if (nbrEchImp === 0 && mntCreSouf > 0) {
                    anomalies.push(this.createAnomaly('LOG0040', 'NbrEchImp', nbrEchImp, ref, lineNum, 'Encours',
                        `Un montant en souffrance de ${mntCreSouf} XAF est déclaré, or NBRECHIMP est à 0.`));
                }
            }

            // LOG0041 : Concordance Classe de dépréciation (ClaDeprec) et arriérés
            if (claDeprec === '01') {
                // Créances saines ne doivent comporter aucun impayé
                if ((nbrJrsImp && nbrJrsImp > 0) || (nbrEchImp && nbrEchImp > 0) || (mntCreSouf && mntCreSouf > 0)) {
                    anomalies.push(this.createAnomaly('LOG0041', 'ClaDeprec', claDeprec, ref, lineNum, 'Encours',
                        `L'encours est classé en "01 : Saines", mais enregistre ${nbrJrsImp || 0} jours de retard / ${mntCreSouf || 0} XAF en souffrance. Reclasser l'encours selon la grille COBAC.`));
                }
            } else if (claDeprec && ['04', '07', '08', '09', '10', '11'].includes(claDeprec)) {
                // Créances dépréciées : doivent avoir des retards
                if (nbrJrsImp === 0 && (!mntCreSouf || mntCreSouf === 0) && (!nbrEchImp || nbrEchImp === 0)) {
                    anomalies.push(this.createAnomaly('LOG0041', 'ClaDeprec', claDeprec, ref, lineNum, 'Encours',
                        `L'encours est déclassé en "${claDeprec}", mais aucun retard ni impayé n'est constaté.`));
                }
            }

            // -----------------------------------------------------------------
            // LOG0037 & LOG0039 : Concordance du nombre total d'échéances
            // (Engagement.NbrEch == Encours.nbrEchPay + Encours.nbrEchImp + Encours.nbrEchRes)
            // -----------------------------------------------------------------
            let linkedEngRow = null;
            if (engLookup && typeof engLookup.get === 'function') {
                const cleanRef = ref.replace(/\s+/g, '');
                const found = engLookup.get(ref)
                    || engLookup.get(ref.toUpperCase())
                    || engLookup.get(cleanRef)
                    || engLookup.get(cleanRef.toUpperCase())
                    || (cleanRef.replace(/^0+/, '') ? engLookup.get(cleanRef.replace(/^0+/, '')) : null);
                if (found) {
                    linkedEngRow = found.row || found;
                }
            }
            if (!linkedEngRow) {
                if (row['NBRECH'] !== undefined || row['TYPENG'] !== undefined || row['MNTENG'] !== undefined) {
                    linkedEngRow = row;
                }
            }

            // -----------------------------------------------------------------
            // LOG0001 : Contrôle réglementaire de contrat clôturé
            // Un contrat clôturé (STATUT="02") ne peut comporter aucun encours.
            // -----------------------------------------------------------------
            const contratsReg = headerContext.contratsRegistry || (typeof window !== 'undefined' ? (window.AntiDoublonManager || window.DeclarisStorage) : null);
            let isContractClosed = false;
            let closeReason = '';

            // A. Détection depuis le registre / historique des retours ACQ
            if (contratsReg && typeof contratsReg.isContractClosed === 'function' && contratsReg.isContractClosed(ref)) {
                isContractClosed = true;
                closeReason = 'enregistré comme clôturé suite aux retours de la Banque Centrale';
            }

            // B. Détection depuis le contrat d'engagement support lié
            if (!isContractClosed && linkedEngRow) {
                const engStatut = getRawValue(linkedEngRow, ['STATUT', 'STATUT_CONTRAT']);
                const engMotif = getRawValue(linkedEngRow, ['MOTIF', 'MOTIF_CLOTURE']);
                if (engStatut === '02') {
                    isContractClosed = true;
                    closeReason = `le contrat support est au statut clôturé (STATUT="02"${engMotif ? `, Motif="${engMotif}"` : ''})`;
                } else if (engMotif && ['01', '02', '03', '04', '05', '06', '07'].includes(engMotif)) {
                    isContractClosed = true;
                    closeReason = `motif de clôture contractuel renseigné sur le prêt (MOTIF="${engMotif}")`;
                }
            }

            // C. Détection depuis les colonnes de statut/motif sur l'encours lui-même
            if (!isContractClosed) {
                const encStatut = getRawValue(row, ['STATUT', 'STATUT_CONTRAT']);
                const encMotif = getRawValue(row, ['MOTIF', 'MOTIF_CLOTURE']);
                if (encStatut === '02') {
                    isContractClosed = true;
                    closeReason = 'statut clôturé déclaré sur l\'encours (STATUT="02")';
                } else if (encMotif && ['01', '02', '03', '04', '05', '06', '07'].includes(encMotif)) {
                    isContractClosed = true;
                    closeReason = `motif de clôture renseigné sur l'encours (MOTIF="${encMotif}")`;
                }
            }

            // D. Détection d'un prêt complètement amorti et échu (CRDU = 0, Échéances restantes = 0, pas d'arriérés/souffrance, date d'échéance passée)
            if (!isContractClosed) {
                const isFullyAmortized = (mntCrd === 0 && nbrEchRes === 0 && (!nbrEchImp || nbrEchImp === 0) && (!mntCreSouf || mntCreSouf === 0) && (!nbrJrsImp || nbrJrsImp === 0));
                if (isFullyAmortized && datEchStr && headerContext.datArrStr) {
                    const pEch = parseJJMMAAAADate(datEchStr);
                    const pArr = parseJJMMAAAADate(headerContext.datArrStr);
                    if (pEch && pArr && compareDates(pEch, pArr) < 0) {
                        isContractClosed = true;
                        closeReason = `crédit intégralement remboursé (CRDU=0, Échéances restantes=0) dont l'échéance (${datEchStr}) est antérieure à l'arrêté (${headerContext.datArrStr})`;
                    }
                }
            }

            if (isContractClosed) {
                anomalies.push(this.createAnomaly('LOG0001', 'RefContCmpt', ref, ref, lineNum, 'Encours',
                    `Contrat clôturé : L'encours sur le contrat "${ref}" ne peut pas être déclaré car le contrat est clôturé (${closeReason}).`,
                    `Exclure cet encours de la déclaration réglementaire.`));
            }

            if (linkedEngRow) {
                const engTypEng = getRawValue(linkedEngRow, ['TYPENG', 'TYPE_ENG', 'TYPE_ENGAGEMENT']);
                const engNbrEch = parseNumericValue(getRawValue(linkedEngRow, ['NBRECH', 'NB_ECHEANCES', 'TOTAL_ECHEANCES']));

                // Pour un crédit amortissable avec échéancier (TYPENG="01" ou NbrEch présent)
                if (engTypEng === '01' || engNbrEch !== null) {
                    const pay = nbrEchPay !== null ? nbrEchPay : 0;
                    const imp = nbrEchImp !== null ? nbrEchImp : 0;
                    const res = nbrEchRes !== null ? nbrEchRes : 0;

                    // Contrôle de non-négativité
                    if (nbrEchPay !== null && nbrEchPay < 0) {
                        anomalies.push(this.createAnomaly('LOG0039', 'nbrEchPay', nbrEchPay, ref, lineNum, 'Encours',
                            `Le nombre d'échéances payées (${nbrEchPay}) ne peut pas être négatif.`));
                    }
                    if (nbrEchImp !== null && nbrEchImp < 0) {
                        anomalies.push(this.createAnomaly('LOG0039', 'nbrEchImp', nbrEchImp, ref, lineNum, 'Encours',
                            `Le nombre d'échéances impayées (${nbrEchImp}) ne peut pas être négatif.`));
                    }
                    if (nbrEchRes !== null && nbrEchRes < 0) {
                        anomalies.push(this.createAnomaly('LOG0039', 'nbrEchRes', nbrEchRes, ref, lineNum, 'Encours',
                            `Le nombre d'échéances restantes (${nbrEchRes}) ne peut pas être négatif.`));
                    }

                    if (engNbrEch !== null && engNbrEch > 0) {
                        const sumEch = pay + imp + res;

                        // LOG0039 : Dépassement payées + impayées > total
                        if (pay + imp > engNbrEch) {
                            anomalies.push(this.createAnomaly('LOG0039', 'nbrEchPay', `${pay} + ${imp} > ${engNbrEch}`, ref, lineNum, 'Encours',
                                `Le cumul des échéances payées (${pay}) et impayées (${imp}) dépasse le nombre total d'échéances prévu au contrat (NBRECH=${engNbrEch}).`));
                        }

                        // LOG0037 : Incohérence stricte (Payées + Impayées + Restantes != NbrEch)
                        if (sumEch !== engNbrEch) {
                            const diff = sumEch - engNbrEch;
                            const diffTxt = diff > 0 ? `+${diff} en trop` : `${diff} manquante(s)`;
                            anomalies.push(this.createAnomaly('LOG0037', 'NbrEch', `NBRECH=${engNbrEch} vs Encours=${sumEch} (Pay=${pay}, Imp=${imp}, Res=${res})`, ref, lineNum, 'Encours',
                                `La somme des échéances (payés, impayés et restantes) est différente du nombre total d’échéances déclaré au niveau du contrat. (Total=${sumEch} vs NBRECH=${engNbrEch}, écart: ${diffTxt})`,
                                `Ajuster les échéances payées, impayées et restantes pour correspondre au nombre total d'échéances (${engNbrEch}) déclaré au niveau du contrat.`));
                        }
                    }
                } else if (engTypEng && engTypEng !== '01') {
                    // LOG0020 : Échéances non applicables aux crédits sans échéancier (découverts, engagements par signature, cartes)
                    if ((nbrEchPay && nbrEchPay > 0) || (nbrEchImp && nbrEchImp > 0) || (nbrEchRes && nbrEchRes > 0)) {
                        anomalies.push(this.createAnomaly('LOG0020', 'nbrEchPay', `Pay=${nbrEchPay}, Imp=${nbrEchImp}, Res=${nbrEchRes}`, ref, lineNum, 'Encours',
                            `Les attributs d'échéances (nbrEchPay, nbrEchImp, nbrEchRes) ne sont pas applicables pour un engagement de type "${engTypEng}". Ils doivent être égaux à 0 ou omis.`));
                    }
                }
            }

            // CLI0001 : Contrôle du client rattaché à l'encours
            let encIdInt = getRawValue(row, ['IDINT', 'IDINTCLI', 'ID_CLIENT']);
            if (!encIdInt && engLookup) {
                const cleanRef = (ref || '').trim();
                const matchedEng = engLookup.get(cleanRef) || engLookup.get(cleanRef.toUpperCase()) || engLookup.get(cleanRef.replace(/^0+/, ''));
                if (matchedEng) {
                    encIdInt = getRawValue(matchedEng.row, ['IDINT', 'IDINTCLI', 'ID_CLIENT', 'CLIENT', 'ID_INT']);
                }
            }
            if (encIdInt) {
                const clientReg = headerContext.clientRegistry || (typeof window !== 'undefined' ? window.ClientsRegistryManager : null);
                if (clientReg && (typeof clientReg.isControlEnabled !== 'function' || clientReg.isControlEnabled())) {
                    if (typeof clientReg.isClientRejected === 'function' && clientReg.isClientRejected(encIdInt)) {
                        anomalies.push(this.createAnomaly('CLI0001', 'IdInt', encIdInt, ref, lineNum, 'Encours',
                            `Le client "${String(encIdInt).trim()}" rattaché à cet encours a été rejeté dans les déclarations FRCB (PP/PM) en raison d'anomalies bloquantes sur sa fiche.`));
                    } else {
                        const isGood = typeof clientReg.isGoodClient === 'function' ? clientReg.isGoodClient(encIdInt) : clientReg.isClientDeclared(encIdInt);
                        if (!isGood) {
                            anomalies.push(this.createAnomaly('CLI0001', 'IdInt', encIdInt, ref, lineNum, 'Encours',
                                `Le client "${String(encIdInt).trim()}" rattaché à cet encours n'est pas répertorié dans les déclarations FRCB (PP/PM).`));
                        }
                    }
                }
            }
            // ENC0001 : Contrôle réglementaire BEAC d'existence du contrat support
            // Les encours autorisés à passer dans le fichier XML doivent obligatoirement :
            // 1) Avoir un contrat déjà validé OK lors d'une précédente déclaration (ou validé OK sur la plateforme)
            // OU
            // 2) Correspondre à un nouvel engagement créé dans la période d'arrêté
            // Sinon, l'encours est mis en anomalie ("Contrat non existant sur la plateforme").
            if (ref && !ref.startsWith('LIGNE_')) {
                const contratsReg = headerContext.contratsRegistry || (typeof window !== 'undefined' ? (window.AntiDoublonManager || window.DeclarisStorage) : null);
                let currentPeriod = headerContext.period || null;
                if (!currentPeriod && headerContext.datArrStr) {
                    const pArr = parseJJMMAAAADate(headerContext.datArrStr);
                    if (pArr) currentPeriod = `${pArr.annee}-${String(pArr.mois).padStart(2, '0')}`;
                }

                // 1. Contrat déjà validé OK sur la plateforme BEAC (les contrats validés permettent la déclaration de leurs encours)
                let isContractOkPast = false;
                if (contratsReg) {
                    if (typeof contratsReg.isContractDeclaredOk === 'function' && contratsReg.isContractDeclaredOk(ref)) {
                        isContractOkPast = true;
                    } else if (typeof contratsReg.isContractOkOnPlatform === 'function' && contratsReg.isContractOkOnPlatform(ref, currentPeriod)) {
                        isContractOkPast = true;
                    } else if (currentPeriod && typeof contratsReg.isContractDeclaredOkInPastPeriod === 'function' && contratsReg.isContractDeclaredOkInPastPeriod(currentPeriod, ref)) {
                        isContractOkPast = true;
                    }
                }

                // 2. Encours pour un nouvel engagement créé dans la période
                let isNewEngagementInPeriod = false;
                if (!isContractOkPast && engLookup) {
                    let matchedEng = null;
                    const cleanRef = ref.trim().replace(/\s+/g, '');
                    const found = engLookup.get(ref.trim())
                        || engLookup.get(ref.trim().toUpperCase())
                        || engLookup.get(cleanRef)
                        || engLookup.get(cleanRef.toUpperCase())
                        || (cleanRef.replace(/^0+/, '') ? engLookup.get(cleanRef.replace(/^0+/, '')) : null);
                    if (found) {
                        matchedEng = found.row || found;
                    }
                    if (!matchedEng && (row['DATMEP'] !== undefined || row['MNTENG'] !== undefined)) {
                        matchedEng = row;
                    }

                    if (matchedEng) {
                        const isAncien = this.isAncienEngagement(matchedEng, ref, headerContext, contratsReg);
                        if (!isAncien) {
                            isNewEngagementInPeriod = true;
                        }
                    }
                }

                if (!isContractOkPast && !isNewEngagementInPeriod) {
                    anomalies.push(this.createAnomaly('ENC0001', 'RefContCmpt', ref, ref, lineNum, 'Encours',
                        `Contrat non existant sur la plateforme : Le contrat "${ref}" n'a pas été validé OK lors d'une précédente déclaration BEAC et ne correspond pas à un nouvel engagement créé dans la période.`,
                        `Déclarer et faire valider le contrat d'engagement support avant de transmettre ses encours, ou inclure le contrat dans les nouveaux engagements de la période.`));
                }
            }

            return anomalies;
        }

        /**
         * Validation d'une ligne de compte débiteur
         */
        validateCompteDebiteur(row, index, headerContext = {}) {
            const anomalies = [];
            const lineNum = index + 2;
            const ref = getRawValue(row, ['REFCONTCMPT3', 'REFCONTCMPT', 'NUMCPT', 'NUM_CPT', 'NUM_COMPTE', 'COMPTE', 'REFINT']) || `LIGNE_${lineNum}`;

            if (!ref || ref.startsWith('LIGNE_')) {
                anomalies.push(this.createAnomaly('LOG0002', 'RefContCmpt', '', ref, lineNum, 'Débiteurs',
                    'Le numéro de compte ou contrat (REFCONTCMPT) est obligatoire.'));
            }

            const codAge = getRawValue(row, ['CODAGE', 'CODAGE2', 'CODE_AGENCE']);
            const solDeb = parseNumericValue(getRawValue(row, ['SOLDEB', 'SOLDE_DEBITEUR', 'SOLDE']));
            const nbrJrs = parseNumericValue(getRawValue(row, ['NBRJRSDEBNONAUT', 'JOURS_DEBIT', 'NB_JOURS']));
            const classDeprec = getRawValue(row, ['CLASSDEPREC', 'CLADEPREC', 'CLASSE']);
            const idIntTit = getRawValue(row, ['IDINT', 'IDINT2', 'IDINTTIT', 'ID_CLIENT', 'CLIENT', 'IDINTCLI']);

            if (!codAge) anomalies.push(this.createAnomaly('OBL002', 'CodAge', '', ref, lineNum, 'Débiteurs', 'Le code agence est obligatoire.'));
            if (codAge && codAge.length !== 5) anomalies.push(this.createAnomaly('SYN001', 'CodAge', codAge, ref, lineNum, 'Débiteurs'));

            // LOG049 : Solde débiteur > 0
            if (solDeb === null || solDeb <= 0) {
                anomalies.push(this.createAnomaly('LOG049', 'SolDeb', solDeb, ref, lineNum, 'Débiteurs',
                    `Le solde débiteur (${solDeb}) doit être strictement supérieur à 0 XAF.`));
            }

            // LOG0045 : NbrJrsDebNonAut > 0
            if (nbrJrs === null || nbrJrs <= 0) {
                anomalies.push(this.createAnomaly('LOG0045', 'NbrJrsDebNonAut', nbrJrs, ref, lineNum, 'Débiteurs',
                    `Le nombre de jours de débit non autorisé (${nbrJrs}) doit être supérieur à 0.`));
            }

            // OBL003 : ClassDeprec
            if (!classDeprec) {
                anomalies.push(this.createAnomaly('OBL002', 'ClassDeprec', '', ref, lineNum, 'Débiteurs',
                    'La classe de dépréciation (CLASSDEPREC) est obligatoire sur le compte débiteur.'));
            } else if (!CLASSES_REGLEMENTAIRES.has(classDeprec)) {
                anomalies.push(this.createAnomaly('OBL003', 'ClassDeprec', classDeprec, ref, lineNum, 'Débiteurs',
                    `La classe de dépréciation "${classDeprec}" n'existe pas dans le référentiel COBAC.`));
            }

            // OBL001 : Titulaire obligatoire
            if (!idIntTit) {
                anomalies.push(this.createAnomaly('OBL001', 'TitulaireCompte', '', ref, lineNum, 'Débiteurs',
                    'Le compte débiteur doit comporter la balise <TitulaireCompte IdInt="..."/> avec l\'identifiant interne du titulaire.'));
            } else {
                // CLI0001 : Titulaire répertorié dans les déclarations FRCB (PP/PM)
                const clientReg = headerContext.clientRegistry || (typeof window !== 'undefined' ? window.ClientsRegistryManager : null);
                if (clientReg && (typeof clientReg.isControlEnabled !== 'function' || clientReg.isControlEnabled())) {
                    if (typeof clientReg.isClientRejected === 'function' && clientReg.isClientRejected(idIntTit)) {
                        anomalies.push(this.createAnomaly('CLI0001', 'IdInt', idIntTit, ref, lineNum, 'Débiteurs',
                            `Le titulaire du compte débiteur "${String(idIntTit).trim()}" a été rejeté dans les déclarations FRCB (PP/PM) en raison d'anomalies bloquantes sur sa fiche.`));
                    } else {
                        const isGood = typeof clientReg.isGoodClient === 'function' ? clientReg.isGoodClient(idIntTit) : clientReg.isClientDeclared(idIntTit);
                        if (!isGood) {
                            anomalies.push(this.createAnomaly('CLI0001', 'IdInt', idIntTit, ref, lineNum, 'Débiteurs',
                                `Le titulaire du compte débiteur "${String(idIntTit).trim()}" n'est pas répertorié dans les déclarations FRCB (PP/PM). Déclarez-le d'abord dans FRCB avant d'inclure ses comptes dans le CDR.`));
                        }
                    }
                }
            }

            return anomalies;
        }

        /**
         * Validation unitaire d'une ligne de Personne Physique FRCB (TypDec "01")
         * Conforme au Kit d'Interfaçage FRCB BEAC (Section 4.2.2 & Section 5)
         */
        validateFrcbPersonnePhysique(row, index, headerContext = {}, stateContext = {}) {
            const anomalies = [];
            const lineNum = index + 2;

            const idIntCli = getRawValue(row, ['IDINTCLI', 'IDINT', 'ID_INT', 'CLIENT', 'ID_CLIENT', 'IDCLI', 'CODE_CLIENT', 'NUMCLI', 'NO_CLIENT', 'IDENTIFIANT']);
            const ref = idIntCli || `LIGNE_${lineNum}`;

            const codPay = (headerContext.codePays || headerContext.CodPay || 'TD').toUpperCase();
            const datDecStr = normalizeDateToJJMMAAAA(headerContext.decDate || headerContext.DatDec || new Date());
            const parsedDatDec = parseJJMMAAAADate(datDecStr);

            // Déterminer la nature de déclaration pour ce client : Ancien client (02 - MAJ) vs Nouveau client (01 - Création)
            const rowCode = cleanUpper(getRawValue(row, ['CODE', 'NATDEC', 'NAT_DEC', 'NATURE_DECLARATION', 'TYP_DEC', 'TYPDEC']));
            const clientRegistry = headerContext.clientRegistry || (typeof window !== 'undefined' ? window.ClientsRegistryManager : null);
            const isHisto = (clientRegistry && typeof clientRegistry.isClientHistoricallyDeclared === 'function')
                ? clientRegistry.isClientHistoricallyDeclared(idIntCli)
                : false;

            const isAncienClient = (headerContext.isAncienClient !== undefined)
                ? headerContext.isAncienClient
                : (rowCode === '02' || rowCode === '00' || isHisto || (headerContext.natDec === '02'));
            const clientNatDec = isAncienClient ? '02' : (rowCode === '01' ? '01' : (headerContext.natDec || '02'));
            const natDec = clientNatDec;

            // 1. Identifiant Client & Doublons intra-fichier (LOG058)
            if (!idIntCli) {
                anomalies.push(this.createAnomaly('OBL002', 'IdIntCli', '', ref, lineNum, 'FRCB PP',
                    'L\'identifiant interne client (IdIntCli) est obligatoire.'));
            } else {
                const cleanId = cleanUpper(idIntCli);
                if (stateContext.declaredClients) {
                    if (stateContext.declaredClients.has(cleanId)) {
                        anomalies.push(this.createAnomaly('LOG058', 'IdIntCli', idIntCli, ref, lineNum, 'FRCB PP',
                            `L'identifiant client "${idIntCli}" est déclaré en double dans le même fichier.`));
                    } else {
                        stateContext.declaredClients.add(cleanId);
                    }
                }
            }

            // Helper de vérification syntaxique des noms propres (SYN006 à SYN010)
            const checkNameField = (val, fieldName, isObligatory, allowPnd = false) => {
                if (!val) {
                    if (isObligatory) {
                        anomalies.push(this.createAnomaly('OBL002', fieldName, '', ref, lineNum, 'FRCB PP',
                            `Le champ ${fieldName} est obligatoire.`));
                    }
                    return;
                }

                const s = cleanUpper(val);
                if (allowPnd && s === 'PND') return; // PND est autorisé pour la non-disponibilité

                // SYN006 : Caractères spéciaux interdits (seuls -, _, ' sont tolérés)
                if (/[^A-Z0-9\s\-_\']/.test(s)) {
                    anomalies.push(this.createAnomaly('SYN006', fieldName, val, ref, lineNum, 'FRCB PP',
                        `Le champ ${fieldName} ne doit pas contenir de caractères spéciaux autres que "-", "_" ou "'".`));
                }

                // SYN007 : Pas plus de 2 chiffres
                const digitsCount = (s.match(/\d/g) || []).length;
                if (digitsCount > 2) {
                    anomalies.push(this.createAnomaly('SYN007', fieldName, val, ref, lineNum, 'FRCB PP',
                        `Le champ ${fieldName} ne doit pas contenir plus de 2 chiffres.`));
                }

                // SYN008 : Mots ou tokens d'un seul caractère (ex: "A B", "JACK B")
                const tokens = s.split(/[\s\-]+/);
                const hasSingleChar = tokens.some(t => t.length === 1 && !/\d/.test(t));
                if (hasSingleChar) {
                    anomalies.push(this.createAnomaly('SYN008', fieldName, val, ref, lineNum, 'FRCB PP',
                        `Le champ ${fieldName} ("${val}") contient des initiales ou tokens d'un seul caractère (rejeté par la BEAC).`));
                }

                // SYN009 : Mots ou civilités interdits seuls (Section 9.1)
                if (FRCB_FORBIDDEN_NAME_TOKENS.has(s) || (tokens.length === 1 && FRCB_FORBIDDEN_NAME_TOKENS.has(tokens[0]))) {
                    anomalies.push(this.createAnomaly('SYN009', fieldName, val, ref, lineNum, 'FRCB PP',
                        `Le champ ${fieldName} contient un terme non accepté par la BEAC (titre de civilité ou mot générique : "${val}").`));
                }

                // SYN010 : Répétition de caractères en série (4+ identiques consécutifs)
                if (/(.)\1{3,}/.test(s)) {
                    anomalies.push(this.createAnomaly('SYN010', fieldName, val, ref, lineNum, 'FRCB PP',
                        `Le champ ${fieldName} contient des caractères identiques en série continue (ex: "${val}").`));
                }
            };

            // 2. Noms et Prénoms (Nom, Prenom, NomMar, NomComplet)
            const nom = getRawValue(row, ['NOM']);
            const prenom = getRawValue(row, ['PRENOM']);
            const nomComplet = getRawValue(row, ['NOMCOMPLET', 'NOM_COMPLET']);
            const nomMar = getRawValue(row, ['NOMMAR', 'NOM_MARITAL']);
            const sexe = cleanUpper(getRawValue(row, ['SEXE']));
            const sitMat = getRawValue(row, ['SITMAT', 'SITUATION_MATRIMONIALE']);

            if (nom && prenom) {
                // LOG069 : NomComplet ne doit pas être renseigné si Nom et Prénom sont déclarés
                if (nomComplet) {
                    anomalies.push(this.createAnomaly('LOG069', 'NomComplet', nomComplet, ref, lineNum, 'FRCB PP',
                        'Le champ NomComplet ne doit pas être renseigné car Nom et Prénom sont déjà fournis.'));
                }
                checkNameField(nom, 'Nom', true);
                checkNameField(prenom, 'Prenom', true, true);
            } else if (!nom && !prenom) {
                if (!nomComplet) {
                    anomalies.push(this.createAnomaly('OBL002', 'NomComplet', '', ref, lineNum, 'FRCB PP',
                        'Le nom du client est obligatoire (renseigner Nom/Prénom ou NomComplet).'));
                } else {
                    checkNameField(nomComplet, 'NomComplet', true);
                }
            } else {
                if (nom) checkNameField(nom, 'Nom', true);
                if (prenom) checkNameField(prenom, 'Prenom', true, true);
            }

            // Sexe
            if (!sexe) {
                anomalies.push(this.createAnomaly('OBL002', 'Sexe', '', ref, lineNum, 'FRCB PP', 'Le sexe est obligatoire.'));
            } else if (sexe !== 'M' && sexe !== 'F') {
                anomalies.push(this.createAnomaly('OBL003', 'Sexe', sexe, ref, lineNum, 'FRCB PP', 'Le sexe doit valoir "M" ou "F".'));
            }

            // LOG038 : Nom marital interdit pour le sexe masculin
            if (nomMar) {
                if (sexe === 'M') {
                    anomalies.push(this.createAnomaly('LOG038', 'NomMar', nomMar, ref, lineNum, 'FRCB PP',
                        'Le nom marital ne doit pas être déclaré pour une personne de sexe masculin.'));
                } else {
                    checkNameField(nomMar, 'NomMar', false);
                }
            } else if (sexe === 'F' && sitMat === '02') {
                // Conditionnel : femme mariée
                // Avertissement doux si absent
            }

            // 3. Filiation (NomPere, PrePere, NomMere, PreMere)
            // Réglementation BEAC : Obligatoire pour nouvelle création (01). Facultative / Non bloquante pour mise à jour (02).
            const nomPere = getRawValue(row, ['NOMPERE', 'NOM_PERE']);
            const prePere = getRawValue(row, ['PREPERE', 'PRENOM_PERE']);
            const nomMere = getRawValue(row, ['NOMMERE', 'NOM_MERE']);
            const preMere = getRawValue(row, ['PREMERE', 'PRENOM_MERE']);

            if (clientNatDec === '01') { // Obligatoire pour nouvelle création
                checkNameField(nomPere, 'NomPere', true, true);
                checkNameField(prePere, 'PrePere', true, true);
                checkNameField(nomMere, 'NomMere', true, true);
                checkNameField(preMere, 'PreMere', true, true);
            } else {
                if (nomPere) checkNameField(nomPere, 'NomPere', false, true);
                if (prePere) checkNameField(prePere, 'PrePere', false, true);
                if (nomMere) checkNameField(nomMere, 'NomMere', false, true);
                if (preMere) checkNameField(preMere, 'PreMere', false, true);
            }

            // 4. Date et Précision de Naissance
            const datNai = getRawValue(row, ['DATNAI', 'DATE_NAISSANCE']);
            const preNai = getRawValue(row, ['PRENAI', 'PRECISION_NAISSANCE']);
            if (!preNai) {
                anomalies.push(this.createAnomaly('OBL002', 'PreNai', '', ref, lineNum, 'FRCB PP', 'La précision de naissance (PRENAI: 01, 02 ou 03) est obligatoire.'));
            } else if (!['01', '02', '03'].includes(preNai)) {
                anomalies.push(this.createAnomaly('OBL003', 'PreNai', preNai, ref, lineNum, 'FRCB PP', 'La précision de naissance doit valoir 01, 02 ou 03.'));
            }

            if (!datNai) {
                anomalies.push(this.createAnomaly('OBL002', 'DatNai', '', ref, lineNum, 'FRCB PP', 'La date de naissance (DatNai) est obligatoire.'));
            } else {
                const parsedNai = parseJJMMAAAADate(datNai);
                if (!parsedNai) {
                    anomalies.push(this.createAnomaly('SYN003', 'DatNai', datNai, ref, lineNum, 'FRCB PP',
                        'Le format de la date de naissance doit être JJMMAAAA valide.'));
                } else {
                    // LOG007 : Date de naissance < date de déclaration
                    if (parsedDatDec && compareDates(parsedNai, parsedDatDec) >= 0) {
                        anomalies.push(this.createAnomaly('LOG007', 'DatNai', datNai, ref, lineNum, 'FRCB PP',
                            'La date de naissance doit être strictement inférieure à la date de déclaration.'));
                    }
                }
            }

            // 5. Ville & Pays de Naissance
            const villeNai = getRawValue(row, ['VILLENAI', 'VILLE_NAISSANCE']);
            const paysNai = cleanUpper(getRawValue(row, ['PAYSNAI', 'PAYS_NAISSANCE']));
            if (!villeNai) {
                anomalies.push(this.createAnomaly('OBL002', 'VilleNai', '', ref, lineNum, 'FRCB PP', 'Le lieu/ville de naissance est obligatoire.'));
            } else if (FRCB_FORBIDDEN_VILLE_TOKENS.has(cleanUpper(villeNai))) {
                anomalies.push(this.createAnomaly('SYN009', 'VilleNai', villeNai, ref, lineNum, 'FRCB PP',
                    `Le lieu de naissance contient une valeur non admise ("${villeNai}").`));
            }
            if (!paysNai) {
                anomalies.push(this.createAnomaly('OBL002', 'PaysNai', '', ref, lineNum, 'FRCB PP', 'Le pays de naissance est obligatoire.'));
            } else if (!PAYS_REFERENTIEL.has(paysNai)) {
                anomalies.push(this.createAnomaly('OBL003', 'PaysNai', paysNai, ref, lineNum, 'FRCB PP',
                    `Le code pays de naissance "${paysNai}" n'existe pas dans le référentiel ISO/BEAC.`));
            }

            // 6. Statut & Résidence
            const statut = getRawValue(row, ['STATUT']);
            const resident = getRawValue(row, ['RESIDENT']);
            const paysRes = cleanUpper(getRawValue(row, ['PAYSRES', 'PAYS_RESIDENCE']));
            const natCli = cleanUpper(getRawValue(row, ['NATCLI', 'NATIONALITE']));

            if (!statut) anomalies.push(this.createAnomaly('OBL002', 'Statut', '', ref, lineNum, 'FRCB PP', 'Le statut du déclaré (00: Actif, 01: Décédé) est obligatoire.'));
            if (!resident) anomalies.push(this.createAnomaly('OBL002', 'Resident', '', ref, lineNum, 'FRCB PP', 'Le statut de résidence (01, 02, 03) est obligatoire.'));
            if (!paysRes) {
                anomalies.push(this.createAnomaly('OBL002', 'PaysRes', '', ref, lineNum, 'FRCB PP', 'Le pays de résidence est obligatoire.'));
            } else {
                if (!PAYS_REFERENTIEL.has(paysRes)) {
                    anomalies.push(this.createAnomaly('OBL003', 'PaysRes', paysRes, ref, lineNum, 'FRCB PP', `Pays de résidence "${paysRes}" invalide.`));
                }
                // LOG008 : Si Résident = '01', PaysRes doit être égal au pays déclarant
                if (resident === '01' && paysRes !== codPay) {
                    anomalies.push(this.createAnomaly('LOG008', 'PaysRes', paysRes, ref, lineNum, 'FRCB PP',
                        `Incohérence résidence : Le client est déclaré résident (01) mais son pays de résidence (${paysRes}) diffère du pays déclarant (${codPay}).`));
                }
            }
            if (!natCli) {
                anomalies.push(this.createAnomaly('OBL002', 'NatCli', '', ref, lineNum, 'FRCB PP', 'La nationalité est obligatoire.'));
            } else if (!PAYS_REFERENTIEL.has(natCli)) {
                anomalies.push(this.createAnomaly('OBL003', 'NatCli', natCli, ref, lineNum, 'FRCB PP', `Nationalité "${natCli}" invalide.`));
            }

            // 7. Situation Matrimoniale
            if (!sitMat) {
                anomalies.push(this.createAnomaly('OBL002', 'SitMat', '', ref, lineNum, 'FRCB PP', 'La situation matrimoniale est obligatoire.'));
            } else if (!FRCB_SIT_MAT.has(sitMat)) {
                anomalies.push(this.createAnomaly('OBL003', 'SitMat', sitMat, ref, lineNum, 'FRCB PP',
                    'La situation matrimoniale doit valoir 01 (Célibataire), 02 (Marié), 03 (Divorcé) ou 04 (Veuf).'));
            }

            // 8. Agent Économique & Règles conditionnelles (LOG010, LOG011, LOG012, LOG013, LOG065)
            const ageEco = getRawValue(row, ['AGEECO', 'AGENT_ECONOMIQUE']);
            const rccm = getRawValue(row, ['RCCM']);
            const sectAct = getRawValue(row, ['SECTACT', 'SECTEUR_ACTIVITE']);
            const ca = getRawValue(row, ['CA']);
            const nombEmp = getRawValue(row, ['NOMBEMP']);

            if (!ageEco) {
                anomalies.push(this.createAnomaly('OBL002', 'AgeEco', '', ref, lineNum, 'FRCB PP', 'L\'agent économique est obligatoire.'));
            } else if (!FRCB_AGENTS_PP.has(ageEco)) {
                anomalies.push(this.createAnomaly('LOG010', 'AgeEco', ageEco, ref, lineNum, 'FRCB PP',
                    `L'agent économique "${ageEco}" n'est pas autorisé pour les personnes physiques (valeurs admises : 1080 Professionnels, 1100 Particuliers nationaux, 1110 Particuliers étrangers).`));
            } else {
                if (ageEco === '1080') { // Professionnels
                    if (!rccm) {
                        anomalies.push(this.createAnomaly('OBL002', 'RCCM', '', ref, lineNum, 'FRCB PP',
                            'Le RCCM est obligatoire pour les professionnels (AgeEco = 1080).'));
                    }
                    if (!sectAct) {
                        anomalies.push(this.createAnomaly('OBL002', 'SectAct', '', ref, lineNum, 'FRCB PP',
                            'Le secteur d\'activité (NAEMA) est obligatoire pour les professionnels (AgeEco = 1080).'));
                    }
                } else { // 1100 ou 1110
                    if (rccm) {
                        anomalies.push(this.createAnomaly('LOG011', 'RCCM', rccm, ref, lineNum, 'FRCB PP',
                            'Le champ RCCM ne doit pas être renseigné pour les particuliers salariés ou sans activité commerciale.'));
                    }
                    if (sectAct) {
                        anomalies.push(this.createAnomaly('LOG065', 'SectAct', sectAct, ref, lineNum, 'FRCB PP',
                            'Le champ SectAct ne doit pas être renseigné pour les particuliers (1100, 1110).'));
                    }
                    if (ca && ca !== '0') {
                        anomalies.push(this.createAnomaly('LOG012', 'CA', ca, ref, lineNum, 'FRCB PP',
                            'Le chiffre d\'affaires ne doit pas être renseigné pour les particuliers.'));
                    }
                    if (nombEmp && nombEmp !== '0') {
                        anomalies.push(this.createAnomaly('LOG013', 'NombEmp', nombEmp, ref, lineNum, 'FRCB PP',
                            'Le nombre d\'employés ne doit pas être renseigné pour les particuliers.'));
                    }
                }
            }

            // 9. Situation Judiciaire & Interdictions (LOG030, LOG031, LOG032, LOG002)
            const sitJud = getRawValue(row, ['SITJUD', 'SITUATION_JUDICIAIRE']) || '0';
            const datDebInt = getRawValue(row, ['DATDEBLNT', 'DATDEBINT', 'DATE_DEBUT_INTERDICTION']);
            const datFinInt = getRawValue(row, ['DATFINLNT', 'DATFININT', 'DATE_FIN_INTERDICTION']);

            if (sitJud === '0') {
                if (datDebInt) anomalies.push(this.createAnomaly('LOG031', 'DatDebInt', datDebInt, ref, lineNum, 'FRCB PP', 'Date début interdiction ne doit pas être renseignée sans interdiction judiciaire.'));
                if (datFinInt) anomalies.push(this.createAnomaly('LOG030', 'DatFinInt', datFinInt, ref, lineNum, 'FRCB PP', 'Date fin interdiction ne doit pas être renseignée sans interdiction judiciaire.'));
            } else if (sitJud === '1') {
                if (!datDebInt) {
                    anomalies.push(this.createAnomaly('LOG031', 'DatDebInt', '', ref, lineNum, 'FRCB PP', 'Date de début d\'interdiction obligatoire en cas d\'interdiction judiciaire.'));
                } else {
                    const pDeb = parseJJMMAAAADate(datDebInt);
                    if (!pDeb) anomalies.push(this.createAnomaly('SYN003', 'DatDebInt', datDebInt, ref, lineNum, 'FRCB PP', 'Format date début interdiction invalide.'));
                    if (datFinInt) {
                        const pFin = parseJJMMAAAADate(datFinInt);
                        if (!pFin) anomalies.push(this.createAnomaly('SYN003', 'DatFinInt', datFinInt, ref, lineNum, 'FRCB PP', 'Format date fin interdiction invalide.'));
                        else {
                            if (compareDates(pFin, pDeb) <= 0) {
                                anomalies.push(this.createAnomaly('LOG002', 'DatFinInt', datFinInt, ref, lineNum, 'FRCB PP', 'Date fin interdiction doit être supérieure à la date de début.'));
                            }
                            if (parsedDatDec && compareDates(pFin, parsedDatDec) < 0) {
                                anomalies.push(this.createAnomaly('LOG032', 'DatFinInt', datFinInt, ref, lineNum, 'FRCB PP', 'Date fin interdiction ne doit pas être antérieure à la date de déclaration.'));
                            }
                        }
                    }
                }
            }

            // 10. Date Entrée en Relation & Date Événement
            const datEntRelPar = getRawValue(row, ['DATENTRELPAR', 'DATE_ENTREE_RELATION']);
            const datEve = getRawValue(row, ['DATEVE', 'DATE_EVENEMENT']);

            if (!datEntRelPar) {
                anomalies.push(this.createAnomaly('OBL002', 'DatEntRelPar', '', ref, lineNum, 'FRCB PP', 'Date entrée en relation obligatoire.'));
            } else {
                const pEnt = parseJJMMAAAADate(datEntRelPar);
                if (!pEnt) anomalies.push(this.createAnomaly('SYN003', 'DatEntRelPar', datEntRelPar, ref, lineNum, 'FRCB PP', 'Format date entrée en relation invalide.'));
                else if (parsedDatDec && compareDates(pEnt, parsedDatDec) > 0) {
                    anomalies.push(this.createAnomaly('LOG014', 'DatEntRelPar', datEntRelPar, ref, lineNum, 'FRCB PP',
                        `Date d'entrée en relation (${datEntRelPar}) postérieure à la déclaration : ajustée automatiquement à la date de déclaration (${datDecStr}).`, null, 'Avertissement'));
                }
            }

            if (!datEve) {
                anomalies.push(this.createAnomaly('OBL002', 'DatEve', '', ref, lineNum, 'FRCB PP', 'Date événement obligatoire.', null, 'Avertissement'));
            } else {
                const pEve = parseJJMMAAAADate(datEve);
                if (!pEve) anomalies.push(this.createAnomaly('SYN003', 'DatEve', datEve, ref, lineNum, 'FRCB PP', 'Format date événement invalide.'));
                else if (parsedDatDec && compareDates(pEve, parsedDatDec) > 0) {
                    anomalies.push(this.createAnomaly('LOG001', 'DatEve', datEve, ref, lineNum, 'FRCB PP',
                        `Date événement (${datEve}) postérieure à la déclaration : ajustée automatiquement à la date de déclaration (${datDecStr}).`, null, 'Avertissement'));
                }
            }

            // 11. Téléphone (SYN012)
            const mobile = getRawValue(row, ['MOBILE', 'TEL', 'TELEPHONE']);
            if (!mobile) {
                anomalies.push(this.createAnomaly('OBL002', 'Mobile', '', ref, lineNum, 'FRCB PP', 'Le numéro de téléphone est obligatoire.'));
            } else {
                const cleanPhone = String(mobile).trim();
                // SYN012 : 9 à 16 chiffres, commence par 00, aucun caractère spécial (+, -, espaces, etc.)
                if (/[^0-9]/.test(cleanPhone)) {
                    anomalies.push(this.createAnomaly('SYN012', 'Mobile', mobile, ref, lineNum, 'FRCB PP',
                        'Le téléphone ne doit contenir aucun caractère spécial ni espace (uniquement des chiffres).'));
                } else if (!cleanPhone.startsWith('00')) {
                    anomalies.push(this.createAnomaly('SYN012', 'Mobile', mobile, ref, lineNum, 'FRCB PP',
                        'Le téléphone doit obligatoirement commencer par "00" suivi de l\'indicatif international.'));
                } else if (cleanPhone.length < 9 || cleanPhone.length > 16) {
                    anomalies.push(this.createAnomaly('SYN012', 'Mobile', mobile, ref, lineNum, 'FRCB PP',
                        `La longueur du numéro (${cleanPhone.length} chiffres) doit être comprise entre 9 et 16 chiffres.`));
                }
            }

            // 12. Email (SYN013)
            const email = getRawValue(row, ['EMAIL']);
            if (email && email.toLowerCase() !== 'inconnu@email.com') {
                if (!/^[a-zA-Z0-9._-]+@[a-z0-9._-]+\.[a-z]+$/.test(email)) {
                    anomalies.push(this.createAnomaly('SYN013', 'Email', email, ref, lineNum, 'FRCB PP',
                        'Le format de l\'adresse email est invalide selon la syntaxe BEAC.'));
                }
            }

            // 13. Pièce d'Identité (OBL001, SYN011, LOG070, LOG073, LOG015, LOG002)
            const typPiece = getRawValue(row, ['TYPPIECE', 'TYPE_PIECE']);
            const numPiece = getRawValue(row, ['NUMPIECE', 'NUMERO_PIECE']);
            const datEmPiece = getRawValue(row, ['DATEMPIECE', 'DATE_EMISSION_PIECE']);
            const datFinPiece = getRawValue(row, ['DATFINPIECE', 'DATE_FIN_PIECE']);
            const lieuPiece = getRawValue(row, ['LIEU', 'LIEU_PIECE']);
            const paysPiece = cleanUpper(getRawValue(row, ['PAYS_PIECE', 'PAYSPIECE']));

            if (!typPiece && !numPiece) {
                anomalies.push(this.createAnomaly('OBL001', 'PieceIdentite', '', ref, lineNum, 'FRCB PP',
                    'Pièce d\'identité non renseignée dans le fichier source : une pièce par défaut conforme (PND) sera générée dans le XML.', null, 'Avertissement'));
            } else {
                if (!typPiece) {
                    if (numPiece) {
                        anomalies.push(this.createAnomaly('OBL002', 'TypPiece', '', ref, lineNum, 'FRCB PP',
                            'Type de pièce non spécifié : application automatique de la CNI (Code 01) conforme aux flux BEAC.', null, 'Avertissement'));
                    } else {
                        anomalies.push(this.createAnomaly('OBL002', 'TypPiece', '', ref, lineNum, 'FRCB PP', 'Le type de pièce d\'identité est obligatoire.'));
                    }
                } else if (!FRCB_TYPES_PIECES.has(typPiece)) {
                    anomalies.push(this.createAnomaly('OBL003', 'TypPiece', typPiece, ref, lineNum, 'FRCB PP',
                        `Le type de pièce "${typPiece}" est inconnu (valeurs autorisées : 01 CNI, 02 Passeport, 03 Carte séjour, 04 Titre séjour, 05 Permis, 06 Récépissé CNI, 07 Carte pro).`));
                }

                if (!numPiece) {
                    anomalies.push(this.createAnomaly('OBL002', 'NumPiece', '', ref, lineNum, 'FRCB PP', 'Le numéro de pièce d\'identité est obligatoire.'));
                } else {
                    // SYN011 : Contrôle de longueur selon le pays et la pièce
                    const countrySpecs = FRCB_ID_SPECS[codPay];
                    if (countrySpecs && countrySpecs.pieces && countrySpecs.pieces[typPiece]) {
                        const allowedLens = countrySpecs.pieces[typPiece];
                        const netLen = getAlphaNumLength(numPiece);
                        if (!allowedLens.includes(netLen)) {
                            anomalies.push(this.createAnomaly('SYN011', 'NumPiece', numPiece, ref, lineNum, 'FRCB PP',
                                `Longueur invalide pour la pièce (type ${typPiece}) au ${codPay} : ${netLen} car. nets constatés (longueurs requises : ${allowedLens.join(' ou ')}).`));
                        }
                    }

                    // LOG070 : Pièce d'identité unique dans le fichier
                    if (stateContext.usedPieceSet && typPiece) {
                        const pieceKey = `${typPiece}_${cleanUpper(numPiece)}`;
                        if (stateContext.usedPieceSet.has(pieceKey)) {
                            anomalies.push(this.createAnomaly('LOG070', 'NumPiece', numPiece, ref, lineNum, 'FRCB PP',
                                `La même pièce d'identité (${typPiece} N° ${numPiece}) est déjà déclarée pour une autre personne physique.`));
                        } else {
                            stateContext.usedPieceSet.add(pieceKey);
                        }
                    }
                }

                // LOG073 : Pays d'émission
                if (paysPiece && typPiece !== '02' && paysPiece !== codPay) {
                    anomalies.push(this.createAnomaly('LOG073', 'PaysPiece', paysPiece, ref, lineNum, 'FRCB PP',
                        `Le pays d'émission de la pièce (${paysPiece}) doit correspondre au pays du déclarant (${codPay}) pour ce type de pièce.`));
                }

                // Lieu d'émission (recommandé pour CNI et Passeport)
                if (['01', '02'].includes(typPiece) && !lieuPiece) {
                    anomalies.push(this.createAnomaly('OBL002', 'LieuPiece', '', ref, lineNum, 'FRCB PP',
                        'Lieu d\'émission non spécifié : la ville de référence est appliquée par défaut.', null, 'Avertissement'));
                }

                // Dates de la pièce
                if (!datEmPiece) {
                    anomalies.push(this.createAnomaly('OBL002', 'DatEmPiece', '', ref, lineNum, 'FRCB PP', 'Date d\'émission de la pièce obligatoire.'));
                } else {
                    const pEm = parseJJMMAAAADate(datEmPiece);
                    if (!pEm) anomalies.push(this.createAnomaly('SYN003', 'DatEmPiece', datEmPiece, ref, lineNum, 'FRCB PP', 'Format date émission pièce invalide.'));
                    else if (parsedDatDec && compareDates(pEm, parsedDatDec) > 0) {
                        anomalies.push(this.createAnomaly('LOG015', 'DatEmPiece', datEmPiece, ref, lineNum, 'FRCB PP', 'Date émission pièce doit être <= date déclaration.'));
                    }
                    if (datFinPiece) {
                        const pFinP = parseJJMMAAAADate(datFinPiece);
                        if (!pFinP) anomalies.push(this.createAnomaly('SYN003', 'DatFinPiece', datFinPiece, ref, lineNum, 'FRCB PP', 'Format date fin validité pièce invalide.'));
                        else if (pEm && compareDates(pFinP, pEm) <= 0) {
                            anomalies.push(this.createAnomaly('LOG002', 'DatFinPiece', datFinPiece, ref, lineNum, 'FRCB PP', 'Date fin pièce doit être strictement postérieure à la date d\'émission.'));
                        }
                    }
                }
            }

            // 14. Adresses (OBL001, LOG021, LOG019)
            const typAdr = getRawValue(row, ['TYPADR', 'TYPE_ADRESSE']);
            const adresse = getRawValue(row, ['ADRESSE']);
            const paysAdr = cleanUpper(getRawValue(row, ['PAYS_ADRESSE', 'PAYSADRESSE', 'PAYS']));
            const villeAdr = getRawValue(row, ['VILLE_ADRESSE', 'VILLE']);

            if (!adresse && !typAdr) {
                anomalies.push(this.createAnomaly('OBL001', 'Adresses', '', ref, lineNum, 'FRCB PP',
                    'Adresse non renseignée dans le fichier source : l\'adresse par défaut sera générée à partir de la ville et du nom selon la norme BEAC.', null, 'Avertissement'));
            } else {
                if (!typAdr) {
                    anomalies.push(this.createAnomaly('OBL002', 'TypAdr', '', ref, lineNum, 'FRCB PP', 'Le type d\'adresse est obligatoire.'));
                } else if (!FRCB_TYPES_ADRESSES_PP.has(typAdr)) {
                    anomalies.push(this.createAnomaly('LOG021', 'TypAdr', typAdr, ref, lineNum, 'FRCB PP',
                        `Le type d'adresse "${typAdr}" n'est pas applicable aux personnes physiques (adresses réservées aux personnes morales).`));
                }

                if (!adresse) {
                    anomalies.push(this.createAnomaly('OBL002', 'Adresse', '', ref, lineNum, 'FRCB PP', 'Le libellé de l\'adresse est obligatoire.'));
                }

                if (!paysAdr) {
                    anomalies.push(this.createAnomaly('OBL002', 'PaysAdresse', '', ref, lineNum, 'FRCB PP', 'Le pays de l\'adresse est obligatoire.'));
                } else if (!PAYS_CEMAC.has(paysAdr)) {
                    anomalies.push(this.createAnomaly('OBL003', 'PaysAdresse', paysAdr, ref, lineNum, 'FRCB PP',
                        `Le pays de l'adresse (${paysAdr}) doit obligatoirement être un pays de la zone CEMAC.`));
                } else if (typAdr === '01' && paysRes && paysAdr !== paysRes) {
                    anomalies.push(this.createAnomaly('LOG019', 'PaysAdresse', paysAdr, ref, lineNum, 'FRCB PP',
                        `Le pays de l'adresse principale (${paysAdr}) doit concorder avec le pays de résidence (${paysRes}).`));
                }

                if (!villeAdr) {
                    anomalies.push(this.createAnomaly('OBL002', 'Ville', '', ref, lineNum, 'FRCB PP', 'La ville de l\'adresse est obligatoire.'));
                }
            }

            // 15. Mandataire (LOG023)
            const idIntMand = getRawValue(row, ['IDINTMAND', 'ID_MANDATAIRE']);
            if (idIntMand && idIntCli && cleanUpper(idIntMand) === cleanUpper(idIntCli)) {
                anomalies.push(this.createAnomaly('LOG023', 'IdIntMand', idIntMand, ref, lineNum, 'FRCB PP',
                    'L\'identifiant du mandataire ne peut pas être identique à l\'identifiant du client lui-même.'));
            }

            // 16. Employeur (LOG034, LOG037)
            const idIntEmp = getRawValue(row, ['IDINTEMP', 'ID_EMPLOYEUR']);
            const raisocEmp = getRawValue(row, ['RAISOCEMP', 'EMPLOYEUR']);
            if (idIntEmp && idIntCli && cleanUpper(idIntEmp) === cleanUpper(idIntCli)) {
                anomalies.push(this.createAnomaly('LOG034', 'IdIntEmp', idIntEmp, ref, lineNum, 'FRCB PP',
                    'L\'identifiant de l\'employeur ne peut pas être identique à l\'identifiant du salarié.'));
            }
            if (raisocEmp && ageEco === '1080') {
                anomalies.push(this.createAnomaly('LOG037', 'Employeur', raisocEmp, ref, lineNum, 'FRCB PP',
                    'La balise Employeur n\'est pas applicable pour les professionnels indépendants (AgeEco = 1080).'));
            }

            return anomalies;
        }

        /**
         * Validation unitaire d'une ligne de Personne Morale FRCB (TypDec "02")
         * Conforme au Kit d'Interfaçage FRCB BEAC (Section 4.2.3 & Section 5)
         */
        validateFrcbPersonneMorale(row, index, headerContext = {}, stateContext = {}) {
            const anomalies = [];
            const lineNum = index + 2;

            const idIntCli = getRawValue(row, ['IDINTCLI', 'IDINT', 'ID_INT', 'CLIENT', 'ID_CLIENT', 'IDCLI', 'CODE_CLIENT', 'NUMCLI', 'NO_CLIENT', 'IDENTIFIANT']);
            const ref = idIntCli || `LIGNE_${lineNum}`;

            const codPay = (headerContext.codePays || headerContext.CodPay || 'TD').toUpperCase();
            const datDecStr = normalizeDateToJJMMAAAA(headerContext.decDate || headerContext.DatDec || new Date());
            const parsedDatDec = parseJJMMAAAADate(datDecStr);
            const natDec = headerContext.natDec || headerContext.NatDec || '01';

            // 1. Identifiant Client & Doublons intra-fichier (LOG058)
            if (!idIntCli) {
                anomalies.push(this.createAnomaly('OBL002', 'IdIntCli', '', ref, lineNum, 'FRCB PM',
                    'L\'identifiant interne client (IdIntCli) est obligatoire.'));
            } else {
                const cleanId = cleanUpper(idIntCli);
                if (stateContext.declaredClients) {
                    if (stateContext.declaredClients.has(cleanId)) {
                        anomalies.push(this.createAnomaly('LOG058', 'IdIntCli', idIntCli, ref, lineNum, 'FRCB PM',
                            `L'identifiant client entreprise "${idIntCli}" est déclaré en double dans le même fichier.`));
                    } else {
                        stateContext.declaredClients.add(cleanId);
                    }
                }
            }

            // 2. Raison Sociale (RaiSoc)
            const raiSoc = getRawValue(row, ['RAISOC', 'RAISON_SOCIALE']);
            if (!raiSoc) {
                anomalies.push(this.createAnomaly('OBL002', 'RaiSoc', '', ref, lineNum, 'FRCB PM', 'La raison sociale est obligatoire.'));
            } else {
                const cleanRaiSoc = cleanUpper(raiSoc);
                // SYN010 : Répétitions en série
                if (/(.)\1{3,}/.test(cleanRaiSoc)) {
                    anomalies.push(this.createAnomaly('SYN010', 'RaiSoc', raiSoc, ref, lineNum, 'FRCB PM',
                        `La raison sociale contient des caractères identiques en série continue ("${raiSoc}").`));
                }
                // SYN009 : Sigle ou token interdit seul
                if (FRCB_FORBIDDEN_RAISOC_TOKENS.has(cleanRaiSoc)) {
                    anomalies.push(this.createAnomaly('SYN009', 'RaiSoc', raiSoc, ref, lineNum, 'FRCB PM',
                        `La raison sociale ne peut pas se résumer à une forme juridique ou terme générique seul ("${raiSoc}").`));
                }
            }

            // 3. Date de Création (DatCre)
            const datCre = getRawValue(row, ['DATCRE', 'DATE_CREATION']);
            let parsedDatCre = null;
            if (!datCre) {
                anomalies.push(this.createAnomaly('OBL002', 'DatCre', '', ref, lineNum, 'FRCB PM', 'La date de création de l\'entreprise est obligatoire.'));
            } else {
                parsedDatCre = parseJJMMAAAADate(datCre);
                if (!parsedDatCre) {
                    anomalies.push(this.createAnomaly('SYN003', 'DatCre', datCre, ref, lineNum, 'FRCB PM',
                        'Le format de la date de création doit être JJMMAAAA valide.'));
                } else if (parsedDatDec && compareDates(parsedDatCre, parsedDatDec) > 0) {
                    anomalies.push(this.createAnomaly('LOG028', 'DatCre', datCre, ref, lineNum, 'FRCB PM',
                        'La date de création de l\'entreprise doit être antérieure ou égale à la date de session/déclaration.'));
                }
            }

            // 4. Résidence et Siège Social (LOG008)
            const resident = getRawValue(row, ['RESIDENT']);
            const paysSiege = cleanUpper(getRawValue(row, ['PAYSSIEGE', 'PAYS_SIEGE']));
            const villeSiege = getRawValue(row, ['VILLE_SIEGE', 'VILLE']);

            if (!resident) {
                anomalies.push(this.createAnomaly('OBL002', 'Resident', '', ref, lineNum, 'FRCB PM', 'Le statut de résidence est obligatoire (01, 02, 03).'));
            }
            if (!paysSiege) {
                anomalies.push(this.createAnomaly('OBL002', 'PaysSiege', '', ref, lineNum, 'FRCB PM', 'Le pays du siège social est obligatoire.'));
            } else {
                if (!PAYS_REFERENTIEL.has(paysSiege)) {
                    anomalies.push(this.createAnomaly('OBL003', 'PaysSiege', paysSiege, ref, lineNum, 'FRCB PM', `Pays siège "${paysSiege}" invalide.`));
                }
                // LOG008 : Si Résident 01, PaysSiege = pays déclarant
                if (resident === '01' && paysSiege !== codPay) {
                    anomalies.push(this.createAnomaly('LOG008', 'PaysSiege', paysSiege, ref, lineNum, 'FRCB PM',
                        `Incohérence résidence : Entreprise déclarée résidente (01) mais pays du siège social (${paysSiege}) différent du pays déclarant (${codPay}).`));
                }
            }
            if (!villeSiege) {
                anomalies.push(this.createAnomaly('OBL002', 'VilleSiege', '', ref, lineNum, 'FRCB PM', 'La ville du siège social est obligatoire.'));
            } else if (FRCB_FORBIDDEN_VILLE_TOKENS.has(cleanUpper(villeSiege))) {
                anomalies.push(this.createAnomaly('SYN009', 'VilleSiege', villeSiege, ref, lineNum, 'FRCB PM',
                    `La ville du siège contient un terme générique interdit ("${villeSiege}").`));
            }

            // 5. RCCM & NIF/NIU (SYN011, Annexe 5, Annexe 9.2)
            const rccm = getRawValue(row, ['RCCM']);
            const nifNiu = getRawValue(row, ['NIF_NIU', 'NIU', 'NIF']);
            const ageEco = getRawValue(row, ['AGEECO', 'AGENT_ECONOMIQUE']);

            if (!rccm) {
                anomalies.push(this.createAnomaly('OBL002', 'RCCM', '', ref, lineNum, 'FRCB PM',
                    'Le numéro RCCM / autorisation / agrément est obligatoire pour les personnes morales.'));
            } else {
                const countrySpecs = FRCB_ID_SPECS[codPay];
                if (countrySpecs && countrySpecs.rccm) {
                    const netLen = getAlphaNumLength(rccm);
                    if (!countrySpecs.rccm.includes(netLen)) {
                        anomalies.push(this.createAnomaly('SYN011', 'RCCM', rccm, ref, lineNum, 'FRCB PM',
                            `Longueur nette RCCM inhabituelle au ${codPay} : ${netLen} car. constatés (attendu : ${countrySpecs.rccm.join(' ou ')}).`, null, 'Avertissement'));
                    }
                }
            }

            // Agent Économique PM (LOG010)
            if (!ageEco) {
                anomalies.push(this.createAnomaly('OBL002', 'AgeEco', '', ref, lineNum, 'FRCB PM', 'L\'agent économique est obligatoire.'));
            } else if (!FRCB_AGENTS_PM.has(ageEco)) {
                anomalies.push(this.createAnomaly('LOG010', 'AgeEco', ageEco, ref, lineNum, 'FRCB PM',
                    `L'agent économique "${ageEco}" n'est pas autorisé pour les personnes morales (valeurs attendues : 1010 à 1210).`));
            } else {
                // Obligation du NIF/NIU selon Annexe 5
                if (FRCB_AGENTS_PM_NIU_OBLIGATOIRE.has(ageEco)) {
                    if (!nifNiu) {
                        anomalies.push(this.createAnomaly('OBL002', 'NIF_NIU', '', ref, lineNum, 'FRCB PM',
                            `Le NIF/NIU est obligatoire pour l'agent économique ${ageEco} (${this.rulesMeta['LOG0071']?.libelle || 'Entreprise assujettie'}).`));
                    }
                }
            }

            if (nifNiu) {
                const countrySpecs = FRCB_ID_SPECS[codPay];
                if (countrySpecs && countrySpecs.niu) {
                    const netLen = getAlphaNumLength(nifNiu);
                    if (!countrySpecs.niu.includes(netLen)) {
                        anomalies.push(this.createAnomaly('SYN011', 'NIF_NIU', nifNiu, ref, lineNum, 'FRCB PM',
                            `Longueur nette NIF/NIU inhabituelle au ${codPay} : ${netLen} car. constatés (attendu : ${countrySpecs.niu.join(' ou ')}).`, null, 'Avertissement'));
                    }
                }
            }

            // 6. Forme Juridique (ForJurid) & Secteur d'activité (SecAct)
            const forJurid = getRawValue(row, ['FORJURID', 'FORME_JURIDIQUE']);
            const secAct = getRawValue(row, ['SECTACT', 'SECTEUR_ACTIVITE']);

            if (!forJurid) {
                anomalies.push(this.createAnomaly('OBL002', 'ForJurid', '', ref, lineNum, 'FRCB PM', 'La forme juridique est obligatoire.'));
            } else if (!FRCB_FORMES_JURIDIQUES.has(forJurid)) {
                anomalies.push(this.createAnomaly('OBL003', 'ForJurid', forJurid, ref, lineNum, 'FRCB PM',
                    `La forme juridique "${forJurid}" n'existe pas dans l'Annexe 12 (00 SA, 03 SARL, etc.).`));
            }

            if (!secAct) {
                anomalies.push(this.createAnomaly('OBL002', 'SecAct', '', ref, lineNum, 'FRCB PM', 'Le secteur d\'activité NAEMA est obligatoire.'));
            }

            // 7. Date Entrée en Relation (LOG041, LOG014) & Date Événement (LOG042, LOG001)
            const datEntRelPar = getRawValue(row, ['DATENTRELPAR', 'DATE_ENTREE_RELATION']);
            const datEve = getRawValue(row, ['DATEVET', 'DATEVE', 'DATE_EVENEMENT']);

            if (!datEntRelPar) {
                anomalies.push(this.createAnomaly('OBL002', 'DatEntRelPar', '', ref, lineNum, 'FRCB PM', 'La date d\'entrée en relation est obligatoire.'));
            } else {
                const pEnt = parseJJMMAAAADate(datEntRelPar);
                if (!pEnt) {
                    anomalies.push(this.createAnomaly('SYN003', 'DatEntRelPar', datEntRelPar, ref, lineNum, 'FRCB PM', 'Format date entrée relation invalide.'));
                } else {
                    if (parsedDatCre && compareDates(pEnt, parsedDatCre) < 0) {
                        anomalies.push(this.createAnomaly('LOG041', 'DatEntRelPar', datEntRelPar, ref, lineNum, 'FRCB PM',
                            'La date d\'entrée en relation doit être postérieure ou égale à la date de création de l\'entreprise.'));
                    }
                    if (parsedDatDec && compareDates(pEnt, parsedDatDec) > 0) {
                        anomalies.push(this.createAnomaly('LOG014', 'DatEntRelPar', datEntRelPar, ref, lineNum, 'FRCB PM',
                            'La date d\'entrée en relation est postérieure à la déclaration (sera ajustée à la date de déclaration lors de la génération).', null, 'Avertissement'));
                    }
                }
            }

            if (!datEve) {
                anomalies.push(this.createAnomaly('OBL002', 'DatEve', '', ref, lineNum, 'FRCB PM', 'La date événement est obligatoire.'));
            } else {
                const pEve = parseJJMMAAAADate(datEve);
                if (!pEve) {
                    anomalies.push(this.createAnomaly('SYN003', 'DatEve', datEve, ref, lineNum, 'FRCB PM', 'Format date événement invalide.'));
                } else {
                    if (parsedDatCre && compareDates(pEve, parsedDatCre) < 0) {
                        anomalies.push(this.createAnomaly('LOG042', 'DatEve', datEve, ref, lineNum, 'FRCB PM',
                            'La date événement doit être postérieure ou égale à la date de création de l\'entreprise.'));
                    }
                    if (parsedDatDec && compareDates(pEve, parsedDatDec) > 0) {
                        anomalies.push(this.createAnomaly('LOG001', 'DatEve', datEve, ref, lineNum, 'FRCB PM',
                            'La date d\'événement est postérieure à la déclaration (sera ajustée à la date de déclaration lors de la génération).', null, 'Avertissement'));
                    }
                }
            }

            // 8. Téléphone (SYN012)
            const tel = getRawValue(row, ['TEL', 'TELEPHONE']);
            if (!tel) {
                anomalies.push(this.createAnomaly('OBL002', 'Tel', '', ref, lineNum, 'FRCB PM', 'Le téléphone de l\'entreprise est obligatoire.'));
            } else {
                const cleanPhone = String(tel).trim();
                if (/[^0-9]/.test(cleanPhone)) {
                    anomalies.push(this.createAnomaly('SYN012', 'Tel', tel, ref, lineNum, 'FRCB PM',
                        'Le téléphone ne doit contenir aucun caractère spécial ni espace (uniquement des chiffres).'));
                } else if (!cleanPhone.startsWith('00')) {
                    anomalies.push(this.createAnomaly('SYN012', 'Tel', tel, ref, lineNum, 'FRCB PM',
                        'Le téléphone doit obligatoirement commencer par "00" suivi de l\'indicatif international.'));
                } else if (cleanPhone.length < 9 || cleanPhone.length > 16) {
                    anomalies.push(this.createAnomaly('SYN012', 'Tel', tel, ref, lineNum, 'FRCB PM',
                        `Longueur du téléphone (${cleanPhone.length} chiffres) non conforme (entre 9 et 16 chiffres).`));
                }
            }

            // 9. Email (SYN013)
            const email = getRawValue(row, ['EMAIL']);
            if (email && email.toLowerCase() !== 'inconnu@email.com') {
                if (!/^[a-zA-Z0-9._-]+@[a-z0-9._-]+\.[a-z]+$/.test(email)) {
                    anomalies.push(this.createAnomaly('SYN013', 'Email', email, ref, lineNum, 'FRCB PM',
                        'Format d\'adresse email invalide selon la syntaxe BEAC.'));
                }
            }

            // 10. Situation Judiciaire
            const sitJud = getRawValue(row, ['SITJUD', 'SITUATION_JUDICIAIRE']) || '0';
            const datDebInt = getRawValue(row, ['DATDEBLNT', 'DATDEBINT']);
            const datFinInt = getRawValue(row, ['DATFINLNT', 'DATFININT']);
            if (sitJud === '0') {
                if (datDebInt) anomalies.push(this.createAnomaly('LOG031', 'DatDebInt', datDebInt, ref, lineNum, 'FRCB PM', 'Date début interdiction ne doit pas être renseignée si aucune interdiction.'));
                if (datFinInt) anomalies.push(this.createAnomaly('LOG030', 'DatFinInt', datFinInt, ref, lineNum, 'FRCB PM', 'Date fin interdiction ne doit pas être renseignée si aucune interdiction.'));
            } else if (sitJud === '1') {
                if (!datDebInt) anomalies.push(this.createAnomaly('LOG031', 'DatDebInt', '', ref, lineNum, 'FRCB PM', 'Date début interdiction obligatoire en cas d\'interdiction judiciaire.'));
            }

            // 11. Adresses (OBL001, LOG021)
            const typAdr = getRawValue(row, ['TYPADR', 'TYPE_ADRESSE']);
            const adresse = getRawValue(row, ['ADRESSE']);
            const paysAdr = cleanUpper(getRawValue(row, ['PAYS', 'PAYS_ADRESSE']));
            const villeAdr = getRawValue(row, ['VILLE_ADRESSE', 'VILLE']);

            if (!adresse && !typAdr) {
                anomalies.push(this.createAnomaly('OBL001', 'Adresses', '', ref, lineNum, 'FRCB PM', 'Info : Adresse générée à partir de la raison sociale/ville selon la norme BEAC.', null, 'Avertissement'));
            } else {
                if (!typAdr) {
                    anomalies.push(this.createAnomaly('OBL002', 'TypAdr', '', ref, lineNum, 'FRCB PM', 'Le type d\'adresse est obligatoire.'));
                } else if (!FRCB_TYPES_ADRESSES_PM.has(typAdr)) {
                    anomalies.push(this.createAnomaly('LOG021', 'TypAdr', typAdr, ref, lineNum, 'FRCB PM',
                        `Le type d'adresse "${typAdr}" est réservé aux personnes physiques (utilisez 03 Siège, 04 Fiscale, 06 Pro, 07 Correspondance).`));
                }

                if (!adresse) anomalies.push(this.createAnomaly('OBL002', 'Adresse', '', ref, lineNum, 'FRCB PM', 'L\'adresse est obligatoire.'));
                if (!paysAdr) {
                    anomalies.push(this.createAnomaly('OBL002', 'Pays', '', ref, lineNum, 'FRCB PM', 'Le pays de l\'adresse est obligatoire.'));
                } else if (!PAYS_CEMAC.has(paysAdr)) {
                    anomalies.push(this.createAnomaly('OBL003', 'Pays', paysAdr, ref, lineNum, 'FRCB PM', 'Le pays de l\'adresse doit faire partie de la zone CEMAC.'));
                }
                if (!villeAdr) anomalies.push(this.createAnomaly('OBL002', 'Ville', '', ref, lineNum, 'FRCB PM', 'La ville de l\'adresse est obligatoire.'));
            }

            // 12. Mandataire (OBL001, LOG023, LOG046)
            const idIntMand = getRawValue(row, ['IDINTMAND', 'ID_MANDATAIRE']);
            const typMand = getRawValue(row, ['TYPMAND', 'TYPE_MANDATAIRE']);
            const datDebMand = getRawValue(row, ['DATDEBMAND']);
            const datFinMand = getRawValue(row, ['DATFINMAND']);

            if (natDec !== '00') { // Recommandé hors reprise
                if (!idIntMand && !typMand) {
                    anomalies.push(this.createAnomaly('OBL001', 'Mandataire', '', ref, lineNum, 'FRCB PM',
                        'Mandataire non renseigné (balise optionnelle selon schéma XSD BEAC).', null, 'Avertissement'));
                }
            }

            if (idIntMand) {
                if (idIntCli && cleanUpper(idIntMand) === cleanUpper(idIntCli)) {
                    anomalies.push(this.createAnomaly('LOG023', 'IdIntMand', idIntMand, ref, lineNum, 'FRCB PM',
                        'L\'identifiant du mandataire ne peut pas être identique à l\'identifiant de la personne morale.'));
                }
                if (typMand && !FRCB_TYPES_MAND_PM.has(typMand)) {
                    anomalies.push(this.createAnomaly('OBL003', 'TypMand', typMand, ref, lineNum, 'FRCB PM',
                        `Le type de mandataire "${typMand}" n'existe pas dans l'Annexe 13.`));
                }
                if (datFinMand) {
                    const pFinM = parseJJMMAAAADate(datFinMand);
                    if (pFinM && parsedDatDec && compareDates(pFinM, parsedDatDec) <= 0) {
                        anomalies.push(this.createAnomaly('LOG046', 'DatFinMand', datFinMand, ref, lineNum, 'FRCB PM',
                            'La date de fin de mandat doit être strictement supérieure à la date de déclaration.'));
                    }
                    if (datDebMand) {
                        const pDebM = parseJJMMAAAADate(datDebMand);
                        if (pDebM && pFinM && compareDates(pFinM, pDebM) <= 0) {
                            anomalies.push(this.createAnomaly('LOG002', 'DatFinMand', datFinMand, ref, lineNum, 'FRCB PM',
                                'La date de fin de mandat doit être supérieure à la date de début de mandat.'));
                        }
                    }
                }
            }

            // 13. Actionnaires (LOG029)
            const idIntAct = getRawValue(row, ['IDLNTACT', 'IDINTACT', 'ID_ACTIONNAIRE']);
            if (idIntAct && idIntCli && cleanUpper(idIntAct) === cleanUpper(idIntCli)) {
                anomalies.push(this.createAnomaly('LOG029', 'IdIntAct', idIntAct, ref, lineNum, 'FRCB PM',
                    'L\'identifiant de l\'actionnaire ne peut pas être l\'identifiant de l\'entreprise déclarée.'));
            }

            // 14. Autres Relations (LOG026, LOG027)
            const idIntRel = getRawValue(row, ['IDINTREL', 'ID_RELATION']);
            const typRel = getRawValue(row, ['TYPREL', 'TYPE_RELATION']);
            if (idIntRel && idIntCli && cleanUpper(idIntRel) === cleanUpper(idIntCli)) {
                anomalies.push(this.createAnomaly('LOG026', 'IdIntRel', idIntRel, ref, lineNum, 'FRCB PM',
                    'L\'identifiant de la relation ne peut pas être identique à l\'identifiant de l\'entreprise.'));
            }
            if (typRel && !FRCB_RELATIONS_PM.has(typRel)) {
                anomalies.push(this.createAnomaly('LOG027', 'TypRel', typRel, ref, lineNum, 'FRCB PM',
                    `Le type de relation "${typRel}" ne concorde pas avec une personne morale (pas de conjoint ni d'enfant).`));
            }

            return anomalies;
        }

        /**
         * Audit complet d'un jeu de données CDR (Prêts, Encours, Débiteurs)
         * @param {Object} dataset { prets: [], encours: [], debiteurs: [] }
         * @param {Object} options Métadonnées d'en-tête et référentiels
         */
        auditCdrDataset(dataset, options = {}) {
            const prets = dataset.prets || [];
            const encours = dataset.encours || [];
            const debiteurs = dataset.debiteurs || [];

            const totalDeclaredRecords = prets.length + encours.length + debiteurs.length;

            const datDecStr = normalizeDateToJJMMAAAA(options.decDate || new Date());
            const datArrStr = normalizeDateToJJMMAAAA(options.arrDate || new Date());

            const headerContext = {
                ...options,
                datDecStr,
                datArrStr
            };

            const allAnomalies = [];

            // 1. Contrôle En-tête (ENT0001 à ENT0021)
            const headerAnomalies = this.validateHeader(options, totalDeclaredRecords);
            allAnomalies.push(...headerAnomalies);

            // 2. Référentiel des contrats passés (pour qualification Code 02 vs Code 01)
            let contratsReg = options.contratsRegistry || (typeof window !== 'undefined' ? (window.AntiDoublonManager || window.DeclarisStorage) : null);
            const isRegEmpty = !contratsReg || typeof contratsReg.isContractDeclared !== 'function'
                || (typeof contratsReg.getAllDeclaredVariantsSet === 'function' && (!contratsReg.getAllDeclaredVariantsSet() || contratsReg.getAllDeclaredVariantsSet().size === 0));
            if (isRegEmpty && typeof window !== 'undefined' && window.DECLARIS_CONTRATS_CSV) {
                if (!this._cachedContratsVariantsSet || !this._cachedContratsOkVariantsSet) {
                    this._cachedContratsVariantsSet = new Set();
                    this._cachedContratsOkVariantsSet = new Set();
                    this._cachedContratsOkByPeriod = new Map();
                    const lines = window.DECLARIS_CONTRATS_CSV.split(/\r?\n/);
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        const parts = line.split(';');
                        const id = parts[0]?.trim();
                        const statut = parts[3]?.trim();
                        const statutLib = parts[4]?.trim()?.toUpperCase();
                        const periodPart = parts[6]?.trim() || parts[5]?.trim();
                        let pNorm = '';
                        if (periodPart) {
                            if (/^\d{4}-\d{2}/.test(periodPart)) pNorm = periodPart.slice(0, 7);
                            else {
                                const ddmmyyyy = periodPart.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
                                if (ddmmyyyy) pNorm = `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}`;
                            }
                        }
                        if (id) {
                            const u = id.toUpperCase();
                            const ns = u.replace(/\s+/g, '');
                            const nz = ns.replace(/^0+/, '');
                            [u, ns, nz].filter(Boolean).forEach(v => this._cachedContratsVariantsSet.add(v));

                            if (statut === '01' || statutLib === 'VALIDE') {
                                [u, ns, nz].filter(Boolean).forEach(v => {
                                    this._cachedContratsOkVariantsSet.add(v);
                                    if (pNorm) {
                                        if (!this._cachedContratsOkByPeriod.has(pNorm)) {
                                            this._cachedContratsOkByPeriod.set(pNorm, new Set());
                                        }
                                        this._cachedContratsOkByPeriod.get(pNorm).add(v);
                                    }
                                });
                            }
                        }
                    }
                }
                const cachedSet = this._cachedContratsVariantsSet;
                const cachedOkSet = this._cachedContratsOkVariantsSet;
                const cachedOkByPeriod = this._cachedContratsOkByPeriod;
                contratsReg = {
                    isContractDeclared: (id) => {
                        if (!id) return false;
                        const s = String(id).trim().toUpperCase();
                        if (cachedSet.has(s)) return true;
                        const ns = s.replace(/\s+/g, '');
                        if (cachedSet.has(ns)) return true;
                        const nz = ns.replace(/^0+/, '');
                        return Boolean(nz && cachedSet.has(nz));
                    },
                    isContractDeclaredOk: (id) => {
                        if (!id) return false;
                        const s = String(id).trim().toUpperCase();
                        if (cachedOkSet.has(s)) return true;
                        const ns = s.replace(/\s+/g, '');
                        if (cachedOkSet.has(ns)) return true;
                        const nz = ns.replace(/^0+/, '');
                        return Boolean(nz && cachedOkSet.has(nz));
                    },
                    isContractDeclaredOkInPastPeriod: (currentPeriod, id) => {
                        if (!id || !currentPeriod) return false;
                        const normCurr = String(currentPeriod).trim().slice(0, 7);
                        const s = String(id).trim().toUpperCase();
                        const ns = s.replace(/\s+/g, '');
                        const nz = ns.replace(/^0+/, '');
                        for (const [p, set] of cachedOkByPeriod.entries()) {
                            if (!normCurr || p < normCurr) {
                                if (set.has(s) || set.has(ns) || (nz && set.has(nz))) return true;
                            }
                        }
                        return false;
                    },
                    isContractOkOnPlatform: (id, currentPeriod = null) => {
                        if (!id) return false;
                        return contratsReg.isContractDeclaredOk(id);
                    },
                    getAllDeclaredVariantsSet: () => cachedSet,
                    getAllOkVariantsSet: () => cachedOkSet
                };
            }
            headerContext.contratsRegistry = contratsReg;

            // Statistiques granulaires détaillées par volet CDR
            const pretsStats = {
                total: prets.length,
                anciens: 0,
                nouveaux: 0,
                ok: 0,
                errones: 0
            };

            const encoursStats = {
                total: encours.length,
                ok: 0,
                errones: 0
            };

            const debiteursStats = {
                total: debiteurs.length,
                ok: 0,
                errones: 0
            };

            // 3. Indexation des prêts pour croisement rapide avec l'encours
            const engLookup = new Map();
            prets.forEach((row, idx) => {
                const ref = getRawValue(row, ['REFCONTCMPT', 'REFCONTCMPT2', 'REF_CONTRAT', 'NUM_CONTRAT', 'NUMCONTRAT', 'REFENG', 'REF_ENG', 'NUM_ENG', 'REF_ENGAGEMENT', 'CONTRAT', 'COMPTE', 'REFINT']);
                if (ref) {
                    const item = { row, idx };
                    engLookup.set(ref.trim(), item);
                    engLookup.set(ref.trim().toUpperCase(), item);
                    const cleanRef = ref.trim().replace(/\s+/g, '');
                    engLookup.set(cleanRef, item);
                    engLookup.set(cleanRef.toUpperCase(), item);
                    const noZeros = cleanRef.replace(/^0+/, '');
                    if (noZeros) engLookup.set(noZeros, item);
                }
            });

            // 4. Contrôle Prêts (Engagements) avec distinction Ancien / Nouveau
            prets.forEach((row, idx) => {
                const lineNum = idx + 2;
                const ref = getRawValue(row, ['REFCONTCMPT', 'REFCONTCMPT2', 'REF_CONTRAT', 'NUM_CONTRAT', 'NUMCONTRAT', 'REFENG', 'REF_ENG', 'NUM_ENG', 'REF_ENGAGEMENT', 'CONTRAT', 'COMPTE', 'REFINT']) || `LIGNE_${lineNum}`;
                const isAncien = this.isAncienEngagement(row, ref, headerContext, contratsReg);
                if (isAncien) {
                    pretsStats.anciens++;
                } else {
                    pretsStats.nouveaux++;
                }

                const engAnomalies = this.validateEngagement(row, idx, headerContext, isAncien);
                allAnomalies.push(...engAnomalies);

                const hasBlocking = engAnomalies.some(a => a.isBlocking);
                if (hasBlocking) {
                    pretsStats.errones++;
                } else {
                    pretsStats.ok++;
                }
            });

            // 5. Contrôle Encours (avec transmission de engLookup pour LOG0037 / LOG0039)
            if (encours.length > 0) {
                encours.forEach((row, idx) => {
                    const encAnomalies = this.validateEncours(row, idx, headerContext, engLookup);
                    allAnomalies.push(...encAnomalies);

                    const hasBlocking = encAnomalies.some(a => a.isBlocking);
                    if (hasBlocking) {
                        encoursStats.errones++;
                    } else {
                        encoursStats.ok++;
                    }
                });
            } else {
                // Si pas de fichier encours séparé, vérifier si prets contient des colonnes encours
                let selfEncoursCount = 0;
                prets.forEach((row, idx) => {
                    const hasEncours = getRawValue(row, ['DATPAI', 'MNTTOTUTIL', 'DATECH', 'MNTPAY', 'MNTCRD', 'ESTSENSIBLE', 'NBRECHPAY', 'CLADEPREC']);
                    if (hasEncours !== '') {
                        selfEncoursCount++;
                        const encAnomalies = this.validateEncours(row, idx, headerContext, engLookup);
                        allAnomalies.push(...encAnomalies);

                        const hasBlocking = encAnomalies.some(a => a.isBlocking);
                        if (hasBlocking) {
                            encoursStats.errones++;
                        } else {
                            encoursStats.ok++;
                        }
                    }
                });
                encoursStats.total = selfEncoursCount;
            }

            // 6. Contrôle Débiteurs
            debiteurs.forEach((row, idx) => {
                const debAnomalies = this.validateCompteDebiteur(row, idx, headerContext);
                allAnomalies.push(...debAnomalies);

                const hasBlocking = debAnomalies.some(a => a.isBlocking);
                if (hasBlocking) {
                    debiteursStats.errones++;
                } else {
                    debiteursStats.ok++;
                }
            });

            // Calcul des indicateurs consolidés
            const totalAnomalies = allAnomalies.length;
            const errorCount = allAnomalies.filter(a => a.isBlocking).length;
            const warningCount = allAnomalies.filter(a => !a.isBlocking).length;

            // Répartition par contrat/compte
            const contratsMap = new Map();
            allAnomalies.forEach(a => {
                if (!contratsMap.has(a.ref)) {
                    contratsMap.set(a.ref, {
                        ref: a.ref,
                        source: a.source,
                        ligne: a.ligne,
                        hasBlocking: false,
                        errorsCount: 0,
                        warningsCount: 0,
                        codes: new Set(),
                        anomalies: []
                    });
                }
                const c = contratsMap.get(a.ref);
                if (a.isBlocking) {
                    c.hasBlocking = true;
                    c.errorsCount++;
                } else {
                    c.warningsCount++;
                }
                c.codes.add(a.code);
                c.anomalies.push(a);
            });

            const uniqueContratsEnErreur = Array.from(contratsMap.values());
            const uniqueContratsBloquants = uniqueContratsEnErreur.filter(c => c.hasBlocking);

            // Taux de conformité
            const totalItems = totalDeclaredRecords || 1;
            const nonConformItems = uniqueContratsBloquants.length;
            const conformItems = Math.max(0, totalItems - nonConformItems);
            const conformitePct = Number(((conformItems / totalItems) * 100).toFixed(1));

            // Statut prédictif BEAC
            let statutPrevu = '01'; // Accepté
            let statutLibelle = '01 - Accepté (Conforme)';
            let statutClass = 'accepted';

            if (errorCount > 0) {
                // Seuil de tolérance BEAC : généralement si le taux d'erreur dépasse 5-10%
                if (conformitePct < 90 || headerAnomalies.some(a => a.isBlocking)) {
                    statutPrevu = '03';
                    statutLibelle = '03 - Rejeté (Erreurs Bloquantes & Dépassement Seuil)';
                    statutClass = 'rejected';
                } else {
                    statutPrevu = '02';
                    statutLibelle = '02 - Partiellement Rejeté (Lignes isolées en rejet)';
                    statutClass = 'partial';
                }
            } else if (warningCount > 0) {
                statutLibelle = '01 - Accepté avec Avertissements';
                statutClass = 'warning';
            }

            // Top anomalies
            const codeCounts = new Map();
            allAnomalies.forEach(a => {
                codeCounts.set(a.code, (codeCounts.get(a.code) || 0) + 1);
            });
            const topAnomalies = Array.from(codeCounts.entries())
                .map(([code, count]) => ({
                    code,
                    count,
                    meta: this.rulesMeta[code] || {}
                }))
                .sort((a, b) => b.count - a.count);

            const stats = {
                type: 'cdr',
                prets: pretsStats,
                encours: encoursStats,
                debiteurs: debiteursStats,
                totalDeclaredRecords: pretsStats.total + encoursStats.total + debiteursStats.total,
                totalOk: pretsStats.ok + encoursStats.ok + debiteursStats.ok,
                totalErrones: pretsStats.errones + encoursStats.errones + debiteursStats.errones
            };

            return {
                timestamp: new Date(),
                type: 'cdr',
                headerContext,
                totalDeclaredRecords: stats.totalDeclaredRecords,
                pretsCount: prets.length,
                encoursCount: encoursStats.total,
                debiteursCount: debiteurs.length,
                stats,
                totalAnomalies,
                errorCount,
                warningCount,
                conformItems,
                nonConformItems,
                conformitePct,
                statutPrevu,
                statutLibelle,
                statutClass,
                anomalies: allAnomalies,
                uniqueContratsEnErreur,
                uniqueContratsBloquants,
                topAnomalies,
                // Indicateurs et liste dédiée aux clients non déclarés
                clientAnomaliesCount: allAnomalies.filter(a => a.code === 'CLI0001').length,
                uniqueMissingClients: (() => {
                    const cMap = new Map();
                    allAnomalies.filter(a => a.code === 'CLI0001').forEach(a => {
                        const id = String(a.valeur).trim();
                        if (!id) return;
                        if (!cMap.has(id)) {
                            cMap.set(id, { clientId: id, sources: new Set(), refs: new Set(), count: 0 });
                        }
                        const entry = cMap.get(id);
                        entry.count++;
                        entry.sources.add(a.source);
                        entry.refs.add(a.ref);
                    });
                    return Array.from(cMap.values()).map(e => ({
                        clientId: e.clientId,
                        sources: Array.from(e.sources).join(', '),
                        sampleRefs: Array.from(e.refs).slice(0, 5).join(', ') + (e.refs.size > 5 ? ` (+${e.refs.size - 5})` : ''),
                        count: e.count
                    })).sort((a, b) => b.count - a.count);
                })()
            };
        }

        /**
         * Export Excel de l'audit réglementaire avec actions correctives détaillées
         */
        exportAuditToExcel(auditResult, options = {}) {
            if (typeof XLSX === 'undefined') {
                throw new Error("La bibliothèque SheetJS (XLSX) n'est pas chargée.");
            }

            const wb = XLSX.utils.book_new();
            const h = auditResult.headerContext || {};
            const codePays = h.codePays || 'TD';
            const codeBanque = h.codeBanque || '60002';
            const numDec = h.numDec || '0001';
            const datArr = h.datArrStr || '';

            // -----------------------------------------------------------------
            // FEUILLE 1 : SYNTHÈSE & CONFORMITÉ BEAC
            // -----------------------------------------------------------------
            const syntheseData = [
                ['AUDIT PRÉALABLE DE CONFORMITÉ RÉGLEMENTAIRE - CENTRALE DES RISQUES (BEAC / COBAC)', ''],
                ['Généré par la plateforme Déclaris le ' + new Date().toLocaleString('fr-FR'), ''],
                ['', ''],
                ['PARAMÈTRES DE LA DÉCLARATION', 'VALEUR'],
                ['Code Pays', codePays],
                ['Code Établissement (Déclarant)', codeBanque],
                ['Numéro Déclaration', numDec],
                ['Date d\'Arrêté Comptable (DATARR)', datArr],
                ['Date d\'Émission (DATDEC)', h.datDecStr || ''],
                ['Type Déclaration', '51 - CDR Unifié'],
                ['', ''],
                ['INDICATEURS DE QUALITÉ & CONFORMITÉ BEAC', 'RÉSULTAT'],
                ['Statut Prédictif Plateforme BEAC', auditResult.statutLibelle],
                ['Taux de Conformité Réglementaire', `${auditResult.conformitePct} %`],
                ['Total Enregistrements Analysés', auditResult.totalDeclaredRecords],
                ['Total Contrats Prêts', auditResult.pretsCount],
                ['Total Lignes Encours', auditResult.encoursCount],
                ['Total Comptes Débiteurs', auditResult.debiteursCount],
                ['Enregistrements Conformes (Sans anomalie)', auditResult.conformItems],
                ['Enregistrements avec Anomalies', auditResult.nonConformItems],
                ['Total Anomalies Détectées', auditResult.totalAnomalies],
                ['  - Erreurs Bloquantes (Rejet assuré BEAC)', auditResult.errorCount],
                ['  - Avertissements (Non bloquants)', auditResult.warningCount],
                ['', ''],
                ['TOP 10 DES CODES ANOMALIES LES PLUS FRÉQUENTS', 'NOMBRE'],
            ];

            auditResult.topAnomalies.slice(0, 10).forEach(item => {
                syntheseData.push([`[${item.code}] ${item.meta.libelle || ''}`, item.count]);
            });

            const wsSynthese = XLSX.utils.aoa_to_sheet(syntheseData);
            wsSynthese['!cols'] = [{ wch: 60 }, { wch: 40 }];
            XLSX.utils.book_append_sheet(wb, wsSynthese, 'Synthèse Audit BEAC');

            // -----------------------------------------------------------------
            // FEUILLE 2 : DÉTAIL DES ANOMALIES & ACTIONS CORRECTIVES
            // -----------------------------------------------------------------
            const anomaliesRows = auditResult.anomalies.map(a => ({
                'N° Ligne Fichier': a.ligne,
                'Source / Volet': a.source,
                'Référence Contrat / Compte': a.ref,
                'Code Erreur BEAC': a.code,
                'Sévérité': a.isBlocking ? 'ERREUR BLOQUANTE' : 'AVERTISSEMENT',
                'Champ en Cause': a.champ,
                'Valeur Actuelle': a.valeur,
                'Libellé Officiel BEAC': a.libelle,
                'ACTION CORRECTIVE À EFFECTUER (SOLUTION)': a.action
            }));

            const wsAnomalies = XLSX.utils.json_to_sheet(anomaliesRows);
            wsAnomalies['!cols'] = [
                { wch: 14 }, // N° Ligne
                { wch: 16 }, // Source
                { wch: 28 }, // Réf
                { wch: 16 }, // Code BEAC
                { wch: 20 }, // Sévérité
                { wch: 18 }, // Champ
                { wch: 18 }, // Valeur
                { wch: 45 }, // Libellé
                { wch: 80 }  // Action corrective
            ];
            XLSX.utils.book_append_sheet(wb, wsAnomalies, 'Anomalies & Corrections');

            // -----------------------------------------------------------------
            // FEUILLE 3 : CONTRATS REJETÉS / BLOQUANTS (SYNTHÈSE PAR CONTRAT)
            // -----------------------------------------------------------------
            const bloquantsRows = auditResult.uniqueContratsBloquants.map(c => ({
                'Référence Contrat / Compte': c.ref,
                'Source': c.source,
                'Ligne': c.ligne,
                'Nombre d\'Erreurs Bloquantes': c.errorsCount,
                'Nombre d\'Avertissements': c.warningsCount,
                'Codes BEAC Concernés': Array.from(c.codes).join(', '),
                'Champs à Corriger': Array.from(new Set(c.anomalies.map(a => a.champ))).join(', '),
                'Première Action à Mener': c.anomalies[0]?.action || ''
            }));

            const wsBloquants = XLSX.utils.json_to_sheet(bloquantsRows);
            wsBloquants['!cols'] = [
                { wch: 28 }, { wch: 14 }, { wch: 10 }, { wch: 22 }, { wch: 20 }, { wch: 30 }, { wch: 35 }, { wch: 80 }
            ];
            XLSX.utils.book_append_sheet(wb, wsBloquants, 'Contrats Bloquants');

            // -----------------------------------------------------------------
            // FEUILLE 4 : RÉFÉRENTIEL DES CONTRÔLES BEAC
            // -----------------------------------------------------------------
            const referentielRows = Object.entries(this.rulesMeta).map(([code, meta]) => ({
                'Code Règle': code,
                'Catégorie': meta.categorie,
                'Type / Sévérité': meta.type,
                'Libellé Officiel BEAC': meta.libelle,
                'Explication & Consigne de Correction': meta.action
            }));

            const wsReferentiel = XLSX.utils.json_to_sheet(referentielRows);
            wsReferentiel['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 50 }, { wch: 80 }];
            XLSX.utils.book_append_sheet(wb, wsReferentiel, 'Référentiel Règles BEAC');

            // -----------------------------------------------------------------
            // FEUILLE 5 : CLIENTS NON RÉPERTORIÉS (À RÉGULARISER DANS FRCB)
            // -----------------------------------------------------------------
            if (auditResult.uniqueMissingClients && auditResult.uniqueMissingClients.length > 0) {
                const missingRows = auditResult.uniqueMissingClients.map(c => ({
                    'Identifiant Client (IdInt)': c.clientId,
                    'Volets Concernés': c.sources,
                    'Nombre d\'Engagements / Comptes': c.count,
                    'Exemples de Références': c.sampleRefs,
                    'Action Réglementaire Requise': 'À déclarer impérativement dans le FRCB (PP TypDec="01" ou PM TypDec="02") avant soumission CDR'
                }));
                const wsMissing = XLSX.utils.json_to_sheet(missingRows);
                wsMissing['!cols'] = [{ wch: 26 }, { wch: 22 }, { wch: 26 }, { wch: 40 }, { wch: 80 }];
                XLSX.utils.book_append_sheet(wb, wsMissing, 'Clients Manquants (pour FRCB)');
            }

            // Nom du fichier téléchargé
            const filename = `Audit_Controles_BEAC_${codePays}_${codeBanque}_${numDec}_${datArr.replace(/\//g, '')}.xlsx`;
            XLSX.writeFile(wb, filename);

            return filename;
        }

        /**
         * Audit complet d'un jeu de données FRCB (Personnes Physiques ou Morales)
         * @param {Array} records Lignes de données lues depuis le fichier Excel FRCB
         * @param {string} type 'frcb-pp' ou 'frcb-pm'
         * @param {Object} options Métadonnées de session / en-tête
         */
        auditFrcbDataset(records, type = 'frcb-pp', options = {}) {
            const rawRecords = Array.isArray(records) ? records : [];
            const isPp = type === 'frcb-pp';
            const typDec = isPp ? '01' : '02';
            const typeLabel = isPp ? 'FRCB Personnes Physiques (Particuliers)' : 'FRCB Personnes Morales (Entreprises)';

            const datDecStr = normalizeDateToJJMMAAAA(options.decDate || options.DatDec || new Date());
            const clientRegistry = options.clientRegistry || (typeof window !== 'undefined' ? window.ClientsRegistryManager : null);
            const headerContext = {
                codePays: (options.codePays || options.CodPay || 'TD').toUpperCase(),
                codeBanque: options.codeBanque || options.CodDec || '60002',
                numDec: String(options.numDec || options.NumDec || '0001').padStart(4, '0'),
                typDec,
                natDec: options.natDec || options.NatDec || '02',
                datDecStr,
                decDate: datDecStr,
                type,
                clientRegistry
            };

            const allAnomalies = [];

            // 1. Contrôles d'en-tête FRCB
            const headerAnomalies = this.validateHeader(headerContext, rawRecords.length);
            headerAnomalies.forEach(a => {
                a.source = 'En-tête FRCB';
                allAnomalies.push(a);
            });

            // 2. Contrôles de contenu ligne par ligne avec qualification Ancien vs Nouveau
            const stateContext = {
                declaredClients: new Set(),
                usedPieceSet: new Set()
            };

            let anciensCount = 0;
            let nouveauxCount = 0;
            const rowNatureList = [];

            rawRecords.forEach((row, idx) => {
                const idIntCli = getRawValue(row, ['IDINTCLI', 'IDINT', 'ID_INT', 'CLIENT', 'ID_CLIENT', 'IDCLI', 'CODE_CLIENT', 'NUMCLI', 'NO_CLIENT', 'IDENTIFIANT']);
                const rowCode = cleanUpper(getRawValue(row, ['CODE', 'NATDEC', 'NAT_DEC', 'NATURE_DECLARATION', 'TYP_DEC', 'TYPDEC']));
                const isHisto = (clientRegistry && typeof clientRegistry.isClientHistoricallyDeclared === 'function')
                    ? clientRegistry.isClientHistoricallyDeclared(idIntCli)
                    : false;

                const isAncien = (rowCode === '02' || rowCode === '00' || isHisto || (headerContext.natDec === '02'));
                if (isAncien) anciensCount++;
                else nouveauxCount++;

                const rowHeaderContext = Object.assign({}, headerContext, {
                    clientNatDec: isAncien ? '02' : '01',
                    isAncienClient: isAncien
                });

                rowNatureList.push({ idx, idIntCli, isAncien });

                const rowAnomalies = isPp
                    ? this.validateFrcbPersonnePhysique(row, idx, rowHeaderContext, stateContext)
                    : this.validateFrcbPersonneMorale(row, idx, rowHeaderContext, stateContext);

                rowAnomalies.forEach(a => allAnomalies.push(a));
            });

            // 3. Synthèse et métriques
            const errorCount = allAnomalies.filter(a => a.isBlocking).length;
            const warningCount = allAnomalies.filter(a => !a.isBlocking).length;
            const totalAnomalies = allAnomalies.length;

            // Regroupement par client
            const clientsMap = new Map();
            allAnomalies.forEach(a => {
                if (!clientsMap.has(a.ref)) {
                    clientsMap.set(a.ref, {
                        ref: a.ref,
                        source: a.source,
                        ligne: a.ligne,
                        hasBlocking: false,
                        errorsCount: 0,
                        warningsCount: 0,
                        codes: new Set(),
                        anomalies: []
                    });
                }
                const c = clientsMap.get(a.ref);
                if (a.isBlocking) {
                    c.hasBlocking = true;
                    c.errorsCount++;
                } else {
                    c.warningsCount++;
                }
                c.codes.add(a.code);
                c.anomalies.push(a);
            });

            const uniqueClientsEnErreur = Array.from(clientsMap.values());
            const uniqueClientsBloquants = uniqueClientsEnErreur.filter(c => c.hasBlocking);

            const totalItems = rawRecords.length || 1;
            const nonConformItems = uniqueClientsBloquants.length;
            const conformItems = Math.max(0, totalItems - nonConformItems);
            const conformitePct = Number(((conformItems / totalItems) * 100).toFixed(1));

            // Statut prédictif BEAC FRCB
            let statutPrevu = '01'; // Accepté
            let statutLibelle = '01 - Accepté (Conforme)';
            let statutClass = 'accepted';

            if (errorCount > 0) {
                if (conformitePct < 90 || headerAnomalies.some(a => a.isBlocking)) {
                    statutPrevu = '03';
                    statutLibelle = '03 - Rejeté (Erreurs Bloquantes & Rejet Total)';
                    statutClass = 'rejected';
                } else {
                    statutPrevu = '02';
                    statutLibelle = '02 - Partiellement Rejeté (Clients isolés en anomalie)';
                    statutClass = 'partial';
                }
            } else if (warningCount > 0) {
                statutLibelle = '01 - Accepté avec Avertissements';
                statutClass = 'warning';
            }

            // Top anomalies
            const codeCounts = new Map();
            allAnomalies.forEach(a => {
                codeCounts.set(a.code, (codeCounts.get(a.code) || 0) + 1);
            });
            const topAnomalies = Array.from(codeCounts.entries())
                .map(([code, count]) => ({
                    code,
                    count,
                    meta: this.rulesMeta[code] || {}
                }))
                .sort((a, b) => b.count - a.count);

            // Calcul précis des anciens vs nouveaux sains et erronés
            const blockingRefsSet = new Set(uniqueClientsBloquants.map(c => String(c.ref).trim().toUpperCase()));
            let anciensOkCount = 0;
            let anciensErronesCount = 0;
            let nouveauxOkCount = 0;
            let nouveauxErronesCount = 0;

            rowNatureList.forEach(item => {
                const refKey = String(item.idIntCli || `LIGNE_${item.idx + 2}`).trim().toUpperCase();
                const isBlocking = blockingRefsSet.has(refKey);
                if (item.isAncien) {
                    if (isBlocking) anciensErronesCount++;
                    else anciensOkCount++;
                } else {
                    if (isBlocking) nouveauxErronesCount++;
                    else nouveauxOkCount++;
                }
            });

            const stats = {
                totalClients: rawRecords.length,
                anciensClients: anciensCount,
                nouveauxClients: nouveauxCount,
                clientsOk: conformItems,
                clientsErrones: nonConformItems,
                anciensOk: anciensOkCount,
                anciensErrones: anciensErronesCount,
                nouveauxOk: nouveauxOkCount,
                nouveauxErrones: nouveauxErronesCount,
                conformitePct
            };

            return {
                timestamp: new Date(),
                headerContext,
                type,
                typeLabel,
                totalDeclaredRecords: rawRecords.length,
                recordsCount: rawRecords.length,
                totalAnomalies,
                errorCount,
                warningCount,
                conformItems,
                nonConformItems,
                conformitePct,
                statutPrevu,
                statutLibelle,
                statutClass,
                anomalies: allAnomalies,
                uniqueContratsEnErreur: uniqueClientsEnErreur,
                uniqueContratsBloquants: uniqueClientsBloquants,
                uniqueClientsBloquants,
                topAnomalies,
                stats
            };
        }

        /**
         * Export Excel de l'audit FRCB (PP ou PM)
         */
        exportFrcbAuditToExcel(auditResult, type = 'frcb-pp') {
            if (typeof XLSX === 'undefined') {
                throw new Error("La bibliothèque SheetJS (XLSX) n'est pas chargée.");
            }

            const wb = XLSX.utils.book_new();
            const h = auditResult.headerContext || {};
            const codePays = h.codePays || 'TD';
            const codeBanque = h.codeBanque || '60002';
            const numDec = h.numDec || '0001';
            const isPp = (type === 'frcb-pp' || auditResult.type === 'frcb-pp');
            const typeStr = isPp ? 'FRCB_PP_Particuliers' : 'FRCB_PM_Entreprises';
            const stats = auditResult.stats || {
                totalClients: auditResult.totalDeclaredRecords || 0,
                anciensClients: auditResult.conformItems || 0,
                nouveauxClients: 0,
                clientsOk: auditResult.conformItems || 0,
                clientsErrones: auditResult.nonConformItems || 0,
                anciensOk: auditResult.conformItems || 0,
                anciensErrones: auditResult.nonConformItems || 0,
                nouveauxOk: 0,
                nouveauxErrones: 0
            };

            // FEUILLE 1 : SYNTHÈSE
            const syntheseData = [
                ['AUDIT PRÉALABLE DE CONFORMITÉ FRCB - ' + (isPp ? 'PERSONNES PHYSIQUES' : 'PERSONNES MORALES'), ''],
                ['Centrale des Risques BEAC - Conforme au Kit d\'Interfaçage du 18/11/2025', ''],
                ['Généré le ' + new Date().toLocaleString('fr-FR'), ''],
                ['', ''],
                ['PARAMÈTRES DE LA DÉCLARATION', 'VALEUR'],
                ['Code Pays', codePays],
                ['Code Établissement (Déclarant)', codeBanque],
                ['Numéro Déclaration', numDec],
                ['Date d\'Émission (DatDec)', h.datDecStr || ''],
                ['Nature Déclaration Globale (NatDec)', h.natDec || '02'],
                ['Type Déclaration', isPp ? '01 - Personnes Physiques' : '02 - Personnes Morales'],
                ['', ''],
                ['SYNTHÈSE DU PORTEFEUILLE CLIENT (DEMANDE CONTRÔLE)', 'VALEUR'],
                ['1. Total Clients Traités', stats.totalClients],
                ['2. Anciens Clients (Code 02 - Mise à jour)', stats.anciensClients],
                ['   • Anciens Clients Conformes (OK)', stats.anciensOk || 0],
                ['   • Anciens Clients en Anomalie (À régulariser)', stats.anciensErrones || 0],
                ['3. Nouveaux Clients (Code 01 - Création)', stats.nouveauxClients],
                ['   • Nouveaux Clients Conformes (OK)', stats.nouveauxOk || 0],
                ['   • Nouveaux Clients en Anomalie (À régulariser)', stats.nouveauxErrones || 0],
                ['4. Nombre Total de Clients OK (Prêts pour le dépôt XML)', stats.clientsOk],
                ['5. Nombre Total de Clients Erronés (Isolés pour régularisation)', stats.clientsErrones],
                ['', ''],
                ['RÉSULTAT DE LA VALIDATION RÉGLEMENTAIRE BEAC', 'VALEUR'],
                ['Statut Prédictif Plateforme BEAC', auditResult.statutLibelle],
                ['Taux de Conformité Global', `${auditResult.conformitePct} %`],
                ['Total Anomalies Identifiées', auditResult.totalAnomalies],
                ['  - Erreurs Bloquantes (Rejets BEAC assurés)', auditResult.errorCount],
                ['  - Avertissements Réglementaires', auditResult.warningCount],
                ['', ''],
                ['TOP 10 DES RÈGLES BEAC DÉCLENCHÉES', 'OCCURRENCES']
            ];

            auditResult.topAnomalies.slice(0, 10).forEach(item => {
                syntheseData.push([`[${item.code}] ${item.meta.libelle || ''}`, item.count]);
            });

            const wsSynthese = XLSX.utils.aoa_to_sheet(syntheseData);
            wsSynthese['!cols'] = [{ wch: 60 }, { wch: 40 }];
            XLSX.utils.book_append_sheet(wb, wsSynthese, 'Synthèse Audit FRCB');

            // FEUILLE 2 : ANOMALIES & CORRECTIONS
            const anomaliesRows = auditResult.anomalies.map(a => ({
                'N° Ligne': a.ligne,
                'Volet': a.source,
                'Identifiant Client (IdIntCli)': a.ref,
                'Code Règle BEAC': a.code,
                'Sévérité': a.isBlocking ? 'ERREUR BLOQUANTE' : 'AVERTISSEMENT',
                'Champ': a.champ,
                'Valeur Actuelle': a.valeur,
                'Libellé Officiel BEAC': a.libelle,
                'Action Corrective Recommandée': a.action
            }));

            const wsAnomalies = XLSX.utils.json_to_sheet(anomaliesRows);
            wsAnomalies['!cols'] = [
                { wch: 10 }, { wch: 14 }, { wch: 26 }, { wch: 16 }, { wch: 22 }, { wch: 18 }, { wch: 20 }, { wch: 50 }, { wch: 80 }
            ];
            XLSX.utils.book_append_sheet(wb, wsAnomalies, 'Anomalies Ligne par Ligne');

            // FEUILLE 3 : CLIENTS BLOQUANTS
            const bloquants = auditResult.uniqueClientsBloquants || auditResult.uniqueContratsBloquants || [];
            const bloquantsRows = bloquants.map(c => ({
                'Identifiant Client (IdIntCli)': c.ref,
                'N° Ligne Fichier': c.ligne,
                'Erreurs Bloquantes': c.errorsCount,
                'Avertissements': c.warningsCount,
                'Codes BEAC Déclenchés': Array.from(c.codes || []).join(', '),
                'Champs en Erreur': Array.from(new Set((c.anomalies || []).map(a => a.champ))).join(', '),
                'Priorité d\'Action': c.anomalies?.[0]?.action || ''
            }));

            const wsBloquants = XLSX.utils.json_to_sheet(bloquantsRows);
            wsBloquants['!cols'] = [
                { wch: 26 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 30 }, { wch: 35 }, { wch: 80 }
            ];
            XLSX.utils.book_append_sheet(wb, wsBloquants, 'Clients Bloquants');

            // FEUILLE 4 : RÉFÉRENTIEL FRCB
            const frcbRules = Object.entries(this.rulesMeta)
                .filter(([code]) => code.startsWith('ENT') || code.startsWith('OBL') || code.startsWith('SYN') || code.startsWith('LOG') || code.startsWith('CLI'))
                .map(([code, meta]) => ({
                    'Code Règle': code,
                    'Catégorie': meta.categorie,
                    'Type': meta.type,
                    'Libellé BEAC': meta.libelle,
                    'Consigne / Solution': meta.action
                }));
            const wsRef = XLSX.utils.json_to_sheet(frcbRules);
            wsRef['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 50 }, { wch: 80 }];
            XLSX.utils.book_append_sheet(wb, wsRef, 'Référentiel BEAC');

            const filename = `Audit_FRCB_${typeStr}_${codePays}_${codeBanque}_${numDec}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, filename);

            return filename;
        }
    }

    // Export global
    window.BEACValidationEngine = BEACValidationEngine;
    window.beacValidatorInstance = new BEACValidationEngine();
    window.NATURES_ENGAGEMENT = NATURES_ENGAGEMENT;
    window.normalizeDateToJJMMAAAA = normalizeDateToJJMMAAAA;
    window.parseJJMMAAAADate = parseJJMMAAAADate;
    window.compareDates = compareDates;
    window.isLastDayOfMonth = isLastDayOfMonth;
    window.getDaysInMonth = getDaysInMonth;
    window.calculateDuration = calculateDuration;

})(typeof window !== 'undefined' ? window : global);
