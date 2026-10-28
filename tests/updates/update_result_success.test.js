// ============================================================
// The first start on the Pack Version an update installed, through main.js
// on the fake host, the check off: "Expansion Pack updated to vX.Y.Z" shows
// before the Profile picker, once; the request is cleared.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readDrawnMenu, drawnMenuLines, isDrawnMenuShown, chooseEntry, OPEN_OVER_MS } from "../drawn_menu/drawn_menu_reader.js";
import { startOnProfilePicker, isCarouselOpen, CAROUSEL_PAUSE_MS } from "../core/startup_picker_scenario.js";
import { PACK_VERSION } from "../../common/core/pack_version.js";
import { STATE_FILE, requestedVersionOf } from "./update_failed_scenario.js";

test("a Pack Update that worked says so once, before the Profile picker", async () => {
    const { fake, lang, settle } = await startOnProfilePicker({
        addOns: ["startupChoicePrompt", "profilePicker", "drawnMenus"],
        settings: { updateCheck: false },
        seed: f => f.addFile(STATE_FILE, JSON.stringify({ version: 1, requestedVersion: PACK_VERSION, offeredVersion: PACK_VERSION })),
    });
    await settle();
    fake.advanceTime(OPEN_OVER_MS);

    assert.equal(readDrawnMenu(fake).message, `Expansion Pack updated to v${PACK_VERSION}`);
    assert.deepEqual(drawnMenuLines(fake), ["OK"]);
    assert.equal(isCarouselOpen(fake, lang), false, "the message comes before the picker");
    assert.equal(requestedVersionOf(fake), undefined, "said once");

    chooseEntry(fake, "OK");
    assert.equal(isDrawnMenuShown(fake), false);
    await settle();
    fake.advanceTime(CAROUSEL_PAUSE_MS + OPEN_OVER_MS);
    assert.equal(isCarouselOpen(fake, lang), true, "the picker opens once the message closed");
    assertNoErrorLogged(fake);
});
