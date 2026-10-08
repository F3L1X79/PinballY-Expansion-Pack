# Research: the PinballY `System\` scripts (`SystemClasses.js`, `CParser.js`) and the AI fixes on the cabinet

Date: 2026-10-01. Sources:
- The four local files in `System/`: the originals `SystemClasses_old.js` and `CParser_old.js`, and the AI-fixed `SystemClasses.js` and `CParser.js` that the cabinet runs.
- PinballY upstream source, read with `git` over github.com (`api.github.com` is blocked in this sandbox). C++ is cited at master commit `d84763e32f089317db405798d83ea26f77a18606` (2026-02-23) as `https://github.com/mjrgh/PinballY/blob/d84763e/<path>#Lnn`, shortened to `PlayfieldView.cpp#Lnn`, `JavascriptEngine.cpp#Lnn`, `JavascriptEngine.h#Lnn`, `LogFile.cpp#Lnn`, `FileUtil.cpp#Lnn`.
- `SystemClasses.js#Lnn` means `https://github.com/mjrgh/PinballY/blob/a452891/scripts/system/SystemClasses.js#Lnn`. That file is byte-identical to the local `System/SystemClasses_old.js`, so the line numbers are the same in both. `CParser.js#Lnn` means `https://github.com/mjrgh/PinballY/blob/d84763e/scripts/system/CParser.js#Lnn`, byte-identical to the local `System/CParser_old.js`. Lines of the AI-fixed files are cited as `cabinet SystemClasses.js:Lnn` / `cabinet CParser.js:Lnn`.
- The local help (`docs/pinbally/Help/*.html`, PinballY 1.1.0 Beta 10), cited as `Help/<file>:<line>`.
- Our code (`main.js`, `common/`, `addons/`, `tests/`), cited as `<path>:<line>`.

**Fact** = read in a primary source. **Inference** = my reading, not verified in PinballY at runtime. **Node probe** = I loaded both pairs of files (originals, then AI-fixed) into a Node 22 `vm` context, with stubs for the natives (`_defineInternalType`, `createAutomationObject`, `console._log`, `logfile._log`), and called the changed functions. It runs on V8, not on PinballY's ChakraCore, so its results are labelled Inference.

