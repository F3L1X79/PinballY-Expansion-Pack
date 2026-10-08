// ============================================================
// French translations for PinballY's UI.
// Save this file as UTF-8 with BOM so accented characters display correctly.
// ============================================================

// The active Profile's play time of a table, as PinballY writes its own.
const formatPlayTime = (hours, minutes) => (hours > 0
    ? `${hours} h ${String(minutes).padStart(2, "0")}`
    : `${minutes} minute${minutes > 1 ? "s" : ""}`);

// Hours of play with one decimal, as an Achievement Progress shows them.
const formatHours = hours => hours.toFixed(1).replace(".", ",");

export default {
    // Direct translations of PinballY's native menu titles.
    nativeMenuLabels: {
        "About PinballY": "À propos",
        "Add Media": "Ajouter des médias",
        "Add to Favorites": "Ajouter aux favoris",
        "Adjust Audio Volume": "Régler le volume audio",
        "All Games": "Toutes les tables",
        "All Tables": "Toutes les tables",
        "Batch Capture": "Capture par lot",
        "Batch Capture lets you capture screen shot images and videos for multiple games.  Step 1: select which games to include in the capture process:": "La capture par lot vous permet de capturer des captures d'écran et des vidéos pour plusieurs tables. Étape 1 : sélectionnez les tables à inclure dans le processus de capture :",
        "Begin Capture": "Démarrer la capture",
        "Cancel": "Annuler",
        "Capture images & videos": "Capturer images et vidéos",
        "Confirm Power Off": "Confirmer l'arrêt",
        "Delete game details": "Supprimer les détails de la table",
        "Edit category names...": "Modifier les noms de catégories...",
        "Edit game details...": "Modifier les détails de la table...",
        "Enable Videos": "Activer les vidéos",
        "Exit": "Quitter",
        "Exit PinballY": "Quitter",
        "Favorites": "Tables favorites",
        "Filter by Category": "Filtrer par catégorie",
        "Filter by Date Added": "Filtrer par date d'ajout",
        "Filter by Era": "Filtrer par époque",
        "Filter by Last Played": "Filtrer par dernière partie",
        "Filter by Manufacturer": "Filtrer par fabricant",
        "Filter by Rating": "Filtrer par note",
        "Filter by System": "Filtrer par système",
        "Find game media online": "Rechercher les médias en ligne",
        "Game Setup": "Configuration de la table",
        "Games marked for batch capture": "Tables marquées pour la capture par lot",
        "Help": "Aide",
        "Hide this game": "Masquer cette table",
        "High Scores": "Meilleurs scores",
        "In Favorites": "Dans les favoris",
        "Information": "Informations",
        "Instruction Card": "Carte d'instructions",
        "Mark for Batch Capture": "Marquer pour capture par lot",
        "Marked for Batch Capture": "Marquée pour capture par lot",
        "Mute Attract Mode": "Couper le son du mode attraction",
        "Mute Buttons": "Couper le son des boutons",
        "Mute Table Audio": "Couper l'audio de la table",
        "Mute Videos": "Couper le son des vidéos",
        "Operator Menu": "Menu opérateur",
        "Options": "Options",
        "PinballY Options...": "Options...",
        "Play": "Jouer",
        "Play Game": "Lancer la partie",
        "Power Off": "Éteindre l'ordinateur",
        "Proceed": "Continuer",
        "Rate Table": "Noter la table",
        "Reset Coins/Credits": "Réinitialiser pièces/crédits",
        "Resume Game": "Reprendre la partie",
        "Return": "Retour",
        "Save": "Enregistrer",
        "Search": "Rechercher",
        "Select categories": "Sélectionner les catégories",
        "Show Hidden Games": "Afficher les tables masquées",
        "Show Media Files": "Afficher les fichiers médias",
        "Show Unconfigured Games": "Afficher les tables non configurées",
        "Skip this message next time": "Ne plus afficher ce message",
        "Terminate Game": "Arrêter la partie",
        "The capture process records the exact same areas of the screen where your PinballY windows are located.  Before proceeding, make sure that your PinballY window layout matches the screen layout of the game you're about to record.  For example, if the game's playfield is full-screen, make sure PinballY's playfield window is full-screen.": "Le processus de capture enregistre exactement les mêmes zones de l'écran où sont situées vos fenêtres PinballY. Avant de continuer, assurez-vous que la disposition de vos fenêtres PinballY correspond à celle du jeu que vous allez enregistrer. Par exemple, si le plateau du jeu est en plein écran, assurez-vous que la fenêtre de plateau de PinballY l'est aussi.",
        "This will launch a Web browser window to search for media files for this game.  Look for a \"HyperPin Media Pack\" file.  Download the file and drag it onto this window to install it.\n\nNote that you can drop a Media Pack file onto this window at any time to install media for the currently selected game.  This menu step isn't required to install media; it's just a convenience for launching a Web search.": "Ceci va ouvrir une fenêtre de navigateur Web pour rechercher des fichiers médias pour cette table. Cherchez un fichier \"HyperPin Media Pack\". Téléchargez le fichier et déposez-le sur cette fenêtre pour l'installer.\n\nNotez que vous pouvez déposer un fichier Media Pack sur cette fenêtre à tout moment pour installer des médias pour la table actuellement sélectionnée. Cette étape du menu n'est pas obligatoire pour installer des médias ; c'est juste un raccourci pour lancer une recherche Web.",
        "Uncategorized": "Non catégorisées",
        "Yes, add to current game": "Oui, ajouter à la table actuelle",
        "You must enter the game's bibliographic information (title, system, etc.) before adding media files for the game.  The game information is used to determine the folder locations and file names for the game's media files, so it has to be entered before media files can be added to the game.": "Vous devez saisir les informations bibliographiques de la table (titre, système, etc.) avant d'ajouter des fichiers médias pour cette table. Ces informations sont utilisées pour déterminer les emplacements des dossiers et les noms de fichiers des médias de la table ; elles doivent donc être renseignées avant de pouvoir ajouter des fichiers médias.",
        "Flyer": "Affiche",
        "Pinscape Night Mode": "Mode nuit Pinscape",
        "Hidden Tables": "Tables masquées",
        "Unconfigured Tables": "Tables non configurées",
        "Tables played within:": "Tables jouées depuis moins de :",
        "Tables not played within:": "Tables pas jouées depuis :",
        "Tables added within:": "Tables ajoutées depuis moins de :",
        "Tables added more than:": "Tables ajoutées il y a plus de :",
        "A week": "Une semaine",
        "A month": "Un mois",
        "A year": "Un an",
        "A week ago": "Il y a une semaine",
        "A month ago": "Il y a un mois",
        "A year ago": "Il y a un an",
        "Never played": "Jamais jouées",
        "Batch Capture Step 2: Select the media types you'd like to capture for the selected games.  (You'll be able to say what to do about existing files in the next step.)": "Capture par lot, étape 2 : sélectionnez les types de médias à capturer pour les tables choisies. (Vous pourrez indiquer quoi faire des fichiers existants à l'étape suivante.)",
        "Batch Capture Step 3: For each type, indicate if you'd like to capture the item for EVERY game, even for games that already have existing media of the same type, or if you'd only like to capture missing items.": "Capture par lot, étape 3 : pour chaque type, indiquez si l'élément doit être capturé pour CHAQUE table, même celles qui ont déjà un média de ce type, ou seulement pour celles où il manque.",
        "Next Step": "Étape suivante",
        "Missing only": "Manquants seulement",
        "Capture all": "Tout capturer",
        "View Capture List": "Voir la liste de capture",
        "Please select the system to use to launch this table:": "Choisissez le système avec lequel lancer cette table :",
        "Yes, run as Admin": "Oui, lancer en administrateur",
        "No, cancel": "Non, annuler",
        "Allow (this session only)": "Autoriser (cette session seulement)",
        "Allow (always)": "Autoriser (toujours)",
        "Yes, delete it": "Oui, supprimer",
    },

    // Labels for the media-capture screen's "Item: Action" lines
    // (e.g. "Playfield Image: Skip"), combined via dynamicLabelBuilders.captureItemAction.
    mediaCaptureItemLabels: {
        "Backglass Image": "Image du backglass",
        "Backglass Video": "Vidéo du backglass",
        "Flyer Image": "Image de l'affiche",
        "Instruction Card": "Carte d'instructions",
        "Playfield Image": "Image du plateau",
        "Playfield Video": "Vidéo du plateau",
        "Table Audio": "Audio de la table",
        "Wheel Image": "Image de la roue",
        "DMD Image": "Image du DMD",
        "DMD Video": "Vidéo du DMD",
        "Topper Image": "Image du topper",
        "Topper Video": "Vidéo du topper",
        "Launch Audio": "Audio de lancement",
        "Real DMD Image": "Image du vrai DMD",
        "Real DMD Video": "Vidéo du vrai DMD",
        "Real RGB DMD Image": "Image du vrai DMD RGB",
        "Real RGB DMD Video": "Vidéo du vrai DMD RGB",
    },
    mediaCaptureActionLabels: {
        "Add": "Ajouter",
        "Capture": "Capturer",
        "Capture Silent": "Capturer sans son",
        "Capture w/Audio": "Capturer avec audio",
        "Keep Existing": "Conserver l'existant",
        "Replace Existing": "Remplacer l'existant",
        "Skip": "Ignorer",
    },

    // Status text shown in PinballY's launch overlay, keyed by the
    // language-independent event id (see the "launchoverlaymessage" event).
    launchOverlayMessages: {
        "after": "",
        "capturing": "Capture en cours...",
        "gameover": "Game Over",
        "init": "",
        "launching": "Chargement en cours...",
        "running": "Lancement de la table...",
        "terminating": "Retour à la liste des jeux...",
    },

    // Functions that build translated titles for PinballY's dynamically
    // generated menu text (category names, star ratings, etc.).
    dynamicLabelBuilders: {
        captureInstructions: (seconds) => {
            const plural = seconds === "1" ? "" : "s";
            return `Sélectionnez les éléments à capturer, puis cliquez sur Démarrer la capture. Cela va lancer votre jeu, capturer les images de l'écran, et quitter automatiquement le jeu une fois terminé. Le processus prendra environ ${seconds} seconde${plural}. (!) signifie qu'un élément existant sera remplacé.`;
        },
        captureInstructionsOneMinute: () =>
            "Sélectionnez les éléments à capturer, puis cliquez sur Démarrer la capture. Cela va lancer votre jeu, capturer les images de l'écran, et quitter automatiquement le jeu une fois terminé. Le processus prendra environ 1 minute. (!) signifie qu'un élément existant sera remplacé.",
        captureItemAction: (item, action) => `${item} : ${action}`,
        decadeTables: (decade) => `Tables années ${decade}`,
        genericTables: (name) => `Tables ${name}`,
        mediaGameMismatchWarning: (draggedGame, currentGame) =>
            `Il semblerait que certains fichiers médias que vous ajoutez soient destinés à une autre table, "${draggedGame}". Les fichiers médias sont toujours ajoutés à la table sélectionnée sur la roue, actuellement "${currentGame}". Voulez-vous ajouter ces éléments à la table actuelle ?`,
        mediaGameMismatchWarningMultiple: (gameList, currentGame) =>
            `Il semblerait que certains fichiers médias que vous ajoutez soient destinés à d'autres tables : ${gameList}. Les fichiers médias sont toujours ajoutés à la table sélectionnée sur la roue, actuellement "${currentGame}". Voulez-vous ajouter ces éléments à la table actuelle ?`,
        mediaReadyToAdd: (gameName) =>
            `Les éléments médias suivants sont prêts à être ajoutés pour ${gameName}. Choisissez les éléments que vous souhaitez ajouter ou remplacer.`,
        starTables: (count) => `Tables ${count} étoile${count > 1 ? "s" : ""}`,
        startDelay: (seconds) => `Ajuster le délai de démarrage (${seconds} sec)`,
        unratedTables: () => "Tables non notées",
        batchCaptureReady: (count, duration) => `La capture par lot est prête ! ${count} table(s) seront incluses dans ce processus, qui prendra environ ${duration}.`,
        confirmDeleteGameDetails: (title) => `Voulez-vous vraiment supprimer les détails de la table ${title} ? (Seules les informations bibliographiques sont supprimées, pas les fichiers de la table ni ses médias.)`,
        showCustomView: (name) => `Afficher ${name}`,
        durationSeconds: (count) => `${count} seconde${count > 1 ? "s" : ""}`,
        durationMinutes: (count) => `${count} minute${count > 1 ? "s" : ""}`,
        durationHours: (hours, minutes) => (minutes > 0 ? `${hours} h ${String(minutes).padStart(2, "0")}` : `${hours} heure${hours > 1 ? "s" : ""}`),
    },

    ratingPrompt: {
        message: (tableTitle, minutes) =>
            `Eh beh ! Tu as totalisé plus de ${minutes} minutes de jeu sur la table "${tableTitle}" ! Est-ce que ce serait pas le moment de lui mettre une petite note ?`,
        rateNow: "Allez, go !",
        notNow: "Plus tard...",
    },

    // The Welcome Screen, at startup (see addons/welcome_screen.js).
    welcomeScreen: {
        greetings: { morning: "Bien le bonjour", afternoon: "Hey salut", evening: "Bien le bonsoir", night: "Salut nocturne" },
        greetingWithName: (greeting, name) => [`${greeting}, `, name, " !"],
        greetingAlone: (greeting) => `${greeting} !`,
        closeTooltip: "Fermer",
        stayOn: (tableTitle) => `Rester sur ${tableTitle}`,
        stayOnWheel: "Rester sur la roue",
        randomTable: "Lancer une table au hasard",
        // The active Profile's Daily Streak under the greeting, from 2 days
        // on, its count shown in a square before the text.
        cabinetStreak: {
            notYetToday: "jours d'affilée sur la borne : continue !",
            playedToday: "jours d'affilée sur la borne",
        },
        // One card per Period Table; its grey line says it was played this
        // Period, or else the Streak of the daily or weekly rendezvous, its
        // count shown in a square before the text.
        periodCards: {
            day: {
                period: "TABLE DU JOUR",
                played: "Jouée aujourd'hui",
                streak: "jours d'affilée sur la table du jour : continue !",
            },
            week: {
                period: "TABLE DE LA SEMAINE",
                played: "Jouée cette semaine",
                streak: "semaines d'affilée sur la table de la semaine : continue !",
            },
            go: "Y aller",
        },
    },

    // Lower status line text for the currently selected table.
    // [Filter.Count], [Game.Year], etc. are PinballY placeholders — keep them as-is.
    tableInfoStatusLines: {
        manufacturer: (position) => `Table ${position}/[Filter.Count] - fabriqué par [Game.Manuf].`,
        manufacturerFictional: (position) => `Table ${position}/[Filter.Count] - Flipper fictif.`,
        playCount: (position, count) => `Table ${position}/[Filter.Count] - lancé ${count} fois.`,
        playTime: (position, hours, minutes) => `Table ${position}/[Filter.Count] - joué pendant ${formatPlayTime(hours, minutes)}.`,
        year: (position) => `Table ${position}/[Filter.Count] - sorti en [Game.Year].`,
    },

    // Upper status line messages, after the player's own from PinballY's options.
    // [Filter.Count] is a PinballY placeholder — keep it as-is.
    upperStatusLines: {
        welcome: name => `Bienvenue, ${name} !`,
        tablesAvailable: "[Filter.Count] tables sont disponibles !",
        launchHint: "Bouton noir pour lancer une table.",
        browseHint: "Flippers droite/gauche pour passer les tables.",
        signOff: "Et surtout, amuse-toi bien ;)",
    },

    // Labels for menu items this project adds itself (see custom_menu_commands.js, custom_filter.js, hall_of_fame.js and tables_to_discover.js).
    customMenuLabels: {
        challengeTables: "Tables du défi",
        hallOfFameFilter: "Tables les plus jouées",
        tablesToDiscoverFilter: "Tables à découvrir",
        originalTablesFilter: "Tables Originales",
        randomGame: "Lancer une table au hasard",
        tableOfTheDay: "Lancer la table du jour",
        tableOfTheWeek: "Lancer la table de la semaine",
        tableSetup: "Configuration de la table",
    },

    achievements: {
        dailyFirstPlayTitle: () => "Bonjour, table du jour !",
        dailyFirstPlayDescription: () => "Jouer la table du jour pour la première fois.",
        weeklyFirstPlayTitle: () => "Rendez-vous hebdo",
        weeklyFirstPlayDescription: () => "Jouer la table de la semaine pour la première fois.",
        dailyPeriodsPlayedTitles: {
            10: "Explorateur du dimanche",
            25: "Explorateur curieux",
            50: "Explorateur chevronné",
            100: "Indiana Flippers",
        },
        dailyPeriodsPlayedDescription: (days) => `Jouer la table du jour ${days} jours différents.`,
        weeklyPeriodsPlayedTitles: {
            4: "Un mois de rendez-vous",
            10: "Habitué de la semaine",
            26: "Six mois de fidélité",
            52: "Un an, pas une ride",
        },
        weeklyPeriodsPlayedDescription: (weeks) => `Jouer la table de la semaine ${weeks} semaines différentes.`,
        dailyStreakTitles: {
            3: "Jamais deux sans trois",
            7: "Semaine parfaite",
            14: "Quinzaine de fer",
            30: "Moine du flipper",
        },
        dailyStreakDescription: (days) => `Jouer la table du jour ${days} jours d'affilée.`,
        weeklyStreakTitles: {
            4: "Un mois sans faute",
            12: "Abonné fidèle",
        },
        weeklyStreakDescription: (weeks) => `Jouer la table de la semaine ${weeks} semaines d'affilée.`,
        decadeCompletionTitle: (decadeStartYear) => `Voyage dans les années ${decadeStartYear}`,
        manufacturerCompletionTitle: (manufacturer) => `Fan absolu de ${manufacturer}`,
        manufacturerCompletionDescription: (manufacturer, count) => `Jouer au moins une fois aux ${count} tables ${manufacturer}.`,
        firstTableTitle: () => "Premiers pas",
        firstTableDescription: () => "Jouer une toute première table.",
        collectionPercentTitles: {
            10: "Le goût du métal",
            25: "Collectionneur en herbe",
            50: "Mi-temps",
            75: "Presque tout vu",
            100: "Rien ne m'échappe",
        },
        collectionPercentDescription: (percent, playedCount, totalCount) => `Jouer à ${playedCount} tables sur ${totalCount} (${percent} % de votre collection).`,
        worldTourTitle: () => "Tour du monde",
        worldTourDescription: () => "Faire défiler toutes les tables de la roue d'une traite, sans en lancer aucune.",
        playTimeMilestoneTitles: {
            1: "Mise en jambes",
            5: "Ça devient sérieux",
            10: "Accro aux flippers",
            50: "Flipper dans le sang",
            100: "Légende du tilt",
        },
        playTimeMilestoneDescription: (hours) => `Cumuler plus de ${hours} heure${hours > 1 ? "s" : ""} de jeu.`,
        decadeCompletionDescription: (decadeStartYear, count) => `Jouer au moins une fois aux ${count} tables des années ${decadeStartYear}.`,
        categoryCompletionTitle: (category) => `Maître ${category}`,
        categoryCompletionDescription: (category, count) => `Jouer au moins une fois aux ${count} tables "${category}".`,
        marathonTitles: {
            30: "Semi-marathonien",
            60: "Marathonien errant",
        },
        marathonDescription: (minutes) => `Jouer une session de plus de ${minutes} minutes d'affilée.`,
        cabinetStreakTitles: {
            3: "On y revient",
            7: "Une semaine à la borne",
            15: "Pilier de la borne",
            30: "Fait partie des meubles",
        },
        cabinetStreakDescription: (days) => `Jouer sur la borne ${days} jours d'affilée, n'importe quelle table.`,
        rageQuitTitle: () => "Rage quit ?!",
        rageQuitDescription: (minSeconds, maxSeconds) => `Quitter une table au bout de ${minSeconds} à ${maxSeconds} secondes...`,
        grandReturnTitle: () => "Le grand retour",
        grandReturnDescription: (days) => `Rejouer une table après ${days} jours d'absence ou plus.`,
        // A Secret Achievement's hint, shown instead of its description while it is missing.
        rageQuitHint: () => "Il y a des jours où une table ne vous réussit pas...",
        grandReturnHint: () => "Les vieux amis sont toujours contents de vous revoir...",
        worldTourHint: () => "Certains voyages se font sans jamais appuyer sur Start...",
        nightOwlTitle: () => "Oiseau de nuit",
        nightOwlDescription: (from, to) => `Lancer une partie entre ${from} et ${to}.`,
        nightOwlHint: () => "Le flipper ne dort jamais...",
        fullMoonNightTitle: () => "Nuit de pleine lune",
        fullMoonNightDescription: (from, to, percent) => `Lancer une partie entre ${from} et ${to} quand la lune est éclairée à ${percent} % au moins.`,
        fullMoonNightHint: () => "Certaines nuits, même les loups-garous jouent au flipper...",
        fridayThe13thTitle: () => "Vendredi 13",
        fridayThe13thDescription: () => "Lancer une partie un vendredi 13.",
        fridayThe13thHint: () => "Certains jours, mieux vaut ne pas passer sous une échelle...",
        lunchBreakTitle: () => "Pause déjeuner",
        lunchBreakDescription: (from, to) => `Lancer une partie entre ${from} et ${to}, du lundi au vendredi.`,
        lunchBreakHint: () => "Un sandwich d'une main, le flipper de l'autre...",
        mirrorHourTitle: () => "Heure miroir",
        mirrorHourDescription: () => "Lancer une partie à une heure dont les minutes répètent l'heure, comme 11:11.",
        mirrorHourHint: () => "Faites un vœu...",
        fourSeasonsTitle: () => "Quatre saisons",
        fourSeasonsDescription: (count) => `Jouer au moins une fois dans chacune des ${count} saisons.`,
        fourSeasonsHint: () => "Le flipper, c'est toute l'année...",
        oneMoreGameTitle: () => "Encore une !",
        oneMoreGameDescription: (count) => `Jouer ${count} parties d'affilée sur la même table.`,
        oneMoreGameHint: () => "Quand on aime, on ne compte pas...",
        timeTravelTitle: () => "Voyage dans le temps",
        timeTravelDescription: (count) => `Jouer ${count} parties d'affilée, chacune sur une table d'une décennie plus ancienne que la précédente.`,
        timeTravelHint: () => "Et si on remontait le temps...",
        randomGamesTitles: {
            10: "Pifomètre",
            25: "Pile ou face",
            50: "Joueur de dés",
            100: "Poker face",
        },
        randomGamesDescription: (count) => `Jouer ${count} tables au hasard.`,
        challengesCompletedTitles: {
            1: "Premier défi",
            5: "Amateur de défis",
            10: "Chercheur de défis",
            25: "Chasseur de défis",
            50: "Maître des défis",
            100: "Légende de la semaine",
        },
        challengesCompletedDescription: (count) => (count === 1 ? "Réussir un défi." : `Réussir ${count} défis.`),
        dayManufacturersTitles: {
            3: "Tour du monde express",
            5: "Papillon du flipper",
            8: "Infidèle en série",
            10: "Casanova du flipper",
        },
        dayManufacturersDescription: (count) => `Jouer des tables de ${count} fabricants différents le même jour.`,
        // Header of the Achievement Toast card.
        toastHeader: "Succès débloqué",
    },

    achievementList: {
        menuEntry: "Voir vos succès",
        // The header's title, the section titles, the key caps and the
        // footer's hints are shown in capitals.
        title: "Succès personnels",
        totalLine: (unlockedCount, totalCount, percent) => `${unlockedCount} / ${totalCount} succès débloqués (${percent} %)`,
        unlockedSection: "Succès débloqués",
        missingSection: "Succès à obtenir",
        // After a section's title.
        sectionCount: (count) => `(${count})`,
        // The key caps: Next and Prev are the right and left flipper buttons.
        keyCaps: { next: "Droite", prev: "Gauche", exit: "Exit" },
        browse: "Parcourir",
        back: "Retour",
        // After at most four Avatars on a row: how many other Profiles have it too.
        moreOwners: (count) => `+${count}`,
        // A missing Secret Achievement's title.
        secretTitle: "???",
        // A missing Achievement's Achievement Progress, on its row.
        progressUnits: {
            tables: {
                short: (current, target) => `${current}/${target}`,
            },
            hours: {
                short: (current, target) => `${formatHours(current)}/${target} h`,
            },
            daysInARow: {
                short: (current, target) => `${current}/${target}`,
            },
            weeksInARow: {
                short: (current, target) => `${current}/${target}`,
            },
            daysPlayed: {
                short: (current, target) => `${current}/${target}`,
            },
            weeksPlayed: {
                short: (current, target) => `${current}/${target}`,
            },
            minutes: {
                short: (current, target) => `${current}/${target} min`,
            },
            randomGames: {
                short: (current, target) => `${current}/${target}`,
            },
            manufacturers: {
                short: (current, target) => `${current}/${target}`,
            },
            challenges: {
                short: (current, target) => `${current}/${target}`,
            },
        },
    },

    profileStats: {
        menuEntry: "Vos statistiques",
        closeTooltip: "Fermer",
        // The buttons at the card's foot.
        buttons: {
            achievements: "Succès",
            mostPlayedTables: "Tables les plus jouées",
            tablesToDiscover: "Tables à découvrir",
        },
        // The card's Player Level: its title over the big digits, then the
        // points so far and those of the next level, thousands separated.
        playerLevel: {
            title: "NIVEAU",
            current: (points, nextLevelPoints) => `Actuel : ${points} / ${nextLevelPoints}`,
        },
        collectionTitle: "MAÎTRISE DE LA COLLECTION",
        sections: {
            game: "JEU",
            progression: "PROGRESSION",
            tastes: "GOÛTS",
        },
        // The stats' labels, over their values.
        stats: {
            gamesPlayed: "Parties jouées",
            totalTime: "Temps total",
            averageDuration: "Durée moyenne",
            collection: "Collection",
            challengesCompleted: "Défis réussis",
            cabinetStreak: "Jours d'affilée sur la borne",
            dayStreak: "Série du jour",
            weekStreak: "Série de la semaine",
            favouriteManufacturer: "Constructeur favori",
            favouriteDecade: "Décennie favorite",
            favouriteTable: "Table préférée",
            firstTablePlayed: "Première table jouée",
        },
        // Thousands separated by a no-break space: "1 206".
        number: (count) => String(count).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0"),
        // Minutes on two digits: "96 h 05".
        hoursAndMinutes: (hours, minutes) => `${hours} h ${String(minutes).padStart(2, "0")}`,
        minutes: (minutes) => `${minutes} min`,
        fraction: (count, total) => `${count}/${total}`,
        // The share of the collection played, in a pill.
        percent: (percent) => `${percent} %`,
        // A Streak's longest, in a pill; or the record set right now.
        record: (longest) => `Record : ${longest}`,
        recordInProgress: "Record !",
        // A favourite's play time, in a pill; its hours and minutes given.
        playTime: (time) => `${time} de jeu`,
        // The favourite decade, by its start year: 1990 for 1990 to 1999.
        decade: (decadeStartYear) => `Années ${decadeStartYear}`,
        // The first table played's date, day and month on two digits.
        playedOn: (day, month, year) => `le ${day}/${month}/${year}`,
        // A stat without a value, such as the average before any Play.
        none: "—",
    },

    // Profiles. Guest's folder name is never shown: this is its name.
    profiles: {
        menuEntry: "Changer de joueur",
        pickerTitle: "Qui joue ?",
        pickerHint: "Flippers : changer · Start : choisir · Exit : annuler",
        guestName: "Invité",
        greeting: name => `Salut ${name} !`,
    },

    // The Profile Reset, in PinballY's Exit menu for an Admin Profile.
    profileReset: {
        menuEntry: "Réinitialiser un profil",
        listTitle: "Quel profil repart de zéro ?",
        confirm: name => `Réinitialiser ${name} ? Ses parties, séries, défis et succès seront tous effacés.`,
        yes: "Oui, réinitialiser",
        no: "Non",
        cancel: "Annuler",
        done: name => `${name} repart de zéro.`,
        failed: name => `Impossible de réinitialiser ${name}. Voir le journal pour les détails.`,
        ok: "OK",
        everyProfile: "Tous les profils",
        confirmEvery: count => `Réinitialiser les ${count} profils ? Leurs parties, séries, défis et succès seront tous effacés.`,
        everyDone: count => `Les ${count} profils repartent de zéro.`,
        everyFailed: (count, names) => `Profils réinitialisés : ${count}. Impossible de réinitialiser ${names.join(", ")}. Voir le journal pour les détails.`,
    },

    // The clock at the top left of the wheel screen.
    clock: {
        time: (hours, minutes) => `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    },

    // The Challenge Card, at the top right of the wheel screen (see common/challenge_card.js).
    challenges: {
        cardHeader: "Défi de la semaine",
        titles: {
            differentTables: (target) => `Jouer ${target} tables différentes`,
            manufacturerTables: (target, manufacturer) => `Jouer ${target} tables ${manufacturer} différentes`,
            decadeTables: (target, decade) => `Jouer ${target} tables différentes des années ${decade}`,
            differentManufacturers: (target) => `Jouer des tables de ${target} fabricants différents`,
            differentDecades: (target) => `Jouer des tables de ${target} décennies différentes`,
            neverPlayedTables: (target) => `Jouer ${target} tables jamais jouées`,
            dustyTables: (target) => `Jouer ${target} tables délaissées depuis six mois`,
            tableOfTheDayDays: (target) => `Jouer la table du jour ${target} jours différents`,
            tableOfTheWeekGames: (target) => `Jouer ${target} parties sur la table de la semaine`,
            activeDays: (target) => `Jouer ${target} jours différents`,
            endurance: (target) => `Jouer ${target} minutes sur une même table`,
            marathon: (target) => `Jouer ${target} minutes au total`,
            randomGames: (target) => `Jouer ${target} parties au hasard`,
            sameTableGames: (target) => `Jouer ${target} parties sur une même table`,
        },
        progress: (value, target, daysText) => `${value}/${target} · ${daysText}`,
        daysLeft: (days) => `encore ${days} jours`,
        lastDay: "dernier jour",
        completed: "Défi réussi !",
        verdictHeader: "Défi précédent",
        missed: (reached, target) => `Manqué · ${reached}/${target}`,
        toastHeader: "Défi réussi",
        toastDescription: (count) => (count === 1 ? "Premier défi réussi" : `${count} défis réussis`),
    },

    // The Mastery Bar, under the Challenge Card (see common/mastery_bar.js), and the
    // Collection Mastery's texts.
    tableMastery: {
        // Collection Mastery: the goal toward the next Collection Tier, how
        // many tables already reach it, or, at the last tier, that all did.
        collection: {
            goal: (count, levelName) => `Objectif : ${count} ${count === 1 ? "table" : "tables"} ${levelName}`,
            current: (reached, needed) => `Actuel : ${reached}/${needed}`,
            allTables: (levelName) => `Toutes tes tables : ${levelName}`,
        },
        levelNames: ["Novice", "Élève", "Adepte", "Disciple", "Spécialiste", "As", "Virtuose", "Prodige", "Légende", "Mage du flipper"],
        toDiscover: "Table à découvrir",
        toastHeader: "Maîtrise",
        toastTitle: (name, level) => `${name} (${level})`,
        collectionToastHeader: "Maîtrise de la collection",
        collectionToastTitle: (tier, name) => `Palier ${tier} : ${name}`,
        collectionToastDescription: (count, name) => `${count} ${count === 1 ? "table" : "tables"} au niveau ${name} ou plus`,
    },
    playerLevel: {
        // Kept in English on purpose: the gamers' phrase.
        toastHeader: "Level up",
        toastTitle: (level) => `Niveau ${level}`,
        toastDescription: "Vos succès vous font passer au niveau supérieur.",
    },
};
