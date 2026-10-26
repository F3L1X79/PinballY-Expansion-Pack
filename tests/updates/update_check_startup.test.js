// ============================================================
// Update Check at a PinballY start, on the default Startup Screen: one GET
// of the latest release, the Profile picker as quick as ever, and a newer
// Pack Version remembered without anything on screen for it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readLoader } from "../support/loader_reader.js";
import { startupVeil } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen, CAROUSEL_PAUSE_MS } from "../core/startup_picker_scenario.js";
import { LATEST_RELEASE_URL } from "../../common/updates/update_check.js";

const STATE_FILE = "C:\\PinballY\\Scripts\\ExpansionPack\\pack_update.json";
const ZIP_URL = "https://github.com/F3L1X79/PinballY-Expansion-Pack/releases/download/v9.0.0/ExpansionPack.zip";
const SHA256 = "c0".repeat(32);

test("a start asks for the latest release once, opens the Profile picker as usual, and remembers a newer one", async () => {
    const { fake, lang, settle } = await startOnProfilePicker({
        seed: f => f.replyToHttp({ text: JSON.stringify({
            tag_name: "v9.0.0",
            assets: [{ name: "ExpansionPack.zip", browser_download_url: ZIP_URL, digest: `sha256:${SHA256}` }],
        }) }),
    });
    assert.equal(startupVeil(fake).shown, true, "the wheel dimmed from the first frame");
    assert.equal(readLoader(fake).shown, true);
    await settle();

    const requests = fake.httpRequests();
    assert.equal(requests.length, 1);
    assert.ok(requests[0].url.startsWith(`${LATEST_RELEASE_URL}?`), requests[0].url);
    assert.deepEqual(JSON.parse(fake.readFile(STATE_FILE)),
        { version: 1, latestRelease: { packVersion: "9.0.0", zipUrl: ZIP_URL, sha256: SHA256 } });

    fake.advanceTime(CAROUSEL_PAUSE_MS);
    assert.equal(isCarouselOpen(fake, lang), true, "the carousel shows after its usual pause");
    assert.deepEqual(fake.shownMenus(), [], "nothing about the update at this start");
    assertNoErrorLogged(fake);
});
