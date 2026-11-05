# Module d'avis Wapia

Le remplaçant d'Elfsight (résilié, actif jusqu'au 15/11/2026) : un custom element `<wapia-avis>` qui affiche une vitrine d'avis choisie par l'agent Wapia, sans cookie et sans requête vers Google.

- `widget-avis.js` : le composant (un seul fichier, tout inclus). Modèles `carrousel`, `grille`, `bandeau` ; thème `clair` ou `sombre` ; `accent` = couleur du site ; onglets par source quand il y en a plusieurs (Blue Lobster Loft : Booking, Airbnb).
- `donnees/<client>.json` : la vitrine de chaque client, écrite par la routine des avis du serveur Wapia. Aucune republication de site quand les avis changent.
- `c/<clé>.js` : le chargeur de chaque client, fabriqué par `node construire-liens.mjs` (nouveau client : le relancer, commiter, pousser, et donner le lien figé sur ce commit).
- `version.json` : la version du module que chargent les liens. **Après toute modification de `widget-avis.js` : `node construire-liens.mjs --publier`** (commit, push, version.json, vérification).
- `apercu-sites.html` : chaque vitrine sur un fond proche de son site, pour contrôler les réglages.
- `apercu.html` + `serveur-apercu.mjs` : l'aperçu local (`node serveur-apercu.mjs`, puis http://127.0.0.1:4390/apercu.html).

## Poser le module sur un site Wix classique (5 minutes par site)

1. Dans l'éditeur, supprimer le bloc Elfsight (« Intégrer du code » ou l'appli Elfsight).
2. Au même endroit : **Ajouter → Intégrer → Élément personnalisé** (Custom Element), source **URL du serveur** = **le lien du client** :
   `https://cdn.jsdelivr.net/gh/WapitixAgency/wapia-avis@<commit>/c/<clé>.js` (le commit où le chargeur du client a été ajouté : `f91c050` pour les clients du 05/11), nom de balise **`wapia-avis`**. Le chargeur ne change jamais : il lit `version.json` chez GitHub et charge le module figé sur cette version ; les vitrines se lisent chez GitHub. On évite `@main`, que jsDelivr sert parfois en retard de plusieurs heures, même après purge.
3. Aucun attribut à poser : le lien porte la clé, et la vitrine porte les réglages d'affichage du site (couleur, police, fonds, bouton…), choisis par l'agence d'après le site (`sites.json` de la routine, clé « affichage »). Un attribut posé dans l'éditeur reste possible et passe devant (tableau ci-dessous).
4. Largeur : pleine largeur de la section (un custom element n'a pas de largeur par défaut) ; la hauteur suit le contenu.
5. Publier, vérifier en ligne à 1280 × 720 et sur téléphone.

### Les attributs (tous facultatifs sauf `client`)

Un attribut posé dans l'éditeur l'emporte sur les réglages du CMS. Sans attribut : cartes blanches avec une ombre légère, pas de bouton, police de la page.

| Attribut | Valeurs | Effet |
| --- | --- | --- |
| `client` | la clé | obligatoire |
| `accent` | `#RRGGBB` | couleur du site : bouton, « Lire la suite », flèches, points. Le texte du bouton plein passe en encre sombre si l'accent est clair |
| `fond-carte` | `blanc` (défaut), `#RRGGBB`, `transparent` | fond des cartes |
| `ombre` | `non` | cartes sans ombre (quand la carte a la couleur de la section) |
| `fond` | `#RRGGBB` | fond du module entier (défaut : celui de la section) |
| `fond-entete` | `blanc`, `#RRGGBB` | met la note globale dans un bloc (indispensable sur une photo) |
| `alignement` | `centre` | note globale centrée, logo au-dessus |
| `bord` | `#RRGGBB`, `non` | contour des cartes |
| `rayon` | `0` à `40` | arrondi des cartes et du bloc de note, en pixels |
| `colonnes` | `1` à `5` | cartes visibles à la fois sur grand écran (3 par défaut ; 2 sous 860 px, une et demie sur téléphone) |
| `couleur-etoiles` | `#RRGGBB` | couleur des étoiles (jaune Google par défaut) |
| `bouton` | présent, ou le libellé | affiche « Laisser un avis » ; `bouton="Laissez-nous un avis sur Google"` change le texte |
| `style-bouton` | `contour` (défaut), `plein` | bouton cerclé ou rempli de l'accent |
| `police` | un nom ou une pile CSS | ex. `police="poppins-semibold, poppins, sans-serif"` ; à défaut, celle de la page |
| `entete` | `complet` (défaut), `compact`, `nombre`, `non` | `compact` : « Google Avis » puis « 4,9 ★★★★★ (139) » ; `nombre` : le nombre d'avis sans la note (Gambas) ; `non` : pas d'en-tête |
| `logo` | `icone` (défaut), `icone-haut`, `mot`, `aucun` | G à gauche, G au-dessus, logotype « Google Avis », rien |
| `titre-entete` | un texte | ex. « Excellent sur Google » |
| `couleur-logo`, `couleur-entete` | `#RRGGBB` | logotype d'une seule couleur ; couleur du texte de l'en-tête |
| `disposition` | `centre` | carte centrée : étoiles, texte, puis l'auteur (SunSolutions, Gery) |
| `pied` | `google` | « Publié sur Google » en bas de chaque carte |
| `lignes` | `2` à `12` | lignes de texte avant « Lire la suite » (6 par défaut) |
| `police-web` | un nom de Google Fonts | police chargée chez Bunny Fonts (sans traceur), ex. `Montserrat` |
| `modele` | `carrousel` (défaut), `grille`, `bandeau` | |
| `theme` | `clair` (défaut), `sombre` | |
| `nombre`, `titre`, `source`, `reponses` | | nombre de cartes, titre, filtre initial, réponses du gérant |

Repli si l'élément personnalisé n'est pas disponible sur le forfait du site : un bloc « Intégrer du code » avec les deux lignes `<script src="…/widget-avis.js"></script>` et `<wapia-avis client="…"></wapia-avis>` (hauteur fixe à régler, moins souple).

## Site headless

Le composant se pose dans le code du site (`<script>` dans la mise en page, `<wapia-avis>` dans la section d'avis), ou le site lit la même vitrine côté serveur. Publier une fois ; ensuite, la routine met les avis à jour seule.

## Règles

- Jamais « vérifié » ni « certifié » (les avis Google ne le sont pas).
- Noms affichés : prénom et initiale du nom. Avatars : initiale sur une couleur, aucune photo chargée chez Google.
- Seuls des liens `https://` sont rendus ; tout le texte est échappé.
