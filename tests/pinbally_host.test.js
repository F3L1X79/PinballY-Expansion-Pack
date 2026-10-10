// ============================================================
// Contract tests for the PinballY host: the same behaviours are checked on
// the in-memory fake host and on the production adapter running over the
// fake PinballY globals, so both adapters stay interchangeable.
// Run with "node --test" from the project folder.
// ============================================================

import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createFakePinballYHost } from "./fake_pinbally_host.js";
import { createPinballYHost } from "../common/pinbally_host.js";

const NOW = new Date(2026, 8, 23, 10, 0, 0);

const MEDIEVAL_LOGO = "C:\\PinballY\\Media\\Visual Pinball X\\Wheel Images\\Medieval Madness (Williams 1997).png";

const TABLES = [
    { id: 1, configId: "Medieval Madness (Williams 1997)", title: "Medieval Madness", isHidden: false, wheelImage: MEDIEVAL_LOGO },
    { id: 2, configId: "Attack from Mars (Bally 1995)", title: "Attack from Mars", isHidden: false },
    { id: 3, configId: "Hidden Table (Gottlieb 1978)", title: "Hidden Table", isHidden: true },
];

const ADAPTERS = [
    { name: "fake host", createHost: (fake) => fake },
    { name: "production host over fake globals", createHost: () => createPinballYHost(), usesGlobals: true },
];

