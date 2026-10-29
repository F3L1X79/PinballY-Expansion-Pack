# Research: Discord Rich Presence from the pack, without a library

Date: 2026-10-29. Roadmap item "Discord Rich Presence" (`docs/roadmap.html`, `id="discord"`). Sources:
- Discord's official developer docs, read from their source repo `github.com/discord/discord-api-docs` at commit `c989436` (2026-10-29), cited as `api-docs:<path>#Lnn` (`developers/topics/rpc.mdx`, `developers/events/gateway-events.mdx`, `developers/discord-social-sdk/development-guides/setting-rich-presence.mdx`, `developers/developer-tools/game-sdk.mdx`, `developers/rich-presence/*.mdx`, `developers/change-log.mdx`). The published pages are the same files under `https://discord.com/developers/docs/…` (WebFetch of discord.com failed in this sandbox).
- The official `github.com/discord/discord-rpc` library, `master` at `963aa9f`, read from `raw.githubusercontent.com`, cited as `discord-rpc:<path>#Lnn`.
- Microsoft's Win32 docs, read from their source repo `github.com/MicrosoftDocs/sdk-api` (branch `docs`, `sdk-api-src/content/…`), cited as `win32:<API>` (learn.microsoft.com was unreachable from the sandbox).
- PinballY: the local help `docs/pinbally/Help/DllImport.html` and `HandleObject.html` (1.1.0 Beta 10), the digest `docs/pinbally/pinbally-help.md`, `docs/research/system-scripts.md`, and upstream `PinballY/JavascriptEngine.cpp` at `d84763e`.
- Our code: `common/core/pinbally_host.js`.
- Discord's Developer Terms of Service: **not read directly** (support-dev.discord.com refused the sandbox's connection, 502); only search-engine extracts, flagged as such in §3.

**Fact** = read in a primary source. **Inference** = my reading, not checked on a running PinballY or Discord. **To verify on the cabinet** = nothing read settles it.

## Verdict

**Feasible without a library, with three risks.** Everything the official library does on Windows is five kernel32 calls that our code already binds in the same style (`CreateFileW`, `ReadFile`, `CloseHandle`, `GetCurrentProcessId` in `common/core/pinbally_host.js:81-86`, `:303`), plus `WriteFile` and `PeekNamedPipe`. The official library itself never blocks on a read: it asks `PeekNamedPipe` how many bytes are waiting and only reads when the whole frame is there (`discord-rpc:src/connection_win.cpp#L110-L123`). The same polling fits in a `setTimeout`/`setInterval` on PinballY's UI thread.

Main risks:
1. **The client ID in an open-source repo.** The current Developer Terms say "developer credentials may not be embedded in open source projects", and the 2022 version listed the "Application ID" among those credentials (search extracts, §3). Whether today's text still counts the Application ID as a credential could not be read. This is the one blocker that is not technical; Félix should read §2(d) of the current Terms before choosing "one shared app".
2. **A `WriteFile` that blocks the UI thread** if Discord stopped reading its end (hung client). Win32 says a write to a full pipe "may not finish immediately" (`win32:WriteFile`, Pipes). Our frames are a few hundred bytes, so this needs a hung Discord with a full pipe buffer (Inference); it cannot be ruled out without overlapped I/O.
3. **No reliable `GetLastError`.** PinballY's native-call code never saves the last error (`JavascriptEngine.cpp` has no `GetLastError`/`SetLastError`, grep), so "pipe not found" and "pipe busy" cannot be told apart reliably from Javascript (Inference). Not a blocker: try pipes 0 to 9, and treat any failure as "Discord not there, try again later".

The `CParser.js` trap (C6) does not stand in the way: the declarations are plain prototypes; they just must not end with a `//` comment nor hold an unclosed `/*` (§1.5).

## 1. Feasibility through `dllImport`

### 1.1 The protocol (facts)

