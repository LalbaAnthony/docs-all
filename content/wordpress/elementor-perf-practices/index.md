# Elementor : garder le site rapide

Règles à suivre pour modifier le site Maison Samaran avec Elementor sans le ralentir. Mis à jour le 23/10/2026.

- Le site est lent sur mobile : 35 à 53/100 sur PageSpeed, et la bannière d'accueil n'apparaît qu'au bout d'environ 13 secondes en test 4G lente.
- Une partie se corrige côté technique ; le reste dépend de la façon dont les pages sont construites.

## Préparer une image avant de l'importer

- Redimensionner et compresser chaque image avant de l'importer : les images pèsent 1,8 Mo sur les 4 Mo de la page d'accueil.
- Tailles et poids maximum :
  - Bannière pleine largeur (ordinateur) : 1920 px de large, 200 Ko, JPEG ou WebP.
  - Bannière version mobile : 900 px de large, 80 Ko, JPEG ou WebP.
  - Photo produit : 1200 px de large, 150 Ko, JPEG ou WebP.
  - Photo dans un bloc ou une carte (boutique, article) : 1200 px de large, 150 Ko, JPEG ou WebP.
  - Logo, pictogramme : 20 Ko, SVG (ou PNG si l'image a de la transparence).
- **Jamais de photo en PNG** : le PNG sert aux logos et aux images transparentes. Exemple actuel : la photo des biscuits Okina pèse 341 Ko en PNG, environ 30 Ko en WebP.
- **Compresser avec [Squoosh](https://squoosh.app)** (gratuit, dans le navigateur) : régler la largeur, choisir WebP ou MozJPEG, qualité 75 à 80.
- **Depuis Canva**, télécharger en JPG à la bonne taille plutôt qu'en PNG ou en taille maximale. La bannière d'accueil actuelle pèse 328 Ko pour un bandeau de 300 px de haut sur mobile.
- **Nom de fichier** en minuscules, avec des tirets, sans accents ni symboles : `colis-17-accord-parfait.jpg` plutôt que `Colis n°17 L'ACCORD PARFAIT.jpg`.
- Une fois l'extension Converter for Media installée, le site convertit automatiquement les images en WebP, mais il ne réduit pas leurs dimensions : une image trop grande reste trop lourde.

## Insérer l'image dans Elementor

- Le réglage « Taille de l'image » décide du fichier envoyé au visiteur : choisir la plus petite taille qui reste nette à l'écran.
- **Widget Image :** « Taille de l'image » sur **Grande** (1024 px) ou **Moyenne-grande** (768 px), jamais **Complète** pour une image affichée en petit. Aujourd'hui, les photos des boutiques en page d'accueil sont en Complète (jusqu'à 2048 px) pour des cartes d'environ 400 px de large.
- **Bannière du haut de page : un widget Image plutôt qu'une image d'arrière-plan de conteneur.** Le navigateur trouve une image d'arrière-plan très tard, ce qui explique en grande partie les 13 secondes d'affichage de la bannière d'accueil. Le premier changement se fait avec le développeur.
- **Si un arrière-plan est indispensable**, définir une image dédiée au mobile : passer en mode **Mobile** (icône d'appareil dans la barre du haut de l'éditeur, ou à côté du réglage), puis choisir une image de 900 px de large dans Style → Arrière-plan.

## Le premier écran

- Ce qui s'affiche avant de faire défiler doit apparaître tout de suite : c'est sur cette partie que Google mesure la vitesse du site.
- **Pas d'animation d'entrée** (Avancé → Effets de mouvement → Animation d'entrée) sur la bannière, le titre ou le premier bloc : l'élément reste invisible jusqu'à la fin du chargement. Ailleurs dans la page, avec modération.
- **Pas de carrousel ni de vidéo** comme premier élément : une seule image fixe.
- **Pas de popup à l'ouverture de la page.** Dans les conditions de déclenchement d'une popup Elementor, préférer « Au défilement » ou « Intention de sortie » à « Au chargement de la page ».
- **Pas de bandeau ajouté au-dessus du contenu après coup** (annonce, code promo) : il pousse la page vers le bas pendant la lecture. Un bandeau doit faire partie du modèle d'en-tête, avec une hauteur fixe.

## Vidéos, carrousels et contenus externes

- Chaque vidéo, carrousel ou contenu intégré ajoute des fichiers à télécharger, même si le visiteur ne le regarde pas.
- **Vidéo YouTube :** garder « Chargement différé » activé et préférer une « Superposition d'image » à la lecture automatique : le lecteur YouTube (environ 1 Mo) ne se charge alors qu'au clic. La vidéo de la page d'accueil est aujourd'hui en lecture automatique, en boucle.
- **Pas de vidéo en arrière-plan** de section, et pas de fichier vidéo (MP4) importé dans la médiathèque : passer par YouTube.
- **Carrousels : 8 éléments maximum**, et pas plus de deux par page. Les images des diapositives sont téléchargées même si elles ne sont pas visibles. La page d'accueil compte 4 carrousels et 21 diapositives. Pour un catalogue plus long, une grille courte avec un bouton « Voir tout » est plus légère.
- **Pas de carte Google Maps intégrée** : une capture de la carte avec un lien « Itinéraire » vers Google Maps suffit, sans les scripts lourds d'une carte intégrée.
- **Pas de code collé dans un widget HTML ou dans Elementor → Code personnalisé** (pixel publicitaire, widget d'avis, chat) : demander au développeur. Les scripts de suivi déjà présents pèsent 1 Mo, et l'un d'eux est déjà chargé deux fois.

## Construire une page sans l'alourdir

- Une page plus simple s'affiche plus vite : la page d'accueil compte déjà environ 390 éléments Elementor.
- **Ne pas dupliquer un bloc en « version mobile » et « version ordinateur »** avec Avancé → Responsive → Masquer. Un bloc masqué est quand même téléchargé, images comprises. Régler plutôt les tailles, marges et alignements du même bloc en mode Mobile. La page d'accueil a 16 blocs masqués selon l'appareil.
- **Pas de conteneur vide ni de widget « Espaceur » pour créer de l'espace** : utiliser les marges, les espacements intérieurs ou l'écart (« Gap ») du conteneur.
- **Polices et couleurs : utiliser les réglages globaux du site** (Playfair Display et Fjalla One). Ne pas choisir une autre police dans un widget : chaque nouvelle police ajoute des fichiers à télécharger sur toutes les pages qui l'utilisent.
- **Rester sur les widgets Elementor existants.** Ne pas activer de nouvelle extension ni de nouveau pack de widgets sans validation : celui déjà installé (Ultimate Addons) charge 82 Ko de styles sur chaque page, dont 99 % inutilisés.
- **Réutiliser les modèles existants** (en-tête, pied de page, cartes produits) plutôt que de recréer un bloc à l'identique.

## Après publication

- Vérifier chaque grosse modification (nouvelle bannière, nouvelle section, nouvelle page) sur téléphone et avec PageSpeed.
- **Cache :** la page modifiée est mise à jour automatiquement. Si le changement n'apparaît pas, cliquer sur WP Rocket → « Vider le cache » dans la barre du haut. Ne pas vider tout le cache après chaque petite modification : le site est plus lent le temps qu'il se reconstruise.
- **Mise en page cassée :** Elementor → Outils → « Régénérer les fichiers et les données », puis vider le cache WP Rocket.
- **Contrôle visuel :** ouvrir la page sur un vrai téléphone, en navigation privée.
- **Mesure :** sur [PageSpeed Insights](https://pagespeed.web.dev), onglet Mobile, lancer le test deux ou trois fois avant et après la modification ; le score varie d'environ 10 points d'un test à l'autre. Regarder surtout « Largest Contentful Paint », le temps d'affichage du plus grand élément visible.
- **Alerter le développeur** si le score baisse de plus de 15 points ou si le Largest Contentful Paint augmente de plus d'une seconde.

## À laisser au développeur

- Ces réglages touchent tout le site : une erreur peut casser l'affichage, le panier ou le suivi des ventes.
- Les réglages de WP Rocket (sauf « Vider le cache »).
- Les réglages de Converter for Media et d'Imagify.
- Elementor → Réglages → Fonctionnalités.
- L'installation, la mise à jour ou la suppression d'extensions.
- Tout code, script ou balise de suivi (Google, Meta, Brevo, avis clients).
