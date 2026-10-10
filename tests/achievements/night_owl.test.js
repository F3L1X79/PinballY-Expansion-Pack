// ============================================================
// Night Owl, the first Secret Achievement of the Surprises family, started
// through main.js on the fake PinballY globals: only a Play started from
// 00:00 to 03:59 unlocks it, for the Profile active at its start, Guest
// included; while missing, its row shows "???" and its hint. A Child
// Profile never sees it, in the list or in a toast, even after a Play at
// 01:00. A Profile Reset lets the reset Profile unlock it again.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import { toastDrawings } from "./achievement_toast_reader.js";
import { readRows, press } from "./achievement_list_reader.js";
import config from "../../common/config.js";

// Wednesday 23 September 2026, one minute before midnight.
const NOW = new Date(2026, 8, 23, 23, 59, 0);
const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const profileFile = name => `${PROFILES}\\${name}\\profile.json`;
const PLAY_MS = 5 * 60 * 1000;
// Under a minute, and too short for a rage quit.
const SHORT_GAME_MS = 20 * 1000;
// Longer than an Achievement Toast's whole life (rise, hold, fade).
const TOAST_MS = 6000;

function table(id, title) {
    return {
        id, configId: title, title, manufacturer: "", year: 0, categories: [],
        playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false,
    };
}

const TABLE = table(1, "Homebrew Table");
const PERIOD_TABLE = table(2, "Period Table");

test("only a Play started from 00:00 to 03:59 unlocks Night Owl, never for a Child Profile", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: [TABLE, PERIOD_TABLE] });
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "guest" }));
    fake.addFile(profileFile("Alice"), JSON.stringify({ version: 1 }));
    fake.addFile(profileFile("Bob"), JSON.stringify({ version: 1, isChild: true }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = ["sessionStatsTracker", "achievements"].includes(key);
    }
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    const { getProfileStore } = await import("../../common/profile_store.js");
    const TEXT = lang.achievements;
    const LIST_TEXT = lang.achievementList;
    await import("../../main.js");
    await settle();
    const store = getProfileStore();

    // Moves the clock forward to that hour and minute, on the next day if needed.
    function waitUntil(hours, minutes) {
        const target = new Date(fake.now());
        target.setHours(hours, minutes, 0, 0);
        if (target <= fake.now()) target.setDate(target.getDate() + 1);
        fake.advanceTime(target - fake.now());
    }

    // Returns whether this game announced Night Owl.
    async function play(gameMs = PLAY_MS) {
        const before = toastDrawings(fake).length;
        fake.gameStarted(TABLE);
        await settle();
        fake.advanceTime(gameMs);
        fake.gameOver(TABLE);
        await settle();
        // Toasts show one after the other: let every toast of this game show.
        for (let guard = 0; guard < 100; guard++) {
            const shownCount = toastDrawings(fake).length;
            fake.advanceTime(TOAST_MS);
            if (toastDrawings(fake).length === shownCount) break;
        }
        return toastDrawings(fake).slice(before).some(drawing => drawing.texts.includes(TEXT.nightOwlTitle()));
    }

    function listRows() {
        fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
        fake.selectMenuItem(LIST_TEXT.menuEntry);
        const rows = readRows(fake, LIST_TEXT);
        press(fake, "Exit");
        return rows;
    }

    const description = TEXT.nightOwlDescription("00:00", "03:59");
    assert.match(description, /00:00/);
    assert.match(description, /03:59/);

    // Missing: "???" and its hint, never its real texts.
    const missingRows = listRows();
    assert.ok(missingRows.some(row => row.title === LIST_TEXT.secretTitle && row.description === TEXT.nightOwlHint()));
    assert.ok(!missingRows.some(row => row.title === TEXT.nightOwlTitle() || row.description === description));

    assert.equal(await play(), false, "a Play started at 23:59 and running past midnight");
    waitUntil(1, 0);
    assert.equal(await play(SHORT_GAME_MS), false, "a game under a minute at 01:00");

    // A Child Profile: no row, no toast, even at 01:10.
    store.switchTo("Bob");
    await settle();
    waitUntil(1, 10);
    assert.equal(await play(), false, "never for a Child Profile");
    assert.ok(!listRows().some(row => row.description === TEXT.nightOwlHint() || row.title === TEXT.nightOwlTitle()));

    store.switchTo("guest");
    await settle();
    waitUntil(3, 59);
    assert.equal(await play(), true, "Guest, at 03:59");
    const unlockedRow = listRows().find(row => row.title === TEXT.nightOwlTitle());
    assert.ok(unlockedRow, "its row shows its real title");
    assert.equal(unlockedRow.description, description);
    assert.equal(unlockedRow.unlocked, true);

    // Counts for the Profile active at the start, whoever is active at the end.
    store.switchTo("Alice");
    await settle();
    waitUntil(4, 0);
    assert.equal(await play(), false, "a Play started at 04:00");
    waitUntil(0, 0);
    fake.gameStarted(TABLE);
    await settle();
    store.switchTo("guest");
    fake.advanceTime(PLAY_MS);
    fake.gameOver(TABLE);
    await settle();
    store.switchTo("Alice");
    await settle();
    assert.ok(listRows().some(row => row.title === TEXT.nightOwlTitle() && row.unlocked), "Alice, at 00:00");

    // Reset, Alice finds the secret again.
    store.resetProfile("Alice");
    await settle();
    assert.ok(listRows().some(row => row.title === LIST_TEXT.secretTitle && row.description === TEXT.nightOwlHint()));
    waitUntil(2, 0);
    assert.equal(await play(), true, "the reset Profile unlocks it again");

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