- **Pipe name.** Windows: `\\?\pipe\discord-ipc-{n}` (`api-docs:developers/topics/rpc.mdx#L19-L23`). The library tries `n` from 0 to 9 and keeps the first that opens: `pipeName[pipeDigit] < L'9'` … `pipeName[pipeDigit]++` on `ERROR_FILE_NOT_FOUND` (`discord-rpc:src/connection_win.cpp#L35-L53`). "Discord can be on any pipe ranging from `discord-ipc-0` to `discord-ipc-9`" (`discord-rpc:documentation/hard-mode.md`, Notes).
- **Open.** `CreateFileW(pipeName, GENERIC_READ | GENERIC_WRITE, 0, nullptr, OPEN_EXISTING, 0, nullptr)`: synchronous handle, no `FILE_FLAG_OVERLAPPED` (`connection_win.cpp#L40-L41`). On `ERROR_PIPE_BUSY` the library calls `WaitNamedPipeW(pipeName, 10000)` (`#L54-L58`), which waits up to 10 s; it can afford that because it runs on its own IO thread (`discord-rpc:src/discord_rpc.cpp#L80-L100`). **We must never call `WaitNamedPipeW`** on the UI thread.
- **Frame.** An 8-byte header, then the JSON: `struct MessageFrameHeader { Opcode opcode; uint32_t length; }` (`discord-rpc:src/rpc_connection.h#L25-L28`). "The opcode and length in the header are `Little Endian Unsigned Integers (32bits)`" and "the pipe expects for frames to be written in a single byte array. You cannot do multiple `stream.Write(opcode);` `stream.Write(length);` as it will break the pipe" (`hard-mode.md`, Notes). Opcodes: `0` HANDSHAKE, `1` FRAME, `2` CLOSE, `3` PING, `4` PONG (`rpc.mdx#L52-L60`; `rpc_connection.h#L17-L23`). Max frame 64 KiB (`rpc_connection.h#L8`).
- **Handshake.** Opcode 0 with `{"v":1,"client_id":"…"}` (`rpc.mdx#L31-L45`; `discord-rpc:src/serialization.cpp#L170-L183`, `RpcVersion = 1` at `rpc_connection.cpp#L6`). "Upon success, Discord will respond with a `FRAME` (Opcode `1`) containing the `READY` event" (`rpc.mdx#L47`). Note: the doc's example says "Length 45" for a 40-byte payload; the length must be the real UTF-8 byte count.
- **No authentication for presence.** "Unlike most other features of the Discord Social SDK, **Rich Presence can be set without authentication** … by directly communicating with a running Discord client through RPC" (`api-docs:…/setting-rich-presence.mdx#L344-L347`). The general RPC page says any command needs `AUTHORIZE` first (`rpc.mdx`, "Authenticating"), but the official library sends `SET_ACTIVITY` right after the handshake and never authorizes (`discord_rpc.cpp`, whole file: no `AUTHORIZE`), so presence is the exception.
- **SET_ACTIVITY.** A FRAME with `{"cmd":"SET_ACTIVITY","args":{"pid":<pid>,"activity":{…}},"nonce":"<string>"}` (`serialization.cpp#L83-L168`; `rpc.mdx#L1125-L1176`). `pid` is "the application's process id" (`rpc.mdx#L1138`), from `GetCurrentProcessId()` (`connection_win.cpp#L10-L13`). Allowed `type`: Playing 0, Listening 2, Watching 3, Competing 5 (`rpc.mdx#L1133`).
- **Clearing.** `Discord_ClearPresence()` is `Discord_UpdatePresence(nullptr)` (`discord_rpc.cpp#L380-L383`), which writes the same command with `args` holding only `pid`, no `activity` (`serialization.cpp#L101-L106`).
- **Replies.** "IPC will echo back every command you send as a response. Use this as a lock-step feature to avoid flooding messages" (`hard-mode.md`, Notes). An error comes back as `evt: "ERROR"` with `data.code` / `data.message` (`discord_rpc.cpp#L158-L166`). Discord may send PING; the library answers with PONG carrying the same payload (`rpc_connection.cpp#L120-L125`).

### 1.2 Does the handshake reply have to be read before SET_ACTIVITY?

