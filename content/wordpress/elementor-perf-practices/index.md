# Elementor : garder un site rapide

Règles pour modifier un site Elementor sans le ralentir.

- La vitesse d'un site Elementor dépend en partie de réglages techniques (cache, serveur, extensions), en partie de la façon dont les pages sont construites. Ces règles couvrent la seconde partie.
- Les images, les animations, les carrousels et les scripts externes sont les causes de lenteur les plus fréquentes côté édition.

## Préparer une image avant de l'importer

- Redimensionner et compresser chaque image avant de l'importer : les images représentent souvent la moitié du poids d'une page.
- Tailles et poids maximum :
  - Bannière pleine largeur (ordinateur) : 1920 px de large, 200 Ko, JPEG ou WebP.
  - Bannière version mobile : 900 px de large, 80 Ko, JPEG ou WebP.
  - Photo produit : 1200 px de large, 150 Ko, JPEG ou WebP.
  - Photo dans un bloc ou une carte (boutique, article) : 1200 px de large, 150 Ko, JPEG ou WebP.
  - Logo, pictogramme : 20 Ko, SVG (ou PNG si l'image a de la transparence).
- **Jamais de photo en PNG** : le PNG sert aux logos et aux images transparentes. Une photo en PNG pèse couramment dix fois plus que la même photo en WebP.
- **Compresser avec [Squoosh](https://squoosh.app)** (gratuit, dans le navigateur) : régler la largeur, choisir WebP ou MozJPEG, qualité 75 à 80.
- **Depuis Canva ou un outil similaire**, télécharger en JPG à la bonne taille plutôt qu'en PNG ou en taille maximale. Un export en taille maximale pèse facilement plusieurs centaines de Ko pour un bandeau affiché sur 300 px de haut sur mobile.
- **Nom de fichier** en minuscules, avec des tirets, sans accents ni symboles : `produit-coffret-cadeau.jpg` plutôt que `Coffret n°2 CADEAU été.jpg`.
- Une extension de conversion WebP convertit automatiquement les images, mais ne réduit pas leurs dimensions : une image trop grande reste trop lourde.

## Insérer l'image dans Elementor

- Le réglage « Taille de l'image » décide du fichier envoyé au visiteur : choisir la plus petite taille qui reste nette à l'écran.
- **Widget Image :** « Taille de l'image » sur **Grande** (1024 px) ou **Moyenne-grande** (768 px), jamais **Complète** pour une image affichée en petit. Erreur fréquente : des images en Complète (jusqu'à 2048 px ou plus) dans des cartes d'environ 400 px de large.
- **Bannière du haut de page : un widget Image plutôt qu'une image d'arrière-plan de conteneur.** Le navigateur découvre une image d'arrière-plan très tard, ce qui retarde souvent de plusieurs secondes l'affichage de la bannière sur mobile. Faire le premier changement avec le développeur.
- **Si un arrière-plan est indispensable**, définir une image dédiée au mobile : passer en mode **Mobile** (icône d'appareil dans la barre du haut de l'éditeur, ou à côté du réglage), puis choisir une image de 900 px de large dans Style → Arrière-plan.

## Le premier écran

- Ce qui s'affiche avant de faire défiler doit apparaître tout de suite : c'est sur cette partie que Google mesure la vitesse du site.
- **Pas d'animation d'entrée** (Avancé → Effets de mouvement → Animation d'entrée) sur la bannière, le titre ou le premier bloc : l'élément reste invisible jusqu'à la fin du chargement. Ailleurs dans la page, avec modération.
- **Pas de carrousel ni de vidéo** comme premier élément : une seule image fixe.
- **Pas de popup à l'ouverture de la page.** Dans les conditions de déclenchement d'une popup Elementor, préférer « Au défilement » ou « Intention de sortie » à « Au chargement de la page ».
- **Pas de bandeau ajouté au-dessus du contenu après coup** (annonce, code promo) : il pousse la page vers le bas pendant la lecture. Un bandeau doit faire partie du modèle d'en-tête, avec une hauteur fixe.

## Vidéos, carrousels et contenus externes

- Chaque vidéo, carrousel ou contenu intégré ajoute des fichiers à télécharger, même si le visiteur ne le regarde pas.
- **Vidéo YouTube :** garder « Chargement différé » activé et préférer une « Superposition d'image » à la lecture automatique : le lecteur YouTube (environ 1 Mo) ne se charge alors qu'au clic. Éviter la lecture automatique en boucle.
- **Pas de vidéo en arrière-plan** de section, et pas de fichier vidéo (MP4) importé dans la médiathèque : passer par YouTube.
- **Carrousels : 8 éléments maximum**, et pas plus de deux par page. Les images des diapositives sont téléchargées même si elles ne sont pas visibles. Pour un catalogue plus long, une grille courte avec un bouton « Voir tout » est plus légère.
- **Pas de carte Google Maps intégrée** : une capture de la carte avec un lien « Itinéraire » vers Google Maps suffit, sans les scripts lourds d'une carte intégrée.
- **Pas de code collé dans un widget HTML ou dans Elementor → Code personnalisé** (pixel publicitaire, widget d'avis, chat) : demander au développeur. Les scripts de suivi pèsent souvent plus que le reste de la page, et un même script se retrouve facilement chargé deux fois.

## Construire une page sans l'alourdir

- Une page plus simple s'affiche plus vite : chaque conteneur et chaque widget ajoute du code à charger, et une page de plusieurs centaines d'éléments devient lourde.
- **Ne pas dupliquer un bloc en « version mobile » et « version ordinateur »** avec Avancé → Responsive → Masquer. Un bloc masqué est quand même téléchargé, images comprises. Régler plutôt les tailles, marges et alignements du même bloc en mode Mobile.
- **Pas de conteneur vide ni de widget « Espaceur » pour créer de l'espace** : utiliser les marges, les espacements intérieurs ou l'écart (« Gap ») du conteneur.
- **Polices et couleurs : utiliser les réglages globaux du site** (Réglages du site → Typographie globale et Couleurs globales). Ne pas choisir une autre police dans un widget : chaque nouvelle police ajoute des fichiers à télécharger sur toutes les pages qui l'utilisent.
- **Rester sur les widgets Elementor existants.** Ne pas activer de nouvelle extension ni de nouveau pack de widgets sans validation : la plupart des packs chargent leurs styles et scripts sur chaque page, même quand leurs widgets n'y sont pas utilisés.
- **Réutiliser les modèles existants** (en-tête, pied de page, cartes produits) plutôt que de recréer un bloc à l'identique.

## Après publication

- Vérifier chaque grosse modification (nouvelle bannière, nouvelle section, nouvelle page) sur téléphone et avec PageSpeed.
- **Cache :** si le site utilise une extension de cache (WP Rocket, LiteSpeed Cache, W3 Total Cache…), la page modifiée est en général mise à jour automatiquement. Si le changement n'apparaît pas, vider le cache depuis la barre d'administration. Ne pas vider tout le cache après chaque petite modification : le site est plus lent le temps qu'il se reconstruise.
- **Mise en page cassée :** Elementor → Outils → « Régénérer les fichiers et les données », puis vider le cache.
- **Contrôle visuel :** ouvrir la page sur un vrai téléphone, en navigation privée.
- **Mesure :** sur [PageSpeed Insights](https://pagespeed.web.dev), onglet Mobile, lancer le test deux ou trois fois avant et après la modification ; le score varie d'environ 10 points d'un test à l'autre. Regarder surtout « Largest Contentful Paint », le temps d'affichage du plus grand élément visible.
- **Alerter le développeur** si le score baisse de plus de 15 points ou si le Largest Contentful Paint augmente de plus d'une seconde.

## À laisser au développeur

- Ces réglages touchent tout le site : une erreur peut casser l'affichage, le panier ou le suivi des ventes.
- Les réglages de l'extension de cache (sauf « Vider le cache »).
- Les réglages des extensions d'optimisation et de conversion d'images.
- Elementor → Réglages → Fonctionnalités.
- L'installation, la mise à jour ou la suppression d'extensions.
- Tout code, script ou balise de suivi (analytics, pixels publicitaires, emailing, avis clients, chat).