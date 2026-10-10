# Research: user accounts (profile picture, per-account Achievements, settings and filters)

Date: 2026-09-24. Sources: local PinballY help (`C:\vPinball\PinballY\Help\*.html`, cited as `Help/<file>` + section), PinballY source at commit `d84763e` (`https://github.com/mjrgh/PinballY/blob/d84763e/...#Lnn`), and this repo. **Fact** = read in a primary source. **Inference** = my reading, not verified at runtime.

## Verdicts

| # | Question | Verdict |
|---|---|---|
| 1 | Drag-and-drop a profile picture | **No script drop API.** Native drop only installs *game media* for the selected game. Workarounds: hijack a custom media type (hacky), a Win32 file dialog through `dllImport` (plausible, untested), or a fixed "drop your image here" folder (simplest). |
| 2 | Showing the picture | **Feasible.** Drawing layers and custom-drawn popups draw JPEG/PNG from an absolute path. Menus cannot show images; a drawing layer can sit next to a menu. |
| 3 | Per-account storage | **Feasible, all script-side.** `optionSettings` accepts any custom key; it is one global file. PinballY's own play stats (`playCount`, `playTime`, `lastPlayed`, rating, favorite) are global per table, so per-account Achievements need the add-on to track its own per-account play stats. |
| 4 | Per-account PinballY settings / filters | **Settings: poor fit** (most need `save()` + `reload()`, which the conventions forbid and which reloads the whole UI). **Filters: workaround** (script filters / metafilters reading per-account lists). No native multi-profile concept; the nearest is separate `/Settings:` and `/GameStats:` folders per launch. |
| 5 | Account switching UX | **Feasible** via menus (main-menu entry, startup dialog through the wheel dialog module). No text input widget; naming requires a menu-driven letter picker, `keydown` capture, or pre-made names. |
| 6 | Project constraints | Pinning test is compatible if the first/default account keeps today's unprefixed keys. Several conventions shape the design (no `save()`, i18n, `wheel_dialog`, `main_menu`, host seam). |

## 1. Drag-and-drop and picking an image

