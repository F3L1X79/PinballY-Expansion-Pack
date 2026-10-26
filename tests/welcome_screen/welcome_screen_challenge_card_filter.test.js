// ============================================================
// Welcome Screen Challenge Table card launched while the wheel's filter
// leaves the table out: the wheel goes back to All Tables, and the table is
// selected on it before it starts.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { choose, press, openFromMainMenu } from "./welcome_screen_reader.js";
import { startWithChallenge, DAY_TABLE, WEEK_TABLE, STERN_C } from "./challenge_card_scenario.js";

test("a Challenge Table outside the current filter is launched from All Tables, selected on the wheel", async t => {
    t.mock.method(Math, "random", () => 0.99);
    const fake = await startWithChallenge();
    const { default: lang } = await import("../../common/core/i18n.js");
    press(fake, "Exit");
    await settle();
    fake.setWheelTables([DAY_TABLE.configId, WEEK_TABLE.configId], { filterId: "Manufacturer.Williams" });
    await openFromMainMenu(fake, lang.welcomeScreen.menuEntry);

    choose(fake, "A CHALLENGE TABLE");
    await settle();
    assert.deepEqual(fake.launches().map(game => game.configId), [STERN_C.configId]);
    assert.equal(fake.currentFilterId(), "All");
    assert.equal(fake.getCurrentTable().configId, STERN_C.configId);
    assertNoErrorLogged(fake);
});
