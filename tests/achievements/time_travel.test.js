// ============================================================
// Time Travel, a secret of the Surprises family, started through main.js
// on the fake PinballY globals: 3 Plays in a row, each on a table from a
// strictly older decade than the one before, unlock it. A Play in the same
// decade or a newer one starts the run over from that Play, a table
// without a year breaks it, a game under a minute leaves it as it is, and
// a Profile Reset erases it. While missing, its row shows "???" and its
// hint.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startSurprisesScenario, showsMissing, showsUnlocked, table, SHORT_GAME_MS } from "./surprises_scenario.js";
import { TIME_TRAVEL_PLAYS } from "../../common/surprises.js";

const T2005 = table(1, "Table 2005", { year: 2005 });
const T1985 = table(2, "Table 1985", { year: 1985 });
const T1987 = table(3, "Table 1987", { year: 1987 });
const T1975 = table(4, "Table 1975", { year: 1975 });
const T1965 = table(5, "Table 1965", { year: 1965 });
const NO_YEAR = table(6, "Table without a year");

test("3 Plays in a row going back in decades unlock Time Travel", async () => {
    const { fake, store, TEXT, LIST_TEXT, play, listRows, switchTo } = await startSurprisesScenario({
        now: new Date(2026, 9, 5, 9, 0, 0), tables: [T2005, T1985, T1987, T1975, T1965, NO_YEAR],
    });
    const secret = {
        title: TEXT.timeTravelTitle(), description: TEXT.timeTravelDescription(TIME_TRAVEL_PLAYS), hint: TEXT.timeTravelHint(),
    };
    assert.equal(TIME_TRAVEL_PLAYS, 3);
    assert.match(secret.description, /3/);
    // Plays those tables in turn and tells whether any of them unlocked it.
    const playsUnlock = async (...tables) => {
        let unlocked = false;
        for (const played of tables) {
            if ((await play(undefined, played)).includes(secret.title)) unlocked = true;
        }
        return unlocked;
    };

    assert.ok(showsMissing(listRows(), secret, LIST_TEXT.secretTitle));
    assert.ok(!(await playsUnlock(T2005, T1985)), "2000s, then 1980s");
    assert.ok(!(await play(SHORT_GAME_MS, NO_YEAR)).includes(secret.title), "a game under a minute without a year");
    assert.ok(await playsUnlock(T1975), "then 1970s");
    assert.ok(showsUnlocked(listRows(), secret));

    // The same decade starts the run over from that Play.
    await switchTo("Alice");
    assert.ok(showsMissing(listRows(), secret, LIST_TEXT.secretTitle), "Alice has not found it yet");
    assert.ok(!(await playsUnlock(T2005, T1985, T1987, T1975)), "1980s twice in a row");
    assert.ok(await playsUnlock(T1965), "1980s, 1970s, then 1960s");

    // A newer decade starts it over too; a table without a year breaks it.
    await switchTo("Bob");
    assert.ok(!(await playsUnlock(T2005, T1985, T2005, T1985)), "back to the 2000s");
    assert.ok(!(await playsUnlock(NO_YEAR, T1975, T1965)), "a table without a year");
    assert.ok(await playsUnlock(T2005, T1985, T1975), "2000s, 1980s, 1970s");

    // A Profile Reset erases the run along with the secret.
    assert.ok(!(await playsUnlock(T2005, T1985)), "Bob, 2 more Plays");
    store.resetProfile("Bob");
    assert.ok(!(await playsUnlock(T1975)), "the 1970s after the reset");
    assert.ok(await playsUnlock(T2005, T1985, T1975), "2000s, 1980s, 1970s after the reset");

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
