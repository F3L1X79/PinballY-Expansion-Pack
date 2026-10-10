// ============================================================
// With both Add-ons that offer a Random Game (main menu commands, startup
// prompt) disabled, no Random Game can be launched: the Achievement List,
// started through main.js on the fake PinballY globals, shows no Random
// Game Achievement.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";
import { readRows } from "../achievements/achievement_list_reader.js";

const TABLE = {
    id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", manufacturer: "Williams",
    year: 1997, categories: [], playCount: 0, playTime: 0, lastPlayed: null, rating: -1, isHidden: false,
};

test("no Random Game Achievement when neither the main menu commands nor the startup prompt are enabled", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 10, 0, 0), tables: [TABLE] });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = key === "achievements";
    }
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    const TEXT = lang.achievementList;
    await import("../../main.js");
    await settle();

    fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
    fake.selectMenuItem(TEXT.menuEntry);
    const titles = readRows(fake, TEXT).map(row => row.title);

    assert.ok(titles.length > 0, "the Achievements are shown");
    const randomGameTitles = Object.values(lang.achievements.randomGamesTitles);
    assert.deepEqual(titles.filter(title => randomGameTitles.includes(title)), []);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
