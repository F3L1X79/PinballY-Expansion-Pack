// ============================================================
// Time Travel's absence, started through main.js on the fake PinballY
// globals: like the Decades family, the secret is built only when the
// tables the active Profile can see cover at least three decades. Guest
// sees a 2000s, a 1980s and a 1970s Adult Table; Bob, a Child Profile,
// does not see the Adult Table, and nobody counts the hidden 1960s table.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startSurprisesScenario, table } from "./surprises_scenario.js";
import config from "../common/config.js";

test("Time Travel is absent when the visible tables cover fewer than three decades", async () => {
    const { fake, TEXT, listRows, switchTo } = await startSurprisesScenario({
        now: new Date(2026, 9, 5, 9, 0, 0),
        tables: [
            table(1, "Table 2005", { year: 2005 }),
            table(2, "Table 1985", { year: 1985 }),
            table(3, "Adult Table 1975", { year: 1975, categories: [config.adultCategory] }),
            table(4, "Hidden Table 1965", { year: 1965, isHidden: true }),
            table(5, "Table without a year"),
        ],
    });
    const showsTimeTravel = () => listRows().some(row => row.description === TEXT.timeTravelHint());

    assert.ok(showsTimeTravel(), "Guest sees three decades");
    await switchTo("Bob");
    assert.ok(!showsTimeTravel(), "Bob sees two decades: Adult Tables are hidden from a Child Profile");
    await switchTo("Alice");
    assert.ok(showsTimeTravel(), "Alice sees the Adult Table");

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
