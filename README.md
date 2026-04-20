# FamilyTree — Application de gestion d'arbre généalogique

Application web fullstack pour créer, visualiser et gérer un arbre généalogique digital.

## Stack technique

- **Frontend** : React 19 + TailwindCSS v4
- **Visualisation** : React Flow 11
- **Backend** : Next.js 16 (App Router, fullstack)
- **Base de données** : PostgreSQL + Prisma 7 ORM
- **IA** : Claude API (`claude-sonnet-4-20250514`) pour extraction PDF
- **Auth** : NextAuth.js v5 (JWT, gestion des rôles)

## Démarrage rapide

### 1. Prérequis

- Node.js 18+
- PostgreSQL 14+

### 2. Installation

```bash
npm install
```

### 3. Configuration

Copiez `.env.example` vers `.env` et configurez :

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://user:password@localhost:5432/familytree?schema=public"
NEXTAUTH_SECRET="votre-secret-32-caracteres"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..."
```

### 4. Base de données

```bash
# Créer les tables
npx prisma migrate dev --name init

# Créer les comptes de test
npm run db:seed
```

**Comptes créés par le seed :**

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@familytree.local | admin123 | Admin |
| editor@familytree.local | editor123 | Éditeur |
| reader@familytree.local | reader123 | Lecteur |

### 5. Lancement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

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
