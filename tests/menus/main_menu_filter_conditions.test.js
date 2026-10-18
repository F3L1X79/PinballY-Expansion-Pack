// ============================================================
// Main menu module tests: a [Top] script filter given a condition has its
// entry in the main menu only while the condition holds, checked at each
// opening; a failing condition is logged and leaves its entry shown. The
// filters without a condition, PinballY's own and "Filter Tables" are
// unchanged, and a left-out filter keeps working while it is current.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import { createMainMenu } from "../../common/menus/main_menu.js";
import { mainMenuSection } from "../support/main_menu_reader.js";
import { errorLines } from "../support/error_log.js";
import lang from "../../common/core/i18n.js";

const TABLES = [
    { id: 1, configId: "mm", title: "Medieval Madness" },
    { id: 2, configId: "tz", title: "Twilight Zone" },
];

function setUp() {
    const fake = createFakePinballYHost({ tables: TABLES });
    // safeHandler logs through PinballY's logfile.
    fake.installGlobals();
    const mainMenu = createMainMenu(fake);
    const topFilter = (id, title, sortKey) =>
        fake.createFilter({ id, title, group: "[Top]", sortKey, select: game => game.configId === "mm" });
    topFilter("test.Shy", "Shy", "4000");
    topFilter("test.Plain", "Plain", "5000");
    return { fake, mainMenu };
}

test("a filter's entry is left out while its condition is false, checked at each opening", () => {
    const { fake, mainMenu } = setUp();
    let shown = false;
    mainMenu.showFilterWhen("User.test.Shy", () => shown);

    assert.deepEqual(mainMenuSection(fake, "All Tables"), ["All Tables", "Plain", "Favorites"]);

    shown = true;
    assert.deepEqual(mainMenuSection(fake, "All Tables"), ["All Tables", "Shy", "Plain", "Favorites"]);
    assert.equal(errorLines(fake).length, 0);
});

test("a failing condition is logged and leaves its entry shown, the rest of the menu unchanged", () => {
    const { fake, mainMenu } = setUp();
    mainMenu.showFilterWhen("User.test.Shy", () => { throw new Error("broken"); });

    assert.deepEqual(mainMenuSection(fake, "All Tables"), ["All Tables", "Shy", "Plain", "Favorites"]);
    assert.equal(errorLines(fake).length, 1);
    assert.match(errorLines(fake)[0], /broken/);
    assert.deepEqual(mainMenuSection(fake, lang.customMenuLabels.filterTables), [lang.customMenuLabels.filterTables]);
});

test("a filter whose entry is left out keeps working while it is current", () => {
    const { fake, mainMenu } = setUp();
    mainMenu.showFilterWhen("User.test.Shy", () => false);
    fake.selectFilter("User.test.Shy");

    assert.equal(mainMenuSection(fake, "Shy"), null);
    fake.fire("wheelmode");

    assert.equal(fake.currentFilterId(), "User.test.Shy");
    assert.deepEqual(fake.getWheelTables().map(game => game.title), ["Medieval Madness"]);
});
