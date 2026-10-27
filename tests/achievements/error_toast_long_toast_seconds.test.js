// ============================================================
// The Error Toast through main.js holds for the configured toast time when
// it is longer than its own 10 s.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import config from "../../common/core/config.js";
import { errorLines } from "../support/error_log.js";
import { playLogFile, playLocked, startErrorToastScenario, watchCards } from "./error_toast_scenario.js";

test("a configured toast time of 20 s holds the Error Toast 20 s", async () => {
    config.achievementToastSeconds = 20;
    const { fake } = await startErrorToastScenario({
        files: { [playLogFile("Alice")]: JSON.stringify({ version: 1, plays: [] }) },
    });

    await playLocked(fake, playLogFile("Alice"));
    const [errorCard, ...others] = watchCards(fake);

    assert.deepEqual(others, []);
    assert.ok(errorCard.shownMs >= 20000 && errorCard.shownMs < 20600, `holds 20 s, not ${errorCard.shownMs} ms`);
    assert.equal(errorLines(fake).length, 1, "the Play Log's write failure");
});
