// ============================================================
// The launch events trace through main.js with LOG_LAUNCH_EVENTS on: one
// line per launch event, in the order fired, with a millisecond timestamp,
// and the message id or the table title; the overlay and its Loader unchanged.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readLoader } from "../support/loader_reader.js";

// A "%" would be read as a format by a multi-argument logfile.log.
const TABLE = { configId: "pct", title: "100% Pinball %s" };

test("each launch event is logged in the order fired, with its id or the table title", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 22, 20, 0, 0), tables: [TABLE] });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = key === "launchEventsTrace" || key === "seamlessLaunchOverlay";
    }
    config.logLaunchEvents = true;
    await import("../../main.js");
    await settle();
    const game = fake.getAllTables()[0];
    const initCancelled = [];
    fake.on("launchoverlaymessage", ev => { if (ev.id === "init") initCancelled.push(ev.defaultPrevented); });

    fake.playGame(game);
    assert.deepEqual(initCancelled, [true], "the overlay still cancels PinballY's message");
    assert.equal(readLoader(fake).shown, true, "the Loader still turns");
    fake.advanceTime(1239);
    fake.gameStarted(game);
    fake.advanceTime(5);
    fake.gameOver(game);
    fake.advanceTime(10);
    fake.playGame(game);
    fake.launchError(game);

    const traced = fake.logLines().filter(line => line.startsWith("[LaunchEvents]"));
    assert.deepEqual(traced, [
        "[LaunchEvents] 20:00:00.000 prelaunch 100% Pinball %s",
        "[LaunchEvents] 20:00:00.000 launchoverlayshow 100% Pinball %s",
        "[LaunchEvents] 20:00:00.000 launchoverlaymessage init",
        "[LaunchEvents] 20:00:01.239 runbeforepre 100% Pinball %s",
        "[LaunchEvents] 20:00:01.239 launchoverlaymessage launching",
        "[LaunchEvents] 20:00:01.239 runbefore 100% Pinball %s",
        "[LaunchEvents] 20:00:01.239 launchoverlaymessage running",
        "[LaunchEvents] 20:00:01.239 gamestarted 100% Pinball %s",
        "[LaunchEvents] 20:00:01.244 launchoverlaymessage gameover",
        "[LaunchEvents] 20:00:01.244 gameover 100% Pinball %s",
        "[LaunchEvents] 20:00:01.244 runafter 100% Pinball %s",
        "[LaunchEvents] 20:00:01.244 launchoverlaymessage after",
        "[LaunchEvents] 20:00:01.244 runafterpost 100% Pinball %s",
        "[LaunchEvents] 20:00:01.244 launchoverlayhide 100% Pinball %s",
        "[LaunchEvents] 20:00:01.244 postlaunch 100% Pinball %s",
        "[LaunchEvents] 20:00:01.254 prelaunch 100% Pinball %s",
        "[LaunchEvents] 20:00:01.254 launchoverlayshow 100% Pinball %s",
        "[LaunchEvents] 20:00:01.254 launchoverlaymessage init",
        "[LaunchEvents] 20:00:01.254 runbeforepre 100% Pinball %s",
        "[LaunchEvents] 20:00:01.254 launchoverlaymessage launching",
        "[LaunchEvents] 20:00:01.254 runbefore 100% Pinball %s",
        "[LaunchEvents] 20:00:01.254 launcherror 100% Pinball %s",
        "[LaunchEvents] 20:00:01.254 launchoverlayhide 100% Pinball %s",
        "[LaunchEvents] 20:00:01.254 launchoverlayhide 100% Pinball %s",
        "[LaunchEvents] 20:00:01.254 postlaunch 100% Pinball %s",
    ]);
    assert.deepEqual(readLoader(fake), { shown: false }, "the Loader is gone with the overlay");
    assertNoErrorLogged(fake);
});
