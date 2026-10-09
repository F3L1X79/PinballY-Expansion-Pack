// ============================================================
// The worn Avatar Frame on the Profile Stats card, through main.js on the
// fake PinballY globals: the card's Avatar wears it (the 384 px image), a
// quarter of its size beyond it, inside the card and above the name, and
// a frame picked in the frame list shows as soon as the card is back.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines, DRAWN_AHEAD_MS } from "./mastery_bar_scenario.js";
import { openProfileStats, choose, pickRow, PROFILE_STATS_OPEN_MS } from "./profile_stats_reader.js";
import { PROFILE_STATS_Z_INDEX } from "../common/profile_stats_painter.js";
import { shownFrame } from "./avatar_frame_reader.js";

const card = fake => fake.drawingLayers().find(layer => layer.zIndex === PROFILE_STATS_Z_INDEX.card && layer.alpha > 0);
const cardFrame = fake => {
    const frame = shownFrame(card(fake));
    return frame && { tier: frame.tier, size: frame.size };
};

test("the Profile Stats card wears the frame, and a new choice once back from the list", async () => {
    const fake = await startScenario({
        addOns: ["tableMastery", "achievements", "customMenuCommands"], frameImages: true,
        profiles: { guest: { collectionTier: 3, avatarFrame: 3 } },
    });
    fake.advanceTime(DRAWN_AHEAD_MS);
    const { default: lang } = await import("../common/i18n.js");
    openProfileStats(fake, lang);
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.deepEqual(cardFrame(fake), { tier: 3, size: 384 });

    const layer = card(fake);
    const avatar = layer.strokes().find(stroke => stroke.image && stroke.image.endsWith("default_avatar.png")).rect;
    const box = { x: avatar.x - 3, y: avatar.y - 3, width: avatar.width + 6, height: avatar.height + 6 };
    const margin = box.width / 4;
    const { rect } = shownFrame(layer);
    assert.deepEqual(rect, { x: box.x - margin, y: box.y - margin, width: box.width + 2 * margin, height: box.height + 2 * margin },
        "a quarter of the Avatar's size beyond it on every side");
    const canvas = layer.canvasSize();
    assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= canvas.width, "inside the card");
    const name = layer.strokes().find(stroke => "text" in stroke && stroke.text === "Guest");
    assert.ok(name.rect.y >= rect.y + rect.height, "the name under the frame");

    choose(fake, "Frame");
    pickRow(fake, "Enchanted Forest");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.deepEqual(cardFrame(fake), { tier: 1, size: 384 });
    assert.deepEqual(errorLines(fake), []);
});
