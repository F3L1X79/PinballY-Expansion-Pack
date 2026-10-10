// ============================================================
// Menu Cleanup off (its default), through main.js on the fake PinballY
// globals: the Exit menu keeps Help and About, and the main menu keeps
// PinballY's Information, Flyer, High Scores and Instruction Card.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";

test("off by default, PinballY's native menu entries stay", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 30, 20, 0, 0) });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    // Only the menu Add-ons, with Menu Cleanup left at its default.
    for (const key of Object.keys(config.addOns)) {
        if (key !== "menuCleanup") config.addOns[key] = key === "customMenuCommands";
    }
    config.language = "en";
    await import("../../main.js");

    fake.openMainMenu();
    const mainTitles = fake.currentMenu().items.map(item => item.title);
    fake.closeMenu();
    for (const title of ["Information", "Flyer", "High Scores", "Instruction Card", "Rate Table", "Add to Favorites"]) {
        assert.ok(mainTitles.includes(title), `${title} in ${mainTitles.join(" | ")}`);
    }

    fake.openExitMenu();
    const exitTitles = fake.currentMenu().items.map(item => item.title);
    fake.closeMenu();
    assert.ok(exitTitles.includes("Help") && exitTitles.includes("About PinballY"), exitTitles.join(" | "));

    assert.ok(fake.logLines().some(line => line.includes("\"menuCleanup\" skipped")));
});
