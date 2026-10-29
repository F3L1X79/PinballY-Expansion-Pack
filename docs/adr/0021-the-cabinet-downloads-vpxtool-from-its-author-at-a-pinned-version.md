---
status: accepted
---

# The cabinet downloads vpxtool from its author, at a pinned version, once the owner agrees

The pack never ships vpxtool (the Script Reader). Each Pack Version names one Script Reader Version, with its Windows zip's URL on the author's GitHub releases and its SHA-256, tried on the maintainer's cabinet first. When vpxtool is missing, or `vpxtool --version` answers an older version, the Script Reader Prompt asks whoever sees the setup entries, saying what it is for, who wrote it, under which licence and where it comes from. Only on "Install" does a hidden helper download it, check it, and swap it in, keeping the previous `vpxtool.exe` on failure; PinballY keeps running, since vpxtool is only ever started between games.

## Considered Options

- **Ship `vpxtool.exe` in the release zip.** Rejected: Apache-2.0 would allow it, but the maintainer will not redistribute the author's binary without his explicit blessing. Worth reopening if he gives it.
- **Follow the author's latest release, with a second Update Check.** Rejected: vpxtool is 0.x with frequent breaking releases, while the pack needs only `romname`, which an old version does well; every new release would reach cabinets untried, and a second GitHub call would run at each start.
- **Install it silently.** Rejected: the owner should know that an outside program is downloaded, from whom, and be able to say no.

## Consequences

- An owner who says no, or turns "Offer vpxtool" off in the Offline Mode settings, is never asked again and gets no Error Toast for it; the install stays in the Expansion Pack Settings, or by hand.
- A newer Script Reader Version reaches a cabinet only through a Pack Update; an equal or newer vpxtool, the owner's own included, is never touched.
- Looking at the installed version needs no network; only "Install" goes online.
