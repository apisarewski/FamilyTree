# FamilyTree — Application de gestion d'arbre généalogique

Application web fullstack pour créer, visualiser et gérer un arbre généalogique digital.

## Stack technique

- **Frontend** : React 19 + TailwindCSS v4
- **Visualisation** : React Flow 11
- **Backend** : Next.js 16 (App Router, fullstack)
- **Base de données** : PostgreSQL + Prisma 7 ORM
- **IA** : Claude API (`claude-sonnet-4-20250514`) pour extraction PDF
- **Auth** : NextAuth.js v5 (JWT, gestion des rôles)

## 🚀 Installation & Démarrage

> **Pour les débutants** : suivez les étapes dans l'ordre. Chaque section indique les commandes à taper dans un terminal (aussi appelé « invite de commandes » sur Windows).

---

### Étape 1 — Installer Node.js

Node.js est l'environnement d'exécution JavaScript nécessaire pour faire tourner le projet.

**👉 Version recommandée : LTS (Long Term Support), actuellement la v22**

#### 🐧 Linux (Ubuntu / Debian)

```bash
# Ajouter le dépôt officiel Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Installer Node.js
sudo apt install -y nodejs
```

#### 🍎 Mac

```bash
# Si Homebrew n'est pas installé, installez-le d'abord :
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installer Node.js via Homebrew
brew install node@22
```

#### 🪟 Windows

