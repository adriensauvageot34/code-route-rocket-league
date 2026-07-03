# Code de la route Rocket League

Base Next.js + TypeScript pour une app d'entrainement a la prise de decision Rocket League.

## Lancer en local

```bash
npm install
npm run dev
```

Sur PowerShell, si `npm` est bloque par la politique d'execution Windows, utilise plutot :

```bash
npm.cmd install
npm.cmd run dev
```

L'app sera disponible sur `http://localhost:3000`.

Le script `dev` utilise un lanceur local pour eviter l'erreur Windows/Codex `spawn EPERM` observee avec le lanceur Next.js 16. Le lanceur officiel reste disponible avec `npm.cmd run dev:next`.

## Ajouter les futures captures

Place les images de situation dans `public/captures/`, puis reference-les dans les fichiers JSON via un chemin du type :

```json
"/captures/nom-de-la-capture.png"
```

## Donnees locales

Les questions de la V0 vivent dans `src/data/questions.example.json`.
Les types TypeScript associes sont dans `src/types/question.ts`.

## Structure

- `public/captures/` : captures de jeu.
- `src/app/` : routes App Router.
- `src/components/` : composants d'interface.
- `src/data/` : fichiers JSON locaux.
- `src/lib/` : fonctions de lecture et logique applicative.
- `src/lib/session/` : base pour la future logique de session.
- `src/types/` : types TypeScript partages.
