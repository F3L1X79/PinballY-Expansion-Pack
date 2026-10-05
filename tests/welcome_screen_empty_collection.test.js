// ============================================================
// Welcome Screen with an empty collection, through main.js on the fake
// PinballY globals: there is no Period Table, so the screen opens with no
// card and the selection skips straight from the cross to the bottom row;
// Collection Mastery still aims at ten tables, at tier 0.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import config from "../common/config.js";
import { WELCOME_SCREEN_OPEN_MS, isWelcomeScreenOpen, periodCards, collectionCard, readChoices } from "./welcome_screen_reader.js";

test("with no table at all, the Welcome Screen opens with no Period Table card", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 10, 0, 0), tables: [] });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["startupChoicePrompt", "profilePicker"].includes(key);
    config.language = "en";

    const { default: lang } = await import("../common/i18n.js");
    const TEXT = lang.welcomeScreen;
    await import("../main.js");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);

    assert.equal(isWelcomeScreenOpen(fake), true);
    assert.deepEqual(periodCards(fake), []);
    const COLLECTION = TEXT.collection;
    assert.deepEqual(collectionCard(fake), { goal: COLLECTION.goal(10, lang.tableMastery.levelNames[0]), current: COLLECTION.current(0, 10), tier: 0 });
    assert.deepEqual(readChoices(fake), [lang.profiles.menuEntry, TEXT.closeTooltip, TEXT.stayOnWheel, TEXT.randomTable]);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
