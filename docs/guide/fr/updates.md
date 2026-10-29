# Mises à jour

[← Sommaire du guide](index.md)

## L'invite de mise à jour

À chaque démarrage, PinballY demande à GitHub, en arrière-plan, si une version plus récente du pack est sortie, sans ralentir le démarrage ; hors ligne, il écrit seulement une ligne dans `PinballY.log`.

S'il y en a une, le démarrage suivant ouvre l'invite de mise à jour avant tout le reste, titrée « Mise à jour disponible » : « La version vX.Y.Z de l'Expansion Pack est disponible. », avec « Mettre à jour » et « Plus tard ». Elle attend un démarrage où le dernier joueur voit les entrées de configuration (un [Profil admin](settings.md#profil-admin), ou n'importe qui tant qu'aucun Profil n'est marqué).

## Mettre à jour

« Mettre à jour » télécharge et vérifie la nouvelle version, ferme PinballY, remplace le dossier du pack par le nouveau, et relance PinballY. Le démarrage suivant l'annonce sous « Mise à jour terminée » : « Expansion Pack mis à jour en vX.Y.Z », suivi des nouveautés, une phrase par ligne, dans la langue de la borne. Après un saut de plusieurs versions, les nouveautés de chaque version sautée sont aussi listées, les plus récentes d'abord, cinq phrases au plus. Une version de correction sans nouveauté pour les joueurs n'affiche que la première ligne.

Sont conservés :

- vos réglages (`.env.local`) ;
- vos Profils (`profiles`) ;
- les fichiers que vous avez mis dans `tools`, `vpxtool.exe` compris ;
- vos propres sons et images de score par défaut ;
- le journal des erreurs, `errors.log`.

## Quand une mise à jour échoue

- Un téléchargement qui échoue avant la fermeture de PinballY est signalé aussitôt par « Mise à jour impossible » : « L'Expansion Pack reste tel quel. »
- Si la mise à jour a échoué après la fermeture de PinballY, la version précédente reste en place, et un toast « Problème » indique où en lire la raison à qui voit les entrées de configuration (voir [Dépannage](troubleshooting.md)).

## Plus tard

« Plus tard » n'est plus demandé pour cette version : « Mettre à jour en vX.Y.Z » reste dans **Réglages du pack** jusqu'à la mise à jour.

## Couper la recherche

Réglez « Recherche de mises à jour » sur « Désactivé » dans **Réglages du pack**, ou écrivez `UPDATE_CHECK=false` dans `.env.local` : la borne ne contacte alors jamais GitHub.

Un pack installé avec git n'est jamais vérifié ni mis à jour : lancez `git pull` dans `Scripts\ExpansionPack`.

## Revenir à la version précédente

Fermez PinballY : la version précédente est gardée à côté du pack sous le nom `Scripts\ExpansionPack.old-<date>` (la plus récente seulement).

1. Copiez-y `profiles`, `.env.local` et `pack_update.json` depuis `Scripts\ExpansionPack`, pour garder la progression faite depuis la mise à jour (et ne pas être averti d'un échec).
2. Renommez `ExpansionPack` en n'importe quel autre nom.
3. Renommez ce dossier en `ExpansionPack`.

---

[← Sommaire du guide](index.md)
