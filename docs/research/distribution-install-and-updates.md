# Research: installing and updating the pack without git (roadmap `#distrib`)

Date: 2026-10-25. Sources:
- PinballY upstream source, master commit `d84763e32f089317db405798d83ea26f77a18606` (2026-02-23), cited as `https://github.com/mjrgh/PinballY/blob/d84763e/<path>#Lnn`, shortened to `JavascriptEngine.cpp#Lnn`, `PlayfieldView.cpp#Lnn`, `Product.wxs#Lnn` (`WixSetup/Product.wxs`), `release.bat#Lnn`.
- The local help (`docs/pinbally/Help/*.html`, PinballY 1.1.0 Beta 10), cited as `Help/<file>`, and `docs/research/system-scripts.md` (§1.1, §3.6), which already traced how the scripts load.
- Microsoft documentation, read from its source repositories because `learn.microsoft.com` was unreachable from this sandbox: `MicrosoftDocs/PowerShell-Docs` (cited `PS-Docs:<path>`), `MicrosoftDocs/windows-dev-docs` (`WinDev-Docs:<path>`), `dotnet/docs`. Each file is the source of the Learn page of the same name.
- GitHub documentation from `github/docs` (cited `GH-Docs:<path>`), the REST description `github/rest-api-description` (`api.github.com.yaml`), and live calls to `api.github.com` (2026-10-25).
- Our code, cited as `<path>:<line>`.

**Fact** = read in a primary source. **Inference** = my reading, not checked on Windows or on the cabinet. **Unverified** = no primary source reachable; check on the cabinet.

## Summary

1. **A broken or missing pack never takes PinballY down, but it takes every script down with it.** PinballY loads `Scripts\main.js` as an ES module; a missing import target is logged and the module graph never runs (Facts in §1). Since the import line sits in the player's own `Scripts\main.js`, a missing or broken `ExpansionPack\main.js` also stops the player's own code in that file (Inference). So the installer must never leave the import line without the folder, and uninstall must remove both.
2. **PinballY's location:** the MSI writes `HKCU\SOFTWARE\Pinscape Labs\PinballY\InstallPath` and defaults to `<Windows volume>\PinballY`; the zip release writes nothing, so the installer also needs a fallback (running `PinballY.exe`, then a prompt) (§2).
3. **Delivering a `.ps1` works without signing**, as long as it is started with `-ExecutionPolicy Bypass` (Windows clients default to `Restricted`), or pasted as `irm … | iex`. A zip that the script downloads itself with `Invoke-WebRequest` gets no Mark of the Web, so nothing inside it is "from the internet" (§3).
4. **SmartScreen only matters once we ship an `.exe`.** An unsigned `.exe` shows "Windows protected your PC". A signed one *also* warns until it builds a reputation, and EV no longer skips that. Artifact Signing (~$9.99/month) is closed to individuals outside the USA/Canada, so not open to a French individual maintainer. The other options are an OV certificate ($150–300/year) or SignPath Foundation (free for qualifying open source) (§4).
5. **GitHub Releases cover hosting and update checks:** `/releases/latest/download/<asset>` is a stable URL; `GET /repos/{owner}/{repo}/releases/latest` gives `tag_name` and asset digests; unauthenticated calls are limited to 60/hour per IP, which is plenty for one check per PinballY start (§5).
6. **PinballY itself can run the update check:** `HttpRequest` (MSXML) is async and returns a Promise, but it resolves **only on status 200**. A GitHub API call needs a `User-Agent` header (§6).
7. **Data that must survive an update** goes beyond `profiles\` and `.env.local`: `quiet_wheel_pending.json`, `tools\` (the owner's `vpxtool.exe`), `assets\sounds\local\` and `assets\images\default_scores\local\` (§7). Replace by staging and swapping folders, not by extracting over the old one.

### Recommended light path

1. **Version the pack.** It has no version today: no constant, no git tag, and `releases/latest` answers 404 for `F3L1X79/PinballY-Expansion-Pack` (live call). Add one version string in the code and one tag per release (`v1.0.0`).
2. **One release asset, `ExpansionPack.zip`, whose single top folder is `ExpansionPack\`.** The extracted folder then already has the right name, unlike GitHub's own source zip (`PinballY-Expansion-Pack-<tag>\`). `git archive --format=zip --prefix=ExpansionPack/` builds it and already applies our `export-ignore` list (`.gitattributes:4-16`). Making it in a maintainer script or a GitHub Actions workflow is a **build step: it needs the owner's approval**. Without it, the installer can use the release's automatic source zip and rename the folder.
3. **A second asset, `install.ps1`**, written for Windows PowerShell 5.1, saved as UTF-8 with BOM, ASCII-only if possible. It finds PinballY (§2), checks that it is closed, lets the player tick the Add-ons, downloads the zip with `Invoke-WebRequest -UseBasicParsing`, checks the asset's SHA-256 `digest`, extracts to a staging folder, carries the keep-list over (§7), swaps the folders, creates `.env.local` from `.env.example` on a first install, writes the ticked `ADD_ON_*` keys the same way `common/settings/env_local_rewrite.js` does, and adds `import "./ExpansionPack/main.js";` to `Scripts\main.js` if it is missing. If it finds a `.git` folder, it stops and tells the player to use `git pull`.
4. **Starting it, documented in the README:** `powershell -NoProfile -ExecutionPolicy Bypass -File install.ps1`, or the one-liner `irm https://github.com/F3L1X79/PinballY-Expansion-Pack/releases/latest/download/install.ps1 | iex`. Running the same script again updates the pack.
5. **Inside PinballY:** one `HttpRequest` to `releases/latest` per start, with an off switch in `.env.local`. It compares `tag_name` with the pack's version and shows a non-blocking notice through the wheel dialog module or a toast. Running the update from the pack later would reuse the restart helper pattern (ADR 0017), since the folder can only be swapped with PinballY closed.
6. **No `.exe` until there is a reason for one** (§4).