- **Fact:** the library only moves to `Connected` after reading a FRAME with `cmd == "DISPATCH"` and `evt == "READY"` (`rpc_connection.cpp#L33-L44`), and it only writes presence while connected (`discord_rpc.cpp#L141-L146`, writes at `#L218-L229` are in the `else` branch of `!Connection->IsOpen()`).
- **Inference:** waiting for READY is the safe order. No source says what Discord does with a `SET_ACTIVITY` sent before READY. Waiting costs nothing: poll `PeekNamedPipe` every ~100-250 ms until 8 bytes plus the header's length are available.

### 1.3 Does the pipe have to be read at all?

- **Fact:** every command is echoed back (`hard-mode.md`), so a client that never reads gets one reply per `SET_ACTIVITY` piling up in the pipe. The library drains everything on each tick (`discord_rpc.cpp#L150-L215`).
- **Fact:** a writer blocks when the pipe buffer is full, until the reader frees space (`win32:WriteFile`, Pipes: "the write operation may not finish immediately").
- **Inference:** if we never read, Discord's writes to us eventually fill the buffer; what Discord does then (drop the connection, stall that connection) is unknown. Unanswered PINGs might also make Discord close the pipe. So: read, but only what `PeekNamedPipe` says is there. Draining on each poll tick is cheap.

### 1.4 Non-blocking from the UI thread

- **Fact:** `PeekNamedPipe` "always returns immediately in a single-threaded application, even if there is no data in the pipe. The wait mode of a named pipe handle (blocking or nonblocking) has no effect" (`win32:PeekNamedPipe`, Remarks). It can block "in a multi-threaded application" on a synchronous handle. PinballY is multi-threaded (launch thread, `pinbally-help.md` §launch timing), but no other thread touches our handle (Inference: the block the doc means comes from concurrent I/O on the same handle).
- **Fact:** `CreateFile` on a named pipe does not wait: it fails with `ERROR_FILE_NOT_FOUND` when no server pipe exists, or `ERROR_PIPE_BUSY` when all instances are connected (`win32:CreateFileW`, Pipes).
- **Fact:** `ReadFile` on a synchronous handle blocks until it gets data; the library only calls it after `PeekNamedPipe` reported `bytesAvailable >= length` (`connection_win.cpp#L110-L116`). Doing the same, a read never waits (Inference).
- **`FILE_FLAG_OVERLAPPED`** would make writes non-blocking too, but needs an `OVERLAPPED` struct and an event kept alive between calls and polled with `GetOverlappedResult`. `dllImport.create()` memory stays valid while the JS object is referenced (`Help/DllImport.html`, native object memory management), so it is possible, just more code. Recommendation: synchronous handle plus `PeekNamedPipe`, like the official library; overlapped only if risk 2 shows up on the cabinet.
- **Fact:** PinballY's Javascript runs on the UI thread and long operations "can make the UI appear to be frozen" (`pinbally-help.md`, Threading, from `Javascript.html`); native code must not call back into Javascript from another thread (`DllImport.html`, end of "Limitations"). So no `CreateThread`, no callbacks: polling from `setInterval` is the only design.

### 1.5 Building the frame in ChakraCore, and the bind

- **Fact:** a typed array whose type matches the pointer (`UINT8 *` ↔ `Uint8Array`) is passed as a direct pointer (`DllImport.html`, argument table, "Pointer / Typed Array"); an `ArrayBuffer` can go "anywhere that a native function expects a native pointer type" (`DllImport.html`, "Working around limitations", Approach 1). Out-parameters: `dllImport.create("DWORD")` (`pinbally_host.js:98`). A `LPCWSTR` takes a JS string as is (`DllImport.html`, argument table). Our `ReadFile` call already passes `null` for `lpOverlapped` (`pinbally_host.js:99`).
- **Inference:** the frame is a `Uint8Array(8 + n)` filled through a `DataView` (little-endian `setUint32(0, op, true)`, `setUint32(4, n, true)`) and the UTF-8 bytes of `JSON.stringify(payload)`. `TextEncoder` is not documented for ChakraCore in PinballY; `unescape(encodeURIComponent(s))` gives one char per UTF-8 byte in plain ES5. `DataView` is already used in `common/high_scores/compound_file_reader.js:22`. Table names with accents need this; LPCSTR-style ANSI conversion must not be used.
- **The C6 trap.** A declaration string that ends with a `//` comment (no newline after it) or holds an unclosed `/*` loops forever in `CParser.js` and freezes PinballY (`docs/research/system-scripts.md`, C6). Note that the help itself shows `typedef …;  // step 1` lines (`DllImport.html` at the `WNDENUMPROC` example); copied into a string, the last such line would trigger the trap. Our bind strings carry no comments at all; keep it so.

