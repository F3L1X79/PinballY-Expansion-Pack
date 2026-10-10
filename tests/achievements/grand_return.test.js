// ============================================================
// The grand return, started through main.js on the fake PinballY globals:
// replaying a table after a 30-day break announces nothing, a game under a
// minute after a 31-day break announces nothing either, and a Play after
// that break announces the grand return, whose description gives the 31
// days.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import { toastDrawings } from "./achievement_toast_reader.js";
import config from "../../common/config.js";

const NOW = new Date(2026, 8, 23, 10, 0, 0);
const SESSION_MS = 5 * 60 * 1000;
// Under a minute, and too short for a rage quit.
const SHORT_GAME_MS = 20 * 1000;

// Without manufacturer or year, so with the collection milestones already
// Notified, the grand return is the only Achievement these plays can unlock.
function table(id, title) {
    return {
        id, configId: title, title, manufacturer: "", year: 0, categories: [],
        playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false,
    };
}

const THIRTY_DAYS_AGO = table(1, "Thirty Days Ago");
const THIRTY_ONE_DAYS_AGO = table(2, "Thirty-One Days Ago");
// Kept as the Table of the Day and of the Week, so the plays above never
// count as a Period Table play.
const PERIOD_TABLE = table(3, "Period Table");

const GUEST_PROFILE_FILE = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles\\guest\\profile.json";
const COLLECTION_MILESTONE_IDS = ["firstTable", "10percent", "25percent", "50percent", "75percent", "100percent"]
    .map(milestone => `collectionMilestone:${milestone}`);

test("the grand return needs a 31-day break and says so", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: [THIRTY_DAYS_AGO, THIRTY_ONE_DAYS_AGO, PERIOD_TABLE] });
    fake.addFile("C:\\PinballY\\Scripts\\ExpansionPack\\profiles\\cabinet.json", JSON.stringify({
        version: 1, activeProfile: "guest",
        tableOfTheDay: { configId: PERIOD_TABLE.configId, period: "2026-09-23" },
        tableOfTheWeek: { configId: PERIOD_TABLE.configId, period: "2026-09-21" },
    }));
    // Guest's own previous plays, in the Profile store's local time format.
    const plays = {
        [THIRTY_DAYS_AGO.configId]: { count: 1, seconds: 600, lastPlayed: "2026-08-24T10:00:00" },
        [THIRTY_ONE_DAYS_AGO.configId]: { count: 1, seconds: 600, lastPlayed: "2026-08-23T10:00:00" },
    };
    fake.addFile(GUEST_PROFILE_FILE, JSON.stringify({ version: 1, plays, notified: COLLECTION_MILESTONE_IDS }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = ["sessionStatsTracker", "achievements"].includes(key);
    }
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    const TEXT = lang.achievements;
    await import("../../main.js");
    await settle();

    async function play(game, sessionMs = SESSION_MS) {
        fake.gameStarted(game);
        await settle();
        fake.advanceTime(sessionMs);
        fake.gameOver(game);
        await settle();
        // The texts of every Achievement Toast so far.
        return toastDrawings(fake).map(drawing => drawing.texts);
    }

    assert.deepEqual(await play(THIRTY_DAYS_AGO), [], "no Achievement after a 30-day break");
    assert.deepEqual(await play(THIRTY_ONE_DAYS_AGO, SHORT_GAME_MS), [], "a game under a minute is no grand return");

    const [toast, ...others] = await play(THIRTY_ONE_DAYS_AGO);
    assert.deepEqual(others, []);
    assert.ok(toast.includes(TEXT.grandReturnTitle()), toast.join(" | "));
    assert.ok(toast.includes(TEXT.grandReturnDescription(31)), toast.join(" | "));
    assert.match(TEXT.grandReturnDescription(31), /31/);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
