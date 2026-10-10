// ============================================================
// Checks the shared Steamball palette: a colour for every Achievement
// Rank, opaque key cap and pill backgrounds (StyledText ignores a
// semi-transparent backgroundColor), and no colour constant left in the
// Achievement Toast or the Challenge Card, which read theirs from it.
// ============================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { STEAMBALL_COLORS, STEAMBALL_FONTS, RANK_COLORS } from "../../common/steamball_palette.js";
import { ACHIEVEMENT_RANK } from "../../common/achievements.js";

const COMMON = fileURLToPath(new URL("../../common/", import.meta.url));
const COLOR_LITERAL = /0x[0-9A-Fa-f]{8}\b/g;
const isOpaque = color => color >>> 24 === 0xFF;

test("every Achievement Rank has an opaque colour", () => {
    for (const rank of Object.values(ACHIEVEMENT_RANK)) {
        assert.ok(isOpaque(RANK_COLORS[rank]), rank);
    }
});

test("key caps and pills only get opaque backgrounds", () => {
    assert.ok(isOpaque(STEAMBALL_COLORS.keyCap));
    assert.ok(isOpaque(STEAMBALL_COLORS.pill));
});

test("the palette offers the body font and Bahnschrift SemiCondensed", () => {
    assert.equal(STEAMBALL_FONTS.body, "Segoe UI");
    assert.equal(STEAMBALL_FONTS.display, "Bahnschrift SemiCondensed");
});

test("the Achievement Toast and the Challenge Card hold no colour constant of their own", () => {
    for (const name of ["achievement_toast.js", "challenge_card.js"]) {
        assert.deepEqual(readFileSync(COMMON + name, "utf8").match(COLOR_LITERAL), null, name);
    }
});
