// ============================================================
// ROM-less High Scores with a VPReg.stg that cannot be read, through
// main.js on the fake PinballY globals: the read error is logged once,
// as it happens, on an original table (nothing credited, no second read
// after the game) and on a ROM table whose PINemHi board is credited.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import {
    startHighScores, ZELDA, ZELDA_TABLE, MEDIEVAL, TABLES, VPX_SYSTEM, VPREG_PATH, FACTORY, SECOND_PLACE,
} from "./high_scores_scenario.js";

const UNREADABLE = `could not be read (VPReg.stg is not a compound file.); nothing credited from it.`;

test("an unreadable VPReg.stg is logged once per Play, as it is read", async () => {
    const { fake, setBoard, play, saved, log } = await startHighScores({
        profiles: { Alice: {} }, active: "Alice", tables: [{ ...TABLES[0], system: VPX_SYSTEM }, ZELDA_TABLE],
    });
    fake.addFile(VPREG_PATH, "not a compound file");
    setBoard(MEDIEVAL, FACTORY);

    await play(ZELDA);
    await play(MEDIEVAL, { after: SECOND_PLACE });

    assert.deepEqual(log(), [
        `[HighScores] "${ZELDA}": ${VPREG_PATH} ${UNREADABLE}`,
        `[HighScores] "${MEDIEVAL}": ${VPREG_PATH} ${UNREADABLE}`,
        `[HighScores] "${MEDIEVAL}": first board read, 5 places, all Default Scores.`,
        `[HighScores] "${MEDIEVAL}": High Score for Alice: place 2, 45000000 (ALI).`,
    ]);
    assert.equal(saved().tables[ZELDA], undefined);
    assert.equal(fake.fileReads().filter(path => path === VPREG_PATH).length, 2, "one read per Play, at launch");
});
