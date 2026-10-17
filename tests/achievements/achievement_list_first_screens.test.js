// ============================================================
// The Achievement List opened right after startup, through main.js on the
// fake PinballY globals with slow draws: once it shows, the first screen
// and the one below are drawn, so the first Next presses draw nothing on
// the spot; the rest of the list is drawn ahead in the background
// afterwards, so walking the whole list then draws nothing either.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startPack, startOpeningFromMainMenu } from "./achievement_list_opening_scenario.js";
import { untilListShown, press, readWholeList } from "./achievement_list_reader.js";

// Past a glide, within the drawing ahead's wait after a press.
const BETWEEN_PRESSES_MS = 300;
const FIRST_PRESSES = 6;
const IDLE_MS = 60 * 1000;

test("the first screens are drawn before the list shows, the rest ahead in the background afterwards", async () => {
    const { fake, lang } = await startPack({ drawMs: 20 });
    startOpeningFromMainMenu(fake, lang);
    untilListShown(fake);

    const drawnOnOpening = fake.drawings().length;
    for (let count = 0; count < FIRST_PRESSES; count++) {
        press(fake, "Next");
        fake.advanceTime(BETWEEN_PRESSES_MS);
    }
    assert.equal(fake.drawings().length, drawnOnOpening, "the first Next presses draw nothing on the spot");

    fake.advanceTime(IDLE_MS);
    const drawnAhead = fake.drawings().length;
    assert.ok(drawnAhead > drawnOnOpening, "the rest of the list is drawn ahead in the background");
    readWholeList(fake);
    assert.equal(fake.drawings().length, drawnAhead, "walking the whole list draws nothing on the spot");
    assertNoErrorLogged(fake);
});
