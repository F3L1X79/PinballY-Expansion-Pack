// ============================================================
// Who sees the setup entries (Table Setup, the Operator Menu, the Expansion
// Pack Settings): an Admin Profile, or every Profile, Guest included, while
// the household marks none. Pure: asks the Profile store each time.
// ============================================================

export const seesSetupEntries = profileStore => profileStore.isAdmin() || !profileStore.hasAdminProfile();
