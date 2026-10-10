// ============================================================
// The worn Avatar Frame on the Profile Greeting, through main.js on the
// fake PinballY globals: the greeted Avatar wears it, inside the gold
// ring, and the greeting text sits under the frame.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines } from "../mastery/mastery_bar_scenario.js";
import { shownFrame } from "./avatar_frame_reader.js";

const PICKER_Z = 6500;
const AVATAR_Z = 6501;
// Past the pause before the greeting and the Avatar's growth, while it holds.
const GROWN_MS = 900;

const shown = (fake, zIndex) => fake.drawingLayers().filter(layer => layer.zIndex === zIndex && layer.alpha > 0);

test("the greeted Avatar wears its frame, the greeting under it", async () => {
    const fake = await startScenario({
        addOns: ["tableMastery", "profilePicker"], frameImages: true, active: "Alice",
        profiles: { guest: {}, Alice: { collectionTier: 1, avatarFrame: 1 } },
    });
    fake.advanceTime(GROWN_MS);

    const [avatar] = shown(fake, AVATAR_Z);
    assert.deepEqual(shownFrame(avatar) && { tier: shownFrame(avatar).tier, size: shownFrame(avatar).size }, { tier: 1, size: 384 });

    const back = shown(fake, PICKER_Z)[0];
    const { width, height } = back.canvasSize();
    const side = avatar.scale().ySpan * height;
    const bottom = (0.5 - avatar.position().y) * height + side / 2;
    const greeting = back.strokes().find(stroke => "text" in stroke && stroke.text.includes("Alice"));
    assert.ok(width > 0 && greeting.rect.y >= bottom, "the greeting under the frame");
    assert.deepEqual(errorLines(fake), []);
});
