// ============================================================
// Welcome Screen Challenge Table card: the drawn table is the random
// source's pick among the Challenge Tables but the Last Played Table, and a
// new one is drawn when the screen opens again, from the main menu or
// after Change Player.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { settle } from "../support/fake_pinbally_host.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { periodCards, press, openFromMainMenu, isWelcomeScreenOpen, WELCOME_SCREEN_OPEN_MS } from "./welcome_screen_reader.js";
import { startWithChallenge, STERN_B } from "./challenge_card_scenario.js";
import { getProfileStore } from "../../common/profiles/profile_store.js";

const challengeCardName = fake => periodCards(fake).find(card => card.period === "A CHALLENGE TABLE").name;

test("the Challenge Table is drawn among the others than the Last Played Table, anew at each opening", async t => {
    let draw = 0.5;
    t.mock.method(Math, "random", () => draw);
    // Godzilla, Deadpool and Jaws are Challenge Tables; Deadpool is the Last Played Table.
    const fake = await startWithChallenge({
        plays: { [STERN_B.configId]: { count: 1, seconds: 300, lastPlayed: "2026-09-22T21:00:00" } }, others: ["Bob"],
    });
    const { default: lang } = await import("../../common/core/i18n.js");
    assert.equal(challengeCardName(fake), "Jaws", "the second of Godzilla and Jaws");
    const closeScreen = async () => {
        press(fake, "Exit");
        await settle();
        assert.equal(isWelcomeScreenOpen(fake), false);
    };
    const arrive = async name => {
        getProfileStore().switchTo(name);
        await settle();
        fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    };

    await closeScreen();
    draw = 0;
    await openFromMainMenu(fake, lang.welcomeScreen.menuEntry);
    assert.equal(challengeCardName(fake), "Godzilla", "from the main menu");

    await closeScreen();
    await arrive("Bob");
    await closeScreen();
    draw = 0.5;
    await arrive("Alice");
    assert.equal(challengeCardName(fake), "Jaws", "after Change Player");
    assertNoErrorLogged(fake);
});