## 1. How PinballY loads user scripts

**Facts**
- Javascript starts only if `Scripts\main.js` exists, in the program folder (`Help/Javascript.html`, "How to enable scripting"; `PlayfieldView.cpp#L629-L632`, see `system-scripts.md` §1.1). The MSI installs only `Scripts\Scripts_Folder.txt` and `Scripts\System\*.js`, so a fresh install has **no** `main.js` (`Product.wxs#L175-L185`).
- `main.js` is loaded as a **module** (`PlayfieldView.cpp#L1314-L1316`, `JavascriptEngine.cpp#L375-L393`). Then PinballY runs pending tasks up to 100 times, "so that imported modules can receive events generated during startup" (`PlayfieldView.cpp#L1318-L1332`). The help documents `import` and dynamic `import()` for splitting code over several files (`Help/Javascript.html`, "How to use multiple script files").
- A relative specifier is resolved against the importing file's folder with `PathAppendW` into a `MAX_PATH` buffer (`JavascriptEngine.cpp#L1875-L1907`). So `import "./ExpansionPack/main.js"` from `Scripts\main.js` names `Scripts\ExpansionPack\main.js`.
- Each import becomes a `ModuleParseTask`. If the file can't be read, it logs `Error loading <path>` and returns **without parsing**, so ChakraCore never gets that module's source (`JavascriptEngine.cpp#L1717-L1733`). A syntax error is logged as an uncaught exception (`#L1755-L1772`). When the module graph reports an exception, `NotifyModuleReadyCallback` logs it and queues **no** evaluation task (`#L1692-L1711`). An exception while evaluating is logged as `Error executing module` (`#L1812-L1819`).
- These `[Javascript] …` lines go through the `JSLogging` feature (`#L1725`, `#L1731`, `#L1769`, `#L1817`), which is the "Javascript" option of the log settings (`Help/LogFileOptions.html`).
- A missing `Scripts\main.js` is not an error: Javascript simply doesn't start. A failing `LoadModule` only returns from `InitJavascript`; the frontend keeps running (`PlayfieldView.cpp#L1315-L1316`).
- File encoding: UTF-8 or UTF-16 with a byte-order mark, otherwise the ANSI code page (`FileUtil.cpp#L230-L282`, `system-scripts.md` §1.1). That is already a project rule (BOM on any `.js` with a non-ASCII character).

