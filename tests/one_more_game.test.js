// ============================================================
// One More Game!, a secret of the Surprises family, started through main.js
// on the fake PinballY globals: 5 Plays in a row on the same table unlock
// it, 4 do not. The run belongs to the Profile: a restart (a first run in a
// child process, whose files the second run starts from), a game under a
// minute on another table, a switch of Profile and a new day leave it as
// it is; a Play on another table starts it over; a Profile Reset erases
// it. While missing, its row shows "???" and its hint.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { ONE_MORE_GAME_PLAYS } from "../common/surprises.js";
import { startSurprisesScenario, showsMissing, showsUnlocked, profileFile, PROFILES, SHORT_GAME_MS, PERIOD_TABLE } from "./surprises_scenario.js";

const SCENARIO_URL = new URL("./surprises_scenario.js", import.meta.url).href;
const KEPT_FILES = [`${PROFILES}\\cabinet.json`, profileFile("guest"), profileFile("Alice"), profileFile("Bob")];

// The first run: 3 Plays in a row as Guest, then the files it leaves.
const FIRST_RUN = `
import { startSurprisesScenario } from ${JSON.stringify(SCENARIO_URL)};
const { fake, TEXT, play } = await startSurprisesScenario({ now: new Date(2026, 9, 5, 9, 0, 0) });
const toasts = [];
for (let index = 0; index < 3; index++) toasts.push(...await play());
const files = Object.fromEntries(${JSON.stringify(KEPT_FILES)}.map(path => [path, fake.readFile(path)]));
const errors = fake.logLines().filter(line => line.includes("ERROR"));
process.stdout.write(JSON.stringify({ unlocked: toasts.includes(TEXT.oneMoreGameTitle()), files, errors }));
`;

test("5 Plays in a row on the same table unlock One More Game!, even across a restart", async () => {
    const firstRun = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", FIRST_RUN], { encoding: "utf8" }));
    assert.equal(firstRun.unlocked, false, "3 Plays in a row");
    assert.deepEqual(firstRun.errors, []);

    const { fake, store, TEXT, LIST_TEXT, play, listRows, switchTo } = await startSurprisesScenario({
        now: new Date(2026, 9, 6, 9, 0, 0), files: firstRun.files,
    });
    const secret = {
        title: TEXT.oneMoreGameTitle(), description: TEXT.oneMoreGameDescription(ONE_MORE_GAME_PLAYS), hint: TEXT.oneMoreGameHint(),
    };
    assert.equal(ONE_MORE_GAME_PLAYS, 5);
    assert.match(secret.description, /5/);
    // Plays that table count times and tells whether any of them unlocked it.
    const playsUnlock = async (count, table) => {
        let unlocked = false;
        for (let index = 0; index < count; index++) {
            if ((await play(undefined, table)).includes(secret.title)) unlocked = true;
        }
        return unlocked;
    };

    assert.ok(showsMissing(listRows(), secret, LIST_TEXT.secretTitle));
    // Guest's run survives the restart and a game under a minute elsewhere.
    assert.ok(!(await playsUnlock(1)), "Guest's 4th Play, after the restart");
    assert.ok(!(await play(SHORT_GAME_MS, PERIOD_TABLE)).includes(secret.title), "a game under a minute on another table");
    assert.ok(await playsUnlock(1), "Guest's 5th Play in a row");
    assert.ok(showsUnlocked(listRows(), secret));

    // A Play on another table starts Alice's run over there, at 1.
    await switchTo("Alice");
    assert.ok(showsMissing(listRows(), secret, LIST_TEXT.secretTitle), "Alice has not found it yet");
    assert.ok(!(await playsUnlock(4)), "Alice, 4 Plays in a row");
    assert.ok(!(await playsUnlock(1, PERIOD_TABLE)), "a Play on another table");
    assert.ok(!(await playsUnlock(4)), "4 Plays again after the break");
    assert.ok(await playsUnlock(1), "Alice's 5th Play in a row");

    // Bob's run survives a switch to Guest, Guest's Plays, and the next day.
    await switchTo("Bob");
    assert.ok(!(await playsUnlock(3)), "Bob, 3 Plays");
    await switchTo("guest");
    await playsUnlock(2, PERIOD_TABLE);
    await switchTo("Bob");
    fake.advanceTime(24 * 60 * 60 * 1000);
    assert.ok(!(await playsUnlock(1)), "Bob's 4th Play, the next day");
    assert.ok(await playsUnlock(1), "Bob, a Child Profile, at the 5th Play in a row");

    // A Profile Reset erases Bob's run along with his secret.
    assert.ok(!(await playsUnlock(2)), "Bob, 2 more Plays");
    store.resetProfile("Bob");
    assert.ok(!(await playsUnlock(4)), "4 Plays after the reset");
    assert.ok(await playsUnlock(1), "the 5th Play after the reset");

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
