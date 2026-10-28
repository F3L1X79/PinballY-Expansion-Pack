---
status: accepted
---

# The import line is a dynamic import with a catch

The README tells the player to add `import("./ExpansionPack/main.js").catch(e => logfile.log("ExpansionPack: " + e.message));` to `Scripts\main.js`, not the static `import "./ExpansionPack/main.js";` of ADR 0009 and of PinballY's own examples. With the static line, a missing pack folder stops the whole of `Scripts\main.js`, so the player's own scripts never run. The dynamic line keeps them running, and the pack still loads in time for every startup screen.

Checked on the cabinet (PinballY 1.1.0 Beta 10, #339):

- **Static line, folder missing**: no script runs; PinballY logs `Error loading <path>`.
- **Dynamic line, folder present**: the pack loads before the Startup Screen, the Profile picker and the Welcome Screen, as with the static line.
- **Dynamic line, folder missing**: the player's line runs; PinballY logs `Error loading <path>`, and the `.catch` logs nothing (the promise never settles).
- **Dynamic line, the pack throws while loading**: the player's line runs; PinballY logs nothing, only the `.catch` logs `ExpansionPack: <message>`.

## Considered Options

- **Keep the static line.** Rejected: an update cut halfway, a badly extracted zip or a bug at load time would silently take the player's own scripts down with the pack.
- **The dynamic line without `.catch`.** Rejected: a pack that throws while loading would leave no trace at all in `PinballY.log`.

## Consequences

- The player's own code in `Scripts\main.js` now runs before the pack, not after it.
- Cabinets installed with the static line keep working; nothing migrates them, and a Pack Update never touches `Scripts\main.js`.
