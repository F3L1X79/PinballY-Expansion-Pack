// ============================================================
// ROM-less board reader: turns the values of a table's VPReg.stg section
// (from the compound file reader) into the same board of places the
// board reader gives for PINemHi: { rank, initials, score }, ordered by
// score whatever slot the table stored them in, and renumbered. Reads the
// HighScoreN / HighScoreNName family; a section without any such score is
// not a board. Pure: reads no PinballY global, writes nothing.
// The rules follow vpin-studio's VPReg parsing (MIT, (c) Matthias Faust /
// syd711, github.com/syd711/vpin-studio), limited to the families found
// on the cabinet.
// ============================================================

import { MIN_SCORE } from "./board_reader.js";

const SCORE_NAME = /^HighScore(\d+)$/;

// The section's board of places, or null when it holds no score value
// (none of the family, or all of them empty).
export function readSectionBoard(values) {
    const places = Object.keys(values).map(name => SCORE_NAME.exec(name)).filter(match => match !== null)
        .map(match => ({
            slot: Number(match[1]),
            initials: String(values[`HighScore${match[1]}Name`] ?? "").trim(),
            text: String(values[match[0]]).trim(),
        }))
        .filter(slot => /^\d+$/.test(slot.text) && Number(slot.text) >= MIN_SCORE)
        // Equal scores keep their slot order, not the order the file lists them in.
        .sort((a, b) => Number(b.text) - Number(a.text) || a.slot - b.slot)
        .map((slot, index) => ({ rank: index + 1, initials: slot.initials, score: Number(slot.text) }));
    return places.length > 0 ? places : null;
}
