// ============================================================
// Board reader: turns the raw lines PinballY returns for a table's high
// scores (getHighScores() / highscoresready) into a board of places, and
// tells which places of an "after" board are new against a "before" one,
// and whether a place vanished that no new place beat (a reset).
// Pure: reads no PinballY global, writes nothing.
// The rule follows vpin-studio's RawScoreParser (MIT, (c) Matthias Faust /
// syd711, github.com/syd711/vpin-studio), validated on the cabinet's 107
// tables by the prototype/high-scores-probe branch.
// ============================================================

// vpin-studio's highscoreTitles: an unranked score counts only under one.
const CHAMPION_TITLES = [
    "MASTER MAGICIAN", "CHAMPION", "GRAND CHAMPION", "WORLD RECORD", "GREATEST VAMPIRE HUNTER",
    "GREATEST TIME LORD", "RIVER MASTER", "CLUB CHAMPION", "HIGHEST SCORES", "THE BEST DUDE",
    "ACE WINGER", "ROAD-TRIP KING", "MY BEST FRIEND", "MY OTHER FRIENDS", "HIGHEST SCORE",
    "HIGH SCORE", "GRAND CHAMP", "AUTOBOT GRAND CHAMPION", "DECEPTICON GRAND CHAMPION",
    "REGULAR GAME GRAND CHAMPION", "DREAM MASTER", "COMMANDER",
];
// The first group ends at the first blank line once this many places were
// found, so a lone Grand Champion above the numbered places does not end it.
const MIN_PLACES_BEFORE_STOP = 3;
// vpin-studio's MAX_RESET_SCORE_VALUE: below it, a reset slot, not a score.
const MIN_SCORE = 10;
const RANK_PATTERN = /^(\d+\)|#\d+|\d+#|\d+,|\d+\.:)\s*(.*)$/;
// Optional initials, then digits in groups of three (any separator) or
// plain digits, then an optional word that makes it a statistic ("20 COMBOS").
const SCORE_PATTERN = /^(.*?)\s*(\d{1,3}(?:[.,'? ]\d{3})+|\d+)(?:\s+([A-Za-z].*))?$/;

// What PINemHi prints instead of a board: an unknown ROM, its usage, an error.
const UNSUPPORTED_PATTERN = /not supported rom|usage\s*:|pinemhi\s+<|^\s*error/i;

// The no-break spaces, the CP850 one read as ANSI ("\u00FF") and U+FFFD
// become plain spaces, so the score pattern needs one space separator only.
// Escaped so this file stays ASCII.
const normalizeLine = raw => String(raw).replace(/[\u00A0\u202F\u00FF\uFFFD\t]/g, " ").trim();
const normalizeTitle = text => text.trim().replace(/\s+/g, " ").toUpperCase();

// Two places are the same when their initials (in any case) and score are.
export const placeKey = place => `${place.initials.toUpperCase()}|${place.score}`;

function parseScore(text) {
    const match = SCORE_PATTERN.exec(text.trim());
    if (!match) return null;
    return { initials: match[1].trim(), score: Number(match[2].replace(/\D/g, "")), statistic: Boolean(match[3]) };
}

export function readBoard(rawLines) {
    if (rawLines.some(raw => UNSUPPORTED_PATTERN.test(String(raw)))) return { status: "unsupported", places: [] };
    const places = [];
    let title = "";
    for (const raw of rawLines) {
        const text = normalizeLine(raw);
        if (text === "") {
            title = "";
            if (places.length >= MIN_PLACES_BEFORE_STOP) break;
            continue;
        }
        const ranked = RANK_PATTERN.exec(text);
        const entry = parseScore(ranked ? ranked[2] : text);
        if (!entry) {
            if (!ranked) title = normalizeTitle(text);
            continue;
        }
        if (entry.statistic || entry.score < MIN_SCORE) continue;
        if (!ranked && !CHAMPION_TITLES.includes(title)) continue;
        if (places.some(place => placeKey(place) === placeKey(entry))) continue;
        places.push({ rank: places.length + 1, initials: entry.initials, score: entry.score });
    }
    return { status: places.length > 0 ? "board" : "empty", places };
}

// The places of the "after" board that no place of the "before" board
// matches, each "before" place matching once.
export function newPlaces(beforePlaces, afterPlaces) {
    const remaining = beforePlaces.map(placeKey);
    return afterPlaces.filter(place => {
        const index = remaining.indexOf(placeKey(place));
        if (index === -1) return true;
        remaining.splice(index, 1);
        return false;
    });
}

// Whether a "before" place is gone with no higher new place to beat it,
// each new place beating one at most. Pairing them highest first finds
// such a beating whenever one exists.
export function hasUnbeatenGonePlace(beforePlaces, afterPlaces) {
    const byScoreDown = places => places.map(place => place.score).sort((a, b) => b - a);
    const gone = byScoreDown(newPlaces(afterPlaces, beforePlaces));
    const added = byScoreDown(newPlaces(beforePlaces, afterPlaces));
    return gone.some((score, index) => index >= added.length || added[index] <= score);
}
