# Documentation Upgrade PHP

## Installation en dev

#### Installation de la nouvelle version de PHP 

Vérifier d'abord quelles versions de PHP sont installées:
```sh
ls /etc/php
```

Récupération de la clé du répo:
```sh
curl -sSLo /tmp/debsuryorg-archive-keyring.deb https://packages.sury.org/debsuryorg-archive-keyring.deb
```
 
Install:
```sh
dpkg -i /tmp/debsuryorg-archive-keyring.deb
```

MAJ du fichier de sources avec la nouvelle entrée:
```sh
sh -c 'echo "deb [signed-by=/usr/share/keyrings/deb.sury.org-php.gpg] https://packages.sury.org/php/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/php.list'
```

Mettre à jour les paquets:
```sh
apt-get update
```

Installation de PHP: 
```sh
sudo apt-get install php8.3-fpm
```

Si besoin, installation de modules PHP:
```sh
sudo apt-get install php8.3-curl
sudo apt-get install php8.3-mysql
sudo apt-get install php8.3-gd
# ...
```
...etc

Relancer le service PHP:
```sh
sudo systemctl restart php8.3-fpm
```

Relancer le service apache:
```sh
sudo systemctl restart apache2
```

Si en dev, créer les fichier de apache pour cette version de PHP:
```sh
sudo nano /etc/apache2/sites-available/dev8.3.conf
```

Exemple de configuration pour le fichier `dev8.3.conf`, sur le serveur de dev `192.168.10.137`:
```apache
<VirtualHost *:80>
        ServerName 192.168.10.137
        ServerAlias *.php83

        ServerAdmin webmaster@localhost
        VirtualDocumentRoot /var/www/%2/%1

        #RewriteEngine On

        DirectoryIndex index.php

        <Directory /var/www/*>
            Allowoverride All
            Options -Indexes +FollowSymLinks
        </Directory>

        <FilesMatch \.php$>
                # For Apache version 2.4.10 and above, use SetHandler to run PHP as a fastCGI process s>
                SetHandler "proxy:unix:/run/php/php8.3-fpm.sock|fcgi://localhost"
        </FilesMatch>

        # enable HTTP/2, if available
        Protocols h2 http/1.1
        ProtocolsHonorOrder On

        # HTTP Strict Transport Security (mod_headers is required) (63072000 seconds)
        # Scan Header https://securityheaders.com/
        <IfModule mod_headers.c>
             Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
             Header always set X-Frame-Options "SAMEORIGIN"
             Header always set X-Xss-Protection "1; mode=block"
             Header always set X-Content-Type-Options "nosniff"
             Header set Cache-Control "max-age=290304000, public"
        </IfModule>

        # Available loglevels: trace8, ..., trace1, debug, info, notice, warn,
        # error, crit, alert, emerg.
        # It is also possible to configure the loglevel for particular
        # modules, e.g.
        #LogLevel info ssl:warn
        LogLevel debug
        ErrorLog ${APACHE_LOG_DIR}/error.log
        CustomLog ${APACHE_LOG_DIR}/access.log combined

        # For most configuration files from conf-available/, which are
        # enabled or disabled at a global level, it is possible to
        # include a line for only one particular virtual host. For example the
        # following line enables the CGI configuration for this host only
        # after it has been globally disabled with "a2disconf".
        #Include conf-available/serve-cgi-bin.conf
</VirtualHost>
```

Activer le fichier de configuration:
```sh
sudo a2ensite dev8.3.conf
```

L'URL du projet sera ainsi `http://NOM_PROJET.NOM_DOSSIER.phpVERSION/`. Exemple pour le projet `lte-icom` dans le dossier `alalba`, en version de PHP 8.3 : `http://lte-icom.alalba.php83/`

Dans certain trèèèès vieux projets, il peut être nécessaire d'activer les `short_open_tag` dans le `php.ini`:
```sh
sudo nano /etc/php/8.3/fpm/php.ini
# Modifier la ligne suivante: short_open_tag = On

sudo systemctl restart php8.3-fpm
sudo systemctl restart apache2
```

#### Installation du projet