**Inference**
- With a missing `ExpansionPack\main.js`, the player's `Scripts\main.js` never runs either: in an ES module graph, a module runs only once every dependency is linked (ECMAScript, [InnerModuleEvaluation](https://tc39.es/ecma262/#sec-innermoduleevaluation)). PinballY still shows the wheel, with **no** scripts at all, and the log names the cause only if Javascript logging is on.
- The same goes for an exception thrown while one of our modules is being evaluated (at import time, not in `init()`): the evaluation stops and the importer's body does not run. `main.js` already isolates each `init()` (`main.js:190-207`) and `config.js` catches its own read errors (`common/core/config.js:172-182`). A throw at module level elsewhere would still take the player's own code down.
- Writing the line as a dynamic import, `import("./ExpansionPack/main.js").catch(e => logfile.log(…))`, would isolate the player's code from ours, and the 100-pass task loop should still finish loading it before startup events. **Unverified — check on the cabinet**, and it differs from the line the README and ADR 0009 document.

## 2. Where PinballY is installed and how to find it

**Facts**
- The MSI is **per-user** (`InstallScope="perUser"`, `Product.wxs#L16`). It proposes `[WINDOWSVOLUME]PinballY`, i.e. `C:\PinballY` on most machines, unless the registry already holds a path (`Product.wxs#L69-L79`, comment at `#L70-L74`).
- It writes the chosen folder to `HKCU\SOFTWARE\Pinscape Labs\PinballY`, value `InstallPath` (`Product.wxs#L113-L116`), and reads it back on upgrade (`#L62-L67`).
- Each release also ships zips (`PinballY-<date>.zip`, `PinballY-64bit-<date>.zip`) next to the MSIs (`release.bat#L28-L33`, `#L105-L107`; assets of the `1.1.0-Beta10` release, live API call). A zip install writes no registry key (Inference: no installer runs).
- The executable is `PinballY.exe` (`Help/CommandLine.html`). Inside PinballY, `systemInfo.programDir` gives the program folder, and the pack derives its own folder from it (`common/core/pinbally_host.js:51`).

**Recommended lookup order for the installer (Inference):**
1. `HKCU\SOFTWARE\Pinscape Labs\PinballY\InstallPath`, if `PinballY.exe` is in that folder.
2. The path of a running `PinballY.exe` (`Get-Process PinballY`), read before asking the player to close it.
3. `$env:SystemDrive\PinballY`.
4. Ask the player for the folder, then check that `PinballY.exe` and `Scripts\System\SystemClasses.js` are there.

## 3. PowerShell delivery

