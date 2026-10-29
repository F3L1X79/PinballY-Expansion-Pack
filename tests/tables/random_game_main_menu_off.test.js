// ============================================================
// Random Game Add-on off: the main menu has no "Launch a random table" entry,
// while the Welcome Screen keeps its own.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/core/config.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { installVpxtool } from "../support/vpxtool.js";

const TABLES = [{ id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness" }];

test("with the Random Game Add-on off, the main menu has no random table entry", async () => {
    const fake = createFakePinballYHost({ tables: TABLES });
    // A table in the wheel selection, which would show the entry.
    fake.setWheelTables(TABLES.map(table => table.configId));
    installVpxtool(fake);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    config.addOns.randomGame = false;
    // The main menu read as a native one.
    config.addOns.drawnMenus = false;
    config.language = "en";

    const { default: lang } = await import("../../common/core/i18n.js");
    await import("../../main.js");
    await settle();

    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    const titles = fake.currentMenu().items.map(item => item.title);
    assert.ok(titles.includes(lang.welcomeScreen.menuEntry), "the main menu shows the pack's entries");
    assert.ok(!titles.includes(lang.customMenuLabels.randomTable));
    assertNoErrorLogged(fake);
});