En dev, les projets seront à placer dans le dossier `/var/www/USER` et dans un sous-dossier correspondant au nom du projet. Example pour le projet `lte-icom` de l'utilisateur `alalba` : `/var/www/alalba/lte-icom/`

##### Base de donnée

Exporter la BDD:
- Se connecter en SSH
- Faire `mysqldump -u USER -p NOM_BDD | gzip > NOM_BDD.sql.gz`, exemple: `mysqldump -u agora -p prod_eole | gzip > prod_eole.sql.gz`
- ou
- Se connecter à PHPMyAdmin > Sélectionner la base de donnée > `Exporter` > Sélectionner `Personnalisée, afficher toutes les options possibles` > Séléctionnee `gzip` dans compression, puis `Executer`

Importer la BDD:
- Déplacer le fichier `NOM_BDD.sql.gz` sur le serveur
- Se connecter en SSH
- Faire `gunzip < NOM_BDD.sql.gz | mysql -u USER -p NOM_BDD`, exemple: `gunzip < prod_eole.sql.gz | mysql -u agora -p eole`
- ou
- Se connecter à PHPMyAdmin et importer la base de donnée: Sélectionner la base de donnée > `Importer` > Sélectionner le fichier `NOM_BDD.sql.gz` > `Executer`

> NOTE: l'import depuis PHPMyAdmin peut être limité à 2Mo.

Créez un utilisateur pour la base de donnée:
```sql
CREATE USER 'USER'@'localhost' IDENTIFIED BY 'PASSWORD';
GRANT ALL PRIVILEGES ON BASE.* TO 'USER
FLUSH PRIVILEGES;
```
Exemple pour l'utilisateur `lte_icom_user` et la base de donnée `lte_icom`:
```sql
CREATE USER 'lte_icom_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON lte_icom.* TO 'lte_icom_user'@'localhost';
FLUSH PRIVILEGES;
```

## Migration du code PHP

### Outils