**Facts**
- Default execution policy: **Restricted** on Windows clients ("permits individual commands, but doesn't allow scripts"), **RemoteSigned** on Windows Server (`PS-Docs:reference/5.1/Microsoft.PowerShell.Core/About/about_Execution_Policies.md`, "PowerShell execution policies").
- `powershell.exe -ExecutionPolicy <policy>` sets the policy for that session only. It is kept in `$Env:PSExecutionPolicyPreference`, never in the registry, and overrides the machine and user policies **but not Group Policy** (same file, "Set a different policy for one session"). With `Bypass`, "nothing is blocked and there are no warnings or prompts" (same file).
- The execution policy "isn't a security boundary": typing the script's contents at the prompt gets around it (same file, "Long description").
- `RemoteSigned` blocks unsigned scripts that carry the "downloaded from the internet" mark, an alternate data stream that Edge and Internet Explorer add. `Unblock-File` removes that `Zone.Identifier` stream (zone 3) (same file, "Manage signed and unsigned scripts"; `PS-Docs:reference/5.1/Microsoft.PowerShell.Utility/Unblock-File.md`).
- **`Invoke-WebRequest`, `Invoke-RestMethod` and `curl.exe` may not mark what they download** (about_Execution_Policies, note under "Manage signed and unsigned scripts").
- Double-clicking a `.ps1` does not run it (`PS-Docs:…/About/about_Scripts.md`). "Run with PowerShell" in Explorer runs `powershell.exe -file "%1"` and "is subject to the configured execution policy" (`PS-Docs:…/About/about_Run_With_PowerShell.md`).
- `Invoke-Expression` comes with a caution: check what it runs before running it (`PS-Docs:reference/5.1/Microsoft.PowerShell.Utility/Invoke-Expression.md`).
- Windows PowerShell 5.1 is "installed by default on Windows". PowerShell 7 (`pwsh.exe`) installs side by side and does not replace it (`PS-Docs:reference/docs-conceptual/install/install-powershell-on-windows.md`). **Target 5.1.**
- Windows PowerShell 5.1 reads a script without a BOM in the ANSI code page: "If you need to use non-Ascii characters in your scripts, save them as UTF-8 with BOM" (`PS-Docs:…/About/about_Character_Encoding.md`). In 5.1, `-Encoding UTF8` writes a BOM (same file), which suits `.env.local` (ADR 0002 keeps it UTF-8 with BOM).
- In 5.1, `Invoke-WebRequest` needs `-UseBasicParsing` where Internet Explorer is missing (`PS-Docs:reference/5.1/Microsoft.PowerShell.Utility/Invoke-WebRequest.md`).
- `Expand-Archive` does **not** overwrite existing files unless given `-Force`. It uses `System.IO.Compression.ZipArchive` (2 GB limit per file), and file names not stored as UTF-8 come out raw (`PS-Docs:reference/5.1/Microsoft.PowerShell.Archive/Expand-Archive.md`). It has no option to delete files absent from the archive.
- The pack already launches a PowerShell script this way: `powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File <pack>\tools\restart_pinbally.ps1` (`common/core/pinbally_host.js:289-290`).

**Trade-offs (Inference)**
- `irm <url> | iex`: there is no file, so the execution policy and the Mark of the Web don't apply. But the player runs code they never saw, which the README should admit. Passing options means wrapping everything in one function called on the last line. That also protects against a download cut in the middle: nothing runs until the whole text has arrived.
- `-File install.ps1` after a browser download: the file carries the mark, and `-ExecutionPolicy Bypass` still runs it. A `.cmd` wrapper would save typing, but **unverified — check on the cabinet**: whether Explorer warns before running a marked `.cmd`, and whether Smart App Control blocks it (§4).
- A zip downloaded by `install.ps1` itself has no mark, so the question of whether Explorer or `Expand-Archive` copies the mark onto extracted files doesn't arise. A player who downloads the zip by hand and extracts it with Explorer may end up with a marked `tools\restart_pinbally.ps1`. Our `Bypass` launch would still run it (Fact above). Whether Explorer copies the mark: **unverified** (no Microsoft page reachable).
- TLS: `api.github.com` and `github.com` need TLS 1.2 or later. .NET Framework 4.7+ follows the OS default (TLS 1.2 on Windows 10, 1.3 on 11) for apps that *target* 4.7+ (`dotnet/docs:docs/framework/network-programming/tls.md`). Which framework `powershell.exe` targets is not documented there. To be safe: `[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12`. That OR keeps 1.3 available. **Unverified — check on the cabinet.**

## 4. SmartScreen and code signing

