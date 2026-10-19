// ============================================================
// The Young Players family on the Household Stats, through main.js on the
// fake PinballY globals: a Child Profile's Achievements unlocked count Snack
// Time out of a total with Snack Time and Wednesday Off, and without Night
// Owl and Full Moon Night; an adult who once had Snack Time as a child
// counts neither.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold, PROFILES } from "./household_stats_scenario.js";
import { openHouseholdStats, lineValues } from "./household_stats_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

// Snack Time Notified, as after a Play at 16:30 made as a child.
const withSnackTime = isChild => JSON.stringify({
    version: 1, plays: {}, notified: ["snackTime"], isChild, surprises: { snackTime: true },
});

test("a child's Achievements unlocked include Snack Time out of the Young Players total, an adult's never do",async () => {
    const { fake, lang } = await startHousehold({
        profiles: { Dad: {}, Kid: { isChild: true } },
        files: { [`${PROFILES}\\Dad\\profile.json`]: withSnackTime(false), [`${PROFILES}\\Kid\\profile.json`]: withSnackTime(true) },
    });
    openHouseholdStats(fake, lang);

    const [dad, kid] = lineValues(fake, "Achievements unlocked").map(value => value.split("/").map(Number));
    assert.equal(kid[0], 1, "the child counts Snack Time");
    assert.equal(dad[0], 0, "the adult does not");
    assert.equal(dad[1], kid[1], "the adult has Night Owl and Full Moon Night, the child Snack Time and Wednesday Off");

    assertNoErrorLogged(fake);
});
