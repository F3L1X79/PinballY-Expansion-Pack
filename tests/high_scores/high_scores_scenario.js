// ============================================================
// High Scores tests' scenario: main.js on the fake PinballY globals, with
// the chosen Add-ons and Profiles. Sets what PINemHi reads in each
// table's NVRAM before and after a Play, plays a table as PinballY
// launches it (the reads after "postlaunch" included), switches the
// active Profile, resets a Profile, and reads back the High Scores file,
// the toasts drawn, the Achievements Notified and shown in the Achievement
// List, and the Add-on's log lines. Never loaded by PinballY.
// ============================================================

import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { getProfileStore } from "../../common/profiles/profile_store.js";

export const NOW = new Date(2026, 9, 12, 20, 0, 0);
export const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
export const HIGH_SCORES_FILE = `${PROFILES_FOLDER}\\high_scores.json`;
// A Profile's own Avatar file, and files to seed for those Profiles' Avatars.
export const avatarOf = name => `${PROFILES_FOLDER}\\${name}\\avatar.png`;
export const avatarFiles = (...names) => Object.fromEntries(names.map(name => [avatarOf(name), "png"]));
export const GAME_MS = 5 * 60 * 1000;
// Covers the wait after "postlaunch" and the reads, a second at a time.
const READS_STEPS = 15;

export const MEDIEVAL = "Medieval Madness (Williams 1997)";
export const AFM = "Attack from Mars (Bally 1995)";
export const TABLES = [
    { id: 1, configId: MEDIEVAL, title: "Medieval Madness", manufacturer: "Williams", year: 1997, isHidden: false, rom: "mm_109c" },
    { id: 2, configId: AFM, title: "Attack from Mars", manufacturer: "Bally", year: 1995, isHidden: false, rom: "afm_113b" },
];

// count tables, "Table 1 (Williams 1990)" on, each on its own ROM.
export const romTables = count => Array.from({ length: count }, (_, index) => ({
    id: index + 1, configId: `Table ${index + 1} (Williams 1990)`, title: `Table ${index + 1}`,
    manufacturer: "Williams", year: 1990, isHidden: false, rom: `rom_${index + 1}`,
}));
// Longer than a toast's whole life (rise, hold, fade).
const ONE_TOAST_MS = 6000;

// What PINemHi prints for a ROM it does not support.
export const NOT_SUPPORTED = ["Not supported rom : C:\\vPinball\\VisualPinball\\VPinMAME\\nvram\\mm_109c.nv", ""];

// A board as PINemHi prints it: a Grand Champion, then numbered places;
// each entry is [initials, score].
export function boardLines(champion, places) {
    return [
        "GRAND CHAMPION",
        `${champion[0]} ${champion[1]}`,
        "",
        "HIGHEST SCORES",
        ...places.map(([initials, score], index) => `${index + 1}) ${initials} ${score}`),
        "",
        "LOOP CHAMPION",
        "BRE 20 LOOPS",
    ];
}

// boardLines from a list of entries, the first place first.
export const board = (...entries) => boardLines(entries[0], entries.slice(1));
// A factory board of five places.
export const FACTORY = board(["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"], ["RCF", "10000000"]);
// The factory board with a new second place.
export const SECOND_PLACE = board(["SLL", "52000000"], ["ALI", "45000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]);
// The High Scores family's IDs among these Achievement IDs.
export const highScoreIds = ids => ids.filter(id => id.startsWith("highScoreTables:") || id.startsWith("tableRecord"));

// addOns: the Add-ons on; profiles: { name: { isChild } }, Guest's under
// "guest"; active: the Profile in cabinet.json; files: { path: content }
// seeded before startup; language: the interface language.
export async function startHighScores({
    addOns = ["highScores"], profiles = {}, active = "guest", tables = TABLES, files = {}, language = "en",
} = {}) {
    const fake = createFakePinballYHost({ now: NOW, tables });
    for (const [name, { isChild = false } = {}] of Object.entries(profiles)) {
        fake.addFile(`${PROFILES_FOLDER}\\${name}\\profile.json`, JSON.stringify({ version: 1, plays: {}, notified: [], ...(isChild ? { isChild } : {}) }));
    }
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: active }));
    for (const [path, content] of Object.entries(files)) fake.addFile(path, content);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = addOns.includes(key);
    config.language = language;

    // Imported once the language is set: the toast module and the
    // Achievement List read the texts.
    const { toastDrawings } = await import("../achievements/achievement_toast_reader.js");
    const { pressAndGlide, readRows } = await import("../achievements/achievement_list_reader.js");
    const { default: lang } = await import("../../common/core/i18n.js");
    await import("../../main.js");
    await settle();
    // With the Profile picker off, main.js switched to Guest.
    if (getProfileStore().getActiveProfile().name !== active) getProfileStore().switchTo(active);

    // A second at a time, so each read's answer settles before its timeout falls due.
    const finishReads = async () => {
        for (let step = 0; step < READS_STEPS; step++) {
            await settle();
            fake.advanceTime(1000);
        }
        await settle();
    };

    // Lets every waiting toast show, so each Achievement is Notified.
    async function showEveryToast() {
        for (let guard = 0; guard < 100; guard++) {
            const shownCount = toastDrawings(fake).length;
            fake.advanceTime(ONE_TOAST_MS);
            await settle();
            if (toastDrawings(fake).length === shownCount) break;
        }
    }

    return {
        fake,
        showEveryToast,
        resetProfile: (name) => getProfileStore().resetProfile(name),
        // The IDs of the Achievements the named Profile was Notified of.
        notified: (name) => [...getProfileStore().getNotifiedOf(name)],
        // How the Achievement List shows each Achievement of these titles:
        // { title, progress, unlocked }, progress the short text of its
        // Achievement Progress or null; undefined for a title not in the
        // list. Opened from the main menu and closed again with Exit.
        readShown: (titles) => {
            fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
            fake.selectMenuItem(lang.achievementList.menuEntry);
            const rows = readRows(fake, lang.achievementList);
            pressAndGlide(fake, "Exit");
            return titles.map(title => {
                const row = rows.find(shown => shown.title === title);
                return row && { title, progress: row.progress, unlocked: row.unlocked };
            });
        },
        // What PINemHi reads in the table's NVRAM from now on.
        setBoard: (configId, lines, options) => fake.setNvramBoard(configId, lines, options),
        switchTo: (name) => getProfileStore().switchTo(name),
        // Plays the table as PinballY launches it; VPinMAME saves the board
        // after (raw lines) as the game ends, read as afterRead says
        // (setBoard's options).
        play: async (configId, { after, afterRead, durationMs = GAME_MS } = {}) => {
            const game = fake.getGameInfo(configId);
            fake.playGame(game);
            fake.fire("prelaunch", { game });
            await settle();
            fake.gameStarted(game);
            await finishReads();
            fake.advanceTime(Math.max(durationMs - READS_STEPS * 1000, 0));
            await settle();
            if (after) fake.setNvramBoard(configId, after, afterRead);
            fake.gameOver(game);
            fake.fire("postlaunch", { game });
            await finishReads();
        },
        pendingTimerCount: () => fake.pendingTimerCount(),
        // Every toast drawn so far, its texts joined with " | ".
        toasts: () => toastDrawings(fake).map(drawing => drawing.texts.join(" | ")),
        log: () => fake.logLines().filter(line => line.startsWith("[HighScores]")),
        saved: () => {
            const text = fake.readFile(HIGH_SCORES_FILE);
            return text === undefined ? undefined : JSON.parse(text);
        },
    };
}
