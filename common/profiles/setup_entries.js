// ============================================================
// Who sees the setup entries (Table Setup, the Operator Menu, the Expansion
// Pack Settings): an Admin Profile, or every Profile, Guest included, while
// the household marks none. Pure: asks the Profile store each time.
// Also who sees "Manage profiles" and the mark rules (ADR 0020), shared by
// the Exit menu, the Manage profiles menu and the store.
// ============================================================

export const seesSetupEntries = profileStore => profileStore.isAdmin() || !profileStore.hasAdminProfile();

// Who sees "Manage profiles": an Admin Profile, or, while the household marks
// none, the active Profile if the mark rules let it become the first one
// (not Guest, not a Child Profile).
export const seesManageProfiles = profileStore => profileStore.isAdmin()
    || (!profileStore.hasAdminProfile()
        && markRefusal(profileStore.getMarksOf(profileStore.getActiveProfile().name), "isAdmin") === null);

// Why a mark line cannot be changed, as the menu explains it.
export const MARK_REFUSAL = Object.freeze({
    GUEST: "guestNeverMarked",
    ADMIN_MARK_FIRST: "removeAdminMarkFirst",
    CHILD_MARK_FIRST: "removeChildMarkFirst",
    LAST_ADMIN: "lastAdmin",
});

// Why this mark of a Profile cannot be set or cleared, null when it can;
// marks: { isGuest, isAdmin, isChild, isLastAdmin } as the store reads them.
export function markRefusal(marks, markName) {
    if (marks.isGuest) return MARK_REFUSAL.GUEST;
    if (markName === "isChild" && marks.isAdmin) return MARK_REFUSAL.ADMIN_MARK_FIRST;
    // Only setting it: a Profile marked both by hand can still lose its Admin mark.
    if (markName === "isAdmin" && marks.isChild && !marks.isAdmin) return MARK_REFUSAL.CHILD_MARK_FIRST;
    if (markName === "isAdmin" && marks.isLastAdmin) return MARK_REFUSAL.LAST_ADMIN;
    return null;
}
