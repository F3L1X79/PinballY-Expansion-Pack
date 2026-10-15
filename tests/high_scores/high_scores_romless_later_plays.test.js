// ============================================================
// ROM-less High Scores, later Plays on a learned original table, through
// main.js on the fake PinballY globals: a Play where VPX was killed
// changes nothing, credits nothing and keeps the learned section; a later
// Play is credited from that section, changed or not elsewhere.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startHighScores, ZELDA, ZELDA_TABLE, ZELDA_FACTORY, OTHER_SECTIONS, vpregBoard } from "./high_scores_scenario.js";

test("a learned table keeps its section through a killed VPX and credits a later Play from it", async () => {
    const { setVpreg, play, saved, log, toasts } = await startHighScores({ profiles: { Alice: {}, Bob: {} }, active: "Alice", tables: [ZELDA_TABLE] });
    const learned = vpregBoard(["AAA", 2800000], ["FEF", 2750000], ["BBB", 2700000], ["CCC", 2600000]);
    setVpreg({ ...OTHER_SECTIONS, ZELDA: ZELDA_FACTORY });
    await play(ZELDA, { afterVpreg: { ...OTHER_SECTIONS, ZELDA: learned } });
    const known = saved().tables[ZELDA];
    const logged = log().length;

    // VPX killed: nothing written.
    await play(ZELDA, { afterVpreg: { ...OTHER_SECTIONS, ZELDA: learned } });
    assert.deepEqual(saved().tables[ZELDA], known);
    assert.deepEqual(saved().learnedSources, { [ZELDA]: { kind: "vpreg", section: "ZELDA" } });
    assert.equal(saved().highScores.length, 1);

    // Bob beats the Table Record; another table's section changed since.
    const { getProfileStore } = await import("../../common/profiles/profile_store.js");
    getProfileStore().switchTo("Bob");
    const otherChanged = { ...OTHER_SECTIONS, burner: vpregBoard(["XYZ", 1600000], ["AAA", 1500000]) };
    setVpreg({ ...otherChanged, ZELDA: learned });
    await play(ZELDA, { afterVpreg: { ...otherChanged, ZELDA: vpregBoard(["BOB", 3000000], ["AAA", 2800000], ["FEF", 2750000], ["BBB", 2700000]) } });

    assert.deepEqual(log().slice(logged).filter(line => !line.includes("the high scores read failed")), [
        `[HighScores] "${ZELDA}": Play by Alice, no new place.`,
        `[HighScores] "${ZELDA}": High Score for Bob: place 1, 3000000 (BOB), Table Record.`,
    ]);
    assert.deepEqual(saved().learnedSources, { [ZELDA]: { kind: "vpreg", section: "ZELDA" } });
    assert.deepEqual(saved().tables[ZELDA].board.map(place => place.owner), ["Bob", null, "Alice", null]);
    assert.equal(toasts().at(-1), "1 | HIGH SCORE | Table Record on Zelda! | 3,000,000 points");
});
