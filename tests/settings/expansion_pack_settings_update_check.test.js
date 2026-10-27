// ============================================================
// The Update check line of the Expansion Pack Settings, through main.js:
// its page lists On and Off, the saved one marked; choosing saves
// UPDATE_CHECK at once, shown "on restart"; a failed write says "Setting not
// saved". With no newer Pack Version known, no "Update to" entry.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { readDrawnMenu, drawnMenuLines, highlightedEntry, markedEntries, chooseEntry, OPEN_OVER_MS } from "../drawn_menu/drawn_menu_reader.js";
import { errorLines } from "../support/error_log.js";

const ENV_LOCAL = "C:\\PinballY\\Scripts\\ExpansionPack\\.env.local";
const fake = createFakePinballYHost({ now: new Date(2026, 9, 27, 20, 0, 0) });

test("setup", async () => {
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "drawnMenus";
    config.language = "en";
    await import("../../main.js");
    await settle();
});

test("the Update check line comes after the language line, with no Update entry when no release is known", () => {
    fake.openOperatorMenu();
    fake.advanceTime(OPEN_OVER_MS);
    chooseEntry(fake, "Expansion Pack Settings");
    fake.advanceTime(OPEN_OVER_MS);

    assert.deepEqual(drawnMenuLines(fake).slice(5), ["---", "Startup screen: Profile picker", "Language: English", "Update check: On", "---", "Back"]);
});

test("its page lists On and Off, the saved one marked, then Cancel", () => {
    chooseEntry(fake, "Update check: On");
    fake.advanceTime(OPEN_OVER_MS);

    assert.deepEqual(drawnMenuLines(fake), ["On", "Off", "---", "Cancel"]);
    assert.deepEqual(markedEntries(fake, "radio"), ["On"]);
    assert.equal(highlightedEntry(fake), "On");
});

test("choosing Off saves UPDATE_CHECK at once, shown on restart", () => {
    chooseEntry(fake, "Off");
    fake.advanceTime(OPEN_OVER_MS);

    assert.equal(fake.readFile(ENV_LOCAL), "UPDATE_CHECK=false\r\n");
    assert.ok(fake.logLines().includes("[ExpansionPackSettings] Saved UPDATE_CHECK=false in .env.local."));
    assert.equal(highlightedEntry(fake), "Update check: Off (on restart)");
    assert.equal(config.updateCheck, true, "the running setting stays until PinballY restarts");
    assert.deepEqual(errorLines(fake), []);
});

test("a write that fails says \"Setting not saved\", then the page on the value saved before", () => {
    fake.lockFile(ENV_LOCAL);
    chooseEntry(fake, "Update check: Off (on restart)");
    fake.advanceTime(OPEN_OVER_MS);
    chooseEntry(fake, "On");
    fake.advanceTime(OPEN_OVER_MS);

    assert.equal(readDrawnMenu(fake).message, "Setting not saved");
    chooseEntry(fake, "OK");
    fake.advanceTime(OPEN_OVER_MS);
    assert.deepEqual(markedEntries(fake, "radio"), ["Off"]);
    assert.equal(fake.readFile(ENV_LOCAL), "UPDATE_CHECK=false\r\n");
    assert.equal(errorLines(fake).length, 1);
    assert.match(errorLines(fake)[0], /^\[ExpansionPackSettings\] .*Permission denied/);
});
