// ============================================================
// Startup Screen "profilePicker" in a window already in place at the
// scripts' init: the view never changes size, so the carousel opens once
// the layout fallback is over, which the log tells.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { LAYOUT_FALLBACK_MS } from "../../common/core/window_layout.js";
import { startOnProfilePicker, isCarouselOpen } from "./startup_picker_scenario.js";

const SIZE = { width: 2560, height: 1600 };
// Past the window watch's period (about 100 ms).
const WATCH_OVER_MS = 120;

test("a window that keeps its size from the init still gets the startup carousel, after the fallback", async () => {
    const { fake, lang, settle } = await startOnProfilePicker({ layoutSize: SIZE, viewSizeAtInit: SIZE });
    await settle();
    fake.advanceTime(LAYOUT_FALLBACK_MS - WATCH_OVER_MS);
    await settle();
    assert.equal(isCarouselOpen(fake, lang), false, "waiting for the window to change");

    fake.advanceTime(2 * WATCH_OVER_MS);
    await settle();
    assert.equal(isCarouselOpen(fake, lang), true, "open after the fallback");
    assert.ok(fake.logLines().some(line => line.includes("[WindowLayout] Still 2560x1600")), "the fallback logged");
    assertNoErrorLogged(fake);
});
