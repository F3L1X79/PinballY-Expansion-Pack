# Updates

[← Guide index](index.md)

## The Update Prompt

At each start, PinballY asks GitHub in the background whether a newer version of the pack is out, without slowing the start down; offline, it only writes one line in `PinballY.log`.

When there is one, the next start opens the Update Prompt before anything else, titled "Update available": "Expansion Pack vX.Y.Z is available.", with "Update now" and "Later". It waits for a start where the last player sees the setup entries (an [Admin Profile](settings.md#admin-profile), or anyone while no Profile is marked).

## Update now

"Update now" downloads and checks the new version, closes PinballY, swaps the pack's folder for the new one, and starts PinballY again. The next start says so under "Update complete": "Expansion Pack updated to vX.Y.Z".

These are kept:

- your settings (`.env.local`);
- the Profiles (`profiles`);
- the files you put in `tools`, `vpxtool.exe` included;
- your own sounds and Default Score images;
- the Error Log, `errors.log`.

## When an update fails

- A download that fails before PinballY closes is told at once under "Update not possible": "The Expansion Pack stays as it is."
- If the update failed after PinballY closed, the previous version is still in place, and a "Problem" toast tells whoever sees the setup entries where to read why (see [Troubleshooting](troubleshooting.md)).

## Later

"Later" is not asked again for that version: "Update to vX.Y.Z" stays in **Expansion Pack Settings** until you update.

## Turning the check off

Set "Update check" to "Off" in **Expansion Pack Settings**, or write `UPDATE_CHECK=false` in `.env.local`: the cabinet then never contacts GitHub.

A pack installed with git is never checked nor offered updates: run `git pull` in `Scripts\ExpansionPack`.

## Going back to the previous version

Close PinballY: the previous version is kept next to the pack as `Scripts\ExpansionPack.old-<date>` (the newest one only).

1. Copy `profiles`, `.env.local` and `pack_update.json` into it from `Scripts\ExpansionPack`, to keep the progress made since the update (and not be told that the update failed).
2. Rename `ExpansionPack` to anything else.
3. Rename that folder to `ExpansionPack`.

---

[← Guide index](index.md)
