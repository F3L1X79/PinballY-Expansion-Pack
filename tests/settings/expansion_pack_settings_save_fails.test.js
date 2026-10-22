// ============================================================
// A failed Save in the Expansion Pack Settings, through main.js: .env.local
// held by another program, the write error logged, "Setting not saved" with
// OK, then the page back on the choice saved before, the file unchanged.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { readDrawnMenu, drawnMenuLines, highlightedEntry, press, chooseEntry, OPEN_OVER_MS } from "../drawn_menu/drawn_menu_reader.js";
import { errorLines } from "../support/error_log.js";

const ENV_LOCAL = "C:\\PinballY\\Scripts\\ExpansionPack\\.env.local";
const SAVED_TEXT = "ADD_ON_HIGH_SCORES=true\r\n";
const fake = createFakePinballYHost({ now: new Date(2026, 9, 22, 20, 0, 0) });

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "drawnMenus" || key === "highScores";
    config.language = "en";
    await import("../../main.js");
    await settle();
});

test("a Save that cannot write shows \"Setting not saved\", logged, the file unchanged", () => {
    fake.addFile(ENV_LOCAL, SAVED_TEXT);
    fake.lockFile(ENV_LOCAL);
    fake.openOperatorMenu();
    fake.advanceTime(OPEN_OVER_MS);
    chooseEntry(fake, "Expansion Pack Settings");
    fake.advanceTime(OPEN_OVER_MS);
    chooseEntry(fake, "High Scores: On");
    fake.advanceTime(OPEN_OVER_MS);
    press(fake, "Select");
    chooseEntry(fake, "Save");
    fake.advanceTime(OPEN_OVER_MS);

    assert.equal(readDrawnMenu(fake).message, "Setting not saved");
    assert.deepEqual(drawnMenuLines(fake), ["OK"]);
    assert.equal(fake.readFile(ENV_LOCAL), SAVED_TEXT);
    const errors = errorLines(fake);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /^\[ExpansionPackSettings\] .*Permission denied/);
});

test("OK goes back to the page, on the choice saved before", () => {
    chooseEntry(fake, "OK");
    fake.advanceTime(OPEN_OVER_MS);

    assert.deepEqual(drawnMenuLines(fake), ["High Scores: On", "Cancel"]);
    assert.equal(highlightedEntry(fake), "High Scores: On");
    press(fake, "Exit");
    fake.advanceTime(OPEN_OVER_MS);
    assert.equal(highlightedEntry(fake), "High Scores: On", "back on the list, nothing saved");
    assert.equal(errorLines(fake).length, 1, "no other error");
});
