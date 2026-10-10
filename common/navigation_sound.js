// ============================================================
// Navigation sound: PinballY's own Next.wav, played on each move through a
// drawn list or carousel (Achievement List, Profile picker, Drawn Menu),
// and PinballY's other button sounds (Select.wav, Deselect.wav) through
// createButtonSound(). load() reads it once, ahead of the first press,
// which it would slow down; a missing or unplayable file is logged once
// and then stays silent, never stopping the navigation.
// ============================================================

// Relative to PinballY's program folder.
const BUTTON_SOUNDS_FOLDER = "Assets\\Button Sounds";
// Enough for a held button: a player is still playing when asked again.
const NAVIGATION_SOUND_PLAYERS = 3;

export const createNavigationSound = (host, scriptName) => createButtonSound(host, scriptName, "Next", NAVIGATION_SOUND_PLAYERS);

// soundName: the file name in PinballY's button sounds, without ".wav";
// playerCount: 1 for a sound never played twice in quick succession.
export function createButtonSound(host, scriptName, soundName, playerCount) {
    // Null until loaded; false once it failed, so it is logged only once.
    let rotation = null;

    function disable(error) {
        rotation = false;
        host.log(`[${scriptName}] ${soundName} sound disabled: ${error.message}`);
    }

    return {
        // True once load() ran, whether the sound plays or was disabled.
        isLoaded: () => rotation !== null,
        load() {
            if (rotation !== null) return;
            try {
                const filePath = `${host.getProgramFolder().replace(/\\+$/, "")}\\${BUTTON_SOUNDS_FOLDER}\\${soundName}.wav`;
                rotation = host.createSoundRotation(filePath, playerCount);
            } catch (error) {
                disable(error);
            }
        },
        play() {
            if (!rotation) return;
            try {
                rotation.play();
            } catch (error) {
                disable(error);
            }
        },
    };
}
