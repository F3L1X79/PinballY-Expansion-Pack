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
    // The events as PinballY reads them back once every listener has run.
    const shown = [];
    const messages = new Map();
    fake.on("launchoverlayshow", ev => shown.push(ev));
    fake.on("launchoverlaymessage", ev => messages.set(ev.id, ev));

    fake.playGame(game);
    assert.equal(shown[0].defaultPrevented, false, "PinballY's own launch background stays");
    fake.gameStarted(game);
    const loading = messages.get("launching");
    assert.equal(loading.defaultPrevented, false, "PinballY's own message stays");
    assert.equal(loading.message, "Loading...", "in the player's language");
    assert.equal(loaderLayerCount(fake), 0, "no Loader while the table loads");
    fake.runCommand(fake.getBuiltInCommand("KillGame"));
    const closing = messages.get("terminating");
    assert.equal(closing.defaultPrevented, false);
    assert.equal(closing.message, "Returning to tables…", "the pack says tables");
    assert.equal(loaderLayerCount(fake), 0, "no Loader while it closes");
    fake.gameOver(game);
    assertNoErrorLogged(fake);
});
