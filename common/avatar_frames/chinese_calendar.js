// ============================================================
// The day of Chinese New Year in a Gregorian year, from Meeus's
// approximate formulas (chapters 25 and 49): new moons with their main
// periodic corrections and the Sun's apparent longitude, on China's days.
// Pure computation, no PinballY API.
// - Terrestrial Time stands for UTC: a day off only for a new moon within about a minute of midnight.
// ============================================================

const RADIANS = Math.PI / 180;
const sinDegrees = degrees => Math.sin(degrees * RADIANS);
const LUNATION = 29.530588861;
const JANUARY = 0;
const DECEMBER = 11;
// China is at UTC+8; a Julian Day starts at noon.
const CHINA_DAY_SHIFT = 0.5 + 8 / 24;
const chinaDayOf = julianDay => Math.floor(julianDay + CHINA_DAY_SHIFT);
// The Julian Day at which that China day starts.
const chinaDayStartOf = chinaDay => chinaDay - CHINA_DAY_SHIFT;
// The Julian Day Number of a date (month 0 to 11), counted as chinaDayOf counts days.
const dayNumberOf = (year, month, day) => Date.UTC(year, month, day) / 86400000 + 2440588;

// The new moon of lunation k (0 in January 2000), as a Julian Ephemeris
// Day, with its main periodic corrections.
function newMoonOf(k) {
    const t = k / 1236.85;
    const e = 1 - 0.002516 * t - 0.0000074 * t * t;
    const sun = 2.5534 + 29.1053567 * k - 0.0000014 * t * t;
    const moon = 201.5643 + 385.81693528 * k + 0.0107582 * t * t + 0.00001238 * t * t * t;
    const latitude = 160.7108 + 390.67050284 * k - 0.0016118 * t * t;
    const node = 124.7746 - 1.56375588 * k + 0.0020672 * t * t;
    return 2451550.09766 + LUNATION * k + 0.00015437 * t * t
        - 0.4072 * sinDegrees(moon) + 0.17241 * e * sinDegrees(sun) + 0.01608 * sinDegrees(2 * moon)
        + 0.01039 * sinDegrees(2 * latitude) + 0.00739 * e * sinDegrees(moon - sun) - 0.00514 * e * sinDegrees(moon + sun)
        + 0.00208 * e * e * sinDegrees(2 * sun) - 0.00111 * sinDegrees(moon - 2 * latitude) - 0.00057 * sinDegrees(moon + 2 * latitude)
        - 0.00017 * sinDegrees(node);
}
const newMoonDayOf = k => chinaDayOf(newMoonOf(k));

// The Sun's apparent longitude in degrees, 0 to 360, at a Julian Day.
function sunLongitudeAt(julianDay) {
    const t = (julianDay - 2451545) / 36525;
    const anomaly = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
    const center = (1.914602 - 0.004817 * t) * sinDegrees(anomaly) + (0.019993 - 0.000101 * t) * sinDegrees(2 * anomaly)
        + 0.000289 * sinDegrees(3 * anomaly);
    const longitude = 280.46646 + 36000.76983 * t + 0.0003032 * t * t + center - 0.00569 - 0.00478 * sinDegrees(125.04 - 1934.136 * t);
    return ((longitude % 360) + 360) % 360;
}

// The China day of the December solstice, the Sun at 270 degrees.
function decemberSolsticeDayOf(year) {
    let julianDay = dayNumberOf(year, DECEMBER, 21) - 0.5;
    for (let step = 0; step < 3; step++) julianDay += 58 * sinDegrees(270 - sunLongitudeAt(julianDay));
    return chinaDayOf(julianDay);
}

// The lunation starting the eleventh month, the one holding that solstice day.
function eleventhMonthOf(solsticeDay) {
    let k = Math.floor((solsticeDay - 2451550) / LUNATION);
    while (newMoonDayOf(k + 1) <= solsticeDay) k++;
    while (newMoonDayOf(k) > solsticeDay) k--;
    return k;
}

// Whether the month of lunation k holds a principal term: the Sun crossing
// a multiple of 30 degrees between the starts of its first and next month's China days.
const holdsPrincipalTerm = k => Math.floor(sunLongitudeAt(chinaDayStartOf(newMoonDayOf(k))) / 30)
    !== Math.floor(sunLongitudeAt(chinaDayStartOf(newMoonDayOf(k + 1))) / 30);

// Each year's day, computed once: every Play of the Play Log asks again.
const newYearDays = new Map();

// Chinese New Year, a Date at local midnight: the second new moon after the
// December solstice, or the third when a year of 13 months puts its leap
// month (the first without a principal term) before it, as in 2034.
export function chineseNewYear(year) {
    if (!newYearDays.has(year)) {
        const eleventh = eleventhMonthOf(decemberSolsticeDayOf(year - 1));
        const isLeapYear = eleventhMonthOf(decemberSolsticeDayOf(year)) - eleventh === 13;
        const hasLeapMonthFirst = isLeapYear && (!holdsPrincipalTerm(eleventh + 1) || !holdsPrincipalTerm(eleventh + 2));
        newYearDays.set(year, newMoonDayOf(eleventh + (hasLeapMonthFirst ? 3 : 2)) - dayNumberOf(year, JANUARY, 1));
    }
    return new Date(year, JANUARY, 1 + newYearDays.get(year));
}
