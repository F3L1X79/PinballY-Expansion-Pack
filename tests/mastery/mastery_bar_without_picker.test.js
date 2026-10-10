// ============================================================
// With the Profile picker off, through main.js on the fake PinballY
// globals, there is no badge: the Mastery Bar sits right under the
// Challenge Card in the top right corner.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, shownTop, errorLines } from "./mastery_bar_scenario.js";

const CARD = 124;

test("with the Profile picker off, the Mastery Bar sits under the Challenge Card in the corner", async () => {
    const fake = await startScenario({ addOns: ["challenges", "tableMastery"] });

    assert.equal(shownTop(fake), CARD);
    assert.deepEqual(errorLines(fake), []);
});
