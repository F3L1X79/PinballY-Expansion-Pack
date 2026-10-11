// ============================================================
// Challenges: wires the shared Challenge module (the week's draw,
// locked in cabinet.json, and each Profile's counted games in its
// profile.json) to the Challenge Card (under the Profile badge, or in the
// top right corner when the Profile picker is off and there is no badge)
// and to the Challenge Tables entry of the main menu. At startup the
// week's Challenge is drawn if needed and the card drawn; the card follows
// Profile switches, hides on "gamestarted" and comes back on "wheelmode".
// ============================================================

import { createPinballYHost } from "../common/core/pinbally_host.js";
import { getProfileStore } from "../common/profiles/profile_store.js";
import { getChallenges } from "../common/challenges/challenge.js";
import { createChallengeCard } from "../common/challenges/challenge_card.js";
import { createChallengeTables } from "../common/challenges/challenge_tables.js";
import config from "../common/core/config.js";

export default function init() {
    const host = createPinballYHost();
    const underBadge = config.addOns.profilePicker !== false;
    createChallengeCard(host, getChallenges(), getProfileStore(), { underBadge });
    createChallengeTables(host, getChallenges());
}
