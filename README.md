# Kamy · prototype jouable (kamy-play)

Prototype de règles de Kamy : un duel en paysage contre un bot.

Sur iPhone : ouvrir la page dans Safari, puis Partager › Sur l'écran d'accueil. Le jeu s'ouvre alors comme une app.

Ce dépôt ne contient que la version jouable. Les règles, le concept et les outils de simulation vivent dans le dépôt privé du projet ; chaque nouvelle version du prototype y est vérifiée, puis copiée ici.

## Vérification automatique

À chaque push, GitHub Actions vérifie la syntaxe, la concordance entre `APP_VERSION` dans `index.html` et `version.json`, le chargement réel de la page sans exception, et la présence de tous les fichiers qu'elle appelle (manifeste, icônes).

Pour la lancer localement (Node 22 et Playwright requis) :

```
node .github/verify.mjs .
```

## Versions

L'app affiche son numéro de version et sa date dans l'écran **Version, synchronisation et nouveautés**, avec un bouton **Rechercher une mise à jour** et la liste des **Nouveautés**.

Ne rien modifier directement ici : tout ce dépôt, sauf ce README, `.github/` et `tools/`, est recopié depuis `prototype/` dans le dépôt privé Kamy à chaque version vérifiée, et une modification faite ici est écrasée à la publication suivante. C'est ce qui est arrivé à la version 0.2.1 ; la 0.2.2 l'a rétablie depuis Kamy.

## Synchronisation entre appareils

`sync.js`, commun à toutes les apps de Gluminou, copie l'identifiant de testeur, le deck et les parties jouées entre les appareils, par `data.json` dans le dépôt privé **Gluminou/kamy-play-data**. Chaque appareil s'y connecte une fois avec une clé GitHub à grain fin (Contents en lecture et écriture sur ce dépôt), collée dans l'écran Version, synchronisation et nouveautés.
