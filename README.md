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

L'app declare aussi une orientation paysage dans son manifest PWA. Les navigateurs et applications mobiles ne permettent pas tous de forcer la rotation automatiquement. Quand le telephone reste en portrait, un ecran bloque l'app et demande de passer en paysage.

## Ajouter du content

Les images doivent etre placees dans `public/captures/`.

Nomme les captures avec un identifiant stable, par exemple :

```text
CAP-0001.webp
CAP-0002.webp
CAP-0003.webp
```

Dans `src/data/content.json`, renseigne ensuite le chemin public exact :

```json
"/captures/CAP-0001.webp"
```

Chaque question doit utiliser le `capture_id` de la capture correspondante. Pour ajouter une nouvelle question, modifie uniquement `src/data/content.json` : il ne faut pas modifier le code de l'app.

Avant de publier, lance :

```bash
npm run validate:content
```

Ne mets pas de brouillons dans `content.json` : ce fichier est la source officielle affichee par l'app.

## Donnees locales

Les captures, questions, corrections, modes, categories, tags et termes de glossaire vivent dans `src/data/content.json`.
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
