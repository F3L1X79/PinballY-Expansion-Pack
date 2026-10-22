// ============================================================
// The launch events trace through main.js with LOG_LAUNCH_EVENTS on: one
// line per launch event, in the order fired, with a millisecond timestamp,
// and the message id or the table title; the overlay and its Loader unchanged.
// - The fake host does not fire the launch events yet (#311): fired by hand here.
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
    const message = id => fake.fire("launchoverlaymessage", { id, message: null, hideWheelImage: false });

    fake.fire("prelaunch", { game });
    fake.fire("launchoverlayshow", { game });
    assert.equal(message("init").defaultPrevented, true, "the overlay still cancels PinballY's message");
    fake.advanceTime(5);
    fake.fire("runbeforepre", { game });
    message("launching");
    fake.fire("runbefore", { game });
    assert.equal(readLoader(fake).shown, true, "the Loader still turns");
    fake.advanceTime(1234);
    message("running");
    fake.fire("gamestarted", { game });
    message("gameover");
    fake.fire("gameover", { game });
    fake.fire("runafter", { game });
    message("after");
    fake.fire("runafterpost", { game });
    fake.fire("launchoverlayhide", { game });
    fake.fire("postlaunch", { game });
    // Abnormal order on purpose: PinballY never fires launcherror after a
    // played game; it closes the list so every traced event is checked.
    fake.fire("launcherror", { game });

    const traced = fake.logLines().filter(line => line.startsWith("[LaunchEvents]"));
    assert.deepEqual(traced, [
        "[LaunchEvents] 20:00:00.000 prelaunch 100% Pinball %s",
        "[LaunchEvents] 20:00:00.000 launchoverlayshow 100% Pinball %s",
        "[LaunchEvents] 20:00:00.000 launchoverlaymessage init",
        "[LaunchEvents] 20:00:00.005 runbeforepre 100% Pinball %s",
        "[LaunchEvents] 20:00:00.005 launchoverlaymessage launching",
        "[LaunchEvents] 20:00:00.005 runbefore 100% Pinball %s",
        "[LaunchEvents] 20:00:01.239 launchoverlaymessage running",
        "[LaunchEvents] 20:00:01.239 gamestarted 100% Pinball %s",
        "[LaunchEvents] 20:00:01.239 launchoverlaymessage gameover",
        "[LaunchEvents] 20:00:01.239 gameover 100% Pinball %s",
        "[LaunchEvents] 20:00:01.239 runafter 100% Pinball %s",
        "[LaunchEvents] 20:00:01.239 launchoverlaymessage after",
        "[LaunchEvents] 20:00:01.239 runafterpost 100% Pinball %s",
        "[LaunchEvents] 20:00:01.239 launchoverlayhide 100% Pinball %s",
        "[LaunchEvents] 20:00:01.239 postlaunch 100% Pinball %s",
        "[LaunchEvents] 20:00:01.239 launcherror 100% Pinball %s",
    ]);
    assert.deepEqual(readLoader(fake), { shown: false }, "the Loader is gone with the overlay");
    assertNoErrorLogged(fake);
});
