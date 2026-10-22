// ============================================================
// The worn Avatar Frame on another Profile's read-only Profile Stats,
// through main.js on the fake PinballY globals: the card wears that
// Profile's frame, not the active Profile's, and none when it wears none.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHousehold, errorLines } from "../stats/household_stats_scenario.js";
import { PROFILE_STATS_OPEN_MS } from "../stats/profile_stats_reader.js";
import { openHouseholdStats, chooseColumn } from "../stats/household_stats_reader.js";
import { PROFILE_STATS_Z_INDEX } from "../../common/stats/profile_stats_painter.js";
import { shownFrame } from "./avatar_frame_reader.js";
import { shownLayers } from "../support/shown_layers.js";

const HOUSEHOLD = {
    Alice: { collectionTier: 3, avatarFrame: 2 },
    Bob: { collectionTier: 4, avatarFrame: 4 },
    Carol: { collectionTier: 2, avatarFrame: null },
};

const card = fake => shownLayers(fake, PROFILE_STATS_Z_INDEX.card)[0];

test("another Profile's read-only Profile Stats card wears that Profile's frame", async () => {
    const { fake, lang } = await startHousehold({ profiles: HOUSEHOLD, active: "Alice", frameImages: true });
    openHouseholdStats(fake, lang);
    chooseColumn(fake, "Bob");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.deepEqual((({ tier, size }) => ({ tier, size }))(shownFrame(card(fake))), { tier: 4, size: 384 });

    fake.fire("commandbuttondown", { command: "Exit", repeat: false });
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    chooseColumn(fake, "Carol");
    fake.advanceTime(PROFILE_STATS_OPEN_MS);
    assert.equal(shownFrame(card(fake)), null, "Carol wears none");
    assert.deepEqual(errorLines(fake), []);
});
