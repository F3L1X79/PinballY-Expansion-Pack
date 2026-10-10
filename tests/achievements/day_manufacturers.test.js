// ============================================================
// Multi-manufacturer day Achievements, started through main.js on the fake
// PinballY globals: tables of three different manufacturers played the
// same day unlock the first one; a game under a minute, a table with no
// manufacturer and a repeated manufacturer don't count; a Play started
// before midnight counts for the day it started; a new calendar day starts
// over, and the Achievement stays Unlocked in the Achievement List, the
// next ones showing the day's record.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import { toastDrawings } from "./achievement_toast_reader.js";
import config from "../../common/config.js";
import { readRows } from "./achievement_list_reader.js";

const NOW = new Date(2026, 8, 23, 10, 0, 0);
const SESSION_MS = 5 * 60 * 1000;
const SHORT_GAME_MS = 59 * 1000;

// Never counted as played and never replayed, so the Day's Manufacturers
// are the only thing these plays can unlock.
function table(id, title, manufacturer, isHidden = false) {
    return {
        id, configId: title, title, manufacturer, year: 0, categories: [],
        playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden,
    };
}

const WILLIAMS = table(1, "Medieval Madness", "Williams");
const OTHER_WILLIAMS = table(2, "Twilight Zone", "Williams");
const HOMEBREW = table(3, "Homebrew Table", "");
const BALLY = table(4, "Attack from Mars", "Bally");
const HIDDEN_STERN = table(5, "Hidden Stern", "Stern", true);
const GOTTLIEB = table(6, "Gottlieb Table", "Gottlieb");
const DATA_EAST = table(7, "Data East Table", "Data East");
// Kept as the Table of the Day and of the Week, so the plays above never
// count as a Period Table play.
const PERIOD_TABLE = table(8, "Period Table", "");

// Longer than an Achievement Toast's whole life (rise, hold, fade).
const TOAST_MS = 6000;

test("three manufacturers in one calendar day unlock the first multi-manufacturer Achievement for good", async () => {
    const fake = createFakePinballYHost({
        now: NOW,
        tables: [WILLIAMS, OTHER_WILLIAMS, HOMEBREW, BALLY, HIDDEN_STERN, GOTTLIEB, DATA_EAST, PERIOD_TABLE],
    });
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

    const dayManufacturersTitles = Object.values(TEXT.dayManufacturersTitles);
    // The texts of every Achievement Toast so far.
    const announcements = () => toastDrawings(fake).map(drawing => drawing.texts);

    // Returns the titles of the multi-manufacturer Achievements announced
    // for this play; it may announce others too.
    async function play(game, sessionMs = SESSION_MS) {
        const before = announcements().length;
        fake.gameStarted(game);
        await settle();
        fake.advanceTime(sessionMs);
        fake.gameOver(game);
        await settle();
        // Toasts show one after the other: let every toast of this play show.
        for (let guard = 0; guard < 100; guard++) {
            const shownCount = announcements().length;
            fake.advanceTime(TOAST_MS);
            if (announcements().length === shownCount) break;
        }
        return announcements().slice(before)
            .flatMap(texts => texts.filter(text => dayManufacturersTitles.includes(text)));
    }

    assert.deepEqual(await play(WILLIAMS), []);
    assert.deepEqual(await play(OTHER_WILLIAMS), [], "the same manufacturer counts once");
    assert.deepEqual(await play(HOMEBREW), [], "a table with no manufacturer doesn't count");
    assert.deepEqual(await play(BALLY), []);
    assert.deepEqual(await play(GOTTLIEB, SHORT_GAME_MS), [], "a game under a minute doesn't count");
    assert.deepEqual(await play(HIDDEN_STERN), [TEXT.dayManufacturersTitles[3]], "a hidden table counts");

    // Started at 23:58, ended on the next day: counts for the day it started.
    fake.setNow(new Date(2026, 8, 23, 23, 58, 0));
    assert.deepEqual(await play(GOTTLIEB), []);

    // Four manufacturers yesterday: a fifth one would unlock the next
    // Achievement if the day's set were not started over.
    fake.setNow(new Date(2026, 8, 24, 10, 0, 0));
    assert.deepEqual(await play(DATA_EAST), [], "a new calendar day starts a new set");

    fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
    fake.selectMenuItem(lang.achievementList.menuEntry);
    const shownTitles = [3, 5, 8].map(count => TEXT.dayManufacturersTitles[count]);
    const dayManufacturersRows = readRows(fake, lang.achievementList)
        .filter(row => shownTitles.includes(row.title))
        .map(({ title, progress, unlocked }) => ({ title, progress, unlocked }));
    const withRecord = count => lang.achievementList.progressUnits.manufacturers.short(4, count);
    assert.deepEqual(dayManufacturersRows, [
        { title: TEXT.dayManufacturersTitles[3], progress: null, unlocked: true },
        { title: TEXT.dayManufacturersTitles[5], progress: withRecord(5), unlocked: false },
        { title: TEXT.dayManufacturersTitles[8], progress: withRecord(8), unlocked: false },
    ]);

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
