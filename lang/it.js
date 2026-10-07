// ============================================================
// Italian translations for PinballY's UI.
// Save this file as UTF-8 with BOM so accented characters display correctly.
// ============================================================

// The active Profile's play time of a table, as PinballY writes its own.
const formatPlayTime = (hours, minutes) => (hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")} ore`
    : `${minutes} minut${minutes === 1 ? "o" : "i"}`);

// Hours of play with one decimal, as an Achievement Progress shows them.
const formatHours = hours => hours.toFixed(1).replace(".", ",");

export default {
    // Direct translations of PinballY's native menu titles.
    nativeMenuLabels: {
        "About PinballY": "Informazioni su PinballY",
        "Add Media": "Aggiungi contenuti multimediali",
        "Add to Favorites": "Aggiungi ai preferiti",
        "Adjust Audio Volume": "Regola volume audio",
        "All Games": "Tutti i tavoli",
        "All Tables": "Tutti i tavoli",
        "Batch Capture": "Acquisizione in batch",
        "Batch Capture lets you capture screen shot images and videos for multiple games.  Step 1: select which games to include in the capture process:": "L'acquisizione in batch ti permette di acquisire screenshot e video per più tavoli. Passaggio 1: seleziona i tavoli da includere nel processo di acquisizione:",
        "Begin Capture": "Avvia acquisizione",
        "Cancel": "Annulla",
        "Capture images & videos": "Acquisisci immagini e video",
        "Confirm Power Off": "Conferma spegnimento",
        "Delete game details": "Elimina dettagli del tavolo",
        "Edit category names...": "Modifica nomi categorie...",
        "Edit game details...": "Modifica dettagli del tavolo...",
        "Enable Videos": "Abilita video",
        "Exit": "Esci",
        "Exit PinballY": "Esci da PinballY",
        "Favorites": "Preferiti",
        "Filter by Category": "Filtra per categoria",
        "Filter by Date Added": "Filtra per data di aggiunta",
        "Filter by Era": "Filtra per epoca",
        "Filter by Last Played": "Filtra per ultima partita",
        "Filter by Manufacturer": "Filtra per produttore",
        "Filter by Rating": "Filtra per valutazione",
        "Filter by System": "Filtra per sistema",
        "Find game media online": "Cerca contenuti multimediali online",
        "Games marked for batch capture": "Tavoli contrassegnati per l'acquisizione in batch",
        "Game Setup": "Configurazione del tavolo",
        "Help": "Aiuto",
        "Hide this game": "Nascondi questo tavolo",
        "High Scores": "Punteggi migliori",
        "In Favorites": "Nei preferiti",
        "Information": "Informazioni",
        "Instruction Card": "Scheda istruzioni",
        "Mark for Batch Capture": "Segna per acquisizione in batch",
        "Marked for Batch Capture": "Segnato per acquisizione in batch",
        "Mute Attract Mode": "Disattiva audio della modalità attrazione",
        "Mute Buttons": "Disattiva audio dei pulsanti",
        "Mute Table Audio": "Disattiva audio del tavolo",
        "Mute Videos": "Disattiva audio dei video",
        "Operator Menu": "Menu operatore",
        "Options": "Opzioni",
        "PinballY Options...": "Opzioni...",
        "Play": "Gioca",
        "Play Game": "Avvia partita",
        "Power Off": "Spegni il computer",
        "Proceed": "Continua",
        "Rate Table": "Valuta il tavolo",
        "Reset Coins/Credits": "Reimposta monete/crediti",
        "Resume Game": "Riprendi partita",
        "Return": "Indietro",
        "Save": "Salva",
        "Search": "Cerca",
        "Select categories": "Seleziona categorie",
        "Show Hidden Games": "Mostra tavoli nascosti",
        "Show Media Files": "Mostra file multimediali",
        "Show Unconfigured Games": "Mostra tavoli non configurati",
        "Skip this message next time": "Non mostrare più questo messaggio",
        "Terminate Game": "Termina partita",
        "The capture process records the exact same areas of the screen where your PinballY windows are located.  Before proceeding, make sure that your PinballY window layout matches the screen layout of the game you're about to record.  For example, if the game's playfield is full-screen, make sure PinballY's playfield window is full-screen.": "Il processo di acquisizione registra esattamente le stesse aree dello schermo in cui si trovano le finestre di PinballY. Prima di procedere, assicurati che la disposizione delle finestre di PinballY corrisponda a quella dello schermo del gioco che stai per registrare. Ad esempio, se il piano di gioco del gioco è a schermo intero, assicurati che anche la finestra del piano di gioco di PinballY sia a schermo intero.",
        "This will launch a Web browser window to search for media files for this game.  Look for a \"HyperPin Media Pack\" file.  Download the file and drag it onto this window to install it.\n\nNote that you can drop a Media Pack file onto this window at any time to install media for the currently selected game.  This menu step isn't required to install media; it's just a convenience for launching a Web search.": "Verrà aperta una finestra del browser Web per cercare file multimediali per questo tavolo. Cerca un file \"HyperPin Media Pack\". Scarica il file e trascinalo su questa finestra per installarlo.\n\nNota che puoi trascinare un file Media Pack su questa finestra in qualsiasi momento per installare i contenuti multimediali per il tavolo attualmente selezionato. Questo passaggio del menu non è necessario per installare i contenuti multimediali; serve solo come comoda scorciatoia per avviare una ricerca sul Web.",
        "Uncategorized": "Non categorizzati",
        "Yes, add to current game": "Sì, aggiungi al tavolo attuale",
        "You must enter the game's bibliographic information (title, system, etc.) before adding media files for the game.  The game information is used to determine the folder locations and file names for the game's media files, so it has to be entered before media files can be added to the game.": "Devi inserire le informazioni bibliografiche del tavolo (titolo, sistema, ecc.) prima di aggiungere file multimediali per il tavolo. Queste informazioni vengono utilizzate per determinare i percorsi delle cartelle e i nomi dei file per i contenuti multimediali del tavolo, quindi devono essere inserite prima di poter aggiungere file multimediali.",
        "Flyer": "Volantino",
        "Pinscape Night Mode": "Modalità notte Pinscape",
        "Hidden Tables": "Tavoli nascosti",
        "Unconfigured Tables": "Tavoli non configurati",
        "Tables played within:": "Tavoli giocati da meno di:",
        "Tables not played within:": "Tavoli non giocati da:",
        "Tables added within:": "Tavoli aggiunti da meno di:",
        "Tables added more than:": "Tavoli aggiunti più di:",
        "A week": "Una settimana",
        "A month": "Un mese",
        "A year": "Un anno",
        "A week ago": "Una settimana fa",
        "A month ago": "Un mese fa",
        "A year ago": "Un anno fa",
        "Never played": "Mai giocati",
        "Batch Capture Step 2: Select the media types you'd like to capture for the selected games.  (You'll be able to say what to do about existing files in the next step.)": "Acquisizione in batch, passo 2: seleziona i tipi di media da acquisire per i tavoli scelti. (Nel passo successivo potrai indicare cosa fare dei file esistenti.)",
        "Batch Capture Step 3: For each type, indicate if you'd like to capture the item for EVERY game, even for games that already have existing media of the same type, or if you'd only like to capture missing items.": "Acquisizione in batch, passo 3: per ogni tipo, indica se acquisirlo per OGNI tavolo, anche per quelli che hanno già un media di quel tipo, o solo per quelli in cui manca.",
        "Next Step": "Passo successivo",
        "Missing only": "Solo mancanti",
        "Capture all": "Acquisisci tutto",
        "View Capture List": "Visualizza elenco di acquisizione",
        "Please select the system to use to launch this table:": "Seleziona il sistema con cui avviare questo tavolo:",
        "Yes, run as Admin": "Sì, esegui come amministratore",
        "No, cancel": "No, annulla",
        "Allow (this session only)": "Consenti (solo questa sessione)",
        "Allow (always)": "Consenti (sempre)",
        "Yes, delete it": "Sì, elimina",
    },

    // Labels for the media-capture screen's "Item: Action" lines
    // (e.g. "Playfield Image: Skip"), combined via dynamicLabelBuilders.captureItemAction.
    mediaCaptureItemLabels: {
        "Backglass Image": "Immagine del backglass",
        "Backglass Video": "Video del backglass",
        "Flyer Image": "Immagine del volantino",
        "Instruction Card": "Scheda istruzioni",
        "Playfield Image": "Immagine del piano di gioco",
        "Playfield Video": "Video del piano di gioco",
        "Table Audio": "Audio del tavolo",
        "Wheel Image": "Immagine della wheel",
        "DMD Image": "Immagine del DMD",
        "DMD Video": "Video del DMD",
        "Topper Image": "Immagine del topper",
        "Topper Video": "Video del topper",
        "Launch Audio": "Audio di avvio",
        "Real DMD Image": "Immagine del DMD reale",
        "Real DMD Video": "Video del DMD reale",
        "Real RGB DMD Image": "Immagine del DMD RGB reale",
        "Real RGB DMD Video": "Video del DMD RGB reale",
    },
    mediaCaptureActionLabels: {
        "Add": "Aggiungi",
        "Capture": "Acquisisci",
        "Capture Silent": "Acquisisci senza audio",
        "Capture w/Audio": "Acquisisci con audio",
        "Keep Existing": "Mantieni quello esistente",
        "Replace Existing": "Sostituisci quello esistente",
        "Skip": "Ignora",
    },

    // Status text shown in PinballY's launch overlay, keyed by the
    // language-independent event id (see the "launchoverlaymessage" event).
    launchOverlayMessages: {
        "after": "",
        "capturing": "Acquisizione in corso...",
        "gameover": "Game Over",
        "init": "",
        "launching": "Caricamento in corso...",
        "running": "Avvio del tavolo...",
        "terminating": "Ritorno all'elenco dei giochi...",
    },

    // Functions that build translated titles for PinballY's dynamically
    // generated menu text (category names, star ratings, etc.).
    dynamicLabelBuilders: {
        captureInstructions: (seconds) => {
            const plural = seconds === "1" ? "" : "i";
            return `Seleziona gli elementi da acquisire, quindi fai clic su Avvia acquisizione. Questo avvierà il gioco, acquisirà le immagini dello schermo e chiuderà automaticamente il gioco al termine. Il processo richiederà circa ${seconds} second${plural}. (!) indica che un elemento esistente verrà sostituito.`;
        },
        captureInstructionsOneMinute: () =>
            "Seleziona gli elementi da acquisire, quindi fai clic su Avvia acquisizione. Questo avvierà il gioco, acquisirà le immagini dello schermo e chiuderà automaticamente il gioco al termine. Il processo richiederà circa 1 minuto. (!) indica che un elemento esistente verrà sostituito.",
        captureItemAction: (item, action) => `${item}: ${action}`,
        decadeTables: (decade) => `Tavoli degli anni ${decade}`,
        genericTables: (name) => `Tavoli ${name}`,
        mediaGameMismatchWarning: (draggedGame, currentGame) =>
            `Sembra che alcuni dei file multimediali che stai aggiungendo possano essere destinati a un tavolo diverso, "${draggedGame}". I file multimediali vengono sempre aggiunti al tavolo selezionato sulla wheel, attualmente "${currentGame}". Vuoi aggiungere questi elementi multimediali al tavolo attuale?`,
        mediaGameMismatchWarningMultiple: (gameList, currentGame) =>
            `Sembra che alcuni dei file multimediali che stai aggiungendo possano essere destinati ad altri tavoli: ${gameList}. I file multimediali vengono sempre aggiunti al tavolo selezionato sulla wheel, attualmente "${currentGame}". Vuoi aggiungere questi elementi multimediali al tavolo attuale?`,
        mediaReadyToAdd: (gameName) =>
            `I seguenti elementi multimediali sono pronti per essere aggiunti a ${gameName}. Seleziona gli elementi che desideri aggiungere o sostituire.`,
        starTables: (count) => `Tavoli con ${count} stella${count > 1 ? "e" : ""}`,
        startDelay: (seconds) => `Regola ritardo di avvio (${seconds} sec)`,
        unratedTables: () => "Tavoli non valutati",
        batchCaptureReady: (count, duration) => `L'acquisizione in batch è pronta! ${count} tavolo/i saranno inclusi in questo processo, che richiederà circa ${duration}.`,
        confirmDeleteGameDetails: (title) => `Vuoi davvero eliminare i dettagli del tavolo ${title}? (Vengono eliminate solo le informazioni bibliografiche, non i file del tavolo né i suoi media.)`,
        showCustomView: (name) => `Mostra ${name}`,
        durationSeconds: (count) => `${count} second${count === 1 ? "o" : "i"}`,
        durationMinutes: (count) => `${count} minut${count === 1 ? "o" : "i"}`,
        durationHours: (hours, minutes) => (minutes > 0 ? `${hours} h ${minutes} min` : `${hours} or${hours === 1 ? "a" : "e"}`),
    },

    ratingPrompt: {
        message: (tableTitle, minutes) =>
            `Hai giocato a "${tableTitle}" per più di ${minutes} minuti! Vuoi valutarlo ora?`,
        rateNow: "Valuta ora",
        notNow: "Più tardi",
    },

    // TODO: translation pass
    welcomeScreen: {
        greetings: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", night: "Still up" },
        greetingWithName: (greeting, name) => [`${greeting}, `, name, "!"],
        greetingAlone: (greeting) => `${greeting}!`,
        closeTooltip: "Close",
        stayOn: (tableTitle) => `Stay on ${tableTitle}`,
        stayOnWheel: "Stay on the wheel",
        randomTable: "Launch a random table",
        // One card per Period Table; its grey line says it was played this
        // Period, or else the Streak of the daily or weekly rendezvous, its
        // count shown in a square before the text.
        periodCards: {
            day: {
                period: "TABLE OF THE DAY",
                played: "Played today",
                streak: "days in a row on the Table of the Day: keep it going!",
            },
            week: {
                period: "TABLE OF THE WEEK",
                played: "Played this week",
                streak: "weeks in a row on the Table of the Week: keep it going!",
            },
            go: "Go",
        },
    },
    // Lower status line text for the currently selected table.
    // [Filter.Count], [Game.Year], etc. are PinballY placeholders — keep them as-is.
    tableInfoStatusLines: {
        manufacturer: (position) => `Tavolo ${position}/[Filter.Count] - prodotto da [Game.Manuf].`,
        manufacturerFictional: (position) => `Tavolo ${position}/[Filter.Count] - Flipper fittizio.`,
        playCount: (position, count) => `Tavolo ${position}/[Filter.Count] - avviato ${count} volte.`,
        playTime: (position, hours, minutes) => `Tavolo ${position}/[Filter.Count] - giocato per ${formatPlayTime(hours, minutes)}.`,
        year: (position) => `Tavolo ${position}/[Filter.Count] - pubblicato nel [Game.Year].`,
    },

    // Upper status line messages, after the player's own from PinballY's options.
    // [Filter.Count] is a PinballY placeholder — keep it as-is.
    upperStatusLines: {
        welcome: name => `Ti diamo il benvenuto, ${name}!`,
        tablesAvailable: "[Filter.Count] tavoli disponibili!",
        launchHint: "Pulsante di lancio per avviare un tavolo.",
        browseHint: "Flipper sinistro/destro per scorrere i tavoli.",
        signOff: "Buon divertimento!",
    },

    // Labels for menu items this project adds itself (see custom_menu_commands.js, custom_filter.js, hall_of_fame.js and tables_to_discover.js).
    customMenuLabels: {
        challengeTables: "Tavoli della sfida",
        hallOfFameFilter: "Hall of Fame",
        tablesToDiscoverFilter: "Tables to Discover", // TODO: translation pass
        originalTablesFilter: "Tavoli originali",
        randomGame: "Avvia un tavolo casuale",
        tableOfTheDay: "Avvia il tavolo del giorno",
        tableOfTheWeek: "Avvia il tavolo della settimana",
        tableSetup: "Configurazione del tavolo",
    },

    achievements: {
        dailyFirstPlayTitle: () => "Ciao, tavolo del giorno!",
        dailyFirstPlayDescription: () => "Avviare il tavolo del giorno per la prima volta.",
        weeklyFirstPlayTitle: () => "Appuntamento settimanale",
        weeklyFirstPlayDescription: () => "Avviare il tavolo della settimana per la prima volta.",
        dailyPeriodsPlayedTitles: {
            10: "Esploratore della domenica",
            25: "Esploratore curioso",
            50: "Esploratore esperto",
            100: "Indiana Flippers",
        },
        dailyPeriodsPlayedDescription: (days) => `Avviare il tavolo del giorno in ${days} giorni diversi.`,
        weeklyPeriodsPlayedTitles: {
            4: "Un mese di appuntamenti",
            10: "Habitué della settimana",
            26: "Sei mesi di fedeltà",
            52: "Un anno e non sentirlo",
        },
        weeklyPeriodsPlayedDescription: (weeks) => `Avviare il tavolo della settimana in ${weeks} settimane diverse.`,
        dailyStreakTitles: {
            3: "Non c'è due senza tre",
            7: "Settimana perfetta",
            14: "Due settimane di ferro",
            30: "Monaco del flipper",
        },
        dailyStreakDescription: (days) => `Avviare il tavolo del giorno per ${days} giorni di fila.`,
        weeklyStreakTitles: {
            4: "Un mese senza errori",
            12: "Abbonato fedele",
        },
        weeklyStreakDescription: (weeks) => `Avviare il tavolo della settimana per ${weeks} settimane di fila.`,
        manufacturerCompletionTitle: (manufacturer) => `Fan assoluto di ${manufacturer}`,
        manufacturerCompletionDescription: (manufacturer, count) => `Giocare almeno una volta tutti i ${count} tavoli ${manufacturer}.`,
        firstTableTitle: () => "Primi passi",
        firstTableDescription: () => "Giocare il tuo primissimo tavolo.",
        collectionPercentTitles: {
            10: "Il gusto del metallo",
            25: "Collezionista in erba",
            50: "Metà partita",
            75: "Quasi tutto visto",
            100: "Non mi sfugge niente",
        },
        collectionPercentDescription: (percent, playedCount, totalCount) => `Giocare ${playedCount} tavoli su ${totalCount} (${percent}% della tua collezione).`,
        worldTourTitle: () => "Giro del mondo",
        worldTourDescription: () => "Scorrere tutti i tavoli della ruota in una volta sola, senza avviarne nessuno.",
        playTimeMilestoneTitles: {
            1: "Riscaldamento",
            5: "Si fa sul serio",
            10: "Malato di flipper",
            50: "Flipper nel sangue",
            100: "Leggenda del tilt",
        },
        playTimeMilestoneDescription: (hours) => `Accumulare più di ${hours} or${hours > 1 ? "e" : "a"} di gioco.`,
        decadeCompletionTitle: (decadeStartYear) => `Viaggio negli anni ${decadeStartYear}`,
        decadeCompletionDescription: (decadeStartYear, count) => `Giocare almeno una volta tutti i ${count} tavoli degli anni ${decadeStartYear}.`,
        categoryCompletionTitle: (category) => `Maestro ${category}`,
        categoryCompletionDescription: (category, count) => `Giocare almeno una volta tutti i ${count} tavoli "${category}".`,
        marathonTitles: {
            30: "Piccola maratona",
            60: "Maratoneta",
        },
        marathonDescription: (minutes) => `Giocare una singola sessione di oltre ${minutes} minuti.`,
        rageQuitTitle: () => "Abbandono per rabbia?!",
        rageQuitDescription: (minSeconds, maxSeconds) => `Lasciare un tavolo dopo appena ${minSeconds}-${maxSeconds} secondi...`,
        grandReturnTitle: () => "Il grande ritorno",
        grandReturnDescription: (days) => `Rigiocare un tavolo dopo ${days} o più giorni di assenza.`,
        // A Secret Achievement's hint, shown instead of its description while it is missing.
        rageQuitHint: () => "Ci sono giorni in cui un tavolo proprio non gira...",
        grandReturnHint: () => "I vecchi amici sono sempre felici di rivederti...",
        worldTourHint: () => "Certi viaggi si fanno senza mai premere Start...",
        // TODO: translation pass
        nightOwlTitle: () => "Night Owl",
        nightOwlDescription: (from, to) => `Start a game between ${from} and ${to}.`,
        nightOwlHint: () => "Pinball never sleeps...",
        fullMoonNightTitle: () => "Full Moon Night",
        fullMoonNightDescription: (from, to, percent) => `Start a game between ${from} and ${to} while the moon is at least ${percent}% lit.`,
        fullMoonNightHint: () => "Some nights, even werewolves play pinball...",
        fridayThe13thTitle: () => "Friday the 13th",
        fridayThe13thDescription: () => "Start a game on a Friday the 13th.",
        fridayThe13thHint: () => "Some days, better not walk under a ladder...",
        lunchBreakTitle: () => "Lunch Break",
        lunchBreakDescription: (from, to) => `Start a game between ${from} and ${to}, Monday to Friday.`,
        lunchBreakHint: () => "A sandwich in one hand, the flipper in the other...",
        mirrorHourTitle: () => "Mirror Hour",
        mirrorHourDescription: () => "Start a game at a time whose hours match its minutes, such as 11:11.",
        mirrorHourHint: () => "Make a wish...",
        fourSeasonsTitle: () => "Four Seasons",
        fourSeasonsDescription: (count) => `Play at least once in each of the ${count} seasons.`,
        fourSeasonsHint: () => "Pinball is all year round...",
        oneMoreGameTitle: () => "One More Game!",
        oneMoreGameDescription: (count) => `Play the same table ${count} times in a row.`,
        oneMoreGameHint: () => "When you love, you don't count...",
        timeTravelTitle: () => "Time Travel",
        timeTravelDescription: (count) => `Play ${count} games in a row, each on a table from an older decade than the one before.`,
        timeTravelHint: () => "What if we went back in time...",
        randomGamesTitles: {
            10: "E perché no?",
            25: "Testa o croce",
            50: "Giocatore di dadi",
            100: "Adoooooro il caso",
        },
        randomGamesDescription: (count) => `Giocare ${count} tavoli a caso.`,
        challengesCompletedTitles: {
            1: "Prima sfida",
            5: "Amante delle sfide",
            10: "Cercatore di sfide",
            25: "Cacciatore di sfide",
            50: "Maestro delle sfide",
            100: "Leggenda della settimana",
        },
        challengesCompletedDescription: (count) => (count === 1 ? "Completare una sfida." : `Completare ${count} sfide.`),
        dayManufacturersTitles: {
            3: "Giro del mondo express",
            5: "Farfalla del flipper",
            8: "Infedele seriale",
            10: "Casanova del flipper",
        },
        dayManufacturersDescription: (count) => `Giocare tavoli di ${count} produttori diversi nello stesso giorno.`,
        // Header of the Achievement Toast card.
        toastHeader: "Obiettivo sbloccato",
    },

    achievementList: {
        menuEntry: "Elenco degli obiettivi",
        // The header's title, the section titles, the key caps and the
        // footer's hints are shown in capitals.
        title: "Elenco degli obiettivi",
        totalLine: (unlockedCount, totalCount, percent) => `${unlockedCount} / ${totalCount} obiettivi sbloccati (${percent}%)`,
        unlockedSection: "Obiettivi sbloccati",
        missingSection: "Obiettivi da ottenere",
        // After a section's title.
        sectionCount: (count) => `(${count})`,
        // PinballY's button names, as on the cabinet's key caps.
        keyCaps: { next: "Next", prev: "Prev", exit: "Exit" },
        browse: "Sfoglia",
        back: "Indietro",
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
        menuEntry: "Statistiche",
        // TODO: translation pass
        closeTooltip: "Close",
        // The buttons at the card's foot.
        buttons: {
            achievements: "Achievements",
            mostPlayedTables: "Most Played Tables",
            tablesToDiscover: "Tables to Discover",
        },
        // The card's Player Level: its title over the big digits, then the
        // points so far and those of the next level, thousands separated.
        playerLevel: {
            title: "LEVEL",
            current: (points, nextLevelPoints) => `Current: ${points} / ${nextLevelPoints}`,
        },
        collectionTitle: "COLLECTION MASTERY",
        sections: {
            game: "GAME",
            progression: "PROGRESSION",
            tastes: "TASTES",
        },
        // The stats' labels, over their values.
        stats: {
            gamesPlayed: "Games played",
            totalTime: "Total time",
            averageDuration: "Average game",
            collection: "Collection",
            challengesCompleted: "Challenges completed",
            dayStreak: "Daily streak",
            weekStreak: "Weekly streak",
            favouriteManufacturer: "Favorite manufacturer",
            favouriteDecade: "Favorite decade",
            favouriteTable: "Most played table",
            firstTablePlayed: "First table played",
        },
        // Thousands separated: "1,206".
        number: (count) => String(count).replace(/\B(?=(\d{3})+(?!\d))/g, ","),
        // Minutes on two digits: "96 h 05".
        hoursAndMinutes: (hours, minutes) => `${hours} h ${String(minutes).padStart(2, "0")}`,
        minutes: (minutes) => `${minutes} min`,
        fraction: (count, total) => `${count}/${total}`,
        // The share of the collection played, in a pill.
        percent: (percent) => `${percent}%`,
        // A Streak's longest, in a pill; or the record set right now.
        record: (longest) => `Record: ${longest}`,
        recordInProgress: "New record!",
        // A favourite's play time, in a pill; its hours and minutes given.
        playTime: (time) => `${time} played`,
        // The favourite decade, by its start year: 1990 for 1990 to 1999.
        decade: (decadeStartYear) => `${decadeStartYear}s`,
        // The first table played's date, day and month on two digits.
        playedOn: (day, month, year) => `on ${month}/${day}/${year}`,
        // A stat without a value, such as the average before any Play.
        none: "—",
    },

    // Profiles. Guest's folder name is never shown: this is its name.
    profiles: {
        menuEntry: "Cambia giocatore",
        pickerTitle: "Chi gioca?",
        pickerHint: "Flipper: scorri · Start: scegli · Exit: annulla",
        guestName: "Ospite",
        greeting: name => `Ciao ${name}!`,
    },

    // The Profile Reset, in PinballY's Exit menu for an Admin Profile.
    profileReset: {
        menuEntry: "Azzera un profilo",
        listTitle: "Quale profilo riparte da zero?",
        confirm: name => `Azzerare ${name}? Tutte le sue partite, serie, sfide e obiettivi saranno cancellati.`,
        yes: "Sì, azzera",
        no: "No",
        cancel: "Annulla",
        // TODO: translation pass
        done: name => `${name} starts over.`,
        failed: name => `${name} could not be reset. See the log for details.`,
        ok: "OK",
        everyProfile: "Every profile",
        confirmEvery: count => `Reset all ${count} profiles? All of their plays, streaks, Challenges and achievements will be erased.`,
        everyDone: count => `All ${count} profiles start over.`,
        everyFailed: (count, names) => `Profiles reset: ${count}. ${names.join(", ")} could not be reset. See the log for details.`,
    },

    // The clock at the top left of the wheel screen.
    clock: {
        time: (hours, minutes) => `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    },

    // The Challenge Card, at the top right of the wheel screen (see common/challenge_card.js).
    challenges: {
        cardHeader: "Sfida della settimana",
        titles: {
            differentTables: (target) => `Giocare ${target} tavoli diversi`,
            manufacturerTables: (target, manufacturer) => `Giocare ${target} tavoli ${manufacturer} diversi`,
            decadeTables: (target, decade) => `Giocare ${target} tavoli diversi degli anni ${decade}`,
            differentManufacturers: (target) => `Giocare tavoli di ${target} produttori diversi`,
            differentDecades: (target) => `Giocare tavoli di ${target} decenni diversi`,
            neverPlayedTables: (target) => `Giocare ${target} tavoli mai giocati`,
            dustyTables: (target) => `Giocare ${target} tavoli non giocati da sei mesi`,
            tableOfTheDayDays: (target) => `Giocare il tavolo del giorno in ${target} giorni diversi`,
            tableOfTheWeekGames: (target) => `Giocare ${target} partite sul tavolo della settimana`,
            activeDays: (target) => `Giocare in ${target} giorni diversi`,
            endurance: (target) => `Giocare ${target} minuti su uno stesso tavolo`,
            marathon: (target) => `Giocare ${target} minuti in totale`,
            randomGames: (target) => `Giocare ${target} partite a caso`,
            sameTableGames: (target) => `Giocare ${target} partite su uno stesso tavolo`,
        },
        progress: (value, target, daysText) => `${value}/${target} · ${daysText}`,
        daysLeft: (days) => `ancora ${days} giorni`,
        lastDay: "ultimo giorno",
        completed: "Sfida completata!",
        verdictHeader: "Sfida precedente",
        missed: (reached, target) => `Mancata · ${reached}/${target}`,
        toastHeader: "Sfida completata",
        toastDescription: (count) => (count === 1 ? "Prima sfida completata" : `${count} sfide completate`),
    },

    // The Mastery Bar, under the Challenge Card (see common/mastery_bar.js), and the
    // Collection Mastery's texts.
    tableMastery: {
        // Collection Mastery: the goal toward the next Collection Tier
        // (that many tables at the level of that name), how many tables
        // already reach it, or, at the last tier, that all of them did.
        collection: {
            goal: (count, levelName) => `Goal: ${count} ${count === 1 ? "table" : "tables"} at ${levelName}`,
            current: (reached, needed) => `Current: ${reached}/${needed}`,
            allTables: (levelName) => `All your tables: ${levelName}`,
        },
        // TODO: translation pass
        levelNames: ["Rookie", "Apprentice", "Regular", "Adept", "Specialist", "Ace", "Virtuoso", "Prodigy", "Legend", "Pinball Wizard"],
        toDiscover: "To discover",
        toastHeader: "Table Mastery",
        toastTitle: (name, level) => `${name} (${level})`,
        // TODO: translation pass
        collectionToastHeader: "Collection Mastery",
        collectionToastTitle: (tier, name) => `Tier ${tier}: ${name}`,
        collectionToastDescription: (count, name) => `${count} ${count === 1 ? "table" : "tables"} at ${name} or above`,
    },
    // TODO: translation pass
    playerLevel: {
        toastHeader: "Level up",
        toastTitle: (level) => `Level ${level}`,
        toastDescription: "Your Achievements took you to a new level.",
    },
};
