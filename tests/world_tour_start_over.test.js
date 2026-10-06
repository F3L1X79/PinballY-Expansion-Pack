// ============================================================
// World Tour done in one go, started through main.js on the fake PinballY
// globals: a launch, a filter change, a Profile switch, attract mode, a
// settings reload and a change in the wheel's contents each start the tour
// over, the tables seen before no longer counting; a selection outside
// wheel mode never counts; opening the main menu, the Achievement List or
// the Profile Stats halfway does not interrupt it. The toast then shows its
// real title.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost, settle } from "./fake_pinbally_host.js";
import { toastDrawings } from "./achievement_toast_reader.js";
import { pressAndGlide } from "./achievement_list_reader.js";
import config from "../common/config.js";

const NOW = new Date(2026, 9, 1, 20, 0, 0);
const PROFILES = "C:\\PinballY\\Scripts\\ExpansionPack\\profiles";

const table = (id, title, isHidden = false) => ({ id, configId: title, title, manufacturer: "", year: 0, categories: [], isHidden });
const TITLES = ["Addams Family", "Black Knight", "Cyclone", "Dracula"];
const TABLES = TITLES.map((title, index) => table(index + 1, title));
// Hidden until an Admin shows it: the wheel's contents then change.
const ELVIRA = table(5, "Elvira", true);

test("a launch, a filter change, a Profile switch, attract mode and a wheel change start the World Tour over", async () => {
    const fake = createFakePinballYHost({ now: NOW, tables: [...TABLES, ELVIRA] });
    fake.addFolder(`${PROFILES}\\Bob`);
    // Never uninstalled: node --test runs each test file in its own process.
    fake.installGlobals();
    for (const key of Object.keys(config.addOns)) {
        config.addOns[key] = ["customMenuCommands", "achievements"].includes(key);
    }
    config.language = "en";

    const { default: lang } = await import("../common/i18n.js");
    const { getProfileStore } = await import("../common/profile_store.js");
    const TEXT = lang.achievements;
    await import("../main.js");
    await settle();

    const worldTourToasts = () => toastDrawings(fake).filter(drawing => drawing.texts.includes(TEXT.worldTourTitle()));
    const current = () => fake.getWheelTables()[0].title;
    // The player moves the wheel straight to this table.
    const select = title => fake.moveWheel(fake.getWheelTables().findIndex(game => game.title === title));
    const openMainMenu = () => fake.openMenu("main", [{ title: "Play", cmd: globalThis.command.PlayGame }]);

    // From Addams Family (seen at the start): every table but Dracula.
    select("Black Knight");
    select("Cyclone");
    let missing = "Dracula";

    // Every table but `missing` has been seen in the current tour. Once the
    // trigger has run, back on the All Tables wheel, selecting `missing`
    // would complete that tour; it must not, since the tour started over.
    // Ends with every table but a new `missing` seen in the new tour.
    async function assertStartsOver(label, trigger) {
        await trigger();
        assert.equal(fake.getUIMode(), "wheel", label);
        const start = current();
        assert.notEqual(start, missing, label);
        select(missing);
        assert.equal(worldTourToasts().length, 0, `${label} starts the tour over`);
        const next = TITLES.find(title => title !== start && title !== missing);
        select(next);
        missing = TITLES.find(title => ![start, missing, next].includes(title));
    }

    await assertStartsOver("a launch", async () => {
        const game = fake.getWheelTables()[0];
        globalThis.mainWindow.playGame(game);
        fake.gameStarted(game);
        await settle();
        fake.gameOver(game);
        await settle();
    });

    await assertStartsOver("a filter change", () => {
        // Favorite Tables, picked in the main menu, browsed, then back to All Tables.
        openMainMenu();
        fake.fire("filterselect", { id: "Favorites" });
        fake.setWheelTables(["Black Knight", "Dracula"], { filterId: "Favorites" });
        fake.closeMenu();
        fake.moveWheel(1);
        openMainMenu();
        fake.fire("filterselect", { id: "All" });
        globalThis.gameList.setCurFilter("All");
        fake.closeMenu();
    });

    await assertStartsOver("a Profile switch", () => { getProfileStore().switchTo("Bob"); });

    await assertStartsOver("attract mode", () => {
        fake.enterAttractMode();
        // PinballY's own moves in attract mode, never counted.
        const notMissing = TITLES.find(title => title !== missing && title !== current());
        select(notMissing);
        fake.exitAttractMode();
    });

    await assertStartsOver("a settings reload", async () => {
        fake.fire("settingsreload");
        await settle();
    });

    // Next Filter / Prev Filter straight from the wheel: no menu closes, so
    // no "wheelmode" follows; the table the wheel lands on still counts.
    await assertStartsOver("a filter change from the wheel", async () => {
        fake.fire("filterselect", { id: "Favorites" });
        fake.setWheelTables(TITLES.filter(title => title !== missing).slice(0, 2), { filterId: "Favorites" });
        await settle();
        fake.moveWheel(1);
        fake.fire("filterselect", { id: "All" });
        globalThis.gameList.setCurFilter("All");
        await settle();
    });

    // Moves made outside wheel mode never count, and the menus opened
    // halfway do not interrupt the tour.
    openMainMenu();
    select(missing);
    fake.closeMenu();
    assert.equal(worldTourToasts().length, 0, "a selection outside wheel mode never counts");
    fake.openMainMenu();
    fake.selectMenuItem(lang.achievementList.menuEntry);
    pressAndGlide(fake, "Exit");
    fake.openMainMenu();
    fake.selectMenuItem(lang.profileStats.menuEntry);
    pressAndGlide(fake, "Exit");
    assert.equal(fake.getUIMode(), "wheel");
    select(TITLES.find(title => title !== missing));
    assert.equal(worldTourToasts().length, 0);
    select(missing);
    assert.equal(worldTourToasts().length, 1, "the tour carried on through the menus");
    assert.ok(worldTourToasts()[0].texts.includes(TEXT.worldTourDescription()), "the toast shows the real description");

    // Guest's tour, from the current table: every table but one. Shown by
    // an Admin, Elvira then joins the wheel without any event: the tour
    // starts over at the next selection.
    getProfileStore().switchTo("guest");
    const guestStart = current();
    const guestMissing = TITLES.find(title => title !== guestStart);
    for (const title of TITLES.filter(title => title !== guestMissing)) select(title);
    fake.setTables([...TABLES, { ...ELVIRA, isHidden: false }]);
    globalThis.gameList.setCurFilter("All");
    select(guestMissing);
    select("Elvira");
    const guestTour = () => JSON.parse(fake.readFile(`${PROFILES}\\guest\\profile.json`) ?? "{}").worldTour;
    assert.equal(guestTour(), undefined, "the tables seen before the wheel changed no longer count");
    for (const title of TITLES) select(title);
    assert.equal(guestTour(), true, "a whole tour of the new wheel unlocks it");

    assert.deepEqual(fake.logLines().filter(line => line.includes("ERROR")), []);
});
