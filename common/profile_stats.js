// ============================================================
// Profile Stats module: the screen the player opens from the main menu to
// sum up the active Profile's own plays (games played, total time,
// collection completion, Achievements Unlocked, Period Table Streaks,
// completed Challenges, favourite manufacturer and decade) in a native
// PinballY menu named after the Profile, closed by two sub-menus: the most
// played tables (the Hall of Fame) and the never played tables. Selecting a
// table there puts the wheel on it, switching to the all-tables filter when
// the current one hides it.
// Created from the PinballY host, the Profile store, the Achievement List
// (its counts, and opening it from the Achievements line, Exit there
// showing this screen again), the Table of the Day and Table of the Week,
// and the Challenge module (null when the Challenges Add-on is disabled:
// no Challenges line). Every number and list
// is read again each time a menu opens. Listens to "command". Opens its
// menus directly, not through the wheel dialog module: the player asked for
// them.
// ============================================================

import lang from "./i18n.js";
import { displayNameOf } from "./profile_name.js";
import { safeHandler } from "./safe_handler.js";
import { getDecadeStartYear } from "./decade.js";
import { countPlayedTables, tablesVisibleTo } from "./visible_tables.js";
import { getHallOfFame } from "./hall_of_fame.js";
import { getTablesToDiscover } from "./tables_to_discover.js";
import { ALL_TABLES_FILTER } from "./pinbally_host.js";

const SCRIPT_NAME = "ProfileStats";
const MENU_ID = "profileStats";
const TABLE_LIST_MENU_ID = "profileStatsTables";
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
// PinballY's own filter showing every table.

