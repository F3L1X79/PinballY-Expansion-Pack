---
status: accepted
---

# The project lives in its own Scripts subfolder, under a fixed name

PinballY loads only `Scripts\main.js` (and its own `Scripts\System\`), so the project used to be copied straight into `Scripts\`, replacing the player's `main.js` and putting generic folders (`addons\`, `common\`, `lang\`, `assets\`, `profiles\`) next to whatever the player already had. The whole project now lives in `Scripts\ExpansionPack\`, which is the git repository, and installing it comes down to one line in the player's own `Scripts\main.js`: `import "./ExpansionPack/main.js";` (now a dynamic import, see ADR 0019). The code finds its folder from that fixed name, written once in the PinballY host, rather than detecting where it was loaded from. The player's data (`profiles\`, `.env.local`) stays inside that folder, next to the code.

## Considered Options

- **Detect the folder at run time, so the player can rename it.** Rejected: ChakraCore may not offer `import.meta.url`, and renaming the folder gives the player nothing.
- **Keep the player's data in a separate folder, so an update can replace the code folder wholesale.** Rejected: two folders to back up instead of one, and the installer must preserve `profiles\` and `.env.local` anyway.
- **A formal Add-on API (`registerAddon`, a context object) for third-party Add-ons.** Rejected: nobody else writes Add-ons, `main.js` is already the loader, the Add-ons are deliberately coupled (the Profile store first, a fixed order), and PinballY never unloads a script.

## Consequences

- An update must never overwrite `profiles\` or `.env.local` inside the folder: that is the Distribution's job.
- `System\` is no longer inside the repository, not even ignored: the cabinet's local checks on it live outside the project.
