# Declaris - Kit de Déploiement en Production

Plateforme autonome de génération, validation réglementaire BEAC (FRCB & CDR) et gestion des déclarations pour Coris Bank International.

## 📦 Contenu du Kit de Production (`declaris-production.zip`)

L'archive autonome `declaris-production.zip` contient l'ensemble des fichiers prêts à l'emploi pour le serveur de production :

- **Application Principale :**
  - `index.html` : Interface utilisateur complète (conformité BEAC, modales d'audit, gestion des onglets PP / PM / CDR).
  - `app.js` : Moteur applicatif, orchestration des déclarations, ségrégation stricte des contrats/clients et génération des classeurs Excel de remédiation.
  - `beac-validator.js` : Moteur de validation réglementaire BEAC (règles ENT, OBL, SYN, LOG et contrôles croisés).
  - `style.css` : Feuilles de styles et design épuré Coris Bank International.
  - `coris-logo.jpg` : Logo officiel institutionnel.
- **Bibliothèques Autonomes (`libs/`) :**
  - `libs/xlsx/` : Moteur de lecture/écriture de fichiers Excel.
  - `libs/fontawesome/` : Icônes vectorielles et polices locales.
  - `libs/inter/` : Typographie Inter embarquée (100% hors-ligne).
- **Référentiels & Fichiers de Référence :**
  - `clients_declares_referentiel.csv` : Référentiel des clients déclarés (PP & PM).
  - `contrats_et_id_declares.csv` : Base historique des identifiants et contrats déclarés.
  - `TD-60002-0057-30062023-51-ACQ.XML` : Fichier témoin d'acquittement BEAC.

---

## 🚀 Déploiement en Production

### 1. Prérequis
- Un serveur web standard (Nginx, Apache, IIS, ou conteneur Docker avec serveur HTTP statique).
- Aucun runtime backend ou base de données requis : l'application fonctionne entièrement côté client dans le navigateur tout en garantissant la confidentialité des données bancaires.

### 2. Procédure de Déploiement
1. Copier le fichier `declaris-production.zip` sur le serveur de production (ex: `/var/www/declaris` ou `htdocs/declaris`).
2. Décompresser l'archive :
   ```bash
   unzip -o declaris-production.zip -d /var/www/declaris
   ```
3. Configurer les droits de lecture :
   ```bash
   chmod -R 755 /var/www/declaris
   ```
4. Accéder à l'application via le navigateur : `https://declaris.coris-bank.com/` (ou l'URL interne dédiée).

---

## 🛡️ Fonctionnalités Validées & Incluses

1. **Ségrégation Métier Stricte :**
   - **FRCB Particuliers (PP) & Entreprises (PM)** : Ségrégation automatique entre bons clients (inclus dans la déclaration XML) et clients en anomalie (isolés dans un classeur Excel pour régularisation en agence).
   - **CDR (Crédits & Risques)** : Ségrégation des prêts, encours et débiteurs avec filtrage automatique en cascade (exclusion des crédits adossés à des clients non déclarés ou en anomalie).
2. **Export Excel de Remédiation :**
   - Téléchargement direct des classeurs de remédiation détaillant chaque ligne rejetée avec le motif précis et l'action corrective recommandée.
3. **Ingestion & Déduplication des Acquittements (ACQ) :**
   - Intégration des fichiers XML d'acquittement avec déduplication stricte sans altération du référentiel existant.
4. **Ordre Réglementaire Naturel :**
   - Parcours utilisateur aligné sur le flux BEAC : **Particuliers (FRCB PP) ➔ Entreprises (FRCB PM) ➔ Crédits & Risques (CDR)**.

