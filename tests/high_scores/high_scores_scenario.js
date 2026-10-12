// ============================================================
// High Scores tests' scenario: main.js on the fake PinballY globals, with
// the chosen Add-ons and Profiles. Sets what PINemHi reads in each
// table's NVRAM before and after a Play, plays a table as PinballY
// launches it (the reads after "postlaunch" included), switches the
// active Profile, and reads back the High Scores file and the Add-on's
// log lines. Never loaded by PinballY.
// ============================================================

import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { getProfileStore } from "../../common/profiles/profile_store.js";

export const NOW = new Date(2026, 9, 12, 20, 0, 0);
export const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
export const HIGH_SCORES_FILE = `${PROFILES_FOLDER}\\high_scores.json`;
export const GAME_MS = 5 * 60 * 1000;
// Covers the wait after "postlaunch" and the reads, a second at a time.
const READS_STEPS = 15;

export const MEDIEVAL = "Medieval Madness (Williams 1997)";
export const AFM = "Attack from Mars (Bally 1995)";
export const TABLES = [
    { id: 1, configId: MEDIEVAL, title: "Medieval Madness", manufacturer: "Williams", year: 1997, isHidden: false, rom: "mm_109c" },
    { id: 2, configId: AFM, title: "Attack from Mars", manufacturer: "Bally", year: 1995, isHidden: false, rom: "afm_113b" },
];

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

// addOns: the Add-ons on; profiles: { name: { isChild } }, Guest's under
// "guest"; active: the Profile in cabinet.json; files: { path: content }
// seeded before startup.
export async function startHighScores({ addOns = ["highScores"], profiles = {}, active = "guest", tables = TABLES, files = {} } = {}) {
    const fake = createFakePinballYHost({ now: NOW, tables });
    for (const [name, { isChild = false } = {}] of Object.entries(profiles)) {
        fake.addFile(`${PROFILES_FOLDER}\\${name}\\profile.json`, JSON.stringify({ version: 1, plays: {}, notified: [], ...(isChild ? { isChild } : {}) }));
    }
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: active }));
    for (const [path, content] of Object.entries(files)) fake.addFile(path, content);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = addOns.includes(key);

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

    return {
        fake,
        // What PINemHi reads in the table's NVRAM from now on.
        setBoard: (configId, lines, options) => fake.setNvramBoard(configId, lines, options),
        switchTo: (name) => getProfileStore().switchTo(name),
        // Plays the table as PinballY launches it; VPinMAME saves the board
        // after (raw lines) as the game ends.
        play: async (configId, { after, durationMs = GAME_MS } = {}) => {
            const game = fake.getGameInfo(configId);
            fake.playGame(game);
            fake.fire("prelaunch", { game });
            await settle();
            fake.gameStarted(game);
            await finishReads();
            fake.advanceTime(Math.max(durationMs - READS_STEPS * 1000, 0));
            await settle();
            if (after) fake.setNvramBoard(configId, after);
            fake.gameOver(game);
            fake.fire("postlaunch", { game });
            await finishReads();
        },
        log: () => fake.logLines().filter(line => line.startsWith("[HighScores]")),
        saved: () => {
            const text = fake.readFile(HIGH_SCORES_FILE);
            return text === undefined ? undefined : JSON.parse(text);
        },
    };
}
