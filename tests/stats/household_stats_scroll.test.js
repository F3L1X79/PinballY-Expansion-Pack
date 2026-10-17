// ============================================================
// A big Household, through main.js on the fake PinballY globals: past
// five Profiles the Household Stats' columns glide sideways with the
// Selection Marker, which always stays in view, looping both ways through
// the cross, from which the columns jump; the cut edges fade while gliding.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold, errorLines } from "./household_stats_scenario.js";
import { openHouseholdStats, columnsInView, fadedColumns, highlightedColumn, press, GLIDE_OVER_MS } from "./household_stats_reader.js";

const NAMES = ["Ann", "Ben", "Cat", "Dan", "Eve", "Fay", "Gus"];
const FRAME_MS = 16;
const household = () => Object.fromEntries(NAMES.map(name => [name, {}]));

function assertMarkerInView(fake, context) {
    const inView = columnsInView(fake);
    assert.ok(inView.includes(highlightedColumn(fake)), `${context}: ${highlightedColumn(fake)} is in view among ${inView.join(", ")}`);
}

test("past five Profiles, the columns glide sideways with the marker", async () => {
    const { fake, lang } = await startHousehold({ profiles: household() });
    openHouseholdStats(fake, lang);

    assert.deepEqual(columnsInView(fake), NAMES.slice(0, 5), "five columns at most, from the first");
    assert.equal(highlightedColumn(fake), "Ann");

    for (let move = 0; move < 4; move++) press(fake, "Next");
    fake.advanceTime(GLIDE_OVER_MS);
    assert.deepEqual(columnsInView(fake), NAMES.slice(0, 5), "no glide while the marker stays in view");

    press(fake, "Next");
    fake.advanceTime(FRAME_MS);
    assert.equal(highlightedColumn(fake), null, "mid-glide, the marker waits in the view for its column");
    assert.ok(fadedColumns(fake).includes("Ann"), "the column leaving fades at the cut edge");
    fake.advanceTime(GLIDE_OVER_MS);
    assert.deepEqual(columnsInView(fake), NAMES.slice(1, 6));
    assert.deepEqual(fadedColumns(fake), []);
    assert.equal(highlightedColumn(fake), "Fay");

    press(fake, "Next");
    fake.advanceTime(GLIDE_OVER_MS);
    assert.deepEqual(columnsInView(fake), NAMES.slice(2, 7));
    assert.equal(highlightedColumn(fake), "Gus");

    press(fake, "Next");
    fake.advanceTime(GLIDE_OVER_MS);
    assert.equal(highlightedColumn(fake), "Back", "the cross after the last column");
    assert.deepEqual(columnsInView(fake), NAMES.slice(2, 7), "the columns stay where they were");

    press(fake, "Next");
    fake.advanceTime(FRAME_MS);
    assert.deepEqual(columnsInView(fake), NAMES.slice(0, 5), "from the cross, the first column comes into view at once");
    assert.equal(highlightedColumn(fake), "Ann");

    press(fake, "Prev");
    press(fake, "Prev");
    fake.advanceTime(FRAME_MS);
    assert.deepEqual(columnsInView(fake), NAMES.slice(2, 7), "and back to the last");
    assert.equal(highlightedColumn(fake), "Gus");

    for (let move = 0; move < 6; move++) {
        press(fake, "Prev");
        fake.advanceTime(GLIDE_OVER_MS);
        assertMarkerInView(fake, `Prev ${move + 1}`);
        assert.equal(columnsInView(fake).length, 5);
    }
    assert.equal(highlightedColumn(fake), "Ann");
    assert.deepEqual(errorLines(fake), []);
});
