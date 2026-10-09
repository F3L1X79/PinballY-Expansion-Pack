// ============================================================
// The Avatar Frame list drawn ahead, through main.js on the fake PinballY
// globals: once the drawing ahead has run, opening the list draws none of
// its rows on the spot, and after a choice only the rows that changed are
// drawn again, ahead, before the next opening.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines, DRAWN_AHEAD_MS } from "./mastery_bar_scenario.js";
import { openProfileStats, choose, pickRow, press, PROFILE_STATS_OPEN_MS } from "./profile_stats_reader.js";
import { AVATAR_FRAME_LIST_Z_INDEX } from "../common/avatar_frame_list_painter.js";

const rowDrawings = fake => fake.drawings().filter(drawing => drawing.zIndex === AVATAR_FRAME_LIST_Z_INDEX.rows);

test("the list's rows are drawn ahead, and redrawn ahead after a choice", async () => {
    const fake = await startScenario({
        addOns: ["tableMastery", "achievements", "customMenuCommands"], frameImages: true, profiles: { guest: { collectionTier: 2 } },
    });
    fake.advanceTime(DRAWN_AHEAD_MS);
    const { default: lang } = await import("../common/i18n.js");
    assert.equal(rowDrawings(fake).length, 11, "every row drawn once at startup");

    openProfileStats(fake, lang);
    choose(fake, "Frame");
    assert.equal(rowDrawings(fake).length, 11, "nothing drawn on opening");
    pickRow(fake, "Steam and Gears");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    press(fake, "Exit");
    fake.advanceTime(DRAWN_AHEAD_MS);
    assert.deepEqual(rowDrawings(fake).slice(11).map(drawing => drawing.texts[0]), ["Steam and Gears", "None"],
        "only the newly worn row and the one left are drawn again");

    openProfileStats(fake, lang);
    choose(fake, "Frame");
    assert.equal(rowDrawings(fake).length, 13);
    assert.deepEqual(errorLines(fake), []);
});
