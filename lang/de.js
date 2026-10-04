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

    startupPrompt: {
        introWithPicks: (playerName, dayTitle, weekTitle) => {
            const lines = [`Hallo, ${playerName}! Wie möchten Sie starten?`];
            if (dayTitle) lines.push(`Tisch des Tages: ${dayTitle}`);
            if (weekTitle) lines.push(`Tisch der Woche: ${weekTitle}`);
            return lines.join("\n");
        },
        stayOnLastPlayed: "Beim zuletzt gespielten Tisch bleiben",
        tableOfTheDay: "Tisch des Tages starten",
        tableOfTheWeek: "Tisch der Woche starten",
        randomTable: "Zufälligen Tisch starten",
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

    // Labels for menu items this project adds itself (see custom_menu_commands.js, custom_filter.js and hall_of_fame.js).
    customMenuLabels: {
        challengeTables: "Tische für die Herausforderung",
        hallOfFameFilter: "Hall of Fame",
        originalTablesFilter: "Original-Tische",
        randomGame: "Zufälligen Tisch starten",
        tableOfTheDay: "Tisch des Tages starten",
        tableOfTheWeek: "Tisch der Woche starten",
        tableSetup: "Tischkonfiguration",
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
        menuEntry: "Erfolgsliste",
        // The header's title, the section titles, the key caps and the
        // footer's hints are shown in capitals.
        title: "Erfolgsliste",
        totalLine: (unlockedCount, totalCount, percent) => `${unlockedCount} / ${totalCount} Erfolge freigeschaltet (${percent} %)`,
        unlockedSection: "Freigeschaltete Erfolge",
        missingSection: "Offene Erfolge",
        // After a section's title.
        sectionCount: (count) => `(${count})`,
        // PinballY's button names, as on the cabinet's key caps.
        keyCaps: { next: "Next", prev: "Prev", exit: "Exit" },
        browse: "Blättern",
        back: "Zurück",
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
        menuEntry: "Statistiken",
        title: (name) => `Statistiken von ${name}`,
        gamesPlayed: (count) => `Gespielte Partien: ${count}`,
        // Minutes on two digits: "42 h 05".
        totalTime: (hours, minutes) => `Gesamtzeit: ${hours} Std. ${String(minutes).padStart(2, "0")}`,
        collection: (played, total, percent) => `Sammlung: ${played}/${total} Tische (${percent} %)`,
        achievements: (unlocked, total) => `Erfolge: ${unlocked}/${total}`,
        tableOfTheDayStreak: (count, longest) => `Tagesserie: ${count} (Rekord ${longest})`,
        tableOfTheWeekStreak: (count, longest) => `Wochenserie: ${count} (Rekord ${longest})`,
        challengesCompleted: (completed, total) => `Herausforderungen geschafft: ${completed}/${total}`,
        // Most time spent, with that time; "—" before any play.
        favouriteManufacturer: (name, hours, minutes) => `Hersteller: ${name} (${hours} Std. ${String(minutes).padStart(2, "0")})`,
        noFavouriteManufacturer: "Hersteller: —",
        favouriteDecade: (decadeStartYear, hours, minutes) => `Jahrzehnt: ${decadeStartYear}er (${hours} Std. ${String(minutes).padStart(2, "0")})`,
        noFavouriteDecade: "Jahrzehnt: —",
        // Sub-menu entries, with how many tables each list holds.
        mostPlayedTables: (count) => `Meistgespielte Tische (${count})`,
        neverPlayedTables: (count) => `Nie gespielte Tische (${count})`,
        back: "Zurück",
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

    // The Challenge Card, at the top right of the wheel screen (see common/challenge_card.js).
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

    // The Mastery Bar, under the Challenge Card (see common/mastery_bar.js).
    tableMastery: {
        // TODO: translation pass
        levelNames: ["Rookie", "Apprentice", "Regular", "Adept", "Specialist", "Ace", "Virtuoso", "Prodigy", "Legend", "Pinball Wizard"],
        toDiscover: "To discover",
        toastHeader: "Table Mastery",
        toastTitle: (name, level) => `${name} (${level})`,
    },
};