Not checked: the upstream issue tracker (the API is blocked and the issue search page renders client-side), and the PinballY release archives (whether an update overwrites `Scripts\System\`).

## Verdict

1. **The `_old` files are what every player gets.** `SystemClasses_old.js` is upstream commit `a452891` (2024-09-24), the version in the `1.1.0-Beta9` and `1.1.0-Beta10` tags. `CParser_old.js` is byte-identical to upstream master; it has not changed since `cc3e138` (2018-12-14). Upstream master has one newer `SystemClasses.js` change, `92b55cb` (2026-01-14), for the unreleased "1.1.0 Beta 11": it adds `this.pinscape = new EventTarget();`, and the C++ of the same commit **disables Javascript for the session if `pinscape` is missing** (`PlayfieldView.cpp#L834`, with the "object missing; Javascript disabled for this session" path at `#L746-L754`). The AI-fixed file is based on Beta 10. A Beta 11 exe running it would load no Add-on at all (Inference).
2. **The AI made 23 distinct changes** (13 in `SystemClasses.js`, 10 in `CParser.js`). 13 fix real bugs of the original correctly. 1 fixes a real bug but rejects input the original accepted. 1 tries to fix a real bug and **makes it worse** (`console.count` / `countReset`). 1 changes behaviour that the original chose on purpose (`%+d` of zero). 3 change nothing at runtime, 1 is a performance rewrite, 2 drop the final newline, and 1 corrupts the author's name in the CParser licence notice.
3. **Our Add-ons go down none of the fixed paths, except one.** We call `logfile.log` and `console.log` with a single string only, never `sprintf`, never `off`, `addEventListener` or the `items` argument of the menu helpers, never `ev.name`. The exception is the CParser scanner (change C2), which every `dllImport.bind` goes through. That includes our one `dllImport.bind("User32.dll", "int WINAPI GetSystemMetrics(int nIndex);")` (`common/pinbally_host.js:165`) and the system's own COM definitions at startup. The Node probe gives the same result with both versions there. So for our Add-ons, going back to the originals changes nothing observable, and keeping the fixes buys nothing (Inference).
4. **Default recommendation, as the project rules ask: revert both files to the originals.** The real bugs are candidates to propose upstream. Nothing calls for a workaround in `common/` today. Two habits keep us off the buggy paths: call `logfile.log` with one string, and never end a `dllImport` declaration string with a `//` comment.

**Decision (2026-10-01):** the cabinet keeps its AI-edited copies, since `System\` is not versioned and they are only a local convenience, and every defect left in them is fixed in place (below). Nothing is reported upstream. The habits became rules in `.claude/rules/conventions.md`, since players run the originals: `logfile.log` with one string, no trailing `//` in a `dllImport` declaration, and the timer functions added to the allowed globals (§3.1).

### State of the cabinet's copies (fixed on 2026-10-01)

`System/system_scripts_check.js` checks every point below (`node --test System/system_scripts_check.js`; its name keeps the project's `node --test` from picking it up). Against the AI copies it fails 19 of its 38 checks. Our Add-ons only reach two of the changed paths: `tidyMenu()` (`addons/custom_menu_commands.js:62`), and `dllImport.bind` through the CParser scanner, whose output is unchanged on a corpus of declarations apart from `HFONT`.

**Defects the AI introduced, now fixed:**
- **S6:** `count()` without a label now counts per calling location, as the help promises, with that location as the label. `countReset()` without a label resets all of those counters.
- **C4:** spaces around an interface GUID are accepted again; other text around it is still rejected.
- **S1:** `%+d` / `%+f` of 0 gives ` 0` again, as the help describes.
- **C9:** the author's name is restored, and `CParser.js` is back in Latin-1, like the original, so PinballY reads it right.
- **S13, C10:** final newlines restored.

**Bugs of the originals, now fixed:**
- `sprintf` integers follow C: the precision zero-pads the digits, then the width pads the field (`%8.3d` of 7 gives `     007`); `%.0d` of 0 is empty. The space flag and the `#` prefix now come before the zero padding (`% 05d` gives ` 0007`, `%#06x` of 255 gives `0x00ff`). The help's line about integer precision ("left-justifying") matches neither the code nor C.
- `%S` of an object nested more than 5 levels deep prints `[object Object]` there instead of throwing.
- A first argument that isn't a string is never treated as a format (no more TypeError).
- Arguments left over after the format codes are appended, as in a browser.
- A listener that throws no longer stops the other listeners. The first error is still rethrown at the end, so PinballY logs it and runs the default action as before; the others go to `logfile`. A once-only listener is removed before it runs, so it stays removed even if it throws.
- `deleteMenuItem(which, items)` edits `items` in place and returns it.
- `tidyMenu()` treats `{ cmd: -1 }` without a title as a separator.
- `command.nameAndIndex()` names the `UserFilterGroup` range too.
- `HighScoresReadyEvent` carries its own class name.
- Typed-array `toString()` / `toStringRaw()` convert in chunks, so a buffer of a few hundred thousand elements no longer overflows the stack.
- `HttpRequest.send()` resolves on any 2xx status, and an error without a status text says the status.
- `HFONT` is a handle (`H`); `"\a"` is the bell character in string escapes.
- `pinscape` is defined, with the same lines as upstream master, so a newer PinballY build no longer turns Javascript off with these copies.

**Optimizations:** `next()` in the CParser scanner no longer creates two functions per character read. Like C2, it gives no measurable gain in Node (3,000 declarations parse in 70 to 90 ms with or without it). No other hot path stood out.

**Left as is, on purpose:**
- A single argument is never formatted. The help suggests otherwise, but this matches the browser console standard, and our `logfile.log` rule relies on it.
- Numeric `%o` honours the width, which the help says it ignores; C honours it too.
- `command.allocate(name)` overwrites `command[name]`, as the help describes.
- What the C++ does: console output to `OutputDebugString`, the `[Script]` prefix and ANSI conversion in `PinballY.log`, and the default action running when a listener throws.

### The AI fixes at a glance

"Used by us?" means: does any of our code reach the changed lines (grep of `main.js`, `common/`, `addons/`, details in §5).

| # | Change (file) | Real bug in the original? | Fix correct? | Used by us? | Recommendation |
|---|---|---|---|---|---|
| S1 | `%+d` / `%+f` of 0 prints `+0` instead of ` 0` (SystemClasses) | **No.** Deliberate (`a == 0 ? " "`); the help says "+" for *positive* values | Matches C, contradicts the help | No | Revert |
| S2 | `%W.Ps`: truncate to the precision before padding to the width | **Yes.** `"%10.3s"` of `"abcdef"` gives 3 spaces | Yes | No | Revert; propose upstream |
| S3 | `%s` of `null`/`undefined` prints `"null"`/`"undefined"` | **Yes.** It throws a TypeError | Yes | No | Revert; propose upstream |
| S4 | `_stack()`: `RegExp.$1` replaced by `exec()` | No (legacy statics work) | Yes, same behaviour | No | Revert |
| S5 | `console.warning` logs at level `"warning"` | **Yes.** Level `"log"`, text prefixed `"warning "` | Yes | No | Revert; propose upstream |
| S6 | `console.count()` without a label: `this._stack[0]` → `this._stack()[0]` | **Yes.** All unlabelled counts share one counter, but the help promises one per call site | **No.** Still one shared counter, and `countReset()` without a label **no longer resets it** | No | Revert; upstream needs a different fix |
| S7 | `console.time`: elapsed time measured from the start, message passed as `(level, text)` | **Yes.** Always about 0 ms, and the text lands in the level slot | Yes | No | Revert; propose upstream |
| S8 | `addEventListener(type, fn, true)`: `capture: capture` → `capture: options` | **Yes.** ReferenceError; the help documents boolean options | Yes | No | Revert; propose upstream |
| S9 | `addEventListener` stores namespaces as a `Set` | **Yes.** A later `off("type.ns")` or `off(".ns")` throws a TypeError | Yes | No | Revert; propose upstream |
| S10 | `command.nameAndIndex`: `let ranged`, and `"MediadropFirst"` → `"MediaDropFirst"` | **Yes.** The media-drop range is never named, and `ranged` leaks as a global | Yes | No | Revert; propose upstream |
| S11 | `addMenuItem(where, item, items)` searches and splices `items`, not `ev.items` | **Yes.** With an `items` argument it edits `ev.items` and returns `items` unchanged | Yes | **Called, but never with `items`** | Revert; propose upstream |
| S12 | `deleteMenuItem(/re/)`: `w` → `which` | **Yes.** ReferenceError | Yes | No (we pass a command ID) | Revert; propose upstream |
| S13 | Final newline removed (SystemClasses) | – | – | – | Revert |
| C1 | `"unsigned long long"` maps to `"L"` (unsigned) | **Yes.** Mapped to signed `"l"` | Yes | No | Revert; propose upstream |
| C2 | `peekSym`/`peekPat`/`lookaheadPat` use cached sticky regexes instead of `src.substr(index)` | No functional bug; quadratic copying only | Yes for the patterns CParser uses | **Yes**: every `dllImport.bind`, ours included | Revert |
| C3 | `parseInterface`: `ifc = {…}` → `let ifc = {…}` | **Yes.** Implicit global `ifc`; a method parameter written `interface X *p` clobbers the interface being defined | Yes | No | Revert; propose upstream |
| C4 | Interface GUID check anchored (`^…$`) and read with `exec()` | Partly: junk around a GUID was accepted and silently cut | Yes, but stricter: `' {GUID} '` (spaces inside the quotes) is now rejected | No | Revert |
| C5 | Octal string escape: `parseInt(curr, 16)` → `parseInt(curr, 8)` | **No.** A digit 0–7 has the same value in both bases | No-op | No | Revert |
| C6 | Comment skipping stops at the end of the input; an unclosed `/*` throws | **Yes.** A final `//` comment with no newline, or an unclosed `/*`, **loops forever and freezes PinballY** | Yes | No (our declaration has no comment) | Revert; propose upstream; never end a declaration with `//` |
| C7 | `unparseFunc`: `s = …` → `let s = …` | **No.** `s` is `unparse()`'s own `let s`, not a global, and nested function pointers come out right | No-op | No | Revert |
| C8 | `uuidof("interface X ")`: trailing spaces left out of the captured name | **Yes**, minor: "unknown interface" | Yes | No | Revert; propose upstream |
| C9 | Author's name in the licence header: `Löw` (Latin-1) → `L`, U+FFFD, `w` (the UTF-8 replacement character) | – | **No.** It corrupts the notice; no runtime effect (comment) | – | Revert |
| C10 | Final newline removed (CParser) | – | – | – | Revert |

## 1. Inventory (from the originals)

### 1.1 How PinballY loads them

**Facts**
- Javascript starts only if `Scripts\main.js` exists (`PlayfieldView.cpp#L629-L632`, inside `PlayfieldView::InitJavascript`, `#L622`). If any later step fails, a `Cleanup` guard shuts the engine down (`#L634-L641`).
- Before any script, the engine defines three globals: `_defineInternalType`, `createAutomationObject` and `Variant` (`JavascriptEngine.cpp#L286-L288`). `PlayfieldView` then defines `alert`, `message`, `OutputDebugString`, `setTimeout`, `clearTimeout`, `setInterval` and `clearInterval` (`PlayfieldView.cpp#L666-L672`).
- It loads `scripts\system\CParser.js`, **then** `scripts\system\SystemClasses.js`, from the program folder (`GetDeployedFilePath`), and stops Javascript for the session if either fails (`PlayfieldView.cpp#L682-L707`). The order matters: `SystemClasses.js` calls `new CParser()` while it loads (`SystemClasses.js#L1633`). The `1.1.0-Beta10` tag has the same two lines (`PlayfieldView.cpp` at that tag, L702-L703).
- Both run as **classic scripts** through `JsRunScript` (`JavascriptEngine.cpp#L405-L425`), not as modules. Neither file contains `"use strict"` (grep), so they run in sloppy mode, and top-level `this` is the global object.
- The file is read by `ReadFileAsWStr`: UTF-8 or UTF-16 if it starts with a byte-order mark, otherwise the ANSI code page (`FileUtil.cpp#L230-L282`; the default `CP_ACP` is in `Utilities/FileUtil.h#L143`).
- After the two scripts, the C++:
  - evaluates `this.systemInfo = {…}` (`PlayfieldView.cpp#L715-L737`);
  - attaches the `dllImport` natives `_bind`, `_sizeof`, `_create`, `_call` and `_invokeAutomationMethod` (`JavascriptEngine.cpp#L4697-L4701`);
  - looks up about 60 globals by name, every event class plus `console`, `logfile`, `gameList`, `optionSettings`, `CustomWindow`, the window objects, and (master only) `pinscape`. A missing one disables Javascript (`PlayfieldView.cpp#L746-L841`);
  - adds the native methods: `console._log` (`#L879`), `logfile._log` (`#L883`), `optionSettings.get/getBool/…` (`#L885-L896`), the `mainWindow` methods, `StyledText` and `HtmlLayout` as globals (`#L993`, `#L1007`);
  - fills `command` with the built-in IDs and calls `command._init()` (`#L1202-L1310`);
  - loads `main.js` as a module (`#L1316`, `JavascriptEngine.cpp#L1750-L1752`), and runs pending tasks up to 100 times so that imports finish initializing (`PlayfieldView.cpp#L1332`).

### 1.2 `CParser.js`

**Facts**
- One global lexical binding, `let CParser` (`CParser.js#L147`). `new CParser()` returns `{ parse, uuidof, enums, structs, unions, interfaces, constants }` (`#L1715-L1732`). Each instance keeps its own type tables, so types defined in one `parse()` call are known in the next.
- Built-in type names: C primitives, the Win32 SDK typedefs and the handle types (`#L168-L350`). `parse()` reports each struct, union and interface to the native layer through `_defineInternalType` (`#L568`, `#L817`). `unparse()` turns a declaration into the compact type string the C++ marshaller reads (format described in the file header, `#L68-L144`).
- Side effect: `parseInterface` assigns `ifc = {…}` with no declaration (`#L645`). In sloppy mode that creates a **global `ifc`**. It exists as soon as `SystemClasses.js` has loaded, because that file defines `IUnknown` and `IEnumVARIANT` (`SystemClasses.js#L1837-L1852`). Node probe: `typeof ifc` is `"object"` after load with the original, `"undefined"` with the AI version (Inference).

### 1.3 `SystemClasses.js`

**Facts**, by kind of definition:

| Kind | Names | Where |
|---|---|---|
| Global functions (on the global object) | `sprintf(fmt, …)`, `trySprintf(fmt, …) → {ok, fields, expansion}` | `#L14-L208` |
| Global lexical bindings (script scope, **not** properties of the global object) | `Logger`, `Event`, `EventTarget`, `KEY_LOCATION_*`, `DOM_KEY_LOCATION_*`, `SWP_NOACTIVATE/NOMOVE/NOOWNERZORDER/NOSIZE/NOZORDER`, `SW_HIDE/SHOWMINIMIZED/SHOW`, `VT_*` (52 Variant type codes) | `#L215`, `#L329`, `#L645-L655`, `#L1567-L1579`, `#L1865-L1916` |
| Global object properties (`this.X = …`) | `console`, `logfile`, every event class (`KeyEvent` … `MediaSyncEndEvent`, `MediaCaptureBeforeEvent`), `command`, `optionSettings`, `GameInfo`, `GameSysInfo`, `FilterInfo`, `JoystickInfo`, `JoystickAxisInfo`, `DrawingLayer`, `MediaWindow`, `mainWindow` (+ `statusLines`, read-only `launchOverlay`), `SecondaryWindow`, `backglassWindow`, `dmdWindow`, `topperWindow`, `instCardWindow`, `CustomWindow`, `StatusLine`, `gameList`, `dllImport`, `HANDLE`, `HWND`, `NativePointer`, `COMPointer`, `NativeObject`, `Int64`, `Uint64`, `HttpRequest` | `#L245-L1622`, `#L1630-L1957`, `#L2001` |
| Implicit global (sloppy assignment) | `ranged`, created on the first `command.nameAndIndex()` call, i.e. the first `command` event (`CommandEvent` calls it, `#L879`) | `#L910` |
| Changes to built-in prototypes | `Int8Array`, `Uint8Array`, `Int16Array`, `Uint16Array`: `prototype.toString` (null-terminated string), `prototype.toStringRaw(length)`, static `fromString(str, length)`. Only these four typed-array types. | `#L1962-L1993` |
| Code run at load | `Object.assign(console, Logger)`, `Object.assign(logfile, Logger)`, `dllImport.define(…)` of `struct _GUID`, `IUnknown`, `IEnumVARIANT` | `#L311`, `#L321`, `#L1837-L1852` |

**Event plumbing** (`EventTarget`, `#L329-L594`), facts:
- `on(events, [data,] fn)` and `one(…)` take a space-separated list of `type.ns1.ns2` names and store the namespaces as a `Set` (`#L356-L374`). `addEventListener` stores them as an **array** (`#L397-L399`). `off(events, fn?)` matches namespaces with `Set.has` (`#L436-L453`).
- `dispatchEvent` calls the listeners of a copy of the list, in registration order, with `this` set to the target and `event.data` set to that listener's data (`#L504-L521`). A `once` listener is removed after its call (`#L524-L534`). `stopImmediatePropagation()` ends the loop (`#L537-L538`). `stopPropagation()` has no effect, because nothing bubbles. The return value is `!(event.cancelable && event.defaultPrevented)` (`#L545`). There is **no try/catch**.
- The C++ fires every event through `FireAndReturnEvent`: it builds the event object, calls `dispatchEvent`, and on a Javascript exception **logs it and returns `true`**, i.e. "do the default action" (`JavascriptEngine.h#L979-L1003`).
- The System scripts register no listener of their own. Every default action lives in the C++ (grep: no `.on(` call outside the class definitions).

**Helpers**, facts:
- `sprintf` / `trySprintf`: a subset of C printf for `%d %i %x %X %b %o %O %f %s %S %%`, with flags `- + space # 0`, width and precision (`#L32-L208`). With a single argument, or no `%` code in the first argument, nothing is formatted (`#L38`, `#L207`).
- `Logger.format(…)`: the `trySprintf` result when it found `%` fields (so only with two or more arguments), otherwise `args.join(" ")` (`#L216-L220`). `Logger._stack()` builds a browser-like stack from `new Error().stack` (`#L223-L236`).
- `console` (`#L245-L310`) and `logfile` (`#L318-L321`) are thin wrappers that format, then call the native `_log`. `console._log(level, text)` writes `console.log(<level>): <text>` to `OutputDebugString` and forwards to an attached debugger (`PlayfieldView.cpp#L1808-L1813`, `JavascriptEngine.cpp#L365-L372`). `logfile._log(text)` writes `[Script] <text>` to `PinballY.log` (`PlayfieldView.cpp#L1758-L1761`), always, since it uses the always-enabled `BaseLogging` feature (`LogFile.cpp#L103-L109`, `LogFile.h#L28`), with no timestamp and converted to the ANSI code page (`LogFile.cpp#L155-L158`).
- `MenuEvent.addMenuItem / deleteMenuItem / tidyMenu` (`#L977-L1181`), `command.name / nameAndIndex / allocate` (`#L888-L935`).
- `dllImport.bind / define / uuidof / create / sizeof` on top of one shared `CParser` instance (`#L1630-L1752`). The wrappers `_bindExt`, `_bindCOM`, `_bindDispatch` and `_makeIterable` are called by the native layer (`#L1759-L1833`).
- `HttpRequest` (`#L2001-L2113`): tries `Msxml2.XMLHTTP.6.0` down to `Microsoft.XMLHTTP` once and remembers the first that works. `send()` returns a Promise that resolves with `responseText` **only when `status == 200`**, and rejects with `new Error(statusText)` otherwise (`#L2060-L2063`).

## 2. Reuse

What the System scripts provide, against what our code does (grep of `main.js`, `common/`, `addons/`).

| System feature | Our code today | Could we use it instead? |
|---|---|---|
| `logfile.log` | Already used everywhere: 21 calls, each with **one** string (template literal or concatenation), prefixed `[ScriptName]` by convention (`common/safe_handler.js:25`, `common/pinbally_host.js:205`). | Already used. PinballY adds its own `[Script] ` prefix in front (fact, `PlayfieldView.cpp#L1760`). |
| `sprintf`, `console.format`, `logfile.format` | Template literals; user-facing texts come from `lang/` through `common/i18n.js`. | No gain (inference). `sprintf` is not documented as a global; `console.format` is documented (`Help/ConsoleObject.html`), but it has the quirks listed in §4. |
| `EventTarget` (on/off/one, namespaces, `data`, `once`) | `common/profile_store.js:230-236`, `:306-312` and `:374-377` keep their own listener arrays (`onSwitch`, `onUpdate`) and wrap **each** listener call in a try/catch. | No (inference). `dispatchEvent` has no try/catch (§1.3), so one failing listener would stop the others: the opposite of what the store does on purpose. `EventTarget` is also only a global lexical binding, and the help presents it as an interface of system objects, not a class to instantiate (`Help/EventTarget.html`). |
| `ev.addMenuItem / deleteMenuItem / tidyMenu` | Used: `addMenuItem` in `common/main_menu.js:67`, `addons/custom_menu_commands.js:59`, `addons/profile_picker.js:505`; `deleteMenuItem(command ID)` and `tidyMenu()` in `addons/custom_menu_commands.js:61-62`. `addons/menu_cleanup.js:20` has its own separator cleanup. | Already used. Our separate cleanup exists because `tidyMenu` only treats `cmd < 0 && title == ""` as a separator (`SystemClasses.js#L1138`), and our separators are `{ cmd: -1 }` with no title (`.claude/rules/conventions.md`). Node probe: `tidyMenu` leaves `[A, {cmd:-1}, {cmd:-1}, B]` as it is (inference). `tidyMenu` would only see our separators if they carried `title: ""`. |
| `command.allocate(name)` | Used through `host.allocateCommand` (`common/pinbally_host.js:154`) and directly (`addons/custom_menu_commands.js:51`). | Already used. |
| `command.name(id)`, `ev.name`, `ev.index` | Not used; we compare IDs. | Not needed. |
| `HttpRequest` | Not used. | – |
| Typed-array string helpers (`Uint16Array.fromString`, `.toString()`) | Not used (no typed array in our code). | Only if a future `dllImport` call returns a string in a buffer. |
| Constants `SW_*`, `SWP_*`, `KEY_LOCATION_*`, `VT_*` | Not used. `common/pinbally_host.js:20` defines `SM_CMONITORS = 80`. | No duplicate: the System scripts define no `SM_*` constant (fact, grep). |
| `systemInfo` (built by the C++ right after the System scripts, `PlayfieldView.cpp#L715`) | `host.getProgramFolder()` reads `systemInfo.programDir` (`common/pinbally_host.js:161`). | Already used. |

**Inference:** nothing in `common/` re-implements a System helper by mistake. The two look-alikes, the Profile store's listener lists and the separator pass of `menu_cleanup.js`, exist because the System version behaves differently (no error isolation; separators need `title: ""`).

## 3. Conflicts

### 3.1 Global names
- **Fact:** our code is loaded as ES modules (`main.js` by `LoadModule`, `PlayfieldView.cpp#L1316`; the rest through `import`). No module of ours declares a top-level name that the System scripts define (grep for `Event`, `EventTarget`, `Logger`, `command`, `sprintf`, `CParser`, `DrawingLayer`, `StatusLine`, `HANDLE`, `HWND`, `Variant`, `SW_*`, `SWP_*`, `VT_*`, `KEY_LOCATION_*`, `ranged`, `ifc`: no match).
- **Inference** (ECMAScript module rules, not tested in ChakraCore): module-level declarations never become globals, so they cannot clash with the System globals. A same-named declaration would only hide the global inside its own module. The System's global lexical bindings (`EventTarget`, `SW_SHOW`, `VT_*`…) are visible from our modules as bare names.
- **Fact:** our code never reads `ifc` or `ranged`, the two globals the originals leak (§1.2, §1.3). **Inference:** they are harmless to us. Their only effect: a strict-mode typo that assigns to one of those two names writes the global instead of throwing.
- **Fact:** the allowed-globals list in `.claude/rules/conventions.md` (line 33) does not name `setTimeout`, `clearTimeout`, `setInterval` and `clearInterval`, which PinballY defines natively (`PlayfieldView.cpp#L669-L672`) and 13 of our files use.

### 3.2 Event listeners and ordering
- **Fact:** the System scripts register no listener (§1.3), so they add no hidden default handler. Listeners from all modules run in registration order (`SystemClasses.js#L515`). That is why `main.js:35-49` orders `SCRIPTS`.
- **Fact:** a listener that throws stops the remaining listeners of that event (`SystemClasses.js#L515-L521`, no try/catch). The C++ then logs the error and runs the default action **even if an earlier listener called `preventDefault()`** (`JavascriptEngine.h#L979-L1003`).
- **Fact:** every listener our code registers on `mainWindow` or `gameList` is wrapped in `safeHandler` (grep: the only call without it inline, `common/achievement_toast.js:272`, passes a handler wrapped at `:269`). `safeHandler` catches and logs (`common/safe_handler.js:34-53`), so one of our Add-ons cannot cut the dispatch short for the others.
- **Inference:** a listener from code we don't own (for example a player's own `main.js` content), registered before ours, can still throw and skip ours.

### 3.3 Prototype patches
- **Fact:** the only built-in patch is `toString` / `toStringRaw` / `fromString` on `Int8Array`, `Uint8Array`, `Int16Array` and `Uint16Array` (`SystemClasses.js#L1962-L1993`), documented in `Help/DllImport.html:1406-1477`. `String(new Uint8Array([72,105,0,33]))` gives `"Hi"`, not `"72,105,0,33"` (Node probe, inference). Our code uses no typed array (grep), so no conflict today.

### 3.4 Logging paths we rely on
- **Fact:** all 21 `logfile.log` calls pass one argument. With one argument nothing is formatted (`SystemClasses.js#L38`, `#L207`), so a `%` inside a Profile name or a table title is written as it is (Node probe: `"100%% done"` stays `"100%% done"`).
- **Fact:** `logfile._log` converts the text to the ANSI code page before writing (`LogFile.cpp#L155-L158`). **Inference:** characters outside that code page, such as emoji or non-Latin letters in a Profile name (`main.js:104`) or a menu title (`addons/ui_translation.js:100`), come out replaced in `PinballY.log`.
- **Fact:** our fallback `console.log` (`common/safe_handler.js:28`, `common/i18n.js:71`) only reaches `OutputDebugString` and an attached debugger (`PlayfieldView.cpp#L1808-L1813`). On a cabinet without a debugger or DebugView, that fallback message is not visible.

### 3.5 Command IDs
- **Fact:** `command.allocate(name)` sets `command[name] = id` without checking the name (`SystemClasses.js#L918-L934`). The names we allocate (`resetProfile`, `showTableSetup`, `RandomGameStart`, `tableOfTheDay`, `tableOfTheWeek`, `profilePicker`, `profileStats…`, `profileReset…`, `wheelDialogButtonN`, `profilePickerExitMenu`) do not match any built-in name set by the C++ (`PlayfieldView.cpp#L1206-L1306`).
- **Fact:** `command._init()` runs before `main.js` is loaded (`PlayfieldView.cpp#L1310`, `#L1316`), so `allocate()` at import or init time does not throw "command object not initialized" (`SystemClasses.js#L920-L921`).

### 3.6 Version coupling
- **Fact:** the C++ requires the globals that its own `SystemClasses.js` defines, and disables Javascript when one is missing (`PlayfieldView.cpp#L746-L754`). Master already requires `pinscape` (`#L834`, added with the global in `92b55cb`). The `1.1.0-Beta10` tag does not.
- **Inference:** the System scripts must come from the same build as `PinballY.exe`. Keeping the AI-fixed `SystemClasses.js` (from Beta 10) after an upgrade to a build with `pinscape` would turn off Javascript, and so every Add-on. The other way round (newer scripts, older exe) only adds an unused global.

## 4. Undocumented behavior

What the **originals** do that the help leaves out or describes differently. Every "Code" cell is a fact read in the source. Results marked "probe" also come from the Node probe (inference). The last column says whether the AI version on the cabinet behaves differently.

### 4.1 Logging (`console`, `logfile`, printf formatting)

| Topic | Help says | Code does | AI version |
|---|---|---|---|
| `console` without a debugger | Messages are "simply discarded" (`Help/ConsoleObject.html:32`) | Every message also goes to `OutputDebugString` as `console.log(<level>): <text>` (`PlayfieldView.cpp#L1810`), so a Win32 debug-output viewer shows it | Same |
| `logfile` line format | Arguments joined by spaces, newline added (`Help/LogfileObject.html:53`) | Each line is prefixed `[Script] `, has no timestamp, and is converted to the ANSI code page (`PlayfieldView.cpp#L1760`, `LogFile.cpp#L155-L158`) | Same |
| When printf formatting applies | When the first argument "contains one or more" `%` codes (`Help/ConsoleObject.html:101`) | Only when there are **at least two arguments** (`SystemClasses.js#L38`). A single argument is printed as is, so `"100%%"` stays `"100%%"` (probe) | Same |
| Extra arguments after a format string | Not said | Dropped: `("a=%d", 1, 2, 3)` gives `"a=1"` (`#L43-L204`, probe). A browser would append `2 3` | Same |
| `%+d` / `%+f` of 0 | "+" sign "if the value is positive" (`Help/ConsoleObject.html:181`) | A space: `" 0"` (`#L61-L62`, `#L95-L96`) | `"+0"` |
| `%d` with a precision | Precision "simply has the effect of left-justifying the result" (`:233-234`) | Zero-pads to that many digits, as in C, and then **ignores the width**: `"[%8.3d]"` of 7 gives `"[007]"` (`#L66-L83`, probe) | Same |
| `%o` with a width | `%o` and `%O` ignore the width (`:207`) | Numeric `%o` honours it: `"%5o"` of 8 gives `"   10"` (`#L170-L171`, probe) | Same |
| `%10.3s` (width and precision) | Precision is the maximum width (`:237`) | Pads first, then truncates: `"[%10.3s]"` of `"abcdef"` gives `"[   ]"` (`#L114-L129`, probe) | `"[       abc]"` |
| `%s` of `null` / `undefined` | Converted with `toString()` (`:143`) | **Throws a TypeError** (`#L192-L193`, probe) | `"null"` / `"undefined"` |
| `%S` of an object nested more than 5 levels | Objects listed as `{p: v}` (`:145-155`) | Throws `ReferenceError: Cannot access 's' before initialization`, because `doObject` reads `s` while `s` is still being computed (`#L141-L156`, probe) | Same |
| `console.count()` without a label | A default label "based on the calling code location" (`:51-55`) | All unlabelled calls share one counter: the key is `this._stack[0]`, which is `undefined` (`#L280-L286`). `countReset()` without a label resets it | Still one shared counter, and `countReset()` without a label no longer resets it (probe) |
| `console.warning` | Warning styling (`:263`) | Sent at level `"log"`, with the text `"warning <message>"` (`#L277`) | Level `"warning"` |
| `console.timeLog` / `timeEnd` | Show the elapsed time (`:243-257`) | Always about `0ms` (`#L296-L300`). The text is passed alone, so it lands in the native level slot and the message is empty (`#L300`, `#L305`; missing arguments become empty strings, `JavascriptEngine.h#L1324-L1341`) | Fixed |
| `console.trace` | A call-stack trace (`:259`) | Sent at level `"log"`, prefixed `"trace"` (`#L275`) | Same |

### 4.2 Events and menus

| Topic | Help says | Code does | AI version |
|---|---|---|---|
| A listener throws | Not said | Later listeners of that event are skipped, and the C++ logs the error and runs the default action even if `preventDefault()` was called (`SystemClasses.js#L515-L521`, `JavascriptEngine.h#L979-L1003`) | Same |
| `addEventListener(type, fn, true)` | A boolean is accepted as `capture` (`Help/EventTarget.html:63`) | **ReferenceError** `capture is not defined` (`#L340-L341`, probe). `removeEventListener` with a boolean fails the same way (`#L488`) | Works |
| `off("type.ns")` or `off(".ns")` | Removes matching listeners (`Help/EventTarget.html`, `off`) | **TypeError** `eventNamespaces.has is not a function` as soon as it meets a listener added with `addEventListener`, which stores namespaces as an array (`#L397-L399`, `#L443`, probe) | Works |
| `ev.addMenuItem(where, item, items)` | Edits and returns the given `items` array (`Help/MenuEvent.html:324-328`) | Searches and inserts into `ev.items` instead, and returns `items` unchanged (`#L1028`, `#L1041-L1043`, probe) | Edits `items` |
| `ev.deleteMenuItem(/regex/)` | Supported (`Help/MenuEvent.html:343-345`) | **ReferenceError** `w is not defined` (`#L1097`, probe) | Works |
| `ev.deleteMenuItem(which, items)` | "Edits that array and returns it" (`Help/MenuEvent.html:356-357`) | Returns a **new** filtered array; the array passed in is not changed (`#L1104`, probe) | Same |
| `ev.tidyMenu()` | Removes redundant separators (`Help/MenuEvent.html:364-380`) | A separator must be `cmd < 0 && title == ""`, so `{ cmd: -1 }` without a title is not one (`#L1138`). It also removes an empty paged group `separator, MenuPageUp, MenuPageDown, separator` (`#L1155-L1168`) | Same |
| `CommandEvent.name` / `.index` for ranged commands | Ranged groups get the first command's name and an index (`Help/CommandEvent.html:57-70`) | Only `Capture*`, `Filter*` and `PickSys*` are ranges. The media-drop range is looked up as `"MediadropFirst"`, a name that does not exist, so its `name` is the numeric ID as a string (`#L910-L915`, probe). `UserFilterGroupFirst..Last` is not treated as a range at all | Media-drop range named |
| `command.allocate(name)` | – | Overwrites any existing `command[name]` without a check (`#L926-L931`) | Same |

### 4.3 Other helpers

| Topic | Help says | Code does | AI version |
|---|---|---|---|
| `HttpRequest.send()` | Returns a Promise; `.then()` on success, `.catch()` on error (`Help/HttpRequest.html:160-163`) | Resolves only for **status 200**; any other status (201, 204, 304…) rejects with `new Error(statusText)` (`SystemClasses.js#L2060-L2063`) | Same |
| `dllImport` declaration ending with a `//` comment, or with an unclosed `/*` | Not said (`Help/DllImport.html`) | **Infinite loop: PinballY freezes** (`CParser.js#L1551-L1580`, probe: timeout) | Fixed (stops, or throws "unterminated comment") |
| `unsigned long long` in a declaration | – | Mapped to signed 64-bit `l` (`CParser.js#L224`). `unsigned long long int`, `unsigned __int64`, `ULONGLONG` map correctly to `L` (`#L218-L226`, `#L281-L287`) | Fixed |
| `HFONT` | – | Mapped to `I` (32-bit unsigned int) while every other GDI handle maps to `H` (`CParser.js#L329`). **Inference:** an `HFONT` is pointer-sized on x64, so it could be truncated | Same |
| Undocumented globals | `Help/SystemFunctions.html` and `Help/SystemObjects.html` list the documented ones | Also present: `sprintf`, `trySprintf`, `OutputDebugString(text)` (`PlayfieldView.cpp#L668`), `_defineInternalType` (`JavascriptEngine.cpp#L286`), the lexical `CParser`, `Logger`, `Event`, `EventTarget`, and the leaked `ifc` and `ranged` | No `ifc`, no `ranged` |
| System scripts and exe version | Files "automatically loaded"; editing them is "strongly discouraged" (`Help/Javascript.html:465-496`) | The exe looks up ~60 globals by name and disables Javascript if one is missing (`PlayfieldView.cpp#L746-L841`); master needs `pinscape` (`#L834`) | – |

## 5. AI fixes, one by one

**Facts common to every change below:**
- Diff of `System/*_old.js` against the cabinet files, after removing CR characters and converting `CParser_old.js` from Latin-1.
- None of these changes exists upstream. Master's `SystemClasses.js` differs from `_old` only by the `pinscape` lines, and master's `CParser.js` is byte-identical to `_old`.
- Usage was checked with a grep of `main.js`, `common/` and `addons/` for `sprintf`, `trySprintf`, `format(`, `console.`, `logfile.`, `addEventListener`, `removeEventListener`, `.off(`, `.one(`, `addMenuItem`, `deleteMenuItem`, `tidyMenu`, `nameAndIndex`, `command.name`, `ev.name`, `dllImport`, `CParser`, `uuidof`, `HttpRequest` and the typed arrays.

The default recommendation is **revert**, since the project never modifies `System\` (`.claude/rules/conventions.md:3`, `CONTRIBUTING.md:45`) and the help discourages it (`Help/Javascript.html:470-475`). The notes below say when a change is also worth proposing upstream, or worth a habit on our side.

### `SystemClasses.js`

**S1. `%+d` / `%+f` of zero** (`SystemClasses.js#L62`, `#L96` → cabinet `:62`, `:96`)
- The original writes `a > 0 ? "+" : a == 0 ? " " : ""`: zero gets a space on purpose (fact). The help only promises "+" for positive values (`Help/ConsoleObject.html:181`). The AI version prints `+0`, as C does.
- Not a bug, a design choice; the fix contradicts the help's wording (inference). Not used by us. **Revert.**

**S2. `%W.Ps`: truncate before padding** (`#L114-L127` → cabinet `:114-127`)
- Original: pads to the width, then cuts to the precision, so `"[%10.3s]"` of `"abcdef"` gives `"[   ]"` (fact + probe). AI: cuts first, giving `"[       abc]"`, as in C and as the help describes (`:237`).
- Real bug, correct fix. Not used by us. **Revert; worth proposing upstream.**

**S3. `%s` of `null` / `undefined`** (`#L193` → cabinet `:193`)
- Original: `a.toString()` throws a TypeError. AI: prints `"null"` / `"undefined"`, as `%O` already does (`#L161-L166`) and as browsers do.
- Real bug (a logging call can throw), correct fix. Not used by us: we never pass format arguments. **Revert; worth proposing upstream.**

**S4. `_stack()` without `RegExp.$1`** (`#L230-L234` → cabinet `:230-231`)
- The `test()` and the `RegExp.$1` / `$2` read are consecutive, so the legacy statics hold the right match (fact). ChakraCore supports `RegExp.$n` (inference, not checked in its source).
- No bug; same behaviour (inference). It only feeds `console.assert`, `trace` and `count`. **Revert.**

**S5. `console.warning` level** (`#L277` → cabinet `:274`)
- Original: `this.log("warning", …)` calls `console.log` with two arguments, so the native receives level `"log"` and the text `"warning <message>"` (fact + probe). AI: `this._log("warning", …)`, like `error` and `info` (`#L261-L265`).
- Real bug against the help (`:263`), correct fix. Not used by us. **Revert; worth proposing upstream.**

**S6. `console.count()` / `countReset()` without a label** (`#L285` → cabinet `:282`)
- Original: `this._stack[0]` reads index 0 of the *function* `_stack`, which is `undefined`. So every unlabelled `count()` shares one counter, and `countReset()` resets it (fact + probe). That contradicts the help's per-call-site label (`:51-55`).
- AI: `this._stack()[0]`. `_stack()` drops three frames (`Error`, `_stack`, its direct caller `_applyCount`, `#L225-L228`), so element 0 is the frame of `count` or `countReset` itself, never the user's call site. Probe: `a(); b(); countReset(); a();` gives `default: 1, 2, 3`. The counter is still shared, and `countReset()` without a label now works on a different key (`"…countReset @…"`) and **no longer resets it** (inference, V8 stack format; ChakraCore's has the same frame structure).
- Real bug, **incorrect fix (regression)**. A correct fix would read the next frame, `this._stack()[1]` (inference, not tested). Not used by us. **Revert.** If proposed upstream, propose the frame-1 fix, not this one.

