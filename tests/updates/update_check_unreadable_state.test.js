// ============================================================
// Update Check after a crash that cut the update state file short: the
// file is logged and deleted, and the start goes on: the Profile picker
// opens and the check asks GitHub as with no file.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLines } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen, CAROUSEL_PAUSE_MS } from "../core/startup_picker_scenario.js";

const STATE_FILE = "C:\\PinballY\\Scripts\\ExpansionPack\\pack_update.json";

test("an unreadable update state file is logged and deleted, and the start goes on", async () => {
    const { fake, lang, settle } = await startOnProfilePicker({
        seed: f => f.addFile(STATE_FILE, "{ \"version\": 1, \"latestRelease\": { \"packVer"),
    });
    await settle();

    const errors = errorLines(fake);
    assert.equal(errors.length, 1, errors.join("\n"));
    assert.ok(errors[0].startsWith("[UpdateCheck]") && errors[0].includes("pack_update.json"), errors[0]);
    assert.equal(fake.readFile(STATE_FILE), undefined, "deleted");
    assert.equal(fake.httpRequests().length, 1, "the check asks as with no file");
    fake.advanceTime(CAROUSEL_PAUSE_MS);
    assert.equal(isCarouselOpen(fake, lang), true);
});
