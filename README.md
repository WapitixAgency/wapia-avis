# Module d'avis Wapia

Le remplaçant d'Elfsight (résilié, actif jusqu'au 15/11/2026) : un custom element `<wapia-avis>` qui affiche une vitrine d'avis choisie par l'agent Wapia, sans cookie et sans requête vers Google.

- `widget-avis.js` : le composant (un seul fichier, tout inclus). Modèles `carrousel`, `grille`, `bandeau` ; thème `clair` ou `sombre` ; `accent` = couleur du site ; onglets par source quand il y en a plusieurs (Blue Lobster Loft : Booking, Airbnb).
- `donnees/<client>.json` : la vitrine de chaque client, écrite par la routine `avis-google` du serveur (`0 - SYSTEME/routines/avis-google/`). Aucune republication de site quand les avis changent.
- `apercu.html` + `serveur-apercu.mjs` : l'aperçu local (`node serveur-apercu.mjs`, puis http://127.0.0.1:4390/apercu.html ; config `wapia-avis` du `launch.json` des projets headless).

## Poser le module sur un site Wix classique (5 minutes par site)

1. Dans l'éditeur, supprimer le bloc Elfsight (« Intégrer du code » ou l'appli Elfsight).
2. Au même endroit : **Ajouter → Intégrer → Élément personnalisé** (Custom Element), source **URL du serveur** :
   `https://cdn.jsdelivr.net/gh/WapitixAgency/wapia-avis@main/widget-avis.js`, nom de balise **`wapia-avis`**.
3. Attributs : `client` = la clé du client (`sites.json`), `modele`, `theme`, `accent` (couleur du site), et si besoin `titre`.
4. Largeur : pleine largeur de la section (un custom element n'a pas de largeur par défaut) ; la hauteur suit le contenu.
5. Publier, vérifier en ligne à 1280 × 720 et sur téléphone.

Repli si l'élément personnalisé n'est pas disponible sur le forfait du site : un bloc « Intégrer du code » avec les deux lignes `<script src="…/widget-avis.js"></script>` et `<wapia-avis client="…"></wapia-avis>` (hauteur fixe à régler, moins souple).

## Site headless

Le composant se pose dans le code du site (`<script>` dans la mise en page, `<wapia-avis>` dans la section d'avis), ou le site lit la même vitrine côté serveur. Publier une fois ; ensuite, la routine met les avis à jour seule.

## Règles

- Jamais « vérifié » ni « certifié » (les avis Google ne le sont pas).
- Noms affichés : prénom et initiale du nom. Avatars : initiale sur une couleur, aucune photo chargée chez Google.
- Seuls des liens `https://` sont rendus ; tout le texte est échappé.
