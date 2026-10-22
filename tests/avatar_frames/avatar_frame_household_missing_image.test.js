// ============================================================
// Avatar Frame images missing from the install, through main.js on the
// fake PinballY globals: each is logged, and the Household Stats and
// another Profile's read-only Profile Stats still open, showing the plain
// Avatars.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold, errorLines, DEFAULT_AVATAR } from "../stats/household_stats_scenario.js";
import { openHouseholdStats, columns, chooseColumn, isHouseholdStatsOpen } from "../stats/household_stats_reader.js";
import { cardImages, PROFILE_STATS_OPEN_MS } from "../stats/profile_stats_reader.js";
import { PROFILE_STATS_Z_INDEX } from "../../common/stats/profile_stats_painter.js";
import { AVATAR_FRAMES_FOLDER } from "../mastery/mastery_bar_scenario.js";
import { shownLayers } from "../support/shown_layers.js";

const HOUSEHOLD = {
    Alice: { collectionTier: 3, avatarFrame: 2 },
    Bob: { collectionTier: 4, avatarFrame: 4 },
    Carol: { collectionTier: 2, avatarFrame: null },
};

const card = fake => shownLayers(fake, PROFILE_STATS_Z_INDEX.card)[0];

test("a missing frame image is logged and the Household Stats and read-only card still open", async () => {
    const { fake, lang } = await startHousehold({ profiles: HOUSEHOLD, active: "Alice" });
    openHouseholdStats(fake, lang);

    assert.ok(isHouseholdStatsOpen(fake));
    assert.deepEqual(columns(fake).map(({ avatar, frame }) => ({ avatar, frame })), [
        { avatar: DEFAULT_AVATAR, frame: null },
        { avatar: DEFAULT_AVATAR, frame: null },
        { avatar: DEFAULT_AVATAR, frame: null },
    ]);
    for (const tier of ["02", "04"]) {
        const missing = `${AVATAR_FRAMES_FOLDER}\\frame_${tier}_192.png`;
        assert.ok(fake.logLines().some(line => line.includes("not found") && line.includes(missing)), `frame ${tier} logged`);
    }

    chooseColumn(fake, "Bob");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.deepEqual(cardImages(fake), [DEFAULT_AVATAR], "Bob's card shows his plain Avatar");
    assert.ok(fake.logLines().some(line => line.includes("not found") && line.includes(`${AVATAR_FRAMES_FOLDER}\\frame_04_384.png`)));
    assert.deepEqual(errorLines(fake), []);
});
