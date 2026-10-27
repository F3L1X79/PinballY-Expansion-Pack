// ============================================================
// Update Prompt when the last active Profile is not an Admin Profile while
// the Household has one: nothing shows, the Profile picker opens as usual,
// and the version stays unoffered for a later start.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { isDrawnMenuShown } from "../drawn_menu/drawn_menu_reader.js";
import { startOnProfilePicker, isCarouselOpen, CAROUSEL_PAUSE_MS } from "../core/startup_picker_scenario.js";

const STATE_FILE = "C:\\PinballY\\Scripts\\ExpansionPack\\pack_update.json";
const ADMIN_PROFILE_FILE = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles\\Alice\\profile.json";
const RELEASE = {
    packVersion: "9.0.0",
    zipUrl: "https://github.com/F3L1X79/PinballY-Expansion-Pack/releases/download/v9.0.0/ExpansionPack.zip",
    sha256: "c0".repeat(32),
};

test("a last active Profile without the setup entries sees no Update Prompt, and nothing is marked", async () => {
    const { fake, lang, settle } = await startOnProfilePicker({
        addOns: ["startupChoicePrompt", "profilePicker", "drawnMenus"],
        activeProfile: "Bob",
        seed: f => {
            f.addFile(ADMIN_PROFILE_FILE, JSON.stringify({ version: 1, plays: {}, notified: [], isAdmin: true }));
            f.addFile(STATE_FILE, JSON.stringify({ version: 1, latestRelease: RELEASE }));
        },
    });
    await settle();
    fake.advanceTime(CAROUSEL_PAUSE_MS);

    assert.equal(isCarouselOpen(fake, lang), true, "the picker opens as usual");
    assert.equal(isDrawnMenuShown(fake), false);
    assert.equal(JSON.parse(fake.readFile(STATE_FILE)).offeredVersion, undefined);
    assertNoErrorLogged(fake);
});
