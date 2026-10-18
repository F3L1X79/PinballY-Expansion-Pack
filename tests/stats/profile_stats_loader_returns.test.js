// ============================================================
// Coming back to the Profile Stats, through main.js on the fake PinballY
// globals, with slow draws: Exit from the Achievement List, the Household
// Stats and the Avatar Frame list, and choosing the frame already worn,
// show them again at once, fully opaque, on the button they were left
// from, with no veil, no Loader and no opening time line; only equipping
// another frame dims the wheel under the veil, turns the Loader after
// 150 ms, then fades them in with the new frame on the card.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold } from "./household_stats_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { readVeil } from "../support/opening_reader.js";
import { readLoader } from "../support/loader_reader.js";
import { PROFILE_STATS_Z_INDEX } from "../../common/stats/profile_stats_painter.js";
import { isListOpen } from "../achievements/achievement_list_reader.js";
import {
    openProfileStats, untilProfileStatsFadedIn, isProfileStatsOpen, isFrameListOpen, highlighted, choose, pickRow, press, markerLayer, PROFILE_STATS_OPEN_MS,
} from "./profile_stats_reader.js";
import { untilHouseholdStatsFadedIn } from "./household_stats_reader.js";
import { shownFrame } from "../avatar_frames/avatar_frame_reader.js";

const DRAW_MS = 60;

const profileStatsLayers = fake => fake.drawingLayers().filter(layer => Object.values(PROFILE_STATS_Z_INDEX).includes(layer.zIndex));
const openingLinesSince = (fake, mark) => fake.logLines().slice(mark).filter(line => line.startsWith("[ProfileStats] Opened"));

const cardFrameTier = fake => {
    const card = fake.drawingLayers().find(layer => layer.zIndex === PROFILE_STATS_Z_INDEX.card && layer.alpha > 0);
    const frame = shownFrame(card);
    return frame && frame.tier;
};

// leave() on the screen on show (Exit by default), with slow draws: the
// Profile Stats show again in the same step, every layer either fully in
// or kept hidden.
function showsAtOnce(fake, label, leave = () => press(fake, "Exit")) {
    fake.setDrawMs(DRAW_MS);
    const mark = fake.logLines().length;
    leave();
    assert.equal(isProfileStatsOpen(fake), true, "shown in the same step");
    assert.deepEqual(readVeil(fake), { shown: false }, "no veil");
    assert.deepEqual(readLoader(fake), { shown: false }, "no Loader");
    assert.ok(profileStatsLayers(fake).every(layer => layer.alpha === 0 || layer.alpha === 1), "no fade");
    assert.equal(markerLayer(fake).alpha, 1);
    assert.equal(highlighted(fake), label);
    fake.advanceTime(160);
    assert.deepEqual(readLoader(fake), { shown: false }, "still no Loader");
    assert.deepEqual(openingLinesSince(fake, mark), [], "no opening time line");
    fake.setDrawMs(0);
}

// leave() on the Avatar Frame list, with slow draws: the Profile Stats get
// ready again behind the veil and the Loader, then fade in on label.
function opensAgain(fake, label, leave) {
    fake.setDrawMs(DRAW_MS);
    leave();
    assert.equal(readVeil(fake).zIndex, PROFILE_STATS_Z_INDEX.backdrop - 2, "the wheel dimmed at once");
    assert.equal(isProfileStatsOpen(fake), false);
    fake.advanceTime(160);
    assert.equal(readLoader(fake).shown, true, "the Loader after 150 ms");
    untilProfileStatsFadedIn(fake);
    assert.deepEqual(readLoader(fake), { shown: false });
    assert.deepEqual(readVeil(fake), { shown: false });
    assert.equal(highlighted(fake), label);
    fake.setDrawMs(0);
}

test("back at once from every child, unless another Avatar Frame was equipped", async () => {
    // Without the Challenges, whose banner redraws as the main menu closes.
    const { fake, lang } = await startHousehold({
        profiles: { Alice: { collectionTier: 3, avatarFrame: 3 }, Bob: {} }, active: "Alice", addOns: ["achievements", "tableMastery"], frameImages: true,
    });
    const { buttons } = lang.profileStats;
    const [enchantedForest, , arcadeNeon] = lang.profileRewards.frameNames;
    const openFrameList = () => {
        choose(fake, buttons.frame);
        fake.advanceTime(PROFILE_STATS_OPEN_MS);
        assert.ok(isFrameListOpen(fake));
    };
    openProfileStats(fake, lang);

    choose(fake, buttons.achievements);
    assert.ok(isListOpen(fake));
    showsAtOnce(fake, buttons.achievements);

    choose(fake, buttons.household);
    untilHouseholdStatsFadedIn(fake);
    showsAtOnce(fake, buttons.household);

    openFrameList();
    showsAtOnce(fake, buttons.frame);

    openFrameList();
    showsAtOnce(fake, buttons.frame, () => pickRow(fake, arcadeNeon));
    assert.equal(cardFrameTier(fake), 3, "the frame already worn");

    openFrameList();
    opensAgain(fake, buttons.frame, () => pickRow(fake, enchantedForest));
    assert.equal(cardFrameTier(fake), 1, "the new frame on the card");
    assertNoErrorLogged(fake);
});
