# Research: discreet "Achievement unlocked" toast (Steam-like)

Question: can a PinballY Javascript add-on show a small toast in the **bottom-right corner of the main playfield window**, with chosen typography, that disappears after a few seconds and does **not** steal input or focus? What are the options and their limits?

**Short answer: yes, with a custom DrawingLayer on `mainWindow`.** A drawing layer never takes input. It can sit at any Z level, including above the wheel and info box. It can be anchored to the bottom-right corner with `setPos(..., "bottom right")`, faded with `layer.alpha`, slid with `setPos`, and hidden with `alpha = 0` or `clear(0x00000000)`. Its text can be drawn with `StyledText`, which uses DirectWrite with real font weights, rounded background corners and padding. `showPopup()` does **not** fit. It always captures the next button press, its position can only move right of centre and up from centre, and scripts have no way to close it. `mainWindow.message()` works the same way. The status line is non-modal, but its layout and timing are fixed.

## Sources

- Local help (authoritative): `c:\vPinball\PinballY\Help\*.html`. Page and section are named inline as *Help › Page › Section*.
- PinballY source, `mjrgh/PinballY` at commit `d84763e` (2026-02-23). Links have the form `https://github.com/mjrgh/PinballY/blob/d84763e32f089317db405798d83ea26f77a18606/<path>#L<n>`. Below they are abbreviated **src:** `<path>:<lines>`.
- Official examples: the digest `.claude/reference/pinbally-examples.md`, plus *Help › CustomMediaWindowExample* for the fade idiom.
- **[unverified]** marks anything that neither the help nor the source settles. Those points need testing in PinballY.

---

## 1. Custom drawing layers (the recommended vehicle)

### 1.1 Creating, removing and hiding a layer

- `window.createDrawingLayer(zIndex)` creates a layer, and `window.removeDrawingLayer(layer)` deletes it. After removal, calls on the layer are silently ignored. *Help › WindowObjects › Common properties and methods*; *Help › DrawingLayer › How to create a drawing layer / Removing a layer*.
- For a layer that comes and goes, the help recommends keeping it and hiding it with `layer.clear(0x00000000)`. *Help › DrawingLayer › Temporarily hiding a layer*. `layer.alpha = 0` also works, because alpha is multiplied with the per-pixel alpha (*Help › DrawingLayer › Methods and properties › alpha*). src: `PinballY/BaseView.cpp:1425-1429` clamps the value to [0, 1].
- The examples digest warns against creating a layer on every event (`show_instruction_card` leaks layers). Create the layer **once** and reuse it (`pinbally-examples.md` §Windows).

### 1.2 Z-order in the main window

Back to front (*Help › MainWindowObject › Drawing layer ordering*), confirmed by src: `PinballY/PlayfieldView.cpp:11760-11891` (`UpdateDrawingList`):

| System layer | Custom Z range right after it |
|---|---|
| Playfield background | 0–999 |
| Underlay | 1000–1999 |
| Status lines | 2000–2999 |
| Wheel images | 3000–3999 |
| Game info box | 4000–4999 |
| Video overlays and popups | 5000–5999 |
| Menus and credits message | 6000 and above |
| Drag-and-drop feedback | – |

The source shows a detail the help gets wrong. The help says the launch overlay (`mainWindow.launchOverlay.fg/bg`) is drawn topmost (*Help › MainWindowObject › launchOverlay*). In the code, those two layers are the `runningGameBkgPopup` / `runningGameMsgPopup` sprites (src: `PlayfieldView.cpp:10304-10322`), and they are drawn **between Z 4999 and the popup** (src: `PlayfieldView.cpp:11855-11859`). So a custom layer at 5000 or above is drawn *over* the launch overlay.

Z choices for the toast:
- **4000–4999**: above the wheel and the info box, below popups and menus. An open menu or popup covers the toast, which suits a discreet notification.
- **5000–5999**: above popups, below menus.
- **6000 and above**: above everything, menus included.

### 1.3 Position and size: yes, a layer can sit in a corner

