// ============================================================
// Where the Mastery Bar sits, through main.js on the fake PinballY
// globals with the Profile picker and the Challenges on: under the Profile
// badge, in the Challenge Card's place in a week with no Challenge, then
// under the card's whole canvas once a new week brings one.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, shownTop, errorLines } from "./mastery_bar_scenario.js";

const BADGE = 170;
const CARD = 124;
const NO_CHALLENGE = { week: "2026-09-21", template: "", param: null, target: 0 };
const NEXT_MONDAY = new Date(2026, 8, 28, 20, 0, 0);

test("the Mastery Bar takes the Challenge Card's place with no Challenge, and moves under it when one comes", async () => {
    const fake = await startScenario({ addOns: ["profilePicker", "challenges", "tableMastery"], challenge: NO_CHALLENGE });
    assert.equal(shownTop(fake), BADGE, "right under the badge");

    fake.setNow(NEXT_MONDAY);
    fake.fire("wheelmode");
    assert.equal(shownTop(fake), BADGE + CARD, "under the new week's Challenge Card");

    assert.deepEqual(errorLines(fake), []);
});
