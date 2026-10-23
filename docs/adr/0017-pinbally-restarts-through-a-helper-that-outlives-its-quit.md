---
status: accepted
---

# PinballY restarts through a helper that outlives its Quit

PinballY offers no restart command, and the Expansion Pack Settings only apply once it starts again. The pack starts `tools\restart_pinbally.ps1` hidden through `ShellExecuteW`, as PinballY's own child, passing PinballY's process id. While PinballY is alive, the helper reads its executable, command line and parent process (Win32_Process gives them only for a running process), then writes a ready file in the pack's temporary folder. PinballY polls for that file every 200 ms and runs `Quit` once it exists; after 15 s without it, PinballY stays and says the restart is not possible. The helper waits up to 60 s for PinballY's process to end, then starts the same executable with the same arguments and working folder, or `PinballY Admin Mode.exe` with its own arguments when that was PinballY's parent, so the admin channel is not lost.

Tried on the cabinet (branch `prototype/restart-pinbally`, 22/10/2026): the helper was ready 1.3 s after the click, PinballY gone 1.7 s later, started again 0.7 s after that. No job object kills a child of PinballY on its Quit.

## Considered Options

- **Starting the helper through WMI (`Win32_Process.Create`)**, so it is nobody's child. Worked too, but slower and with one more process; not needed since a plain child survives.
- **Running `Quit` at once, the helper reading the command line from elsewhere.** Rejected: once PinballY has ended, its command line and parent are gone.

## Consequences

- The fake host does not run the helper: it writes the ready file 1.3 s after the helper starts, or never for a restart made to fail.
- The Admin Mode parent was not tried on the cabinet.
- `tools\` is ignored by git except for this helper, which the pack ships; vpxtool is still added by each owner.