**Facts** (`WinDev-Docs:hub/apps/package-and-deploy/smartscreen-reputation.md`, 2026-05-04, and `WinDev-Docs:hub/apps/package-and-deploy/code-signing-options.md`, 2026-04-20)
- SmartScreen checks downloaded files on two signals: publisher reputation (the signing certificate) and file-hash reputation.
- No signature, or a self-signed one: "Windows protected your PC", and the player must choose "Run anyway". An enterprise policy can forbid that.
- OV/EV signature: still flagged "unrecognized" until reputation accumulates, but with the verified publisher name. "EV certificates no longer bypass SmartScreen" (since 2024).
- An unsigned file starts at zero reputation **with every new version**. A signed one can inherit the certificate's reputation. "Several weeks and hundreds of clean installs" may be needed, and there is no way to submit a file for review for consumer machines.
- On Windows 11, Smart App Control "will block execution of unsigned files unless the file has a positive reputation", for **all** executables, not only downloaded ones.
- Costs and eligibility:

| Option | Cost | Who | SmartScreen |
|---|---|---|---|
| Azure Artifact Signing (formerly Trusted Signing) | ~$9.99/month | Organizations: USA, Canada, EU, UK. **Individuals: USA and Canada only** | Reputation builds over time |
| OV certificate (DigiCert, Sectigo…) | $150–300/year; key on an HSM or hardware token since June 2023 | Worldwide | Same as Artifact Signing |
| EV certificate | $400+/year | Worldwide | Same as OV since 2024 |
| SignPath Foundation | Free for qualifying open-source projects | See signpath.io | OV-level |
| Microsoft Store (MSIX) | Free | Worldwide | No warning, but a Store app, not a script pack |

**Inference and unverified**
- The light path ships **no executable of ours**. The `.js` files are read by PinballY as data, and `vpxtool.exe` is installed by the owner. So SmartScreen only comes into play with a future `.exe`, and an unsigned one would warn at every release.
- The Microsoft support page "Smart App Control has blocked an app with a dangerous file extension" reportedly lists `.ps1` and `.bat` among the extensions it blocks when they come from the internet. I only saw it through a search summary; the page itself was unreachable. **Unverified — check on a Windows 11 machine with Smart App Control on**, both for `install.ps1` downloaded by a browser and for the pack's `restart_pinbally.ps1` launched with `-ExecutionPolicy Bypass`.

## 5. GitHub Releases

**Facts**
- `https://github.com/<owner>/<repo>/releases/latest/download/<asset-name>` downloads that asset of the latest release, **for assets uploaded by hand** (`GH-Docs:content/repositories/releasing-projects-on-github/linking-to-releases.md`).
- Every release also links a zip and a tarball of the tagged sources, made by GitHub (`GH-Docs:…/about-releases.md`). The repository name is part of the folder inside the archive (`GH-Docs:content/repositories/working-with-files/using-files/downloading-source-code-archives.md`), and our `.gitattributes` already keeps `maintainer/`, `tests/`, `docs/adr/`… out of it (`.gitattributes:4-16`).
- `GET /repos/{owner}/{repo}/releases/latest` returns "the most recent non-prerelease, non-draft release, sorted by the `created_at` attribute" (the commit date) (`api.github.com.yaml`, "Get the latest release"). The live response carries `tag_name`, `assets[].browser_download_url`, `zipball_url`, and for each asset a `digest` (`"sha256:…"`). The field was filled for the VPin Studio assets of 2026-10, and `null` for PinballY's 2024 assets.
- Unauthenticated REST calls: **60 per hour, per originating IP address** (`GH-Docs:data/reusables/rest-api/primary-rate-limit-unauthenticated-users.md`).
- "All API requests must include a valid `User-Agent` header… Requests with no `User-Agent` header will be rejected" (`GH-Docs:content/rest/using-the-rest-api/getting-started-with-the-rest-api.md`).
- `gh release create <tag> <files>` uploads assets as it creates the release (a draft first, published once uploaded) (`cli/cli:pkg/cmd/release/create/create.go`, help text). A GitHub Actions workflow on a tag push could run it with the workflow's token.
- `F3L1X79/PinballY-Expansion-Pack` has no release yet (`releases/latest` → 404, 2026-10-25) and no git tag (`git tag --list`).