1. Allez sur [nodejs.org/fr/download](https://nodejs.org/fr/download)
2. Cliquez sur **« LTS »** pour télécharger l'installeur `.msi`
3. Lancez l'installeur et suivez les étapes (laissez toutes les options par défaut)

#### ✅ Vérifier l'installation

Ouvrez un nouveau terminal et tapez :

```bash
node -v
```

Vous devez voir quelque chose comme `v22.x.x`. Si c'est le cas, Node.js est bien installé.

```bash
npm -v
```

Vous devez voir un numéro de version (ex : `10.x.x`). npm est le gestionnaire de paquets, il est installé automatiquement avec Node.js.

---

### Étape 2 — Installer PostgreSQL

PostgreSQL est la base de données qui stocke l'arbre généalogique.

**👉 Version recommandée : PostgreSQL 16 ou 17**

#### 🐧 Linux (Ubuntu / Debian)

```bash
# Installer PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Démarrer le service PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql  # démarrage automatique au boot

# Vérifier que le service tourne
sudo systemctl status postgresql
```

#### 🍎 Mac

```bash
# Installer PostgreSQL via Homebrew
brew install postgresql@16

# Démarrer le service
brew services start postgresql@16

# Ajouter PostgreSQL au PATH (copiez-collez cette ligne dans votre terminal)
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Vérifier que le service tourne
brew services list
```

#### 🪟 Windows

1. Allez sur [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Cliquez sur **« Download the installer »**
3. Téléchargez la dernière version pour Windows x86-64
4. Lancez l'installeur :
   - Laissez le répertoire d'installation par défaut
   - Notez bien le **mot de passe superutilisateur** que vous choisissez (vous en aurez besoin)
   - Port par défaut : `5432` (ne pas changer)
5. PostgreSQL démarre automatiquement comme service Windows

#### 🗄️ Créer la base de données et l'utilisateur du projet

Ces commandes sont à lancer **une seule fois**, après l'installation de PostgreSQL.

**🐧 Linux :**

```bash
# Ouvrir le shell PostgreSQL en tant qu'administrateur
sudo -u postgres psql

# Dans le shell psql, tapez ces commandes (une par une) :
CREATE USER familytree_user WITH PASSWORD 'monmotdepasse' CREATEDB;
CREATE DATABASE familytree OWNER familytree_user;
GRANT ALL PRIVILEGES ON DATABASE familytree TO familytree_user;
\q
```

**🍎 Mac :**

```bash
# Ouvrir le shell PostgreSQL
psql postgres

# Dans le shell psql, tapez ces commandes (une par une) :
CREATE USER familytree_user WITH PASSWORD 'monmotdepasse' CREATEDB;
CREATE DATABASE familytree OWNER familytree_user;
GRANT ALL PRIVILEGES ON DATABASE familytree TO familytree_user;
\q
```

**🪟 Windows :**

1. Ouvrez **pgAdmin 4** (installé automatiquement avec PostgreSQL)
2. Connectez-vous avec le mot de passe superutilisateur choisi à l'installation
3. Clic droit sur **« Login/Group Roles »** → **« Create »** → **« Login/Group Role »**
   - Name : `familytree_user`
   - Password : `monmotdepasse`
   - Privileges : cochez **« Can login »** et **« Can create databases »**
4. Clic droit sur **« Databases »** → **« Create »** → **« Database »**
   - Name : `familytree`
   - Owner : `familytree_user`

> 💡 Remplacez `monmotdepasse` par un mot de passe de votre choix. Notez-le, vous en aurez besoin à l'étape suivante.
>
> ⚠️ Le `CREATEDB` est obligatoire : Prisma crée une base temporaire interne lors des migrations. Sans ce droit, la commande `npx prisma migrate dev` échoue.

---

### Étape 3 — Configurer les variables d'environnement

Les variables d'environnement contiennent les informations sensibles (mots de passe, clés API) que l'application utilise au démarrage.

#### Créer le fichier `.env`

**🐧 Linux / 🍎 Mac :**

```bash
cp .env.example .env
```

**🪟 Windows (PowerShell) :**

```powershell
Copy-Item .env.example .env
```

Ouvrez ensuite le fichier `.env` avec n'importe quel éditeur de texte (VS Code, Notepad++, Bloc-notes…).

#### Remplir chaque variable

```env
DATABASE_URL="postgresql://familytree_user:monmotdepasse@localhost:5432/familytree?schema=public"
NEXTAUTH_SECRET="une-cle-secrete-aleatoire-de-32-caracteres-minimum"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-api03-..."
```

**📌 `DATABASE_URL` — Connexion à PostgreSQL**

Construisez cette URL en remplaçant les valeurs par celles choisies à l'étape 2 :

```
postgresql://UTILISATEUR:MOTDEPASSE@HOTE:PORT/NOM_BASE?schema=public
```

Exemple avec les valeurs de l'étape 2 :

```
postgresql://familytree_user:monmotdepasse@localhost:5432/familytree?schema=public
```

**📌 `NEXTAUTH_SECRET` — Clé secrète pour les sessions**

Cette clé sert à signer les tokens d'authentification. Elle doit être aléatoire et faire au moins 32 caractères.

Pour en générer une automatiquement, tapez l'une de ces commandes dans votre terminal :

```bash
# Méthode 1 — avec openssl (Linux, Mac, Windows avec Git Bash)
openssl rand -base64 32

# Méthode 2 — avec Node.js (tous systèmes)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copiez le résultat et collez-le comme valeur de `NEXTAUTH_SECRET`.

**📌 `ANTHROPIC_API_KEY` — Clé pour l'import PDF via Claude**

1. Créez un compte sur [console.anthropic.com](https://console.anthropic.com)
2. Allez dans **« API Keys »** → **« Create Key »**
3. Copiez la clé générée (elle commence par `sk-ant-`)
4. Collez-la comme valeur de `ANTHROPIC_API_KEY`

> ⚠️ Sans cette clé, la fonctionnalité d'import PDF sera indisponible, mais toutes les autres fonctionnalités du projet fonctionneront normalement.

---

### Étape 4 — Installer et lancer le projet

#### Installer les dépendances

Dans le terminal, placez-vous dans le dossier du projet et lancez :

```bash
npm install
```

> Cette commande télécharge tous les paquets nécessaires. Cela peut prendre 1 à 2 minutes selon votre connexion.

#### Créer les tables de la base de données

```bash
npx prisma migrate dev --name init
```

Cette commande crée automatiquement toutes les tables dans PostgreSQL à partir du schéma défini dans `prisma/schema.prisma`.

> Si vous voyez `✔ Your database is now in sync`, c'est que tout s'est bien passé.

#### Créer les comptes utilisateurs de démonstration

```bash
npm run db:seed
```

Cette commande crée trois comptes de test pour vous permettre de tester l'application immédiatement :

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@familytree.local | admin123 | Admin |
| editor@familytree.local | editor123 | Éditeur |
| reader@familytree.local | reader123 | Lecteur |

#### Lancer le serveur de développement

```bash
npm run dev
```

Ouvrez votre navigateur et allez sur **[http://localhost:3000](http://localhost:3000)**

Vous devriez voir la page de connexion de FamilyTree. Connectez-vous avec `admin@familytree.local` / `admin123` pour commencer.

---

### Étape 5 — En cas de problème

#### Vérifier que PostgreSQL est bien démarré

**🐧 Linux :**
```bash
sudo systemctl status postgresql
# La ligne "Active: active (running)" doit apparaître en vert
```

**🍎 Mac :**
```bash
brew services list | grep postgresql
# La colonne "Status" doit afficher "started"
```

**🪟 Windows :**
```powershell
# Dans PowerShell (en administrateur)
Get-Service -Name postgresql*
# La colonne "Status" doit afficher "Running"
```

#### Vérifier que Node.js est bien installé

```bash
node -v   # doit afficher v18.x.x ou supérieur
npm -v    # doit afficher un numéro de version
```

#### Erreurs courantes et solutions

**❌ `Error: connect ECONNREFUSED 127.0.0.1:5432`**

PostgreSQL n'est pas démarré. Relancez-le :
```bash
# Linux
sudo systemctl start postgresql

# Mac
brew services start postgresql@16

# Windows : ouvrez "Services" dans le panneau de configuration et démarrez "postgresql-x64-16"
```

**❌ `password authentication failed for user "familytree_user"`**

Le mot de passe dans `DATABASE_URL` ne correspond pas à celui créé dans PostgreSQL. Vérifiez qu'ils sont identiques (attention aux majuscules, espaces, caractères spéciaux).

**❌ `Error P3014 — permission denied to create database` (shadow database)**

Prisma a besoin de créer une base temporaire pendant les migrations, ce qui nécessite le droit `CREATEDB`. Accordez-le avec cette commande :

```bash
# Linux
sudo -u postgres psql -c "ALTER USER familytree_user CREATEDB;"

# Mac
psql postgres -c "ALTER USER familytree_user CREATEDB;"

# Windows (PowerShell, en tant qu'administrateur)
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "ALTER USER familytree_user CREATEDB;"
```

Puis relancez `npx prisma migrate dev --name init`.

**❌ `database "familytree" does not exist`**

La base de données n'a pas été créée. Reprenez la section « Créer la base de données » de l'étape 2.

**❌ `Module not found` ou `Cannot find module`**

Les dépendances ne sont pas installées. Relancez :
```bash
npm install
```

**❌ `Environment variable not found: DATABASE_URL`**

Le fichier `.env` est manquant ou mal nommé. Vérifiez qu'il existe bien à la racine du projet (et non `.env.example`), et qu'il contient bien toutes les variables.

**❌ L'import PDF ne fonctionne pas**

Vérifiez que `ANTHROPIC_API_KEY` est bien renseigné dans `.env` et que la clé est valide (elle doit commencer par `sk-ant-`). Consultez votre quota sur [console.anthropic.com](https://console.anthropic.com).

---

## Démarrage rapide (résumé)

Pour les utilisateurs expérimentés, voici toutes les commandes en une fois :

```bash
# 1. Copier et remplir les variables d'environnement
cp .env.example .env
# → Éditez .env avec vos infos PostgreSQL et vos clés API

# 2. Installer les dépendances
npm install

# 3. Créer les tables et les données de test
npx prisma migrate dev --name init
npm run db:seed

# 4. Lancer l'application
npm run dev
# → Ouvrir http://localhost:3000
```

## Fonctionnalités

### Rôles utilisateurs

- **Admin** : accès total (import PDF, CRUD complet, gestion des utilisateurs)
- **Éditeur** : ajout et modification de personnes et relations
- **Lecteur** : consultation et recherche uniquement

### Pages principales

| Page | Route | Accès |
|------|-------|-------|
| Connexion | `/login` | Public |
| Arbre généalogique | `/dashboard` | Tous |
| Fiche personne | `/persons/[id]` | Tous |
| Nouvelle personne | `/persons/new` | Admin, Éditeur |
| Modifier personne | `/persons/[id]/edit` | Admin, Éditeur |
| Import PDF | `/pdf-import` | Admin |
| Utilisateurs | `/users` | Admin |

### Import PDF

1. Uploadez un PDF (arbre visuel, acte de naissance, livret de famille...)
2. Claude analyse le document et extrait personnes + relations
3. Prévisualisez et corrigez les données extraites
4. Validez l'import en base de données

### API Routes

```
GET    /api/persons           — Liste des personnes
POST   /api/persons           — Créer une personne
GET    /api/persons/[id]      — Détail d'une personne
PUT    /api/persons/[id]      — Modifier une personne
DELETE /api/persons/[id]      — Supprimer une personne

GET    /api/users             — Liste des utilisateurs (Admin)
POST   /api/users             — Créer un utilisateur (Admin)
PUT    /api/users/[id]        — Modifier le rôle (Admin)
DELETE /api/users/[id]        — Supprimer un utilisateur (Admin)

POST   /api/pdf-import        — Extraire un PDF via Claude
POST   /api/pdf-import/confirm — Confirmer l'import en base
```

## Modèle de données

```
Person: id, firstName, lastName, birthDate, deathDate
Relationship: personId, relatedPersonId, type (PARENT|CHILD|PARTNER), partnerId
User: email, passwordHash, role (ADMIN|EDITOR|READER)
```

La relation `partnerId` permet de lier un enfant à deux parents spécifiques (support de plusieurs partenaires).

## Scripts

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run db:migrate   # Appliquer les migrations Prisma
npm run db:seed      # Créer les comptes de test
npm run db:studio    # Interface Prisma Studio
```