**S7. `console.time` / `timeLog` / `timeEnd`** (`#L293-L306` → cabinet `:290-302`)
- Original: `let now = Date.now()` is read just before `Date.now() - now`, so the elapsed time is always about 0 ms. `this._log(text)` passes the text as the *level*, and the native gets an empty message (`PlayfieldView.cpp#L1808`, `JavascriptEngine.h#L1324-L1341`). Probe: `["t: 0ms", null]`.
- AI: measures from `t0`, calls `_log("log", text)`, and tests `t0 !== undefined`.
- Real bug, correct fix. Not used by us. **Revert; worth proposing upstream.**

**S8. Boolean `options` in `addEventListener` / `removeEventListener`** (`#L341` → cabinet `:337`)
- Original: `{ capture: capture }`, where `capture` is undeclared, so any boolean `options` throws a ReferenceError (fact + probe). The help documents booleans (`Help/EventTarget.html:63`).
- Real bug, correct fix. Not used by us (we only call `on()`). **Revert; worth proposing upstream.**

**S9. `addEventListener` namespaces as a `Set`** (`#L398` → cabinet `:394`)
- Original: `[]`, while `off()` calls `.has()` (`#L443`). Probe: `addEventListener("x", f)` then `off(".ns")` throws a TypeError. The throw comes from *any* listener of the matching type, even one added by someone else.
- Real bug, correct fix. Not used by us (no `off`, no `addEventListener`). **Revert; worth proposing upstream.**