export function createProfileStats(host, { profileStore, achievementList, tableOfTheDay, tableOfTheWeek, challenges = null }) {
    const { profileStats: TEXT } = lang;
    const achievementsCommand = host.allocateCommand("profileStatsAchievements");
    const backToStatsCommand = host.allocateCommand("profileStatsBackToStats");
    // One command per line of a list, by position: a line with cmd -1 can't
    // be selected, so paging couldn't move through it. The never played list
    // depends on the collection, so the pool grows on demand instead of
    // being allocated all at startup.
    const tableCommands = [];
    // The list on screen, so Back puts the cursor on its entry, and its
    // tables, so a line's command finds its table.
    let shown = { list: null, tables: [] };

    const tableLists = [
        {
            command: host.allocateCommand("profileStatsMostPlayed"),
            label: TEXT.mostPlayedTables,
            readTables: profileTables => getHallOfFame(profileTables, profileStore.getPlay),
        },
        {
            command: host.allocateCommand("profileStatsNeverPlayed"),
            label: TEXT.neverPlayedTables,
            readTables: profileTables => getTablesToDiscover(profileTables, profileStore),
        },
    ];

    function getTableCommand(index) {
        while (tableCommands.length <= index) {
            tableCommands.push(host.allocateCommand(`profileStatsTable.${tableCommands.length}`));
        }
        return tableCommands[index];
    }

    // Over every table the Profile played, hidden or no longer listed ones
    // included: hiding a table never erases a player's history.
    function sumPlays() {
        const plays = Object.values(profileStore.getProfileData().plays);
        return {
            count: plays.reduce((sum, play) => sum + play.count, 0),
            seconds: plays.reduce((sum, play) => sum + play.seconds, 0),
        };
    }

    // The Collection Achievements' rule, so the two never disagree.
    function readCompletion(profileTables) {
        const played = countPlayedTables(profileTables, profileStore);
        const percent = profileTables.length === 0 ? 0 : Math.round(played / profileTables.length * 100);
        return { played, total: profileTables.length, percent };
    }

    // The group with the most play seconds over the tables the Profile can see; ties go to
    // the most games, then to alphabetical order, so the favourite never
    // changes at random. Tables without a group key are skipped.
    function findFavourite(profileTables, getKey) {
        const groups = new Map();
        for (const game of profileTables) {
            const key = getKey(game);
            const play = profileStore.getPlay(game.configId);
            if (key === null || play.count === 0) continue;
            const group = groups.get(key) || { key, count: 0, seconds: 0 };
            group.count += play.count;
            group.seconds += play.seconds;
            groups.set(key, group);
        }
        const [favourite = null] = [...groups.values()].sort((a, b) =>
            b.seconds - a.seconds || b.count - a.count || String(a.key).localeCompare(String(b.key)));
        return favourite;
    }

    function toHoursAndMinutes(seconds) {
        const totalMinutes = Math.floor(seconds / SECONDS_PER_MINUTE);
        return [Math.floor(totalMinutes / MINUTES_PER_HOUR), totalMinutes % MINUTES_PER_HOUR];
    }

    function favouriteLine(favourite, format, noneText) {
        return favourite === null ? noneText : format(favourite.key, ...toHoursAndMinutes(favourite.seconds));
    }

    function show(selectedList = null) {
        const plays = sumPlays();
        const profileTables = tablesVisibleTo(host.getVisibleTables(), profileStore);
        const completion = readCompletion(profileTables);
        const favouriteManufacturer = findFavourite(profileTables, game => game.manufacturer || null);
        const favouriteDecade = findFavourite(profileTables, game => getDecadeStartYear(game.year));
        const achievements = achievementList.countAll();
        // Without the Challenges Add-on, no Challenges line.
        const challengeRecord = challenges && challenges.getRecord();
        const info = title => ({ title, cmd: -1 });
        // An empty list is left out: the player never opens an empty menu.
        const listItems = tableLists
            .map(list => ({ list, count: list.readTables(profileTables).length }))
            .filter(({ count }) => count > 0)
            .map(({ list, count }) => ({
                title: list.label(count),
                cmd: list.command,
                ...(list === selectedList ? { selected: true } : {}),
            }));

        host.showMenu(MENU_ID, [
            info(TEXT.title(displayNameOf(profileStore.getActiveProfile()))),
            { cmd: -1 },
            info(TEXT.gamesPlayed(plays.count)),
            info(TEXT.totalTime(...toHoursAndMinutes(plays.seconds))),
            info(TEXT.collection(completion.played, completion.total, completion.percent)),
            { title: TEXT.achievements(achievements.unlocked, achievements.total), cmd: achievementsCommand },
            info(TEXT.tableOfTheDayStreak(tableOfTheDay.getStreak(), tableOfTheDay.getLongestStreak())),
            info(TEXT.tableOfTheWeekStreak(tableOfTheWeek.getStreak(), tableOfTheWeek.getLongestStreak())),
            ...(challengeRecord ? [info(TEXT.challengesCompleted(challengeRecord.completed, challengeRecord.total))] : []),
            info(favouriteLine(favouriteManufacturer, TEXT.favouriteManufacturer, TEXT.noFavouriteManufacturer)),
            info(favouriteLine(favouriteDecade, TEXT.favouriteDecade, TEXT.noFavouriteDecade)),
            ...(listItems.length > 0 ? [{ cmd: -1 }, ...listItems] : []),
            { cmd: -1 },
            { title: TEXT.back, cmd: host.getBuiltInCommand("MenuReturn") },
        ]);
    }

    // Paged like an Achievement Family: the never played list can be longer
    // than the screen.
    function showTableList(list) {
        const tables = list.readTables(tablesVisibleTo(host.getVisibleTables(), profileStore));
        host.showMenu(TABLE_LIST_MENU_ID, [
            { cmd: host.getBuiltInCommand("MenuPageUp") },
            ...tables.map((game, index) => ({ title: game.title, cmd: getTableCommand(index) })),
            { cmd: host.getBuiltInCommand("MenuPageDown") },
            { cmd: -1 },
            { title: TEXT.back, cmd: backToStatsCommand },
        ]);
        shown = { list, tables };
    }

    // Instantly, without the Random Game spin: the player then launches it
    // with Play. The current filter is kept when it shows the table.
    function putWheelOn(game) {
        const findOnWheel = () => host.getWheelTables().findIndex(wheelGame => wheelGame.configId === game.configId);
        let offset = findOnWheel();
        if (offset < 0) {
            host.setCurrentFilter(ALL_TABLES_FILTER);
            offset = findOnWheel();
        }
        if (offset < 0) {
            host.log(`[${SCRIPT_NAME}] "${game.title}" is not on the wheel, even with every table shown.`);
            return;
        }
        host.setWheelGame(offset);
    }

    // Fires on every command: the Achievements line opens the Achievement
    // List in place of this screen, a list entry opens its tables, a table
    // puts the wheel on it as the menu closes, Back from a list returns here.
    host.on("command", safeHandler(SCRIPT_NAME, ev => {
        const list = tableLists.find(tableList => tableList.command === ev.id);
        const tableIndex = tableCommands.indexOf(ev.id);
        if (ev.id === achievementsCommand) {
            // Exit from the list comes back here.
            achievementList.open(() => show());
        } else if (list) {
            showTableList(list);
        } else if (tableIndex >= 0 && tableIndex < shown.tables.length) {
            putWheelOn(shown.tables[tableIndex]);
        } else if (ev.id === backToStatsCommand) {
            show(shown.list);
        }
    }));

    return { open: () => show() };
}