for (const { name, createHost, usesGlobals } of ADAPTERS) {
    describe(name, () => {
        let fake;
        let host;
        let uninstallGlobals = () => {};

        beforeEach(() => {
            fake = createFakePinballYHost({ now: NOW, tables: TABLES });
            if (usesGlobals) uninstallGlobals = fake.installGlobals();
            host = createHost(fake);
        });

        afterEach(() => uninstallGlobals());

        test("reads back settings with their type, or the default when missing", () => {
            host.settings.set("custom.test.count", 12);
            host.settings.set("custom.test.ratio", 1.5);
            host.settings.set("custom.test.flag", true);
            host.settings.set("custom.test.name", "2026-09-21");

            assert.equal(host.settings.getInt("custom.test.count", 0), 12);
            assert.equal(host.settings.getFloat("custom.test.ratio", 0), 1.5);
            assert.equal(host.settings.getBool("custom.test.flag", false), true);
            assert.equal(host.settings.getString("custom.test.name", ""), "2026-09-21");
            assert.equal(host.settings.getString("custom.test.count", ""), "12");

            assert.equal(host.settings.getInt("custom.test.missing", 7), 7);
            assert.equal(host.settings.getBool("custom.test.missing", false), false);
            assert.equal(host.settings.getString("custom.test.missing", ""), "");
        });

        test("reports the written settings keys, not the seeded ones", () => {
            fake.seedSettings({ "custom.test.seeded": "1" });
            host.settings.set("custom.test.written", 3);

            assert.equal(host.settings.getInt("custom.test.seeded", 0), 1);
            assert.deepEqual([...fake.writtenSettingsKeys()], ["custom.test.written"]);
        });

        test("gives the date set by the test, and moves it forward", () => {
            assert.equal(host.now().getTime(), NOW.getTime());

            fake.advanceTime(90 * 60 * 1000);
            assert.equal(host.now().getTime(), new Date(2026, 8, 23, 11, 30, 0).getTime());

            fake.setNow(new Date(2026, 8, 28, 0, 0, 1));
            assert.equal(host.now().getTime(), new Date(2026, 8, 28, 0, 0, 1).getTime());
        });

        test("lists the visible tables and finds a table by config ID", () => {
            assert.deepEqual(host.getVisibleTables().map(game => game.configId), [
                "Medieval Madness (Williams 1997)",
                "Attack from Mars (Bally 1995)",
            ]);
            assert.equal(host.getGameInfo("Attack from Mars (Bally 1995)").title, "Attack from Mars");
            assert.equal(host.getGameInfo("No Such Table"), null);

            fake.setTables([{ id: 9, configId: "Theatre of Magic (Bally 1995)", title: "Theatre of Magic" }]);
            assert.deepEqual(host.getVisibleTables().map(game => game.title), ["Theatre of Magic"]);
        });

        test("offers the wheel selection in wheel order, every visible table by default", () => {
            assert.deepEqual(host.getWheelTables().map(game => game.configId), [
                "Medieval Madness (Williams 1997)",
                "Attack from Mars (Bally 1995)",
            ]);

            fake.setWheelTables(["Attack from Mars (Bally 1995)", "Medieval Madness (Williams 1997)"]);
            assert.deepEqual(host.getWheelTables().map(game => game.title), ["Attack from Mars", "Medieval Madness"]);
        });

        test("gives the wheel's current table, or null with an empty wheel selection", () => {
            assert.equal(host.getCurrentTable().title, "Medieval Madness");

            fake.setWheelTables(["Attack from Mars (Bally 1995)", "Medieval Madness (Williams 1997)"]);
            assert.equal(host.getCurrentTable().title, "Attack from Mars");

            fake.setWheelTables([]);
            assert.equal(host.getCurrentTable(), null);
        });

        test("moves the wheel's current table by an offset, wrapping around", () => {
            fake.setTables([...TABLES, { id: 4, configId: "Whirlwind (Williams 1990)", title: "Whirlwind" }]);

            host.setWheelGame(2);
            assert.deepEqual(host.getWheelTables().map(game => game.title),
                ["Whirlwind", "Medieval Madness", "Attack from Mars"]);

            host.setWheelGame(-1);
            assert.equal(host.getWheelTables()[0].title, "Attack from Mars");
        });

        test("only the player's wheel moves fire the game selection, with the new table", () => {
            const selected = [];
            host.onGameListEvent("gameselect", ev => selected.push(ev.game.title));

            host.setWheelGame(1);
            fake.moveWheel(1);

            assert.deepEqual(selected, ["Medieval Madness"]);
        });

        test("switches to the all-tables filter, keeping the current table", () => {
            fake.setTables([...TABLES, { id: 4, configId: "Whirlwind (Williams 1990)", title: "Whirlwind", isConfigured: false }]);
            fake.setWheelTables(["Attack from Mars (Bally 1995)"], { filterId: "Favorites" });

            host.setCurrentFilter("All");

            assert.equal(fake.currentFilterId(), "All");
            assert.deepEqual(host.getWheelTables().map(game => game.title), ["Attack from Mars", "Medieval Madness"]);
        });

        test("creates a script filter under its full id, then shows it and runs it again on refresh", () => {
            let selected = ["Attack from Mars (Bally 1995)"];
            host.createFilter({ id: "test.Selected", title: "Selected", select: game => selected.includes(game.configId) });

            host.setCurrentFilter("User.test.Selected");
            assert.equal(host.getCurrentFilterId(), "User.test.Selected");
            assert.deepEqual(host.getWheelTables().map(game => game.title), ["Attack from Mars"]);

            selected = ["Medieval Madness (Williams 1997)"];
            host.refreshFilter();
            assert.deepEqual(host.getWheelTables().map(game => game.title), ["Medieval Madness"]);
        });

        test("a metafilter narrows every filter at once, and decides again only when the filter runs", () => {
            let ruledOut = "Attack from Mars (Bally 1995)";
            host.setCurrentFilter("All");
            host.createMetaFilter({ select: game => game.configId !== ruledOut });
            assert.deepEqual(host.getWheelTables().map(game => game.title), ["Medieval Madness"]);

            ruledOut = "Medieval Madness (Williams 1997)";
            assert.deepEqual(host.getWheelTables().map(game => game.title), ["Medieval Madness"]);
            host.refreshFilter();
            assert.deepEqual(host.getWheelTables().map(game => game.title), ["Attack from Mars"]);

            host.createFilter({ id: "test.Both", title: "Both", select: () => true });
            host.setCurrentFilter("User.test.Both");
            assert.deepEqual(host.getWheelTables().map(game => game.title), ["Attack from Mars"]);
        });

        test("allocates a distinct command ID per name", () => {
            const first = host.allocateCommand("first");
            const second = host.allocateCommand("second");

            assert.notEqual(first, second);
            assert.equal(fake.commandId("second"), second);
        });

        test("shows a menu, then closing it fires menuclose and returns to the wheel", () => {
            const events = [];
            host.on("menuclose", ev => events.push(`menuclose:${ev.id}`));
            host.on("wheelmode", () => events.push("wheelmode"));

            assert.equal(host.getUIMode(), "wheel");
            host.showMenu("testDialog", [{ title: "Hello", cmd: -1 }], { dialogStyle: true });

            assert.equal(host.getUIMode(), "menu");
            assert.equal(fake.currentMenu().id, "testDialog");
            assert.deepEqual(fake.shownMenus().map(menu => menu.id), ["testDialog"]);

            fake.closeMenu();
            assert.equal(host.getUIMode(), "wheel");
            assert.equal(fake.currentMenu(), null);
            assert.deepEqual(events, ["menuclose:testDialog", "wheelmode"]);
        });

        test("selecting a menu item fires its command, then closes the menu", () => {
            const events = [];
            const okCommand = host.allocateCommand("ok");
            host.on("command", ev => events.push(`command:${ev.id}`));
            host.on("menuclose", ev => events.push(`menuclose:${ev.id}`));

            host.showMenu("testDialog", [{ title: "OK", cmd: okCommand }], { dialogStyle: true });
            fake.selectMenuItem("OK");

            assert.deepEqual(events, [`command:${okCommand}`, "menuclose:testDialog"]);
        });

        test("gives PinballY's built-in command IDs, distinct from the allocated ones", () => {
            const allocated = host.allocateCommand("custom");
            const builtIn = ["PlayGame", "MenuReturn", "MenuPageUp", "MenuPageDown"].map(host.getBuiltInCommand);

            assert.ok(builtIn.every(id => Number.isInteger(id)), builtIn.join(", "));
            assert.equal(new Set([...builtIn, allocated]).size, builtIn.length + 1);
        });

        test("a menu shown by a command replaces the current one; an item that stays open keeps it", () => {
            const events = [];
            const submenuCommand = host.allocateCommand("submenu");
            const stayCommand = host.allocateCommand("stay");
            host.on("command", ev => {
                if (ev.id === submenuCommand) host.showMenu("submenu", [{ title: "Stay", cmd: stayCommand, stayOpen: true }]);
            });
            host.on("menuclose", ev => events.push(`menuclose:${ev.id}`));
            host.on("wheelmode", () => events.push("wheelmode"));

            host.showMenu("parent", [{ title: "Open", cmd: submenuCommand }]);
            fake.selectMenuItem("Open");
            fake.selectMenuItem("Stay");

            assert.deepEqual(events, ["menuclose:parent"]);
            assert.equal(fake.currentMenu().id, "submenu");
            assert.equal(host.getUIMode(), "menu");
        });

        test("records table launches and plays the game events the test fires", () => {
            const events = [];
            host.on("gamestarted", ev => events.push(`gamestarted:${ev.game.configId}:${host.getUIMode()}`));
            host.on("gameover", ev => events.push(`gameover:${ev.game.configId}`));
            host.on("wheelmode", () => events.push(`wheelmode:${host.getUIMode()}`));

            const game = host.getGameInfo("Medieval Madness (Williams 1997)");
            host.playGame(game);
            assert.deepEqual(fake.launches().map(launched => launched.configId), [game.configId]);
            assert.equal(host.getUIMode(), "running");

            fake.gameStarted(game);
            fake.gameOver(game);
            assert.deepEqual(events, [
                `gamestarted:${game.configId}:running`,
                `gameover:${game.configId}`,
                "wheelmode:wheel",
            ]);
        });

        test("draws styled text on a main-window drawing layer and records its position and alpha", () => {
            fake.setLayoutSize({ width: 1080, height: 1920 });
            const layer = host.createDrawingLayer(6500);
            let size = null;
            layer.draw(dc => {
                size = dc.getSize();
                const text = host.createStyledText({ textStyle: { font: "Segoe UI", size: 11 } });
                text.add({ weight: 600, text: "Achievement unlocked\n" });
                text.add("Play 5 tables in one day.");
                const metrics = text.measure(300);
                assert.ok(metrics.height > 0, `measured height ${metrics.height}`);
                text.draw(dc, { x: 0, y: 0, width: 300, height: metrics.height });
            });
            layer.setPos(0, 0.25);
            layer.alpha = 0.5;

            assert.deepEqual(size, { width: 1080, height: 1920 });
            const [recorded] = fake.drawingLayers();
            assert.equal(recorded.zIndex, 6500);
            assert.deepEqual(recorded.texts(), ["Achievement unlocked", "Play 5 tables in one day."]);
            assert.deepEqual(recorded.position(), { x: 0, y: 0.25 });
            assert.equal(recorded.alpha, 0.5);
        });

        test("finds a table's wheel logo, and none for a table without one", () => {
            fake.addFile(MEDIEVAL_LOGO);

            assert.equal(host.getWheelImage(host.getGameInfo("Medieval Madness (Williams 1997)")), MEDIEVAL_LOGO);
            assert.equal(host.getWheelImage(host.getGameInfo("Attack from Mars (Bally 1995)")), null);
        });

        test("removes a drawing layer, leaving the others", () => {
            const kept = host.createDrawingLayer(6100);
            const removed = host.createDrawingLayer(6101);
            host.removeDrawingLayer(removed);

            assert.deepEqual(fake.drawingLayers().map(layer => layer.zIndex), [kept.zIndex]);
        });

        test("reports the run mode while a game starts, runs and exits", () => {
            const runModes = [];
            host.on("gameover", () => runModes.push(host.getFullUIMode().runMode));
            const game = host.getGameInfo("Medieval Madness (Williams 1997)");

            assert.equal(host.getFullUIMode().runMode, undefined);
            host.playGame(game);
            runModes.push(host.getFullUIMode().runMode);
            fake.gameStarted(game);
            runModes.push(host.getFullUIMode().runMode);
            fake.gameOver(game);

            assert.deepEqual(runModes, ["starting", "running", "exiting"]);
            assert.deepEqual(host.getFullUIMode(), { mode: "wheel" });
        });

        test("gives the PinballY program folder and the pack's folder, and plays existing sound files only", () => {
            assert.equal(host.getProgramFolder(), "C:\\PinballY\\");
            assert.equal(host.getProjectFolder(), "C:\\PinballY\\Scripts\\ExpansionPack");

            fake.addFile("C:\\Sounds\\achievement.mp3");
            host.playSound("C:\\Sounds\\achievement.mp3");
            assert.throws(() => host.playSound("C:\\Sounds\\missing.mp3"), /not found/);
            assert.deepEqual(fake.soundsPlayed(), ["C:\\Sounds\\achievement.mp3"]);
        });

        test("plays a sound on several players in turn, and only an existing file", () => {
            const filePath = "C:\\PinballY\\Assets\\Button Sounds\\Next.wav";
            fake.addFile(filePath);
            const rotation = host.createSoundRotation(filePath, 3);
            for (let press = 0; press < 4; press++) rotation.play();

            assert.deepEqual(fake.soundsPlayed(), [filePath, filePath, filePath, filePath]);
            const [first, second, third, fourth] = fake.soundPlayers();
            assert.equal(new Set([first, second, third]).size, 3, "three different players");
            assert.equal(fourth, first, "then the first one again");
            assert.throws(() => host.createSoundRotation("C:\\Sounds\\missing.wav", 3), /not found/);
        });

        test("creates folders, lists sub-folders, and writes, reads, renames and deletes UTF-8 files", () => {
            const profiles = "C:\\PinballY\\Scripts\\profiles";
            assert.deepEqual(host.files.listFolders(profiles), []);

            host.files.createFolder(profiles);
            host.files.createFolder(profiles);
            host.files.createFolder(`${profiles}\\Chloé`);
            assert.deepEqual(host.files.listFolders(profiles), ["Chloé"]);

            const path = `${profiles}\\Chloé\\profile.json`;
            assert.equal(host.files.fileExists(path), false);
            host.files.writeText(path, "{\"name\":\"Émile\"}");
            assert.equal(host.files.fileExists(path), true);
            assert.equal(host.files.readText(path), "{\"name\":\"Émile\"}");

            const renamedPath = `${profiles}\\Chloé\\profile.bak.json`;
            host.files.renameFile(path, renamedPath);
            assert.equal(host.files.fileExists(path), false);
            assert.equal(host.files.readText(renamedPath), "{\"name\":\"Émile\"}");

            host.files.writeText(path, "new");
            assert.throws(() => host.files.renameFile(path, renamedPath), /exists/);

            host.files.deleteFile(renamedPath);
            assert.equal(host.files.fileExists(renamedPath), false);
            assert.throws(() => host.files.readText(renamedPath), /not found/);
            assert.deepEqual(fake.fileOperations(), [
                { operation: "write", path },
                { operation: "rename", path, to: renamedPath },
                { operation: "write", path },
                { operation: "delete", path: renamedPath },
            ]);
        });

        test("lists the files of a folder, not its sub-folders nor deeper files, and none for a missing folder", () => {
            const alice = "C:\\PinballY\\Scripts\\profiles\\Alice";
            assert.deepEqual(host.files.listFiles(alice), []);

            fake.addFile(`${alice}\\profile.json`, "{}");
            fake.addFile(`${alice}\\play-log-2026.json`, "{}");
            fake.addFile(`${alice}\\old\\play-log-2025.json`, "{}");

            assert.deepEqual(host.files.listFiles(alice).sort(), ["play-log-2026.json", "profile.json"]);
        });

        test("writing into a missing folder fails", () => {
            assert.throws(() => host.files.writeText("C:\\PinballY\\Scripts\\missing\\file.json", "{}"), /not found/);
        });

        test("tells a readable image from a missing or unreadable one, leaving no drawing layer behind", () => {
            const readable = "C:\\PinballY\\Scripts\\profiles\\Alice\\avatar.png";
            const unreadable = "C:\\PinballY\\Scripts\\profiles\\Bob\\avatar.png";
            fake.addFile(readable);
            fake.addUnreadableImage(unreadable);

            assert.equal(host.files.isImageReadable(readable), true);
            assert.equal(host.files.isImageReadable(unreadable), false);
            assert.equal(host.files.isImageReadable("C:\\PinballY\\Scripts\\missing.png"), false);
            assert.deepEqual(fake.drawingLayers(), []);
        });

        test("writes log lines", () => {
            host.log("[Test] hello");
            assert.deepEqual(fake.logLines(), ["[Test] hello"]);
        });
    });
}

