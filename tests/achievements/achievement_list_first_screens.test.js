// ============================================================
// The Achievement List opened right after startup with slow draws: its first
// two screens are drawn on opening, the rest ahead in the background, so
// walking the list then draws nothing on the spot.
// - The Selection Marker on the Exit Button still redraws on its own tick.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startPack, startOpeningFromMainMenu } from "./achievement_list_opening_scenario.js";
import { untilListShown, press, readWholeList } from "./achievement_list_reader.js";
import { ACHIEVEMENT_LIST_Z_INDEX } from "../../common/achievements/achievement_list.js";

// Past a glide, within the drawing ahead's wait after a press.
const BETWEEN_PRESSES_MS = 300;
const FIRST_PRESSES = 6;
const IDLE_MS = 60 * 1000;
const drawingCount = fake => fake.drawings().filter(drawing => drawing.zIndex !== ACHIEVEMENT_LIST_Z_INDEX.marker).length;

test("the first screens are drawn before the list shows, the rest ahead in the background afterwards", async () => {
    const { fake, lang } = await startPack({ drawMs: 20 });
    startOpeningFromMainMenu(fake, lang);
    untilListShown(fake);

    const drawnOnOpening = drawingCount(fake);
    for (let count = 0; count < FIRST_PRESSES; count++) {
        press(fake, "Next");
        fake.advanceTime(BETWEEN_PRESSES_MS);
    }
    assert.equal(drawingCount(fake), drawnOnOpening, "the first Next presses draw nothing on the spot");

    fake.advanceTime(IDLE_MS);
    const drawnAhead = drawingCount(fake);
    assert.ok(drawnAhead > drawnOnOpening, "the rest of the list is drawn ahead in the background");
    readWholeList(fake);
    assert.equal(drawingCount(fake), drawnAhead, "walking the whole list draws nothing on the spot");
    assertNoErrorLogged(fake);
});
