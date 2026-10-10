// ============================================================
// Every language file carries the same keys as English in every section,
// down to each threshold of the thresholded titles, so no player sees an
// English fallback (common/i18n.js no longer logs one). The translations of
// PinballY's own texts, keyed by their English source, are left out:
// English needs none of them. Reads the language files only.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import en from "../../lang/en.js";

const LANGUAGE_CODES = ["fr", "de", "es", "it", "pt"];
// Keyed by PinballY's English texts, which English shows as they are.
const SOURCE_KEYED_SECTIONS = ["nativeMenuLabels", "mediaCaptureItemLabels", "mediaCaptureActionLabels", "launchOverlayMessages"];

function keyPaths(section, prefix) {
    return Object.entries(section).flatMap(([key, value]) => {
        const path = `${prefix}.${key}`;
        return typeof value === "object" && value !== null ? keyPaths(value, path) : [path];
    }).sort();
}

for (const code of LANGUAGE_CODES) {
    test(`${code} has every text key English has, and no other`, async () => {
        const { default: texts } = await import(`../../lang/${code}.js`);
        assert.deepEqual(Object.keys(texts).sort(), Object.keys(en).sort());
        for (const section of Object.keys(en).filter(name => !SOURCE_KEYED_SECTIONS.includes(name))) {
            assert.deepEqual(keyPaths(texts[section], section), keyPaths(en[section], section));
        }
    });
}
