// ============================================================
// Portuguese translations for PinballY's UI.
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
        "About PinballY": "Sobre o PinballY",
        "Add Media": "Adicionar mídia",
        "Add to Favorites": "Adicionar aos favoritos",
        "Adjust Audio Volume": "Ajustar volume do áudio",
        "All Games": "Todas as mesas",
        "All Tables": "Todas as mesas",
        "Batch Capture": "Captura em lote",
        "Batch Capture lets you capture screen shot images and videos for multiple games.  Step 1: select which games to include in the capture process:": "A captura em lote permite capturar capturas de tela e vídeos para várias mesas. Etapa 1: selecione as mesas a incluir no processo de captura:",
        "Begin Capture": "Iniciar captura",
        "Cancel": "Cancelar",
        "Capture images & videos": "Capturar imagens e vídeos",
        "Confirm Power Off": "Confirmar desligamento",
        "Delete game details": "Excluir detalhes da mesa",
        "Edit category names...": "Editar nomes das categorias...",
        "Edit game details...": "Editar detalhes da mesa...",
        "Enable Videos": "Ativar vídeos",
        "Exit": "Sair",
        "Exit PinballY": "Sair do PinballY",
        "Favorites": "Favoritos",
        "Filter by Category": "Filtrar por categoria",
        "Filter by Date Added": "Filtrar por data de adição",
        "Filter by Era": "Filtrar por época",
        "Filter by Last Played": "Filtrar pela última partida",
        "Filter by Manufacturer": "Filtrar por fabricante",
        "Filter by Rating": "Filtrar por avaliação",
        "Filter by System": "Filtrar por sistema",
        "Find game media online": "Procurar mídias online",
        "Games marked for batch capture": "Mesas marcadas para captura em lote",
        "Game Setup": "Configuração da mesa",
        "Help": "Ajuda",
        "Hide this game": "Ocultar esta mesa",
        "High Scores": "Melhores pontuações",
        "In Favorites": "Nos favoritos",
        "Information": "Informações",
        "Instruction Card": "Cartão de instruções",
        "Mark for Batch Capture": "Marcar para captura em lote",
        "Marked for Batch Capture": "Marcada para captura em lote",
        "Mute Attract Mode": "Silenciar o modo de atração",
        "Mute Buttons": "Silenciar os botões",
        "Mute Table Audio": "Silenciar o áudio da mesa",
        "Mute Videos": "Silenciar os vídeos",
        "Operator Menu": "Menu do operador",
        "Options": "Opções",
        "PinballY Options...": "Opções...",
        "Play": "Jogar",
        "Play Game": "Iniciar partida",
        "Power Off": "Desligar o computador",
        "Proceed": "Continuar",
        "Rate Table": "Avaliar a mesa",
        "Reset Coins/Credits": "Redefinir moedas/créditos",
        "Resume Game": "Retomar partida",
        "Return": "Voltar",
        "Save": "Salvar",
        "Search": "Pesquisar",
        "Select categories": "Selecionar categorias",
        "Show Hidden Games": "Mostrar mesas ocultas",
        "Show Media Files": "Mostrar arquivos de mídia",
        "Show Unconfigured Games": "Mostrar mesas não configuradas",
        "Skip this message next time": "Não mostrar esta mensagem novamente",
        "Terminate Game": "Encerrar partida",
        "The capture process records the exact same areas of the screen where your PinballY windows are located.  Before proceeding, make sure that your PinballY window layout matches the screen layout of the game you're about to record.  For example, if the game's playfield is full-screen, make sure PinballY's playfield window is full-screen.": "O processo de captura grava exatamente as mesmas áreas da tela onde as janelas do PinballY estão localizadas. Antes de continuar, certifique-se de que a disposição das janelas do PinballY corresponda à disposição da tela do jogo que você está prestes a gravar. Por exemplo, se o campo de jogo estiver em tela cheia, certifique-se de que a janela do campo de jogo do PinballY também esteja em tela cheia.",
        "This will launch a Web browser window to search for media files for this game.  Look for a \"HyperPin Media Pack\" file.  Download the file and drag it onto this window to install it.\n\nNote that you can drop a Media Pack file onto this window at any time to install media for the currently selected game.  This menu step isn't required to install media; it's just a convenience for launching a Web search.": "Isso abrirá uma janela do navegador da Web para procurar arquivos de mídia para esta mesa. Procure um arquivo \"HyperPin Media Pack\". Baixe o arquivo e arraste-o para esta janela para instalá-lo.\n\nObserve que você pode soltar um arquivo Media Pack nesta janela a qualquer momento para instalar mídias para a mesa atualmente selecionada. Esta etapa do menu não é necessária para instalar mídias; ela serve apenas como uma maneira prática de iniciar uma pesquisa na Web.",
        "Uncategorized": "Sem categoria",
        "Yes, add to current game": "Sim, adicionar à mesa atual",
        "You must enter the game's bibliographic information (title, system, etc.) before adding media files for the game.  The game information is used to determine the folder locations and file names for the game's media files, so it has to be entered before media files can be added to the game.": "Você deve inserir as informações bibliográficas da mesa (título, sistema, etc.) antes de adicionar arquivos de mídia para a mesa. Essas informações são usadas para determinar os locais das pastas e os nomes de arquivo das mídias da mesa, portanto, elas precisam ser inseridas antes que os arquivos de mídia possam ser adicionados.",
        "Flyer": "Cartaz",
        "Pinscape Night Mode": "Modo noturno do Pinscape",
        "Hidden Tables": "Mesas ocultas",
        "Unconfigured Tables": "Mesas não configuradas",
        "Tables played within:": "Mesas jogadas há menos de:",
        "Tables not played within:": "Mesas não jogadas há:",
        "Tables added within:": "Mesas adicionadas há menos de:",
        "Tables added more than:": "Mesas adicionadas há mais de:",
        "A week": "Uma semana",
        "A month": "Um mês",
        "A year": "Um ano",
        "A week ago": "Uma semana",
        "A month ago": "Um mês",
        "A year ago": "Um ano",
        "Never played": "Nunca jogadas",
        "Batch Capture Step 2: Select the media types you'd like to capture for the selected games.  (You'll be able to say what to do about existing files in the next step.)": "Captura em lote, passo 2: selecione os tipos de mídia que deseja capturar para as mesas escolhidas. (No próximo passo, você poderá indicar o que fazer com os arquivos existentes.)",
        "Batch Capture Step 3: For each type, indicate if you'd like to capture the item for EVERY game, even for games that already have existing media of the same type, or if you'd only like to capture missing items.": "Captura em lote, passo 3: para cada tipo, indique se deseja capturá-lo para TODAS as mesas, mesmo as que já têm uma mídia desse tipo, ou somente para as que não a têm.",
        "Next Step": "Próximo passo",
        "Missing only": "Somente os ausentes",
        "Capture all": "Capturar tudo",
        "View Capture List": "Ver lista de captura",
        "Please select the system to use to launch this table:": "Selecione o sistema para iniciar esta mesa:",
        "Yes, run as Admin": "Sim, executar como administrador",
        "No, cancel": "Não, cancelar",
        "Allow (this session only)": "Permitir (somente nesta sessão)",
        "Allow (always)": "Permitir (sempre)",
        "Yes, delete it": "Sim, excluir",
    },

    // Labels for the media-capture screen's "Item: Action" lines
    // (e.g. "Playfield Image: Skip"), combined via dynamicLabelBuilders.captureItemAction.
    mediaCaptureItemLabels: {
        "Backglass Image": "Imagem do backglass",
        "Backglass Video": "Vídeo do backglass",
        "Flyer Image": "Imagem do cartaz",
        "Instruction Card": "Cartão de instruções",
        "Playfield Image": "Imagem do campo de jogo",
        "Playfield Video": "Vídeo do campo de jogo",
        "Table Audio": "Áudio da mesa",
        "Wheel Image": "Imagem da roleta",
        "DMD Image": "Imagem do DMD",
        "DMD Video": "Vídeo do DMD",
        "Topper Image": "Imagem do topper",
        "Topper Video": "Vídeo do topper",
        "Launch Audio": "Áudio de inicialização",
        "Real DMD Image": "Imagem do DMD real",
        "Real DMD Video": "Vídeo do DMD real",
        "Real RGB DMD Image": "Imagem do DMD RGB real",
        "Real RGB DMD Video": "Vídeo do DMD RGB real",
    },
    mediaCaptureActionLabels: {
        "Add": "Adicionar",
        "Capture": "Capturar",
        "Capture Silent": "Capturar sem som",
        "Capture w/Audio": "Capturar com áudio",
        "Keep Existing": "Manter o existente",
        "Replace Existing": "Substituir o existente",
        "Skip": "Ignorar",
    },

    // Status text shown in PinballY's launch overlay, keyed by the
    // language-independent event id (see the "launchoverlaymessage" event).
    launchOverlayMessages: {
        "after": "",
        "capturing": "Capturando...",
        "gameover": "Game Over",
        "init": "",
        "launching": "Carregando...",
        "running": "Iniciando a mesa...",
        "terminating": "Voltando para a lista de jogos...",
    },

    // Functions that build translated titles for PinballY's dynamically
    // generated menu text (category names, star ratings, etc.).
    dynamicLabelBuilders: {
        captureInstructions: (seconds) => {
            const plural = seconds === "1" ? "" : "s";
            return `Selecione os elementos a serem capturados e clique em Iniciar captura. Isso iniciará o jogo, capturará as imagens da tela e encerrará automaticamente o jogo quando terminar. O processo levará aproximadamente ${seconds} segundo${plural}. (!) significa que um elemento existente será substituído.`;
        },
        captureInstructionsOneMinute: () =>
            "Selecione os elementos a serem capturados e clique em Iniciar captura. Isso iniciará o jogo, capturará as imagens da tela e encerrará automaticamente o jogo quando terminar. O processo levará aproximadamente 1 minuto. (!) significa que um elemento existente será substituído.",
        captureItemAction: (item, action) => `${item}: ${action}`,
        decadeTables: (decade) => `Mesas dos anos ${decade}`,
        genericTables: (name) => `Mesas ${name}`,
        mediaGameMismatchWarning: (draggedGame, currentGame) =>
            `Parece que alguns dos arquivos de mídia que você está adicionando podem ser destinados a uma mesa diferente, "${draggedGame}". Os arquivos de mídia são sempre adicionados à mesa selecionada na roleta, atualmente "${currentGame}". Deseja adicionar esses itens de mídia à mesa atual?`,
        mediaGameMismatchWarningMultiple: (gameList, currentGame) =>
            `Parece que alguns dos arquivos de mídia que você está adicionando podem ser destinados a outras mesas: ${gameList}. Os arquivos de mídia são sempre adicionados à mesa selecionada na roleta, atualmente "${currentGame}". Deseja adicionar esses itens de mídia à mesa atual?`,
        mediaReadyToAdd: (gameName) =>
            `Os seguintes itens de mídia estão prontos para serem adicionados a ${gameName}. Selecione os itens que deseja adicionar ou substituir.`,
        starTables: (count) => `Mesas com ${count} estrela${count > 1 ? "s" : ""}`,
        startDelay: (seconds) => `Ajustar atraso de inicialização (${seconds} s)`,
        unratedTables: () => "Mesas sem avaliação",
        batchCaptureReady: (count, duration) => `A captura em lote está pronta! ${count} mesa(s) serão incluídas neste processo, que levará cerca de ${duration}.`,
        confirmDeleteGameDetails: (title) => `Deseja realmente excluir os detalhes da mesa ${title}? (Somente as informações bibliográficas são excluídas, não os arquivos da mesa nem suas mídias.)`,
        showCustomView: (name) => `Mostrar ${name}`,
        durationSeconds: (count) => `${count} segundo${count === 1 ? "" : "s"}`,
        durationMinutes: (count) => `${count} minuto${count === 1 ? "" : "s"}`,
        durationHours: (hours, minutes) => (minutes > 0 ? `${hours} h ${minutes} min` : `${hours} hora${hours === 1 ? "" : "s"}`),
    },

    ratingPrompt: {
        message: (tableTitle, minutes) =>
            `Você jogou "${tableTitle}" por mais de ${minutes} minutos! Deseja avaliá-la agora?`,
        rateNow: "Avaliar agora",
        notNow: "Mais tarde",
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
        // Collection Mastery: the goal toward the next Collection Tier
        // (that many tables at the level of that name), how many tables
        // already reach it, or, at the last tier, that all of them did.
        collection: {
            goal: (count, levelName) => `Goal: ${count} ${count === 1 ? "table" : "tables"} at ${levelName}`,
            current: (reached, needed) => `Current: ${reached}/${needed}`,
            allTables: (levelName) => `All your tables: ${levelName}`,
        },
    },

    // Lower status line text for the currently selected table.
    // [Filter.Count], [Game.Year], etc. are PinballY placeholders — keep them as-is.
    tableInfoStatusLines: {
        manufacturer: (position) => `Mesa ${position}/[Filter.Count] - fabricada por [Game.Manuf].`,
        manufacturerFictional: (position) => `Mesa ${position}/[Filter.Count] - Fliperama fictício.`,
        playCount: (position, count) => `Mesa ${position}/[Filter.Count] - iniciada ${count} vezes.`,
        playTime: (position, hours, minutes) => `Mesa ${position}/[Filter.Count] - jogada por ${formatPlayTime(hours, minutes)}.`,
        year: (position) => `Mesa ${position}/[Filter.Count] - lançada em [Game.Year].`,
    },

    // Upper status line messages, after the player's own from PinballY's options.
    // [Filter.Count] is a PinballY placeholder — keep it as-is.
    upperStatusLines: {
        welcome: name => `Boas-vindas, ${name}!`,
        tablesAvailable: "[Filter.Count] mesas disponíveis!",
        launchHint: "Botão de lançamento para iniciar uma mesa.",
        browseHint: "Flippers esquerdo/direito para passar as mesas.",
        signOff: "Divirta-se!",
    },

    // Labels for menu items this project adds itself (see custom_menu_commands.js, custom_filter.js and hall_of_fame.js).
    customMenuLabels: {
        challengeTables: "Mesas do desafio",
        hallOfFameFilter: "Hall of Fame",
        originalTablesFilter: "Mesas originais",
        randomGame: "Iniciar uma mesa aleatória",
        tableOfTheDay: "Iniciar a mesa do dia",
        tableOfTheWeek: "Iniciar a mesa da semana",
        tableSetup: "Configuração da mesa",
    },

    achievements: {
        dailyFirstPlayTitle: () => "Olá, mesa do dia!",
        dailyFirstPlayDescription: () => "Iniciar a mesa do dia pela primeira vez.",
        weeklyFirstPlayTitle: () => "Encontro semanal",
        weeklyFirstPlayDescription: () => "Iniciar a mesa da semana pela primeira vez.",
        dailyPeriodsPlayedTitles: {
            10: "Explorador de domingo",
            25: "Explorador curioso",
            50: "Explorador experiente",
            100: "Indiana Flippers",
        },
        dailyPeriodsPlayedDescription: (days) => `Iniciar a mesa do dia em ${days} dias diferentes.`,
        weeklyPeriodsPlayedTitles: {
            4: "Um mês de encontros",
            10: "Frequentador da semana",
            26: "Seis meses de fidelidade",
            52: "Um ano sem uma ruga",
        },
        weeklyPeriodsPlayedDescription: (weeks) => `Iniciar a mesa da semana em ${weeks} semanas diferentes.`,
        dailyStreakTitles: {
            3: "Não há dois sem três",
            7: "Semana perfeita",
            14: "Quinzena de ferro",
            30: "Monge do pinball",
        },
        dailyStreakDescription: (days) => `Iniciar a mesa do dia ${days} dias seguidos.`,
        weeklyStreakTitles: {
            4: "Um mês sem falhas",
            12: "Assinante fiel",
        },
        weeklyStreakDescription: (weeks) => `Iniciar a mesa da semana ${weeks} semanas seguidas.`,
        manufacturerCompletionTitle: (manufacturer) => `Fã absoluto de ${manufacturer}`,
        manufacturerCompletionDescription: (manufacturer, count) => `Jogar pelo menos uma vez as ${count} mesas da ${manufacturer}.`,
        firstTableTitle: () => "Primeiros passos",
        firstTableDescription: () => "Jogar sua primeiríssima mesa.",
        collectionPercentTitles: {
            10: "O gosto do metal",
            25: "Colecionador iniciante",
            50: "Meio tempo",
            75: "Quase tudo visto",
            100: "Nada me escapa",
        },
        collectionPercentDescription: (percent, playedCount, totalCount) => `Jogar ${playedCount} de ${totalCount} mesas (${percent}% da sua coleção).`,
        worldTourTitle: () => "Volta ao mundo",
        worldTourDescription: () => "Percorrer todas as mesas da roda de uma só vez, sem iniciar nenhuma.",
        playTimeMilestoneTitles: {
            1: "Aquecimento",
            5: "A coisa ficou séria",
            10: "Viciado em pinball",
            50: "Pinball no sangue",
            100: "Lenda do tilt",
        },
        playTimeMilestoneDescription: (hours) => `Acumular mais de ${hours} hora${hours > 1 ? "s" : ""} de jogo.`,
        decadeCompletionTitle: (decadeStartYear) => `Viagem aos anos ${decadeStartYear}`,
        decadeCompletionDescription: (decadeStartYear, count) => `Jogar pelo menos uma vez as ${count} mesas dos anos ${decadeStartYear}.`,
        categoryCompletionTitle: (category) => `Mestre em ${category}`,
        categoryCompletionDescription: (category, count) => `Jogar pelo menos uma vez as ${count} mesas "${category}".`,
        marathonTitles: {
            30: "Pequena maratona",
            60: "Maratonista",
        },
        marathonDescription: (minutes) => `Jogar uma única sessão de mais de ${minutes} minutos.`,
        rageQuitTitle: () => "Desistência por raiva?!",
        rageQuitDescription: (minSeconds, maxSeconds) => `Sair de uma mesa após apenas ${minSeconds} a ${maxSeconds} segundos...`,
        grandReturnTitle: () => "O grande retorno",
        grandReturnDescription: (days) => `Voltar a jogar uma mesa depois de ${days} dias ou mais.`,
        // A Secret Achievement's hint, shown instead of its description while it is missing.
        rageQuitHint: () => "Há dias em que uma mesa simplesmente não colabora...",
        grandReturnHint: () => "Velhos amigos sempre ficam felizes com um reencontro...",
        worldTourHint: () => "Algumas viagens se fazem sem nunca apertar Start...",
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
            10: "E por que não?",
            25: "Cara ou coroa",
            50: "Jogador de dados",
            100: "Eu adoooooro o acaso",
        },
        randomGamesDescription: (count) => `Jogar ${count} mesas aleatórias.`,
        challengesCompletedTitles: {
            1: "Primeiro desafio",
            5: "Amante de desafios",
            10: "Buscador de desafios",
            25: "Caçador de desafios",
            50: "Mestre dos desafios",
            100: "Lenda da semana",
        },
        challengesCompletedDescription: (count) => (count === 1 ? "Concluir um desafio." : `Concluir ${count} desafios.`),
        dayManufacturersTitles: {
            3: "Volta ao mundo expressa",
            5: "Borboleta do pinball",
            8: "Infiel em série",
            10: "Casanova do pinball",
        },
        dayManufacturersDescription: (count) => `Jogar mesas de ${count} fabricantes diferentes no mesmo dia.`,
        // Header of the Achievement Toast card.
        toastHeader: "Conquista desbloqueada",
    },

    achievementList: {
        menuEntry: "Lista de conquistas",
        // The header's title, the section titles, the key caps and the
        // footer's hints are shown in capitals.
        title: "Lista de conquistas",
        totalLine: (unlockedCount, totalCount, percent) => `${unlockedCount} / ${totalCount} conquistas desbloqueadas (${percent}%)`,
        unlockedSection: "Conquistas desbloqueadas",
        missingSection: "Conquistas a obter",
        // After a section's title.
        sectionCount: (count) => `(${count})`,
        // PinballY's button names, as on the cabinet's key caps.
        keyCaps: { next: "Next", prev: "Prev", exit: "Exit" },
        browse: "Navegar",
        back: "Voltar",
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
        menuEntry: "Estatísticas",
        title: (name) => `Estatísticas de ${name}`,
        gamesPlayed: (count) => `Partidas jogadas: ${count}`,
        // Minutes on two digits: "42 h 05".
        totalTime: (hours, minutes) => `Tempo total: ${hours} h ${String(minutes).padStart(2, "0")}`,
        collection: (played, total, percent) => `Coleção: ${played}/${total} mesas (${percent}%)`,
        achievements: (unlocked, total) => `Conquistas: ${unlocked}/${total}`,
        tableOfTheDayStreak: (count, longest) => `Sequência diária: ${count} (recorde ${longest})`,
        tableOfTheWeekStreak: (count, longest) => `Sequência semanal: ${count} (recorde ${longest})`,
        challengesCompleted: (completed, total) => `Desafios concluídos: ${completed}/${total}`,
        // Most time spent, with that time; "—" before any play.
        favouriteManufacturer: (name, hours, minutes) => `Marca: ${name} (${hours} h ${String(minutes).padStart(2, "0")})`,
        noFavouriteManufacturer: "Marca: —",
        favouriteDecade: (decadeStartYear, hours, minutes) => `Década: ${decadeStartYear} (${hours} h ${String(minutes).padStart(2, "0")})`,
        noFavouriteDecade: "Década: —",
        // Sub-menu entries, with how many tables each list holds.
        mostPlayedTables: (count) => `Mesas mais jogadas (${count})`,
        neverPlayedTables: (count) => `Mesas nunca jogadas (${count})`,
        back: "Voltar",
    },

    // Profiles. Guest's folder name is never shown: this is its name.
    profiles: {
        menuEntry: "Trocar de jogador",
        pickerTitle: "Quem joga?",
        pickerHint: "Flippers: mudar · Start: escolher · Exit: cancelar",
        guestName: "Convidado",
        greeting: name => `Olá ${name}!`,
    },

    // The Profile Reset, in PinballY's Exit menu for an Admin Profile.
    profileReset: {
        menuEntry: "Redefinir um perfil",
        listTitle: "Qual perfil recomeça do zero?",
        confirm: name => `Redefinir ${name}? Todas as suas partidas, sequências, desafios e conquistas serão apagados.`,
        yes: "Sim, redefinir",
        no: "Não",
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

    // The Challenge Card, at the top right of the wheel screen (see common/challenge_card.js).
    challenges: {
        cardHeader: "Desafio da semana",
        titles: {
            differentTables: (target) => `Jogar ${target} mesas diferentes`,
            manufacturerTables: (target, manufacturer) => `Jogar ${target} mesas diferentes da ${manufacturer}`,
            decadeTables: (target, decade) => `Jogar ${target} mesas diferentes dos anos ${decade}`,
            differentManufacturers: (target) => `Jogar mesas de ${target} fabricantes diferentes`,
            differentDecades: (target) => `Jogar mesas de ${target} décadas diferentes`,
            neverPlayedTables: (target) => `Jogar ${target} mesas nunca jogadas`,
            dustyTables: (target) => `Jogar ${target} mesas não jogadas há seis meses`,
            tableOfTheDayDays: (target) => `Jogar a mesa do dia em ${target} dias diferentes`,
            tableOfTheWeekGames: (target) => `Jogar ${target} partidas na mesa da semana`,
            activeDays: (target) => `Jogar em ${target} dias diferentes`,
            endurance: (target) => `Jogar ${target} minutos numa mesma mesa`,
            marathon: (target) => `Jogar ${target} minutos no total`,
            randomGames: (target) => `Jogar ${target} partidas aleatórias`,
            sameTableGames: (target) => `Jogar ${target} partidas numa mesma mesa`,
        },
        progress: (value, target, daysText) => `${value}/${target} · ${daysText}`,
        daysLeft: (days) => `faltam ${days} dias`,
        lastDay: "último dia",
        completed: "Desafio concluído!",
        verdictHeader: "Desafio anterior",
        missed: (reached, target) => `Falhado · ${reached}/${target}`,
        toastHeader: "Desafio concluído",
        toastDescription: (count) => (count === 1 ? "Primeiro desafio concluído" : `${count} desafios concluídos`),
    },

    // The Mastery Bar, under the Challenge Card (see common/mastery_bar.js).
    tableMastery: {
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
};
