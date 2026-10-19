// ============================================================
// Avatar Frame list opening scenario: main.js on the fake globals, Guest at
// Collection Tier 3 wearing a frame. The Profile Stats open with instant
// draws, then each draw takes drawMs while the Frame button opens the list.
// Never loaded by PinballY.
// ============================================================

import { startScenario } from "../mastery/mastery_bar_scenario.js";
import { AVATAR_FRAME_LIST_Z_INDEX } from "../../common/avatar_frames/avatar_frame_list_painter.js";
import { DIMMED_WHEEL } from "../../common/drawing/steamball_drawing.js";
import { openProfileStats, choose } from "../stats/profile_stats_reader.js";

export const WORN_FRAME = "Steam and Gears";

// The veil the list's opening dims the wheel with, as readVeil() reads it.
export const FRAME_LIST_VEIL = { shown: true, zIndex: AVATAR_FRAME_LIST_Z_INDEX.backdrop - 2, color: DIMMED_WHEEL };

export async function startPack() {
    const fake = await startScenario({
        addOns: ["tableMastery", "achievements", "customMenuCommands"], frameImages: true,
        profiles: { guest: { collectionTier: 3, avatarFrame: 2 } },
    });
    const { default: lang } = await import("../../common/core/i18n.js");
    return { fake, lang };
}

// Opens the Profile Stats and presses their Frame button, each layer draw
// then taking drawMs: the clock does not run once the button is pressed.
export function startOpeningFrameList(fake, lang, { drawMs }) {
    fake.setDrawMs(0);
    openProfileStats(fake, lang);
    fake.setDrawMs(drawMs);
    choose(fake, lang.profileStats.buttons.frame);
}