**Inference**
- The `/releases/latest/download/ExpansionPack.zip` and `/install.ps1` links stay valid from one release to the next, so the README and the installer can hard-code them.
- Making the zip, by hand with `git archive`, through a maintainer `.mjs`, or in an Actions workflow, is a **build step that needs the owner's approval** (`.claude/rules/conventions.md`, "Dépendances"). With no build step at all, the installer can read `zipball_url` and rename the extracted folder, at the cost of an API call and no `digest`.

## 6. Update checks from inside PinballY

**Facts**
- `HttpRequest` works like the browser's `XMLHttpRequest`, through the Windows MSXML component. `send()` returns a Promise, and `open()` must be asynchronous so the UI doesn't freeze (`Help/HttpRequest.html`). `setRequestHeader(name, value)` is available (same page).
- The wrapper tries `Msxml2.XMLHTTP.6.0` down to `Microsoft.XMLHTTP`. It resolves with `responseText` **only when `status == 200`** and rejects with `new Error(statusText)` otherwise. The callback comes back on the UI thread through the Promise (upstream `scripts/system/SystemClasses.js#L2009-L2113` at `d84763e`; `system-scripts.md` §4.3).
- PinballY's own help shows this exact use: a version check at startup, a regex on the online file, a status-line message (`Help/UpdateCheckExample.html`).

