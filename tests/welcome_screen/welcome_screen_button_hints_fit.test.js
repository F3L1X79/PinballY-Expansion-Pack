// ============================================================
// The Welcome Screen's Button Hints in landscape then portrait windows,
// through main.js on the fake PinballY globals: with the Daily Streak line
// and both cards' grey lines showing, the footer sits inside the window,
// under every other piece of the screen, hiding none of them, its words
// inside it. The portrait one opens when Change Player brings Alice back.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import config from "../../common/core/config.js";
import { settle } from "../support/fake_pinbally_host.js";
import { assertNoErrorLogged } from "../support/error_log.js";

const LANDSCAPE = { width: 1920, height: 1080 };
const PORTRAIT = { width: 1080, height: 1920 };

test("the footer fits under the Welcome Screen in landscape and portrait", async () => {
    config.language = "en";
    const { startWelcomeScreen } = await import("./button_hints_scenario.js");
    const { footerLayout, dailyStreakLine, periodCards, press, WELCOME_SCREEN_OPEN_MS } = await import("./welcome_screen_reader.js");
    const { getProfileStore } = await import("../../common/profiles/profile_store.js");
    const { fake } = await startWelcomeScreen({ size: LANDSCAPE });

    function assertFits(size) {
        const where = `${size.width}x${size.height}`;
        assert.ok(dailyStreakLine(fake), `${where}: the Daily Streak line shows`);
        assert.ok(periodCards(fake).every(card => card.line), `${where}: both cards show their grey line`);
        const { footer, pieces, textsInside } = footerLayout(fake, size);
        assert.ok(footer.top >= 0 && footer.bottom <= size.height && footer.left >= 0 && footer.right <= size.width, `${where}: inside the window`);
        for (const piece of pieces) {
            assert.ok(piece.top >= 0 && piece.bottom <= size.height, `${where}: layer ${piece.zIndex} inside the window`);
            assert.ok(piece.bottom <= footer.top + 0.5, `${where}: layer ${piece.zIndex} above the footer`);
        }
        assert.ok(textsInside, `${where}: its words inside it`);
    }
    async function arrive(name) {
        getProfileStore().switchTo(name);
        await settle();
        fake.advanceTime(WELCOME_SCREEN_OPEN_MS);
    }

    assertFits(LANDSCAPE);
    press(fake, "Exit");
    fake.setLayoutSize(PORTRAIT);
    await arrive("Bob");
    press(fake, "Exit");
    await arrive("Alice");
    assertFits(PORTRAIT);
    assertNoErrorLogged(fake);
});