Vous pouvez installer [Rector](https://getrector.com/) avec [Cheat Sheet Rector](cheat-sheet_rector.md) pour automatiser une partie de la migration du code PHP, notamment pour les évolutions de syntaxe et les suppressions de code mort.
Cela ne remplacera **JAMAIS** une revue de code manuelle, mais ça peut faire gagner du temps.

### Afficher les erreurs PHP

Il est nécessaire de parcourir l'ensemble du projet, aussi bien dans le BO que dans le FO, pour vérifier que tout fonctionne correctement.
Penser à aussi bien vérifier les `lib/avmedia` et `lib/avgc` qui sont souvent niché derrère de nombreux cliques.

Mettre ce code dans le fichier de config principale erreurs (ne pas oublier de le retirer après).
```php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
```

Il est aussi possible de récupérer les erreurs PHP à un endroit précis du code en utilisant la fonction `error_get_last()`:
```php
error_log(print_r(error_get_last(), true));
```

Dans certains cas, il pourra être nécessaire de modifier l'appel à certaines fonctions PHP:
```php
// ? Le `@` devant une fonction permet de masquer les erreurs, ce qui peut être problématique lors du débuggage.
@my_function() // à remplacer par
my_function()
```

### Les erreurs courantes

Certaines fonctions ont été dépréciées et/ou n'existe plus, il faut les remplacer/supprimer

#### Magic quotes

Faire une recherche de `get_magic_quotes_gpc()` dans tout le projet et remplacer les itérations par `false`.

#### Accès valeurs tableaux

Accès au valeur dans les tableau: `$my_array['key']` au lieu de `$my_array{key}`.

Regex pour trouver ces itérations: `\$[A-Za-z_\x80-\xff][A-Za-z0-9_\x80-\xff]*(?:->\w+|\[[^\]]+\])*\s*\{[^}]+\}`

C'est notamment le cas dans les fichiers:
- `agoravita/classes/class.doc.php`
- `agoravita/classes/class.image.php`

#### Constructeurs de classes

- Les constructeurs de classe doivent être changés pour `__construct()` au lieu de `CLASS_NAME()`. Les classses principalement concernées sont celles de `agoravita/classes/*`.

Remplacer
```php
ini_set('mbstring.internal_encoding', 'UTF-8');
```
par
```php
mb_internal_encoding('UTF-8');
```

#### Autoload

La fonction `__autoload` est dépréciée depuis PHP 7.2, il faut la remplacer par `spl_autoload_register`:
```php
function __autoload($class_name) {
    require_once $class_name . '.php';
}
```
devient
```php
spl_autoload_register(function ($class_name) {
    require_once $class_name . '.php';
});
```

#### Libs

La librairie lib/mpdf est dépréciée, il faut la remplacer par `mpdf/mpdf`:
```php
require(PATH.'lib/mpdf/mpdf.php');
$mpdf = new mPDF('', '', 7, 'Arial', 0, 0, 0, 0, 0, 0);
// ...
``` 
est à remplacer par
```php
// ! Make sure run `composer require mpdf/mpdf` before
require(PATH  .'vendor/autoload.php');
use Mpdf\Mpdf;

ini_set('pcre.backtrack_limit', '10000000'); // ? Increase the backtrack limit to avoid the "pcre.backtrack_limit" error
$mpdf = new Mpdf([
    'tempDir' => '/tmp/mpdf',
    '', '', 7, 'Arial', 0, 0, 0, 0, 0, 0
]);
// ...
```
D'autres librairies peuvent être dépréciées, il faudra les remplacer par des versions plus récentes avec la même méthode.

#### SQL

Depuis PHP 7 et PHP 8, les fonctions `mysql_*` sont dépréciées et ne sont plus supportées. Il faut les remplacer par `mysqli_*` ou `PDO`:

La fonction `mysql_pconnect` de `agoravita/classes/class.sql-mysql.php` est à remplacer par `mysqli_connect`:
```php
$this->connexion = mysql_pconnect($this->serveur, $this->utilisateur, $this->mot_de_passe);
```
devient
```php
$this->connexion = mysqli_connect($this->serveur, $this->utilisateur, $this->mot_de_passe);
```

#### Fonctions

Types et qualité des retours et paramètres de fonctions:
- La fonction `getResultat()` de `agoravita/classes/class.sql-pdo.php` est à remplacer par une version prenant en compte des retours vide:
    ```php
        public function getResultat()
        {
            $resultat = $this->result->fetch(PDO::FETCH_BOTH);
            if (is_array($resultat) && isset($resultat[0])) {
                $this->un_resultat = $resultat[0];
            } else {
                $this->un_resultat = null;
            }
            return $this->un_resultat;
        }
    ```	
- Dans la fonction `decoupeTexte()` de `agoravita/fonctions/general.fct.php`, remplacer
    ```php
    $iLen = mb_strlen( $sChaine);
    ```	
    par 
    ```php
        $iLen = 0;

        if ($sChaine) {
            $iLen = mb_strlen( $sChaine);
        }
    ```
- Dans la fonction `nettoie()` de `agoravita/fonctions/general.fct.php`, ajouter ceci au tout début de la fonction:
    ```php
    if ($texte == null || $texte == '') {
            return '';
    }
    ```
- Dans la fonction `dateFRtoUS()` de `agoravita/fonctions/general.fct.php`, ajouter ceci au tout début de la fonction:
    ```php
    if (!$dateFR) return false;

    if ($dateFR == '00/00/0000' || $dateFR == '00-00-0000') {
        return '0000-00-00';
    }
    ```
- Dans la fonction `dateUStoFR()` de `agoravita/fonctions/general.fct.php`, ajouter ceci au tout début de la fonction:
    ```php
    if (!$dateUS) return false;

    if ($dateUS == '0000-00-00' || $dateUS == '0000/00/00') {
        return '00/00/0000';
    }
    ```
- Dans la fonction `convertUrl()` de `agoravita/fonctions/general.fct.php`, ajouter ceci au tout début de la fonction:
    ```php
    if (!$sChaine) {
        return '';
    }
    ```
- Dans la fonction `getUrl()` de `agoravita/fonctions/general.fct.php`, remplacer `if(!is_array($val) ){` par `if( $val && !is_array($val) ){`

#### Affichages image BO

Trouver tout les bouts de code ressemblant à ceci:
```php
$sizes        = getimagesize($file_path.$file_name);
$img_w        = $sizes[0];
$img_h        = $sizes[1];
$img_ratio    = floor(($sizes[1] / $sizes[0])*100);
```
et le remplacer par:
```php
$sizes        = file_exists($file_path.$file_name) ? getimagesize($file_path.$file_name) : [1, 1];
$img_w        = $sizes[0] ?? 1;
$img_h        = $sizes[1] ?? 1;
$img_ratio    = floor(($img_h / $img_w)*100);
```

#### null sur les méthodes

À partir de PHP 8.1, il est déprécié de déclarer un paramètre typé avec une valeur par défaut `null` sans indiquer explicitement qu'il est nullable.

Exemple problématique :
```php 
public function __construct(array $headers = null) { /* ... */ }
```	

Il faut indiquer explicitement que le type peut être null en ajoutant le préfixe `?` : 
```php 
public function __construct(?array $headers = null) { /* ... */ }
```	

Regex pour trouver ces itérations: `function\s+\w+\s*\([^)]*?\b([A-Za-z_\\][A-Za-z0-9_\\]*)\s+\$[A-Za-z_][A-Za-z0-9_]*\s*=\s*null`

En PHP 8+, `number_format()` ne doit pas recevoir null. Il faut s'assurer que les valeurs sont initialisées avant de les passer à la fonction, sinon on aura l'erreur suivante : `Deprecated: number_format(): Passing null to parameter #1 ($num) of type float is deprecated`. On remplce toutes les itération de `number_format($variable)` par `number_format($variable ?? 0)`

PHP 8+ est strict sur le nombre d'arguments pour `sprintf()`. Avant PHP 8, un argument manquant pouvait être remplacé par une chaîne vide silencieusement, mais maintenant cela provoque une erreur fatale.

En PHP 8.1+, `mb_strtolower()` ne doit pas recevoir `null`. Il faut s’assurer que la variable est une chaîne avant appel. Exemple sécurisé :
```php
mb_strtolower($maVariable ?? '');
```  
Sinon, on aura l’erreur suivante :
`Deprecated: mb_strtolower(): Passing null to parameter #1 ($string) of type string is deprecated`

#### Paramètres optionnels

Depuis PHP 8.0, il est interdit de déclarer un paramètre optionnel avant un paramètre obligatoire dans une fonction.
Fonction concernée :
```php 
function saveImageJpg($files,$nom_save,$dir_grande,$dir_petite='',$max_w,$max_h,$min_w,$min_h) { /* ... */ }
```	
Il faut Déplacer le paramètre optionnel à la fin : 
```php 
function saveImageJpg($files,$nom_save,$dir_grande,$max_w,$max_h,$min_w,$min_h,$dir_petite='') { /* ... */ }
```	

Puis vérifier en suite tous les appels à la fonction dans le projet (l'ordre des arguments doit correspondre à la nouvelle signature.) 

Regex pour trouver ces itérations: `function\s+\w+\s*\([^)]*\$\w+\s*=\s*[^,)]+,\s*\$\w+(?:\s*,|\s*\))`

#### Fonctions image*

Dans `apps/interdadm/modules/recadrage-photo/recadrage/action.inc.php`, remplacer:
- `$cropimg = imagecreatetruecolor($cropW,$cropH);` par `$cropimg = imagecreatetruecolor((int)$cropW,(int)$cropH);`
- `imagecopyresampled($cropimg, $origimg, 0, 0, $cropStartX, $cropStartY, $width, $height, $width, $height);` par `imagecopyresampled($cropimg, $origimg, 0, 0, (int)$cropStartX, (int)$cropStartY, (int)$width, (int)$height, (int)$width, (int)$height);`

#### Lecture d'emplacement vide de tableaux

Pour retirer les warnings de type `Undefined array key`, il faut vérifier que les clés de tableaux existent avant de les utiliser.

C'est notamment le cas dans les fichiers:
- `lib/avgc/module.fct.php` ligne `333`
- `lib/avgc/module.fct.php` ligne `415`

On remplace:
```php
$aSizeFile  = @getimagesize($sPathfile);
$iWidth     = $aSizeFile[0];
$iHeight    = $aSizeFile[1];
```
par
```php
$aSizeFile  = @getimagesize($sPathfile);
$iWidth     = isset($aSizeFile[0]) ? $aSizeFile[0] : 0;
$iHeight    = isset($aSizeFile[1]) ? $aSizeFile[1] : 0;
```

#### Bugs AVGC

Dans `lib/avgc/back.fct.php`, rajoutez un `isset($sFonction)` avant d'appeler la fonction de template:
```php
// récupérations du contenus
if (isset($sFonction)) {

    if (!function_exists($sFonction)) {
        die('@TODO Erreur fonction template  [' . $sFonction . '] inexistant');
    }
    if (!function_exists($sTemplate)) {
        $sTemplate = false;
    }

    return $sFonction($aData, $aModule, $sTemplate);
}
```

#### Bugs AVmedias

Remplacez `if(!$id_rep){ $id_rep = 'all'; }` de `lib/avmedias/index.php` par `if(!$id_rep){ $id_rep = '0'; }`

## Migration de la base de donnée SQL 

Même chose que pour la migration du code PHP, il est nécessaire de faire jouer toutes les requêtes SQL du projet pour vérifier que tout fonctionne correctement.

### Afficher les erreurs SQL

Pour remonter les erreurs SQL, il faut modifier le fichier de configuration de la base de donnée pour afficher les erreurs SQL.

Remplacer la fonction `debug` de `agoravita/classes/class.sql-pdo.php`
```php
    protected function debug($sQuery = '')
    {
        if ($sQuery) $this->query = $sQuery;

        echo (ON_LINE) ? 'Erreur SQL - detail des requetes indisponible' : $this->query;
    }
```
par
```php
    protected function debug($sQuery = '')
    {
        if ($sQuery) $this->query = $sQuery;

        // echo (ON_LINE) ? 'Erreur SQL - detail des requetes indisponible' : $this->query;
        echo 'Erreur SQL: ' . $this->query;
    }
```

OU 

Basculer le mode `ON_LINE` à `false` dans le fichier de configuration `config/config.inc.php`

### Résoudre les erreurs SQL

Lors d'une migration de version de PHP, dans la majorité des cas, la base de donnée changera aussi.
Des comportement basé sur la tolérance d'anciennes version de PHP ne seront plus acceptées par les nouvelles versions de MySQL.

Ainsi, certains points doivent être vérifiés:
- Certains champs de type `NOT NULL` devront être modifiés pour accepter une valeur par défaut (ex: `DEFAULT NULL`, `DEFAULT 0`, `DEFAULT ''`)
- Les clés primaires et étrangeres peuvent devoir être modifiées spécifié explicitement dans la création de la nouvelle base de données
- Les valeurs de strings vident ne sont plus acceptées dans les champs `AUTO_INCREMENT`: `INSERT INTO table (id, valeur) VALUES ('', 'Salut salut')` devient `INSERT INTO table (id, valeur) VALUES (NULL, 'Salut salut')`

## Mise en production

### DNS

Avant toute chose, si le serveur de production accueillant la nouvelle version du site diffère du serveur de prod actuel, et qu'aucun DNS n'est encore mise en place, il vous vous faudra contourner le DNS pour accéder au nouveau site/serveur de prod avec la même URL.

Pour cela, il vous faudra modifier le fichier `hosts` de votre machine pour rediriger l'URL du site vers l'IP du nouveau serveur.

Allez dans `C:\Windows\System32\drivers\etc\hosts` et ajoutez la ligne suivante:
```txt
IP NOM_DOMAINE_SITE www.NOM_DOMAINE_SITE
```

Exemple:
```txt
185.139.21.163 cabinet-sanchez.fr www.cabinet-sanchez.fr
```

## Installation de PHP sur le serveur de prod

Example avec PHP 8.4, où PHP 8.5 et PHP 8.3 sont aussi installés sur le serveur de prod, mais ne sont pas utilisés pour le projet.

```sh
su root

# 1. Désactiver tout ce qui peut conflicter
a2dismod php8.4 php8.5 php8.3 php mpm_prefork mpm_worker 2>/dev/null; true

# 2. Activer mpm_event + modules proxy pour FPM
a2enmod mpm_event proxy proxy_fcgi setenvif

# 3. Installer php8.4-fpm
apt install php8.4-fpm -y

# 4. Démarrer et activer php8.4-fpm
systemctl enable php8.4-fpm
systemctl start php8.4-fpm

# 5. Désactiver les autres confs fpm si présentes
a2disconf php8.5-fpm php8.3-fpm 2>/dev/null; true

# 6. Activer la conf php8.4-fpm
a2enconf php8.4-fpm

# 7. Restart Apache
systemctl restart apache2

# 8. Vérification
apache2ctl -M | grep -E 'php|proxy_fcgi|mpm'
systemctl is-active php8.4-fpm
curl -s http://localhost | head -5
```

### Téléchargement du projet

D'abord, accorder les droits d'accès au projet:
```sh
su root
chown deploy:www-data -R /var/www/html/NOM_PROJET/
```

Ensuite, récurpérer le code du projet en local depuis GIT, puis téléverser le code sur le serveur de prod (en SFTP, ...). Le projet doit être placé dans le dossier `/var/www/html/NOM_PROJET/`.

### Uploads

```sh
su root
rm -rf /var/www/html/NOM_PROJET/uploads # Will be replaced by the uploads of the old prod
scp -r adminagora@185.139.21.50:/var/www/html/NOM_PROJET/uploads /var/www/html/NOM_PROJET/
```

Pensez à accorder les droits d'accès a `uploads/` si ce n'est pas déjà fait:
```sh
su root
sudo chown -R www-data:www-data uploads/
```
Sans cela, l'utilsation de `avmedia` et `avgc` ne fonctionnera pas.

### SSL

A noter que le chemin du SSL change souvent. La convention est de placer les fichiers de SSL dans le dossier `/etc/ssl/NOM_DOMAINE_SITE`.
Les chemins des fichiers de SSL seront à spécifier dans le fichier de configuration du v-host.

### V-Hosts

On ajoute les v-hosts du projet dans le dossier `/etc/apache2/sites-available/` (comme: `NOM_DOMAINE_SITE.conf`).

On désactive tous les v-hosts, puis on active le v-host du projet:
```sh
sudo a2dissite *.conf
sudo a2ensite NOM_DOMAINE_SITE.conf
```

Lors de la première mise en prod sur un nouveau serveur, et si le serveur a mal été configuré, activer un v-host pourra retrouner le message suivant:
```txt
sudo: impossible de résoudre l'hôte NOM_PROJET: Nom ou service inconnu
```

Dans ce cas, il sera necessaire de modifier les fichiers de configuration pour que le nom de domaine soit bien résolu:
```sh
sudo nano /etc/hosts
```

Ajouter la ligne suivante:
```txt
127.0.0.1 NOM_PROJET
```

Example de fichier de configuration pour le projet `www.mazeres-aero.com`:
```conf
<VirtualHost *:80>
	ServerName mazeres-aero.com
	ServerAlias www.mazeres-aero.com

	ServerAdmin support-web@agoravita.com
	DocumentRoot /var/www/html/www.mazeres-aero.com/

	ErrorLog ${APACHE_LOG_DIR}/mazeres-aero.com-error.log
	CustomLog ${APACHE_LOG_DIR}/mazeres-aero.com-access.log combined

	Redirect permanent / https://www.mazeres-aero.com
</VirtualHost>

<IfModule mod_ssl.c>
        <VirtualHost *:443>
                ServerName mazeres-aero.com/
                ServerAlias www.mazeres-aero.com

                ServerAdmin support-web@agoravita.com
                DocumentRoot /var/www/html/www.mazeres-aero.com/

                <Directory />
                        Require all denied
                </Directory>
                <Directory "/var/www/html/www.mazeres-aero.com/">
                        AllowOverride All
                        Require all granted
                </Directory>

                ErrorLog ${APACHE_LOG_DIR}/mazeres-aero.com-error.log
                CustomLog ${APACHE_LOG_DIR}/mazeres-aero.com-access.log combined

                SSLEngine on
                SSLCertificateFile /etc/ssl/_.mazeres-aero.com/_.mazeres-aero.com.crt
                SSLCertificateKeyFile /etc/ssl/_.mazeres-aero.com/_.mazeres-aero.com.key
                SSLCertificateChainFile /etc/ssl/_.mazeres-aero.com/GandiCert.pem

                <FilesMatch "\.(cgi|shtml|phtml|php)$">
                                SSLOptions +StdEnvVars
                </FilesMatch>
                <Directory /usr/lib/cgi-bin>
                                SSLOptions +StdEnvVars
                </Directory>

                BrowserMatch "MSIE [2-6]" \
                                nokeepalive ssl-unclean-shutdown \
                                downgrade-1.0 force-response-1.0
                # MSIE 7 and newer should be able to use keepalive
                BrowserMatch "MSIE [17-9]" ssl-unclean-shutdown
        </VirtualHost>
</IfModule>
```

### CRONs

Il faudra aussi penser à réimporter les CRONs de l'ancienne prod vers la nouvelle prod. Pour cela, faire `crontab -l` sur l'ancien serveur de prod pour récupérer les CRONs, puis les ajouter à la crontab du nouveau serveur de prod avec `crontab -e`.

### Base de donnée

Exporter la structure de la BDD du DEV
- Se connecter à PHPMyAdmin du DEV > Sélectionner la base de donnée > `Exporter` > Sélectionner `Personnalisée, afficher toutes les options possibles` > Dans `Tout séléctionner`, cocher uniquement `Structure` > Séléctionnee `gzip` dans compression, puis `Executer`

Exporter les données de la BDD de la PROD
- Se connecter à PHPMyAdmin de la PROD> Sélectionner la base de donnée > `Exporter` > Sélectionner `Personnalisée, afficher toutes les options possibles` > Dans `Tout séléctionner`, cocher uniquement `Données` > Séléctionnee `gzip` dans compression, puis `Executer`

Créer la nouvelle base de donnée sur le serveur de prod (sans la structure, ni les données):
- Se connecter en SSH
- Faire `mysql -u root -p` pour se connecter à MySQL
- Faire `CREATE DATABASE NOM_BDD;` pour créer la base de donnée

Créez un utilisateur pour la base de donnée:
- Se connecter en SSH
- Faire `mysql -u root -p` pour se connecter à MySQL
- Faire `CREATE USER 'UTILISATEUR'@'localhost' IDENTIFIED BY 'MOT_DE_PASSE';`

Ajouter les droits à l'utilisateur pour la base de donnée:
- Se connecter en SSH
- Faire `mysql -u root -p` pour se connecter à MySQL
- Faire `GRANT ALL PRIVILEGES ON NOM_BDD.* TO 'UTILISATEUR'@'localhost'; FLUSH PRIVILEGES;`

Importer la BDD (une première fois pour la structure, une deuxième fois pour les données):
- Déplacer le fichier `NOM_BDD.sql.gz` sur le serveur
- Se connecter en SSH
- Faire `cat NOM_BDD.sql | mysql -u USER -p NOM_BDD` pour la structure
- Faire `gunzip < NOM_BDD.sql.gz | mysql -u USER -p NOM_BDD` pour la structure

> NOTE: l'import depuis PHPMyAdmin peut être limité à 2Mo.

#### Installation du projet

Une fois le projet installé, pensez à:
- Rétirer le code du fichier de configuration pour afficher les erreurs PHP (`ini_set('display_errors', 1); // ...`)
- Re-basculer le mode `ON_LINE` à `true` dans le fichier de configuration `config/config.inc.php`
- Modifier le fichier d econfiguration `config/db.inc.php` pour mettre les bonnes informations de connexion à la base de donnée
- Copiez le `.htaccess` de l'ancien serveur de prod vers le nouveau serveur de prod (si besoin)
- Vérifier le fichier `robots.txt` et le mettre à jour si besoin

### The end ?

<img src="https://c.tenor.com/PQ-6_K6WPiUAAAAd/tenor.gif" width="350">

A noter qu'une fois la migration faite, il sera peut être nécessaire d'actualiser les données de la nouvelle production avec celles de l'ancienne production. En d'autres termes, il faut que lorsque la bascule DNS sera faite, ils faut que les données de la nouvelle prod soient à jour.

On pensera donc à récupérer :
- Les fichiers : principalement le dossier `uploads/` qui contient les images, documents, etc.
- La base de donnée de l'ancienne prod (Seulement les données ! Car des modifications de structure peuvent avoir été faites sur la nouvelle prod)