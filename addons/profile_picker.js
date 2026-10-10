// ============================================================
// Profile picker: a "Change Player" entry, right after "Play" in the main
// menu and right after "Quit" in the exit menu (and on the Welcome Screen,
// through common/change_player.js), opens a drawn carousel of
// the Profiles' Avatars above the menus, starting on the active Profile.
// The flipper buttons move through it and wrap, with PinballY's navigation
// sound (common/navigation_sound.js), Select or Launch switches
// to the highlighted Profile, Exit closes it; while it is open every
// button is swallowed through "commandbuttondown", so the wheel never moves
// under it; attract mode closes it too. The Avatars glide to their new
// places on each move, and the name shows once they arrive. The background,
// each Avatar, each name and the gold frame have their own layer, drawn
// ahead (common/drawing_ahead.js) and kept for the whole session, so opening
// and moving only show, move, scale and dim layers: on the cabinet each draw
// blocks PinballY for 20 to 45 ms. The Profiles are read again each time it
// opens, and anything not drawn ahead yet is drawn on the spot.
// A badge at the top right of the wheel screen shows the active Profile's
// Avatar and name, with the shown Player Level as a pip at the Avatar's
// bottom-right corner (each Avatar of the carousel has its own pip too); it is redrawn on every switch and whenever the
// shown level or the worn Avatar Frame changes, hidden on "gamestarted"
// and shown again on "wheelmode".
// Each Avatar, on the badge, in the carousel and on the greeting, wears
// its own Profile's Avatar Frame (common/profile_rewards.js), under the
// pip; while one is worn in the carousel, its Avatars spread out and the
// texts under them move down, to leave each frame its room.
// When the Welcome Screen Add-on is on, a pick closes the carousel and the
// screen welcomes the new Profile (picking the active one changes nothing).
// When it is off, a Profile Greeting (the Avatar growing slightly, a
// greeting below, then a fade-out, with the optional
// profileGreetingSoundFile) follows every pick after a short pause, the
// carousel staying still meanwhile, and greets the restored Profile once
// at startup, after the same pause, as soon as the wheel is free of menus
// and dialogs; a game or the carousel started first cancels it.
// ============================================================

import lang from "../common/i18n.js";
import { safeHandler } from "../common/safe_handler.js";
import { createPinballYHost } from "../common/pinbally_host.js";
import { getProfileStore } from "../common/profile_store.js";
import { displayNameOf } from "../common/profile_name.js";
import { getMainMenu, MAIN_MENU_POSITION } from "../common/main_menu.js";
import { getWheelDialogs } from "../common/wheel_dialog.js";
import { registerChangePlayer } from "../common/change_player.js";
import { drawShadowedText } from "../common/shadowed_text.js";
import { getDrawingAhead } from "../common/drawing_ahead.js";
import { getShownPlayerLevel } from "../common/shown_player_level.js";
import { drawLevelPip, levelPipOn, drawAvatarFrame, avatarFrameSide, AVATAR_FRAME_MARGIN } from "../common/steamball_drawing.js";
import { getProfileRewards } from "../common/profile_rewards.js";
import { createNavigationSound } from "../common/navigation_sound.js";
import config from "../common/config.js";

const SCRIPT_NAME = "ProfilePicker";

