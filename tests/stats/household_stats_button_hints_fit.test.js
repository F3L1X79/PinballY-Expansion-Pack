// ============================================================
// The Household Stats' Button Hints in landscape and portrait windows,
// through main.js on the fake PinballY globals: the footer sits inside the
// window, under the columns and the labels, hiding none of them, its
// words inside it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { openHouseholdStats, footerLayout, backToWheel } from "./household_stats_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const NAMES = ["Ann", "Ben", "Cat", "Dan", "Eve", "Fay", "Gus"];
const WINDOWS = [{ width: 1920, height: 1080 }, { width: 1080, height: 1920 }];

test("the footer fits under the columns in landscape and portrait", async () => {
    const { fake, lang } = await startHousehold({ profiles: Object.fromEntries(NAMES.map(name => [name, {}])) });
    for (const size of WINDOWS) {
        fake.setLayoutSize(size);
        openHouseholdStats(fake, lang);
        const { footer, columns, labels, textsInside } = footerLayout(fake, size);
        const where = `${size.width}x${size.height}`;
        assert.ok(footer.top >= 0 && footer.bottom <= size.height && footer.left >= 0 && footer.right <= size.width, `${where}: inside the window`);
        for (const piece of [labels, ...columns]) assert.ok(piece.bottom <= footer.top + 0.5, `${where}: under the columns and labels`);
        assert.ok(textsInside, `${where}: its words inside it`);
        backToWheel(fake);
    }
    assertNoErrorLogged(fake);
});
