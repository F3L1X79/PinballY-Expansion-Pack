# Install

[← Guide index](index.md)

## What you need

- **Windows** and **PinballY 1.1.0 Beta 10** or later.
- The *Windows Media Player* optional feature of Windows, for the sounds. Windows 10 and 11 install it by default, so there is nothing more to install; only the "N" editions sold in Europe lack it, and Microsoft's free *Media Feature Pack* adds it.
- No git: the release zip is all you need.

## Step by step

1. **Download `ExpansionPack.zip`** from the latest release: https://github.com/F3L1X79/PinballY-Expansion-Pack/releases/latest (not "Source code (zip)", whose folder is named `PinballY-Expansion-Pack-<version>` and isn't found by the pack).
2. **Extract it into `PinballY\Scripts`**. The zip already holds a folder named `ExpansionPack`, the name the pack looks for: you should get `PinballY\Scripts\ExpansionPack\main.js`, not `ExpansionPack\ExpansionPack\main.js`.
3. **Create `PinballY\Scripts\main.js` with only this line** if the file doesn't exist, or **add this line to it** if it does:
   ```js
   import("./ExpansionPack/main.js").catch(e => logfile.log("ExpansionPack: " + e.message));
   ```
   Your own scripts keep running: nothing else in `Scripts` is touched, and they still run if the pack folder is missing or the pack fails to load (the error goes to `PinballY.log`).
4. **Optional: create `ExpansionPack\.env.local`**, only if you want to change a setting the Expansion Pack Settings don't cover (see [Settings](settings.md)): copy `ExpansionPack\.env.example` and keep the lines you change, one `KEY=value` per line (UTF-8). Without it, the pack runs with its defaults.
5. **Optional: install vpxtool** (see below).
6. **Optional: update PINemHi to 3.6.8** (see below).
7. **Restart PinballY** and check `PinballY.log` (see [First start](#first-start)).
8. **Choose your Add-ons** from **Expansion Pack Settings** in the Operator Menu: turn each one on or off, pick the startup screen and the language, then restart PinballY in one press.

## vpxtool

With vpxtool, each table's ROM is filled in by itself (the Table ROMs Add-on). Download `vpxtool` for Windows from its releases page (https://github.com/francisdb/vpxtool/releases) and put `vpxtool.exe` in `ExpansionPack\tools`, next to the restart helper already there.

Without it, a table's ROM is still found, after its first Play, and a "Problem" toast says at each start that `vpxtool.exe` is missing (to Admin Profiles only, or to everyone if none is marked): install it, or turn the Table ROMs Add-on off in the Expansion Pack Settings.

## PINemHi 3.6.8

With PINemHi 3.6.8, the High Scores read the boards of about 300 more ROMs.

1. Replace the files of `PinballY\PINemHi` with those of [PINemHi 3.6.8](https://www.pinemhi.com/).
2. **Append the whole `[romfind]` section of its `romfind.ini` to the end of its `pinemhi.ini`**. PinballY reads that section from `pinemhi.ini` only: without it, a table with an empty ROM field gets no board at all.
3. Set `USER=` in `pinemhi.ini` to Visual Pinball X's `User` folder.

## First start

After restarting PinballY, check `PinballY.log`: it lists your overrides, one "initialized" line per Add-on, and `ERROR` lines naming the Add-on at fault.

PinballY starts a new `PinballY.log` at each launch, so the pack also keeps every error in `Scripts\ExpansionPack\errors.log`, across launches: see [Troubleshooting](troubleshooting.md).

Once the cabinet has two Profiles or more besides Guest, PinballY starts on Change Player; see [Profiles](profiles.md) and the `STARTUP_SCREEN` setting in [Settings](settings.md).

## Backing up and uninstalling

Everything the pack keeps stays in `Scripts\ExpansionPack`: your settings (`.env.local`) and each Profile's progress (`profiles`).

- **To back up**, copy that folder.
- **To reinstall or update by hand**, keep the `profiles` folder, and you get your progress back.
- **To uninstall**, delete it and remove the import line from `Scripts\main.js`.

## Installing with git

For contributors: instead of the zip, run `git clone https://github.com/F3L1X79/PinballY-Expansion-Pack.git ExpansionPack` from `PinballY\Scripts`, then follow the steps from step 3. A pack installed with git is never offered [updates](updates.md): run `git pull` instead.

---

[← Guide index](index.md)
