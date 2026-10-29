# Installation

[← Sommaire du guide](index.md)

## Ce qu'il faut

- **Windows** et **PinballY 1.1.0 Beta 10** ou plus récent.
- La fonctionnalité facultative *Lecteur Windows Media* de Windows, pour les sons.
- Pas besoin de git : le zip de la version suffit.

## Pas à pas

1. **Téléchargez `ExpansionPack.zip`** depuis la dernière version publiée : https://github.com/F3L1X79/PinballY-Expansion-Pack/releases/latest (et non « Source code (zip) », dont le dossier s'appelle `PinballY-Expansion-Pack-<version>` et n'est pas trouvé par le pack).
2. **Extrayez-le dans `PinballY\Scripts`**. Le zip contient déjà un dossier nommé `ExpansionPack`, le nom où le pack cherche ses fichiers : vous devez obtenir `PinballY\Scripts\ExpansionPack\main.js`, et non `ExpansionPack\ExpansionPack\main.js`.
3. **Créez `PinballY\Scripts\main.js` avec cette seule ligne** si le fichier n'existe pas, ou **ajoutez-lui cette ligne** s'il existe :
   ```js
   import("./ExpansionPack/main.js").catch(e => logfile.log("ExpansionPack: " + e.message));
   ```
   Vos propres scripts continuent de fonctionner : rien d'autre n'est touché dans `Scripts`, et ils tournent même si le dossier du pack manque ou si le pack échoue au chargement (l'erreur va dans `PinballY.log`).
4. **Facultatif : créez `ExpansionPack\.env.local`**, seulement pour changer un réglage que **Réglages du pack** ne propose pas (voir [Réglages](settings.md)) : copiez `ExpansionPack\.env.example` et gardez les lignes que vous changez, un `CLÉ=valeur` par ligne (UTF-8). Sans lui, le pack tourne avec ses valeurs par défaut.
5. **Facultatif : installez vpxtool** (voir plus bas).
6. **Facultatif : passez PINemHi en 3.6.8** (voir plus bas).
7. **Redémarrez PinballY** et consultez `PinballY.log` (voir [Premier démarrage](#premier-démarrage)).
8. **Choisissez vos Add-ons** dans **Réglages du pack**, depuis le menu opérateur : activez ou désactivez chacun, choisissez l'écran de démarrage et la langue, puis redémarrez PinballY d'une seule pression.

## vpxtool

Avec vpxtool, la ROM de chaque table est remplie toute seule (l'add-on Table ROMs). Téléchargez `vpxtool` pour Windows sur sa page de versions (https://github.com/francisdb/vpxtool/releases) et placez `vpxtool.exe` dans `ExpansionPack\tools`, à côté du programme de redémarrage déjà présent.

Sans lui, la ROM d'une table est quand même trouvée, après sa première partie, et un toast « Problème » rappelle à chaque démarrage que `vpxtool.exe` manque (aux seuls Profils admin, ou à tous s'il n'y en a aucun) : installez-le, ou désactivez l'add-on Table ROMs dans **Réglages du pack**.

## PINemHi 3.6.8

Avec PINemHi 3.6.8, les meilleurs scores sont lus sur les tableaux d'environ 300 ROM de plus.

1. Remplacez les fichiers de `PinballY\PINemHi` par ceux de PINemHi 3.6.8.
2. **Ajoutez toute la section `[romfind]` de son `romfind.ini` à la fin de son `pinemhi.ini`**. PinballY ne lit cette section que dans `pinemhi.ini` : sans elle, une table au champ ROM vide n'a plus aucun tableau.
3. Réglez `USER=` dans `pinemhi.ini` sur le dossier `User` de Visual Pinball X.

## Premier démarrage

Après le redémarrage de PinballY, consultez `PinballY.log` : il liste vos réglages, une ligne « initialized » par add-on, et des lignes `ERROR` qui désignent l'add-on en cause.

PinballY recrée `PinballY.log` à chaque lancement : le pack garde donc aussi chaque erreur dans `Scripts\ExpansionPack\errors.log`, d'un lancement à l'autre (voir [Dépannage](troubleshooting.md)).

Dès que la borne compte au moins deux Profils sans compter Invité, PinballY démarre sur « Changer de joueur » ; voir [Profils](profiles.md) et le réglage `STARTUP_SCREEN` dans [Réglages](settings.md).

## Sauvegarder et désinstaller

Tout ce que le pack conserve reste dans `Scripts\ExpansionPack` : vos réglages (`.env.local`) et la progression de chaque Profil (`profiles`).

- **Pour sauvegarder**, copiez ce dossier.
- **Pour réinstaller ou mettre à jour à la main**, gardez le dossier `profiles` : vous retrouvez votre progression.
- **Pour désinstaller**, supprimez-le et retirez la ligne d'import de `Scripts\main.js`.

## Installer avec git

Pour les contributeurs : au lieu du zip, lancez `git clone https://github.com/F3L1X79/PinballY-Expansion-Pack.git ExpansionPack` depuis `PinballY\Scripts`, puis suivez les étapes à partir de l'étape 3. Un pack installé avec git ne se voit jamais proposer de [mise à jour](updates.md) : lancez `git pull` à la place.
