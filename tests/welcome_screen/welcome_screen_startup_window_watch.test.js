// ============================================================
// Startup Screen "welcome" in a window PinballY lays out after the
// scripts' init: the Welcome Screen opens on its turn, without a pause,
// and is redrawn in place for the window's new size, the same choice
// selected, without fading in again; nothing is redrawn while the size
// stays the same.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { WELCOME_SCREEN_Z_INDEX } from "../../common/welcome_screen/welcome_screen_painter.js";
import { shownLayers } from "../support/shown_layers.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { press, highlighted, welcomeScreenLayerCount, WELCOME_SCREEN_FADE_IN_MS } from "./welcome_screen_reader.js";

const SMALL = { width: 845, height: 461 };
const LARGE = { width: 2560, height: 1600 };
// Past the window watch's period (about 100 ms).
const WATCH_OVER_MS = 120;
const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const TABLES = [{ id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness" }];

const backdrop = fake => shownLayers(fake, WELCOME_SCREEN_Z_INDEX.backdrop)[0];
const redrawLines = fake => fake.logLines().filter(line => line.includes("redrawn for the window's new size"));
const shownAlphas = fake => fake.drawingLayers()
    .filter(layer => Object.values(WELCOME_SCREEN_Z_INDEX).includes(layer.zIndex) && layer.alpha > 0)
    .map(layer => layer.alpha);
// The screen's drawings so far, but the Selection Marker's, which turns on every frame.
const screenDrawings = fake => fake.drawings()
    .filter(drawing => Object.values(WELCOME_SCREEN_Z_INDEX).includes(drawing.zIndex) && drawing.zIndex !== WELCOME_SCREEN_Z_INDEX.marker).length;

test("the startup Welcome Screen opens without a pause and follows the window's new size, its choice kept", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 20, 0, 0), tables: TABLES, layoutSize: SMALL });
    fake.addFolder(`${PROFILES}\\Alice`);
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Alice" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["startupChoicePrompt", "profilePicker"].includes(key);
    config.language = "en";
    config.startupScreen = "welcome";
    await import("../../main.js");
    await settle();

    assert.ok(welcomeScreenLayerCount(fake) > 0, "drawn on its turn, without a pause");
    fake.advanceTime(WELCOME_SCREEN_FADE_IN_MS);
    assert.deepEqual(backdrop(fake).canvasSize(), SMALL);
    press(fake, "Next");
    const selected = highlighted(fake);

    fake.setLayoutSize(LARGE);
    fake.advanceTime(WATCH_OVER_MS);
    assert.deepEqual(backdrop(fake).canvasSize(), LARGE, "drawn again for the new size");
    assert.deepEqual(highlighted(fake), selected, "the same choice selected");
    assert.ok(shownAlphas(fake).every(alpha => alpha === 1), "shown at once, no new fade");
    assert.equal(redrawLines(fake).length, 1, redrawLines(fake).join("\n"));
    assert.match(redrawLines(fake)[0], /845x461 to 2560x1600/);
    const layerCount = welcomeScreenLayerCount(fake);

    const drawingsBefore = screenDrawings(fake);
    fake.advanceTime(2000);
    assert.equal(screenDrawings(fake), drawingsBefore, "nothing redrawn while the size stays the same");

    press(fake, "Exit");
    await settle();
    assert.equal(welcomeScreenLayerCount(fake), 0, `no layer left of the ${layerCount} shown`);
    assertNoErrorLogged(fake);
});