describe("production host sound players", () => {
    test("every caller asking for the same sound shares its players, created once", () => {
        const fake = createFakePinballYHost({ now: NOW });
        const uninstallGlobals = fake.installGlobals();
        try {
            const filePath = "C:\\PinballY\\Assets\\Button Sounds\\Next.wav";
            fake.addFile(filePath);
            const first = createPinballYHost().createSoundRotation(filePath, 3);
            const second = createPinballYHost().createSoundRotation(filePath, 3);
            first.play();
            second.play();
            first.play();
            second.play();

            const players = fake.soundPlayers();
            assert.equal(new Set(players.slice(0, 3)).size, 3, "the second caller goes on with the next player");
            assert.equal(players[3], players[0], "three players in all");
        } finally {
            uninstallGlobals();
        }
    });
});

describe("fake host timers", () => {
    test("run on the manual clock as the test advances time, and can be cleared", () => {
        const fake = createFakePinballYHost({ now: NOW });
        const calls = [];
        fake.setTimeout(() => calls.push(`timeout@${fake.now().getTime() - NOW.getTime()}`), 100);
        const cleared = fake.setTimeout(() => calls.push("cleared"), 50);
        fake.clearTimeout(cleared);
        const interval = fake.setInterval(() => {
            calls.push(`tick@${fake.now().getTime() - NOW.getTime()}`);
            if (calls.length === 4) fake.clearInterval(interval);
        }, 40);

        fake.advanceTime(99);
        assert.deepEqual(calls, ["tick@40", "tick@80"]);

        fake.advanceTime(1000);
        assert.deepEqual(calls, ["tick@40", "tick@80", "timeout@100", "tick@120"]);
        assert.equal(fake.now().getTime() - NOW.getTime(), 1099);
    });
});

describe("fake PinballY globals", () => {
    test("the global Date follows the fake host clock until uninstalled", () => {
        const fake = createFakePinballYHost({ now: NOW });
        const uninstall = fake.installGlobals();
        try {
            assert.equal(new Date().getTime(), NOW.getTime());
            fake.advanceTime(1000);
            assert.equal(Date.now(), new Date(2026, 8, 23, 10, 0, 1).getTime());
            assert.equal(new Date("2020-01-01T00:00:00Z").toISOString(), "2020-01-01T00:00:00.000Z");
        } finally {
            uninstall();
        }
        assert.ok(Math.abs(Date.now() - new Date(2026, 8, 23, 10, 0, 1).getTime()) > 1000);
        assert.equal(globalThis.optionSettings, undefined);
    });
});
