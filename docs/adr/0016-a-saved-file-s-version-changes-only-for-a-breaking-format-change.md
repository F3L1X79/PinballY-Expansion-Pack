---
status: accepted
---

# A saved file's version changes only for a breaking format change

`cabinet.json`, `profile.json` and each `play-log-<year>.json` carry a `version`. It goes up only when an older pack would misread the file (a field renamed, moved or given another meaning), never for an added field. The Profile Store already keeps what it does not know: it reads `profile.json` as `{ ...emptyProfileData(), ...saved }` and writes the whole object back, so an added field survives a return to an older commit. A file whose `version` is newer than the code is set aside as `<name>.newer-<date>.json`, logged, and the file starts from zero, like a broken file: the older code never reads or rewrites a format it does not know.

## Considered Options

- **Raising `version` for every change.** Rejected: every return to an older commit would set the player's data aside for nothing.
- **Leaving a newer file in place and playing that session without saving it.** Coming back to the newer code would need no hand renaming, but every write would need a check, for a case that may never happen; setting aside reuses what broken files already go through.

## Consequences

- Only commits that carry this check protect a newer file; an older one rewrites it as if it were its own.
- In a Play Log year file, only `plays` and each Play's own fields survive an older pack: a new top-level key there is a breaking change.
- The first breaking change brings the first migration function; none are written ahead.
