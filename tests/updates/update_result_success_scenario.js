// ============================================================
// Starts main.js on the fake host at the first start on the Pack Version an
// update installed, the check off, with the test's own Release Highlights in
// place of the language files' (English's too: the fallback of the others).
// Never loaded by PinballY; one start per test file.
// ============================================================

import { OPEN_OVER_MS } from "../drawn_menu/drawn_menu_reader.js";
import { startOnProfilePicker } from "../core/startup_picker_scenario.js";
import { PACK_VERSION } from "../../common/core/pack_version.js";

// Not imported from update_failed_scenario.js, which loads the language too early.
export const STATE_FILE = "C:\\PinballY\\Scripts\\ExpansionPack\\pack_update.json";

async function replaceReleaseHighlights(language, releaseHighlights) {
    const { default: texts } = await import(`../../lang/${language}.js`);
    for (const version of Object.keys(texts.releaseHighlights)) delete texts.releaseHighlights[version];
    Object.assign(texts.releaseHighlights, releaseHighlights);
}

// previousVersion: the one recorded with the request (none: asked by an
// older pack); releaseHighlights: keyed by Pack Version, in that language.
export async function startAfterUpdate({ language = "en", previousVersion, releaseHighlights }) {
    await replaceReleaseHighlights("en", language === "en" ? releaseHighlights : {});
    if (language !== "en") await replaceReleaseHighlights(language, releaseHighlights);
    const started = await startOnProfilePicker({
        addOns: ["startupChoicePrompt", "profilePicker", "drawnMenus"],
        settings: { updateCheck: false, language },
        seed: f => f.addFile(STATE_FILE, JSON.stringify({ version: 1, requestedVersion: PACK_VERSION, offeredVersion: PACK_VERSION, previousVersion })),
    });
    await started.settle();
    started.fake.advanceTime(OPEN_OVER_MS);
    return started;
}
