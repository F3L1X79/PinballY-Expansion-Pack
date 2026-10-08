// ============================================================
// The Fireworks before their drawing ahead ends, through main.js on the
// fake PinballY globals: a button pressed every 100 ms keeps the drawing
// ahead from running from startup on, so the Level Toast of a Play shows alone and the
// log says why.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "./fake_pinbally_host.js";
import { startScenario, levelToasts, errorLines, TABLES, MINUTE, ALL_TOASTS_MS, levelToastOf, pickLastTables } from "./mastery_bar_scenario.js";
import { visibleFireworksCount, fireworksStartLogs, fireworksNotStartedLogs } from "./fireworks_reader.js";

const PRESS_EVERY_MS = 100;

test("before the drawing ahead ends, the Level Toast shows alone and the log says why", async () => {
    pickLastTables();
    const fake = await startScenario({ addOns: ["achievements"], profiles: { guest: {} } });

    const [table] = TABLES;
    fake.playGame(table);
    fake.gameStarted(table);
    await settle();
    fake.advanceTime(10 * MINUTE * 1000);
    fake.fire("commandbuttondown");
    fake.gameOver(table);
    await settle();
    let mostVisible = 0;
    for (let elapsedMs = 0; elapsedMs <= ALL_TOASTS_MS; elapsedMs += PRESS_EVERY_MS) {
        fake.fire("commandbuttondown");
        mostVisible = Math.max(mostVisible, visibleFireworksCount(fake));
        fake.advanceTime(PRESS_EVERY_MS);
    }

    assert.deepEqual(levelToasts(fake), [levelToastOf(2)], "the Level Toast still shows");
    assert.equal(mostVisible, 0);
    assert.deepEqual(fireworksStartLogs(fake), []);
    assert.deepEqual(fireworksNotStartedLogs(fake), ["[Fireworks] Not started: the Fireworks are still being drawn ahead."]);
    assert.deepEqual(errorLines(fake), []);
});