- By default a layer is stretched to fill the whole window (*Help › DrawingLayer › Sizing and scaling*). src: `BaseView.h:343-400`: the default spans are `xSpan = ySpan = 1`.
- `layer.setScale({xSpan}|{ySpan}|{xSpan, ySpan}|{span})` sets the fraction of the window the layer covers. With only one span given, the aspect ratio is kept. *Help › DrawingLayer › setScale*. src: `BaseView.cpp:1431-1459` and `914-982`.
- `layer.setPos(x, y, align)` takes `align` = `"top|middle|bottom"` combined with `"left|center|right"`. **`"bottom right"` puts the layer flush against the bottom-right corner.** `x` and `y` then offset it. Both run from −0.5 to +0.5 of the window, and y is positive **upwards**. *Help › DrawingLayer › setPos*. src: `BaseView.cpp:1461-1490` parses the alignment. `BaseView.cpp:976-977` computes `offset = pos*size + align*0.5*(window − sprite)`. So `setPos(-0.02, 0.02, "bottom right")` leaves a margin of 2% of the width on the right and 2% of the height at the bottom.
- `layer.draw(fn, w, h)` renders into a `w × h` pixel canvas. Without `w` and `h`, the canvas is the window's **layout** size (*Help › DrawingLayer › draw*). src: `BaseView.cpp:1162-1163` uses `szLayout`. The canvas is then scaled to the window using the spans. src: `Sprite.cpp:1485` shows the mesh is sized as `px / 1920` of the window height before span scaling.

Two ways to get crisp text in a corner:
1. **Full-window canvas (simplest, pixel exact).** Call `layer.draw(fn)` without a size. `dc.getSize()` then returns the real layout size in pixels, rotation included (see §4). Draw the toast at the bottom-right pixel coordinates and leave the rest transparent (the DIB starts zeroed, see §7 note). No `setScale`/`setPos` is needed, and one canvas pixel maps to one screen pixel. The cost is one window-sized texture (about 8 MB at 1080×1920×4) rebuilt for each toast. Rendering it is trivial for the GPU. **[unverified]**: actual memory and upload cost on the user's machine.
2. **Small canvas and span scaling.** Draw only the card (say 440×110 px), then `setScale({xSpan: cardW / layoutW})` and `setPos(-m, m, "bottom right")`. `layoutW` has to be learned first, for example with a throwaway `draw()` that reads `dc.getSize()`. If `xSpan` doesn't match exactly, the texture is resampled and the text blurs slightly. Slides are cheaper this way, because `setPos` moves a small sprite.

### 1.4 Drawing API (drawing context `dc`)

*Help › CustomDrawing › Drawing context methods*:
- `fillRect(x, y, w, h, 0xAARRGGBB)`, `frameRect(x, y, w, h, frameWidth, color)`.
- `drawImage(file, x, y, w, h)` takes JPEG or PNG. A relative path is resolved from the **PinballY program folder**, not from `Scripts/`.
- `getImageSize(file)`, `getSize()`.
- `setFont(name, pointSize, weight, italic)`, `setFontFromPrefs(str)` (for example `"StatusFont"` or `"14 semibold Segoe UI"`), `setTextColor`, `setTextArea`, `setTextAlign(h, v)`, `setTextOrigin`, `getTextOrigin`, `drawText(str)`, `measureText(str)`.
- `defaultAlpha` is set to `0xFF` before each drawing call. A hex colour whose alpha byte is `00` gets `defaultAlpha` instead. *Help › CustomDrawing › Default alpha value*.
- `dc` is valid only during the callback. Don't store it. *Help › CustomDrawing › Drawing context*.

**Font weight limit of `dc.setFont`.** The help says 100–900. The source only produces **regular or bold**: `weight >= 700` gives bold, anything else regular. src: `Utilities/GraphicsUtil.cpp:188-202` (`CreateGPFont`) and `PlayfieldView.cpp:6607-6627` (`InitFont`). A weight of 600 therefore renders as regular. A workaround is to name the weight-specific GDI family directly, such as `"Segoe UI Semibold"` or `"Segoe UI Light"`. **[unverified]**: whether GDI+ resolves those family names.

