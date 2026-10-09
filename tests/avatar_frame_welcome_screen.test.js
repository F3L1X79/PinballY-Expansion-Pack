// ============================================================
// The worn Avatar Frame on the Welcome Screen, through main.js on the
// fake PinballY globals: the Avatar wears the active Profile's frame (the
// 192 px image), a quarter of its size beyond it, inside the header and
// above the greeting, with the pip on top.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines } from "./mastery_bar_scenario.js";
import { WELCOME_SCREEN_OPEN_MS } from "./welcome_screen_reader.js";
import { WELCOME_SCREEN_Z_INDEX } from "../common/welcome_screen_painter.js";
import { shownFrame, isPipOverFrame } from "./avatar_frame_reader.js";

const ADD_ONS = ["tableMastery", "achievements", "profilePicker", "startupChoicePrompt"];
const header = fake => fake.drawingLayers().find(layer => layer.zIndex === WELCOME_SCREEN_Z_INDEX.header && layer.alpha > 0);

test("the Welcome Screen's Avatar wears the active Profile's frame, under the pip and above the greeting", async () => {
    const fake = await startScenario({
        addOns: ADD_ONS, frameImages: true, active: "Alice",
        profiles: { guest: {}, Alice: { collectionTier: 2, avatarFrame: 2 } },
    });
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);

    const layer = header(fake);
    const frame = shownFrame(layer);
    assert.deepEqual(frame && { tier: frame.tier, size: frame.size }, { tier: 2, size: 192 });
    const avatar = layer.strokes().find(stroke => stroke.image && stroke.image.endsWith("default_avatar.png")).rect;
    const margin = (avatar.width + 6) / 4;
    const box = { x: avatar.x - 3, y: avatar.y - 3, width: avatar.width + 6, height: avatar.height + 6 };
    assert.deepEqual(frame.rect, { x: box.x - margin, y: box.y - margin, width: box.width + 2 * margin, height: box.height + 2 * margin },
        "a quarter of the Avatar's size beyond it on every side");
    assert.ok(frame.rect.x >= 0 && frame.rect.y >= 0, "inside the header");
    const greeting = layer.strokes().find(stroke => "text" in stroke && stroke.text.includes("Alice"));
    assert.ok(greeting.rect.y >= frame.rect.y + frame.rect.height, "the greeting under the frame");
    assert.ok(isPipOverFrame(layer), "the pip drawn after the frame");
    assert.deepEqual(errorLines(fake), []);
});