**S10. `command.nameAndIndex`** (`#L910`, `#L913` → cabinet `:906`, `:909`)
- Original: `ranged = …` without a declaration leaks a global `ranged`, and `"MediadropFirst"` does not match the `MediaDropFirst` property set by the C++ (`PlayfieldView.cpp#L1284`). So media-drop commands get a numeric `name` and no `index` (fact + probe).
- Real bug, correct fix. Not used by us (we compare IDs). **Revert; worth proposing upstream.**

**S11. `addMenuItem` with an `items` argument** (`#L1028`, `#L1041`, `#L1043` → cabinet `:1024`, `:1037`, `:1039`)
- Original: computes `arr = itemsArg || this.items`, but searches and splices `this.items`. With an `items` argument, it edits the event's menu and returns `items` untouched. Without one, `arr === this.items`, so it works (fact + probe).
- Real bug, correct fix. **Used by us, but only without `items`**: `common/main_menu.js:67` passes `(where, arrayOfNewItems)`; also `addons/custom_menu_commands.js:59` and `addons/profile_picker.js:505`. Both versions behave the same on that path (probe). **Revert; worth proposing upstream.**

**S12. `deleteMenuItem(/regex/)`** (`#L1097` → cabinet `:1093`)
- Original: `RegExp.prototype.isPrototypeOf(w)`, where `w` is undeclared in that method, so a RegExp argument throws a ReferenceError (fact + probe).
- Real bug, correct fix. Not used by us (`addons/custom_menu_commands.js:61` passes a command ID). **Revert; worth proposing upstream.**

