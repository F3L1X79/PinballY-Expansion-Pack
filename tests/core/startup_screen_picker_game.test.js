// ============================================================
// Startup Screen "profilePicker", a game first: a table started from a
// native menu opened before the carousel's turn drops the startup screens,
// so neither the carousel nor the Welcome Screen shows after the game.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { loaderLayerCount } from "../support/loader_reader.js";
import { isWelcomeScreenOpen, startupVeil } from "../welcome_screen/welcome_screen_reader.js";
import { assertNoErrorLogged } from "../support/error_log.js";
import { startOnProfilePicker, isCarouselOpen } from "./startup_picker_scenario.js";

const SETTLED_MS = 3000;
const TABLES = [{ id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness" }];

test("a game started during startup drops the startup Profile picker and the Welcome Screen", async () => {
    const { fake, lang, settle } = await startOnProfilePicker({
        addOns: ["startupChoicePrompt", "profilePicker", "seamlessLaunchOverlay"], tables: TABLES,
    });
    fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
    assert.deepEqual(startupVeil(fake), { shown: false }, "the veil gives way to the menu");
    await settle();
    fake.advanceTime(SETTLED_MS);
    assert.equal(isCarouselOpen(fake, lang), false, "no carousel over the menu");

    // Play: the menu closes and the table launches.
    fake.closeMenu();
    const [game] = fake.getAllTables();
    fake.playGame(game);
    fake.gameStarted(game);
    fake.advanceTime(SETTLED_MS);
    fake.gameOver(game);
    await settle();
    fake.advanceTime(SETTLED_MS);
    await settle();
    assert.equal(isCarouselOpen(fake, lang), false, "no carousel after the game");
    assert.equal(isWelcomeScreenOpen(fake), false, "no Welcome Screen after the game");
    assert.deepEqual(startupVeil(fake), { shown: false });
    assert.equal(loaderLayerCount(fake), 0);
    assertNoErrorLogged(fake);
});
