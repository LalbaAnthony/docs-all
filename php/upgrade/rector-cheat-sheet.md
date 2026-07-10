# Cheat Sheet Rector

## Qu'est-ce que c'est quoi ?

* Refactoring basé sur AST (pas du regex)
* Permet :
  * Upgrade de syntaxe (7.x -> 8.x)
  * Suppression de code mort
  * Amélioration du typage (même si des fois il force un peu)
  * Modernisation globale

## Installation

```sh
composer require rector/rector --dev
```

## Utilisation

Exécution :

```sh
vendor/bin/rector process # Run rector and apply changes
vendor/bin/rector --dry-run # Run rector in dry-run mode, it will show the changes that would be made without applying them
vendor/bin/rector process --dry-run > rector-report.txt 2>&1 # Run rector and save the report to a file
vendor/bin/rector process --dry-run --debug > rector-debug.txt 2>&1 # Run rector in debug mode and save the debug output to a file
vendor/bin/rector ./src # Run rector only on the src/ directory (override the paths defined in rector.php)
```

## Configuration

Rector utilise un fichier `rector.php` à la racine du projet pour définir les règles de transformation.

### Config minimale (upgrade PHP 8.4)

```php
declare(strict_types=1);

use Rector\Config\RectorConfig;

return RectorConfig::configure()
    ->withPaths([
        __DIR__ . '/src',
    ])
    ->withPhpSets(php84: true);
```

### Config avancée (contrôle total)

D'abord on active globalement les évolutions jusqu'à PHP 8.4, puis on désactive les règles risquées (comparaison stricte, scope différent, etc.) pour éviter les bugs.

```php
declare(strict_types=1);

use Rector\CodeQuality\Rector\Assign\CombinedAssignRector;
use Rector\Config\RectorConfig;
use Rector\DeadCode\Rector\Foreach_\RemoveUnusedForeachKeyRector;
use Rector\Php52\Rector\Switch_\ContinueToBreakInSwitchRector;
use Rector\Php53\Rector\FuncCall\DirNameFileConstantToDirConstantRector;
use Rector\Php53\Rector\Ternary\TernaryToElvisRector;
use Rector\Php54\Rector\Array_\LongArrayToShortArrayRector;
use Rector\Php70\Rector\Ternary\TernaryToNullCoalescingRector;
use Rector\Php71\Rector\FuncCall\RemoveExtraParametersRector;
use Rector\Php71\Rector\List_\ListToArrayDestructRector;
use Rector\Php74\Rector\Closure\ClosureToArrowFunctionRector;
use Rector\Php80\Rector\Catch_\RemoveUnusedVariableInCatchRector;
use Rector\Php80\Rector\Switch_\ChangeSwitchToMatchRector;
use Rector\Php84\Rector\Foreach_\ForeachToArrayAnyRector;
use Rector\Php84\Rector\FuncCall\AddEscapeArgumentRector;

return RectorConfig::configure()
    ->withPaths([
        __DIR__ . '/agoravita',
        __DIR__ . '/apps',
        __DIR__ . '/assets',
        __DIR__ . '/config',
        __DIR__ . '/lib',
    ])
    ->withSkipPath(__DIR__ . '/agoravita/fonctions/general.fct.php')
    ->withSkip([
        LongArrayToShortArrayRector::class,
        RemoveUnusedForeachKeyRector::class,
        ContinueToBreakInSwitchRector::class,
        DirNameFileConstantToDirConstantRector::class,
        RemoveExtraParametersRector::class,
        ForeachToArrayAnyRector::class,
        AddEscapeArgumentRector::class,
        RemoveUnusedVariableInCatchRector::class,
        CombinedAssignRector::class,
        ClosureToArrowFunctionRector::class,
        ListToArrayDestructRector::class,
        TernaryToNullCoalescingRector::class,
        TernaryToElvisRector::class,
        ChangeSwitchToMatchRector::class,
    ])
    ->withPhpSets(php84: true)
    ->withTypeCoverageLevel(0)
    ->withDeadCodeLevel(0)
    ->withCodeQualityLevel(0);
```

#### Activation globale

```php
->withPhpSets(php84: true)
```

-> couvre toutes les évolutions jusqu'à PHP 8.4

#### Désactivation ciblée

| Rector                          | Risque                       |
| ------------------------------- | ---------------------------- |
| `ChangeSwitchToMatchRector`     | comparaison stricte -> bugs  |
| `TernaryToNullCoalescingRector` | différence `false` vs `null` |
| `ClosureToArrowFunctionRector`  | scope différent              |
| `RemoveExtraParametersRector`   | casse appels dynamiques      |
| `CombinedAssignRector`          | lisibilité / debug           |

## Limits

À corriger manuellement :

* `count(null)` -> crash en PHP 8
* `implode()` ordre des params
* `each()` supprimé
* `create_function()` supprimé
* `preg_replace /e` supprimé
* `array_key_exists()` sur objets
* `$str{0}` -> `$str[0]`

## Pièges classiques

* Lancer sur `vendor/`
* Tout upgrader d'un coup
* Ne pas tester entre les passes
* Faire confiance aveuglément (et le mec qui a écrit ce `.md` sait de quoi il parle)