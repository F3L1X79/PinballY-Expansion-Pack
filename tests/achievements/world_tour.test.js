// ============================================================
// World Tour Achievement, started through main.js on the fake PinballY
// globals: on "All Tables", Guest selects every table of the wheel, going
// back and forth and jumping ahead, the starting table counting as seen;
// the toast shows the moment the last table is selected, without any game,
// with its real title. A Secret Achievement: while missing, its row shows
// "???" and its hint. The add-ons' own wheel moves never count, the Achievement stays Unlocked,
// and a Profile Reset erases it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import { toastDrawings } from "./achievement_toast_reader.js";
import { readRows, pressAndGlide } from "./achievement_list_reader.js";
import config from "../../common/config.js";

const NOW = new Date(2026, 9, 1, 20, 0, 0);

const table = (id, title) => ({ id, configId: title, title, manufacturer: "", year: 0, categories: [], isHidden: false });
const TABLES = [
    table(1, "Addams Family"),
    table(2, "Black Knight"),
    table(3, "Cyclone"),
    table(4, "Dracula"),
    table(5, "Elvira"),
    // Hidden: never on the wheel, never required.
    { ...table(6, "Hidden Table"), isHidden: true },
];

test("selecting every table of All Tables unlocks the World Tour at once, for good", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: TABLES });
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = ["achievements"].includes(key);
    }
    config.language = "en";

    const { default: lang } = await import("../../common/i18n.js");
    const { getProfileStore } = await import("../../common/profile_store.js");
    const TEXT = lang.achievements;
    await import("../../main.js");
    await settle();

    const worldTourToasts = () => toastDrawings(fake).filter(drawing => drawing.texts.includes(TEXT.worldTourTitle()));
    const worldTourRow = () => {
        fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);
        fake.selectMenuItem(lang.achievementList.menuEntry);
        // A Secret Achievement: its row shows "???" and its hint while missing.
        const row = readRows(fake, lang.achievementList).find(candidate =>
            candidate.title === TEXT.worldTourTitle() || candidate.description === TEXT.worldTourHint());
        pressAndGlide(fake, "Exit");
        assert.equal(fake.getUIMode(), "wheel");
        return row;
    };

    // The add-ons' own moves (setWheelGame) fire no game selection: Black
    // Knight and Cyclone are on the wheel, never selected by the player.
    globalThis.gameList.setWheelGame(1);
    globalThis.gameList.setWheelGame(1);
    globalThis.gameList.setWheelGame(-2);

    // From Addams Family (seen at the start): forward, back, a letter jump
    // over Black Knight and Cyclone, then on to Elvira.
    fake.moveWheel(1);
    fake.moveWheel(-1);
    fake.moveWheel(3);
    fake.moveWheel(1);
    assert.equal(worldTourToasts().length, 0, "Cyclone, skipped by the letter jump, is still missing");
    const missingRow = worldTourRow();
    assert.equal(missingRow.unlocked, false);
    assert.equal(missingRow.title, lang.achievementList.secretTitle);
    assert.equal(missingRow.description, TEXT.worldTourHint());

    fake.moveWheel(-2);
    assert.equal(worldTourToasts().length, 1, "the toast shows the moment the last table is selected");
    assert.equal(fake.launches().length, 0);
    const { worldTour } = JSON.parse(fake.readFile("C:\\PinballY\\Scripts\\ExpansionPack\\profiles\\guest\\profile.json"));
    assert.equal(worldTour, true);

    fake.moveWheel(1);
    fake.moveWheel(1);
    assert.equal(worldTourToasts().length, 1, "announced once");
    const unlockedRow = worldTourRow();
    assert.equal(unlockedRow.unlocked, true, "it stays Unlocked");
    assert.equal(unlockedRow.title, TEXT.worldTourTitle());
    assert.equal(unlockedRow.description, TEXT.worldTourDescription());

    getProfileStore().resetProfile("guest");
    assert.equal(worldTourRow().unlocked, false, "a Profile Reset erases it");

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
