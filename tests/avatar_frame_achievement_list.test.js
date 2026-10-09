// ============================================================
// The worn Avatar Frame in the Achievement List header, through main.js on
// the fake PinballY globals: the header's Avatar wears it (the 192 px
// image) instead of its double gold frame, a quarter of its size beyond
// it, inside the header and left of its texts; the Unlock Rate Avatars of
// the other Profiles wearing a frame stay plain. A frame chosen in the
// Profile Stats shows at the list's next opening.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startScenario, errorLines, DRAWN_AHEAD_MS } from "./mastery_bar_scenario.js";
import { ACHIEVEMENT_LIST_Z_INDEX } from "../common/achievement_list.js";
import { LIST_LOOK } from "../common/achievement_list_painter.js";
import { STEAMBALL_COLORS } from "../common/steamball_palette.js";
import { readRows, pressAndGlide } from "./achievement_list_reader.js";
import { openProfileStats, choose, pickRow, press, PROFILE_STATS_OPEN_MS } from "./profile_stats_reader.js";
import { shownFrame } from "./avatar_frame_reader.js";

const NOTIFIED = ["collectionMilestone:firstTable"];

test("the header wears the frame instead of its gold frame, a new choice included; the Unlock Rate Avatars stay plain", async () => {
    const fake = await startScenario({
        addOns: ["tableMastery", "achievements", "customMenuCommands", "profilePicker"], frameImages: true,
        profiles: { guest: { collectionTier: 2, avatarFrame: 2, notified: NOTIFIED }, Alice: { collectionTier: 1, avatarFrame: 1, notified: NOTIFIED },
            Bob: { collectionTier: 1, avatarFrame: 1, notified: NOTIFIED } },
    });
    fake.advanceTime(DRAWN_AHEAD_MS);
    const { default: lang } = await import("../common/i18n.js");
    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    fake.selectMenuItem(lang.achievementList.menuEntry);

    const mask = fake.drawingLayers().find(layer => layer.zIndex === ACHIEVEMENT_LIST_Z_INDEX.mask && layer.alpha > 0);
    const frame = shownFrame(mask);
    assert.deepEqual(frame && { tier: frame.tier, size: frame.size }, { tier: 2, size: 192 });
    const avatar = mask.strokes().find(stroke => stroke.image && stroke.image.endsWith("default_avatar.png")).rect;
    const margin = avatar.width / 4;
    assert.deepEqual(frame.rect, { x: avatar.x - margin, y: avatar.y - margin, width: avatar.width + 2 * margin, height: avatar.height + 2 * margin },
        "a quarter of the Avatar's size beyond it on every side");
    assert.ok(!mask.strokes().some(stroke => stroke.fill === STEAMBALL_COLORS.gold && stroke.rect.x < avatar.x && stroke.rect.width > avatar.width),
        "no double gold frame");

    const { width, height } = mask.canvasSize();
    const panel = { x: Math.round((width - Math.round(width * LIST_LOOK.panelRatio)) / 2), y: Math.round((height - Math.round(height * LIST_LOOK.panelRatio)) / 2) };
    assert.ok(frame.rect.x >= panel.x && frame.rect.y >= panel.y && frame.rect.y + frame.rect.height <= panel.y + LIST_LOOK.headerHeight, "inside the header");
    const headerTexts = mask.strokes().filter(stroke => "text" in stroke && stroke.rect.y < panel.y + LIST_LOOK.headerHeight);
    assert.ok(headerTexts.length > 0 && headerTexts.every(stroke => stroke.rect.x >= frame.rect.x + frame.rect.width), "the texts right of the frame");

    const firstTable = readRows(fake, lang.achievementList).find(row => row.owners.avatars.length > 0);
    assert.ok(firstTable, "Alice and Bob show in an Unlock Rate");
    const framedLayers = fake.drawingLayers().filter(layer => layer.zIndex !== ACHIEVEMENT_LIST_Z_INDEX.mask && shownFrame(layer) !== null
        && Object.values(ACHIEVEMENT_LIST_Z_INDEX).includes(layer.zIndex));
    assert.deepEqual(framedLayers, [], "no frame in the Unlock Rate");

    pressAndGlide(fake, "Exit");
    openProfileStats(fake, lang);
    choose(fake, "Frame");
    pickRow(fake, "Enchanted Forest");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    press(fake, "Exit");
    fake.advanceTime(DRAWN_AHEAD_MS);
    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    fake.selectMenuItem(lang.achievementList.menuEntry);
    const reopened = shownFrame(fake.drawingLayers().find(layer => layer.zIndex === ACHIEVEMENT_LIST_Z_INDEX.mask && layer.alpha > 0));
    assert.equal(reopened && reopened.tier, 1, "the new choice in the header");
    assert.deepEqual(errorLines(fake), []);
});
