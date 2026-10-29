// ============================================================
// Startup Screen "profilePicker" in a window PinballY lays out after the
// scripts' init, as on the cabinet: the carousel waits under the veil, the
// Loader turning, while the view keeps its init size, then opens drawn for
// the final size, never shown at the small one. A later change of size while
// it is open redraws it in place, the same Profile highlighted, shown at once.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readLoader } from "../support/loader_reader.js";
import { startupVeil } from "../welcome_screen/welcome_screen_reader.js";
import { startOnProfilePicker, isCarouselOpen, highlightedName, GLIDE_OVER_MS } from "./startup_picker_scenario.js";

const SMALL = { width: 845, height: 461 };
const LARGE = { width: 2560, height: 1600 };
const OTHER = { width: 1920, height: 1080 };
// Past the window watch's period (about 100 ms).
const WATCH_OVER_MS = 120;
// Longer than the window takes to be laid out on the cabinet, within the fallback.
const LAYOUT_PENDING_MS = 500;
// The carousel's background, which spans the window.
const BACKGROUND_Z_INDEX = 6500;

const background = (fake, lang) => fake.drawingLayers()
    .find(layer => layer.zIndex === BACKGROUND_Z_INDEX && layer.alpha > 0 && layer.texts().includes(lang.profiles.pickerTitle));
const redrawLines = fake => fake.logLines().filter(line => line.includes("redrawn for the window's new size"));

test("the startup carousel waits for the window's final size, then follows a later change, its Profile kept", async () => {
    const { fake, lang, settle } = await startOnProfilePicker({ layoutSize: SMALL, viewSizeAtInit: SMALL });
    const names = [lang.profiles.guestName, "Alice", "Bob"];
    await settle();
    fake.advanceTime(LAYOUT_PENDING_MS);
    assert.equal(isCarouselOpen(fake, lang), false, "not shown in the window not laid out yet");
    assert.equal(readLoader(fake).shown, true, "the Loader turning meanwhile");
    assert.equal(startupVeil(fake).shown, true);

    fake.setLayoutSize(LARGE);
    fake.advanceTime(WATCH_OVER_MS);
    await settle();
    assert.equal(isCarouselOpen(fake, lang), true, "open once the window is laid out");
    assert.deepEqual(background(fake, lang).canvasSize(), LARGE, "drawn for the final size");
    assert.deepEqual(redrawLines(fake), [], "never drawn for the small one");
    fake.fire("commandbuttondown", { command: "Prev", repeat: false });
    fake.advanceTime(GLIDE_OVER_MS);
    assert.equal(highlightedName(fake, names), "Alice");

    fake.setLayoutSize(OTHER);
    fake.advanceTime(WATCH_OVER_MS);
    assert.deepEqual(background(fake, lang).canvasSize(), OTHER, "drawn again for the new size");
    assert.equal(highlightedName(fake, names), "Alice", "the same Profile highlighted");
    assert.equal(background(fake, lang).alpha, 1, "shown at once, no fade");
    assert.equal(redrawLines(fake).length, 1, redrawLines(fake).join("\n"));
    assert.match(redrawLines(fake)[0], /2560x1600 to 1920x1080/);

    const drawingsBefore = fake.drawings().length;
    fake.advanceTime(2000);
    assert.equal(fake.drawings().length, drawingsBefore, "nothing redrawn while the size stays the same");
    assertNoErrorLogged(fake);
});