Illustrative bind, in the style of `pinbally_host.js:81-86` (no comments inside the string):

```js
kernel32 = dllImport.bind("Kernel32.dll", `
    HANDLE WINAPI CreateFileW(LPCWSTR lpFileName, DWORD dwDesiredAccess, DWORD dwShareMode, LPVOID lpSecurityAttributes, DWORD dwCreationDisposition, DWORD dwFlagsAndAttributes, HANDLE hTemplateFile);
    BOOL WINAPI WriteFile(HANDLE hFile, UINT8 *lpBuffer, DWORD nNumberOfBytesToWrite, DWORD *lpNumberOfBytesWritten, LPVOID lpOverlapped);
    BOOL WINAPI ReadFile(HANDLE hFile, UINT8 *lpBuffer, DWORD nNumberOfBytesToRead, DWORD *lpNumberOfBytesRead, LPVOID lpOverlapped);
    BOOL WINAPI PeekNamedPipe(HANDLE hNamedPipe, LPVOID lpBuffer, DWORD nBufferSize, DWORD *lpBytesRead, DWORD *lpTotalBytesAvail, DWORD *lpBytesLeftThisMessage);
    BOOL WINAPI CloseHandle(HANDLE hObject);
    DWORD WINAPI GetCurrentProcessId();
`);
```

Failure detection: `isInvalidHandle(handle)` (`pinbally_host.js:72`) after `CreateFileW`; a `PeekNamedPipe`, `ReadFile` or `WriteFile` that returns false means the pipe is gone (the library closes on any such failure, `connection_win.cpp#L119-L126`, `rpc_connection.cpp#L74-L77`).

### 1.6 Stale presence when PinballY exits

- **Fact:** the library clears on shutdown only by closing the pipe (`Discord_Shutdown` → `RpcConnection::Destroy` → `CloseHandle`, `discord_rpc.cpp#L355-L366`, `rpc_connection.cpp#L16-L21`); it sends no clear first.
- **Inference:** Discord drops the activity when the IPC connection closes, and Windows closes every handle of a process that exits or crashes, so a PinballY crash also clears it. Sending a clear on the PinballY `quit`-side events is a nicety, not a need. **To verify on the cabinet:** the status disappears within seconds when PinballY is killed from Task Manager.

## 2. Privacy: what is public

- **Fact:** "Rich Presence data appears publicly on your Discord profile" (`api-docs:developers/rich-presence/overview.mdx`, warning). It is shown in "User profiles, Friend lists, Server member lists" (`setting-rich-presence.mdx`, "Understanding Rich Presence").
- **Fact, fields that show:** the app `name` ("Playing {name}"), `details` ("What the player is currently doing"), `state`, `timestamps` (elapsed or remaining time), `assets.large_text` / `small_text` (hover texts of the two images), `party.size` ("2 of 4"), up to two `buttons` with label and URL, and `details_url` / `state_url` / `large_url` / `small_url` making those clickable (`gateway-events.mdx#L1289-L1310`, `#L1379-L1389`, `#L1434-L1441`; `setting-rich-presence.mdx#L37-L47`, `#L211-L229`). `status_display_type` chooses whether the compact status line shows the name, the state or the details (`gateway-events.mdx#L1337-L1343`). `secrets` and `party.id` are join tokens, not shown as text.
- **Fact, the user controls:** "It is possible for users to hide their presence on Discord (User Settings -> Game Activity). Presence set through this SDK may not be visible when this setting is toggled off" (`game-sdk.mdx#L751-L752`). Since 2026-09-17 a private profile hides *custom* status (type 4) from bots, while "other activity types … may be controlled by Activity Sharing settings" (`change-log.mdx`, 2026-09-17 entry).
- **Inference, whose status it is:** the presence lands on whichever Discord account is signed in on the cabinet PC, not on the pack's Profile. Every Profile's play shows on that one account. So:
  - Never put a Profile name in any field when the active Profile is a Child Profile; simpler and safer: never put any Profile name at all, only table, mode (wheel, Challenge, Table of the Day) and elapsed time.
  - While a Child Profile plays, the table name itself is public. Adult Tables are already kept away from Child Profiles (`GLOSSARY.md`, Child Profile), so no Adult Table name can appear because a child played it; an adult playing one shows it. An option to hide Adult Tables (or show a generic "Playing a table") is worth deciding in the grilling.
  - Hover texts and buttons are public too: no paths, no Profile names, no high-score initials.
