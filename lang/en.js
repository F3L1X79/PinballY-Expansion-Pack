// ============================================================
// English labels for UI elements added or translated by this project.
// ============================================================

// The active Profile's play time of a table, as PinballY writes its own.
const formatPlayTime = (hours, minutes) => (hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")} hours`
    : `${minutes} minute${minutes === 1 ? "" : "s"}`);

// Hours of play with one decimal, as an Achievement Progress shows them.
const formatHours = hours => hours.toFixed(1);

export default {
    // PinballY's native menu titles are already in English; only the ones
    // renamed by this project are listed.
    nativeMenuLabels: {
        "All Games": "All Tables",
        "Favorites": "Favorite Tables",
    },
    mediaCaptureItemLabels: {},
    mediaCaptureActionLabels: {},

    // Status text shown in PinballY's launch overlay, keyed by the
    // language-independent event id (see the "launchoverlaymessage" event).
    launchOverlayMessages: {
        "after": "",
        "capturing": "Capturing...",
        "gameover": "Game Over",
        "init": "",
        "launching": "Loading...",
        "running": "Launching table...",
        "terminating": "Returning to tables…",
    },

    // The step under way, written in gold beneath the Loader while a
    // table launches or closes (Seamless Launch Overlay).
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
            return `Select the items you'd like to capture, then select Begin Capture. This will launch your game, capture screen images, and automatically exit the game when done. The process will take about ${seconds} second${plural}. (!) means that an existing item will be replaced.`;
        },
        captureInstructionsOneMinute: () =>
            "Select the items you'd like to capture, then select Begin Capture. This will launch your game, capture screen images, and automatically exit the game when done. The process will take about 1 minute. (!) means that an existing item will be replaced.",
        captureItemAction: (item, action) => `${item}: ${action}`,
        decadeTables: (decade) => `${decade}s Tables`,
        genericTables: (name) => `${name} Tables`,
        mediaGameMismatchWarning: (draggedGame, currentGame) =>
            `It looks like some of the media files you're adding might be intended for a different game, "${draggedGame}". Media files are always added to the game selected on the wheel, currently "${currentGame}". Do you want to add these media items to the current game?`,
        mediaGameMismatchWarningMultiple: (gameList, currentGame) =>
            `It looks like some of the media files you're adding might be intended for other games: ${gameList}. Media files are always added to the game selected on the wheel, currently "${currentGame}". Do you want to add these media items to the current game?`,
        mediaReadyToAdd: (gameName) =>
            `The following media items are ready to be added for ${gameName}. Choose the items you'd like to add or replace.`,
        starTables: (count) => `${count}-Star Tables`,
        startDelay: (seconds) => `Adjust Start Delay (${seconds} sec)`,
        unratedTables: () => "Unrated Tables",
        batchCaptureReady: (count, duration) => `Batch Capture is ready to go!  ${count} game(s) will be included in this process, which will take roughly ${duration}.`,
        confirmDeleteGameDetails: (title) => `Do you really want to delete the game details for ${title}?  (This only deletes the bibliographic information, not any game files or media.)`,
        showCustomView: (name) => `Show ${name}`,
        durationSeconds: (count) => `${count} second${count === 1 ? "" : "s"}`,
        durationMinutes: (count) => `${count} minute${count === 1 ? "" : "s"}`,
        durationHours: (hours, minutes) => (minutes > 0 ? `${hours}:${String(minutes).padStart(2, "0")} hours` : `${hours} hour${hours === 1 ? "" : "s"}`),
    },

    ratingPrompt: {
        message: (tableTitle, minutes) =>
            `You've played "${tableTitle}" for over ${minutes} minutes! Would you like to rate it now?`,
        rateNow: "Rate Now",
        notNow: "Not Now",
    },

    // The Button Hints at the foot of every drawn screen and the Exit
    // Button's tooltip (see GLOSSARY.md). The key caps and the footer's
    // words are shown in capitals.
    buttonHints: {
        // PinballY's button names, as on the cabinet's key caps.
        keyCaps: { next: "Next", prev: "Prev", select: "Select", exit: "Exit" },
        browse: "Browse",
        // The flippers on a High Score Board longer than the window.
        scroll: "Scroll",
        choose: "Choose",
        // Exit's word and the Exit Button's tooltip: Back where Exit brings
        // back a screen or a menu, Close where it leaves the bare wheel.
        back: "Back",
        close: "Close",
    },

    // The Welcome Screen, at startup (see addons/welcome_screen.js).
    welcomeScreen: {
        // By the hour: 5-12 h, 12-18 h, 18-22 h, 22-5 h.
        greetings: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", night: "Still up" },
        // The greeting's runs, the Profile's name (shown in gold) apart.
        greetingWithName: (greeting, name) => [`${greeting}, `, name, "!"],
        greetingAlone: (greeting) => `${greeting}!`,
        stayOn: (tableTitle) => `Stay on ${tableTitle}`,
        stayOnWheel: "Stay on the wheel",
        randomTable: "Launch a random table",
        menuEntry: "Welcome Screen",
        // The active Profile's Daily Streak under the greeting, from 2 days
        // on, its count shown in a square before the text.
        cabinetStreak: {
            notYetToday: "days in a row on the cabinet: keep it going!",
            playedToday: "days in a row on the cabinet",
        },
        // The active Profile's Lost Record under the greeting, after the
        // Daily Streak line, when it lost a single one.
        lostRecord: (taker, tableTitle) => `${taker} took your record on ${tableTitle}`,
        // Several Lost Records in one line: the tables named (each
        // { taker, tableTitle }), the most recent first, then how many more.
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
        manufacturer: (position) => `Table ${position}/[Filter.Count] - made by [Game.Manuf].`,
        manufacturerFictional: (position) => `Table ${position}/[Filter.Count] - fictional pinball table.`,
        playCount: (position, count) => `Table ${position}/[Filter.Count] - launched ${count} times.`,
        playTime: (position, hours, minutes) => `Table ${position}/[Filter.Count] - played for ${formatPlayTime(hours, minutes)}.`,
        year: (position) => `Table ${position}/[Filter.Count] - released in [Game.Year].`,
    },

    // Upper status line messages, after the player's own from PinballY's options.
    // [Filter.Count] is a PinballY placeholder — keep it as-is.
    upperStatusLines: {
        welcome: name => `Welcome, ${name}!`,
        tablesAvailable: "[Filter.Count] tables are available!",
        launchHint: "Launch button to start a table.",
        browseHint: "Left/right flippers to browse the tables.",
        signOff: "Have fun!",
    },

    // Labels for menu items this project adds itself (see custom_menu_commands.js, custom_filter.js, hall_of_fame.js and tables_to_discover.js).
    customMenuLabels: {
        challengeTables: "Challenge Tables",
        hallOfFameFilter: "Most Played Tables",
        myHighScoresFilter: "My High Scores",
        hiddenTablesFilter: "Hidden Tables",
        tablesToDiscoverFilter: "Tables to Discover",
        originalTablesFilter: "Original Tables",
        tableSetup: "Set Up Table",
        // The native High Scores item, in the main menu only: other menus keep nativeMenuLabels.
        tableScores: "Table Scores",
        // The Filter Picker's way back, and its main menu entry naming the Active Filter.
        filterPickerBack: "Back",
        activeFilter: (name) => `Active filter: ${name}`,
        // The Drawn main menu's "Change Filter" entry, and its footer's label before the Active Filter.
        changeFilter: "Change Filter",
        activeFilterLabel: "Active filter:",
    },

    // Thresholded titles are keyed by their threshold, which is part of the
    // Achievement ID (see achievements/).
    achievements: {
        dailyFirstPlayTitle: () => "Hello, Table of the Day!",
        dailyFirstPlayDescription: () => "Play the table of the day for the first time.",
        weeklyFirstPlayTitle: () => "Weekly Date",
        weeklyFirstPlayDescription: () => "Play the table of the week for the first time.",
        dailyPeriodsPlayedTitles: {
            10: "Sunday Explorer",
            25: "Curious Explorer",
            50: "Seasoned Explorer",
            100: "Indiana Flippers",
        },
        dailyPeriodsPlayedDescription: (days) => `Play the table of the day on ${days} different days.`,
        weeklyPeriodsPlayedTitles: {
            4: "A Month of Dates",
            10: "Weekly Regular",
            26: "Six Months of Loyalty",
            52: "A Year Without a Wrinkle",
        },
        weeklyPeriodsPlayedDescription: (weeks) => `Play the table of the week in ${weeks} different weeks.`,
        dailyStreakTitles: {
            3: "Third Time's the Charm",
            7: "Perfect Week",
            14: "Iron Fortnight",
            30: "Pinball Monk",
        },
        dailyStreakDescription: (days) => `Play the table of the day ${days} days in a row.`,
        weeklyStreakTitles: {
            4: "A Flawless Month",
            12: "Loyal Subscriber",
        },
        weeklyStreakDescription: (weeks) => `Play the table of the week ${weeks} weeks in a row.`,
        manufacturerCompletionTitle: (manufacturer) => `Die-Hard ${manufacturer} Fan`,
        manufacturerCompletionDescription: (manufacturer, count) => `Play all ${count} ${manufacturer} tables at least once.`,
        firstTableTitle: () => "First Steps",
        firstTableDescription: () => "Play your very first table.",
        collectionPercentTitles: {
            10: "A Taste of Metal",
            25: "Budding Collector",
            50: "Halftime",
            75: "Seen Almost Everything",
            100: "Nothing Escapes Me",
        },
        collectionPercentDescription: (percent, playedCount, totalCount) => `Play ${playedCount} of your ${totalCount} tables (${percent}% of your collection).`,
        worldTourTitle: () => "World Tour",
        worldTourDescription: () => "Browse every table of the wheel in one go, without launching any.",
        playTimeMilestoneTitles: {
            1: "Warming Up",
            5: "Getting Serious",
            10: "Hooked on Pinball",
            50: "Pinball in the Blood",
            100: "Tilt Legend",
        },
        playTimeMilestoneDescription: (hours) => `Play for more than ${hours} hour${hours > 1 ? "s" : ""} in total.`,
        decadeCompletionTitle: (decadeStartYear) => `A Trip Back to the ${decadeStartYear}s`,
        decadeCompletionDescription: (decadeStartYear, count) => `Play all ${count} tables from the ${decadeStartYear}s at least once.`,
        categoryCompletionTitle: (category) => `${category} Master`,
        categoryCompletionDescription: (category, count) => `Play all ${count} "${category}" tables at least once.`,
        marathonTitles: {
            30: "Mini Marathon",
            60: "Marathoner",
        },
        marathonDescription: (minutes) => `Play a single session lasting over ${minutes} minutes.`,
        cabinetStreakTitles: {
            3: "Back for More",
            7: "A Week at the Cabinet",
            15: "Cabinet Regular",
            30: "Part of the Furniture",
        },
        cabinetStreakDescription: (days) => `Play on the cabinet ${days} days in a row, any table.`,
        rageQuitTitle: () => "Rage Quit?!",
        rageQuitDescription: (minSeconds, maxSeconds) => `Quit a table after only ${minSeconds} to ${maxSeconds} seconds...`,
        grandReturnTitle: () => "The Grand Comeback",
        grandReturnDescription: (days) => `Replay a table after ${days} or more days away.`,
        // A Secret Achievement's hint, shown instead of its description while it is missing.
        rageQuitHint: () => "Some tables just aren't your day...",
        grandReturnHint: () => "Old friends are always glad to see you again...",
        worldTourHint: () => "Some journeys are made without ever pressing Start...",
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
        snackTimeTitle: () => "Snack Time",
        snackTimeDescription: () => "Start a game between 4 and 5 pm.",
        snackTimeHint: () => "Just one game before homework...",
        wednesdayOffTitle: () => "Wednesday Off",
        wednesdayOffDescription: () => "Start a game on a Wednesday afternoon.",
        wednesdayOffHint: () => "No school this afternoon...",
        grownUpRecordTakenTitle: () => "Beat the Grown-Ups",
        grownUpRecordTakenDescription: () => "Take a Table Record from a grown-up.",
        randomGamesTitles: {
            10: "Why Not?",
            25: "Heads or Tails",
            50: "Dice Roller",
            100: "Poker face",
        },
        randomGamesDescription: (count) => `Play ${count} Random Games.`,
        challengesCompletedTitles: {
            1: "First Challenge",
            5: "Challenge Taker",
            10: "Challenge Seeker",
            25: "Challenge Hunter",
            50: "Challenge Master",
            100: "Legend of the Week",
        },
        challengesCompletedDescription: (count) => (count === 1 ? "Complete a Challenge." : `Complete ${count} Challenges.`),
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
            3: "Express World Tour",
            5: "Pinball Butterfly",
            8: "Serial Unfaithful",
            10: "Pinball Casanova",
        },
        dayManufacturersDescription: (count) => `Play tables from ${count} different manufacturers on the same day.`,
        // Header of the Achievement Toast card.
        toastHeader: "Achievement unlocked",
    },

    // The Achievement List screen (see common/achievements/achievement_list.js).
    achievementList: {
        menuEntry: "My Achievements",
        // The header's title and the section titles are shown in capitals.
        title: "Achievement List",
        totalLine: (unlockedCount, totalCount, percent) => `${unlockedCount} / ${totalCount} achievements unlocked (${percent}%)`,
        unlockedSection: "Unlocked achievements",
        missingSection: "Achievements to earn",
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
        menuEntry: "My Profile",
        // The buttons at the card's foot.
        buttons: {
            achievements: "Achievements",
            frame: "Avatar Frames",
            mostPlayedTables: "Most Played Tables",
            tablesToDiscover: "Tables to Discover",
            household: "Household Stats",
        },
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
            highScoresHeld: "High Scores held",
            tableRecordsHeld: "Table Records held",
            cabinetStreak: "Days in a row",
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
        menuEntry: "Change Player",
        pickerTitle: "Who's playing?",
        pickerHint: "Flippers: browse · Start: choose · Exit: cancel",
        guestName: "Guest",
        greeting: name => `Hi ${name}!`,
    },

    // The Profile Reset, in PinballY's Exit menu for an Admin Profile.
    profileReset: {
        menuEntry: "Reset profile",
        listTitle: "Which profile starts over?",
        confirm: name => `Reset ${name}? All of its plays, streaks, Challenges and achievements will be erased.`,
        yes: "Yes, reset",
        no: "No",
        cancel: "Cancel",
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
        time: (hours, minutes) => `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`,
    },

    // The Challenge Card, at the top right of the wheel screen (see common/challenges/challenge_card.js).
    challenges: {
        cardHeader: "Challenge of the week",
        // One title per Challenge template, from its target and parameter.
        titles: {
            differentTables: (target) => `Play ${target} different tables`,
            manufacturerTables: (target, manufacturer) => `Play ${target} different ${manufacturer} tables`,
            decadeTables: (target, decade) => `Play ${target} different tables from the ${decade}s`,
            differentManufacturers: (target) => `Play tables from ${target} different manufacturers`,
            differentDecades: (target) => `Play tables from ${target} different decades`,
            neverPlayedTables: (target) => `Play ${target} tables you never played`,
            dustyTables: (target) => `Play ${target} tables you haven't played for six months`,
            tableOfTheDayDays: (target) => `Play the Table of the Day on ${target} different days`,
            tableOfTheWeekGames: (target) => `Play ${target} games on the Table of the Week`,
            activeDays: (target) => `Play on ${target} different days`,
            endurance: (target) => `Play ${target} minutes on one table`,
            marathon: (target) => `Play ${target} minutes in total`,
            randomGames: (target) => `Play ${target} Random Games`,
            sameTableGames: (target) => `Play ${target} games on the same table`,
        },
        progress: (value, target, daysText) => `${value}/${target} · ${daysText}`,
        daysLeft: (days) => `${days} days left`,
        lastDay: "last day",
        completed: "Challenge completed!",
        verdictHeader: "Previous Challenge",
        missed: (reached, target) => `Missed · ${reached}/${target}`,
        toastHeader: "Challenge completed",
        toastDescription: (count) => (count === 1 ? "First Challenge completed" : `${count} Challenges completed`),
    },

    // The Mastery Bar, under the Challenge Card (see common/mastery/mastery_bar.js), the Mastery Toast
    // and the Collection Mastery's texts.
    tableMastery: {
        // Collection Mastery: the goal toward the next Collection Tier
        // (that many tables at the level of that name), how many tables
        // already reach it, or, at the last tier, that all of them did.
        collection: {
            goal: (count, levelName) => `Goal: ${count} ${count === 1 ? "table" : "tables"} at ${levelName}`,
            current: (reached, needed) => `Current: ${reached}/${needed}`,
            allTables: (levelName) => `All your tables: ${levelName}`,
        },
        // The Mastery Levels' names, from level 1 to 10.
        levelNames: ["Rookie", "Apprentice", "Regular", "Adept", "Specialist", "Ace", "Virtuoso", "Prodigy", "Legend", "Pinball Wizard"],
        // A table the active Profile never played.
        toDiscover: "To discover",
        // The Mastery Toast, when a Play reaches a new Mastery Level.
        toastHeader: "Table Mastery",
        toastTitle: (name, level) => `${name} (${level})`,
        // The Mastery Toast of a new Collection Tier.
        collectionToastHeader: "Collection Mastery",
        collectionToastTitle: (tier, name) => `Tier ${tier}: ${name}`,
        collectionToastDescription: (count, name) => `${count} ${count === 1 ? "table" : "tables"} at ${name} or above`,
    },
    profileRewards: {
        // The Avatar Frames' names, from Collection Tier 1 to 10.
        frameNames: [
            "Enchanted Forest", "Steam and Gears", "Arcade Neon", "Eternal Frost", "Spice of Arrakis",
            "Arcane Grimoire", "Orbital Station", "Dragon's Breath", "Royal Pinball", "Celestial Legend",
        ],
        // The Mastery Toast's extra line, naming the frames its Collection
        // Tier unlocks (more than one when a Play raised it by several tiers).
        toastLine: (names) => `${names.length === 1 ? "New frame" : "New frames"}: ${names.join(", ")}`,
        // The Holiday Frame toast's header; its title is the toast line.
        toastHeader: "Holiday Frame",
        // Each Holiday Frame's name, and what unlocks it: the locked row's
        // status in the frame list and the description of its toast.
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
    playerLevel: {
        // The Level Toast, when Achievements bring a higher Player Level.
        toastHeader: "Level up",
        toastTitle: (level) => `Level ${level}`,
        toastDescription: "Your Achievements took you to a new level.",
    },
    // The High Score toast, after a Play that won places on a table's
    // board: for the best place won, or the Table Record when it is first.
    highScores: {
        toastHeader: "High Score",
        toastTitle: (table, place) => {
            const teen = place % 100 >= 11 && place % 100 <= 13;
            const suffix = teen ? "th" : (["th", "st", "nd", "rd"][place % 10] || "th");
            return `High score on ${table}: ${place}${suffix} place`;
        },
        tableRecordTitle: (table) => `Table Record on ${table}!`,
        // The score, thousands separated.
        toastScore: (score) => `${score} points`,
        // A Table Record taken from another Profile.
        takenFrom: (profile) => `taken from ${profile}`,
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
            reading: "Reading\u2026",
            // Over the last known board when the fresh read failed.
            notRefreshed: "These scores could not be refreshed",
            notSupported: "This table's high scores are not supported",
            // A table without a ROM whose VPReg.stg section or text file is not learned yet.
            notLearned: "Play a game to bring up this table's high scores",
        },
    },
};
