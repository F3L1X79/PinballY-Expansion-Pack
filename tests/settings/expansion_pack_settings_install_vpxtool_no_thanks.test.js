// ============================================================
// The Script Reader Prompt from the Settings, through main.js: "No thanks"
// and Exit each return to the list on the install line, with nothing
// installed, nothing saved in .env.local and no Loader.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { drawnMenuLines, highlightedEntry, press, chooseEntry, OPEN_OVER_MS } from "../drawn_menu/drawn_menu_reader.js";
import { readLoader } from "../support/loader_reader.js";
import { startOnSettings, openDialog, assertNoOtherErrorLogged, DIALOG } from "./install_vpxtool_scenario.js";

const ENV_LOCAL = "C:\\PinballY\\Scripts\\ExpansionPack\\.env.local";

let fake;

test("setup", async () => {
    ({ fake } = await startOnSettings());
});

test("No thanks returns to the install line with nothing changed", () => {
    openDialog(fake);
    chooseEntry(fake, "No thanks");
    fake.advanceTime(OPEN_OVER_MS);

    assert.equal(highlightedEntry(fake), "Install vpxtool v0.38.0");
    assert.deepEqual(fake.scriptReaderInstallsAsked(), []);
    assert.equal(readLoader(fake).shown, false);
    assert.equal(fake.files.fileExists(ENV_LOCAL), false, "no answer saved");
});

test("Exit does the same", () => {
    openDialog(fake);
    assert.deepEqual(drawnMenuLines(fake), DIALOG.lines);
    press(fake, "Exit");
    fake.advanceTime(OPEN_OVER_MS);

    assert.equal(highlightedEntry(fake), "Install vpxtool v0.38.0");
    assert.deepEqual(fake.scriptReaderInstallsAsked(), []);
    assert.equal(fake.files.fileExists(ENV_LOCAL), false);
    assertNoOtherErrorLogged(fake);
});
