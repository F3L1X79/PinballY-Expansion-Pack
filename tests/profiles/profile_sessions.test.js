// ============================================================
// Session stats per Profile, through main.js on the fake PinballY globals:
// the marathon, rage quit, grand return and Day's Manufacturers of one
// Profile never unlock anything for another, the grand return counts only
// the active Profile's own previous play of the table, and the shortest
// session ignores a game under a minute.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import { toastDrawings } from "../achievements/achievement_toast_reader.js";
import config from "../../common/config.js";

const NOW = new Date(2026, 8, 23, 10, 0, 0);
// Longer than a toast's whole life (rise, hold, fade).
const ONE_TOAST_MS = 6000;
const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const FORTY_DAYS_AGO = "2026-08-14T10:00:00";

// PinballY's own play stats say every table was played yesterday: they
// must not cancel anyone's grand return.
function table(id, title, manufacturer) {
    return {
        id, configId: title, title, manufacturer, year: 0, categories: [],
        playCount: 1, playTime: 60, lastPlayed: new Date(2026, 8, 22, 20, 0, 0), rating: -1, isHidden: false,
    };
}

const MEDIEVAL = table(1, "Medieval Madness", "Williams");
const MARS = table(2, "Attack from Mars", "Bally");
const TWILIGHT = table(3, "Twilight Zone", "Midway");
// Kept as the Table of the Day and of the Week, so the plays above never
// count as a Period Table play.
const PERIOD_TABLE = table(4, "Period Table", "");

const SESSION_ID_PATTERN = /^(marathon|rageQuit|grandReturn|dayManufacturers)/;

const profileFile = name => `${PROFILES_FOLDER}\\${name}\\profile.json`;
const readProfile = (fake, name) => JSON.parse(fake.readFile(profileFile(name)) || "{}");
const sessionIdsOf = (fake, name) => (readProfile(fake, name).notified || []).filter(id => SESSION_ID_PATTERN.test(id)).sort();

test("session stats and their Achievements belong to the active Profile", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: [MEDIEVAL, MARS, TWILIGHT, PERIOD_TABLE] });
    fake.addFile("C:\\PinballY\\Scripts\\ExpansionPack\\profiles\\cabinet.json", JSON.stringify({
        version: 1, activeProfile: "guest",
        tableOfTheDay: { configId: PERIOD_TABLE.configId, period: "2026-09-23" },
        tableOfTheWeek: { configId: PERIOD_TABLE.configId, period: "2026-09-21" },
    }));
    // Alice last played Medieval Madness forty days ago, Bob Twilight Zone.
    fake.addFile(profileFile("Alice"), JSON.stringify({
        version: 1, plays: { [MEDIEVAL.configId]: { count: 1, seconds: 600, lastPlayed: FORTY_DAYS_AGO } },
    }));
    fake.addFile(profileFile("Bob"), JSON.stringify({
        version: 1, plays: { [TWILIGHT.configId]: { count: 1, seconds: 600, lastPlayed: FORTY_DAYS_AGO } },
    }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = ["sessionStatsTracker", "achievements"].includes(key);
    }
    config.language = "en";

    const { getProfileStore } = await import("../../common/profile_store.js");
    await import("../../main.js");
    await settle();

    async function play(game, seconds) {
        fake.gameStarted(game);
        await settle();
        fake.advanceTime(seconds * 1000);
        fake.gameOver(game);
        await settle();
        // Toasts show one after the other: let every toast of this play show.
        for (let guard = 0; guard < 100; guard++) {
            const shownCount = toastDrawings(fake).length;
            fake.advanceTime(ONE_TOAST_MS);
            await settle();
            if (toastDrawings(fake).length === shownCount) break;
        }
    }

    const store = getProfileStore();
    store.switchTo("Alice");
    await settle();
    // Never played by Alice: no grand return, though Bob played it forty days ago.
    await play(TWILIGHT, 5 * 60);
    await play(MEDIEVAL, 2 * 60);
    await play(MARS, 31 * 60);
    // A rage quit, under a minute: not Alice's shortest session.
    await play(MARS, 45);

    store.switchTo("Bob");
    await settle();
    // Alice played it today, but Bob's own previous play is forty days old.
    await play(TWILIGHT, 5 * 60);

    assert.deepEqual(sessionIdsOf(fake, "Alice"), ["dayManufacturers:3", "grandReturn", "marathon:30", "rageQuit"]);
    assert.deepEqual(sessionIdsOf(fake, "Bob"), ["grandReturn"], "Alice's sessions unlock nothing for Bob");
    assert.deepEqual(sessionIdsOf(fake, "guest"), []);

    const aliceSessions = readProfile(fake, "Alice").sessions;
    assert.deepEqual(aliceSessions.dayManufacturers, { day: "2026-09-23", list: ["Midway", "Williams", "Bally"] });
    assert.equal(aliceSessions.mostManufacturersInADay, 3);
    assert.equal(aliceSessions.shortestSeconds, 2 * 60);
    assert.equal(aliceSessions.longestSeconds, 31 * 60);
    const bobSessions = readProfile(fake, "Bob").sessions;
    assert.deepEqual(bobSessions.dayManufacturers, { day: "2026-09-23", list: ["Midway"] });
    assert.equal(bobSessions.mostManufacturersInADay, 1);
    assert.equal(bobSessions.rageQuit, false);
    assert.equal(bobSessions.longestSeconds, 5 * 60);

    assert.deepEqual([...fake.writtenSettingsKeys()].filter(key => key.startsWith("custom.sessionStats.")), []);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
