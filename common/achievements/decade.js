// ============================================================
// The one decade rule, shared by the Decades Achievements and the Profile
// Stats: a table's decade is the start year of its release decade (1993
// gives 1990). Tables without a year have none. No side effects.
// ============================================================

export function getDecadeStartYear(year) {
    if (!year) return null;
    return Math.floor(year / 10) * 10;
}
