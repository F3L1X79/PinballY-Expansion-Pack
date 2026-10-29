// ============================================================
// "Update now" on the Update Prompt: the requested and running versions are recorded, the
// Loader turns over the dimmed wheel, the Pack Update starts with the
// remembered URL, digest and version, and PinballY quits once the helper is
// ready, the Profile picker never opening in the meantime.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { chooseEntry, isDrawnMenuShown, OPEN_OVER_MS } from "../drawn_menu/drawn_menu_reader.js";
import { readLoader } from "../support/loader_reader.js";
import { startOnProfilePicker, isCarouselOpen, CAROUSEL_OPEN_MS } from "../core/startup_picker_scenario.js";
import { PACK_VERSION } from "../../common/core/pack_version.js";

const STATE_FILE = "C:\\PinballY\\Scripts\\ExpansionPack\\pack_update.json";
const PACK_UPDATE_HELPER = "C:\\PinballY\\Scripts\\ExpansionPack\\tools\\pack_update.ps1";
const RELEASE = {
    packVersion: "9.0.0",
    zipUrl: "https://github.com/F3L1X79/PinballY-Expansion-Pack/releases/download/v9.0.0/ExpansionPack.zip",
    sha256: "c0".repeat(32),
};

test("Update now records the version, shows the Loader, and starts the Pack Update", async () => {
    const { fake, lang, settle } = await startOnProfilePicker({
        addOns: ["startupChoicePrompt", "profilePicker", "drawnMenus"],
        seed: f => {
            f.addFile(STATE_FILE, JSON.stringify({ version: 1, latestRelease: RELEASE }));
            f.addFile(PACK_UPDATE_HELPER, "helper");
        },
    });
    await settle();
    fake.advanceTime(OPEN_OVER_MS);

    chooseEntry(fake, "Update now");
    await settle();
    assert.equal(isDrawnMenuShown(fake), false);
    assert.deepEqual(fake.packUpdatesAsked(), [RELEASE]);
    const saved = JSON.parse(fake.readFile(STATE_FILE));
    assert.equal(saved.requestedVersion, "9.0.0");
    assert.equal(saved.previousVersion, PACK_VERSION, "for the Release Highlights of the versions on the way");
    assert.equal(readLoader(fake).shown, true);

    fake.advanceTime(CAROUSEL_OPEN_MS + OPEN_OVER_MS);
    await settle();
    assert.equal(isCarouselOpen(fake, lang), false, "no picker while the helper gets ready");

    fake.advanceTime(5000);
    assert.deepEqual(fake.executedCommands().filter(id => id === fake.getBuiltInCommand("Quit")), [fake.getBuiltInCommand("Quit")]);
    assertNoErrorLogged(fake);
});