// Above PinballY's menus and popups; the Avatars above the carousel's
// background, the gold frame and the names above the Avatars.
const PICKER_Z_INDEX = 6500;
const AVATAR_Z_INDEX = 6501;
const TOP_Z_INDEX = 6502;
// Above the gold frame, which runs under the pip's corner.
const PIP_Z_INDEX = 6503;
// Above the wheel and the game info box, under popups and menus.
const BADGE_Z_INDEX = 4500;
const COLORS = Object.freeze({
    overlay: 0xD0080A0E,
    gold: 0xFFE8B84A,
    neighbourFrame: 0xFF3E4C60,
    text: 0xFFFFFFFF,
    hint: 0xFFA9B4C2,
    transparent: 0x00000000,
});
// By distance from the highlighted Avatar: its size, how much it is
// dimmed (the alpha of a black veil) and how far its centre sits from the
// middle, farther apart while an Avatar Frame is worn in the carousel, so
// no frame overlaps the next. The last one is where an Avatar goes past
// the last slot while gliding: smaller, farther and fully dark, so one
// entering from the edge fades in.
const SLOTS = Object.freeze([
    { size: 220, dim: 0, centerOffset: { plain: 0, framed: 0 } },
    { size: 130, dim: 0x70000000, centerOffset: { plain: 210, framed: 275 } },
    { size: 80, dim: 0xA0000000, centerOffset: { plain: 340, framed: 445 } },
    { size: 40, dim: 0xFF000000, centerOffset: { plain: 420, framed: 530 } },
]);
const SHOWN_SLOT_COUNT = 3;
// The glide slows down as it arrives (exponential ease-out): about 200 ms.
const GLIDE_TIME_CONSTANT_MS = 50;
const GLIDE_SNAP = 0.02;
// An Avatar layer's canvas: the image at the greeting's grown size, so it
// is only ever scaled down, in its plain frame. The gold frame is a ring on
// a layer of its own, wide enough to cover the highlighted one's plain frame.
const AVATAR_ART = Object.freeze({ image: 260, goldFrame: 5, plainFrame: 2 });
// An Avatar wearing an Avatar Frame has no plain frame: its canvas is the
// Avatar Frame's, and the gold frame goes around it.
const AVATAR_SIDE = AVATAR_ART.image + 2 * AVATAR_ART.plainFrame;
const FRAMED_AVATAR_SIDE = avatarFrameSide(AVATAR_ART.image);
const GOLD_FRAME_SIDE = AVATAR_ART.image + 2 * AVATAR_ART.goldFrame;
const FRAMED_GOLD_FRAME_SIDE = FRAMED_AVATAR_SIDE + 2 * AVATAR_ART.goldFrame;
// A carousel pip's canvas: as high as the pip, wide enough for four digits.
// Smaller than elsewhere, as several Avatars share the row.
const PIP_ART = levelPipOn(0, 0, AVATAR_SIDE, 1 / 5);
const PIP_CANVAS = Object.freeze({ width: 2 * PIP_ART.size, height: PIP_ART.size });
// The Avatars' row sits at this fraction of the height; the texts are
// placed from it.
const ROW_HEIGHT_RATIO = 0.4;
const TITLE = Object.freeze({ size: 26, weight: 700, top: -250 });
const NAME = Object.freeze({ size: 24, weight: 700, top: 130 });
// A name layer's height: the text and its shadow.
const NAME_LAYER_HEIGHT = 48;
const HINT = Object.freeze({ size: 12, weight: 400, top: 180 });
// How far the name and the hint move down while an Avatar Frame is worn
// in the carousel, below the highlighted Avatar's frame.
const FRAMED_TEXT_SHIFT = 45;
// The badge has its own canvas, pinned to the window's top right corner:
// PinballY stretches a canvas to the window, and at startup the window is
// not laid out yet, so a window-sized canvas drawn then ends up distorted.
// The name is centred under the Avatar, across the canvas width, which also
// leaves the Avatar ~30 px from the right edge.
// The level pip straddles the Avatar's bottom-right corner; the name sits
// low enough to clear the pip's lower half, or under the worn Avatar
// Frame, which gives the gold frame its place. The canvas is tall enough
// for that lower name.
const BADGE = Object.freeze({ width: 160, height: 184, avatarSize: 96, frame: 3, top: 30, nameGap: 14, framedNameGap: 4 });
const BADGE_FRAME_SIDE = avatarFrameSide(BADGE.avatarSize);
// The size validated on the cabinet's 1920 px high playfield, kept in
// proportion to the window's height on any other window.
const BADGE_REFERENCE_HEIGHT = 1920;
const BADGE_NAME = Object.freeze({ size: 14, weight: 600 });
// After a pause, the greeted Avatar grows from the highlighted size, holds,
// then everything fades out: about 1.5 s once started.
const GREETING = Object.freeze({ delayMs: 500, grownSize: 260, growMs: 250, holdMs: 700, fadeMs: 550 });
const GREETING_TEXT = Object.freeze({ size: 28, weight: 700, gap: 24 });
const FRAME_MS = 16;

