@AGENTS.md

# FamilyTree — Instructions pour Claude Code

## Vue d'ensemble du projet

Application web fullstack de gestion d'arbre généalogique.
Branche de développement : `claude/family-tree-app-6Ii4o`

## Stack et versions exactes

| Outil | Version | Notes importantes |
|-------|---------|-------------------|
| Next.js | 16.2.4 | App Router, `src/` dir, alias `@/*` |
| React | 19.2.4 | |
| TypeScript | 5.x | strict mode |
| TailwindCSS | 4.x | `@import "tailwindcss"` dans globals.css, pas de tailwind.config |
| React Flow | 11.x | import depuis `reactflow` |
| Prisma | 7.7.0 | **rupture majeure** — voir section dédiée |
| NextAuth.js | 5.0.0-beta | **rupture majeure** — voir section dédiée |
| PostgreSQL | 14+ | adapter `@prisma/adapter-pg` obligatoire |
| Claude API | — | `claude-sonnet-4-20250514` pour l'import PDF |

## Arborescence des fichiers

```
prisma/
  schema.prisma        # modèles : User, Person, Relationship
  seed.ts              # comptes de démonstration
  prisma.config.ts     # URL de connexion (Prisma 7, pas dans schema.prisma)

src/
  proxy.ts             # garde de route (auth) — s'appelle proxy.ts en Next.js 16, PAS middleware.ts
  types/
    index.ts           # types partagés : Person, Relationship, User, Role...
    next-auth.d.ts     # extension du type Session pour ajouter id et role
  lib/
    auth.ts            # config NextAuth (signIn, signOut, auth, handlers)
    prisma.ts          # singleton PrismaClient avec PrismaPg adapter
    api-helpers.ts     # requireAuth(minRole?) — protection des routes API
    tree-layout.ts     # algorithme de positionnement des nœuds React Flow
    utils.ts           # formatDate, canEdit, canAdmin, cn
    mock-data.ts       # données de démonstration (non utilisées en prod)
  components/
    layout/Navbar.tsx          # navigation responsive avec liens selon le rôle
    ui/Button.tsx              # variant: primary|secondary|danger|ghost
    ui/Input.tsx               # champ avec label et message d'erreur
    ui/Badge.tsx               # badge coloré pour les rôles
    tree/FamilyTree.tsx        # arbre React Flow (Provider + Controls + MiniMap)
    tree/PersonNode.tsx        # nœud personnalisé React Flow
    forms/PersonForm.tsx       # formulaire création/édition de personne
    forms/DeletePersonButton.tsx  # bouton suppression avec confirmation
    forms/UserManagement.tsx   # liste + création + édition des utilisateurs
  app/
    layout.tsx                 # root layout avec SessionProvider
    page.tsx                   # redirige vers /dashboard
    globals.css                # TailwindCSS v4
    login/page.tsx             # page de connexion
    dashboard/
      layout.tsx               # vérifie la session, affiche Navbar
      page.tsx                 # charge persons + relationships depuis DB, affiche FamilyTree
    persons/
      layout.tsx
      new/page.tsx             # guard EDITOR+, charge la liste des personnes
      [id]/page.tsx            # fiche détaillée avec relations
      [id]/edit/page.tsx       # guard EDITOR+, charge la personne + toutes les personnes
    pdf-import/
      layout.tsx               # guard ADMIN
      page.tsx                 # upload PDF → Claude API → prévisualisation → import
    users/
      layout.tsx               # guard ADMIN
      page.tsx                 # charge la liste des utilisateurs
    api/
      auth/[...nextauth]/route.ts  # handlers NextAuth
      persons/route.ts             # GET (READER+), POST (EDITOR+)
      persons/[id]/route.ts        # GET (READER+), PUT (EDITOR+), DELETE (EDITOR+)
      users/route.ts               # GET, POST (ADMIN)
      users/[id]/route.ts          # PUT, DELETE (ADMIN)
      pdf-import/route.ts          # POST (ADMIN) — appel Claude API
      pdf-import/confirm/route.ts  # POST (ADMIN) — import en base
```

## Ruptures majeures Prisma 7

**L'URL de connexion n'est PLUS dans `schema.prisma`.** Elle est dans `prisma.config.ts`.

```typescript
// ✅ CORRECT — prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: process.env["DATABASE_URL"] },
});

// ❌ INTERDIT — ne pas ajouter url dans schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // <-- erreur de validation
}
```

**PrismaClient requiert un adapter explicite.** Le moteur Rust a été supprimé.

