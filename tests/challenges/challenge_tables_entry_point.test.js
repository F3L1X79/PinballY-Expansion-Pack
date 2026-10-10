// ============================================================
// The Challenges Add-on started by main.js on the fake PinballY globals,
// with a decade Challenge already locked for the week: the Challenge
// Tables filter is in the main menu's filters, and choosing it puts the
// decade's tables on the wheel.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "../support/fake_pinbally_host.js";
import config from "../../common/config.js";

const PROFILES_FOLDER = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";
const TABLES = [
    { id: 1, configId: "Medieval Madness", title: "Medieval Madness", manufacturer: "Williams", year: 1997 },
    { id: 2, configId: "Attack from Mars", title: "Attack from Mars", manufacturer: "Bally", year: 1995 },
    { id: 3, configId: "Elvira", title: "Elvira", manufacturer: "Bally", year: 1989 },
];

test("the Challenge Tables filter puts the Challenge's tables on the wheel", async () => {
    const fake = createFakePinballYHost({ now: new Date(2026, 8, 23, 10, 0, 0), tables: TABLES });
    fake.addFolder(`${PROFILES_FOLDER}\\Alice`);
    fake.addFile(`${PROFILES_FOLDER}\\cabinet.json`, JSON.stringify({
        version: 1,
        activeProfile: "Alice",
        challenge: { current: { week: "2026-09-21", template: "decadeTables", param: 1990, target: 2 }, previous: null },
    }));
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    // The Profile picker too: without it, main.js makes Guest active.
    for (const key of Object.keys(config.addOns)) config.addOns[key] = ["challenges", "profilePicker"].includes(key);
    config.language = "en";

    await import("../../main.js");
    await settle();

    const [filter] = fake.scriptFilters().filter(({ id }) => id === "project.ChallengeTables");
    assert.equal(filter.group, "[Top]");
    fake.setCurrentFilter(`User.${filter.id}`);
    await settle();

    assert.deepEqual(fake.getWheelTables().map(game => game.title), ["Medieval Madness", "Attack from Mars"]);
    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