**Better typography: `StyledText`.** *Help › StyledText*:
- `new StyledText({backgroundColor: 0xAARRGGBB, cornerRadius, padding, textAlign, textStyle: {font, size | sizePx, weight, stretch, style, color}})`, then `add(...)` for runs of mixed styles.
- `measure(width)` returns `{width, height, drawingArea}` and may be called outside a drawing function.
- `draw(dc, rect)` must be called inside one.
- It handles **rounded corners**, **padding** and a **semi-transparent background** in one object (*Help › StyledText › new StyledText(desc)*).
- It is built on DirectWrite (src: `PlayfieldView.cpp:7049-7075`), and `weight` goes straight to `DWRITE_FONT_WEIGHT`, so 600 (semibold) and 300 (light) really render.

`HtmlLayout` (*Help › HtmlLayout*) offers the same through HTML and CSS (litehtml). It is heavier, and it is not needed for a two-line card.

### 1.5 Input and focus

- A DrawingLayer has **no input API**. Its only event is `videoend` (*Help › DrawingLayer › Event target*; `pinbally-help.md` §Events table). Keys and joystick buttons still go to `mainWindow` handlers and to the wheel exactly as before. A layer is just another sprite in the drawing list (src: `PlayfieldView.cpp:11763-11771`).
- Creating or updating a layer doesn't change `getUIMode()`, so the UI stays in `"wheel"` mode. It also fires no `popupopen` or `wheelmode` event. Only `showPopup`, `showMenu` and system UI change the mode (*Help › MainWindowObject › getUIMode*). **[unverified]**: nothing in the source contradicts this, but it hasn't been observed at run time.
- The layer lives inside PinballY's own D3D view, not in a separate OS window, so it can't take Windows focus.

### 1.6 Behaviour across UI modes

- Custom layers are added to the drawing list **unconditionally**, in every mode: wheel, menu, popup and attract (src: `PlayfieldView.cpp:11760-11891`). The underlay and wheel images are hidden in attract mode when the option says so (`11794`, `11828`). Custom layers are never hidden that way. So a toast stays visible when a menu opens (covered or not, depending on Z) and when attract mode starts.
- While a game runs, see §6.

## 2. Custom popups (`mainWindow.showPopup`): not suitable

*Help › Popups › Custom popups*; src: `PlayfieldView.cpp:6378-6563`.

- **Size.** `width` and `height` are fractions of the normalized layout, 1920 px high by 1080 px wide. If `height` is omitted, `draw()` must return a pixel height and is **called twice** (*Help › Popups › Dynamic layout height*).
- **Position.** `x` and `y` are applied only when `>= 0` (src: `6549-6552`). They are added to a sprite offset centred on the window, in window-height units with y **upwards** (src: `AdjustSpritePosition`, `PlayfieldView.cpp:11038-11056`). A popup can therefore only move **right of centre and up from centre**, and **bottom-right can't be reached**. (The help calls `x`/`y` "percentages". The code treats them as fractions.)
- **Input capture.** A custom popup sets `popupType = PopupUserDefined`, and the UI switches to `"popup"` mode (*Help › Popups › System popups*). The next **Select** or **Exit** press is consumed to close it, with the Deselect sound (src: Select `PlayfieldView.cpp:14103-14165`, Exit `14454-14480`). Next and Prev go to the popup rather than to the wheel (`14869-14872`). The toast would swallow the player's first button press. That fails the "no input stealing" requirement.
- **One slot only.** `popupSprite` is replaced (`6542`), so a toast would close any popup already on screen, including ours from `wheel_dialog.js`. It also hides the info box (src: `SyncInfoBox`, `PlayfieldView.cpp:12004-12015`) and fires `popupopen`/`popupclose` and then `wheelmode`.
- **No close from script.** The help documents no `closePopup`. The native `CloseMenusAndPopups()` (src: `PlayfieldView.cpp:14556`) has no Javascript binding. Auto-dismiss would be impossible.
- `mainWindow.message(text, style)` is a queued system popup with the `"message"` id. It's non-blocking for the *script*, but it's still a popup that the user must dismiss (*Help › MainWindowObject › message*; *Help › Popups › System popups*). Not suitable either.

## 3. Status line and other alternatives

