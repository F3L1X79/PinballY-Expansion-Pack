// ============================================================
// Profile picker drawn ahead, through main.js on the fake PinballY globals:
// once the drawing ahead has run, opening the carousel and moving through
// it (the Avatar entering from the edge, the gold frame changing hands, the
// name leaving and coming back) draws nothing and only moves layers, since
// on the cabinet each draw blocks PinballY for 20 to 45 ms. A pick redraws
// the two names whose colour changes in the background, not on a move.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
// The carousel's background, its Avatars, then the gold frame and names.
const PICKER_Z_RANGE = [6500, 6502];
const GLIDE_OVER_MS = 500;
const DRAWN_AHEAD_MS = 3000;

const visibleTexts = fake => fake.drawingLayers()
    .filter(layer => layer.zIndex >= PICKER_Z_RANGE[0] && layer.zIndex <= PICKER_Z_RANGE[1] && layer.alpha > 0)
    .flatMap(layer => layer.texts());
const press = (fake, buttonCommand) => fake.fire("commandbuttondown", { command: buttonCommand, repeat: false });

test("once drawn ahead, the carousel opens and moves without drawing", async () => {
    const fake = createFakePinballYHost();
    const names = ["Alice", "Bob", "Chloe", "Dan", "Eve", "Finn"];
    for (const name of names) fake.addFolder(`${PROFILES_FOLDER}\\${name}`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Bob" }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) config.addOns[key] = key === "profilePicker";
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    await import("../../main.js");
    await settle();
    // The startup greeting over, and everything drawn ahead.
    fake.advanceTime(DRAWN_AHEAD_MS);

    const open = async () => {
        fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
        fake.selectMenuItem(lang.profiles.menuEntry);
        await settle();
    };
    const drawingsBefore = fake.drawings().length;
    await open();
    assert.ok(visibleTexts(fake).includes(lang.profiles.pickerTitle), "the carousel is shown");
    assert.ok(visibleTexts(fake).includes("Bob"), "on the active Profile");
    // Around the ring of 7 Profiles and back, so every Avatar enters once.
    for (let step = 0; step < 7; step++) {
        press(fake, "Next");
        fake.advanceTime(GLIDE_OVER_MS);
    }
    press(fake, "Prev");
    press(fake, "Next");
    fake.advanceTime(GLIDE_OVER_MS);
    assert.ok(visibleTexts(fake).includes("Bob"), "the name shows once the Avatars are at rest");
    assert.deepEqual(names.filter(name => name !== "Bob" && visibleTexts(fake).includes(name)), [], "only the highlighted name");
    assert.equal(fake.drawings().length, drawingsBefore, "opening and moving draw nothing");

    press(fake, "Next");
    fake.advanceTime(GLIDE_OVER_MS);
    press(fake, "Select");
    fake.advanceTime(DRAWN_AHEAD_MS);
    await open();
    const drawingsAfterPick = fake.drawings().length;
    press(fake, "Prev");
    fake.advanceTime(GLIDE_OVER_MS);
    assert.ok(visibleTexts(fake).includes("Bob"));
    assert.equal(fake.drawings().length, drawingsAfterPick, "the names recoloured by the pick were drawn ahead");
    press(fake, "Exit");
    assert.deepEqual(visibleTexts(fake), [], "Exit hides the carousel");

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
