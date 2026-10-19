// ============================================================
// ROM-less board reader: turns a VPReg.stg section or a "5 scores + 5
// initials" text file of VPX's User folder into the same board of places as
// the board reader. Pure: reads no PinballY global, writes nothing.
// - Other score families (WaffleScore..., SpecialHighScore...) are left out.
// - A file without the five scores block (a LUT file) is not a board.
// - Follows vpin-studio's VPReg parsing (MIT, (c) Matthias Faust / syd711).
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

const TEXT_PLACES = 5;
const WHOLE_NUMBER = /^\d+$/;

// The text file's board of places, or null when it holds no block of
// five scores followed by five initials (CRLF or LF lines).
export function readTextBoard(text) {
    const lines = String(text).split(/\r?\n/).map(line => line.trim());
    const isScore = line => WHOLE_NUMBER.test(line);
    // An initials line is never a whole number, so a settings line just
    // before the scores is not taken for one of them; an empty one reads
    // as empty initials.
    const isInitials = line => !isScore(line);
    for (let start = 0; start + 2 * TEXT_PLACES <= lines.length; start++) {
        const scores = lines.slice(start, start + TEXT_PLACES);
        const initials = lines.slice(start + TEXT_PLACES, start + 2 * TEXT_PLACES);
        if (scores.every(isScore) && initials.every(isInitials)) {
            const places = toPlaces(scores.map((score, index) => ({ slot: index + 1, initials: initialsOf(initials[index]), score: scoreOf(score) })));
            return places.length > 0 ? places : null;
        }
    }
    return null;
}
