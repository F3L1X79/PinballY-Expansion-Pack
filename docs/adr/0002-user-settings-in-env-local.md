# Player settings live in a git-ignored `.env.local`

`common/core/config.js` was both the author's live configuration and the defaults shipped to anyone cloning the project, so every clone started with the author's language and a path to a sound file that did not exist on the new machine. We decided that `config.js` ships neutral defaults and only the few settings a player really needs (language, launch sound file, community tables manufacturer, two preferences, Add-on switches); everything else became a constant in its own module. Each player overrides those settings in a `.env.local` file at the root, ignored by git, copied from a tracked `.env.example`. We picked the `.env` format over JSON because a non-developer can edit it without breaking a bracket or doubling the backslashes of a Windows path.

## Considered Options

- **`common/config.local.json`.** Read with `JSON.parse`, no parser to write. Rejected: too easy for a non-developer to break (commas, quotes, `\\` in paths).
- **Keep editing the tracked `config.js`** (with `git update-index --skip-worktree` on the author's machine). Rejected: every upstream change to `config.js` conflicts with local edits.
- **A `config.local.js` module.** Rejected: a static `import` of a missing file fails PinballY's load, and a dynamic `import()` resolves too late, since some modules read the configuration while they load.

## Consequences

- PinballY is not Node: there is no `process.env`. `config.js` reads `.env.local` synchronously at load time through a Windows COM component, and parses it with project code (keys in `UPPER_SNAKE_CASE`, types taken from the default values, invalid lines logged and ignored).
- `.env.local` and `.env.example` are saved as UTF-8 with BOM, like the rest of the project, so accented paths and texts read correctly.
- Achievement thresholds are no longer configurable. They take part in the Achievement IDs, so changing one used to re-announce Achievements already Notified.