**Consequences for our check (Inference)**
- One `GET https://api.github.com/repos/F3L1X79/PinballY-Expansion-Pack/releases/latest`, then `JSON.parse(reply).tag_name` compared with the pack's version. That is one call per PinballY start, well under 60 per hour.
- Set a `User-Agent` header (for example `PinballY-Expansion-Pack`). Whether MSXML lets a script replace its default User-Agent, and whether it already sends one: **unverified — check on the cabinet**.
- Conditional requests (`If-None-Match`, answered with 304) would land in `.catch()`, because only 200 resolves: don't use them. MSXML on top of WinINet may cache the reply. **Unverified**; a query string such as `?t=<date>` would get around it.
- A cabinet offline, or past its quota (403/429), ends in `.catch()`: log one line, show nothing. Wrap the handlers in `safeHandler` (`.claude/rules/conventions.md`).
- The notice is a spontaneous dialog, so it goes through `getWheelDialogs().submit(...)` with a `DIALOG_PRIORITY`, or a toast-like drawn layer (the roadmap's `#error-toast` item). PinballY's example uses the status line, which a settings reload clears (`Help/UpdateCheckExample.html`).
- Contacting GitHub at every start is a new network call from the cabinet: give it an off switch in `.env.local`.

## 7. Preserving user data on update

**Files the pack writes or the owner adds inside `Scripts\ExpansionPack\`** (grep of `main.js`, `common/`, `addons/` for `writeText`, `SaveToFile`, `CreateTextFile`, `MoveFile`, `CreateFolder`, plus `.gitignore`):

| Path | What | Source |
|---|---|---|
| `.env.local` | Player settings; rewritten by the Expansion Pack Settings | `common/core/config.js:171`, `common/settings/expansion_pack_settings.js:80`, `:234` |
| `profiles\` (all of it) | Each Profile's `profile.json`, its backups and `.reset-<date>` copies, the yearly play logs, Avatars. Only `profiles\guest\avatar.png` ships | `common/profiles/profile_store.js:67`, `:140`, `:195-200`, `:342`, `:360`; `.gitignore:27-31` |
| `quiet_wheel_pending.json` | A table volume to restore after a crash | `common/core/quiet_wheel.js:22`, `:31`, `:57`; `.gitignore:33-34` |
| `tools\` except `restart_pinbally.ps1` | The owner's `vpxtool.exe` (README step 4), and any file next to it | `common/table_roms/script_queue.js:29`; `.gitignore:36-38` |
| `assets\sounds\local\` | Personal sounds named in `.env.local` | `.gitignore:40-41`, `common/core/config.js:40-43` |
| `assets\images\default_scores\local\` | Personal Default Score images | `.gitignore:43-44` |

Outside the folder: run files and the restart log in `%TEMP%\PinballYExpansionPack` (`common/core/pinbally_host.js:28-30`), which an update doesn't touch. ADR 0009 already chose to keep the player's data inside the pack folder and to make the installer preserve it (`docs/adr/0009-…md`, "Consequences").

**Safe replace (Inference)**
1. Check that PinballY is not running (`Get-Process PinballY`). Folders can't be renamed while files in them are open, and swapping during a session would mix two versions.
2. Download and check the zip, then extract it to `Scripts\ExpansionPack.new\`.
3. Copy the keep-list from `ExpansionPack\` into `ExpansionPack.new\`, overwriting the shipped `profiles\guest\avatar.png` with the owner's.
4. Rename `ExpansionPack\` to `ExpansionPack.old-<date>\`, then `ExpansionPack.new\` to `ExpansionPack\`. Both renames happen on the same volume. If the second fails, rename the old folder back.
5. Keep the newest `.old-<date>` folder as a rollback, and delete older ones.

Extracting over the old folder with `Expand-Archive -Force` would keep the data, since none of it is in the zip (`.env.local` and `profiles\*` are git-ignored, so they're absent from any archive). But it would also leave behind files that a release deleted, and stop halfway on a locked file. The swap avoids both.

## 8. How comparable tools distribute (brief)

- **PinballY**: GitHub Releases with an MSI and a zip, 32- and 64-bit (`1.1.0-Beta10` assets, live API call; `release.bat`). Its own update example only *reads* a version file and shows a status-line message; it never installs anything (`Help/UpdateCheckExample.html`).
- **PinballY-Addons-and-Examples**: manual steps. Put the `.js` in `Scripts`, create `Main.js` if there is none, add `import "xxx.js"` (README of `PinballY/PinballY-Addons-and-Examples`, lines 47-49). This is the convention our import line follows.
- **VPin Studio** (`syd711/vpin-studio`): GitHub Releases published by `github-actions[bot]`, with `.exe` installers and zips for each platform, each asset carrying a SHA-256 `digest` (release `5.5.1`, live API call).
- **Baller Installer, PinUP Popper add-ons**: distributed from Nailbuster's site and forums. No primary release page found; not compared.

## Open questions to check on the cabinet

1. With `Scripts\main.js` importing a missing `ExpansionPack\main.js`: does PinballY start with no scripts at all (player's own code included), and what does `PinballY.log` show with and without the "Javascript" log option?
2. Does the dynamic form `import("./ExpansionPack/main.js")` load the pack in time for startup events (initial game selection, Startup Screen), and does it keep the player's code alive when the pack throws?
3. Is `HKCU\SOFTWARE\Pinscape Labs\PinballY\InstallPath` present on the cabinet, and does it point to the folder that holds `PinballY.exe`?
4. Does `powershell.exe` 5.1 on the cabinet reach `api.github.com` without forcing TLS 1.2?
5. Does MSXML's `HttpRequest` send a User-Agent that GitHub accepts, and does `setRequestHeader("User-Agent", …)` replace it? Does a second call in the same session return a cached reply?
6. Does extracting the release zip with Explorer mark `tools\restart_pinbally.ps1`, and does the restart still work with it marked?
7. With Smart App Control on (Windows 11), are `install.ps1` downloaded by a browser, a `.cmd` wrapper, and the pack's `restart_pinbally.ps1` blocked?
8. Can PinballY's open files keep the `ExpansionPack` folder from being renamed right after it quits, i.e. how long should the installer wait?
