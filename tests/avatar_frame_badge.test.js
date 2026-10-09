// ============================================================
// The worn Avatar Frame on the Profile badge, through main.js on the fake
// PinballY globals: none until the player equips one in the Profile
// Stats, then the 192 px image around the Avatar, a quarter of its size
// beyond it, inside the badge and above the name, with the pip on top.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines, DRAWN_AHEAD_MS } from "./mastery_bar_scenario.js";
import { openProfileStats, choose, pickRow, press, PROFILE_STATS_OPEN_MS } from "./profile_stats_reader.js";
import { shownFrame, isPipOverFrame } from "./avatar_frame_reader.js";
import { shownPip } from "./level_pip_reader.js";

const BADGE_Z = 4500;
const ADD_ONS = ["tableMastery", "achievements", "customMenuCommands", "profilePicker"];
const badge = fake => fake.drawingLayers().find(layer => layer.zIndex === BADGE_Z);
const badgeFrame = fake => {
    const frame = shownFrame(badge(fake));
    return frame && { tier: frame.tier, size: frame.size };
};

test("the badge wears the frame the player equips, above the name and under the pip", async () => {
    const fake = await startScenario({ addOns: ADD_ONS, frameImages: true, profiles: { guest: { collectionTier: 2 } } });
    fake.advanceTime(DRAWN_AHEAD_MS);
    assert.equal(badgeFrame(fake), null, "nothing worn before the player equips a frame");

    const { default: lang } = await import("../common/i18n.js");
    openProfileStats(fake, lang);
    choose(fake, "Frame");
    pickRow(fake, "Steam and Gears");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    press(fake, "Exit");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.deepEqual(badgeFrame(fake), { tier: 2, size: 192 });

    const layer = badge(fake);
    const avatar = layer.strokes().find(stroke => stroke.image && stroke.image.endsWith("default_avatar.png")).rect;
    const { rect } = shownFrame(layer);
    const margin = avatar.width / 4;
    assert.deepEqual(rect, { x: avatar.x - margin, y: avatar.y - margin, width: avatar.width + 2 * margin, height: avatar.height + 2 * margin },
        "a quarter of the Avatar's size beyond it on every side");
    const canvas = layer.canvasSize();
    assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= canvas.width && rect.y + rect.height <= canvas.height, "inside the badge");
    const name = layer.strokes().filter(stroke => "text" in stroke && !/^\d+$/.test(stroke.text));
    assert.ok(name.length > 0 && name.every(stroke => stroke.rect.y >= rect.y + rect.height), "the name under the frame");
    assert.equal(shownPip(layer), "1");
    assert.ok(isPipOverFrame(layer), "the pip drawn after the frame");
    assert.deepEqual(errorLines(fake), []);
});
