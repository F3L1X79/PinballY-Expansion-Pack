// ============================================================
// With the Seamless Launch Overlay off, main.js shows no Loader at launch:
// PinballY's own launch screen stays as it was, its messages translated
// and never cancelled.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { loaderLayerCount } from "../support/loader_reader.js";

test("no Loader at launch with the Seamless Launch Overlay off, and PinballY's own message translated", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 17, 20, 0, 0), tables: [{ configId: "afm", title: "Attack from Mars" }] });
    const game = fake.getAllTables()[0];
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    config.addOns.seamlessLaunchOverlay = false;
    await import("../../main.js");
    await settle();

    const launch = fake.fire("launchoverlayshow", { game });
    assert.equal(launch.defaultPrevented, false, "PinballY's own launch background stays");
    const message = id => fake.fire("launchoverlaymessage", { id, message: null, hideWheelImage: false });
    message("init");
    const loading = message("launching");
    assert.equal(loading.defaultPrevented, false, "PinballY's own message stays");
    assert.equal(loading.message, "Loading...", "in the player's language");
    assert.equal(loaderLayerCount(fake), 0, "no Loader while the table loads");
    const closing = message("terminating");
    assert.equal(closing.defaultPrevented, false);
    assert.equal(closing.message, "Returning to tables…", "the pack says tables");
    assert.equal(loaderLayerCount(fake), 0, "no Loader while it closes");
    fake.fire("launchoverlayhide", { game });
    assertNoErrorLogged(fake);
});
