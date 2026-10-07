// ============================================================
// The one rule for showing a table's title, shared by the Welcome Screen
// and the Profile Stats: without its parenthetical suffixes, nor the
// replacement characters some PinballY databases carry in place of a lost
// "™" (raw, or read as Windows-1252), nor the doubled spaces they leave.
// No side effects.
// ============================================================

export function cleanTitle(title) {
    return title.replace(/\s*\([^)]*\)/g, "").replace(/ï¿½|�/g, "").replace(/\s{2,}/g, " ").trim();
}
