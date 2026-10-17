// ============================================================
// The launch's gold words in French, through main.js on the fake PinballY
// globals with the Seamless Launch Overlay on: "Chargement en cours…"
// while the table loads, "Retour aux tables…" while it closes.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readLaunchText } from "../support/launch_text_reader.js";

test("the launch speaks French: Chargement en cours…, then Retour aux tables…", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 9, 17, 20, 0, 0), tables: [{ configId: "afm", title: "Attack from Mars" }] });
    const game = fake.getAllTables()[0];
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    // Before main.js reads the texts.
    config.language = "fr";
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "seamlessLaunchOverlay";
    await import("../../main.js");
    await settle();
    const message = id => fake.fire("launchoverlaymessage", { id, message: null, hideWheelImage: false });

    fake.fire("launchoverlayshow", { game });
    message("init");
    message("launching");
    assert.equal(readLaunchText(fake).text, "Chargement en cours…");
    message("running");
    message("terminating");
    assert.equal(readLaunchText(fake).text, "Retour aux tables…");
    fake.fire("launchoverlayhide", { game });
    assertNoErrorLogged(fake);
});
