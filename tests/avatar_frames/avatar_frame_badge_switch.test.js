// ============================================================
// The Profile badge after a switch, through main.js on the fake PinballY
// globals: the new Profile's worn Avatar Frame, or none; none either
// after a Profile Reset.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines, DRAWN_AHEAD_MS } from "../mastery/mastery_bar_scenario.js";
import { shownFrame } from "./avatar_frame_reader.js";

const BADGE_Z = 4500;
const ADD_ONS = ["tableMastery", "achievements", "profilePicker"];
const badge = fake => fake.drawingLayers().find(layer => layer.zIndex === BADGE_Z);
const badgeFrame = fake => {
    const frame = shownFrame(badge(fake));
    return frame && { tier: frame.tier, size: frame.size };
};

test("a switch shows the new Profile's frame, or none, and a Profile Reset takes it off", async () => {
    const fake = await startScenario({
        addOns: ADD_ONS, frameImages: true,
        profiles: { guest: { collectionTier: 3, avatarFrame: 3 }, Alice: { collectionTier: 1, avatarFrame: 1 }, Bob: { collectionTier: 2, avatarFrame: null } },
    });
    fake.advanceTime(DRAWN_AHEAD_MS);
    assert.deepEqual(badgeFrame(fake), { tier: 3, size: 192 });

    const { getProfileStore } = await import("../../common/profile_store.js");
    getProfileStore().switchTo("Alice");
    assert.deepEqual(badgeFrame(fake), { tier: 1, size: 192 });
    getProfileStore().switchTo("Bob");
    assert.equal(badgeFrame(fake), null, "None stays none");

    getProfileStore().switchTo("guest");
    getProfileStore().resetProfile("guest");
    assert.equal(badgeFrame(fake), null, "a Profile Reset takes the frame off");
    assert.deepEqual(errorLines(fake), []);
});
