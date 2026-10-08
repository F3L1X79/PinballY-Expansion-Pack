# PinballY Expansion Pack

Extension non officielle de [PinballY](http://mjrnet.org/pinscape/PinballY.php), écrite avec l'API de scripting JavaScript que PinballY ouvre à tous les développeurs. · *[English version](README.md)*

> **Votre pincab, en français, avec de vraies raisons d'y revenir.** Ce qui manquait à PinballY, sans toucher à PinballY :
> - un Profil avec avatar pour chacun, et vos statistiques ;
> - la table du jour ;
> - des défis hebdomadaires ;
> - des succès du Bronze au Platine, dont quelques secrets.
>
> Et ce n'est que le début…

<img src="docs/images/hero.png" alt="L'écran de la roue avec l'horloge, le badge du Profil actif et la carte du Défi de la semaine" width="360">

### PinballY en 6 langues

<img src="docs/images/translation.png" alt="Le menu Quitter de PinballY en français" width="480">

Les menus et messages de PinballY enfin en français, mais aussi en allemand, espagnol, italien et portugais.

### Un Profil pour chacun

<img src="docs/images/profiles.png" alt="Le carrousel « Changer de joueur » et ses Avatars" width="480">

Avec « Changer de joueur », chacun prend son Profil et son Avatar, et un message d'accueil indique pour qui les parties vont compter. **Vos statistiques** résument votre vie de flippeur :
- parties jouées et temps total ;
- fabricant et décennie préférés ;
- tables les plus jouées, et celles jamais jouées ;
- la part de la collection que vous avez essayée ;
- vos séries.

Seules les parties d'au moins une minute comptent : un lancement par erreur ne fausse rien. Le Profil Invité reste toujours là pour les visiteurs.

### Table du jour, table de la semaine

<img src="docs/images/period_tables.png" alt="Le dialogue de démarrage avec la table du jour et la table de la semaine" width="480">

Chaque jour une table jamais jouée ou oubliée, chaque semaine une table au hasard, proposées dès le démarrage. Jouez-les plusieurs jours ou plusieurs semaines d'affilée pour faire une série.

### Défis de la semaine

<img src="docs/images/challenges.png" alt="La carte du Défi de la semaine sous le badge du Profil" width="376">

Chaque lundi arrive un nouveau Défi, le même pour toute la maison : cinq tables Stern différentes, trois tables jamais jouées, une heure sur une même table… Sa carte suit votre progression sur l'écran de la roue. **Tables du défi**, juste sous « Toutes les tables » dans le menu principal, ne garde que les tables qui le font avancer. Le réussir fait pleuvoir des confettis sur tout l'écran de la roue.

### Succès

<img src="docs/images/achievements.png" alt="La liste « Succès personnels »" width="380">

Des dizaines de Succès, du Bronze au Platine :
- fabricants et décennies complétés ;
- heures de jeu ;
- séries ;
- Défis ;
- tour complet de la roue…

Chacun est annoncé par un petit encart dans un coin, sans interrompre vos parties ; un Succès Platine fait aussi pleuvoir des confettis sur tout l'écran de la roue. « Succès personnels » montre où vous en êtes de chaque Succès manquant, et quels avatars de la maison l'ont déjà. Quelques-uns restent secrets : vous ne voyez que « ??? » et un indice, jusqu'à ce que vous tombiez dessus.

### Pour le propriétaire de la borne

- **Profil admin** : les entrées de configuration pour vous seul.
- **Profil enfant** : une roue sans tables pour adultes.
- **Réinitialiser un profil** : repartir de zéro, pour un Profil ou toute la maison d'un coup.
- **Nettoyage des menus** : des menus PinballY allégés.

Tout tient dans un seul dossier, sans modifier PinballY.

**Et aussi** :
- une table au hasard sur une roue de la fortune ;
- « Tables à découvrir », « Tables les plus jouées », « Tables favorites » et « Tables Originales » dans les menus ;
- une horloge et une ligne d'état enrichie ;
- un rappel pour noter une table ;
- un lancement sans flash noir ;
- le backglass masqué pendant une partie ;
- vos propres sons au lancement, aux succès et à l'accueil.

## Installation

Nécessite **Windows** et **PinballY 1.1.0 Beta 10** ou plus récent (plus la fonctionnalité facultative *Lecteur Windows Media*, uniquement pour vos propres sons).

1. **Copiez le projet dans `PinballY\Scripts\ExpansionPack`**, sous ce nom exact : le pack y cherche ses fichiers. Depuis un zip téléchargé, renommez le dossier extrait (`PinballY-Expansion-Pack-main`) en `ExpansionPack` ; avec git, lancez `git clone https://github.com/F3L1X79/PinballY-Expansion-Pack.git ExpansionPack` depuis `PinballY\Scripts`.
2. **Ajoutez cette ligne à `PinballY\Scripts\main.js`**, ou créez le fichier avec cette seule ligne si vous n'en avez pas :
   ```js
   import "./ExpansionPack/main.js";
   ```
   Vos propres scripts continuent de fonctionner : rien d'autre n'est touché dans `Scripts`.
3. **Copiez `ExpansionPack\.env.example` en `ExpansionPack\.env.local`** et réglez ce qu'il vous faut, un `CLÉ=valeur` par ligne (UTF-8). Les réglages absents gardent leur valeur par défaut ; `.env.local` est ignoré par git.
4. **Redémarrez PinballY** et consultez `PinballY.log` : il liste vos réglages, une ligne « initialized » par add-on, et des lignes `ERROR` qui désignent l'add-on en cause.

Tout ce que le pack conserve reste dans `Scripts\ExpansionPack` : vos réglages (`.env.local`) et la progression de chaque Profil (`profiles`). **Pour sauvegarder**, copiez ce dossier. **Pour désinstaller**, supprimez-le et retirez la ligne d'import de `Scripts\main.js`.

## Réglages

Les réglages se trouvent dans `Scripts\ExpansionPack\.env.local`, un `CLÉ=valeur` par ligne. N'écrivez que ceux que vous changez, par exemple :

```
LANGUAGE=fr
ACHIEVEMENT_SOUND_FILE=C:\PinballY\Media\Sounds\trophee.mp3
ADD_ON_CLOCK=false
```

| Réglage | Par défaut | Rôle |
|---|---|---|
| `LANGUAGE` | `en` | Langue : `en`, `fr`, `de`, `es`, `it` ou `pt`. |
| `ADULT_CATEGORY` | `NSFW` | Catégorie PinballY des tables pour adultes, cachées aux Profils enfant. |
| `COMMUNITY_TABLES_MANUFACTURER` | `VPX Community` | Fabricant donné aux tables fictives ou communautaires, pour la ligne d'état et le filtre « Tables Originales ». |
| `LAUNCH_SOUND_FILE` | *(aucun)* | Chemin complet d'un son joué au lancement d'une table. |
| `ACHIEVEMENT_SOUND_FILE` | *(aucun)* | Son joué avec chaque annonce de Succès. |
| `PROFILE_GREETING_SOUND_FILE` | *(aucun)* | Son joué quand un joueur est accueilli. |
| `CONFETTI_SOUND_FILE` | *(aucun)* | Son joué une fois au début d'une pluie de confettis. |
| `FIREWORKS_SOUND_FILE` | *(aucun)* | Son joué une fois au début du feu d'artifice. |
| `ACHIEVEMENT_TOAST_SECONDS` | `4` | Secondes d'affichage d'une annonce de Succès (60 au plus). |
| `ACHIEVEMENT_TOAST_SCALE` | `1.0` | Taille de l'annonce, de `0.5` à `3` : à augmenter sur un grand écran. |
| `CONFETTI` | `true` | `false` coupe la pluie de confettis qui accompagne l'annonce d'un Défi réussi ou d'un Succès Platine, si votre PC peine. |
| `FIREWORKS` | `true` | `false` coupe le feu d'artifice qui accompagne l'annonce d'un nouveau niveau, si votre PC peine. Indépendant de `CONFETTI`. |
| `SKIP_RANDOM_GAME_ANIMATION` | `false` | `true` saute la roue de la fortune et lance la table au hasard aussitôt. |
| `ASK_TO_RATE_AFTER_MINUTES_PLAYED` | `60` | Minutes jouées sur une table avant qu'on vous demande de la noter. |
| `LOG_UNTRANSLATED_MENU_TITLES` | `false` | `true` écrit chaque titre de menu PinballY non traduit dans `PinballY.log`. |

Chaque fonctionnalité se désactive aussi avec sa clé `ADD_ON_*`, par exemple `ADD_ON_CLOCK=false` ou `ADD_ON_CHALLENGES=false`. Seul le nettoyage des menus est désactivé par défaut. Chaque clé est décrite dans [.env.example](.env.example).

La progression de chaque Profil est enregistrée dans `Scripts\ExpansionPack\profiles`. Gardez ce dossier quand vous réinstallez ou mettez à jour le pack, et vous retrouvez votre progression.

### Profil admin

Pour garder les entrées de configuration pour vous seul, ajoutez `"isAdmin": true` au premier niveau du `Scripts\ExpansionPack\profiles\<nom>\profile.json` de votre Profil, PinballY fermé. Dès qu'au moins un Profil est marqué, les autres Profils (Invité compris) ne voient plus « Configuration de la table » dans le menu principal ni « Menu opérateur » dans le menu de sortie ; les Profils admin voient toujours les deux, et le bouton de service de la porte monnayeur ouvre toujours le Menu opérateur pour tout le monde. Plusieurs Profils peuvent être marqués. Invité n'est jamais un Profil admin, et une marque qui n'est ni `true` ni `false`, ou dont la clé est mal écrite (`"isAdmin "`, `"IsAdmin"`), est ignorée et signalée dans `PinballY.log`.

Un Profil admin trouve aussi **Réinitialiser un profil** dans le menu de sortie (Échap), juste après « Menu opérateur ». Il liste tous les Profils, Invité et vous-même compris, plus « Tous les profils » pour remettre toute la maison à zéro d'un coup. Après une confirmation (le curseur part sur « Non »), le Profil choisi repart de zéro comme s'il n'avait jamais joué : ses parties, ses séries, ses records de session, ses parties aléatoires, sa progression aux défis et ses succès annoncés sont effacés, tandis que son nom, son avatar et ses marques restent. Un message indique ensuite si l'opération a réussi. Son ancien fichier est gardé à côté sous le nom `profile.reset-<date>.json` : pour annuler une réinitialisation, fermez PinballY et renommez cette copie en `profile.json`. Cette entrée a besoin du menu de sortie de PinballY : si vous l'avez désactivé dans les options de PinballY, elle ne peut pas apparaître.

### Profil enfant

Pour tenir les tables pour adultes à l'écart d'un enfant, donnez-leur dans PinballY la catégorie `NSFW` (ou nommez votre propre catégorie avec `ADULT_CATEGORY` dans `Scripts\ExpansionPack\.env.local`, écrite exactement comme dans PinballY), puis ajoutez `"isChild": true` au premier niveau du `Scripts\ExpansionPack\profiles\<nom>\profile.json` de l'enfant, PinballY fermé. Tant que ce Profil est actif, ces tables n'apparaissent sur la roue sous aucun filtre, la partie aléatoire n'en tire jamais et le démarrage ne laisse jamais la roue sur l'une d'elles ; passer à un autre Profil les fait revenir aussitôt. La table du jour et la table de la semaine restent les mêmes pour toute la maison : tant que l'une d'elles est une table pour adultes, l'enfant n'a ni son entrée du menu principal ni son choix au démarrage, et ce jour ou cette semaine ne prolonge ni ne casse sa série. Invité n'est jamais un Profil enfant : les adultes de passage voient toute la collection. Ce n'est pas un contrôle parental : rien ne demande de mot de passe.

### Nettoyage des menus

Menu Cleanup allège les menus de PinballY pour tous les Profils, Profils admin compris : il retire Aide et À propos du menu de sortie, et Informations, Flyer, Meilleurs scores et Carte d'instructions du menu principal (Noter la table et Ajouter aux favoris restent). C'est la seule fonctionnalité **désactivée par défaut** : activez-la avec `ADD_ON_MENU_CLEANUP=true`. Les boutons dédiés de PinballY pour ces écrans, si vous les avez affectés, fonctionnent toujours.

## Contribuer

Organisation du code, conventions, tests, ajout d'une langue et remise à zéro de la progression : voir le [guide du contributeur](CONTRIBUTING.md) (en anglais).

## Licence

MIT. Voir [LICENSE](LICENSE).