**S13. Final newline removed.** Cosmetic. **Revert.**

### `CParser.js`

**C1. `"unsigned long long"` → `"L"`** (`CParser.js#L224` → cabinet `:224`)
- Original: `"l"` (signed), unlike `unsigned long long int` and `unsigned __int64` (`"L"`). Probe: `unsigned long long f(unsigned long long a, long long b)` unparses to `(Cl l l)`, and to `(CL L l)` with the AI version.
- Real bug, correct fix. Not used by us. **Revert; worth proposing upstream.** Workaround if ever needed: write `ULONGLONG` or `unsigned __int64`.

**C2. Sticky-regex scanner** (`#L1421-L1445` → cabinet `:395-419`, `:1447-1472`)
- Original: `peekSym`, `peekPat` and `lookaheadPat` test an anchored regex against `src.substr(index)`, i.e. a copy of the rest of the source at every peek, then read `RegExp.$1` / `lastMatch` (fact). AI: a `y`-flag regex at `lastIndex = index`, with one compiled regex cached per pattern.
- No functional bug, only quadratic copying on long declaration strings (inference). The rewrite is correct for the three patterns CParser passes (`#L501`, `#L671`, `#L832`): stripping the leading `^` is right, because in sticky mode `^` would still anchor at position 0. Probe: identical output for every declaration tried.
- **Used by us:** every `dllImport.bind` goes through it, including `common/pinbally_host.js:165`, and so do the system's own COM definitions at startup. Our declarations are one short line, so the gain is nil (inference). **Revert.**

