// ============================================================
// Four Seasons, a secret of the Surprises family, started through main.js
// on the fake PinballY globals: Plays in three meteorological seasons
// unlock nothing, a Play in the fourth unlocks it, the seasons seen
// surviving a restart (a first run in a child process, whose files the
// second run starts from). A game under a minute counts for no season; a
// Profile Reset erases the seasons seen. While missing, its row shows
// "???" and its hint.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { SEASON_COUNT } from "../common/surprises.js";
import { startSurprisesScenario, showsMissing, showsUnlocked, profileFile, PROFILES, SHORT_GAME_MS } from "./surprises_scenario.js";

const SCENARIO_URL = new URL("./surprises_scenario.js", import.meta.url).href;
const KEPT_FILES = [`${PROFILES}\\cabinet.json`, profileFile("guest")];

// The first run: winter, a game under a minute in spring, summer, then the
// files it leaves.
const FIRST_RUN = `
import { startSurprisesScenario, SHORT_GAME_MS } from ${JSON.stringify(SCENARIO_URL)};
const { fake, TEXT, waitUntil, play } = await startSurprisesScenario({ now: new Date(2026, 11, 1, 9, 0, 0) });
const toasts = [];
waitUntil(2026, 11, 1, 10, 0);
toasts.push(...await play());
waitUntil(2027, 2, 1, 10, 0);
toasts.push(...await play(SHORT_GAME_MS));
waitUntil(2027, 7, 31, 10, 0);
toasts.push(...await play());
const files = Object.fromEntries(${JSON.stringify(KEPT_FILES)}.map(path => [path, fake.readFile(path)]));
const errors = fake.logLines().filter(line => line.includes("ERROR"));
process.stdout.write(JSON.stringify({ unlocked: toasts.includes(TEXT.fourSeasonsTitle()), files, errors }));
`;

test("a Play in each of the four seasons unlocks Four Seasons, even across a restart", async () => {
    const firstRun = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", FIRST_RUN], { encoding: "utf8" }));
    assert.equal(firstRun.unlocked, false, "winter and summer");
    assert.deepEqual(firstRun.errors, []);

    const { fake, store, TEXT, LIST_TEXT, waitUntil, play, listRows } = await startSurprisesScenario({
        now: new Date(2027, 10, 30, 9, 0, 0), files: firstRun.files,
    });
    const secret = { title: TEXT.fourSeasonsTitle(), description: TEXT.fourSeasonsDescription(SEASON_COUNT), hint: TEXT.fourSeasonsHint() };
    assert.ok(showsMissing(listRows(), secret, LIST_TEXT.secretTitle));

    waitUntil(2027, 10, 30, 10, 0);
    assert.ok(!(await play()).includes(secret.title), "autumn, a third season: the spring's only game was under a minute");
    waitUntil(2028, 2, 1, 10, 0);
    assert.ok((await play()).includes(secret.title), "spring, the fourth season");
    assert.ok(showsUnlocked(listRows(), secret));

    // Reset: three seasons again are not enough.
    store.resetProfile("guest");
    assert.ok(showsMissing(listRows(), secret, LIST_TEXT.secretTitle));
    for (const [year, month] of [[2028, 5], [2028, 8], [2028, 11]]) {
        waitUntil(year, month, 1, 10, 0);
        assert.ok(!(await play()).includes(secret.title), `the seasons seen were erased (${year}-${month + 1})`);
    }
    waitUntil(2029, 2, 1, 10, 0);
    assert.ok((await play()).includes(secret.title), "the fourth season after the reset");

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