- `mainWindow.statusLines.upper|lower|attract.show(text)` queues a **one-time** message after the current one, with no acknowledgement and no input capture. The help recommends it for "quick feedback … too heavy-weight for a popup" (*Help › StatusLine › show*). Limits:
  - The position is fixed: the status area near the bottom, centred.
  - The font is the global `StatusFont` setting (*Help › CustomDrawing › setFontFromPrefs* lists `StatusFont`).
  - Display time is the status line's own rotation interval, and the message waits for the current one to finish.
  - No icon and no styling.
  - The examples digest reports instability when lines are added or removed at runtime (`pinbally-examples.md` §auto_shutdown). `show()` inserts a temporary entry. **[unverified]**: whether `show()` is affected.

  It's fine as a fallback or companion, not as a Steam-like toast.
- **Underlay** (*Help › Underlay*) is a system image behind the wheel. Not relevant.
- **Launch overlay** layers exist only during a launch, and they can't be moved or resized (*Help › MainWindowObject › launchOverlay*).
- **A custom media window** (`mainWindow.createMediaWindow`, *Help › MainWindowObject*) is a separate OS window. Getting a toast "over" the playfield window that way would mean fighting Windows z-order and focus. Rejected.

## 4. Which window, and rotated playfields

- Every window object has `createDrawingLayer`: `mainWindow`, `backglassWindow`, `dmdWindow`, `topperWindow`, `instCardWindow` and custom media windows (*Help › WindowObjects › Common properties and methods*). Only the main window has interleaved system layers. In the others, custom layers are always in front of the single background layer (*Help › DrawingLayer › Z index*). The backglass is therefore a possible alternative target, but the requirement says the playfield.
- **Rotation is handled for us.** `RotateWindowCW/CCW` rotates the *contents* of a window (*Help › Commands › RotateWindowCCW/CW*). In the source, rotation is a camera transform, and `szLayout` swaps width and height at 90 and 270 degrees (src: `D3DView.cpp:568-580`, `189-205`). Layer placement and the default canvas size both use `szLayout` (src: `BaseView.cpp:919-920`, `1162-1163`). So `"bottom right"` and `dc.getSize()` refer to the **bottom-right as the player sees it** on a rotated cab monitor, not to the monitor's native corner.
- The rotation angle itself is **not exposed to Javascript**: nothing in *Help › MainWindowObject* or *Help › WindowObjects* provides it. Don't compute the size from `hwndView.getWindowPos().clientRect`, which is in unrotated desktop pixels (*Help › HWNDObject*). Use `dc.getSize()` inside a default-size `draw()`.

## 5. Timers, animation and redraw cost

- `setTimeout`, `clearTimeout`, `setInterval` and `clearInterval` are available. They run on the single-threaded UI loop and are deferred while other script code runs (*Help › SystemFunctions*).
- **Fade.** Step `layer.alpha` from a `setInterval` of about 16 ms. The official example cross-fades exactly this way, with `clear()` and a 16 ms interval (*Help › CustomMediaWindowExample*, "Rotating Color Background"). Changing `alpha` only sets a float (src: `BaseView.cpp:1425-1429`). The D3D view redraws every idle pass in the foreground anyway (src: `D3DView.cpp:610-640`), so a fade costs essentially nothing.
- **Slide.** Step `setPos(...)`. That recomputes the sprite matrix (src: `BaseView.cpp:1461-1490` → `ScaleDrawingLayerSprite`), which is cheap.
- **Expensive:** `draw()`, which runs GDI+ or DirectWrite rasterization and a texture upload (src: `BaseView.cpp:1146-1183`, `Sprite.cpp:1400-1486`). Call it **once per toast**, never once per animation frame. The help asks handlers to stay short, 30–50 ms (`pinbally-help.md` §Performance).

## 6. While a game is running

