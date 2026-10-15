// ============================================================
// The High Score Board of a learned original table hands its board to
// PinballY, through main.js on the fake PinballY globals: the opening's
// read makes PinballY forget the board it held, so the board read from
// the learned section (or the last known one, when none is read) is
// handed again as plain lines for the DMD and the info box.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { startHighScores, ZELDA, ZELDA_TABLE, ZELDA_FACTORY, OTHER_SECTIONS, vpregBoard } from "./high_scores_scenario.js";
import { openBoard, press } from "./high_score_board_reader.js";

test("each opening on a learned table hands PinballY the board it read, or the last known one", async () => {
    const { fake, setVpreg, play, handedBoards } = await startHighScores({ profiles: { Alice: {} }, active: "Alice", tables: [ZELDA_TABLE] });
    const { default: lang } = await import("../../common/core/i18n.js");
    setVpreg({ ...OTHER_SECTIONS, ZELDA: ZELDA_FACTORY });
    await play(ZELDA, { afterVpreg: { ...OTHER_SECTIONS, ZELDA: vpregBoard(["AAA", 2800000], ["FEF", 2750000]) } });
    // Played since outside the pack.
    setVpreg({ ...OTHER_SECTIONS, ZELDA: vpregBoard(["ZZZ", 2900000], ["AAA", 2800000]) });
    const handed = handedBoards().length;

    openBoard(fake, lang);
    fake.advanceTime(1000);
    await settle();
    press(fake, "Exit");
    fake.advanceTime(1000);
    // The section is gone: the last known board is handed again.
    setVpreg({ ...OTHER_SECTIONS });
    openBoard(fake, lang);
    fake.advanceTime(1000);
    await settle();

    assert.deepEqual(handedBoards().slice(handed), [
        { configId: ZELDA, lines: ["1) ZZZ 2,900,000", "2) AAA 2,800,000"] },
        { configId: ZELDA, lines: ["1) ZZZ 2,900,000", "2) AAA 2,800,000"] },
    ]);
});