export default function init() {
    const { profiles: TEXT } = lang;
    const host = createPinballYHost();
    const profileStore = getProfileStore();
    const shownPlayerLevel = getShownPlayerLevel();
    const profileRewards = getProfileRewards();
    const navigationSound = createNavigationSound(host, SCRIPT_NAME);
    const hiddenLayer = zIndex => {
        const layer = host.createDrawingLayer(zIndex);
        layer.alpha = 0;
        return layer;
    };
    // The carousel's overlay, title and hint, drawn ahead; the greeting's
    // overlay and text, drawn when it starts.
    const backLayer = hiddenLayer(PICKER_Z_INDEX);
    const greetingLayer = hiddenLayer(PICKER_Z_INDEX);
    // The gold frame around a plain Avatar, and around an Avatar Frame.
    const goldFrames = {
        plain: { layer: hiddenLayer(TOP_Z_INDEX), side: GOLD_FRAME_SIDE, isDrawn: false },
        framed: { layer: hiddenLayer(TOP_Z_INDEX), side: FRAMED_GOLD_FRAME_SIDE, isDrawn: false },
    };
    const badgeLayer = host.createDrawingLayer(BADGE_Z_INDEX);
    badgeLayer.setScale({ ySpan: BADGE.height / BADGE_REFERENCE_HEIGHT });
    badgeLayer.setPos(0, 0, "top right");

    // The Profiles shown and the highlighted one's index; null when closed.
    let profiles = null;
    let highlighted = 0;
    // The window's layout size, taken from the background layer, which
    // spans the whole window: the other layers are placed in its pixels.
    let layout = null;
    // By Profile name, the image of the Avatar Frame it wears (null for
    // none), read with the Profiles: the carousel places its layers on
    // every frame of a glide, and other Profiles' data is read from file.
    let framePaths = new Map();
    // Whether the carousel's background was drawn for an Avatar Frame worn.
    let isMeasuredFramed = false;
    // By Profile name, each with the signature of what it was drawn with.
    const avatarLayers = new Map();
    const nameLayers = new Map();
    const pipLayers = new Map();
    // The Profiles to draw ahead, and whether the window must be measured
    // and the Profiles read again first.
    let aheadProfiles = [];
    let isAheadStale = true;
    // How far, in slots, the Avatars still sit from their places while they
    // glide (positive: to the right); 0 at rest.
    let glide = 0;
    let glideTimer = null;
    let glideLastMs = 0;
    // The pause before the greeting and its animation frames; null when idle.
    let greetingDelayTimer = null;
    let greetingTimer = null;
    // The Welcome Screen already greets the Profile by name, at startup and
    // after a switch: a second greeting right after it would be too much.
    const isWelcomeScreenOn = config.addOns.startupChoicePrompt !== false;
    let startupGreetingPending = !isWelcomeScreenOn;
    // A sound that cannot play is logged and never stops the greeting.
    const playGreetingSound = safeHandler(SCRIPT_NAME, () => {
        if (config.profileGreetingSoundFile) host.playSound(config.profileGreetingSoundFile);
    });

    function readProfiles() {
        const listed = profileStore.listProfiles();
        framePaths = new Map(listed.map(profile => [profile.name, profileRewards.wornImageOf(profile.name, FRAMED_AVATAR_SIDE)]));
        return listed;
    }

    const framePathOf = profile => framePaths.get(profile.name) || null;
    const isFramed = () => [...framePaths.values()].some(path => path !== null);
    const textShift = () => (isFramed() ? FRAMED_TEXT_SHIFT : 0);

    // Slot offsets drawn around the highlighted Avatar, farthest first, so
    // each Profile shows once and the nearer ones cover the farther ones.
    function neighbourOffsets(count) {
        const others = count - 1;
        const right = Math.min(SHOWN_SLOT_COUNT - 1, Math.ceil(others / 2));
        const left = Math.min(SHOWN_SLOT_COUNT - 1, Math.floor(others / 2));
        const offsets = [];
        for (let distance = SHOWN_SLOT_COUNT - 1; distance >= 1; distance--) {
            if (distance <= left) offsets.push(-distance);
            if (distance <= right) offsets.push(distance);
        }
        return offsets;
    }

    // The look of an Avatar at a fractional slot position, blended between
    // the two slots around it.
    function slotAt(position) {
        const look = isFramed() ? "framed" : "plain";
        const distance = Math.abs(position);
        const index = Math.min(SHOWN_SLOT_COUNT - 1, Math.floor(distance));
        const from = SLOTS[index];
        const to = SLOTS[index + 1];
        const ratio = Math.min(1, distance - index);
        const blend = (a, b) => a + (b - a) * ratio;
        return {
            size: blend(from.size, to.size),
            centerOffset: Math.sign(position) * blend(from.centerOffset[look], to.centerOffset[look]),
            opacity: 1 - blend(from.dim >>> 24, to.dim >>> 24) / 0xFF,
        };
    }

    // The places shown around the highlighted Avatar; while gliding, the
    // Avatar leaving past the last slot too, when it is not already shown
    // on the other side. The Avatars never overlap, so their order doesn't
    // matter.
    function shownOffsets(count) {
        const offsets = [...neighbourOffsets(count), 0];
        if (glide !== 0 && count > 2 * SHOWN_SLOT_COUNT - 1) offsets.push(-Math.sign(glide) * SHOWN_SLOT_COUNT);
        return offsets;
    }

    // The layer kept for key in layers, drawn again only when its signature
    // changed.
    function signedLayer(layers, key, zIndex, signature, width, height, draw) {
        let record = layers.get(key);
        if (!record) {
            record = { layer: hiddenLayer(zIndex), signature: null };
            layers.set(key, record);
        }
        if (record.signature !== signature) {
            record.layer.clear(COLORS.transparent);
            record.layer.draw(draw, width, height);
            record.signature = signature;
        }
        return record.layer;
    }

    const isDrawn = (layers, key, signature) => layers.has(key) && layers.get(key).signature === signature;
    const avatarSignature = profile => JSON.stringify([profile.avatarPath, framePathOf(profile)]);
    const avatarSideOf = profile => (framePathOf(profile) ? FRAMED_AVATAR_SIDE : AVATAR_SIDE);
    const isActive = profile => profile.name === profileStore.getActiveProfile().name;
    // The canvas spans the window's width.
    const nameSignature = profile => JSON.stringify([displayNameOf(profile), isActive(profile), layout.width, layout.height]);

    function avatarLayer(profile) {
        const framePath = framePathOf(profile);
        const side = avatarSideOf(profile);
        return signedLayer(avatarLayers, profile.name, AVATAR_Z_INDEX, avatarSignature(profile), side, side, dc => {
            if (!framePath) {
                dc.fillRect(0, 0, side, side, COLORS.neighbourFrame);
                dc.drawImage(profile.avatarPath, AVATAR_ART.plainFrame, AVATAR_ART.plainFrame, AVATAR_ART.image, AVATAR_ART.image);
                return;
            }
            const margin = AVATAR_ART.image * AVATAR_FRAME_MARGIN;
            dc.fillRect(margin, margin, AVATAR_ART.image, AVATAR_ART.image, COLORS.neighbourFrame);
            dc.drawImage(profile.avatarPath, margin, margin, AVATAR_ART.image, AVATAR_ART.image);
            drawAvatarFrame(dc, framePath, margin, margin, AVATAR_ART.image);
        });
    }

    // null when the Profile has no level to show.
    function pipLayer(profile) {
        const level = shownPlayerLevel.getOf(profile.name);
        if (level === null) return null;
        return signedLayer(pipLayers, profile.name, PIP_Z_INDEX, String(level), PIP_CANVAS.width, PIP_CANVAS.height, dc => {
            drawLevelPip(host, dc, level, PIP_CANVAS.width / 2, PIP_CANVAS.height / 2, PIP_ART.size);
        });
    }

    function nameLayer(profile) {
        return signedLayer(nameLayers, profile.name, TOP_Z_INDEX, nameSignature(profile), layout.width, NAME_LAYER_HEIGHT, dc => {
            drawShadowedText(host, dc, NAME, isActive(profile) ? COLORS.gold : COLORS.text, displayNameOf(profile), 0);
        });
    }

    function drawGoldFrame(goldFrame) {
        const { layer, side } = goldFrame;
        const band = AVATAR_ART.goldFrame;
        layer.clear(COLORS.transparent);
        layer.draw(dc => {
            dc.fillRect(0, 0, side, band, COLORS.gold);
            dc.fillRect(0, side - band, side, band, COLORS.gold);
            dc.fillRect(0, band, band, side - 2 * band, COLORS.gold);
            dc.fillRect(side - band, band, band, side - 2 * band, COLORS.gold);
        }, side, side);
        goldFrame.isDrawn = true;
    }

    // Centres a layer drawn around an Avatar's image on (x, y), in layout
    // pixels, the image size pixels wide.
    function placeAroundImage(layer, canvasSide, x, y, size, opacity) {
        const side = size * canvasSide / AVATAR_ART.image;
        layer.setScale({ ySpan: side / layout.height });
        layer.setPos(x / layout.width - 0.5, 0.5 - y / layout.height);
        layer.alpha = opacity;
    }

    function placeAvatar(profile, x, y, size, opacity, gold) {
        placeAroundImage(avatarLayer(profile), avatarSideOf(profile), x, y, size, opacity);
        placePip(profile, x, y, size, opacity);
        if (!gold) return;
        const shown = framePathOf(profile) ? goldFrames.framed : goldFrames.plain;
        const hidden = shown === goldFrames.framed ? goldFrames.plain : goldFrames.framed;
        if (hidden.layer.alpha !== 0) hidden.layer.alpha = 0;
        if (!shown.isDrawn) drawGoldFrame(shown);
        placeAroundImage(shown.layer, shown.side, x, y, size, opacity);
    }

    // On the Avatar's corner, scaled with it.
    function placePip(profile, x, y, size, opacity) {
        const layer = pipLayer(profile);
        if (!layer) return;
        const scale = size / AVATAR_ART.image;
        const offset = (PIP_ART.cx - AVATAR_SIDE / 2) * scale;
        layer.setScale({ ySpan: PIP_CANVAS.height * scale / layout.height });
        layer.setPos((x + offset) / layout.width - 0.5, 0.5 - (y + offset) / layout.height);
        layer.alpha = opacity;
    }

    const hideAll = records => {
        for (const { layer } of records.values()) {
            if (layer.alpha !== 0) layer.alpha = 0;
        }
    };

    function hideCarousel() {
        backLayer.alpha = 0;
        goldFrames.plain.layer.alpha = 0;
        goldFrames.framed.layer.alpha = 0;
        hideAll(avatarLayers);
        hideAll(nameLayers);
        hideAll(pipLayers);
    }

    // The highlighted name, once the Avatars are at rest.
    function placeName() {
        const current = glide === 0 ? profiles[highlighted] : null;
        for (const [name, { layer }] of nameLayers) {
            if ((!current || name !== current.name) && layer.alpha !== 0) layer.alpha = 0;
        }
        if (!current) return;
        const layer = nameLayer(current);
        const top = layout.height * ROW_HEIGHT_RATIO + NAME.top + textShift();
        layer.setScale({ ySpan: NAME_LAYER_HEIGHT / layout.height });
        layer.setPos(0, 0.5 - (top + NAME_LAYER_HEIGHT / 2) / layout.height);
        layer.alpha = 1;
    }

    // Runs on every frame of a glide: shows, moves and hides layers only.
    function placeCarousel() {
        const count = profiles.length;
        const centerY = layout.height * ROW_HEIGHT_RATIO;
        const shownProfiles = new Map(shownOffsets(count)
            .map(offset => [profiles[((highlighted + offset) % count + count) % count], offset]));
        const shownNames = new Set([...shownProfiles.keys()].map(profile => profile.name));
        for (const records of [avatarLayers, pipLayers]) {
            for (const [name, { layer }] of records) {
                if (!shownNames.has(name) && layer.alpha !== 0) layer.alpha = 0;
            }
        }
        for (const [profile, offset] of shownProfiles) {
            const slot = slotAt(offset + glide);
            placeAvatar(profile, layout.width / 2 + slot.centerOffset, centerY, slot.size, slot.opacity, offset === 0);
        }
        placeName();
    }

    // Draws the carousel's background, which also measures the window,
    // for the Profiles read last.
    function measure() {
        isMeasuredFramed = isFramed();
        backLayer.clear(COLORS.transparent);
        backLayer.draw(dc => {
            layout = dc.getSize();
            dc.fillRect(0, 0, layout.width, layout.height, COLORS.overlay);
            const centerY = layout.height * ROW_HEIGHT_RATIO;
            drawShadowedText(host, dc, TITLE, COLORS.text, TEXT.pickerTitle, centerY + TITLE.top);
            drawShadowedText(host, dc, HINT, COLORS.hint, TEXT.pickerHint, centerY + HINT.top + textShift());
        });
    }

    const isShowing = () => profiles !== null || greetingDelayTimer !== null || greetingTimer !== null;

    // One step of the drawing ahead, only while nothing is shown, so it
    // never makes the carousel or the greeting stutter: the Profiles are
    // read again and the background drawn (which measures the window), the
    // gold frames, then each Profile's Avatar and name.
    function drawAheadStep() {
        if (isShowing()) return false;
        if (isAheadStale) {
            aheadProfiles = readProfiles();
            measure();
            isAheadStale = false;
            return true;
        }
        for (const goldFrame of Object.values(goldFrames)) {
            if (!goldFrame.isDrawn) {
                drawGoldFrame(goldFrame);
                return true;
            }
        }
        for (const profile of aheadProfiles) {
            if (!isDrawn(avatarLayers, profile.name, avatarSignature(profile))) {
                avatarLayer(profile);
                return true;
            }
            if (!isDrawn(nameLayers, profile.name, nameSignature(profile))) {
                nameLayer(profile);
                return true;
            }
            const level = shownPlayerLevel.getOf(profile.name);
            if (level !== null && !isDrawn(pipLayers, profile.name, String(level))) {
                pipLayer(profile);
                return true;
            }
        }
        return false;
    }

    const wakeDrawingAhead = getDrawingAhead().add(drawAheadStep);

    // The window may have been resized, and Profiles or their Avatars
    // changed, since the last drawing ahead.
    function markAheadStale() {
        isAheadStale = true;
        wakeDrawingAhead();
    }

    // The worn Avatar Frame's image the badge was drawn with.
    let badgeFramePath = null;

    function drawBadge() {
        const profile = profileStore.getActiveProfile();
        const framePath = profileRewards.wornImageOf(profile.name, BADGE_FRAME_SIDE);
        badgeFramePath = framePath;
        badgeLayer.clear(COLORS.transparent);
        badgeLayer.draw(dc => {
            const { width, avatarSize, frame, top, nameGap, framedNameGap } = BADGE;
            const x = (width - avatarSize) / 2;
            if (!framePath) dc.fillRect(x - frame, top - frame, avatarSize + 2 * frame, avatarSize + 2 * frame, COLORS.gold);
            dc.drawImage(profile.avatarPath, x, top, avatarSize, avatarSize);
            drawAvatarFrame(dc, framePath, x, top, avatarSize);
            const level = shownPlayerLevel.get();
            if (level !== null) {
                const pip = levelPipOn(x - frame, top - frame, avatarSize + 2 * frame);
                drawLevelPip(host, dc, level, pip.cx, pip.cy, pip.size);
            }
            const nameTop = framePath ? top + avatarSize + avatarSize * AVATAR_FRAME_MARGIN + framedNameGap : top + avatarSize + nameGap;
            drawShadowedText(host, dc, BADGE_NAME, COLORS.text, displayNameOf(profile), nameTop);
        }, BADGE.width, BADGE.height);
    }

    // The greeting's background: overlay and greeting text, placed under
    // the Avatar at its grown size, or under its Avatar Frame.
    function drawGreetingBack(profile) {
        greetingLayer.clear(COLORS.transparent);
        greetingLayer.alpha = 1;
        greetingLayer.draw(dc => {
            layout = dc.getSize();
            dc.fillRect(0, 0, layout.width, layout.height, COLORS.overlay);
            const grownSide = framePathOf(profile) ? avatarFrameSide(GREETING.grownSize) : GREETING.grownSize;
            const textTop = layout.height * ROW_HEIGHT_RATIO + grownSide / 2 + GREETING_TEXT.gap;
            drawShadowedText(host, dc, GREETING_TEXT, COLORS.text, TEXT.greeting(displayNameOf(profile)), textTop);
        });
    }

    // Stops the pause or the greeting, and hides it with the carousel,
    // whose Avatar and gold frame it shares.
    function stopGreeting() {
        host.clearTimeout(greetingDelayTimer);
        greetingDelayTimer = null;
        host.clearInterval(greetingTimer);
        greetingTimer = null;
        greetingLayer.alpha = 0;
        hideCarousel();
        wakeDrawingAhead();
    }

    // The Avatar grows and everything fades by moving, scaling and fading
    // the layers: nothing is redrawn once the greeting has started.
    function greet(profile) {
        stopGreeting();
        // The worn frames may have changed since the Profiles were last read.
        readProfiles();
        const startSize = SLOTS[0].size;
        const { grownSize, growMs, holdMs, fadeMs } = GREETING;
        drawGreetingBack(profile);
        const centerX = layout.width / 2;
        const centerY = layout.height * ROW_HEIGHT_RATIO;
        placeAvatar(profile, centerX, centerY, startSize, 1, true);
        // Timed on the clock: Windows timers fire late, so counting frames
        // would stretch the greeting.
        const startMs = host.now().getTime();
        greetingTimer = host.setInterval(safeHandler(SCRIPT_NAME, () => {
            const elapsed = host.now().getTime() - startMs;
            if (elapsed >= growMs + holdMs + fadeMs) {
                stopGreeting();
                return;
            }
            const size = startSize + (grownSize - startSize) * Math.min(1, elapsed / growMs);
            const opacity = 1 - Math.max(0, elapsed - growMs - holdMs) / fadeMs;
            placeAvatar(profile, centerX, centerY, size, opacity, true);
            greetingLayer.alpha = opacity;
        }), FRAME_MS);
        playGreetingSound();
    }

    const isWheelFree = () => host.getUIMode() === "wheel" && getWheelDialogs().isIdle();

    // Greets the active Profile after a pause: right on the press or on the
    // wheel's first frame, it felt abrupt. Whatever is drawn stays still
    // meanwhile. A menu or dialog that opened during the pause cancels it;
    // at startup the greeting then waits for the next free wheel.
    function greetAfterPause({ atStartup = false } = {}) {
        startupGreetingPending = false;
        greetingDelayTimer = host.setTimeout(safeHandler(SCRIPT_NAME, () => {
            greetingDelayTimer = null;
            if (isWheelFree()) {
                greet(profileStore.getActiveProfile());
                return;
            }
            stopGreeting();
            if (atStartup) startupGreetingPending = true;
        }), GREETING.delayMs);
    }

    // Greets the restored Profile once the wheel is free: no menu, no
    // dialog on screen or waiting, and no carousel.
    function greetAtStartupIfFree() {
        if (!startupGreetingPending || profiles || greetingDelayTimer !== null) return;
        if (isWheelFree()) greetAfterPause({ atStartup: true });
    }

    function stopGlide() {
        host.clearInterval(glideTimer);
        glideTimer = null;
        glide = 0;
    }

    // Runs every frame while the Avatars glide; timed on the clock, like the
    // greeting.
    function glideStep() {
        const nowMs = host.now().getTime();
        glide *= Math.exp(-(nowMs - glideLastMs) / GLIDE_TIME_CONSTANT_MS);
        glideLastMs = nowMs;
        // Arrived: placeCarousel() shows the name.
        if (Math.abs(glide) < GLIDE_SNAP) stopGlide();
        placeCarousel();
    }

    // direction: 1 for Next, -1 for Prev. A press during a glide carries on
    // from where the Avatars are.
    function move(direction) {
        navigationSound.play();
        highlighted = (highlighted + direction + profiles.length) % profiles.length;
        glide += direction;
        if (glideTimer === null) {
            glideLastMs = host.now().getTime();
            glideTimer = host.setInterval(safeHandler(SCRIPT_NAME, glideStep), FRAME_MS);
        }
        placeCarousel();
    }

    function open() {
        stopGreeting();
        // The player is already choosing: greeting them afterwards would
        // come out of nowhere.
        startupGreetingPending = false;
        // A native menu left open would stay stuck behind the carousel.
        if (host.getUIMode() === "menu") host.doCommand(host.getBuiltInCommand("MenuReturn"));
        profiles = readProfiles();
        const activeName = profileStore.getActiveProfile().name;
        highlighted = Math.max(0, profiles.findIndex(profile => profile.name === activeName));
        if (!layout || isMeasuredFramed !== isFramed()) measure();
        // Here rather than on the first move, which it would slow down.
        navigationSound.load();
        backLayer.alpha = 1;
        placeCarousel();
    }

    function close() {
        stopGlide();
        profiles = null;
        stopGreeting();
        markAheadStale();
    }

    getMainMenu().add({ name: "profilePicker", label: TEXT.menuEntry, position: MAIN_MENU_POSITION.PROFILE_PICKER, action: open });

    // The main menu module only serves the main menu: the exit menu entry
    // has its own command.
    const exitMenuCommand = host.allocateCommand("profilePickerExitMenu");

    // Fires when any menu opens, with a fresh item list each time.
    host.on("menuopen", safeHandler(SCRIPT_NAME, ev => {
        if (ev.id !== "exit") return;
        ev.addMenuItem({ after: host.getBuiltInCommand("Quit") }, { title: TEXT.menuEntry, cmd: exitMenuCommand });
    }));

    // Fires on every command.
    host.on("command", safeHandler(SCRIPT_NAME, ev => {
        if (ev.id === exitMenuCommand) open();
    }));

    // Fires on every mapped button press; drives the carousel while it is open.
    host.on("commandbuttondown", safeHandler(SCRIPT_NAME, ev => {
        // A press already handled may be the one that opened it, from a Drawn Menu.
        if (!profiles || ev.defaultPrevented) return;
        // Swallowed first, so a failing switch still never reaches the wheel.
        ev.preventDefault();
        if (ev.command === "Next" || ev.command === "Prev") {
            move(ev.command === "Next" ? 1 : -1);
        } else if (ev.command === "Select" || ev.command === "Launch") {
            const chosen = profiles[highlighted];
            if (isWelcomeScreenOn) {
                // The Welcome Screen welcomes a new Profile itself, on the
                // switch; a Profile kept is welcomed by nothing.
                close();
                if (chosen.name !== profileStore.getActiveProfile().name) profileStore.switchTo(chosen.name);
            } else {
                // The carousel stays drawn, at rest, until the greeting replaces it.
                stopGlide();
                placeCarousel();
                profiles = null;
                profileStore.switchTo(chosen.name);
                greetAfterPause();
            }
        } else if (ev.command === "Exit") {
            close();
        }
    }));

    // Fires on every switch: the names' colours change.
    profileStore.onSwitch(safeHandler(SCRIPT_NAME, () => {
        drawBadge();
        markAheadStale();
    }));
    // Fires when the active Profile's shown level changes: a Level Toast
    // starting, a Profile Reset, the baseline after a switch.
    shownPlayerLevel.onChange(safeHandler(SCRIPT_NAME, drawBadge));
    // Fires after any saved change of a Profile's data: an Avatar Frame
    // chosen, or taken back by a Profile Reset, is drawn again (ahead for
    // the carousel). Every Play saves too, so only a change of frame redraws.
    profileStore.onUpdate(safeHandler(SCRIPT_NAME, profileName => {
        if (profileName === profileStore.getActiveProfile().name
            && profileRewards.wornImageOf(profileName, BADGE_FRAME_SIDE) !== badgeFramePath) drawBadge();
        if (framePaths.has(profileName)
            && profileRewards.wornImageOf(profileName, FRAMED_AVATAR_SIDE) !== framePaths.get(profileName)) markAheadStale();
    }));

    // The badge and the greeting must never cover a game; a player who
    // started one from the Welcome Screen was greeted by it already.
    host.on("gamestarted", safeHandler(SCRIPT_NAME, () => {
        badgeLayer.alpha = 0;
        startupGreetingPending = false;
        stopGreeting();
    }));
    // Fires back on the wheel, after a game, a menu or a dialog.
    host.on("wheelmode", safeHandler(SCRIPT_NAME, () => {
        badgeLayer.alpha = 1;
        greetAtStartupIfFree();
    }));

    // Fires when the cabinet sits idle: the player left without picking, so
    // the carousel must not stay drawn over attract mode or keep the buttons.
    host.on("attractmodestart", safeHandler(SCRIPT_NAME, close));

    // Last, so the Welcome Screen never opens a carousel whose listeners are missing.
    registerChangePlayer(open);
    drawBadge();
    // One tick after the inits, so the dialogs every Add-on submits at
    // startup are already waiting, whatever the order in main.js.
    host.setTimeout(safeHandler(SCRIPT_NAME, greetAtStartupIfFree), 0);
}