**C3. `let ifc`** (`#L645` → cabinet `:670`)
- Original: `ifc = {…}` with no declaration creates a global `ifc` (fact). While an interface is being parsed, a method parameter written with the `interface` keyword (`HRESULT A(interface IBase *p);`) re-enters `parseInterface` and overwrites `ifc`. The methods then go to the wrong object. Probe: `IFoo` ends up undefined, with no methods; the AI version gives `IFoo` with `A` and `B`.
- Real bug, correct fix. Not used by us. **Revert; worth proposing upstream.**

**C4. GUID check** (`#L761-L765` → cabinet `:786-791`)
- Original: an unanchored `test()`, then `RegExp.$1`. `'xx00000000-0000-0000-C000-0000000000467yy'` is accepted and silently cut to a valid GUID (probe).
- AI: `^\{?…\}?$` with `exec()`. Stricter: it also rejects `' {GUID} '` (spaces inside the quotes), which the original accepted (probe).
- Partly a real bug; the fix is correct but narrows the accepted input. Not used by us. **Revert.**

**C5. Octal escape base** (`#L1284` → cabinet `:1310`)
- The loop only reads digits `0`–`7` (`#L1281-L1287`), and those have the same value in base 16 and base 8 (fact). Escapes are only read inside quoted interface GUIDs (`readAltString`, `#L656-L663`), where an escape could not form a valid GUID anyway.
- No bug; no-op. **Revert.**