**Facts**
- No JS event for file drops. The drop target is a native OLE `IDropTarget` registered on each view (`PinballY/MediaDropTarget.cpp#L17-L18`, `RegisterDragDrop`). `Drop()` hands files straight to `BaseView::DoMediaDrop` (`MediaDropTarget.cpp#L265-L280`, `BaseView.cpp#L680-L713`), which calls `PlayfieldView::DropFile` for each file. Nothing on these paths calls `js->FireEvent`. The JS events PinballY fires are listed in `PlayfieldView.cpp#L1439-L1739`; none is a drop event. `Help/EventTypes.html` lists no drop event either.
- What the native drop does: it installs the files as **media of the currently selected game**. It fails if no game is selected (`PlayfieldView.cpp#L18720-L18726`), and it asks for game details if the game has no system, manufacturer or year (`#L18826-L18838`, menu `"media drop needs gameinfo"`). It accepts ZIP/RAR/7z media packs and single files whose extension matches the media type of the drop area (`#L18731-L18805`). Files go to `game->GetDropDestFile(...)`, i.e. `<Media>/<type folder>/<game media name>.<ext>`.
- Scripts can define a custom media type with a "Drop File Here" button in the main window: `gameList.createMediaType({ ..., format: "Image", extensions: ".jpg .jpeg .png", hasDropButton: true })` (`Help/MediaTypes.html` § "Custom media types", `hasDropButton` l.173).
- What a script can observe: `menuopen` for `"media drop confirm"`, `"media drop confirm replace"`, `"media drop rename"`, `"media drop needs gameinfo"` (`Help/Menus.html` l.282-289), plus `command` events `MediaDropFirst..Last` and `MediaDropGo` (`Help/Commands.html` #MediaDropFirst). **But** when a single new file is dropped, `MediaDropGo()` runs directly with no menu and no command (`PlayfieldView.cpp#L18990-L19013`). The only trace is the success message, a popup whose `popupopen` name is the generic `"message"` (`PlayfieldView.cpp#L10822-L10842`).
- `dllImport` can bind any Win32 function, define C structs, and pass `Uint16Array` buffers that native code writes into (`Help/DllImport.html` § "An example", § "Defining C struct types", § "Strings"). Automatic `cbSize` filling only works for a member named exactly `cbSize` (§ "Auto "cbSize" struct elements"). `OPENFILENAMEW` uses `lStructSize`, so it must be set by hand with `dllImport.sizeof(...)` (§ "Getting the size of a native type"). A window handle for the dialog owner is available as `mainWindow.hwndFrame` (`Help/WindowObjects.html` l.110). COM interfaces can be used through `COMPointer` (`Help/COMPointer.html`).
- `createAutomationObject("ProgID")` is the equivalent of VB `CreateObject` (`Help/OLEAutomation.html`). `Scripting.FileSystemObject` is the documented example. This repo already reads files through `Scripting.FileSystemObject` + `ADODB.Stream` (`common/config.js`, `readEnvLocal`).

**Options, best first (inference)**
1. **Folder convention**: the player drops a PNG/JPG into e.g. `<PinballY>\Scripts\accounts\` (or names it after the account) using Windows Explorer; the add-on lists it with `FileSystemObject`. No native code. Weakness: not done from inside PinballY.
2. **Win32 file dialog** via `dllImport` (`comdlg32.dll GetOpenFileNameW`, owner `mainWindow.hwndFrame`), then `FileSystemObject.CopyFile` into the accounts folder. Risks: the modal dialog blocks PinballY's UI thread and may open behind a full-screen or topmost window; the `lpstrFile` member is a pointer inside a struct, and the help does not show a typed array stored in a struct pointer member (would need `dllImport.create("WCHAR[260]")` + `NativeObject.addressOf`, § "Native pointer types"). Mistakes can crash PinballY (`Help/DllImport.html`). Needs a prototype.
3. **`Shell.Application.BrowseForFolder`** with the "include files" flag: a COM call with no struct marshalling. Not in the PinballY help; a Windows Shell feature (unverified here).
4. **Hijack native drop**: a custom media type `"Player Avatars"` with `hasDropButton`; after the drop, find the file with `gameInfo.resolveMedia(...)` and move it into the accounts folder. It is tied to the selected game (which must be fully set up), the name is the game's, and completion is not reliably observable. Not recommended.

## 2. Displaying a profile image

**Facts**
- Drawing layers: `mainWindow.createDrawingLayer(zIndex)`, then `layer.draw(func, w, h)` or `layer.loadImage(filename)` (`Help/DrawingLayer.html`). `loadImage` needs a fully qualified path, JPEG/PNG (animated GIF also loads) and stretches to the window.
- Inside a drawing function: `dc.drawImage(file, x, y, width, height)`, "JPEG and PNG formats are supported; absolute path, or path relative to the PinballY program folder" (`Help/CustomDrawing.html` l.260), and `dc.getImageSize(filename)` (l.301). Drawing functions also run in popups (`showPopup({ draw })`) and launch overlays (`Help/CustomDrawing.html` intro).
- Popups accept `backgroundImage` (JPEG or PNG) and `draw` (`Help/Popups.html` l.80-101).
- Menu items only have `title`, `cmd`, `selected`, `checked`, `radio`, `hasSubmenu`, `stayOpen` (`Help/Menus.html`, item descriptor list). **No image in menus.**
- Paths: `systemInfo.programDir` (`Help/SystemInfoObject.html`), `gameList.getMediaDir()` (`Help/GameList.html`). The repo already builds `programDir + "\\Scripts\\..."` (`common/config.js`).
- The repo's Achievement Toast already draws on a `mainWindow` drawing layer above menus (`docs/adr/0003-...`), so an avatar layer next to an account menu follows an existing pattern.

**Inference**: an account picker = a `showMenu` list of names + a drawing layer showing the highlighted account's avatar. Following the highlight needs the menu's current item; the help documents no "menu item highlighted" event (see Open questions). Showing all avatars at once in a custom-drawn popup is the safe option.

## 3. Persisting per-account data

**Facts: PinballY**
- `optionSettings`: an in-memory name/value map saved to `Settings.txt`. Custom names are allowed ("arbitrarily extensible"), all names share one flat namespace, values are strings (`Help/OptionSettingsObject.html` § intro, § "Variable names", § "Variable types"). No documented size limit. PinballY saves by itself before quitting, before a launch, before the Options dialog, and after about 15 s idle (`Help/SettingsEvent.html` § "Save events").
- `Settings.txt` is **one file for the whole install**, which can be moved with `/Settings:dir` (`Help/CommandLine.html`).
- Per-table stats live in `GameStats.csv` (`Help/DirectoryInfo.html` #gameStatsCsv; moved with `/GameStats:dir`). Columns: Game, Last Played, Play Count, Play Time, Is Favorite, Rating, Audio Volume, Categories, Is Hidden, Date Added, High Score Style, Marked For Capture, Show When Running (`PinballY/GameList.cpp#L118-L130`). All **global, one value per table**. No JS API for custom columns (`Help/GameList.html`).
- `gameInfo.update()` can write `playCount`, `playTime`, `lastPlayed`, `rating`, `isFavorite`, `isHidden` (`Help/GameInfo.html` § "Updating metadata").

**Facts: this repo**
- All progress is in `optionSettings` under `custom.*`: Period Table locks, Streaks, Periods Played, Random Game count, session stats, `custom.achievements.notified.<id>` (`tests/project/persisted_data_pinning.test.js`, `EXPECTED_FIXED_KEYS`; `common/achievements.js` l.26-30; `session_stats_tracker.js`).
- Player preferences are in `.env.local`, read synchronously through COM when modules load (`docs/adr/0002-user-settings-in-env-local.md`, `common/config.js`).
- Many Achievements are **computed from PinballY's global stats**, not stored: collection / manufacturer / decade / category completion use `game.playCount > 0` (`achievements/collection_completion.js` l.23, `manufacturer_completion.js` l.32), play-time milestones sum `game.playTime` (`achievements/play_time_totals.js` l.22). Period Table and Random Game use `game.lastPlayed` (`common/period_table.js` l.43-49, `common/random_game.js` l.36-38). Only the Notified flags and the session / period counters are the add-on's own data.
- `tests/project/persisted_data_pinning.test.js` fixes the exact key strings and Achievement IDs and "must keep passing unchanged" (header; `.claude/rules/conventions.md` § Tests).

**Inference**
- Per-account Achievements are **not just a key prefix**. Everything computed from `playCount` / `playTime` / `lastPlayed` would show the same values for every account. The add-on would have to record per-account play (count, time, last played per `configId`) from `gamestarted` / `gameover`, which it already listens to (`session_stats_tracker.js` l.64, 85), and feed Achievements from that. Before accounts existed, play history belongs to nobody: decide whether it goes to a default account.
- Swapping `GameStats` values with `gameInfo.update()` on account switch is technically possible but writes the XML/CSV databases for every table and fights PinballY's own counters. Not recommended.
- Pinning test compatibility: keep the **default account on today's unprefixed keys** and prefix only the other accounts (e.g. `custom.accounts.<accountId>.…`). The scripted session in the test (no account chosen) then writes exactly the same keys. Storing many accounts × tables as `optionSettings` keys bloats `Settings.txt`; a JSON file per account (written with `ADODB.Stream`, like `.env.local` is read) is the alternative, at the cost of file I/O wrapped in `safeHandler`.
- Profile images belong in a folder (not in settings); `optionSettings` or the account file stores only the file name.

## 4. Per-account PinballY settings and filters

**Facts**
- `optionSettings.set()` changes memory only. A few system variables take effect immediately; **most need `save()` then `reload()`**. `reload()` also reloads the game databases, rescans table folders and restarts playing media. It "should be infrequent", "only in response to an explicit user action" (`Help/OptionSettingsObject.html` § "Effects of changing a variable", `reload()` l.278). The help does not say which variables take effect live.
- Filters: `gameList.createFilter(desc)` returns a command ID; `getCurFilter()`, `setCurFilter(id)` (no `filterselect` fired), `getAllFilters()`, `createMetaFilter(desc)` / `removeMetaFilter(id)`, `refreshFilter()` (`Help/GameList.html`; `Help/MetaFilters.html`). The current filter is kept in `Settings.txt` (`Help/OptionSettingsObject.html` intro: settings store "which filter is active").
- Favorites, ratings, categories and hidden flags are global `GameStats.csv` columns (see §3).
- **No native multi-player or profile concept** anywhere in the help (no hits for "profile", "multiple players", "multiple users"). The only natively separable state is a separate `/Settings:dir` and `/GameStats:dir` per launch (`Help/CommandLine.html`; parsed in `PinballY/Application.cpp#L275-L290`).

**Inference**
- Per-account **filters** are feasible in script: a filter or metafilter whose `select(game)` reads the active account's list (own favorites, own "played", own hidden tables), with `refreshFilter()` / `setCurFilter()` on account switch. Remembering each account's last filter is just a stored filter ID restored with `setCurFilter()`.
- Per-account **PinballY settings** (volume, layout, attract options…) conflict with `.claude/rules/conventions.md` ("do not call `save()`") and with the UI reload cost. Only this repo's own `.env.local` preferences (language, sounds, toast duration) are realistic per account. They are read once at load, so per-account values would need a runtime lookup instead of the frozen `config` object.
- Separate `/Settings` + `/GameStats` folders per account (one shortcut each) give full native separation without script work, but switching means restarting PinballY and the collection (table list, categories) is split too.

## 5. Account switching UX

**Facts**
- Menus: `mainWindow.showMenu(id, items, options)`; custom command IDs from `command.allocate()` (`Help/Menus.html`; `Help/Commands.html` l.76-81). `menuopen` does not fire for `showMenu` menus (`Help/MenuEvent.html`).
- Events usable for "who is playing?": `wheelmode` on return to the wheel (`Help/WheelModeEvent.html`), `attractmodestart` / `attractmodeend` (`Help/AttractModeEvent.html`), `gamestarted` / `gameover` (already used in the repo).
- Text input: no text field, input box or on-screen keyboard in the API (no hits in `Help/*.html`). `keydown` gives `key` as the typed character, Shift/CapsLock applied (`Help/KeyEvent.html` § Properties), so a keyboard is required for free typing.

**This repo**: spontaneous dialogs go through `getWheelDialogs().submit(...)` with a `DIALOG_PRIORITY` (`common/wheel_dialog.js` l.17-20; startup prompt `startup_choice_prompt.js`). Main-menu entries go through `getMainMenu().add(...)` with a `MAIN_MENU_POSITION` (`common/main_menu.js` l.15-21).

**Inference**
- Startup "Who is playing?" = a new top-priority wheel dialog (before `STARTUP_PROMPT`), one button per account. "Switch player" = a main-menu entry. On attract mode end, optionally ask again.
- Account creation with a name needs an arcade-style letter picker (menu with `stayOpen` items or a drawing layer driven by flipper buttons), or `keydown` capture drawn on a layer, or a name typed in `.env.local` / a file. Creating accounts outside PinballY (folder or file) avoids a text-entry UI entirely.

## 6. Project constraints

- New Add-on at root, registered in `SCRIPTS` of `main.js`, switchable via `addOns` in `common/config.js`; shared code in `common/`; host seam `common/pinbally_host.js` for testable shared modules (`.claude/rules/conventions.md`).
- Every visible text through `common/i18n.js` in all six `lang/` files; account *names* are user data, not i18n.
- No `optionSettings.save()` (conventions § Modules et globales), which limits per-account PinballY settings (§4).
- Handlers and file I/O wrapped in `safeHandler`.
- Pinning test keys and Achievement IDs frozen: see §3 default-account strategy. Achievement IDs themselves need not change; only the storage key does.
- `docs/adr/0001` keeps Achievements reading PinballY globals directly. Per-account play stats would reopen that decision, since the definitions would read an account-aware source instead of `game.playCount` / `playTime`.
- The Achievement Toast and the Achievement List would need to know the active account (whose Notified flags, whose list).
- Glossary: "Account" / "Player" is not in `CONTEXT.md` yet.

## Open questions / unknowns (not verified from a primary source)

1. Does a `GetOpenFileNameW` or `IFileDialog` call from `dllImport` work in PinballY (struct pointer member, dialog z-order over a full-screen window, UI thread blocked)? Needs a `/prototype`.
2. Does `Shell.Application.BrowseForFolder` with the include-files flag work through `createAutomationObject` in PinballY's 64-bit build?
3. Does PinballY lock an image file while it is displayed (`drawImage` / `loadImage`), which would block replacing or deleting an avatar in use?
4. Is there any way to know which item of a `showMenu` menu is highlighted (to update an avatar as the player scrolls)? Not documented in `Help/Menus.html` or `Help/MenuEvent.html`.
5. Which `Settings.txt` variables take effect without `reload()`? The help only says "some".
6. Can two PinballY instances run at once, or can a script restart PinballY with other `/Settings` / `/GameStats` folders? No single-instance rule found, not tested.
7. Is there a practical size limit for `Settings.txt` with many `custom.accounts.*` keys? Not documented.
8. Should past play history (global `GameStats`) be credited to a default account, to all accounts, or to none? Product decision, not an API question.
