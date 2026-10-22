// ============================================================
// The Confetti Shower vanishes at once, through main.js on the fake
// PinballY globals: each of the three Platinum toasts of one return to the
// wheel starts a shower once the previous one was stopped, by attract
// mode, then a launch another script cancels ("prelaunch"), then a
// started game.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import {
    startScenario, playLastTable, advanceUntil, visibleConfettiCount, showerStartLogs, TABLES,
} from "./confetti_shower_scenario.js";

// Drawing the confetti ahead and the startup toasts.
const STARTUP_MS = 30000;
// Longer than a whole shower.
const SHOWER_MS = 10000;

function waitForConfetti(fake, label) {
    const elapsedMs = advanceUntil(fake, { stepMs: 10, maxMs: 6000 }, () => visibleConfettiCount(fake) > 0);
    assert.notEqual(elapsedMs, null, `confetti fall before ${label}`);
}

function assertHidden(fake, label) {
    assert.equal(visibleConfettiCount(fake), 0, `every confetto hidden at once on ${label}`);
}

test("the Confetti Shower vanishes at once on attract mode, a table launch and a started game", async () => {
    const fake = await startScenario();
    fake.advanceTime(STARTUP_MS);
    await playLastTable(fake);

    waitForConfetti(fake, "attract mode");
    fake.enterAttractMode();
    assertHidden(fake, "attractmodestart");
    fake.exitAttractMode();

    waitForConfetti(fake, "the launch");
    // Another script cancels this launch: PinballY stays on the wheel.
    fake.one("prelaunch", ev => ev.preventDefault());
    fake.playGame(TABLES[0]);
    assertHidden(fake, "prelaunch");

    waitForConfetti(fake, "the game");
    // Abnormal order on purpose: "gamestarted" with no launch before it. In
    // a real launch "prelaunch" has already stopped the shower, and none
    // starts during a launch, so this is the only way to see this stop.
    fake.fire("gamestarted", { game: TABLES[0] });
    assertHidden(fake, "gamestarted");
    fake.playGame(TABLES[0]);
    fake.gameStarted(TABLES[0]);

    fake.advanceTime(SHOWER_MS);
    assert.equal(visibleConfettiCount(fake), 0, "nothing falls again while the game runs");
    assert.equal(showerStartLogs(fake).length, 3);
    assertNoErrorLogged(fake);
});
