# PinballY official examples: reference sheet

Source: https://github.com/PinballY/PinballY-Addons-and-Examples (shallow clone of `main`, read 2026-09-23), plus its `wheel-actions` submodule (stephenhouser/PinballY-Wheel-Actions). Where the examples say nothing, the local PinballY Help (`C:\vPinball\PinballY\Help\*.html`) is cited; it is the authoritative API doc and is more reliable than the examples.

**Big caveat:** most examples are community drop-ins written as classic top-level scripts (no modules, `var`, `==`, globals, hard-coded `C:\PinballY` paths). Several have real bugs (listed per entry). The ones by Michael J Roberts (MJR, PinballY's author), which are BatchCategoryTagging, CategoryButtons and MissingMediaFilter, plus additional_filters (copied from his Help), are the most trustworthy.

---

## 1. Per-example entries

### additional_filters (from MJR's Help "Top Games" example)
- Adds rating filters to the native "[Rating]" filter group.
- APIs: `gameList.createFilter({id, title, menuTitle, group, sortKey, select, before, after})`, `gameList.getAllGames()`, `game.rating`, `game.playTime`.
- Technique: **before/select/after filter lifecycle.** Do the expensive work once per filter pass in `before()` (sort all games, build a `Map` by `game.id`), make `select()` an O(1) lookup, and free the map in `after()`.
  ```js
  before: () => { top = new Map(gameList.getAllGames().sort((a,b)=>b.rating-a.rating).slice(0,n).map(g=>[g.id,g])); },
  select: game => top.get(game.id),
  after:  () => { top = undefined; }
  ```
- `group: "[Rating]"` puts the filter in an existing native submenu. `sortKey` controls where it sorts in that group ("9 ..." puts it after the star items and before "Z" Unrated).

### auto_shutdown
- Starts a 60-minute countdown when attract mode starts, shows it on the attract status line, then sends `command.PowerOffConfirm`.
- APIs: `mainWindow.on("attractmodestart" / "attractmodeend")`, `setInterval`/`clearInterval`, `mainWindow.statusLines.attract.setText(0, text)`, `mainWindow.doCommand(command.PowerOffConfirm)`, `logfile.log("[PowerOff] ... %d", n)` (logfile takes printf-style args).
- Notes: it **overwrites an existing status-line slot** instead of adding one. The author says "adding/removing status lines appears to make PinballY unstable" and that at least one attract status line must already exist.

### BatchCategoryTagging (MJR)
- Operator menu command. It opens a menu of categories, then a checkbox list of every game, then Save applies the category changes.
- APIs: `command.allocate(name)`, `mainWindow.on("menuopen")` + `ev.addMenuItem({after: command.BatchCaptureStep1}, item)`, `mainWindow.showMenu(id, items, {dialogStyle, noAnimation, pageNo})`, `command.MenuPageUp/MenuPageDown/MenuReturn`, `gameList.getAllCategories()`, `game.categories`, `game.update({categories})`.
- Techniques:
  - **Dynamic commands with two-way maps.** It allocates one command per category or game the first time it is needed and caches it (`categoryToCommand`/`commandToCategory`), so re-opening the menu never allocates again. Command IDs are finite (see §2.3).
  - **Checkbox menu that stays open.** Items have `checked: bool, stayOpen: true`. After each toggle it calls `showMenu` again with `noAnimation: true, pageNo: "same"` and `selected: true` on the toggled item, so the cursor stays put.
  - Paged long menus: put `{cmd: command.MenuPageUp}` / `{cmd: command.MenuPageDown}` around the list.
  - Persists through `game.update({...})`, which writes to the game database.

### CategoryButtons (MJR)
- Left and right Ctrl keys cycle through the category filters.
- APIs: `mainWindow.on("keydown")`, `ev.code`, `ev.preventDefault()`, `gameList.getCurFilter().id`, `gameList.setCurFilter("Category.<name>" | "All")`, `localeCompare(..., {sensitivity:"accent"})`.
- Technique: category filter IDs follow the pattern `Category.<name>`. Parse the current filter id to find out where you are.
- Help note: `setCurFilter()` does **not** fire `filterselect`. It fires `gameselect` only if the selected game had to change. wheel-actions works around this with `mainWindow.doCommand(filterInfo.cmd)`, which does fire it.

### command_example (ShowTableSetup.js)
- The minimal template: allocate a command, insert it into the main menu after Play, and run a system command when it is chosen.
  ```js
  let cmd = command.allocate("showTableSetup");
  mainWindow.on("menuopen", ev => { if (ev.id == "main") ev.addMenuItem({after: command.PlayGame}, {title:"Table setup", cmd}); });
  mainWindow.on("command", ev => { if (ev.id == cmd) mainWindow.doCommand(command.ShowGameSetupMenu); });
  ```

### FlexDMD (FlexDMD.js, community, several unrelated features in one file)
1. **FlexDMD over COM.** `createAutomationObject("FlexDMD.FlexDMD")` is created lazily on first use. It drives `dmd.NewUltraDMD()` scenes, brackets rendering with `dmd.LockRenderThread()`/`UnlockRenderThread()`, and uses `createAutomationObject("Scripting.FileSystemObject")` for `FileExists`.
   - **Self-rescheduling timer with debounce:** `UpdateDMD()` first does `if (updater !== undefined) clearTimeout(updater)`, then ends with `updater = setTimeout(UpdateDMD, 10000)`. When still rendering the same game it reschedules itself after 1 s instead of blocking.
   - Pauses the COM DMD on `prelaunch` (`dmd.Run = false`) and resumes on `postlaunch`. **prelaunch/postlaunch bracket the whole launch**, including the Run Before/After steps.
   - `gameList.on("highscoresready", ev => ev.success, ev.game, ev.scores)`: high scores arrive asynchronously, per game.
   - Author notes that PinballY didn't fully marshal COM objects at the time. Some FlexDMD APIs (Stage.AddActor) failed.
   - Iterating all games: `gameList.getGameCount()` + `gameList.getGame(i)`.
2. Launch overlay image: `launchoverlayshow` → `mainWindow.launchOverlay.bg.loadImage(gameList.resolveMedia("Images","launch-image.jpg"))` + `ev.preventDefault()`. It restores on `gamestarted` with `launchOverlay.bg.clear(0xff404040)`.
3. Random game: **off-by-one bug** (`Math.random() * (count + 1)` can index past the end).
4. FX3 hotseat / play-mode menus: `mainWindow.playGame(game, {overrides: {params: "..."}})`. Detects the system with `/pinball fx3\.exe$/i.test(game.system.processName)`. Intercepts `command.PlayGame` and calls `ev.preventDefault()` to replace the launch. Keeps state in `optionSettings.get("custom.fx3.playMode", "classic")` / `set(...)`. Menu items use `radio: bool`.
   - Bug: it compares `ev.id == command.Hotseat2Mode`. That works only because `command.allocate("Hotseat2Mode")` also defines `command.Hotseat2Mode` (see §2.3).
   - Pattern: a *submenu* opened from a command handler calls `ev.preventDefault()` ("tell the system not to launch the game yet").
- Uses `var`, extends `Number.prototype` (don't copy either).

### menu_submenu_batch_file
- Adds a main-menu entry that opens a custom submenu of 4 colour items. Choosing one runs a hidden `.bat` with a parameter (the author drives a smart-home LED strip through curl).
- APIs: `dllImport.bind("Shell32.dll", \`HINSTANCE ShellExecuteW(HWND, LPCWSTR, LPCWSTR, LPCWSTR, LPCWSTR, INT);\`)`, `result.toNumber() > 32` success check, `mainWindow.message(text, "error")`.
- Technique: **fire-and-forget external process through ShellExecuteW.** It returns immediately and does not block the UI. Compare with a synchronous wait (see §2.8).
- Bugs: `SW_HIDE` is never defined (it should be `const SW_HIDE = 0`). Very generic command names (`"blue"`, `"red"`) risk colliding with other scripts' `command.<name>`. `Shell32` is declared at the bottom with `let`, which works only because it is first used inside handlers that run later.
- It also notes that a direct HTTP call would do the same job without the batch file (see `HttpRequest` in Help).

### meta_filters (meta_filter.js, meta_filter_tableType.js)
- A submenu that applies a **metafilter** which narrows the current filter (for example "VPX only" and then "≥3 stars").
- APIs: `id = gameList.createMetaFilter({includeExcluded, priority, select(game, included)})`, `gameList.removeMetaFilter(id)`. Creating or removing one takes effect immediately.
- Semantics: with `includeExcluded: false`, `select` sees only the games that are already included, so it can narrow further. With `true`, it sees every game and can widen (`return included || extra`). A higher `priority` runs later and gets the last word.
- Bugs: IDs are overwritten (the 3★ filter is stored in `meta_4star_id`), so "Remove" leaks filters. Filters stack when selected twice. Both files allocate the same command names and add the same menu, which the README warns about.

### MissingMediaFilter (MJR)
- Adds a filter listing games that are missing media, toggled from the Operator menu next to "Show Unconfigured Games".
- APIs: `gameList.createFilter` **returns the filter's command ID**. `game.resolveMedia(type, true)` returns an array of existing files (length 0 means missing). `gameList.getFilterInfo("All" | "Unconfigured" | "Hidden").cmd`, `gameList.getCurFilter().id`.
- Techniques:
  - A script filter's full id is **`"User." + id`** (it checks `getCurFilter().id == "User.MissingMedia"`).
  - **Toggle menu item:** when the filter is active, show it `checked: true` and point its `cmd` at the "All" filter's command, so selecting it again turns it off.
  - Anchor custom items to *other filters* with `{after: gameList.getFilterInfo("Unconfigured").cmd}`.
  - Media types (`"bg image"`, `"dmd video"`, `"wheel image"`...) are listed in Help › Media Types.

### PinMAME_functions (Tengri)
- Main-menu entry for PinMAME ROM volume and DMD registry settings, written through a helper AutoIt EXE.
- APIs: `game.resolveROM().vpmRom`, `createAutomationObject("Scripting.FileSystemObject")` (`FileExists`, `DeleteFile`, `OpenTextFile(path,1,false,0).ReadLine()`), `ShellExecuteW`, `command.allocate("-2")`, and then `ev.name` in the command event gives the **name the command was allocated with** (it encodes the value in the command name).
- Techniques: it pre-reads state by launching the EXE on `menuopen` (asynchronous, writes a temp file) and reads the file when the submenu opens. That is racy. Non-selectable header rows are `{title, cmd: -1}` (the code wrongly writes `Dummy,` as a shorthand property). It marks the current value with `radio: true` and `>>> x <<<` titles.
- Don't copy: `var`, hard-coded `C:\PinballY\Scripts\`, and generic command names such as `"0"` and `"1"`.

### seamless-launch (MJR's Help "Seamless Loading" example)
```js
mainWindow.on("launchoverlayshow", ev => { mainWindow.showWheel(false); mainWindow.setUnderlay(""); mainWindow.launchOverlay.bg.clear(0x20FF00FF); ev.preventDefault(); });
mainWindow.on("launchoverlayhide", () => mainWindow.showWheel(true));
```
- `preventDefault()` on `launchoverlayshow` suppresses the default overlay background. `bg.clear(0x20FF00FF)` is ARGB with alpha 0x20, so it is nearly transparent and the playfield video keeps showing.

### seamless-launch-spinner
- Same idea, but `mainWindow.launchOverlay.bg.loadVideo(gameList.resolveMedia("Videos", "Loading", "video"))` plays a transparent spinner. `.mov` files must be renamed to a supported extension to be found.

### show_instruction_card
- ArrowUp shows `instCardWindow` during play, ArrowDown hides it, ArrowLeft runs `command.Flyer`.
- Hack: `showWindow(false)`, then `createDrawingLayer(10000)`, then `showWindow(true)` on **every** key press. The author admits it is a workaround ("sometimes needed 4-5 presses"), and it leaks a new drawing layer on each press. The proper route is Help › Game Launch Options › "Keep these windows open while running", or the per-system *ShowWindowsWhileRunning* setting.
- `keydown` on `mainWindow` also fires while a game runs only if PinballY receives the key (`keybgdown` is the background variant; see Help's ExitByLongKeyPress example).

### sleep_computer
- Adds "Sleep Computer" to the **exit** menu: `ev.id == "exit"`, `ev.addMenuItem(command.PowerOff, {...})`. You can pass a command number directly as the position (it means "after").
- Techniques: `command.allocate("UserSleepCMD")` in main.js, then `command.UserSleepCMD` and `command.name(ev.id) == "UserSleepCMD"` in other files. **This is how commands are shared by name across files.**
- **Save settings before a hard exit:** `if (optionSettings.isDirty()) optionSettings.save();` before `PowrProf.SetSuspendState(0,0,0)`.
- Bugs: SleepCMD.js is C++ pasted into a .js file and not valid JS. UserSleepCMD.js calls `dllImport.bind` on every command (bind once at load instead). Help › LogOffExample shows the correct privilege dance (`OpenThreadToken`/`AdjustTokenPrivileges` through dllImport).

### start_random_table (GSadventure)
- "Start Random Game" in the main menu. A "wheel of fortune" animation presses NextPage and Next with accelerating and then decelerating delays, and finally calls `mainWindow.playGame(game)`.
- APIs: `gameList.getAllWheelGames()` (index 0 is the current game, then to the right, wrapping around), `mainWindow.doButtonCommand("Next" | "NextPage", true/false, 0)` (press + release), `game.configId`.
- Techniques: **async/await over a setTimeout promise** (`const timer = ms => new Promise(r => setTimeout(r, ms))`) instead of a busy loop. That is the correct non-blocking way to sequence UI steps. `no_animation` launches directly, but the README warns that backglass, DMD and instruction card media then are not switched to the new game.
- Bugs: the same `count + 1` off-by-one as FlexDMD, and `alert()` for debugging.

### two-tables-one-wheel (Stephen Houser, based on MJR's Custom Play Modes)
- Alternate versions of a table under one wheel item: "Play <Version> Version" entries are added after Play, and a metafilter hides alternates.
- APIs: `optionSettings.get(key, default)`, `optionSettings.getBool(key)`, `optionSettings.set(key, bool)`, `createMetaFilter`/`removeMetaFilter`, `ev.addMenuItem({after: command.PlayGame}, arrayOfItems)` (**accepts an array**), `ev.addMenuItem(gameList.getFilterInfo("Hidden").cmd, {..., checked})`, `mainWindow.playGame(game)` + `ev.preventDefault()`.
- Techniques: settings keys are prefixed `custom.`. A **growing pool of commands** is allocated only when more are needed (`allocateCommandIdsForAlternateVersions`) and reused afterwards. The filter state is restored from settings at load. It uses `export function` in a plain-imported script.

### wheel-actions (submodule; proof of concept)
- A fake "Wheel Actions" system whose "games" are `.js` files. Selecting one runs it instead of launching.
- Techniques:
  - A widening metafilter: `includeExcluded: true, select: (g, inc) => inc || isWheelAction(g)`.
  - Suppress the main menu for fake games: `ev.preventDefault(); ev.stopImmediatePropagation();` in `menuopen` (the comment says the menu still pops up with other listeners otherwise).
  - **Dynamic `import(path).then(m => m.doAction())`**, with an explicit `try { } catch (e) { logfile.log(e.stack); throw e; }` because "errors in async-loaded modules are not caught by PinballY's normal error logging".
  - `gameList.getAllFilters().find(f => f.id == id).cmd` + `mainWindow.doCommand(cmd)` to change filters **and** fire `filterselect`.
  - The Most Played filter is created lazily on first use with the before/select/after pattern.

---

## 2. Idioms and best practices (synthesized)

### 2.1 Script structure
- The official examples are top-level scripts: code runs at `import` time and registers listeners directly. Helper modules use `export function` plus `import {x} from '../file.js'` (wheel-actions, two-tables). Our project's `export default init()` + `main.js` loop is stricter and fine.
- Put user-tunable constants at the top of the file (every community example does this). Our `common/config.js` centralises it.
- Keep one concern per file. FlexDMD.js shows what goes wrong otherwise: 4 features, duplicated `menuopen`/`command` handlers, and conflicting command names.

### 2.2 Events
- `mainWindow.on("menuopen" | "command" | "keydown" | "launchoverlayshow" | "launchoverlayhide" | "gamestarted" | "gameover" | "prelaunch" | "postlaunch" | "attractmodestart" | "attractmodeend", fn)`, and `gameList.on("gameselect" | "filterselect" | "highscoresready", fn)`.
- `ev.preventDefault()` cancels the system action (a launch, a menu, the overlay background, key handling). `ev.stopImmediatePropagation()` stops later listeners on the same target.
- Help (EventTarget): `on("event.MyNamespace", fn)` + `off("event.MyNamespace")`, `one(...)` / `{once: true}` for one-shot listeners, and `on(events, data, fn)` passes `ev.data`. None of the examples use these, but they are the clean way to remove your own listeners.
- **Launch event order** (Help › LaunchEvent): `prelaunch` → window blanked → `runbeforepre` → "Loading Game" → `runbefore` → launch → **`gamestarted`** → play → "Game Exiting" shown → **`gameover`** → Run After → `runafter` → window blanked → `runafterpost` → **`postlaunch`**. `launcherror` replaces gamestarted/gameover when a launch fails. The FlexDMD example resumes UI work on **`postlaunch`**, not `gameover`.
- `gamestarted` timing is unpredictable (VP opens its editor window first). Help suggests a timeout if you need "really ready".

### 2.3 Commands
- `const id = command.allocate("UniqueName")` **once at startup**. IDs are finite (UserFirst..UserLast) and are **not stable across sessions**, so never persist them. The name also becomes `command.UniqueName`, and `command.name(id)` / `ev.name` return it. Use unique, prefixed names. Examples with `"red"`, `"0"` or `"removeMeta"` in two files collide.
- For dynamic lists, allocate lazily and cache in `Map`s (BatchCategoryTagging, two-tables).
- Dispatch in a single `mainWindow.on("command")` with `if (ev.id === X)`. Run system actions with `mainWindow.doCommand(command.X)`. Simulate buttons with `mainWindow.doButtonCommand(name, down, 0)`.
- To replace a system command (for example PlayGame for FX3), handle `command.PlayGame`, call `mainWindow.playGame(game, {overrides: {params}})`, and then `ev.preventDefault()`.

### 2.4 Menus
- Extend system menus in `menuopen`: check `ev.id` (`"main"`, `"operator"`, `"exit"`, ...), then `ev.addMenuItem(position, itemOrArray)`. The position can be `{after: cmd}`, `{before: cmd}` or a bare cmd. `ev.deleteMenuItem(cmd)` + `ev.tidyMenu()` remove items. `menuopen` fires on every open with a fresh item list, so there is no need to de-duplicate.
- To edit titles in place, change `ev.items[...]` and then **set `ev.menuUpdated = true`** (Help › MenuEvent). Multiple listeners can chain edits this way.
- Custom menus: `mainWindow.showMenu("custom.myId", items, {dialogStyle, noAnimation, pageNo})`. `showMenu` does **not** fire `menuopen`. Item fields are `title`, `cmd`, `checked`, `radio`, `selected`, `stayOpen`. **Separator = `{cmd: -1}` with no title** (Help: "title … or an empty string to display a separator bar"). A non-selectable label is `{title, cmd: -1}`. Close with `{title: "Cancel", cmd: command.MenuReturn}`. Dialog convention: first item is a `cmd:-1` message, second is a separator.
- Filter toggles in menus use the MissingMediaFilter pattern (`checked` + point `cmd` at the "All" filter).

### 2.5 Filters
- `createFilter({id, title, group, sortKey, menuTitle, select, before, after})` returns a command. The full id is `"User.<id>"`. Built-in groups include `"[Rating]"` and `"[Manuf]"`. Built-in ids include `"All"`, `"Hidden"`, `"Unconfigured"`, `"Favorites"`, `"Category.<n>"`, `"System.<n>"`, `"Manuf.<n>"`, `"Rating.<n>"`, `"YearRange.a.b"`, `"PlayedWithin.n"`, `"NeverPlayed"`... (see the list in wheel-actions.js).
- Put expensive precomputation in `before`, not in `select`.
- Metafilters narrow (`includeExcluded:false`) or widen (`true`). Keep the returned id so you can remove the filter, and don't stack duplicates.
- Change the filter with `mainWindow.doCommand(gameList.getFilterInfo(id).cmd)` if listeners need `filterselect`, or with `gameList.setCurFilter(id)` for a silent change.

### 2.6 Settings persistence
- `optionSettings.get(key, def)` **returns a string** (Help). Use **`getBool` / `getInt` / `getFloat`** for typed values (two-tables uses `getBool`). `set(key, value)` stores booleans as "0"/"1" and numbers as decimal strings. `set(key, undefined|null)` erases the key.
- Prefix custom keys (`custom.` + unique name). Settings.txt is shared with PinballY.
- `set()` only changes memory. PinballY writes the file itself at certain points, and `save()` forces a write (it returns a bool and shows no error). The sleep example calls `if (optionSettings.isDirty()) optionSettings.save()` before a hard exit. `reload()` rebuilds everything (the DB, rescans media, restarts videos), so avoid it.
- Per-game data: `game.update({categories, ...})` writes to the game DB.

### 2.7 Timers, async and the main thread
- Help › Javascript › "Performance tip": **JS runs on the main UI thread.** Anything over about 30 to 50 ms freezes video and delays button input. Replace timing loops and waits with `setTimeout`/`setInterval`, split CPU-heavy work across timer ticks, and use Promises for external waits.
- Help › System Functions: timers are single-threaded, so a timer callback runs only after the current script (including the whole `main.js` top level) has finished.
- Examples: start_random_table and our `wheel_navigator` await a Promise wrapped around setTimeout. FlexDMD uses a debounced self-rescheduling `setTimeout` with `clearTimeout`. auto_shutdown uses `setInterval`. Help's ExitByLongKeyPress uses `setTimeout` + `cancelTimer()` on keyup.
- **No example and no Help page says that `window.showWindow()` blocks, or that it must be deferred with `setTimeout(..., 0)` at startup.** The Help "Hide a Window During Play" example calls `backglassWindow.showWindow(false/true)` directly in `gamestarted`/`gameover`. Deferring with `setTimeout(0)` does not make a call asynchronous or non-blocking. It only postpones the call until after `main.js` (and PinballY's post-script startup work) has run. That ordering is the plausible real reason it helps.
- Errors in async code (Promise callbacks, dynamic `import()`) escape PinballY's normal error logging. Catch them and `logfile.log(e.stack)` (wheel-actions).

### 2.8 Drawing, windows and media
- Windows: `mainWindow`, `backglassWindow`, `dmdWindow`, `topperWindow`, `instCardWindow` all have `showWindow(bool)` and `createDrawingLayer(zIndex)`. z 10000 sits above all native graphics (Help › ExitVideoExample). Create a layer **once** and reuse it; show_instruction_card leaks layers.
- Launch overlay: `mainWindow.launchOverlay.bg.clear(argb) | loadImage(path) | loadVideo(path)`, `mainWindow.showWheel(bool)`, `mainWindow.setUnderlay("")`.
- Media lookup: `gameList.resolveMedia(folder, name[, "video"])`, `game.resolveMedia(type, true)`, `game.resolveROM()`, `game.resolveGameFile().path`.
- Status lines: `mainWindow.statusLines.attract|upper|lower.setText(i, text)`. The auto_shutdown author reports that adding and removing lines at runtime made PinballY unstable; overwriting slots is safer.
- Built-in option: Game Launch Options / system "Keep these windows open while running" (`ShowWindowsWhileRunning`). Prefer it to script hacks for showing windows during play.

### 2.9 Native calls: DLL, COM, processes, HTTP
- `const Lib = dllImport.bind("X.dll", \`C prototype;\`)` **once at load**. Return values such as HINSTANCE need `.toNumber()`. Define Windows constants yourself (`SW_HIDE = 0`).
- `ShellExecuteW` is fire-and-forget (it returns right away and does not block). Help › RunProgramExample shows `CreateProcess` with handle cleanup. Never wait synchronously on a child process on the UI thread.
- COM: `createAutomationObject("ProgID")` (`Scripting.FileSystemObject`, `FlexDMD.FlexDMD`, and our `WMPlayer.OCX.7`). Create lazily and handle failure (the component may not be installed). COM marshalling of complex objects is limited (FlexDMD note).
- Native code must never call back into JS from another thread (Help › DllImport).
- HTTP: `HttpRequest` (Help) is asynchronous and Promise-based. None of the examples use it (menu_submenu_batch_file shells out to curl instead).

### 2.10 Error handling and logging
- The examples do almost none. The only pattern is wheel-actions' try/catch + `logfile.log(error.stack)` around async code. `logfile.log` accepts printf-style args (`"%d"`). A prefix such as `"[PowerOff]"` is the community convention. For user-facing errors, `mainWindow.message(text, "error")` shows an on-screen popup.

---

## 3. Features from the examples that our project could reuse
- **before/select/after filters** for "Top N rated / most played / never played / table of the day" filters (additional_filters, wheel-actions Most Played).
- **Metafilter narrowing** so that "≥3 stars" or "EM only" stack on top of another filter (meta_filters, fixed version).
- **Missing-media filter** in the Operator menu (MissingMediaFilter, drop-in).
- **Checkbox or radio settings menus** with `stayOpen` + `pageNo:"same"` re-show (BatchCategoryTagging) could toggle `config` options in-app instead of editing config.js.
- **Category next/previous buttons** (CategoryButtons).
- **Attract-mode inactivity countdown on a status line** (auto_shutdown), and sleep from the exit menu (use Help › LogOffExample for the privilege code).
- **FlexDMD/UltraDMD over COM** for a real DMD, pausing on prelaunch and resuming on postlaunch.
- **Alternate table versions under one wheel item** (two-tables-one-wheel).
- **`mainWindow.message(text, "error")`** to surface script errors on screen, not only in the log.
- **Namespaced listeners** (`"gameover.ForceBackglass"`) so that a disabled script can be unhooked cleanly.
