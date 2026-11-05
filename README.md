# 🌍 GeoHub — L'Arcade de Jeux de Géographie

> Plateforme modulaire de mini-jeux géographiques conçue avec **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS** et **MapLibre GL JS**.

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-5.1-blueviolet?style=flat&logo=maplibre)](https://maplibre.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 Jeu Phare : GeoRings (Cercles de Population)

Inspiré des jeux de déduction territoriale et de calcul géodésique :
1. **Une ville centre de départ** vous est assignée (fixe pour le défi quotidien, aléatoire en mode libre).
2. **5 anneaux concentriques réguliers** s'étendent progressivement.
3. À chaque anneau, vous devez deviner **la commune ou métropole la plus peuplée**.
4. **3 vies par anneau :** 
   - Chaque essai situé dans l'anneau indique sa population et son **classement exact** dans la couronne (ex : *« Valence est 2ᵉ de cet anneau (si proche !) »*).
   - Les essais hors de l'anneau indiquent la distance sans révéler la population (anti-triche pour les anneaux suivants).
   - En cas d'échec sur les 3 vies, la bonne réponse est révélée et le jeu enchaîne sur l'anneau suivant.

### 📏 Échelles Multi-Périmètres Calibrées
- 🇫🇷 **France Métropolitaine :** 5 anneaux équidistants de **+80 km** (`[80, 160, 240, 320, 400 km]`)
- 🇪🇺 **Europe :** 5 anneaux équidistants de **~240 km** (`[250, 490, 730, 970, 1 200 km]`)
- 🌍 **Monde :** 5 anneaux équidistants de **+1 050 km** (`[800, 1 850, 2 900, 3 950, 5 000 km]`)

---

## 🛠️ Architecture Technique

- **Cartographie Vectorielle Cheat-Proof :** Rendu Canvas WebGL à 60 FPS avec **MapLibre GL JS** sur fond *Dark Matter No-Labels* (aucun nom de ville n'apparaît sur le fond de carte).
- **Calculs Géodésiques :** Formules du grand cercle (Haversine) et polygones sphériques continus (sans coupure horizontale sur l'antiméridien Pacifique).
- **Sécurité & Anti-Triche :** Validation 100% serveur. La population n'est jamais exposée dans le DOM ou les requêtes réseau d'autocomplétion avant la validation.
- **Base de Données Haute Vitesse :** SQLite embarqué indexé (`node:sqlite`) contenant plus de **30 000 villes** filtrées et nettoyées via un pipeline ETL Python (`uv`).

---

## 🚀 Lancement Local

```bash
# Cloner le dépôt
git clone https://github.com/julienfyll/geohub.git
cd geohub

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Rendez-vous sur [http://localhost:3000](http://localhost:3000) !

---

## 🚢 Déploiement Vercel en 1 clic

Le projet est pré-configuré pour un déploiement instantané sur [Vercel](https://vercel.com) :
1. Connectez-vous sur Vercel avec votre compte GitHub.
2. Importez le dépôt `julienfyll/geohub`.
3. Cliquez sur **Deploy** — la base SQLite et les Server Components sont pris en charge nativement sous Node 22+.
