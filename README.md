# Kamy · prototype jouable

Prototype de règles de Kamy : un duel en paysage contre un bot.

Sur iPhone : ouvrir la page dans Safari, puis Partager › Sur l'écran d'accueil. Le jeu s'ouvre alors comme une app.

Ce dépôt ne contient que la version jouable. Les règles, le concept et les outils de simulation vivent dans le dépôt privé du projet ; chaque nouvelle version du prototype y est vérifiée, puis copiée ici.

## Vérification automatique

À chaque push, GitHub Actions vérifie la syntaxe, la concordance entre `APP_VERSION` dans `index.html` et `version.json`, le chargement réel de la page sans exception, et la présence de tous les fichiers qu'elle appelle (manifeste, icônes).

Pour la lancer localement (Node 22 et Playwright requis) :

```
node .github/verify.mjs .
```