- When a game starts, PinballY enters "run freeze" mode. It sets `freezeBackgroundRendering = true` to save GPU, and D3D stops re-rendering the playfield view while PinballY is in the background (src: `PlayfieldView.cpp:10099-10127`; `D3DView.cpp:627`). Only explicit invalidations repaint it: `clear`, `draw`, `loadImage` and `removeDrawingLayer` call `InvalidateRect` in that state (src: `BaseView.cpp:1067`, `1103`, `1171`, `1228`). **`alpha` and `setPos` changes don't invalidate**, so fades and slides freeze. On top of that, the game window normally covers PinballY. By default PinballY windows are blanked while a game runs, unless the "Keep these PinballY windows open" setting applies (*Help › SystemOptions › Keep these PinballY windows open*).
- **Conclusion:** don't try to show toasts while a game is running. Queue them and show them once `mainWindow.getUIMode().mode === "wheel"` and `runMode` is absent (*Help › MainWindowObject › getUIMode*), or on `wheelmode`, which fires on return from a running game (*Help › WheelModeEvent*). That fits our case, since achievements unlock after the game ends. Rendering resumes in `EndRunningGameMode` (src: `PlayfieldView.cpp:~10130-10138`).

## 7. Fonts

- `dc.setFont` and `setFontFromPrefs` go through GDI+ by family name. The family is looked up among **installed** fonts. A comma-separated fallback list is supported. Missing fonts fall back to the generic sans-serif, then the first installed font, then Arial (src: `Utilities/GraphicsUtil.cpp:95-186`). *Help › DrawingLayer › drawDMDText › font* also documents the comma-separated fallback list.
- `StyledText` uses DirectWrite with the **system font collection** only (src: `Utilities/DirectWriteUtil.cpp:307` `GetSystemFontCollection`). No Javascript API loads a font file. The source has no `PrivateFontCollection` or `AddFontResource*` anywhere (full-repo grep).
- A **bundled `.ttf`** can therefore be used only if it is installed in Windows. Windows 10 1809 and later allow a per-user install without admin rights. **[unverified]**: whether per-user fonts show up in GDI+ `InstalledFontCollection` and in DirectWrite's system collection as PinballY uses them. Loading a font at run time through `dllImport` → `gdi32!AddFontResourceExW` (*Help › DllImport*) is possible in principle. **[unverified]**, and probably ineffective: DirectWrite's system collection and GDI+'s installed collection don't list fonts added privately with `AddFontResourceEx`.
- Recommendation: stay with fonts shipped with Windows 10/11, such as **Segoe UI** (weights 300, 400, 600 and 700 via `StyledText`), **Segoe UI Variable** (Windows 11), or **Bahnschrift**. Give a fallback list with `dc.setFont`. With `StyledText`, pick a font that exists everywhere.
- Note on text over transparent pixels: the drawing canvas is a zero-initialised DIB, so it starts fully transparent (src: `Utilities/GraphicsUtil.cpp:42-55` `CreateDIB`). **[unverified]**: how anti-aliased or ClearType text looks when drawn straight onto fully transparent pixels. To be safe, always draw the text over the card's own (nearly) opaque background. `StyledText`'s `backgroundColor` does exactly that.

---

## Recommendation

Build a shared **toast module**, for example `common/achievement_toast.js`, that owns **one** `mainWindow` drawing layer at **Z 4500**: above the wheel and info box, below popups and menus, so a menu or wheel dialog covers it instead of fighting it. For each toast:

1. If the UI isn't in plain wheel mode, or a game is running, queue the toast and flush the queue on `wheelmode`.
2. `draw()` the card **once** with a default-size canvas. `dc.getSize()` gives the rotated layout size in pixels. Place a `StyledText` card at the bottom-right corner in pixels, which gives pixel-exact text on rotated cabs too.
3. Fade in over about 250 ms with `layer.alpha`, hold for about 4 s, fade out, then `clear(0x00000000)`. Show queued toasts one after another.
4. Never call `showPopup`, never touch input handlers, never change the UI mode. This path doesn't go through `wheel_dialog.js`, which exists for dialogs that take input.

### Minimal sketch

