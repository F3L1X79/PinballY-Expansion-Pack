// ============================================================
// The start after a failed Pack Update, through main.js on the fake host,
// a Profile that is not an Admin Profile picked: no Error Toast and the
// request stays recorded; a later switch to the Admin Profile brings it
// once that Profile's Welcome Screen closes.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLines } from "../support/error_log.js";
import { press, WELCOME_SCREEN_FADE_IN_MS } from "../welcome_screen/welcome_screen_reader.js";
import { pickAfterFailedUpdate, requestedVersionOf, errorCardsOf } from "./update_failed_scenario.js";

test("a failed Pack Update waits for a Profile that sees the setup entries", async () => {
    const { fake, store, settle, errorCards } = await pickAfterFailedUpdate({
        adminProfiles: ["Alice"], activeProfile: "Alice", moves: ["Next"],
    });

    assert.equal(store.getActiveProfile().name, "Bob");
    assert.deepEqual(errorCards, [], "no Error Toast for Bob");
    assert.equal(requestedVersionOf(fake), "9.0.0", "kept for a Profile that sees it");

    // Alice's Welcome Screen opens, and holds the toasts until it closes.
    store.switchTo("Alice");
    await settle();
    fake.advanceTime(WELCOME_SCREEN_FADE_IN_MS * 2);
    press(fake, "Exit");
    await settle();
    assert.equal(errorCardsOf(fake).length, 1, "shown to Alice");
    assert.equal(requestedVersionOf(fake), undefined);
    assert.equal(errorLines(fake).length, 1, "only the failure, logged once at the start");
    assert.match(errorLines(fake)[0], /^\[UpdateResult\] ERROR Pack Update to 9\.0\.0 failed/);
});