**C6. Comments at the end of the input** (`#L1557`, `#L1566` → cabinet `:1584`, `:1593`, `:1605-1606`)
- Original: `while(curr != "\n")` and `while(curr != "*" || …)` never stop when `curr` becomes `undefined` at the end of the string. So `"int f(int a); // note"` (no final newline), or an unclosed `/*`, **loops forever on the UI thread** (fact; probe: both time out after 2 s). AI: stops at the end; an unclosed `/*` throws "unterminated comment".
- Real bug, correct fix. Not used by us (`common/pinbally_host.js:165` has no comment). **Revert; worth proposing upstream.** Our habit: never end a `dllImport` declaration string with a `//` comment.

**C7. `let s` in `unparseFunc`** (`#L1648` → cabinet `:1677`)
- `unparseFunc` is nested in `unparse`, which declares `let s = ""` (`#L1675`) before calling it, so `s` is that local, not a global (fact). For a nested function pointer, `s += …` reads the old value of `s` *before* evaluating the right side (ECMAScript compound assignment), so the inner call's write does not corrupt the outer string (inference). Probe: `int __stdcall f(int (*cb)(char, float), double d)` gives `(Si *(Ci c f) d)` with both versions.
- No bug; no-op. **Revert.**

**C8. `uuidof("interface X ")`** (`#L1702-L1703` → cabinet `:1731-1733`)
- Original: the capture group includes `\s*$`, so trailing spaces stay in the name and the lookup fails with "unknown interface" (probe).
- Real bug, minor, correct fix. Not used by us. **Revert; could go upstream with the others.**

