// ============================================================
// Level pip on the Profile badge, through main.js on the fake PinballY
// globals: the active Profile's Player Level drawn at the Avatar's corner,
// Guest included; after a Play crossing a level, the old level until the
// Level Toast starts; the new Profile's level right after a switch; level
// 1 after a Profile Reset; a level drop shown only at the next switch.
// No pip on the Profile picker's carousel.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, levelToasts, play, errorLines, TABLES, MINUTE, ALL_TOASTS_MS, pickLastTables } from "./mastery_bar_scenario.js";
import { shownPip } from "./level_pip_reader.js";
import config from "../common/config.js";

const [FIRST] = TABLES;
const BADGE_Z = 4500;
// The carousel's background, Avatars, gold frame and names.
const CAROUSEL_Z = [6500, 6501, 6502];
const badgePip = fake => shownPip(fake.drawingLayers().find(layer => layer.zIndex === BADGE_Z));

test("the badge's pip follows the Level Toast, switches and Profile Resets", async () => {
    pickLastTables();
    // A Platinum Challenge Achievement: 100 points, level 2.
    const fake = await startScenario({
        addOns: ["achievements", "challenges", "profilePicker"],
        profiles: { guest: {}, Alice: { notified: ["challengesCompleted:100"] } },
    });
    fake.advanceTime(ALL_TOASTS_MS);
    assert.equal(badgePip(fake), "1", "Guest's level at startup");

    // First table, Williams, 10% and 25% of the collection: 70 points, level 2.
    await play(fake, FIRST, 10 * MINUTE);
    for (let step = 0; step < ALL_TOASTS_MS / 100 && levelToasts(fake).length === 0; step++) {
        assert.equal(badgePip(fake), "1", "the old level until the Level Toast starts");
        fake.advanceTime(100);
    }
    assert.equal(levelToasts(fake).length, 1);
    assert.equal(badgePip(fake), "2", "the new level as the Level Toast starts");
    fake.advanceTime(ALL_TOASTS_MS);

    const { getProfileStore } = await import("../common/profile_store.js");
    const store = getProfileStore();
    store.resetProfile("guest");
    assert.equal(badgePip(fake), "1", "back to 1 after a Profile Reset");

    store.switchTo("Alice");
    assert.equal(badgePip(fake), "2", "Alice's level right after the switch");

    // Alice's Platinum is gone: her level drops, never announced, shown at
    // the next switch only.
    config.addOns.challenges = false;
    fake.advanceTime(ALL_TOASTS_MS);
    assert.equal(badgePip(fake), "2", "the drop isn't shown before a switch");
    store.switchTo("guest");
    store.switchTo("Alice");
    fake.advanceTime(ALL_TOASTS_MS);
    assert.equal(badgePip(fake), "1", "the drop shows at the next switch");
    assert.equal(levelToasts(fake).length, 1, "nothing announced");

    const { default: lang } = await import("../common/i18n.js");
    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    fake.selectMenuItem(lang.profiles.menuEntry);
    const carousel = fake.drawingLayers().filter(layer => CAROUSEL_Z.includes(layer.zIndex) && layer.alpha > 0);
    assert.ok(carousel.length > 0, "the carousel is open");
    assert.ok(carousel.every(layer => shownPip(layer) === null), "no pip on the carousel");

    assert.deepEqual(errorLines(fake), []);
});
