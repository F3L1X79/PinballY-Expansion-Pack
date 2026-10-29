// ============================================================
// Who sees the setup entries (Table Setup, the Operator Menu, the Expansion
// Pack Settings): an Admin Profile, or every Profile, Guest included, while
// the household marks none. Pure: asks the Profile store each time.
// Also the mark rules (ADR 0020), shared by the Manage profiles menu and the store.
// ============================================================

export const seesSetupEntries = profileStore => profileStore.isAdmin() || !profileStore.hasAdminProfile();

// Why a mark line cannot be changed, as the menu explains it.
export const MARK_REFUSAL = Object.freeze({
    GUEST: "guestNeverMarked",
    ADMIN_MARK_FIRST: "removeAdminMarkFirst",
});

// Why this mark of a Profile cannot be set or cleared, null when it can;
// marks: { isGuest, isAdmin, isChild } as the store reads them.
export function markRefusal(marks, markName) {
    if (marks.isGuest) return MARK_REFUSAL.GUEST;
    if (markName === "isChild" && marks.isAdmin) return MARK_REFUSAL.ADMIN_MARK_FIRST;
    return null;
}
