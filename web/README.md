# AoS — Lames de Khorne (helper)

Application web locale : liste d’armée, partie, suivi (PV, mêlée, dîme, etc.).

## Tester en local

Ouvrir `index.html` via un petit serveur (les modules ES sont bloqués en `file://`) :

```bash
cd web
python -m http.server 8080
```

Puis : http://localhost:8080

Sous Windows : double-clic sur `run-server.cmd` ou `Lancer le helper.cmd`.

## Publier sur GitHub Pages (accès depuis n’importe quelle URL `https://…github.io/…`)

GitHub Pages sert le site en **HTTPS** : les modules ES (`game-app.js`, etc.) fonctionnent comme en local, **sans** `file://`.

Le dépôt peut être soit **tout le projet** (Unity + dossier `web/`), soit **uniquement** le contenu de `web/` à la racine du dépôt.

### Ce dépôt (`Warhammer-helper`)

Le site est à la **racine** du dépôt (`index.html`, `game-app.js`, etc.). Le workflow **`.github/workflows/github-pages.yml`** publie tout le dossier (`path: .`).

1. Pousse la branche **`main`** sur GitHub.

2. **Settings → Pages → Build and deployment** : **Source** = **GitHub Actions**.

3. Onglet **Actions** : vérifie que **Deploy GitHub Pages** réussit après le push.

4. URL habituelle : **`https://ChosenSith.github.io/Warhammer-helper/`** (voir aussi **Settings → Pages**).

Le fichier **`.nojekyll`** évite que Jekyll traite le site.

### Autre dépôt : projet avec un sous-dossier `web/` à la racine Git

Place une copie du workflow dans **`.github/workflows/`** à la racine du monorepo avec **`path: web`** dans l’étape *Upload site* au lieu de **`path: .`**.

Le script **`<base>`** dans `index.html` garde des chemins corrects même si l’URL n’a pas de slash final (comportement fréquent sur GitHub Pages).