- Field limits from the library header: `state`, `details`, `large_text`, `small_text` "max 128 bytes", image keys "max 32 bytes" (`discord-rpc:include/discord_rpc.h`, `DiscordRichPresence`); buttons: label 1-32 characters, URL 1-512 (`gateway-events.mdx#L1438-L1441`). The best-practices checklist asks for strings that fit on one line in the small profile pop-out (`rich-presence/best-practices.mdx#L73-L81`).

## 3. The Discord application (client ID)

- **Fact, what an app needs:** "Your application must be registered with Discord and have a valid Application ID" (`setting-rich-presence.mdx#L349-L352`); the app is created on the Developer Portal (`discord-social-sdk/getting-started/partials/getting-started.mdx#L15`). Nothing in these pages asks for review or approval for presence over RPC; the RPC "approved testers" limit concerns the authorized RPC commands (`rpc.mdx`, "Restrictions"; Inference that it does not apply to `SET_ACTIVITY`, since the library never authorizes).
- **Fact, the app's name is the first line:** "By default, Rich Presence displays your application's name as it's registered on Discord (the top line …)", which `Activity::SetName` can override in the Social SDK (`setting-rich-presence.mdx`, "Setting the Application Name"). Whether `name` in a raw `SET_ACTIVITY` overrides it is not documented: **to verify on the cabinet**.
- **Fact, art assets are per app:** uploaded on the app's "Art Assets page", up to 300, keys lowercased, PNG/JPEG/WebP, 1024×1024 recommended (`setting-rich-presence.mdx#L89-L107`).
- **Fact, external images now work:** "To use an external image via media proxy, specify the URL as the field's value when sending" (`gateway-events.mdx#L1394-L1396`); "External URL assets … support any publicly accessible image URL, including GIF, animated WebP, and AVIF" (`#L1403-L1407`); "If you need more than 300 custom assets or want to use images stored somewhere else" (`setting-rich-presence.mdx#L99`, `#L204`). **Inference:** the cabinet's wheel images are local files, so they cannot be shown unless they are hosted publicly; a per-table image would need a public URL per table. A pack logo uploaded once (or served from the repo's raw GitHub URL) works for everyone with a shared app.
- **Fact, rate limit:** "5 updates per 20 seconds" (`game-sdk.mdx#L749`, the archived Game SDK; the current docs give no figure for RPC). **Inference:** update on launch, game over, mode change; debounce wheel browsing (several seconds of rest on one table) or do not show the wheel's current table at all.
- **Developer Terms (search extracts only, not read in full):** the current Developer Terms of Service §2(d) "Developer Credentials" says "For the avoidance of doubt, developer credentials may not be embedded in open source projects"; the 2022 version listed "developer credentials (such as your Application ID, passwords, keys, tokens, and client secrets)" and required treating them as confidential; the 2020 version listed "passwords, keys, and client secrets" without the Application ID. Source URLs: `https://support-dev.discord.com/hc/en-us/articles/8562894815383` (current), `…/25280523748759` (2022), `…/25280483153687` (2020).
- **Inference on the two options:**
  - *One shared app owned by Félix*: one-click for every player, logo uploaded once, name "PinballY Expansion Pack" (or similar). Risk: the ID is in a public repo, which the Terms may forbid if they still count the Application ID as a credential. Counterpoint (Inference): the client ID is not secret by nature, since every game sends it in clear over the local pipe and Discord returns `application_id` in every user's activity (`gateway-events.mdx#L1298`); there is no secret in the presence flow.
  - *One app per installation*: the owner creates an app, pastes its ID in a setting, uploads his own art. Nothing embedded in the repo, but a Discord developer account and a portal visit per cabinet, which most players will skip.
  - A middle way: the shared ID is not in the repo but downloaded or entered once; it changes the repo, not the distribution, so it only matters if the Terms are read strictly.
