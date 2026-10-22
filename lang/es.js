// ============================================================
// Spanish translations for PinballY's UI.
// Save this file as UTF-8 with BOM so accented characters display correctly.
// ============================================================

// The active Profile's play time of a table, as PinballY writes its own.
const formatPlayTime = (hours, minutes) => (hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")} horas`
    : `${minutes} minuto${minutes === 1 ? "" : "s"}`);

// Hours of play with one decimal, as an Achievement Progress shows them.
const formatHours = hours => hours.toFixed(1).replace(".", ",");

export default {
    // Direct translations of PinballY's native menu titles.
    nativeMenuLabels: {
        "About PinballY": "Acerca de PinballY",
        "Add Media": "Añadir contenido multimedia",
        "Add to Favorites": "Añadir a favoritos",
        "Adjust Audio Volume": "Ajustar volumen de audio",
        "All Games": "Todas las mesas",
        "All Tables": "Todas las mesas",
        "Batch Capture": "Captura por lotes",
        "Batch Capture lets you capture screen shot images and videos for multiple games.  Step 1: select which games to include in the capture process:": "La captura por lotes te permite capturar imágenes y vídeos de pantalla para varias mesas. Paso 1: selecciona las mesas que quieres incluir en el proceso de captura:",
        "Begin Capture": "Iniciar captura",
        "Cancel": "Cancelar",
        "Capture images & videos": "Capturar imágenes y vídeos",
        "Confirm Power Off": "Confirmar apagado",
        "Delete game details": "Eliminar detalles de la mesa",
        "Edit category names...": "Editar nombres de categorías...",
        "Edit game details...": "Editar detalles de la mesa...",
        "Enable Videos": "Activar vídeos",
        "Exit": "Salir",
        "Exit PinballY": "Salir de PinballY",
        "Favorites": "Favoritos",
        "Filter by Category": "Filtrar por categoría",
        "Filter by Date Added": "Filtrar por fecha de adición",
        "Filter by Era": "Filtrar por época",
        "Filter by Last Played": "Filtrar por última partida",
        "Filter by Manufacturer": "Filtrar por fabricante",
        "Filter by Rating": "Filtrar por valoración",
        "Filter by System": "Filtrar por sistema",
        "Find game media online": "Buscar archivos multimedia en línea",
        "Games marked for batch capture": "Mesas marcadas para captura por lotes",
        "Game Setup": "Configuración de la mesa",
        "Help": "Ayuda",
        "Hide this game": "Ocultar esta mesa",
        "High Scores": "Mejores puntuaciones",
        "In Favorites": "En favoritos",
        "Information": "Información",
        "Instruction Card": "Tarjeta de instrucciones",
        "Mark for Batch Capture": "Marcar para captura por lotes",
        "Marked for Batch Capture": "Marcada para captura por lotes",
        "Mute Attract Mode": "Silenciar el modo de atracción",
        "Mute Buttons": "Silenciar botones",
        "Mute Table Audio": "Silenciar el audio de la mesa",
        "Mute Videos": "Silenciar vídeos",
        "Operator Menu": "Menú del operador",
        "Options": "Opciones",
        "PinballY Options...": "Opciones...",
        "Play": "Jugar",
        "Play Game": "Iniciar partida",
        "Power Off": "Apagar el ordenador",
        "Proceed": "Continuar",
        "Rate Table": "Valorar la mesa",
        "Reset Coins/Credits": "Restablecer monedas/créditos",
        "Resume Game": "Reanudar partida",
        "Return": "Volver",
        "Save": "Guardar",
        "Search": "Buscar",
        "Select categories": "Seleccionar categorías",
        "Show Hidden Games": "Mostrar mesas ocultas",
        "Show Media Files": "Mostrar archivos multimedia",
        "Show Unconfigured Games": "Mostrar mesas no configuradas",
        "Skip this message next time": "No volver a mostrar este mensaje",
        "Terminate Game": "Finalizar partida",
        "The capture process records the exact same areas of the screen where your PinballY windows are located.  Before proceeding, make sure that your PinballY window layout matches the screen layout of the game you're about to record.  For example, if the game's playfield is full-screen, make sure PinballY's playfield window is full-screen.": "El proceso de captura registra exactamente las mismas áreas de la pantalla donde se encuentran las ventanas de PinballY. Antes de continuar, asegúrate de que la disposición de las ventanas de PinballY coincida con la distribución de la pantalla del juego que vas a grabar. Por ejemplo, si el campo de juego del juego está a pantalla completa, asegúrate de que la ventana del campo de juego de PinballY también esté a pantalla completa.",
        "This will launch a Web browser window to search for media files for this game.  Look for a \"HyperPin Media Pack\" file.  Download the file and drag it onto this window to install it.\n\nNote that you can drop a Media Pack file onto this window at any time to install media for the currently selected game.  This menu step isn't required to install media; it's just a convenience for launching a Web search.": "Esto abrirá una ventana del navegador web para buscar archivos multimedia para esta mesa. Busca un archivo \"HyperPin Media Pack\". Descarga el archivo y arrástralo hasta esta ventana para instalarlo.\n\nTen en cuenta que puedes arrastrar un archivo Media Pack a esta ventana en cualquier momento para instalar contenido multimedia para la mesa seleccionada actualmente. Este paso del menú no es necesario para instalar contenido multimedia; simplemente facilita el inicio de una búsqueda web.",
        "Uncategorized": "Sin categoría",
        "Yes, add to current game": "Sí, añadir a la mesa actual",
        "You must enter the game's bibliographic information (title, system, etc.) before adding media files for the game.  The game information is used to determine the folder locations and file names for the game's media files, so it has to be entered before media files can be added to the game.": "Debes introducir la información bibliográfica de la mesa (título, sistema, etc.) antes de añadir archivos multimedia para la mesa. Esta información se utiliza para determinar las ubicaciones de las carpetas y los nombres de archivo de los elementos multimedia de la mesa, por lo que debe introducirse antes de poder añadir archivos multimedia.",
        "Flyer": "Cartel",
        "Pinscape Night Mode": "Modo nocturno de Pinscape",
        "Hidden Tables": "Mesas ocultas",
        "Unconfigured Tables": "Mesas no configuradas",
        "Tables played within:": "Mesas jugadas hace menos de:",
        "Tables not played within:": "Mesas sin jugar desde hace:",
        "Tables added within:": "Mesas añadidas hace menos de:",
        "Tables added more than:": "Mesas añadidas hace más de:",
        "A week": "Una semana",
        "A month": "Un mes",
        "A year": "Un año",
        "A week ago": "Una semana",
        "A month ago": "Un mes",
        "A year ago": "Un año",
        "Never played": "Nunca jugadas",
        "Batch Capture Step 2: Select the media types you'd like to capture for the selected games.  (You'll be able to say what to do about existing files in the next step.)": "Captura por lotes, paso 2: selecciona los tipos de medios que quieres capturar para las mesas elegidas. (En el siguiente paso podrás indicar qué hacer con los archivos existentes.)",
        "Batch Capture Step 3: For each type, indicate if you'd like to capture the item for EVERY game, even for games that already have existing media of the same type, or if you'd only like to capture missing items.": "Captura por lotes, paso 3: para cada tipo, indica si quieres capturarlo para TODAS las mesas, incluso las que ya tienen un medio de ese tipo, o solo para las que no lo tienen.",
        "Next Step": "Siguiente paso",
        "Missing only": "Solo los que faltan",
        "Capture all": "Capturar todo",
        "View Capture List": "Ver la lista de captura",
        "Please select the system to use to launch this table:": "Selecciona el sistema con el que lanzar esta mesa:",
        "Yes, run as Admin": "Sí, ejecutar como administrador",
        "No, cancel": "No, cancelar",
        "Allow (this session only)": "Permitir (solo esta sesión)",
        "Allow (always)": "Permitir (siempre)",
        "Yes, delete it": "Sí, eliminar",
    },

    // Labels for the media-capture screen's "Item: Action" lines
    // (e.g. "Playfield Image: Skip"), combined via dynamicLabelBuilders.captureItemAction.
    mediaCaptureItemLabels: {
        "Backglass Image": "Imagen del backglass",
        "Backglass Video": "Vídeo del backglass",
        "Flyer Image": "Imagen del cartel",
        "Instruction Card": "Tarjeta de instrucciones",
        "Playfield Image": "Imagen del campo de juego",
        "Playfield Video": "Vídeo del campo de juego",
        "Table Audio": "Audio de la mesa",
        "Wheel Image": "Imagen de la rueda",
        "DMD Image": "Imagen del DMD",
        "DMD Video": "Vídeo del DMD",
        "Topper Image": "Imagen del topper",
        "Topper Video": "Vídeo del topper",
        "Launch Audio": "Audio de lanzamiento",
        "Real DMD Image": "Imagen del DMD real",
        "Real DMD Video": "Vídeo del DMD real",
        "Real RGB DMD Image": "Imagen del DMD RGB real",
        "Real RGB DMD Video": "Vídeo del DMD RGB real",
    },
    mediaCaptureActionLabels: {
        "Add": "Añadir",
        "Capture": "Capturar",
        "Capture Silent": "Capturar sin sonido",
        "Capture w/Audio": "Capturar con audio",
        "Keep Existing": "Conservar el existente",
        "Replace Existing": "Reemplazar el existente",
        "Skip": "Omitir",
    },

    // Status text shown in PinballY's launch overlay, keyed by the
    // language-independent event id (see the "launchoverlaymessage" event).
    launchOverlayMessages: {
        "after": "",
        "capturing": "Capturando...",
        "gameover": "Game Over",
        "init": "",
        "launching": "Cargando...",
        "running": "Iniciando la mesa...",
        "terminating": "Volviendo a la lista de juegos...",
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
            const plural = seconds === "1" ? "" : "s";
            return `Selecciona los elementos que quieras capturar y, a continuación, haz clic en Iniciar captura. Esto iniciará el juego, capturará las imágenes de la pantalla y cerrará automáticamente el juego al finalizar. El proceso tardará aproximadamente ${seconds} segundo${plural}. (!) significa que se reemplazará un elemento existente.`;
        },
        captureInstructionsOneMinute: () =>
            "Selecciona los elementos que quieras capturar y, a continuación, haz clic en Iniciar captura. Esto iniciará el juego, capturará las imágenes de la pantalla y cerrará automáticamente el juego al finalizar. El proceso tardará aproximadamente 1 minuto. (!) significa que se reemplazará un elemento existente.",
        captureItemAction: (item, action) => `${item}: ${action}`,
        decadeTables: (decade) => `Mesas de los años ${decade}`,
        genericTables: (name) => `Mesas ${name}`,
        mediaGameMismatchWarning: (draggedGame, currentGame) =>
            `Parece que algunos de los archivos multimedia que estás añadiendo podrían estar destinados a otra mesa, "${draggedGame}". Los archivos multimedia siempre se añaden a la mesa seleccionada en la rueda, actualmente "${currentGame}". ¿Deseas añadir estos elementos multimedia a la mesa actual?`,
        mediaGameMismatchWarningMultiple: (gameList, currentGame) =>
            `Parece que algunos de los archivos multimedia que estás añadiendo podrían estar destinados a otras mesas: ${gameList}. Los archivos multimedia siempre se añaden a la mesa seleccionada en la rueda, actualmente "${currentGame}". ¿Deseas añadir estos elementos multimedia a la mesa actual?`,
        mediaReadyToAdd: (gameName) =>
            `Los siguientes elementos multimedia están listos para añadirse a ${gameName}. Selecciona los elementos que deseas añadir o reemplazar.`,
        starTables: (count) => `Mesas con ${count} estrella${count > 1 ? "s" : ""}`,
        startDelay: (seconds) => `Ajustar el retraso de inicio (${seconds} s)`,
        unratedTables: () => "Mesas sin valorar",
        batchCaptureReady: (count, duration) => `¡La captura por lotes está lista! Se incluirán ${count} mesa(s) en este proceso, que tardará aproximadamente ${duration}.`,
        confirmDeleteGameDetails: (title) => `¿Seguro que quieres eliminar los detalles de la mesa ${title}? (Solo se elimina la información bibliográfica, no los archivos de la mesa ni sus medios.)`,
        showCustomView: (name) => `Mostrar ${name}`,
        durationSeconds: (count) => `${count} segundo${count === 1 ? "" : "s"}`,
        durationMinutes: (count) => `${count} minuto${count === 1 ? "" : "s"}`,
        durationHours: (hours, minutes) => (minutes > 0 ? `${hours} h ${minutes} min` : `${hours} hora${hours === 1 ? "" : "s"}`),
    },

    ratingPrompt: {
        message: (tableTitle, minutes) =>
            `¡Has jugado a "${tableTitle}" durante más de ${minutes} minutos! ¿Quieres valorarla ahora?`,
        rateNow: "Valorar ahora",
        notNow: "Más tarde",
    },

    // The Button Hints at the foot of every drawn screen and the Exit
    // Button's tooltip (see GLOSSARY.md). The key caps and the footer's
    // words are shown in capitals.
    buttonHints: {
        // PinballY's button names, as on the cabinet's key caps.
        keyCaps: { next: "Next", prev: "Prev", select: "Select", exit: "Exit" },
        browse: "Explorar",
        // The flippers on a High Score Board longer than the window.
        scroll: "Scroll", // TODO: translation pass
        choose: "Choose", // TODO: translation pass
        // Exit's word and the Exit Button's tooltip: Back where Exit brings
        // back a screen or a menu, Close where it leaves the bare wheel.
        back: "Volver",
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
        manufacturer: (position) => `Mesa ${position}/[Filter.Count] - fabricada por [Game.Manuf].`,
        manufacturerFictional: (position) => `Mesa ${position}/[Filter.Count] - Flíper ficticio.`,
        playCount: (position, count) => `Mesa ${position}/[Filter.Count] - iniciada ${count} veces.`,
        playTime: (position, hours, minutes) => `Mesa ${position}/[Filter.Count] - jugada durante ${formatPlayTime(hours, minutes)}.`,
        year: (position) => `Mesa ${position}/[Filter.Count] - publicada en [Game.Year].`,
    },

    // Upper status line messages, after the player's own from PinballY's options.
    // [Filter.Count] is a PinballY placeholder — keep it as-is.
    upperStatusLines: {
        welcome: name => `¡Te damos la bienvenida, ${name}!`,
        tablesAvailable: "¡[Filter.Count] mesas disponibles!",
        launchHint: "Botón de lanzamiento para iniciar una mesa.",
        browseHint: "Flippers izquierdo/derecho para pasar las mesas.",
        signOff: "¡Que te diviertas!",
    },

    // Labels for menu items this project adds itself (see custom_menu_commands.js, custom_filter.js, hall_of_fame.js and tables_to_discover.js).
    customMenuLabels: {
        challengeTables: "Mesas del reto",
        hallOfFameFilter: "Hall of Fame",
        myHighScoresFilter: "My High Scores", // TODO: translation pass
        hiddenTablesFilter: "Hidden Tables", // TODO: translation pass
        tablesToDiscoverFilter: "Tables to Discover", // TODO: translation pass
        originalTablesFilter: "Mesas originales",
        tableSetup: "Configuración de la mesa",
        tableScores: "Table Scores", // TODO: translation pass
        filterPickerBack: "Back", // TODO: translation pass
        activeFilter: (name) => `Active filter: ${name}`, // TODO: translation pass
        // The Drawn main menu's "Change Filter" entry, and its footer's label before the Active Filter.
        changeFilter: "Change Filter", // TODO: translation pass
        activeFilterLabel: "Active filter:", // TODO: translation pass
    },

    achievements: {
        dailyFirstPlayTitle: () => "¡Hola, mesa del día!",
        dailyFirstPlayDescription: () => "Iniciar la mesa del día por primera vez.",
        weeklyFirstPlayTitle: () => "Cita semanal",
        weeklyFirstPlayDescription: () => "Iniciar la mesa de la semana por primera vez.",
        dailyPeriodsPlayedTitles: {
            10: "Explorador de domingo",
            25: "Explorador curioso",
            50: "Explorador veterano",
            100: "Indiana Flippers",
        },
        dailyPeriodsPlayedDescription: (days) => `Iniciar la mesa del día ${days} días distintos.`,
        weeklyPeriodsPlayedTitles: {
            4: "Un mes de citas",
            10: "Habitual de la semana",
            26: "Seis meses de fidelidad",
            52: "Un año sin una arruga",
        },
        weeklyPeriodsPlayedDescription: (weeks) => `Iniciar la mesa de la semana ${weeks} semanas distintas.`,
        dailyStreakTitles: {
            3: "No hay dos sin tres",
            7: "Semana perfecta",
            14: "Quincena de hierro",
            30: "Monje del pinball",
        },
        dailyStreakDescription: (days) => `Iniciar la mesa del día ${days} días seguidos.`,
        weeklyStreakTitles: {
            4: "Un mes sin fallos",
            12: "Suscriptor fiel",
        },
        weeklyStreakDescription: (weeks) => `Iniciar la mesa de la semana ${weeks} semanas seguidas.`,
        manufacturerCompletionTitle: (manufacturer) => `Fan absoluto de ${manufacturer}`,
        manufacturerCompletionDescription: (manufacturer, count) => `Jugar al menos una vez las ${count} mesas de ${manufacturer}.`,
        firstTableTitle: () => "Primeros pasos",
        firstTableDescription: () => "Jugar tu primera mesa.",
        collectionPercentTitles: {
            10: "El sabor del metal",
            25: "Coleccionista en ciernes",
            50: "Medio tiempo",
            75: "Casi todo visto",
            100: "Nada se me escapa",
        },
        collectionPercentDescription: (percent, playedCount, totalCount) => `Jugar ${playedCount} mesas de ${totalCount} (${percent} % de tu colección).`,
        worldTourTitle: () => "La vuelta al mundo",
        worldTourDescription: () => "Recorrer todas las mesas de la rueda de una sola vez, sin lanzar ninguna.",
        playTimeMilestoneTitles: {
            1: "Calentando",
            5: "Esto va en serio",
            10: "Adicto al pinball",
            50: "Pinball en la sangre",
            100: "Leyenda del tilt",
        },
        playTimeMilestoneDescription: (hours) => `Acumular más de ${hours} hora${hours > 1 ? "s" : ""} de juego.`,
        decadeCompletionTitle: (decadeStartYear) => `Viaje a los años ${decadeStartYear}`,
        decadeCompletionDescription: (decadeStartYear, count) => `Jugar al menos una vez las ${count} mesas de los años ${decadeStartYear}.`,
        categoryCompletionTitle: (category) => `Maestro de ${category}`,
        categoryCompletionDescription: (category, count) => `Jugar al menos una vez las ${count} mesas "${category}".`,
        marathonTitles: {
            30: "Pequeño maratón",
            60: "Maratonista",
        },
        marathonDescription: (minutes) => `Jugar una sola sesión de más de ${minutes} minutos.`,
        // TODO: translation pass
        cabinetStreakTitles: {
            3: "Back for More",
            7: "A Week at the Cabinet",
            15: "Cabinet Regular",
            30: "Part of the Furniture",
        },
        // TODO: translation pass
        cabinetStreakDescription: (days) => `Play on the cabinet ${days} days in a row, any table.`,
        rageQuitTitle: () => "¡¿Abandono por rabia?!",
        rageQuitDescription: (minSeconds, maxSeconds) => `Salir de una mesa tras apenas ${minSeconds} a ${maxSeconds} segundos...`,
        grandReturnTitle: () => "El gran regreso",
        grandReturnDescription: (days) => `Volver a jugar una mesa tras ${days} días o más sin tocarla.`,
        // A Secret Achievement's hint, shown instead of its description while it is missing.
        rageQuitHint: () => "Hay días en que una mesa simplemente no sale...",
        grandReturnHint: () => "Los viejos amigos siempre se alegran de un reencuentro...",
        worldTourHint: () => "Algunos viajes se hacen sin pulsar nunca Start...",
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
            10: "¿Y por qué no?",
            25: "Cara o cruz",
            50: "Jugador de dados",
            100: "Me encaaaanta el azar",
        },
        randomGamesDescription: (count) => `Jugar ${count} mesas al azar.`,
        challengesCompletedTitles: {
            1: "Primer desafío",
            5: "Aficionado a los desafíos",
            10: "Buscador de desafíos",
            25: "Cazador de desafíos",
            50: "Maestro de los desafíos",
            100: "Leyenda de la semana",
        },
        challengesCompletedDescription: (count) => (count === 1 ? "Superar un desafío." : `Superar ${count} desafíos.`),
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
            3: "Vuelta al mundo exprés",
            5: "Mariposa del pinball",
            8: "Infiel en serie",
            10: "Casanova del pinball",
        },
        dayManufacturersDescription: (count) => `Jugar mesas de ${count} fabricantes distintos el mismo día.`,
        // Header of the Achievement Toast card.
        toastHeader: "Logro desbloqueado",
    },

    achievementList: {
        menuEntry: "Lista de logros", // TODO: translation pass, now My Achievements
        // The header's title and the section titles are shown in capitals.
        title: "Lista de logros",
        totalLine: (unlockedCount, totalCount, percent) => `${unlockedCount} / ${totalCount} logros desbloqueados (${percent} %)`,
        unlockedSection: "Logros desbloqueados",
        missingSection: "Logros por conseguir",
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
        menuEntry: "Estadísticas", // TODO: translation pass, now My Profile
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
        menuEntry: "Cambiar de jugador",
        pickerTitle: "¿Quién juega?",
        pickerHint: "Flippers: cambiar · Start: elegir · Exit: cancelar",
        guestName: "Invitado",
        greeting: name => `¡Hola ${name}!`,
    },

    // The Profile Reset, in PinballY's Exit menu for an Admin Profile.
    profileReset: {
        menuEntry: "Reiniciar un perfil",
        listTitle: "¿Qué perfil empieza de cero?",
        confirm: name => `¿Reiniciar ${name}? Se borrarán todas sus partidas, rachas, retos y logros.`,
        yes: "Sí, reiniciar",
        no: "No",
        cancel: "Cancelar",
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
        cardHeader: "Reto de la semana",
        titles: {
            differentTables: (target) => `Jugar ${target} mesas distintas`,
            manufacturerTables: (target, manufacturer) => `Jugar ${target} mesas distintas de ${manufacturer}`,
            decadeTables: (target, decade) => `Jugar ${target} mesas distintas de los años ${decade}`,
            differentManufacturers: (target) => `Jugar mesas de ${target} fabricantes distintos`,
            differentDecades: (target) => `Jugar mesas de ${target} décadas distintas`,
            neverPlayedTables: (target) => `Jugar ${target} mesas nunca jugadas`,
            dustyTables: (target) => `Jugar ${target} mesas sin jugar desde hace seis meses`,
            tableOfTheDayDays: (target) => `Jugar la mesa del día ${target} días distintos`,
            tableOfTheWeekGames: (target) => `Jugar ${target} partidas en la mesa de la semana`,
            activeDays: (target) => `Jugar ${target} días distintos`,
            endurance: (target) => `Jugar ${target} minutos en una misma mesa`,
            marathon: (target) => `Jugar ${target} minutos en total`,
            randomGames: (target) => `Jugar ${target} partidas al azar`,
            sameTableGames: (target) => `Jugar ${target} partidas en una misma mesa`,
        },
        progress: (value, target, daysText) => `${value}/${target} · ${daysText}`,
        daysLeft: (days) => `quedan ${days} días`,
        lastDay: "último día",
        completed: "¡Desafío superado!",
        verdictHeader: "Reto anterior",
        missed: (reached, target) => `Fallado · ${reached}/${target}`,
        toastHeader: "Desafío superado",
        toastDescription: (count) => (count === 1 ? "Primer desafío superado" : `${count} desafíos superados`),
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
        back: "Back",
        groups: {
            playersAndProgress: "Players and progress",
            wheelScreen: "Wheel screen",
            menusAndFilters: "Menus and filters",
            launchingAndPlaying: "Launching and playing a table",
            debugging: "Debugging",
        },
        onRestart: (state) => `${state} on restart`,
        pageMessage: (whenOn, whenOff) => `When on: ${whenOn} When off: ${whenOff}`,
        save: "Save",
        cancel: "Cancel",
        notSaved: "Setting not saved",
        ok: "OK",
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
