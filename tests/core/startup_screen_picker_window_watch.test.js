// ============================================================
// Startup Screen "profilePicker" in a window PinballY lays out after the
// scripts' init: the carousel opens on its turn, without a pause, and is
// redrawn in place for the window's new size, the same Profile highlighted,
// shown at once; nothing is redrawn while the size stays the same.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen, highlightedName, GLIDE_OVER_MS } from "./startup_picker_scenario.js";

const SMALL = { width: 845, height: 461 };
const LARGE = { width: 2560, height: 1600 };
// Past the window watch's period (about 100 ms).
const WATCH_OVER_MS = 120;
// The carousel's background, which spans the window.
const BACKGROUND_Z_INDEX = 6500;

const background = (fake, lang) => fake.drawingLayers()
    .find(layer => layer.zIndex === BACKGROUND_Z_INDEX && layer.alpha > 0 && layer.texts().includes(lang.profiles.pickerTitle));
const redrawLines = fake => fake.logLines().filter(line => line.includes("redrawn for the window's new size"));

test("the startup carousel opens without a pause and follows the window's new size, its Profile kept", async () => {
    const { fake, lang, settle } = await startOnProfilePicker({ layoutSize: SMALL });
    const names = [lang.profiles.guestName, "Alice", "Bob"];
    await settle();
    assert.equal(isCarouselOpen(fake, lang), true, "open on its turn, without a pause");
    assert.deepEqual(background(fake, lang).canvasSize(), SMALL);
    fake.fire("commandbuttondown", { command: "Prev", repeat: false });
    fake.advanceTime(GLIDE_OVER_MS);
    assert.equal(highlightedName(fake, names), "Alice");

    fake.setLayoutSize(LARGE);
    fake.advanceTime(WATCH_OVER_MS);
    assert.deepEqual(background(fake, lang).canvasSize(), LARGE, "drawn again for the new size");
    assert.equal(highlightedName(fake, names), "Alice", "the same Profile highlighted");
    assert.equal(background(fake, lang).alpha, 1, "shown at once, no fade");
    assert.equal(redrawLines(fake).length, 1, redrawLines(fake).join("\n"));
    assert.match(redrawLines(fake)[0], /845x461 to 2560x1600/);

    const drawingsBefore = fake.drawings().length;
    fake.advanceTime(2000);
    assert.equal(fake.drawings().length, drawingsBefore, "nothing redrawn while the size stays the same");
    assertNoErrorLogged(fake);
});
