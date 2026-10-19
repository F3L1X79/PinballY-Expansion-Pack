// ============================================================
// Household Stats' Selection Marker with seven Profiles: on the first column
// at opening, held in view while the columns glide, on the Exit Button with
// its tooltip, and gone with its timer at close.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import {
    openHouseholdStats, highlightedColumn, markerLayer, markerLayerCount, isMarkerOnExitButton, householdStatsLayerCount, isHouseholdStatsOpen, press, GLIDE_OVER_MS,
} from "./household_stats_reader.js";

const NAMES = ["Ann", "Ben", "Cat", "Dan", "Eve", "Fay", "Gus"];
const FRAME_MS = 16;

test("the Selection Marker surrounds the column, follows the glide, surrounds the Exit Button and is gone once the screen closes", async () => {
    const { fake, lang } = await startHousehold({ profiles: Object.fromEntries(NAMES.map(name => [name, {}])) });
    const intervalsBefore = fake.runningIntervalCount();

    openHouseholdStats(fake, lang);
    assert.equal(markerLayerCount(fake), 1, "a single marker");
    assert.equal(highlightedColumn(fake), "Ann", "round the first column on opening");

    for (let move = 0; move < 4; move++) press(fake, "Next");
    assert.equal(highlightedColumn(fake), "Eve");
    const lastSlot = markerLayer(fake).position();
    press(fake, "Next");
    for (let elapsed = 0; elapsed < GLIDE_OVER_MS; elapsed += FRAME_MS) {
        fake.advanceTime(FRAME_MS);
        assert.deepEqual(markerLayer(fake).position(), lastSlot, `${elapsed + FRAME_MS} ms into the glide: held in the view where Fay ends`);
    }
    assert.equal(highlightedColumn(fake), "Fay", "on the column once the glide is over");

    press(fake, "Next");
    fake.advanceTime(GLIDE_OVER_MS);
    press(fake, "Next");
    assert.equal(markerLayerCount(fake), 1, "still a single marker on the Exit Button");
    assert.ok(isMarkerOnExitButton(fake), "round the Exit Button");
    assert.equal(highlightedColumn(fake), lang.buttonHints.back, "with its tooltip");

    press(fake, "Exit");
    fake.advanceTime(GLIDE_OVER_MS);
    assert.equal(isHouseholdStatsOpen(fake), false);
    assert.equal(householdStatsLayerCount(fake), 0, "the marker's layer is removed with the others");
    press(fake, "Exit");
    assert.equal(fake.runningIntervalCount(), intervalsBefore, "no timer of the marker keeps running");
    assertNoErrorLogged(fake);
});
