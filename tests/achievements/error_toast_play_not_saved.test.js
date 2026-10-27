// ============================================================
// The Error Toast through main.js: a Play whose Profile data cannot be
// written is lost, so nothing of it is announced; an Error Toast says the
// game could not be saved, on the return to the wheel.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLines } from "../support/error_log.js";
import { MARS, playLocked, profileFile, startErrorToastScenario, watchCards } from "./error_toast_scenario.js";

test("a Play whose Profile data cannot be written brings the Error Toast only", async () => {
    const { fake, profileStore } = await startErrorToastScenario({ addOns: ["achievements"] });

    await playLocked(fake, profileFile("Alice"));

    assert.deepEqual(watchCards(fake).map(card => card.text),
        ["PROBLEM | Attack from Mars | This game could not be saved: it won't count in your stats."],
        "no Achievement of a Play that was not saved");
    assert.equal(profileStore.getPlaysOf("Alice")[MARS.configId], undefined, "the Play is not counted");
    assert.equal(errorLines(fake).length, 1);
    assert.match(errorLines(fake)[0], /^\[ProfileStore\] ERROR in handler: Error: Permission denied: .*Alice\\profile\.json/);
});
