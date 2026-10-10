# Contributing to PinballY Expansion Pack

PinballY Expansion Pack is plain JavaScript run as-is by [PinballY](http://mjrnet.org/pinscape/PinballY.php)'s scripting engine: no build step, no dependencies. This guide is for developers and translators; players will find everything they need in the [README](README.md).

Bugs and ideas: [GitHub issues](https://github.com/F3L1X79/PinballY-Expansion-Pack/issues).

## Vocabulary

The project's words (Profile, Avatar, Table of the Day, Challenge, Achievement, Achievement Rank…) are defined in the glossary, [CONTEXT.md](CONTEXT.md). Use them in code, comments, issues and user-facing texts. Design decisions are recorded in [docs/adr/](docs/adr/).

## Layout

The repository is the pack's folder, installed as `PinballY\Scripts\ExpansionPack` under that fixed name and started by one `import` line in the player's own `Scripts\main.js` ([ADR 0009](docs/adr/0009-the-project-lives-in-its-own-scripts-subfolder.md)). The folder name is written once, in `common/pinbally_host.js`.

- `main.js` is the only script at the root. It starts the Add-ons listed in `SCRIPTS`, each one isolated so that a failing Add-on does not stop the others.
- `addons/` holds exactly one file per Add-on started by `main.js`. Each exports a default initialisation function, and each can be turned off with its `ADD_ON_*` setting.
- `common/` holds the shared code, which is never an Add-on.
- `achievements/` holds the Achievement definitions, one file per Achievement Family.
- `lang/` holds the translations, `assets/images/` the images drawn by the scripts, `assets/sounds/` the sounds they play, `profiles/` the Profiles' saved progress, and `tests/` the tests.
- `tests/` only holds subfolders: one per feature (`achievements/`, `welcome_screen/`, `drawn_menu/`…), plus `common/` for the shared modules, `project/` for the checks on the whole project and `support/` for the fake PinballY host. A feature's `*_reader.js` and `*_scenario.js` helpers stay in its folder.
- `maintainer/` holds the maintainers' Node.js scripts, run by hand and never loaded by PinballY. They are `.mjs` files, so that the checks on the scripts PinballY loads leave them out. `maintainer/avatar_frames/` paints the Avatar Frame images of `assets/images/avatar_frames/` (`node maintainer/avatar_frames/generate_frames.mjs [numbers]`).

`tests/project/file_layout.test.js` checks this layout.

`.gitattributes` leaves `maintainer/`, `tests/`, the docs (except `docs/images/`, shown by the README), `CONTEXT.md` and this file out of the downloaded zip: the players only get the pack.

### Shared modules

- `pinbally_host`: the only way from a shared module to PinballY's globals, so that tests can run on a fake host (`tests/support/fake_pinbally_host.js`).
- `profile_store`: the only module that reads and writes the `profiles` folder (see [Progress and reset](#progress-and-reset)).
- `profile_reset_menu`: the Profile Reset's Profile list (one Profile or every Profile), confirmation and outcome message, opened from the Exit menu.
- `period_table`: the Table of the Day and the Table of the Week, and their Streaks.
- `random_game`: the Random Game.
- `wheel_dialog`: spontaneous dialogs from Add-ons, shown one at a time when the wheel is free, by priority.
- `achievement_toast`: Achievement Toasts, Challenge Toasts, Mastery Toasts and Level Toasts, drawn in the bottom-right corner of the playfield screen, never as a dialog.
- `player_level`: the Player Level worked out from a Profile's Notified Achievements, never persisted.
- `steamball_palette`: the colours and fonts shared by the Achievement List, the Achievement Toast and the Challenge Card, so that they look like one product.
- `main_menu`: every main menu entry after "Play", placed by a fixed position. Only a PinballY filter may reach the main menu on its own, through `createFilter({ group: "[Top]" })`.
- `i18n`: every text shown to the player, in the active language.
- `safe_handler`: wraps event handlers and callbacks so that an error is logged with the script's name instead of being lost.

## Conventions

- Code, comments, file names and log messages are in English. Only texts shown to the player are translated, and only in `lang/`.
- Every `.js` file starts with a header block saying what it does, when it runs and its side effects. No JSDoc: a short `//` comment where a name is not enough, explaining *why* rather than *what*.
- ES modules only (`import` / `export`), no global variables besides those PinballY provides.
- `const` by default, `let` when reassigned, never `var`; always `===` / `!==`.
- `camelCase` for functions and variables, `UPPER_SNAKE_CASE` for module constants, `snake_case.js` for file names.
- No text shown to the player is hard-coded: it goes through `common/i18n.js`, and every new key is added to all six languages.
- Event handlers and asynchronous callbacks are wrapped in `safeHandler(SCRIPT_NAME, ...)`. Never swallow an error silently.
- Never call `optionSettings.save()`: PinballY saves on its own, and saving during a game can record the hidden backglass state.
- No external library or build step.

## Tests

```
node --test
```

Run from the project root with Node.js 22 or later; nothing to install. PinballY never loads the tests.

`tests/project/persisted_data_pinning.test.js` locks the saved data format and every Achievement ID: they are the Profiles' progress. Never change it to make a change pass.

## Adding a language

Translations live in `lang/<code>.js`. English is the fallback, and missing keys are listed in `PinballY.log`.

1. Copy `lang/fr.js` to `lang/<code>.js`. Not `en.js`: PinballY's own menus are already in English, so its sections for them are empty or nearly so.
2. Translate the texts, keeping the keys, the `[Game.Xxx]` markers and the `${...}` parameters unchanged.
3. Register it in `common/i18n.js`: one `import` and one entry in `AVAILABLE_LANGUAGES`, then add its code to `LANGUAGE_CODES` in `tests/project/lang_keys.test.js`.
4. Save the file as UTF-8 with BOM, like the other language files, and run `node --test`.

## Progress and reset

Each Profile's progress lives in `Scripts\ExpansionPack\profiles\<Profile>\profile.json`: its plays, Streaks, Random Games, session stats, Challenge progress and the list of Notified Achievements. Next to it, `play-log-<year>.json` holds its Play Log: every Play (a game of at least one minute) started that year, with its start, table and seconds. `Scripts\ExpansionPack\profiles\cabinet.json` holds what the household shares: the active Profile, the Table of the Day, the Table of the Week and the week's Challenge. Every save keeps the previous version as `*.bak.json`, and a missing or broken file comes back from it.

Every Achievement counts the plays recorded for the active Profile since installation; PinballY's own statistics are not used.

An Admin Profile starts a Profile over from the Exit menu ("Reset profile", see the README): its play-based data is erased, its marks stay, its former file is kept as `profile.reset-<date>.json` and each Play Log year file as `play-log-<year>.reset-<date>.json` (the Play Log's backups are deleted).

To reset by hand, close PinballY first, then:

- start a Profile over without an Admin Profile: delete both its `profile.json` and `profile.bak.json`, and its `play-log-*.json` files (the Avatar stays, the marks go);
- announce every Unlocked Achievement again: empty the `"notified"` list (`"notified": []`) in its `profile.json`;
- remove a Profile: delete its folder, or rename it with a leading `_` to hide it (the `guest` folder always comes back);
- make Guest active and draw new Period Tables: delete both `cabinet.json` and `cabinet.bak.json`.

## Upgrading from an edited `config.js`

Older versions were set up by editing `common/config.js`. Move your values into `.env.local` (see [.env.example](.env.example)), then run `git checkout common/config.js` before pulling.

## PinballY scripting

- The reference: `PinballY\Help\Javascript.html` in your PinballY folder, also [online](https://mjrnet.org/pinscape/downloads/PinballY/Help/PinballY.html).
- Examples: [PinballY-Addons-and-Examples](https://github.com/PinballY/PinballY-Addons-and-Examples).
