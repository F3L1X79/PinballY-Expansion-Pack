// ============================================================
// Adds an "Original Tables" filter to PinballY's native "Filter by
// Manufacturer" menu, selecting every table EXCEPT the community-made
// VPX tables (identified by config.communityTablesManufacturer).
// Registered once at init; no event listeners.
// ============================================================

import lang from "../common/core/i18n.js";
import config from "../common/core/config.js";

export default function init() {
    const COMMUNITY_MANUFACTURER_NAME = config.communityTablesManufacturer;
    const { originalTablesFilter: FILTER_TITLE } = lang.customMenuLabels;

    gameList.createFilter({
        id: "project.OriginalTables",
        title: FILTER_TITLE,
        group: "[Manuf]",
        select: game => game.manufacturer !== COMMUNITY_MANUFACTURER_NAME,
    });
}