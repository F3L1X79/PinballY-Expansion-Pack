// ============================================================
// Quiet wheel at a Profile picker startup: Exit keeps the last active
// Profile and hands over to the Welcome Screen with the table lowered once,
// no rise in between, and the Welcome Screen's close brings it back once.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { press, isWelcomeScreenOpen, WELCOME_SCREEN_OPEN_MS } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen, CAROUSEL_OPEN_MS } from "./startup_picker_scenario.js";

const TABLES = [{ id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", audioVolume: 70 }];
const HANDOVER_OVER_MS = 200;

test("Exit in the startup Profile picker keeps the table lowered through the Welcome Screen", async () => {
    const { fake, lang, settle } = await startOnProfilePicker({ tables: TABLES });
    const lowered = [{ configId: TABLES[0].configId, changes: { audioVolume: 50 } }];
    await settle();
    fake.advanceTime(CAROUSEL_OPEN_MS);
    assert.equal(isCarouselOpen(fake, lang), true);

    press(fake, "Exit");
    await settle();
    fake.advanceTime(HANDOVER_OVER_MS);
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(isWelcomeScreenOpen(fake), true);
    assert.deepEqual(fake.gameUpdates(), lowered, "one drop, no rise between the two screens");

    press(fake, "Exit");
    fake.advanceTime(HANDOVER_OVER_MS);
    assert.deepEqual(fake.gameUpdates(), [...lowered, { configId: TABLES[0].configId, changes: { audioVolume: 70 } }], "one return");
    assertNoErrorLogged(fake);
});
