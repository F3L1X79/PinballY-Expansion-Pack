// ============================================================
// The worn Avatar Frames in the Household Stats, through main.js on the
// fake PinballY globals: each column header draws its Profile's worn
// frame around the Avatar (the 192 px image, a quarter of the Avatar's
// size beyond it, inside the column, no Player Level pip), none when it
// wears none.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold, errorLines, DEFAULT_AVATAR } from "../stats/household_stats_scenario.js";
import { openHouseholdStats, columns } from "../stats/household_stats_reader.js";
import { HOUSEHOLD_STATS_Z_INDEX } from "../../common/stats/household_stats_painter.js";
import { shownFrame } from "./avatar_frame_reader.js";
import { pipColor } from "../levels/level_pip_reader.js";
import { shownLayers } from "../support/shown_layers.js";

const HOUSEHOLD = {
    Alice: { collectionTier: 3, avatarFrame: 2 },
    Bob: { collectionTier: 4, avatarFrame: 4 },
    Carol: { collectionTier: 2, avatarFrame: null },
};

const shownColumnLayers = fake => shownLayers(fake, HOUSEHOLD_STATS_Z_INDEX.columns)
    .sort((a, b) => a.position().x - b.position().x);

test("each column header wears its Profile's frame around the Avatar, without a pip", async () => {
    const { fake, lang } = await startHousehold({ profiles: HOUSEHOLD, active: "Alice", frameImages: true });
    openHouseholdStats(fake, lang);

    assert.deepEqual(columns(fake).map(({ name, avatar, frame }) => ({ name, avatar, frame: frame && { tier: frame.tier, size: frame.size } })), [
        { name: "Alice", avatar: DEFAULT_AVATAR, frame: { tier: 2, size: 192 } },
        { name: "Bob", avatar: DEFAULT_AVATAR, frame: { tier: 4, size: 192 } },
        { name: "Carol", avatar: DEFAULT_AVATAR, frame: null },
    ]);

    const layer = shownColumnLayers(fake)[0];
    const avatar = layer.strokes().find(stroke => stroke.image === DEFAULT_AVATAR).rect;
    const box = { x: avatar.x - 3, y: avatar.y - 3, width: avatar.width + 6, height: avatar.height + 6 };
    const margin = box.width / 4;
    const { rect } = shownFrame(layer);
    assert.deepEqual(rect, { x: box.x - margin, y: box.y - margin, width: box.width + 2 * margin, height: box.height + 2 * margin },
        "a quarter of the Avatar's size beyond it on every side");
    const canvas = layer.canvasSize();
    assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= canvas.width, "inside the column");
    const name = layer.strokes().find(stroke => "text" in stroke && stroke.text === "Alice");
    assert.ok(name.rect.y >= rect.y + rect.height, "the name under the frame");
    assert.ok(shownColumnLayers(fake).every(column => pipColor(column) === null), "no Player Level pip");
    assert.deepEqual(errorLines(fake), []);
});