**C9. Licence header encoding** (`#L3`, `#L6` → cabinet `:3`, `:6`)
- The original is Latin-1 (`ö` = byte `0xF6`). The cabinet file is UTF-8 without a byte-order mark and holds `U+FFFD` (bytes `EF BF BD`) instead of `ö` (fact). PinballY reads a file without a byte-order mark in the ANSI code page (`FileUtil.cpp#L230-L282`), so the comment now reads `Lï¿½w` (inference). No runtime effect, but it damages the beer-ware notice that asks to be kept as is.
- **Revert.**

**C10. Final newline removed.** Cosmetic. **Revert.**

### Bugs that neither version fixes (facts, probe where noted)
- `%S` of an object nested deeper than 5 levels throws a ReferenceError (`SystemClasses.js#L141-L156`, probe).
- `deleteMenuItem(which, items)` returns a new array instead of editing `items` (`#L1104`, probe).
- `trySprintf` runs `pat.test(args[0])` (which converts any value to a string), then `args[0].replace(…)`. A non-string first argument whose string form contains a `%` code throws a TypeError (`#L38`, `#L43`; inference, not probed).
- `HFONT` is mapped to `I` instead of `H` (`CParser.js#L329`).
- `"\a"` in `stringEscapes` is just `"a"` in Javascript (`CParser.js#L382`).
- `HighScoresReadyEvent` is declared as `class HighScoresFetchEvent` (`SystemClasses.js#L1285`), so its `.name` differs from the global's name. Harmless.
- `UserFilterGroupFirst..Last` is not a range in `command.nameAndIndex` (`#L911-L915`).

## 6. Location assumptions

Facts only, as input for the "nested-install" roadmap item (`docs/roadmap.html`, `#nested-install`). No recommendation here.

**Where PinballY looks**
- PinballY loads exactly `scripts\system\CParser.js` and `scripts\system\SystemClasses.js`, resolved from the program folder with `GetDeployedFilePath` (`PlayfieldView.cpp#L682-L703`). The `_old` copies in the cabinet's folder are never loaded. The help names the same folder: "`Scripts\System` folder within your PinballY program folder" (`Help/Javascript.html:478-479`).
- `main.js` is looked up the same way, as `scripts\main.js` (`PlayfieldView.cpp#L629`).

**Our code and tests**
- No file in `main.js`, `common/`, `addons/`, `achievements/`, `lang/` or `tests/` imports, reads or names `System`, `SystemClasses` or `CParser` (grep). Our code depends on the **globals** the System scripts create (the list in `.claude/rules/conventions.md:33`), not on where the files are.
- `tests/file_layout.test.js:17-21` lists the `.js` files directly at the repo root, with a non-recursive `readdirSync` filtered on `.js`. A `System/` folder at the root is neither required nor counted. The same goes for `addons/` and `common/`.
- The tests never load the System scripts. Shared modules get PinballY through `tests/fake_pinbally_host.js` (`.claude/rules/conventions.md`, "Modules partagés"). **Inference:** `node --test` does not pick up `System/*.js`, because those names match none of Node's default test-file patterns (not checked against the Node documentation here).

**Git**
- `System/`, with all four files, was committed in `75ded5f` "first commit" (2026-09-22) and untracked in `84e7f7b` "Stop tracking the System folder" (2026-09-24).
- `.gitignore:36-37` reads `# This folder is already provided by PinballY` / `System/`.
- In the first commit, all four files are identical, apart from line endings, to the ones in the workspace today. So the AI fixes were already on the cabinet before the repository started.

**Docs and rules that mention it**
- `.claude/rules/conventions.md:3`: the conventions do not apply to `System/`, "never modify it".
- `CONTRIBUTING.md:45`: "Never edit the `System` folder: it belongs to PinballY."
- `README.md:46` / `README.fr.md:46`: "Copy the project into `PinballY\Scripts`, keeping your own `System` folder", i.e. the repo root is the player's `Scripts\` folder, with `System\` inside it.
- `docs/pinbally/pinbally-help.md:3`, `:12`, `:16`: paths `Scripts/System/SystemClasses.js` and `Scripts\System\`; "Don't edit `Scripts\System\*.js`".
- `docs/roadmap.html:324` (this item: `System\` stays in `Scripts\System\` and is not part of the project), `:344` (nested-install question: where the git root goes "with `System\` outside the repository", and the impact on `tests/file_layout.test.js` and the "root holds only `main.js`" rule), `:560` (the distribution item preserves the `System` folder).

**Adjacent fact, about our own folder rather than `System\`**: our code assumes it sits directly in `<program folder>\Scripts\`. Paths built as `<programDir>\Scripts\…`: `common/achievement_list.js:85`, `common/config.js:71`, `common/profile_store.js:67`. `Scripts\assets\…` paths relative to the program folder, joined to it at `common/achievement_toast.js:143`: `common/achievement_toast.js:76`, `:82`.
