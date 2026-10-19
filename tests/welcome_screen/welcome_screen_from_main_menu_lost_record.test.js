// ============================================================
// Welcome Screen from the main menu and Lost Records: the screen reopened
// from the menu never tells again a Lost Record already seen; a Child
// Profile gets the entry too.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { startLostRecords } from "./lost_records_scenario.js";
import { settle } from "../support/fake_pinbally_host.js";
import { WELCOME_SCREEN_OPEN_MS } from "./welcome_screen_reader.js";
import { board, avatarFiles, MEDIEVAL, FACTORY } from "../high_scores/high_scores_scenario.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const ALICE_RECORD = board(["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"], ["ZAP", "20000000"]);
const BOB_RECORD = board(["BOB", "70000000"], ["ALI", "60000000"], ["SLL", "52000000"], ["BRE", "40000000"], ["LFS", "30000000"]);

test("the Welcome Screen reopened from the main menu does not tell a seen Lost Record again", async () => {
    const scenario = await startLostRecords({
        profiles: { Alice: {}, Bob: { isChild: true } }, active: "Alice", files: avatarFiles("Alice", "Bob"),
    });
    const { fake, setBoard, play, arrive, close, isOpen, line } = scenario;
    const { default: lang } = await import("../../common/core/i18n.js");
    const reopenFromMainMenu = async () => {
        fake.openMenu("main", [{ title: "Play", cmd: fake.getBuiltInCommand("PlayGame") }]);
        fake.selectMenuItem(lang.welcomeScreen.menuEntry);
        await settle();
        fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    };
    setBoard(MEDIEVAL, FACTORY);

    await play(MEDIEVAL, { after: ALICE_RECORD });
    await arrive("Bob");
    await close();
    await reopenFromMainMenu();
    assert.equal(isOpen(), true, "a Child Profile gets the entry too");
    await close();
    await play(MEDIEVAL, { after: BOB_RECORD });

    await arrive("Alice");
    assert.equal(line(), "Bob took your record on Medieval Madness");
    await close();
    await reopenFromMainMenu();
    assert.equal(isOpen(), true);
    assert.equal(line(), null, "told once");
    await close();
    assertNoErrorLogged(fake);
});
