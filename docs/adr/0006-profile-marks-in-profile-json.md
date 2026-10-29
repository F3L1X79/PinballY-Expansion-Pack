---
status: superseded by ADR-0020
---

# Admin and Child marks live in each Profile's profile.json

A Profile is marked as an Admin Profile or a Child Profile by hand, in its own `profile.json`, not in `.env.local` like the other player settings (ADR 0002), and never from the cabinet's menus. Profiles are already created by hand, as folders under `profiles\`, so whoever sets up a household is already editing files there. The marks are meant for those people only: an option that takes some file editing to switch on stays out of the hands of those it restricts.

## Considered Options

- **`ADMIN_PROFILES` / `CHILD_PROFILES` lists in `.env.local`.** Rejected: `.env.local` is the settings file every player is invited to edit, and the marks are not an everyday setting.
- **An admin menu entry that marks a Child Profile.** Rejected: marking stays a deliberate step taken outside the cabinet.

## Consequences

- The Profile store rewrites `profile.json` whole on every change, so it must keep the marks it read, and a Profile Reset must keep them too.
