// ============================================================
// A toast's optional extra line on the fake host: drawn under the
// description, it grows the card; without one, the card is drawn as before.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "./fake_pinbally_host.js";
import { createAchievementToasts, TOAST_KIND } from "../common/achievement_toast.js";
import { toastDrawings, shownCardHeights } from "./achievement_toast_reader.js";

// Enough for both cards to rise into place, shorter than any hold.
const SETTLE_MS = 1500;
// Long enough for the description to wrap onto a second line.
const DESCRIPTION = "12 tables at Specialist or above, and a few more to go";
const toast = extraLine => ({
    kind: TOAST_KIND.MASTERY, accent: 0xFFC0C0C0, tileNumber: 5, header: "Collection Mastery",
    title: "Tier 5: Specialist", description: DESCRIPTION, onShown() {}, ...(extraLine ? { extraLine } : {}),
});

test("an extra line shows under the description and grows the card", () => {
    const fake = createFakePinballYHost();
    fake.installGlobals();
    const toasts = createAchievementToasts(fake);
    toasts.submit(toast());
    toasts.submit(toast("New frame: Spice of Arrakis"));
    fake.advanceTime(SETTLE_MS);

    assert.deepEqual(toastDrawings(fake).map(drawing => drawing.texts), [
        ["5", "COLLECTION MASTERY", "Tier 5: Specialist", DESCRIPTION],
        ["5", "COLLECTION MASTERY", "Tier 5: Specialist", DESCRIPTION, "New frame: Spice of Arrakis"],
    ]);
    const [plain, withLine] = shownCardHeights(fake);
    assert.ok(withLine > plain, `${withLine} > ${plain}`);
});
