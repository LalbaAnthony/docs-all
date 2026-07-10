# Checklist Upgrade PHP

Ce fichier à pour but d'être une procedure linéaire à suivre pour un projet type.
Moins difficile à lire que [Documentation pour upgrade PHP](documentation_upgrade_php.md) qui est assez lourde.
Hésitez pas à la dupliquer pour chaque projet et à l'adapter à votre besoin, ou a l'enrichir sur ce repo.

## Prérequis

Si l'upgrade PHP implique un changement de serveur:
- [ ] Déplacer le projet sur le nouveau serveur, penser a mettre à jour la branch `master` sur le git au passage
- [ ] Installer les paquets nécessaires: `sudo apt install php-curl`, `sudo apt install php-mbstring`, etc. 
- [ ] Déplacer le(s) SSL ou les renouveler
- [ ] Déplacer et adapter les vhosts d'Apache: `/etc/apache2/sites-available/` 
- [ ] Déplacer la base de données
- [ ] Si besoin, créer un utilisateur pour la base de données: `CREATE USER 'mon-utilisateur'@'localhost' IDENTIFIED BY 'mon-mdp';`
- [ ] Modifier les droits de l'utilisateur: `GRANT ALL PRIVILEGES ON ma-bdd.* TO 'mon-utilisateur'@'localhost';`
- [ ] Utiliser le nouvel utilisateur pour la base de données dans le fichier `config/db.inc.php`
- [ ] Déplacer les CRONs: `crontab -e`.
- [ ] Copier la configuration PHP (`php.ini`) de l'ancien serveur vers le nouveau, et adapter si besoin. Sinon des soucis peuvent arriver: upload limité à 2M par défaut, etc.

> [!IMPORTANT]
> Pour les crons, pensez à vérifier tout les utilisateurs du serveur !

## Upgrade PHP

- [ ] Activer les `short_open_tag` dans le `php.ini` si besoin, ou modifier le code pour utiliser `<?php` au lieu de `<?`
- [ ] Placer dans le fichier `config/config.inc.php` le code PHP permettant d'afficher les erreurs: `ini_set('display_errors', 1); // ...`
- [ ] Récupérer la version actuelle du projet depuis le serveur et la mettre sur le git
- [ ] Pour gagner du temps, vous pouvez vous rendre dans la section [Les erreurs courantes](documentation_upgrade_php.md#les-erreurs-courantes) de [Documentation pour upgrade PHP](documentation_upgrade_php.md)
- [ ] Vous pouvez aussi installer [Rector](https://getrector.com/) avec [Cheat Sheet Rector](cheat-sheet_rector.md)
- [ ] Tester et débuger le FRONT
- [ ] Tester et débuger le BO
- [ ] Tester AVGC:
  - [ ] Aller sur `https://www.mon-projet.fr/lib/avgc/index.php`
- [ ] Tester AVMEDIA:
  - [ ] Aller sur `https://www.mon-projet.fr/lib/avmedias/index.php`
  - [ ] Modifier les droits du dossier `uploads/` pour que le serveur puisse écrire dedans:
    - `chmod -R 775 uploads/ && chown -R www-data:www-data uploads/`
- [ ] Tester et débuger les CRONs 

## C'est presque fini !

- [ ] Retirer les itérations de code PHP permettant d'afficher les erreurs: `ini_set('display_errors', 1); // ...`
- [ ] Basculer le `ON_LINE` sur `true`
- [ ] Supprimez le fichier `adminer.php`, si vous l'utilisez
- [ ] Pensez à restaurer l'ancienne version de la méthode `debug()` dans `agoravita/classes/class.sql-pdo.php` si vous l'avez modifié pour le debug
- [ ] Pensez à restaurer l'ancienne version du `.htaccess` de la prod si vous l'avez modifié pour le debug
- [ ] Déplacer `uploads/` qui contient les images, documents, etc. Pensez aussi à verifier les droits du dossier: `chmod -R 775 uploads/ && chown -R www-data:www-data uploads/`
- [ ] Ré-importer la base de données: `mysqldump -u mon-utilisateur -p ma-bdd | gzip > mon-projet.sql.gz`, puis `gunzip < mon-projet.sql.gz | mysql -u mon-utilisateur -p ma-bdd`.


> [!IMPORTANT]
> Si vous ré-importez la base de données, pensez à: soit ne déplacer que les données, soit rejouer les ordres SQL de mise a jour de la structure de la base de données nécessaires pour la nouvelle version de PHP.