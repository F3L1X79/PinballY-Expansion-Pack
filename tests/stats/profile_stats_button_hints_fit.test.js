// ============================================================
// The Profile Stats' Button Hints in landscape and portrait windows,
// through main.js on the fake PinballY globals, every button and table
// strip shown: the footer sits inside the window, under the card, its
// buttons and the sections, hiding none of them, its words inside it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold, played, HOUR, MEDIEVAL } from "./household_stats_scenario.js";
import { openProfileStats, footerLayout, buttons, press } from "./profile_stats_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const WINDOWS = [{ width: 1920, height: 1080 }, { width: 1080, height: 1920 }];

test("the footer fits under the card and the sections in landscape and portrait", async () => {
    const { fake, lang } = await startHousehold({
        profiles: { Alice: { plays: { [MEDIEVAL.configId]: played(3, HOUR) }, playLog: ["2026-09-20T20:00:00"] }, Bob: {} },
        active: "Alice",
        addOns: ["achievements", "challenges", "tableMastery", "highScores", "hallOfFame", "tablesToDiscover"],
        frameImages: true,
    });
    for (const size of WINDOWS) {
        fake.setLayoutSize(size);
        openProfileStats(fake, lang);
        assert.equal(buttons(fake).length, 5, "every button at the card's foot");
        const { footer, pieces, textsInside } = footerLayout(fake, size);
        const where = `${size.width}x${size.height}`;
        assert.ok(footer.top >= 0 && footer.bottom <= size.height && footer.left >= 0 && footer.right <= size.width, `${where}: inside the window`);
        for (const piece of pieces) assert.ok(piece.bottom <= footer.top + 0.5, `${where}: under every other piece`);
        assert.ok(textsInside, `${where}: its words inside it`);
        press(fake, "Exit");
    }
    assertNoErrorLogged(fake);
});
