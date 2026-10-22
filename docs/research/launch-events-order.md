# Research: the order of PinballY's launch events

Question: in what order does PinballY fire its launch events, and how do the launch overlay events (`launchoverlayshow`, `launchoverlaymessage`, `launchoverlayhide`) interleave with the lifecycle events (`prelaunch` … `postlaunch`, `gamestarted`, `gameover`, `launcherror`)? The help gives each sequence on its own, never the two together.

**Short answer:** for a successful launch, PinballY fires `prelaunch`, `launchoverlayshow`, `"init"`, `runbeforepre`, `"launching"`, `runbefore`, `"running"`, `gamestarted`, `"gameover"`, `gameover`, `runafter`, `"after"`, `runafterpost`, `launchoverlayhide`, `postlaunch`. The first three fire inside the `mainWindow.playGame()` call itself. Everything after them comes from the launch thread.

## Sources

- PinballY source, `mjrgh/PinballY` on `master`, read on 22/10/2026: `PinballY/PlayfieldView.cpp` (**PFV**) and `PinballY/Application.cpp` (**APP**). Line numbers are approximate. This code has not been matched to the release installed on the cabinet.
- **[unverified]** marks a point that was inferred from the code without being run. Those points need a trace on the cabinet.

## 1. Successful launch

1. `prelaunch`: fired by `LaunchQueuedGame` (PFV ~5615) before anything else.
2. `Application::LaunchNextQueuedGame` starts the monitor thread (APP 2575). If that succeeds, `BeginRunningGameMode` runs (PFV 5671).
3. `launchoverlayshow`: fired in `BeginRunningGameMode` (PFV 9965).
4. `launchoverlaymessage "init"` (message null): fired in the same function. The overlay's 150 ms fade-in starts here (PFV 12622).
5. `runbeforepre`: fired on `PFVMsgGameRunBefore` (PFV 10341), which the thread sends after the external Run Before Pre command (APP 3283).
6. `launchoverlaymessage "launching"`: fired in the same handler.
7. `runbefore`: fired in the same handler (PFV 10353). The external Run Before command runs after it (APP ~3292).
8. `launchoverlaymessage "running"`: fired on `PFVMsgGameLoaded` (PFV ~10425). The thread sends that message (APP 3823) only if no close command was issued yet.
9. `gamestarted`: fired in the same handler, after `"running"` (PFV 10430).
10. `launchoverlaymessage "gameover"`: fired on `PFVMsgGameOver` (PFV 10468), but only if the UI is not already in Exiting mode.
11. `gameover`: fired in the same handler (PFV 10489). The thread sends that message at APP 5240.
12. The external Run After command runs. Then `runafter` fires on `PFVMsgGameRunAfter` (PFV 10373).
13. `launchoverlaymessage "after"` (message null): fired in the same handler.
14. `runafterpost`: fired in the same handler. The external Run After Post command runs after it (APP 5255).
15. `launchoverlayhide`: fired in `EndRunningGameMode` (PFV 10180), which the `PFVMsgLaunchThreadExit` handler calls. The thread sends that message from `SMain` (APP 2626).
16. `postlaunch`: fired in the same handler, after `EndRunningGameMode` (PFV 10507).

## 2. Threads and timing

- Steps 1 to 4 run synchronously inside `mainWindow.playGame()`, through `JsPlayGame` → `PlayGame` → `LaunchQueuedGame`.
- Every later event comes from the monitor thread through `SendMessage`. The thread blocks until each handler returns, so these events run on the UI thread, one at a time. The return values of the `runbeforepre` and `runbefore` handlers can cancel the launch.
- `launchoverlayhide` fires when the 150 ms fade-out starts, not when it ends. The popup is released when the fade ends (PFV 12753).
- A 5000 ms timer (`runFreezeTimerID`) starts after `gamestarted`. It fires no JS event.

## 3. Launch failure

Steps 1 to 7 run as above. Then the process launch fails (APP 3511, 3545, 3613, 3712). On `PFVMsgGameLaunchError`, the order is:

1. `launcherror` (PFV 10535).
2. `EndRunningGameMode`, which fires `launchoverlayhide`.
3. On `PFVMsgLaunchThreadExit`, `EndRunningGameMode` runs again, then `postlaunch` fires.

None of `"running"`, `gamestarted`, `"gameover"`, `gameover`, `runafter`, `"after"` and `runafterpost` fires. The external Run After and Run After Post commands still run, through guard objects, but they fire no JS event.

- **[unverified]** `launchoverlayhide` probably fires twice. The thread-exit message follows immediately, while the fade is still running. The overlay popup is therefore still set, and the guard in `EndRunningGameMode` does not stop the second call.
- If the thread itself cannot be created (APP 2577), only `prelaunch` and PinballY's error message appear. No overlay event and no `launcherror` fire.

## 4. Media capture

- A capture follows the same order as a launch, through the same thread.
- The `"launching"` text changes, and `"capturing"` replaces `"running"` (PFV 10421). `gamestarted` and `gameover` still fire.
- After the capture, the thread closes the game itself (APP ~5141). The UI is therefore not in Exiting mode, and `"gameover"` fires, never `"terminating"`.
- **Batch capture:** after each game's `postlaunch`, the code posts `ID_BATCH_CAPTURE_NEXT_GAME` (PFV 10511). That leads to `LaunchQueuedGame` again, so each game gets its own `prelaunch`, `launchoverlayshow` and `"init"`.

## 5. Exit Game (KillGame)

- `ID_KILL_GAME` (PFV ~4703) fires `launchoverlaymessage "terminating"` at once, then calls `Application::KillGame`.
- When `PFVMsgGameOver` arrives, the UI is already in Exiting mode, so `"gameover"` is skipped. `gameover` and the rest of the sequence still fire.
- **[unverified]** If the kill comes before `PFVMsgGameLoaded`, `closeCommandIssued` stops that message. Then neither `"running"` nor `gamestarted` fires (APP 3818). Where `closeCommandIssued` is set was not traced.
- During a batch capture, the first kill only shows a cancel prompt. Stopping the batch takes a second press.

## Not determined

- Whether a JS handler that runs a nested message loop could let thread messages through during `playGame()`.
- Launches that need Administrator mode (`PFVMsgPlayElevReqd`) and the Admin Host path.
- Whether the release on the cabinet matches `master`.
