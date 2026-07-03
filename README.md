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

## Affichage cible

L'app est pensee en priorite pour un telephone en mode paysage. Sur ordinateur, ouvre les outils de developpement du navigateur, active l'apercu mobile, puis passe le telephone virtuel en paysage pour verifier le rendu principal.

## Ajouter les futures captures

Place les images de situation dans `public/captures/`, puis reference-les dans les fichiers JSON via un chemin du type :

```json
"/captures/nom-de-la-capture.png"
```

## Donnees locales

Les captures et questions de la V0 vivent dans `src/data/content.example.json`.
Les types TypeScript associes sont dans `src/types/content.ts`.
Le format est documente dans `docs/data-format.md`.

## Structure

- `public/captures/` : captures de jeu.
- `src/app/` : routes App Router.
- `src/components/` : composants d'interface.
- `src/data/` : fichiers JSON locaux.
- `src/lib/` : fonctions de lecture et logique applicative.
- `src/lib/session/` : base pour la future logique de session.
- `src/types/` : types TypeScript partages.
