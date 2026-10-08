// ============================================================
// Level pip on the Welcome Screen's Avatar, through main.js on the fake
// PinballY globals: the active Profile's shown Player Level when the
// screen is drawn, at startup and after a switch, Guest included; the
// greeting stays without it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "./fake_pinbally_host.js";
import { startScenario, errorLines } from "./mastery_bar_scenario.js";
import { WELCOME_SCREEN_OPEN_MS, press, greeting, headerPip } from "./welcome_screen_reader.js";

test("the Welcome Screen's Avatar carries the active Profile's level", async () => {
    // A Platinum Challenge Achievement: 100 points, level 2.
    const fake = await startScenario({
        addOns: ["achievements", "challenges", "profilePicker", "startupChoicePrompt"],
        profiles: { guest: {}, Alice: { notified: ["challengesCompleted:100"] } },
        active: "Alice",
    });
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(headerPip(fake), "2", "Alice's level at startup");
    assert.match(greeting(fake), /Alice/, "the greeting without the pip's number");
    assert.doesNotMatch(greeting(fake), /2/);
    press(fake, "Exit");
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);

    const { getProfileStore } = await import("../common/profile_store.js");
    getProfileStore().switchTo("guest");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    assert.equal(headerPip(fake), "1", "Guest's level after the switch");

    assert.deepEqual(errorLines(fake), []);
});
