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
        "terminating": "Returning to game list...",
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

    startupPrompt: {
        introWithPicks: (playerName, dayTitle, weekTitle) => {
            const lines = [`Hi, ${playerName}! How would you like to start?`];
            if (dayTitle) lines.push('---');
            if (dayTitle) lines.push(`Table of the Day: ${dayTitle}`);
            if (weekTitle) lines.push('---');
            if (weekTitle) lines.push(`Table of the Week: ${weekTitle}`);
            return lines.join("\n");
        },
        stayOnLastPlayed: "Stay on Last Played Table",
        tableOfTheDay: "Launch Table of the Day",
        tableOfTheWeek: "Launch Table of the Week",
        randomTable: "Launch a Random Table",
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

    // Labels for menu items this project adds itself (see custom_menu_commands.js, custom_filter.js and hall_of_fame.js).
    customMenuLabels: {
        challengeTables: "Challenge Tables",
        hallOfFameFilter: "Most Played Tables",
        originalTablesFilter: "Original Tables",
        randomGame: "Start Random Game",
        tableOfTheDay: "Launch Table of the Day",
        tableOfTheWeek: "Launch Table of the Week",
        tableSetup: "Table Setup",
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

    // The Achievement List screen (see common/achievement_list.js).
    achievementList: {
        menuEntry: "Your Achievements",
        // The header's title, the section titles, the key caps and the
        // footer's hints are shown in capitals.
        title: "Achievement List",
        totalLine: (unlockedCount, totalCount, percent) => `${unlockedCount} / ${totalCount} achievements unlocked (${percent}%)`,
        unlockedSection: "Unlocked achievements",
        missingSection: "Achievements to earn",
        // After a section's title.
        sectionCount: (count) => `(${count})`,
        // PinballY's button names, as on the cabinet's key caps.
        keyCaps: { next: "Next", prev: "Prev", exit: "Exit" },
        browse: "Browse",
        back: "Back",
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
        menuEntry: "Your Stats",
        title: (name) => `${name}'s stats`,
        gamesPlayed: (count) => `Games played: ${count}`,
        // Minutes on two digits: "42 h 05".
        totalTime: (hours, minutes) => `Total time: ${hours} h ${String(minutes).padStart(2, "0")}`,
        collection: (played, total, percent) => `Collection: ${played}/${total} tables (${percent}%)`,
        achievements: (unlocked, total) => `Achievements: ${unlocked}/${total}`,
        tableOfTheDayStreak: (count, longest) => `Daily streak: ${count} (best ${longest})`,
        tableOfTheWeekStreak: (count, longest) => `Weekly streak: ${count} (best ${longest})`,
        challengesCompleted: (completed, total) => `Challenges completed: ${completed}/${total}`,
        // Most time spent, with that time; "—" before any play.
        favouriteManufacturer: (name, hours, minutes) => `Manufacturer: ${name} (${hours} h ${String(minutes).padStart(2, "0")})`,
        noFavouriteManufacturer: "Manufacturer: —",
        favouriteDecade: (decadeStartYear, hours, minutes) => `Decade: ${decadeStartYear}s (${hours} h ${String(minutes).padStart(2, "0")})`,
        noFavouriteDecade: "Decade: —",
        // Sub-menu entries, with how many tables each list holds.
        mostPlayedTables: (count) => `Most played tables (${count})`,
        neverPlayedTables: (count) => `Never played tables (${count})`,
        back: "Back",
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

    // The Challenge Card, at the top right of the wheel screen (see common/challenge_card.js).
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

    // The Mastery Bar, under the Challenge Card (see common/mastery_bar.js), and the Mastery Toast.
    tableMastery: {
        // The Mastery Levels' names, from level 1 to 10.
        levelNames: ["Rookie", "Apprentice", "Regular", "Adept", "Specialist", "Ace", "Virtuoso", "Prodigy", "Legend", "Pinball Wizard"],
        // A table the active Profile never played.
        toDiscover: "To discover",
        // The Mastery Toast, when a Play reaches a new Mastery Level.
        toastHeader: "Table Mastery",
        toastTitle: (name, level) => `${name} (${level})`,
    },
};
