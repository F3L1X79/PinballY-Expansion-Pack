// ============================================================
// World Tour on other wheels, started through main.js on the fake PinballY
// globals: touring another filter (Favorite Tables) never unlocks it, a
// Child Profile's tour of All Tables does not require the Adult Tables,
// and a one-table wheel never unlocks it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import { toastDrawings } from "./achievement_toast_reader.js";
import config from "../../common/config.js";

const NOW = new Date(2026, 9, 1, 20, 0, 0);
const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";

const table = (id, title, categories = []) => ({ id, configId: title, title, manufacturer: "", year: 0, categories, isHidden: false });
const ADDAMS = "Addams Family";
const BLACK_KNIGHT = "Black Knight";
const CYCLONE = "Cyclone";
const ADULT = "Playboy";
const TABLES = [table(1, ADDAMS), table(2, BLACK_KNIGHT), table(3, ADULT, ["NSFW"]), table(4, CYCLONE)];

test("only a tour of the wheel the Profile sees on All Tables unlocks the World Tour, from two tables", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: TABLES });
    fake.addFile(`${PROFILES}\\Alice\\profile.json`, JSON.stringify({ version: 1, isChild: true }));
    fake.addFolder(`${PROFILES}\\Bob`);
    fake.addFile(`${PROFILES}\\cabinet.json`, JSON.stringify({ version: 1, activeProfile: "Bob" }));
    // PinballY starts on a filter of its own.
    fake.setWheelTables([ADDAMS, BLACK_KNIGHT], { filterId: "Favorites" });
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
    const store = getProfileStore();
    const worldTourToasts = () => toastDrawings(fake).filter(drawing => drawing.texts.includes(TEXT.worldTourTitle()));

    fake.moveWheel(1);
    fake.moveWheel(1);
    assert.equal(worldTourToasts().length, 0, "a tour of Favorite Tables is no shortcut");

    // A single table left on the wheel, one never seen again below.
    fake.setTables([table(9, "Zaccaria")]);
    globalThis.gameList.setCurFilter("All");
    fake.moveWheel(1);
    fake.moveWheel(1);
    assert.equal(worldTourToasts().length, 0, "a one-table wheel never unlocks it");
    assert.equal(JSON.parse(fake.readFile(`${PROFILES}\\Bob\\profile.json`) ?? "{}").worldTour, undefined);

    // A Child Profile's wheel on All Tables, from Addams Family, never
    // selected so far on it: the Adult Table is not on it.
    fake.setTables(TABLES);
    store.switchTo("Alice");
    globalThis.gameList.setCurFilter("All");
    fake.moveWheel(1);
    fake.moveWheel(1);
    assert.equal(worldTourToasts().length, 0, "Addams Family is still missing");
    fake.moveWheel(1);
    assert.equal(worldTourToasts().length, 1, "the Adult Table is never required");
    assert.equal(JSON.parse(fake.readFile(`${PROFILES}\\Alice\\profile.json`)).worldTour, true);

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
