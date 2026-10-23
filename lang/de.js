// ============================================================
// German translations for PinballY's UI.
// Save this file as UTF-8 with BOM so accented characters display correctly.
// ============================================================

// The active Profile's play time of a table, as PinballY writes its own.
const formatPlayTime = (hours, minutes) => (hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")} Stunden`
    : `${minutes} Minute${minutes === 1 ? "" : "n"}`);

// Hours of play with one decimal, as an Achievement Progress shows them.
const formatHours = hours => hours.toFixed(1).replace(".", ",");

export default {
    // Direct translations of PinballY's native menu titles.
    nativeMenuLabels: {
        "About PinballY": "Über PinballY",
        "Add Media": "Medien hinzufügen",
        "Add to Favorites": "Zu den Favoriten hinzufügen",
        "Adjust Audio Volume": "Lautstärke einstellen",
        "All Games": "Alle Tische",
        "All Tables": "Alle Tische",
        "Batch Capture": "Stapelaufnahme",
        "Batch Capture lets you capture screen shot images and videos for multiple games.  Step 1: select which games to include in the capture process:": "Mit der Stapelaufnahme können Sie Screenshots und Videos für mehrere Tische aufnehmen. Schritt 1: Wählen Sie die Tische aus, die in den Aufnahmevorgang einbezogen werden sollen:",
        "Begin Capture": "Aufnahme starten",
        "Cancel": "Abbrechen",
        "Capture images & videos": "Bilder und Videos aufnehmen",
        "Confirm Power Off": "Ausschalten bestätigen",
        "Delete game details": "Tischdetails löschen",
        "Edit category names...": "Kategorienamen bearbeiten...",
        "Edit game details...": "Tischdetails bearbeiten...",
        "Enable Videos": "Videos aktivieren",
        "Exit": "Beenden",
        "Exit PinballY": "PinballY beenden",
        "Favorites": "Favoriten",
        "Filter by Category": "Nach Kategorie filtern",
        "Filter by Date Added": "Nach Hinzufügedatum filtern",
        "Filter by Era": "Nach Epoche filtern",
        "Filter by Last Played": "Nach zuletzt gespielt filtern",
        "Filter by Manufacturer": "Nach Hersteller filtern",
        "Filter by Rating": "Nach Bewertung filtern",
        "Filter by System": "Nach System filtern",
        "Find game media online": "Spielemedien online suchen",
        "Games marked for batch capture": "Für die Stapelaufnahme markierte Tische",
        "Game Setup": "Tischkonfiguration",
        "Help": "Hilfe",
        "Hide this game": "Diesen Tisch ausblenden",
        "High Scores": "Highscores",
        "In Favorites": "In den Favoriten",
        "Information": "Informationen",
        "Instruction Card": "Anleitungskarte",
        "Mark for Batch Capture": "Für die Stapelaufnahme markieren",
        "Marked for Batch Capture": "Für die Stapelaufnahme markiert",
        "Mute Attract Mode": "Ton im Attraktionsmodus ausschalten",
        "Mute Buttons": "Tastentöne ausschalten",
        "Mute Table Audio": "Tischton ausschalten",
        "Mute Videos": "Videoton ausschalten",
        "Operator Menu": "Betreibermenü",
        "Options": "Optionen",
        "PinballY Options...": "Optionen...",
        "Play": "Spielen",
        "Play Game": "Spiel starten",
        "Power Off": "Computer ausschalten",
        "Proceed": "Fortfahren",
        "Rate Table": "Tisch bewerten",
        "Reset Coins/Credits": "Münzen/Guthaben zurücksetzen",
        "Resume Game": "Spiel fortsetzen",
        "Return": "Zurück",
        "Save": "Speichern",
        "Search": "Suchen",
        "Select categories": "Kategorien auswählen",
        "Show Hidden Games": "Ausgeblendete Tische anzeigen",
        "Show Media Files": "Mediendateien anzeigen",
        "Show Unconfigured Games": "Nicht konfigurierte Tische anzeigen",
        "Skip this message next time": "Diese Meldung beim nächsten Mal nicht mehr anzeigen",
        "Terminate Game": "Spiel beenden",
        "The capture process records the exact same areas of the screen where your PinballY windows are located.  Before proceeding, make sure that your PinballY window layout matches the screen layout of the game you're about to record.  For example, if the game's playfield is full-screen, make sure PinballY's playfield window is full-screen.": "Der Aufnahmevorgang zeichnet genau die Bereiche des Bildschirms auf, in denen sich Ihre PinballY-Fenster befinden. Bevor Sie fortfahren, stellen Sie sicher, dass die Anordnung Ihrer PinballY-Fenster der Bildschirmaufteilung des Spiels entspricht, das Sie aufnehmen möchten. Wenn beispielsweise das Spielfeld des Spiels den gesamten Bildschirm ausfüllt, stellen Sie sicher, dass auch das Spielfeldfenster von PinballY den gesamten Bildschirm ausfüllt.",
        "This will launch a Web browser window to search for media files for this game.  Look for a \"HyperPin Media Pack\" file.  Download the file and drag it onto this window to install it.\n\nNote that you can drop a Media Pack file onto this window at any time to install media for the currently selected game.  This menu step isn't required to install media; it's just a convenience for launching a Web search.": "Dies öffnet ein Webbrowser-Fenster, um Mediendateien für diesen Tisch zu suchen. Suchen Sie nach einer Datei mit dem Namen \"HyperPin Media Pack\". Laden Sie die Datei herunter und ziehen Sie sie auf dieses Fenster, um sie zu installieren.\n\nBeachten Sie, dass Sie jederzeit eine Media-Pack-Datei auf dieses Fenster ziehen können, um Medien für den aktuell ausgewählten Tisch zu installieren. Dieser Menüpunkt ist nicht erforderlich, um Medien zu installieren; er dient lediglich als praktische Möglichkeit, eine Websuche zu starten.",
        "Uncategorized": "Nicht kategorisiert",
        "Yes, add to current game": "Ja, zum aktuellen Tisch hinzufügen",
        "You must enter the game's bibliographic information (title, system, etc.) before adding media files for the game.  The game information is used to determine the folder locations and file names for the game's media files, so it has to be entered before media files can be added to the game.": "Sie müssen die bibliografischen Informationen des Tisches (Titel, System usw.) eingeben, bevor Sie Mediendateien für den Tisch hinzufügen können. Diese Informationen werden verwendet, um die Ordnerpfade und Dateinamen für die Mediendateien des Tisches zu bestimmen, daher müssen sie eingegeben werden, bevor Mediendateien hinzugefügt werden können.",
        "Flyer": "Flyer",
        "Pinscape Night Mode": "Pinscape-Nachtmodus",
        "Hidden Tables": "Ausgeblendete Tische",
        "Unconfigured Tables": "Nicht konfigurierte Tische",
        "Tables played within:": "Gespielt innerhalb von:",
        "Tables not played within:": "Nicht gespielt seit:",
        "Tables added within:": "Hinzugefügt innerhalb von:",
        "Tables added more than:": "Hinzugefügt vor mehr als:",
        "A week": "Einer Woche",
        "A month": "Einem Monat",
        "A year": "Einem Jahr",
        "A week ago": "Einer Woche",
        "A month ago": "Einem Monat",
        "A year ago": "Einem Jahr",
        "Never played": "Nie gespielt",
        "Batch Capture Step 2: Select the media types you'd like to capture for the selected games.  (You'll be able to say what to do about existing files in the next step.)": "Stapelaufnahme, Schritt 2: Wählen Sie die Medientypen, die für die ausgewählten Tische aufgenommen werden sollen. (Was mit vorhandenen Dateien geschieht, legen Sie im nächsten Schritt fest.)",
        "Batch Capture Step 3: For each type, indicate if you'd like to capture the item for EVERY game, even for games that already have existing media of the same type, or if you'd only like to capture missing items.": "Stapelaufnahme, Schritt 3: Geben Sie für jeden Typ an, ob er für JEDEN Tisch aufgenommen werden soll, auch für Tische mit vorhandenen Medien dieses Typs, oder nur dort, wo er fehlt.",
        "Next Step": "Nächster Schritt",
        "Missing only": "Nur fehlende",
        "Capture all": "Alle aufnehmen",
        "View Capture List": "Aufnahmeliste anzeigen",
        "Please select the system to use to launch this table:": "Wählen Sie das System, mit dem dieser Tisch gestartet werden soll:",
        "Yes, run as Admin": "Ja, als Administrator ausführen",
        "No, cancel": "Nein, abbrechen",
        "Allow (this session only)": "Erlauben (nur diese Sitzung)",
        "Allow (always)": "Erlauben (immer)",
        "Yes, delete it": "Ja, löschen",
    },

    // Labels for the media-capture screen's "Item: Action" lines
    // (e.g. "Playfield Image: Skip"), combined via dynamicLabelBuilders.captureItemAction.
    mediaCaptureItemLabels: {
        "Backglass Image": "Backglass-Bild",
        "Backglass Video": "Backglass-Video",
        "Flyer Image": "Flyer-Bild",
        "Instruction Card": "Anleitungskarte",
        "Playfield Image": "Spielfeldbild",
        "Playfield Video": "Spielfeldvideo",
        "Table Audio": "Tischaudio",
        "Wheel Image": "Wheel-Bild",
        "DMD Image": "DMD-Bild",
        "DMD Video": "DMD-Video",
        "Topper Image": "Topper-Bild",
        "Topper Video": "Topper-Video",
        "Launch Audio": "Startaudio",
        "Real DMD Image": "Bild des echten DMD",
        "Real DMD Video": "Video des echten DMD",
        "Real RGB DMD Image": "Bild des echten RGB-DMD",
        "Real RGB DMD Video": "Video des echten RGB-DMD",
    },
    mediaCaptureActionLabels: {
        "Add": "Hinzufügen",
        "Capture": "Aufnehmen",
        "Capture Silent": "Ohne Ton aufnehmen",
        "Capture w/Audio": "Mit Audio aufnehmen",
        "Keep Existing": "Vorhandenes behalten",
        "Replace Existing": "Vorhandenes ersetzen",
        "Skip": "Überspringen",
    },

    // Status text shown in PinballY's launch overlay, keyed by the
    // language-independent event id (see the "launchoverlaymessage" event).
    launchOverlayMessages: {
        "after": "",
        "capturing": "Aufnahme läuft...",
        "gameover": "Game Over",
        "init": "",
        "launching": "Wird geladen...",
        "running": "Tisch wird gestartet...",
        "terminating": "Zurück zur Spieleliste...",
    },

    // The step under way, written in gold beneath the Loader while a
    // table launches or closes (Seamless Launch Overlay).
    // TODO: translation pass
    launchSteps: {
        loading: "Loading…",
        closing: "Returning to tables…",
        capturing: "Capturing…",
    },

    // Functions that build translated titles for PinballY's dynamically
    // generated menu text (category names, star ratings, etc.).
    dynamicLabelBuilders: {
        captureInstructions: (seconds) => {
            const plural = seconds === "1" ? "" : "en";
            return `Wählen Sie die aufzunehmenden Elemente aus und klicken Sie dann auf Aufnahme starten. Dadurch wird Ihr Spiel gestartet, die Bildschirmaufnahmen werden erstellt und das Spiel wird nach Abschluss automatisch beendet. Der Vorgang dauert etwa ${seconds} Sekunde${plural}. (!) bedeutet, dass ein vorhandenes Element ersetzt wird.`;
        },
        captureInstructionsOneMinute: () =>
            "Wählen Sie die aufzunehmenden Elemente aus und klicken Sie dann auf Aufnahme starten. Dadurch wird Ihr Spiel gestartet, die Bildschirmaufnahmen werden erstellt und das Spiel wird nach Abschluss automatisch beendet. Der Vorgang dauert etwa 1 Minute. (!) bedeutet, dass ein vorhandenes Element ersetzt wird.",
        captureItemAction: (item, action) => `${item}: ${action}`,
        decadeTables: (decade) => `Tische der ${decade}er-Jahre`,
        genericTables: (name) => `Tische ${name}`,
        mediaGameMismatchWarning: (draggedGame, currentGame) =>
            `Es sieht so aus, als wären einige der Mediendateien, die Sie hinzufügen, für einen anderen Tisch bestimmt: "${draggedGame}". Mediendateien werden immer dem auf dem Wheel ausgewählten Tisch hinzugefügt, aktuell "${currentGame}". Möchten Sie diese Medienelemente trotzdem dem aktuellen Tisch hinzufügen?`,
        mediaGameMismatchWarningMultiple: (gameList, currentGame) =>
            `Es sieht so aus, als wären einige der Mediendateien, die Sie hinzufügen, für andere Tische bestimmt: ${gameList}. Mediendateien werden immer dem auf dem Wheel ausgewählten Tisch hinzugefügt, aktuell "${currentGame}". Möchten Sie diese Medienelemente trotzdem dem aktuellen Tisch hinzufügen?`,
        mediaReadyToAdd: (gameName) =>
            `Die folgenden Medienelemente sind bereit, für ${gameName} hinzugefügt zu werden. Wählen Sie die Elemente aus, die Sie hinzufügen oder ersetzen möchten.`,
        starTables: (count) => `Tische mit ${count} Stern${count > 1 ? "en" : ""}`,
        startDelay: (seconds) => `Startverzögerung einstellen (${seconds} Sek.)`,
        unratedTables: () => "Nicht bewertete Tische",
        batchCaptureReady: (count, duration) => `Die Stapelaufnahme ist bereit! ${count} Tisch(e) werden einbezogen; das dauert etwa ${duration}.`,
        confirmDeleteGameDetails: (title) => `Die Tischdetails von ${title} wirklich löschen? (Nur die bibliografischen Angaben werden gelöscht, keine Tischdateien oder Medien.)`,
        showCustomView: (name) => `${name} anzeigen`,
        durationSeconds: (count) => `${count} Sekunde${count === 1 ? "" : "n"}`,
        durationMinutes: (count) => `${count} Minute${count === 1 ? "" : "n"}`,
        durationHours: (hours, minutes) => (minutes > 0 ? `${hours} Std. ${minutes} Min.` : `${hours} Stunde${hours === 1 ? "" : "n"}`),
    },

    ratingPrompt: {
        message: (tableTitle, minutes) =>
            `Sie haben "${tableTitle}" seit über ${minutes} Minuten gespielt! Möchten Sie ihn jetzt bewerten?`,
        rateNow: "Jetzt bewerten",
        notNow: "Später",
    },

    // The Button Hints at the foot of every drawn screen and the Exit
    // Button's tooltip (see GLOSSARY.md). The key caps and the footer's
    // words are shown in capitals.
    buttonHints: {
        // PinballY's button names, as on the cabinet's key caps.
        keyCaps: { next: "Next", prev: "Prev", select: "Select", exit: "Exit" },
        browse: "Blättern",
        // The flippers on a High Score Board longer than the window.
        scroll: "Scroll", // TODO: translation pass
        choose: "Choose", // TODO: translation pass
        // Exit's word and the Exit Button's tooltip: Back where Exit brings
        // back a screen or a menu, Close where it leaves the bare wheel.
        back: "Zurück",
        close: "Close", // TODO: translation pass
    },

    // TODO: translation pass
    welcomeScreen: {
        greetings: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", night: "Still up" },
        greetingWithName: (greeting, name) => [`${greeting}, `, name, "!"],
        greetingAlone: (greeting) => `${greeting}!`,
        stayOn: (tableTitle) => `Stay on ${tableTitle}`,
        stayOnWheel: "Stay on the wheel",
        randomTable: "Launch a random table",
        menuEntry: "Welcome Screen",
        // The active Profile's Daily Streak under the greeting, from 2 days
        // on, its count shown in a square before the text.
        // TODO: translation pass
        cabinetStreak: {
            notYetToday: "days in a row on the cabinet: keep it going!",
            playedToday: "days in a row on the cabinet",
        },
        lostRecord: (taker, tableTitle) => `${taker} took your record on ${tableTitle}`, // TODO: translation pass
        // TODO: translation pass
        lostRecords: (records, moreCount) => {
            const named = records.map(record => `${record.tableTitle} (${record.taker})`);
            return moreCount > 0
                ? `Records lost: ${named.join(", ")} and ${moreCount} more`
                : `Records lost: ${named.slice(0, -1).join(", ")} and ${named[named.length - 1]}`;
        },
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
        manufacturer: (position) => `Tisch ${position}/[Filter.Count] - hergestellt von [Game.Manuf].`,
        manufacturerFictional: (position) => `Tisch ${position}/[Filter.Count] - Fiktiver Flipper.`,
        playCount: (position, count) => `Tisch ${position}/[Filter.Count] - ${count}-mal gestartet.`,
        playTime: (position, hours, minutes) => `Tisch ${position}/[Filter.Count] - ${formatPlayTime(hours, minutes)} lang gespielt.`,
        year: (position) => `Tisch ${position}/[Filter.Count] - veröffentlicht im Jahr [Game.Year].`,
    },

    // Upper status line messages, after the player's own from PinballY's options.
    // [Filter.Count] is a PinballY placeholder — keep it as-is.
    upperStatusLines: {
        welcome: name => `Willkommen, ${name}!`,
        tablesAvailable: "[Filter.Count] Tische sind verfügbar!",
        launchHint: "Start-Taste, um einen Tisch zu starten.",
        browseHint: "Linker/rechter Flipper, um die Tische durchzublättern.",
        signOff: "Viel Spaß!",
    },

    // Labels for menu items this project adds itself (see custom_menu_commands.js, custom_filter.js, hall_of_fame.js and tables_to_discover.js).
    customMenuLabels: {
        challengeTables: "Tische für die Herausforderung",
        hallOfFameFilter: "Hall of Fame",
        myHighScoresFilter: "My High Scores", // TODO: translation pass
        hiddenTablesFilter: "Hidden Tables", // TODO: translation pass
        tablesToDiscoverFilter: "Tables to Discover", // TODO: translation pass
        originalTablesFilter: "Original-Tische",
        tableSetup: "Tischkonfiguration",
        tableScores: "Table Scores", // TODO: translation pass
        filterPickerBack: "Back", // TODO: translation pass
        activeFilter: (name) => `Active filter: ${name}`, // TODO: translation pass
        // The Drawn main menu's "Change Filter" entry, and its footer's label before the Active Filter.
        changeFilter: "Change Filter", // TODO: translation pass
        activeFilterLabel: "Active filter:", // TODO: translation pass
    },

    achievements: {
        dailyFirstPlayTitle: () => "Hallo, Tisch des Tages!",
        dailyFirstPlayDescription: () => "Den Tisch des Tages zum ersten Mal starten.",
        weeklyFirstPlayTitle: () => "Wöchentliches Rendezvous",
        weeklyFirstPlayDescription: () => "Den Tisch der Woche zum ersten Mal starten.",
        dailyPeriodsPlayedTitles: {
            10: "Sonntagsentdecker",
            25: "Neugieriger Entdecker",
            50: "Erfahrener Entdecker",
            100: "Indiana Flippers",
        },
        dailyPeriodsPlayedDescription: (days) => `Den Tisch des Tages an ${days} verschiedenen Tagen starten.`,
        weeklyPeriodsPlayedTitles: {
            4: "Ein Monat voller Dates",
            10: "Stammgast der Woche",
            26: "Sechs Monate Treue",
            52: "Ein Jahr und keine Falte",
        },
        weeklyPeriodsPlayedDescription: (weeks) => `Den Tisch der Woche in ${weeks} verschiedenen Wochen starten.`,
        dailyStreakTitles: {
            3: "Aller guten Dinge sind drei",
            7: "Perfekte Woche",
            14: "Zwei eiserne Wochen",
            30: "Flipper-Mönch",
        },
        dailyStreakDescription: (days) => `Den Tisch des Tages ${days} Tage in Folge starten.`,
        weeklyStreakTitles: {
            4: "Ein Monat ohne Fehler",
            12: "Treuer Abonnent",
        },
        weeklyStreakDescription: (weeks) => `Den Tisch der Woche ${weeks} Wochen in Folge starten.`,
        manufacturerCompletionTitle: (manufacturer) => `Absoluter ${manufacturer}-Fan`,
        manufacturerCompletionDescription: (manufacturer, count) => `Alle ${count} Tische von ${manufacturer} mindestens einmal spielen.`,
        firstTableTitle: () => "Erste Schritte",
        firstTableDescription: () => "Den allerersten Tisch spielen.",
        collectionPercentTitles: {
            10: "Der Geschmack von Metall",
            25: "Angehender Sammler",
            50: "Halbzeit",
            75: "Fast alles gesehen",
            100: "Mir entgeht nichts",
        },
        collectionPercentDescription: (percent, playedCount, totalCount) => `${playedCount} von ${totalCount} Tischen spielen (${percent} % der Sammlung).`,
        worldTourTitle: () => "Weltreise",
        worldTourDescription: () => "Alle Tische des Rads in einem Zug durchblättern, ohne einen zu starten.",
        playTimeMilestoneTitles: {
            1: "Aufwärmen",
            5: "Jetzt wird's ernst",
            10: "Flippersüchtig",
            50: "Flippern im Blut",
            100: "Tilt-Legende",
        },
        playTimeMilestoneDescription: (hours) => `Insgesamt mehr als ${hours} Stunde${hours > 1 ? "n" : ""} spielen.`,
        decadeCompletionTitle: (decadeStartYear) => `Reise in die ${decadeStartYear}er`,
        decadeCompletionDescription: (decadeStartYear, count) => `Alle ${count} Tische der ${decadeStartYear}er mindestens einmal spielen.`,
        categoryCompletionTitle: (category) => `${category}-Meister`,
        categoryCompletionDescription: (category, count) => `Alle ${count} Tische der Kategorie "${category}" mindestens einmal spielen.`,
        marathonTitles: {
            30: "Kleiner Marathon",
            60: "Marathonläufer",
        },
        marathonDescription: (minutes) => `Eine einzige Session von über ${minutes} Minuten spielen.`,
        // TODO: translation pass
        cabinetStreakTitles: {
            3: "Back for More",
            7: "A Week at the Cabinet",
            15: "Cabinet Regular",
            30: "Part of the Furniture",
        },
        // TODO: translation pass
        cabinetStreakDescription: (days) => `Play on the cabinet ${days} days in a row, any table.`,
        rageQuitTitle: () => "Wutausstieg?!",
        rageQuitDescription: (minSeconds, maxSeconds) => `Einen Tisch nach nur ${minSeconds} bis ${maxSeconds} Sekunden verlassen...`,
        grandReturnTitle: () => "Die große Rückkehr",
        grandReturnDescription: (days) => `Einen Tisch nach ${days} oder mehr Tagen Pause wieder spielen.`,
        // A Secret Achievement's hint, shown instead of its description while it is missing.
        rageQuitHint: () => "An manchen Tagen will ein Tisch einfach nicht...",
        grandReturnHint: () => "Alte Freunde freuen sich immer über ein Wiedersehen...",
        worldTourHint: () => "Manche Reisen gelingen, ohne je Start zu drücken...",
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
        // TODO: translation pass
        snackTimeTitle: () => "Snack Time",
        snackTimeDescription: () => "Start a game between 4 and 5 pm.",
        snackTimeHint: () => "Just one game before homework...",
        wednesdayOffTitle: () => "Wednesday Off",
        wednesdayOffDescription: () => "Start a game on a Wednesday afternoon.",
        wednesdayOffHint: () => "No school this afternoon...",
        grownUpRecordTakenTitle: () => "Beat the Grown-Ups",
        grownUpRecordTakenDescription: () => "Take a Table Record from a grown-up.",
        randomGamesTitles: {
            10: "Warum nicht?",
            25: "Kopf oder Zahl",
            50: "Würfelspieler",
            100: "Ich liiiiebe den Zufall",
        },
        randomGamesDescription: (count) => `${count} zufällige Tische spielen.`,
        challengesCompletedTitles: {
            1: "Erste Herausforderung",
            5: "Herausforderer",
            10: "Herausforderungssucher",
            25: "Herausforderungsjäger",
            50: "Meister der Herausforderungen",
            100: "Legende der Woche",
        },
        challengesCompletedDescription: (count) => (count === 1 ? "Eine Herausforderung schaffen." : `${count} Herausforderungen schaffen.`),
        // TODO: translation pass, the High Scores family
        highScoreTablesTitles: {
            1: "Initials in Stone",
            3: "Three Banners Raised",
            5: "Lord of the Five Boards",
            10: "The Kwisatz Hiscorach",
        },
        highScoreTablesDescription: (count) => (count === 1 ? "Win a High Score on a table." : `Win High Scores on ${count} different tables.`),
        tableRecordTablesTitles: {
            1: "One Score to Rule Them All",
            3: "Warlord of Three Worlds",
        },
        tableRecordTablesDescription: (count) => (count === 1 ? "Set a Table Record." : `Set Table Records on ${count} different tables.`),
        tableRecordTakenTitle: "The Usurper",
        tableRecordTakenDescription: "Take a Table Record from another Profile.",
        dayManufacturersTitles: {
            3: "Weltreise im Eiltempo",
            5: "Flipper-Schmetterling",
            8: "Serien-Untreuer",
            10: "Flipper-Casanova",
        },
        dayManufacturersDescription: (count) => `Am selben Tag Tische von ${count} verschiedenen Herstellern spielen.`,
        // Header of the Achievement Toast card.
        toastHeader: "Erfolg freigeschaltet",
    },

    achievementList: {
        menuEntry: "Erfolgsliste", // TODO: translation pass, now My Achievements
        // The header's title and the section titles are shown in capitals.
        title: "Erfolgsliste",
        totalLine: (unlockedCount, totalCount, percent) => `${unlockedCount} / ${totalCount} Erfolge freigeschaltet (${percent} %)`,
        unlockedSection: "Freigeschaltete Erfolge",
        missingSection: "Offene Erfolge",
        // After a section's title.
        sectionCount: (count) => `(${count})`,
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
        menuEntry: "Statistiken", // TODO: translation pass, now My Profile
        // TODO: translation pass
        // The buttons at the card's foot.
        buttons: {
            achievements: "Achievements",
            frame: "Frame", // TODO: translation pass, now Avatar Frames
            mostPlayedTables: "Most Played Tables",
            tablesToDiscover: "Tables to Discover",
            household: "Household Stats", // TODO: translation pass
        },
        // TODO: translation pass
        // The Household Stats opened from the Household button: the title and
        // the line labels the stats above do not have.
        household: {
            title: "Household Stats",
            lines: {
                playerLevel: "Player Level",
                collectionMastery: "Collection Mastery",
                achievementsUnlocked: "Achievements unlocked",
                dailyStreak: "Daily Streak",
            },
        },
        // The Avatar Frame list opened from the Frame button: its title, the
        // "no frame" row, the worn row's mark and a locked frame's condition.
        frameList: {
            title: "Avatar Frames",
            none: "None",
            worn: "Worn",
            unlockCondition: (tier) => `Collection Tier ${tier}`,
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
            highScoresHeld: "High Scores held", // TODO: translation pass
            tableRecordsHeld: "Table Records held", // TODO: translation pass
            // TODO: translation pass
            cabinetStreak: "Days in a row on the cabinet",
            dayStreak: "Table of the Day streak",
            weekStreak: "Table of the Week streak",
            favouriteManufacturer: "Favorite manufacturer",
            favouriteDecade: "Favorite decade",
            favouriteTable: "Most played table",
            firstTablePlayed: "First table played",
            lastTablePlayed: "Last table played",
        },
        // Thousands separated: "1,206".
        number: (count) => String(count).replace(/\B(?=(\d{3})+(?!\d))/g, ","),
        // Minutes on two digits: "96 h 05".
        hoursAndMinutes: (hours, minutes) => `${hours} h ${String(minutes).padStart(2, "0")}`,
        minutes: (minutes) => `${minutes} min`,
        fraction: (count, total) => `${count}/${total}`,
        // The share of the collection played, in a pill.
        percent: (percent) => `${percent}%`,
        // A Streak's longest, in a pill (gold while the current one sets it).
        record: (longest) => `Record: ${longest}`,
        // A favourite's play time, in a pill; its hours and minutes given.
        playTime: (time) => `${time} played`,
        // The favourite decade, by its start year: 1990 for 1990 to 1999.
        decade: (decadeStartYear) => `${decadeStartYear}s`,
        // The first or last table played's date, day and month on two digits.
        playedOn: (day, month, year) => `on ${month}/${day}/${year}`,
        // A stat without a value, such as the average before any Play.
        none: "—",
    },

    // Profiles. Guest's folder name is never shown: this is its name.
    profiles: {
        menuEntry: "Spieler wechseln",
        pickerTitle: "Wer spielt?",
        pickerHint: "Flipper: blättern · Start: wählen · Exit: abbrechen",
        guestName: "Gast",
        greeting: name => `Hallo ${name}!`,
    },

    // The Profile Reset, in PinballY's Exit menu for an Admin Profile.
    profileReset: {
        menuEntry: "Profil zurücksetzen",
        listTitle: "Welches Profil fängt von vorne an?",
        confirm: name => `${name} zurücksetzen? Alle Partien, Serien, Herausforderungen und Erfolge werden gelöscht.`,
        yes: "Ja, zurücksetzen",
        no: "Nein",
        cancel: "Abbrechen",
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

    // The Challenge Card, at the top right of the wheel screen (see common/challenges/challenge_card.js).
    challenges: {
        cardHeader: "Herausforderung der Woche",
        titles: {
            differentTables: (target) => `${target} verschiedene Tische spielen`,
            manufacturerTables: (target, manufacturer) => `${target} verschiedene ${manufacturer}-Tische spielen`,
            decadeTables: (target, decade) => `${target} verschiedene Tische aus den ${decade}ern spielen`,
            differentManufacturers: (target) => `Tische von ${target} verschiedenen Herstellern spielen`,
            differentDecades: (target) => `Tische aus ${target} verschiedenen Jahrzehnten spielen`,
            neverPlayedTables: (target) => `${target} nie gespielte Tische spielen`,
            dustyTables: (target) => `${target} seit sechs Monaten nicht gespielte Tische spielen`,
            tableOfTheDayDays: (target) => `Den Tisch des Tages an ${target} verschiedenen Tagen spielen`,
            tableOfTheWeekGames: (target) => `${target} Spiele auf dem Tisch der Woche spielen`,
            activeDays: (target) => `An ${target} verschiedenen Tagen spielen`,
            endurance: (target) => `${target} Minuten auf einem Tisch spielen`,
            marathon: (target) => `Insgesamt ${target} Minuten spielen`,
            randomGames: (target) => `${target} zufällige Spiele spielen`,
            sameTableGames: (target) => `${target} Spiele auf demselben Tisch spielen`,
        },
        progress: (value, target, daysText) => `${value}/${target} · ${daysText}`,
        daysLeft: (days) => `noch ${days} Tage`,
        lastDay: "letzter Tag",
        completed: "Herausforderung geschafft!",
        verdictHeader: "Vorherige Herausforderung",
        missed: (reached, target) => `Verpasst · ${reached}/${target}`,
        toastHeader: "Herausforderung geschafft",
        toastDescription: (count) => (count === 1 ? "Erste Herausforderung geschafft" : `${count} Herausforderungen geschafft`),
    },

    // The Mastery Bar, under the Challenge Card (see common/mastery/mastery_bar.js), and the
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
    profileRewards: {
        // The Avatar Frames' names, from Collection Tier 1 to 10.
        frameNames: [
            "Enchanted Forest", "Steam and Gears", "Arcade Neon", "Eternal Frost", "Spice of Arrakis",
            "Arcane Grimoire", "Orbital Station", "Dragon's Breath", "Royal Pinball", "Celestial Legend",
        ],
        // The Mastery Toast's extra line, naming the frames its Collection
        // Tier unlocks (more than one when a Play raised it by several tiers).
        toastLine: (names) => `${names.length === 1 ? "New frame" : "New frames"}: ${names.join(", ")}`,
        // TODO: translation pass
        toastHeader: "Holiday Frame",
        holidays: {
            newYear: { name: "New Year's Day", condition: "A Play on 1 January" },
            chineseNewYear: { name: "Chinese New Year", condition: "A Play on Chinese New Year, between 21 January and 20 February" },
            valentine: { name: "Valentine's Day", condition: "A Play on 14 February" },
            mardiGras: { name: "Mardi Gras", condition: "A Play on Mardi Gras, 47 days before Easter" },
            stPatrick: { name: "St. Patrick's Day", condition: "A Play on 17 March" },
            easter: { name: "Easter", condition: "A Play on Easter Sunday" },
            musicDay: { name: "Fête de la Musique", condition: "A Play on 21 June" },
            halloween: { name: "Halloween", condition: "A Play on 31 October" },
            deadDay: { name: "Día de los Muertos", condition: "A Play on 1 or 2 November" },
            thanksgiving: { name: "Thanksgiving", condition: "A Play on Thanksgiving, the fourth Thursday of November" },
            christmas: { name: "Christmas", condition: "A Play on 24 or 25 December" },
        },
        // The Reward Prompt, after a Profile's first frame: the frame's name,
        // then the main menu entry and the Profile Stats button to equip it from.
        prompt: {
            message: (name, menuEntry, button) => `You won the Avatar Frame "${name}"! Equip it from "${menuEntry}", then "${button}".`,
            goEquip: "Go equip it",
            gotIt: "Got it",
        },
    },
    // TODO: translation pass
    playerLevel: {
        toastHeader: "Level up",
        toastTitle: (level) => `Level ${level}`,
        toastDescription: "Your Achievements took you to a new level.",
    },
    // TODO: translation pass
    highScores: {
        toastHeader: "High Score",
        toastTitle: (table, place) => {
            const teen = place % 100 >= 11 && place % 100 <= 13;
            const suffix = teen ? "th" : (["th", "st", "nd", "rd"][place % 10] || "th");
            return `High score on ${table}: ${place}${suffix} place`;
        },
        tableRecordTitle: (table) => `Table Record on ${table}!`,
        toastScore: (score) => `${score} points`,
        takenFrom: (profile) => `taken from ${profile}`, // TODO: translation pass
        // TODO: translation pass
        // The High Score Board.
        board: {
            menuEntry: "High Scores",
            record: "Record",
            // In place of a place's owner when it belongs to no Profile.
            defaultScore: "Default score",
            // In place of the initials when none were typed.
            noInitials: "\u2014",
            noScore: "No score yet",
            // While PINemHi reads the board, as a message or a note over the last known one.
            reading: "Reading\u2026", // TODO: translation pass
            // Over the last known board when the fresh read failed.
            notRefreshed: "These scores could not be refreshed", // TODO: translation pass
            notSupported: "This table's high scores are not supported", // TODO: translation pass
            // A table without a ROM whose VPReg.stg section or text file is not learned yet.
            notLearned: "Play a game to bring up this table's high scores", // TODO: translation pass
        },
    },

    // TODO: translation pass (every text but the language names)
    expansionPackSettings: {
        menuEntry: "Expansion Pack Settings",
        on: "On",
        off: "Off",
        addOnLine: (name, state) => `${name}: ${state}`,
        languageLine: (languageName) => `Language: ${languageName}`,
        startupScreenLine: (screenName) => `Startup screen: ${screenName}`,
        startupScreenNames: { welcome: "Welcome Screen", profilePicker: "Profile picker", wheel: "Wheel" },
        back: "Back",
        groups: {
            playersAndProgress: "Players and progress",
            wheelScreen: "Wheel screen",
            menusAndFilters: "Menus and filters",
            launchingAndPlaying: "Launching and playing a table",
            debugging: "Debugging",
        },
        onRestart: (state) => `${state} on restart`,
        whenOnLabel: "On:",
        whenOffLabel: "Off:",
        save: "Save",
        cancel: "Cancel",
        notSaved: "Setting not saved",
        ok: "OK",
        restartQuestion: "The saved settings apply when PinballY restarts.",
        restartNow: "Restart now",
        later: "Later",
        restartFailed: "Restart not possible: the settings will apply at the next start",
        addOns: {
            profilePicker: {
                name: "Profile picker",
                whenOn: "Change Player in the main menu: pick whose plays and Achievements count.",
                whenOff: "Guest's plays count when a Challenge is drawn; the Challenge Card and the Mastery Bar are no longer placed under the Profile badge; the Welcome Screen has no Avatar choice, Avatar Frame or greeting by name.",
            },
            startupChoicePrompt: {
                name: "Welcome Screen",
                whenOn: "The Welcome Screen at startup and after Change Player: stay on the table on the wheel, change player, or launch the Table of the Day, the Table of the Week or a random table.",
                whenOff: "The Profile picker gives the Profile Greeting instead of leading to it; with Menu commands off too, no Random Game Achievements.",
            },
            achievements: {
                name: "Achievements",
                whenOn: "Achievements earned while playing, each announced by a toast.",
                whenOff: "No Player Level shown anywhere.",
            },
            sessionStatsTracker: {
                name: "Session stats",
                whenOn: "Records the session stats used by the session Achievements.",
                whenOff: "No Sessions Achievements.",
            },
            challenges: {
                name: "Challenges",
                whenOn: "The week's Challenge and your progress, under the Profile badge.",
                whenOff: "No Challenges Achievements, no completed Challenges in the Profile Stats and Household Stats; the Mastery Bar no longer sits under the Challenge Card.",
            },
            tableMastery: {
                name: "Table Mastery",
                whenOn: "Each table's Mastery Level for the active Profile, under the Challenge Card.",
                whenOff: "No Avatar Frames from Collection Tiers, no Collection Mastery line in the Household Stats.",
            },
            highScores: {
                name: "High Scores",
                whenOn: "Credits each score that enters a ROM table's board to the Profile that played.",
                whenOff: "No High Scores Achievements, no Lost Records on the Welcome Screen, no Table Records in the Profile Stats and Household Stats; PinballY's own High Scores come back (Menu Cleanup still removes its main menu entry).",
            },
            statusLineInfo: {
                name: "Status line",
                whenOn: "Table info (position, year, manufacturer, plays, play time) in the status line.",
                whenOff: "Nothing else.",
            },
            clock: {
                name: "Clock",
                whenOn: "The time at the top left of the wheel screen.",
                whenOff: "Nothing else.",
            },
            wheelArc: {
                name: "Wheel Arc",
                whenOn: "The gold arc under the wheel's icons, unless you have your own underlay.",
                whenOff: "Nothing else.",
            },
            uiTranslation: {
                name: "PinballY translation",
                whenOn: "Translates PinballY's own menus and messages into the pack's language.",
                whenOff: "Nothing else.",
            },
            drawnMenus: {
                name: "Drawn Menus",
                whenOn: "PinballY's menus (main, Exit, filters, power off, table setup and categories, Operator Menu) drawn in the pack's look instead of the native ones.",
                whenOff: "The pack's own menus and prompts fall back to PinballY's native menus, but for these settings.",
            },
            customMenuCommands: {
                name: "Menu commands",
                whenOn: "Table of the Day, Table of the Week, random table and Set Up Table in the main menu.",
                whenOff: "With the Welcome Screen off too, no Random Game Achievements.",
            },
            hallOfFame: {
                name: "Hall of Fame",
                whenOn: "The Most Played Tables filter in the main menu: your ten most played tables.",
                whenOff: "No Most Played Tables button on the Profile Stats.",
            },
            tablesToDiscover: {
                name: "Tables to Discover",
                whenOn: "The Tables to Discover filter in the main menu: the tables you never played.",
                whenOff: "No Tables to Discover button on the Profile Stats.",
            },
            hiddenTables: {
                name: "Hidden Tables",
                whenOn: "The Hidden Tables filter in the main menu, while at least one table is hidden.",
                whenOff: "Nothing else.",
            },
            customFilter: {
                name: "Original Tables",
                whenOn: "The Original Tables filter in the Filter by Manufacturer menu.",
                whenOff: "Nothing else.",
            },
            menuCleanup: {
                name: "Menu Cleanup",
                whenOn: "Removes Help and About from the Exit and Operator menus, Information, Flyer and Instruction Card from the main menu (and PinballY's own High Scores while High Scores is off), and the filter groups by system, last played and date added from Filter Tables, for every Profile.",
                whenOff: "Nothing else.",
            },
            forceBackglass: {
                name: "Backglass",
                whenOn: "Shows the backglass window at startup and hides it while a table runs.",
                whenOff: "Nothing else.",
            },
            seamlessLaunchOverlay: {
                name: "Launch overlay",
                whenOn: "Hides the wheel while a table loads, avoiding a black flash.",
                whenOff: "Nothing else.",
            },
            playLaunchSound: {
                name: "Launch sound",
                whenOn: "Plays the launch sound when a table launches.",
                whenOff: "Nothing else.",
            },
            ratingPrompt: {
                name: "Rating prompt",
                whenOn: "Asks you to rate a table once you have played it long enough.",
                whenOff: "Nothing else.",
            },
            tableRoms: {
                name: "Table ROMs",
                whenOn: "Fills each table's empty ROM field from its script (vpxtool in the tools folder).",
                whenOff: "Nothing else.",
            },
            launchEventsTrace: {
                name: "Launch events trace",
                whenOn: "Writes the launch events to PinballY.log, while LOG_LAUNCH_EVENTS=true in .env.local.",
                whenOff: "Nothing else.",
            },
        },
        languageNames: {
            en: "English",
            fr: "Français",
            de: "Deutsch",
            es: "Español",
            it: "Italiano",
            pt: "Português",
        },
    },
};