- **Not checked:** Discord's rules on naming an app after another product (PinballY is mjrgh's, not ours); the Developer Policy's user-data clauses (page unreachable).

## 4. Discord running or not, several clients, alternatives

- **Fact:** "The Discord desktop client must be running on the user's machine" (`setting-rich-presence.mdx#L349-L351`). With no client, no pipe exists and `CreateFile` fails with `ERROR_FILE_NOT_FOUND` (`win32:CreateFileW`, Pipes).
- **Fact, reconnect:** the library retries with a backoff "from 0.5 seconds to 1 minute" (`discord_rpc.cpp#L72-L73`) and closes and starts over on any failed read or write (`connection_win.cpp#L119-L126`; `rpc_connection.cpp#L74-L77`, `#L88-L95`); a CLOSE frame from Discord carries `code` and `message` (`rpc_connection.cpp#L110-L116`).
- **Inference for us:** started after PinballY, or restarted mid-session, Discord is picked up by the next retry; closed mid-session, the next `PeekNamedPipe` fails and we go back to retrying. A retry is ten `CreateFileW` calls that fail at once, so every 15-60 s it costs nothing visible. Stop retrying during a game if Félix prefers (the presence would then wait for the game's end).
- **Fact, PTB/Canary:** each client takes a free `discord-ipc-n`; "For multiple clients (eg Discord and Canary), you might want to add a feature to manually select the pipe" (`hard-mode.md`, Notes). Inference: the first pipe that opens wins, which is the right default on a cabinet with one client.
- **Fact, alternatives, all libraries:** `discord-rpc` is deprecated ("This library has been deprecated in favor of Discord's GameSDK", `discord-rpc:README.md`); the Game SDK "has been archived" (`game-sdk.mdx#L9-L15`); the Discord Social SDK is the recommended path for new projects (`rpc.mdx#L13-L15`) and can set presence without authentication (`setting-rich-presence.mdx#L340-L355`), but it is a native DLL to ship, which the pack refuses. The raw IPC protocol is documented as the current transport ("RPC over IPC", `rpc.mdx#L9-L11`), while RPC over WebSocket is "deprecated" (`rpc.mdx`, accordion).
- **Another route already in the repo (Inference):** a PowerShell helper in `tools\`, started hidden like `createHelperQuitter` (`pinbally_host.js:290-330`), could own the pipe and get presence updates through a file. It removes risk 2 (a blocked write would block the helper, not PinballY) at the cost of a process, a file protocol and PowerShell's startup time. The `pid` sent would then be PinballY's, passed as `-ParentPid` as today.
- **Inference, auto-detection:** Discord's own game detection may already show "Playing Visual Pinball X" (or PinballY) for a detected executable; two activities could then appear. **To verify on the cabinet.**

## To verify on the cabinet

1. `CreateFileW("\\\\?\\pipe\\discord-ipc-0", …)` through `dllImport` returns a valid handle while Discord runs, and an invalid one at once when it does not.
2. The READY frame arrives and is read through `PeekNamedPipe` + `ReadFile` without any visible hitch on the wheel (measure the poll tick's time).
3. `SET_ACTIVITY` with an accented table name shows the accents right (UTF-8 encoding of the payload).
4. Whether `activity.name` in a raw `SET_ACTIVITY` replaces the app's name on the first line.
5. Whether `timestamps.start` wants milliseconds (current docs, `gateway-events.mdx#L1354`) or seconds (library examples use `time(nullptr)`, `hard-mode.md`); check that "elapsed" shows the right time.
6. The presence disappears when PinballY quits normally and when it is killed.
7. Closing and reopening Discord mid-session: the presence comes back after the next retry.
8. Whether Discord's own game detection shows a second activity next to ours, during a VPX game.
9. External image URL (e.g. the pack logo on `raw.githubusercontent.com`) shows as the large image.
10. Félix reads §2(d) of the current Developer Terms and decides whether the shared client ID may sit in the repo.