```typescript
// ✅ CORRECT — toujours instancier avec l'adapter
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ❌ INTERDIT
const prisma = new PrismaClient(); // lève "engine type client requires adapter"
```

Ce pattern est appliqué dans `src/lib/prisma.ts` ET `prisma/seed.ts`.

## Ruptures majeures NextAuth v5

```typescript
// ✅ Import depuis "next-auth" (v5)
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
export const { handlers, auth, signIn, signOut } = NextAuth({ ... });

// ✅ Utilisation dans les Server Components
const session = await auth();

// ✅ Utilisation dans les Client Components
import { signIn, signOut } from "next-auth/react";

// ❌ Ancien pattern v4 — ne pas utiliser
import { getServerSession } from "next-auth/next";
import { getSession } from "next-auth/react";
```

La session contient `session.user.id` et `session.user.role` (déclarés dans `src/types/next-auth.d.ts`).

## Ruptures majeures Next.js 16

**Le fichier middleware s'appelle `proxy.ts`, pas `middleware.ts`.**

```
src/proxy.ts     ✅
src/middleware.ts ❌ (déclenche un warning de dépréciation)
```

**`serverComponentsExternalPackages` a été renommé en `serverExternalPackages` dans `next.config.ts`.**

**Les `params` des pages dynamiques sont une Promise en Next.js 16.**

```typescript
// ✅ CORRECT
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}

// ❌ ANCIEN pattern Next.js 14/15
export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params;
}
```

## Modèle de données

```
Person       id, firstName, lastName, birthDate?, deathDate?
Relationship personId → relatedPersonId, type: PARENT|CHILD|PARTNER, partnerId?
User         id, email, passwordHash, role: ADMIN|EDITOR|READER
```

**Sémantique des relations :**
- `PARENT` : `relatedPersonId` est un parent de `personId`
- `CHILD` : `relatedPersonId` est un enfant de `personId`
- `PARTNER` : relation conjugale (bidirectionnelle, créée en double)
- `partnerId` (nullable) : lie un enfant à un partenaire spécifique (pour les familles recomposées)

Les relations sont toujours créées **par paires** dans les transactions API (ex : créer PARENT crée aussi le CHILD inverse).

## Système de rôles

```typescript
type Role = "ADMIN" | "EDITOR" | "READER"
// Hiérarchie : READER(0) < EDITOR(1) < ADMIN(2)
```

- `requireAuth("EDITOR")` dans `src/lib/api-helpers.ts` protège les routes API
- `canEdit(role)` et `canAdmin(role)` dans `src/lib/utils.ts` protègent les composants UI
- Les layouts de pages protégées vérifient la session et redirigent vers `/login`

## Commandes disponibles

```bash
npm run dev           # serveur de développement (port 3000)
npm run build         # build de production
npm run db:migrate    # npx prisma migrate dev
npm run db:generate   # npx prisma generate
npm run db:seed       # génère le client puis exécute prisma/seed.ts via tsx
npm run db:studio     # interface graphique Prisma Studio
```

## Variables d'environnement requises

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/familytree?schema=public"
NEXTAUTH_SECRET="clé-aléatoire-32-caractères-minimum"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..."   # optionnel, uniquement pour l'import PDF
```

Le fichier `.env` doit être à la racine du projet. Il n'est pas commité (`.gitignore`).
Copier `.env.example` comme point de départ.

## Pièges connus et solutions

| Erreur | Cause | Solution |
|--------|-------|----------|
| `url is no longer supported in schema files` | URL mise dans schema.prisma | Retirer, mettre uniquement dans prisma.config.ts |
| `engine type client requires adapter` | PrismaClient sans adapter | Toujours passer `{ adapter }` au constructeur |
| `SASL: client password must be a string` | DATABASE_URL undefined | Ajouter `import "dotenv/config"` en tête du script tsx |
| `permission denied to create database` | Utilisateur pg sans CREATEDB | `ALTER USER familytree_user CREATEDB;` |
| `Cannot find module '.prisma/client/default'` | Client non généré | `npx prisma generate` |
| `sh: ts-node: not found` | ts-node non installé | Utiliser `tsx` à la place (déjà configuré) |
| `params` non accessible directement | Next.js 16 : params est une Promise | `const { id } = await params` |

## Conventions de code

- Pas de commentaires sauf si la logique est non évidente
- Composants serveur par défaut, `"use client"` uniquement si nécessaire (état, événements)
- Les pages (`page.tsx`) sont des Server Components qui fetching les données et passent les props
- Les composants interactifs sont dans `src/components/` avec `"use client"`
- Les routes API retournent toujours `NextResponse.json()`
- `prisma.$transaction()` pour toute opération multi-tables
