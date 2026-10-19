// ============================================================
// Household Stats set aside under another Profile's Stats, with slow draws:
// hidden and shrunk, a running glide stopped, buttons never moving them; Exit
// shows them again at once, with no veil, Loader or opening time.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readVeil } from "../support/opening_reader.js";
import { readLoader } from "../support/loader_reader.js";
import { HOUSEHOLD_STATS_Z_INDEX } from "../../common/stats/household_stats_painter.js";
import { cardTexts, isProfileStatsOpen, highlighted, PROFILE_STATS_OPEN_MS } from "./profile_stats_reader.js";
import {
    openHouseholdStats, isHouseholdStatsOpen, highlightedColumn, columnsInView, fadedColumns, press, GLIDE_OVER_MS,
} from "./household_stats_reader.js";

const NAMES = ["Ann", "Ben", "Cat", "Dan", "Eve", "Fay", "Gus"];
const POINT = { xSpan: 0.001, ySpan: 0.001 };
const DRAW_MS = 60;

const householdStatsLayers = fake => fake.drawingLayers().filter(layer => Object.values(HOUSEHOLD_STATS_Z_INDEX).includes(layer.zIndex));

function assertSetAside(fake) {
    assert.equal(isHouseholdStatsOpen(fake), false);
    const layers = householdStatsLayers(fake);
    assert.ok(layers.length > 0, "kept ready");
    for (const layer of layers) {
        assert.equal(layer.alpha, 0, "hidden");
        assert.deepEqual(layer.scale(), POINT, "reduced to a point");
    }
}

function assertShownAtOnce(fake, mark) {
    assert.deepEqual(readVeil(fake), { shown: false }, "no veil");
    assert.deepEqual(readLoader(fake), { shown: false }, "no Loader");
    fake.advanceTime(1000);
    assert.deepEqual(readLoader(fake), { shown: false });
    assert.deepEqual(fake.logLines().slice(mark).filter(line => line.includes("] Opened")), [], "no opening time line");
}

test("set aside under another Profile's Profile Stats, the Household Stats come back at once as they were left", async () => {
    const { fake, lang } = await startHousehold({ profiles: Object.fromEntries(NAMES.map(name => [name, {}])), active: "Ann" });
    openHouseholdStats(fake, lang);
    while (highlightedColumn(fake) !== "Fay") {
        press(fake, "Next");
        fake.advanceTime(GLIDE_OVER_MS);
    }
    // Gus glides into view: Select while the glide still runs.
    press(fake, "Next");
    press(fake, "Select");
    assertSetAside(fake);
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.equal(cardTexts(fake)[0], "Gus");
    assertSetAside(fake);

    for (const button of ["Next", "Next", "Prev", "Next"]) press(fake, button);
    fake.advanceTime(GLIDE_OVER_MS);
    assertSetAside(fake);

    fake.setDrawMs(DRAW_MS);
    let mark = fake.logLines().length;
    press(fake, "Exit");
    assert.equal(isProfileStatsOpen(fake), false);
    assert.equal(isHouseholdStatsOpen(fake), true, "shown in the same step");
    assert.equal(highlightedColumn(fake), "Gus", "on that Profile's column");
    assert.deepEqual(columnsInView(fake), NAMES.slice(2), "the glide's target");
    assert.deepEqual(fadedColumns(fake), [], "the columns still");
    assertShownAtOnce(fake, mark);
    assert.equal(highlightedColumn(fake), "Gus");

    mark = fake.logLines().length;
    press(fake, "Exit");
    assert.equal(householdStatsLayers(fake).length, 0, "nothing kept once left");
    assert.equal(isProfileStatsOpen(fake), true, "shown in the same step");
    assert.equal(highlighted(fake), lang.profileStats.buttons.household);
    assertShownAtOnce(fake, mark);
    assertNoErrorLogged(fake);
});