```js
// ============================================================
// Achievement toast: a small, non-modal card in the bottom-right corner of
// the playfield window. Uses one reusable DrawingLayer (no input capture),
// fades in/out on timers, and queues toasts until the UI is back on the wheel.
// ============================================================

import { safeHandler } from "./safe_handler.js";

const SCRIPT_NAME = "AchievementToast";
const TOAST_Z_INDEX = 4500;           // above wheel + info box, below popups/menus
const CARD_WIDTH_PX = 440;
const MARGIN_PX = 24;
const FADE_STEP_MS = 16;
const FADE_MS = 250;
const HOLD_MS = 4000;

export function createAchievementToast(host) {
    const layer = host.mainWindow.createDrawingLayer(TOAST_Z_INDEX);
    layer.clear(0x00000000);
    const queue = [];
    let busy = false;

    function isWheelIdle() {
        const mode = host.mainWindow.getUIMode();
        return mode.mode === "wheel" && mode.runMode === undefined;
    }

    function buildCard(title, detail) {
        const card = new host.StyledText({
            backgroundColor: 0xE0181818,
            cornerRadius: 10,
            padding: { left: 18, right: 18, top: 12, bottom: 12 },
            textStyle: { font: "Segoe UI", size: 11, weight: 400, color: 0xFFB8B8B8 },
        });
        card.add({ text: title + "\n", size: 13, weight: 600, color: 0xFFFFFFFF });
        card.add(detail);
        return card;
    }

    function drawCard(card) {
        layer.draw((dc) => {
            const size = dc.getSize();   // layout pixels, already rotation-aware
            const box = card.measure(CARD_WIDTH_PX);
            const x = size.width - box.width - MARGIN_PX;
            const y = size.height - box.height - MARGIN_PX;
            card.draw(dc, { x, y, width: box.width, height: box.height });
        });
    }

    function fade(from, to, done) {
        const steps = Math.max(1, Math.round(FADE_MS / FADE_STEP_MS));
        let step = 0;
        const id = setInterval(safeHandler(SCRIPT_NAME, () => {
            step += 1;
            layer.alpha = from + (to - from) * Math.min(1, step / steps);
            if (step >= steps) {
                clearInterval(id);
                done();
            }
        }), FADE_STEP_MS);
    }

    function showNext() {
        if (busy || queue.length === 0 || !isWheelIdle()) {
            return;
        }
        busy = true;
        const { title, detail } = queue.shift();
        layer.alpha = 0;
        drawCard(buildCard(title, detail));
        fade(0, 1, () => {
            setTimeout(safeHandler(SCRIPT_NAME, () => {
                fade(1, 0, () => {
                    layer.clear(0x00000000);
                    busy = false;
                    showNext();
                });
            }), HOLD_MS);
        });
    }

    // Fires on return to the wheel from a menu, popup, attract mode or a finished game.
    host.mainWindow.on("wheelmode", safeHandler(SCRIPT_NAME, showNext));

    return {
        show(title, detail) {
            queue.push({ title, detail });
            showNext();
        },
    };
}
```

Notes on the sketch:
- The title and detail come from `common/i18n.js`, never hard-coded.
- `host.StyledText` assumes the `common/pinbally_host.js` seam exposes PinballY's `StyledText` class. `StyledText` is **not** in the list of allowed globals in `.claude/rules/conventions.md`, so that needs a decision (see open questions).
- A toast already showing when a menu opens keeps its timers. It is simply covered at Z 4500.

## Open questions to test in PinballY

1. Does `StyledText` with `weight: 600` and `cornerRadius` render cleanly on a transparent full-window canvas? Look for fringes on the rounded corners and text anti-aliasing.
2. Is a full-window canvas redrawn per toast fast enough on the cab (< 50 ms)? If not, switch to a small canvas with `setScale`/`setPos` (§1.3, option 2).
3. On a rotated playfield (90/270), does the card really land in the player's bottom-right? Expected yes, from `szLayout` in the source.
4. Z 4500 vs 5500: should the toast show above an open wheel dialog or popup, or stay hidden behind it? And does it clash visually with the status line or info box in the bottom area?
5. Attract mode: the layer stays visible. Should toasts be held back during attract mode too (`isWheelIdle` already does this), and should the one on screen be cut short at `attractmodestart`?
6. Does `wheelmode` reliably fire after a game exits before our achievements are evaluated? If evaluation runs later (e.g. on `gameover`), `show()` still works, because it checks `isWheelIdle()` itself.
7. Fonts: are Segoe UI Semibold (via `StyledText` weight 600) and Segoe UI Variable present on the cab's Windows? Is a per-user-installed custom font visible to GDI+ and DirectWrite in PinballY?
8. Conventions: add `StyledText` to the PinballY host and to the list of allowed globals, or restrict the toast to `dc.setFont` (regular/bold only)?
