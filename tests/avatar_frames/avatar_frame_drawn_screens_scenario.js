// ============================================================
// Avatar Frame tests' walk through the drawn screens: the Welcome Screen
// at startup, then the Profile Stats card, then the Achievement List
// header, reading on each the Avatar Frame its Avatar wears and the
// header's double gold frame. Never loaded by PinballY.
// ============================================================

import assert from "node:assert/strict";
import { WELCOME_SCREEN_OPEN_MS, press } from "../welcome_screen/welcome_screen_reader.js";
import { openProfileStats, PROFILE_STATS_OPEN_MS } from "../stats/profile_stats_reader.js";
import { WELCOME_SCREEN_Z_INDEX } from "../../common/welcome_screen_painter.js";
import { PROFILE_STATS_Z_INDEX } from "../../common/profile_stats_painter.js";
import { ACHIEVEMENT_LIST_Z_INDEX } from "../../common/achievement_list.js";
import { STEAMBALL_COLORS } from "../../common/steamball_palette.js";
import { shownFrame } from "./avatar_frame_reader.js";

// The screen's layer at that z-index, which must be shown.
function shownLayer(fake, zIndex) {
    const layer = fake.drawingLayers().find(candidate => candidate.zIndex === zIndex && candidate.alpha > 0);
    assert.ok(layer, `layer ${zIndex} shown`);
    return layer;
}

// Whether the layer draws a gold square wider than its Avatar, around it.
function hasGoldFrame(layer) {
    const avatar = layer.strokes().find(stroke => stroke.image && stroke.image.endsWith("default_avatar.png")).rect;
    return layer.strokes().some(stroke => stroke.fill === STEAMBALL_COLORS.gold && stroke.rect.x < avatar.x && stroke.rect.width > avatar.width);
}

// { welcomeScreen, profileStats, achievementList }: each the shownFrame of
// its Avatar's layer, and listGoldFrame: whether the list header keeps its
// double gold frame.
export async function walkDrawnScreens(fake) {
    const { default: lang } = await import("../../common/i18n.js");
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    const welcomeScreen = shownFrame(shownLayer(fake, WELCOME_SCREEN_Z_INDEX.header));
    press(fake, "Exit");
    fake.advanceTime(WELCOME_SCREEN_OPEN_MS);

    openProfileStats(fake, lang);
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    const profileStats = shownFrame(shownLayer(fake, PROFILE_STATS_Z_INDEX.card));
    press(fake, "Exit");

    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    fake.selectMenuItem(lang.achievementList.menuEntry);
    const mask = shownLayer(fake, ACHIEVEMENT_LIST_Z_INDEX.mask);
    return { welcomeScreen, profileStats, achievementList: shownFrame(mask), listGoldFrame: hasGoldFrame(mask) };
}
