// ============================================================
// Rage quit Achievement, started through main.js on the fake PinballY
// globals: only a session of 30 seconds to under a minute unlocks it, even
// after shorter or longer sessions, and it stays Unlocked in the
// Achievement List.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import { toastDrawings } from "./achievement_toast_reader.js";
import config from "../../common/config.js";
import { readRows } from "./achievement_list_reader.js";

const NOW = new Date(2026, 8, 23, 10, 0, 0);

// No manufacturer and never replayed, so a play can't unlock the Day's
// Manufacturers or the grand return.
function table(id, title) {
    return {
        id, configId: title, title, manufacturer: "", year: 0, categories: [],
        playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false,
    };
}

const TABLE = table(1, "Homebrew Table");
// Kept as the Table of the Day and of the Week, so the plays above never
// count as a Period Table play.
const PERIOD_TABLE = table(2, "Period Table");

// Longer than an Achievement Toast's whole life (rise, hold, fade).
const TOAST_MS = 6000;

test("only a session of 30 seconds to under a minute unlocks the rage quit for good", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: [TABLE, PERIOD_TABLE] });
    fake.addFile("C:\\PinballY\\Scripts\\ExpansionPack\\profiles\\cabinet.json", JSON.stringify({
        version: 1, activeProfile: "guest",
        tableOfTheDay: { configId: PERIOD_TABLE.configId, period: "2026-09-23" },
        tableOfTheWeek: { configId: PERIOD_TABLE.configId, period: "2026-09-21" },
    }));
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

    // Returns whether this play announced the rage quit.
    async function play(sessionSeconds) {
        const before = toastDrawings(fake).length;
        fake.gameStarted(TABLE);
        await settle();
        fake.advanceTime(sessionSeconds * 1000);
        fake.gameOver(TABLE);
        await settle();
        // Toasts show one after the other: let every toast of this play show.
        for (let guard = 0; guard < 100; guard++) {
            const shownCount = toastDrawings(fake).length;
            fake.advanceTime(TOAST_MS);
            if (toastDrawings(fake).length === shownCount) break;
        }
        return toastDrawings(fake).slice(before)
            .some(drawing => drawing.texts.includes(TEXT.rageQuitTitle()));
    }

    assert.equal(await play(3), false, "an instant quit is not a rage quit");
    assert.equal(await play(29), false);
    assert.equal(await play(60), false, "a whole minute is not a rage quit");
    assert.equal(await play(30), true);

    fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
    fake.selectMenuItem(lang.achievementList.menuEntry);
    const rageQuitRow = readRows(fake, lang.achievementList).find(row => row.title === TEXT.rageQuitTitle());
    assert.equal(rageQuitRow.unlocked, true);

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
