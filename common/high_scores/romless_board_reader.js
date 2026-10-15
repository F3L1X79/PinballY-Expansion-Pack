// ============================================================
// ROM-less board reader: turns the values of a table's VPReg.stg section
// (from the compound file reader) into the same board of places the
// board reader gives for PINemHi: { rank, initials, score }, ordered by
// score whatever slot the table stored them in, and renumbered. Reads the
// HighScoreN / HighScoreNName family, of any length; when it gives no
// place, a lone HighScore or HiScore makes a one-place board with empty
// initials. Other families (WaffleScore..., SpecialHighScore...) are
// feats or second boards, left out; a section without any score is not a
// board. Pure: reads no PinballY global, writes nothing.
// The rules follow vpin-studio's VPReg parsing (MIT, (c) Matthias Faust /
// syd711, github.com/syd711/vpin-studio), limited to the families found
// on the cabinet.
// ============================================================

import { MIN_SCORE } from "./board_reader.js";

const SCORE_NAME = /^HighScore(\d+)$/;
const LONE_SCORE_NAMES = ["HighScore", "HiScore"];
// Anything else (control characters, symbols) is not something a player typed.
const READABLE_INITIALS = /^[A-Za-z0-9 ]*$/;

const initialsOf = (value) => {
    const text = String(value ?? "").trim();
    return READABLE_INITIALS.test(text) ? text : "";
};

// A slot's score, or null when empty or below the board reader's minimum.
const scoreOf = (value) => {
    const text = String(value ?? "").trim();
    return /^\d+$/.test(text) && Number(text) >= MIN_SCORE ? Number(text) : null;
};

const toPlaces = slots => slots.filter(slot => slot.score !== null)
    // Equal scores keep their slot order, not the order the file lists them in.
    .sort((a, b) => b.score - a.score || a.slot - b.slot)
    .map((slot, index) => ({ rank: index + 1, initials: slot.initials, score: slot.score }));

// The section's board of places, or null when neither the HighScoreN
// family nor a lone score gives a place (a settings section, or every
// score empty).
export function readSectionBoard(values) {
    const family = toPlaces(Object.keys(values).map(name => SCORE_NAME.exec(name)).filter(match => match !== null)
        .map(match => ({ slot: Number(match[1]), initials: initialsOf(values[`HighScore${match[1]}Name`]), score: scoreOf(values[match[0]]) })));
    if (family.length > 0) return family;
    // Such a table keeps no initials (Whoa Nellie's Initial1...3 are digits).
    const lone = LONE_SCORE_NAMES.find(name => scoreOf(values[name]) !== null);
    return lone === undefined ? null : [{ rank: 1, initials: "", score: scoreOf(values[lone]) }];
}
