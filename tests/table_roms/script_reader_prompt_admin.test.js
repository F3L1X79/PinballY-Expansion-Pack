// ============================================================
// Script Reader Prompt with vpxtool missing and an Admin Profile last
// active, through main.js on the fake host: it opens before the Profile
// picker, says what vpxtool is and that it can come later; "Install" starts
// the install as from the Settings. No Error Toast; the missing vpxtool logged once.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLines } from "../support/error_log.js";
import { isCarouselOpen, CAROUSEL_OPEN_MS } from "../core/startup_picker_scenario.js";
import { readLoader, readLoaderCaption } from "../support/loader_reader.js";
import { startWithoutVpxtool, answer, PROMPT, MISSING_LOGGED } from "./script_reader_prompt_scenario.js";

test("vpxtool missing: an Admin Profile last active gets the Script Reader Prompt before the Startup Screen", async () => {
    const start = await startWithoutVpxtool({ adminProfiles: ["Alice"], activeProfile: "Alice" });
    const { fake, lang } = start;

    assert.deepEqual(start.dialog, PROMPT);
    fake.advanceTime(CAROUSEL_OPEN_MS);
    assert.equal(isCarouselOpen(fake, lang), false, "the Startup Screen waits for the prompt");

    await answer(start, "Install");
    assert.deepEqual(fake.scriptReaderInstallsAsked().map(install => install.version), ["0.38.0"]);
    assert.equal(readLoader(fake).shown, true);
    assert.equal(readLoaderCaption(fake).text, "Downloading…");
    assert.deepEqual(errorLines(fake), [MISSING_LOGGED]);
});
