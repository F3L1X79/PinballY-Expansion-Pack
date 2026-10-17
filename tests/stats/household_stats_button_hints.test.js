// ============================================================
// The Household Stats' Exit Button and Button Hints, through main.js on
// the fake PinballY globals: the Exit Button's tooltip says Back (it goes
// back to one's own Profile Stats), and the footer names the flippers
// (Browse), Select (Choose) and Exit (Back).
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { openHouseholdStats, highlightedColumn, buttonHints, press } from "./household_stats_reader.js";
import { expectedButtonHints } from "../support/button_hints_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

test("the Household Stats show the back arrow's Back and the Button Hints", async () => {
    const { fake, lang } = await startHousehold({ profiles: { Alice: {}, Bob: {} }, active: "Alice" });
    openHouseholdStats(fake, lang);

    assert.deepEqual(buttonHints(fake), expectedButtonHints(lang, { exit: "back" }));
    press(fake, "Prev");
    assert.equal(highlightedColumn(fake), lang.buttonHints.back);
    assertNoErrorLogged(fake);
});
